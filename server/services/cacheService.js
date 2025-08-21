const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });
  }

  // Set cache with expiration
  async set(key, value, expiration = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, expiration, serializedValue);
      console.log(`💾 Cached: ${key}`);
    } catch (error) {
      console.error('❌ Cache set error:', error);
    }
  }

  // Get cache value
  async get(key) {
    try {
      const value = await this.redis.get(key);
      if (value) {
        console.log(`📖 Cache hit: ${key}`);
        return JSON.parse(value);
      }
      console.log(`❌ Cache miss: ${key}`);
      return null;
    } catch (error) {
      console.error('❌ Cache get error:', error);
      return null;
    }
  }

  // Delete cache key
  async del(key) {
    try {
      await this.redis.del(key);
      console.log(`🗑️ Cache deleted: ${key}`);
    } catch (error) {
      console.error('❌ Cache delete error:', error);
    }
  }

  // Clear all cache
  async clear() {
    try {
      await this.redis.flushall();
      console.log('🗑️ All cache cleared');
    } catch (error) {
      console.error('❌ Cache clear error:', error);
    }
  }

  // Cache document content
  async cacheDocument(documentId, content) {
    const key = `document:${documentId}`;
    await this.set(key, content, 1800); // 30 minutes
  }

  // Get cached document
  async getCachedDocument(documentId) {
    const key = `document:${documentId}`;
    return await this.get(key);
  }

  // Cache user session
  async cacheUserSession(userId, sessionData) {
    const key = `session:${userId}`;
    await this.set(key, sessionData, 7200); // 2 hours
  }

  // Get cached user session
  async getCachedUserSession(userId) {
    const key = `session:${userId}`;
    return await this.get(key);
  }

  // Cache active users for document
  async cacheActiveUsers(documentId, users) {
    const key = `active_users:${documentId}`;
    await this.set(key, users, 300); // 5 minutes
  }

  // Get cached active users
  async getCachedActiveUsers(documentId) {
    const key = `active_users:${documentId}`;
    return await this.get(key);
  }

  // Cache chat history
  async cacheChatHistory(documentId, messages) {
    const key = `chat:${documentId}`;
    await this.set(key, messages, 3600); // 1 hour
  }

  // Get cached chat history
  async getCachedChatHistory(documentId) {
    const key = `chat:${documentId}`;
    return await this.get(key);
  }

  // Rate limiting with Redis
  async checkRateLimit(identifier, limit, window) {
    const key = `rate_limit:${identifier}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    return current <= limit;
  }

  // Get rate limit info
  async getRateLimitInfo(identifier) {
    const key = `rate_limit:${identifier}`;
    const current = await this.redis.get(key);
    const ttl = await this.redis.ttl(key);
    
    return {
      current: parseInt(current) || 0,
      ttl: ttl > 0 ? ttl : 0
    };
  }
}

module.exports = new CacheService();
