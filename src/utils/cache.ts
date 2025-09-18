import { DEFAULT_REDIS_EXPIRATION, redisClient } from "../db/redis";

export async function cache(key: string, cb: () => Promise<any>, exp?: number) {
  const cacheData = await redisClient.get(key);
  if (cacheData !== null) {
    return JSON.parse(cacheData);
  } else {
    const freshData = await cb();
    if (freshData === undefined) return null;

    await redisClient.SETEX(
      key,
      exp ?? DEFAULT_REDIS_EXPIRATION,
      JSON.stringify(freshData)
    );
    return freshData;
  }
}
