import { createClient } from "redis";

const { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env;

if (!REDIS_USERNAME || !REDIS_PASSWORD || !REDIS_HOST || !REDIS_PORT)
  throw new Error("Missing redis credentials");

export const redisConnection = {
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
  },
};

const redisClient = createClient(redisConnection);

const DEFAULT_REDIS_EXPIRATION = 3600; // 1 housr

export { redisClient, DEFAULT_REDIS_EXPIRATION };
