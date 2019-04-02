import * as mem from 'mem';
import { RedisConnector, getRedis } from '../utils/redis';
import { asRedisKey } from './key';

export class TopicRepo {
  constructor(private readonly redis: RedisConnector = getRedis()) {}

  public getTopicMembers = async (topic: string) =>
    this.redis.getMembersFrom(asRedisKey.topic(topic));

  public deleteTopic = async (topic: string) =>
    this.redis.delete(asRedisKey.topic(topic));

  public subscribeTopic = async (user: string, topic: string) =>
    Promise.all([
      this.redis.addMemberTo(asRedisKey.userTopic(user), topic),
      this.redis.addMemberTo(asRedisKey.topic(topic), user),
    ]);

  public unsubscribeTopic = async (user: string, topic: string) =>
    Promise.all([
      this.redis.removeMemberFrom(asRedisKey.userTopic(user), topic),
      this.redis.removeMemberFrom(asRedisKey.topic(topic), user),
    ]);

  public getUserSubscribedTopics = async (user: string) =>
    this.redis.getMembersFrom(asRedisKey.userTopic(user));
}

export const getTopicRepo = mem(() => new TopicRepo());
