import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger.js';

let _redisClient: RedisClientType | null = null;
let _redisUrl: string | null = null;

export function initializeRedis(redisUrl: string): void {
  _redisUrl = redisUrl;
}

export async function getRedisClient(): Promise<RedisClientType> {
  if (_redisUrl === null) {
    throw new Error('Redis not initialized. Call initializeRedis() first.');
  }
  if (_redisClient === null) {
    _redisClient = createClient({ url: _redisUrl });
    _redisClient.on('error', (err) => logger.error({ err }, 'Redis Client Error'));
    await _redisClient.connect();
  }
  return _redisClient;
}

export async function closeRedisConnection(): Promise<void> {
  if (_redisClient) {
    await _redisClient.disconnect();
    _redisClient = null;
  }
}
