import { redisConnection } from "../db/redis";

export const bullConnection = {
  username: redisConnection.username,
  password: redisConnection.password,
  host: redisConnection.socket.host,
  port: redisConnection.socket.port,
};
