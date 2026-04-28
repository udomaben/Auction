// backend/src/config/redis.js
const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

let redisClient = null;
let redisEnabled = false;

// Only connect if Redis is configured
if (process.env.REDIS_HOST && process.env.REDIS_HOST !== '') {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
      redisEnabled = true;
    });
    
    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis error (running without cache):', err.message);
      redisEnabled = false;
    });
  } catch (error) {
    console.warn('⚠️ Redis not available, running without cache');
  }
} else {
  console.log('ℹ️ Redis not configured, running without cache');
}

// Cache helper functions that gracefully handle disabled Redis
const cacheGet = async (key) => {
  if (!redisEnabled || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 3600) => {
  if (!redisEnabled || !redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    // Silently fail
  }
};

const cacheDel = async (key) => {
  if (!redisEnabled || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    // Silently fail
  }
};

const cacheClearPattern = async (pattern) => {
  if (!redisEnabled || !redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    // Silently fail
  }
};

module.exports = {
  redisClient,
  redisEnabled,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheClearPattern,
};