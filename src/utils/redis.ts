import * as Redis from 'redis';
import * as mem from 'mem';
import { printPromiseRethrowError } from './inspect';

const awaitable = <R>(
  work: (callback: (error?: Error | null, result?: R) => void) => any,
) =>
  printPromiseRethrowError(`Redis`, `awaitable`)(
    new Promise<R>((resolve, reject) =>
      work((error, result) => (error ? reject(error) : resolve(result))),
    ),
  );

export class RedisConnector {
  constructor(
    private readonly client: Redis.RedisClient = Redis.createClient({
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
    }),
  ) {}

  public getMembersFrom = async (key: string) =>
    awaitable<string[]>(cb => this.client.smembers(key, cb));

  public addMemberTo = async (key: string, value: string) =>
    awaitable<number>(cb => this.client.sadd(key, value, cb));

  public removeMemberFrom = async (key: string, value: string) =>
    awaitable<number>(cb => this.client.srem(key, value, cb));

  public setWithExpire = async (key: string, value: string, ttl: number) => {
    const set = await awaitable<'OK'>(cb => this.client.set(key, value, cb));
    const expire = await awaitable<number>(cb =>
      this.client.expire(key, ttl, cb),
    );
    return { set, expire };
  };

  public get = async (key: string) =>
    awaitable<string>(cb => this.client.get(key, cb));

  public delete = async (...key: string[]) =>
    awaitable<number>(cb => this.client.del(...key.filter(Boolean), cb));
}

export const getRedis = mem(() => new RedisConnector());
