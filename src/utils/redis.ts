import * as Redis from 'redis';
import { inspect, inspectError } from './inspect';

const awaitable = <R>(
  work: (callback: (error?: Error | null, result?: R) => void) => any,
) =>
  new Promise<R>((resolve, reject) =>
    work((error, result) => (error ? reject(error) : resolve(result))),
  )
    .then(inspect(`Redis`, `awaitable`))
    .catch(inspectError(`Redis`, `awaitable`));

const asRedisKey = {
  userConnection: (id: string) => `__user_conn__${id}`,
  connectionUser: (id: string) => `__conn_user__${id}`,
  userTopic: (topic: string) => `__user_topic__${topic}`,
  topic: (topic: string) => `__topic__${topic},`,
};

class RedisProxy {
  constructor(
    private readonly client: Redis.RedisClient = Redis.createClient({
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
    }),
  ) {}

  public redisGetMembersFrom = async (key: string) =>
    awaitable<string[]>(cb => this.client.smembers(key, cb));
  public redisAddMemberTo = async (key: string, value: string) =>
    awaitable<number>(cb => this.client.sadd(key, value, cb));
  public redisRemoveMemberFrom = async (key: string, value: string) =>
    awaitable<number>(cb => this.client.srem(key, value, cb));

  public redisSetWithExpire = async (
    key: string,
    value: string,
    ttl: number,
  ) => {
    const set = await awaitable<'OK'>(cb => this.client.set(key, value, cb));
    const expire = await awaitable<number>(cb =>
      this.client.expire(key, ttl, cb),
    );
    return { set, expire };
  };
  public redisGet = async (key: string) =>
    awaitable<string>(cb => this.client.get(key, cb));
  public redisDelete = async (...key: string[]) =>
    awaitable<number>(cb => this.client.del(...key.filter(Boolean), cb));

  public getTopicMembers = async (topic: string) =>
    this.redisGetMembersFrom(asRedisKey.topic(topic));
  public deleteTopic = async (topic: string) =>
    this.redisDelete(asRedisKey.topic(topic));

  public subscribeTopic = async (user: string, topic: string) =>
    Promise.all([
      this.redisAddMemberTo(asRedisKey.userTopic(user), topic),
      this.redisAddMemberTo(asRedisKey.topic(topic), user),
    ]);
  public unsubscribeTopic = async (user: string, topic: string) =>
    Promise.all([
      this.redisRemoveMemberFrom(asRedisKey.userTopic(user), topic),
      this.redisRemoveMemberFrom(asRedisKey.topic(topic), user),
    ]);

  public getUserSubscribedTopics = async (user: string) =>
    this.redisGetMembersFrom(asRedisKey.userTopic(user));
  public userHello = async (user: string, connectionId: string) =>
    Promise.all([
      await this.redisSetWithExpire(
        asRedisKey.userConnection(user),
        connectionId,
        60 * 60,
      ),
      await this.redisSetWithExpire(
        asRedisKey.connectionUser(connectionId),
        user,
        60 * 60,
      ),
    ]);
  public userBye = async (user: string, connectionId: string) =>
    Promise.all<any>([
      ...(await this.getUserSubscribedTopics(user)).map(topic =>
        this.unsubscribeTopic(user, topic),
      ),
      this.redisDelete(
        asRedisKey.userTopic(user),
        asRedisKey.userConnection(user),
        connectionId ? asRedisKey.connectionUser(connectionId) : undefined,
      ),
    ]);
  public getConnectionIdFromUser = async (user: string) =>
    this.redisGet(asRedisKey.userConnection(user));
  public getUserFromConnectionId = async (connectionId: string) =>
    this.redisGet(asRedisKey.connectionUser(connectionId));

  public kickUser = async (user: string) =>
    this.getConnectionIdFromUser(user)
      .then(connectionId => this.userBye(user, connectionId))
      .catch(error => {
        console.log(`KickUser`, user, error);
        return this.userBye(user, undefined);
      });
}

const redis = new RedisProxy();
export default redis;
