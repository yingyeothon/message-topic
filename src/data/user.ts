import * as mem from 'mem';
import pLimit from 'p-limit';
import { RedisConnector, getRedis } from '../utils/redis';
import { TopicRepo, getTopicRepo } from './topic';
import { asRedisKey } from './key';

export class UserRepo {
  constructor(
    private readonly redis: RedisConnector = getRedis(),
    private readonly topicRepo: TopicRepo = getTopicRepo(),
  ) {}

  public userHello = async (user: string, connectionId: string) =>
    Promise.all([
      await this.redis.setWithExpire(
        asRedisKey.userConnection(user),
        connectionId,
        60 * 60,
      ),
      await this.redis.setWithExpire(
        asRedisKey.connectionUser(connectionId),
        user,
        60 * 60,
      ),
    ]);

  public userBye = async (user: string, connectionId: string) => {
    const limit = pLimit(4);
    const topics: string[] = [];
    try {
      const topicsFromRedis = await this.topicRepo.getUserSubscribedTopics(
        user,
      );
      Array.prototype.push.apply(topics, topicsFromRedis);
    } catch (error) {
      console.error(`Bye`, `CannotGetTopic`, user, connectionId, error);
    }
    return Promise.all<any>([
      ...topics.map(topic =>
        limit(() => this.topicRepo.unsubscribeTopic(user, topic)),
      ),
      this.redis.delete(
        asRedisKey.userTopic(user),
        asRedisKey.userConnection(user),
        connectionId ? asRedisKey.connectionUser(connectionId) : undefined,
      ),
    ]);
  };

  public getConnectionIdFromUser = async (user: string) =>
    this.redis.get(asRedisKey.userConnection(user));

  public getUserFromConnectionId = async (connectionId: string) =>
    this.redis.get(asRedisKey.connectionUser(connectionId));

  public kickUser = async (user: string) =>
    this.getConnectionIdFromUser(user)
      .then(connectionId => this.userBye(user, connectionId))
      .catch(error => {
        console.log(`KickUser`, user, error);
        return this.userBye(user, undefined);
      });

  public kickUsers = async (users: string[]) => {
    if (!users || users.length === 0) {
      return;
    }
    try {
      console.log(`KickUsers`, users);
      const limit = pLimit(4);
      const kick = await Promise.all(
        users.map(user => limit(() => getUserRepo().kickUser(user))),
      );
      console.log(`KickUsers`, kick);
    } catch (error) {
      console.error(`KickUsers`, `error`, error);
    }
  };
}

export const getUserRepo = mem(() => new UserRepo());
