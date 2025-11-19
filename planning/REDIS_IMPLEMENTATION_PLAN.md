# Redis Implementation Plan: Counter-Based Short Codes & Caching

## Overview

This plan outlines the implementation of Redis-based counter for generating unique short codes using hashids, and Redis caching for URL lookups to improve performance.

## Goals

1. **Replace random number generation** with Redis INCR counter starting at 10000
2. **Use hashids** to encode the counter value (min 4, max 8 characters)
3. **Implement Redis caching** for URL lookups to reduce MongoDB queries
4. **Maintain backward compatibility** with existing short codes in MongoDB

## Architecture Changes

### Current Flow
```
POST /api/shorten
  → Generate random number (1000-99999999)
  → Hash with hashids
  → Check MongoDB for duplicates
  → Retry if duplicate (max 10 attempts)
  → Save to MongoDB
```

### New Flow
```
POST /api/shorten
  → Check Redis cache for existing long_url
  → If cached, return cached result
  → Check MongoDB for existing long_url
  → If exists, cache and return
  → Get next counter from Redis INCR (starts at 10000)
  → Hash counter with hashids (min 4, max 8 chars)
  → Save to MongoDB
  → Cache in Redis
  → Return short URL

GET /<short_code>
  → Check Redis cache for short_code
  → If cached, redirect to long_url
  → Query MongoDB
  → Cache in Redis
  → Redirect to long_url
```

## Implementation Steps

### Step 1: Update Dependencies

**File: `requirements.txt`**
- ✅ Redis is already installed (`redis==5.0.1`)

### Step 2: Update Environment Variables

**File: `env.example`**
Add new environment variables:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
REDIS_COUNTER_KEY=url_shortener:counter
REDIS_COUNTER_INITIAL_VALUE=10000
REDIS_CACHE_TTL=3600
```

**File: `app.py`**
- Load Redis configuration from environment variables
- Add Redis connection initialization
- Add Redis connection error handling

### Step 3: Redis Connection Setup

**Implementation:**
- Create Redis client connection
- Initialize counter if it doesn't exist (set to 10000)
- Add connection health check
- Implement connection retry logic

**Key Functions:**
```python
def init_redis_connection()
def get_redis_client()
def init_counter()
def check_redis_health()
```

### Step 4: Update Short Code Generation

**Replace `generate_short_code()` function:**

**Old Logic:**
- Generate random number
- Hash with hashids
- Truncate to 8 chars

**New Logic:**
- Get counter from Redis INCR
- Hash counter value with hashids
- Configure hashids with min_length=4, max_length=8
- Return hashed code

**Key Changes:**
- Use `redis.incr(REDIS_COUNTER_KEY)` to get next counter
- Initialize counter to 10000 on first run
- Remove random number generation
- Remove retry logic (no collisions possible with counter)
- Update hashids configuration to ensure 4-8 character length

### Step 5: Implement Redis Caching

**Cache Keys:**
- `url_shortener:url:{short_code}` → stores long_url
- `url_shortener:reverse:{long_url_hash}` → stores short_code (for duplicate detection)

**Cache Strategy:**
1. **On URL Creation:**
   - Cache short_code → long_url mapping
   - Cache long_url → short_code mapping (for duplicate detection)
   - Set TTL (default: 3600 seconds / 1 hour)

2. **On URL Lookup:**
   - Check cache first before MongoDB query
   - If cache hit, return immediately
   - If cache miss, query MongoDB and cache result

**Key Functions:**
```python
def get_cached_url(short_code)
def set_cached_url(short_code, long_url, ttl)
def get_cached_short_code(long_url)
def set_cached_short_code(long_url, short_code, ttl)
```

### Step 6: Update API Endpoints

**`POST /api/shorten`:**
1. Check Redis cache for existing long_url → return if found
2. Check MongoDB for existing long_url → return if found, cache it
3. Get next counter from Redis
4. Generate short_code from counter using hashids
5. Save to MongoDB (no retry needed - counter is unique)
6. Cache both mappings in Redis
7. Return response

**`GET /<short_code>`:**
1. Check Redis cache for short_code
2. If cache hit, redirect immediately
3. If cache miss, query MongoDB
4. Cache result in Redis
5. Redirect to long_url

### Step 7: Update Health Checks

**Add Redis health check:**
- Update `/health` endpoint to include Redis status
- Add `/redis/health` endpoint for Redis-specific health check

### Step 8: Hashids Configuration

**Configure hashids for 4-8 character length:**
```python
hashids = Hashids(
    salt=HASH_ID_SALT,
    alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    min_length=4
)
```

**Note:** Hashids will generate codes of varying lengths based on the input number. Starting at 10000 ensures:
- 10000-99999 → typically 4-5 characters
- 100000-999999 → typically 5-6 characters
- 1000000-9999999 → typically 6-7 characters
- 10000000+ → typically 7-8 characters

To enforce max length of 8, we may need to truncate if hashids generates longer codes (though unlikely with counter starting at 10000).

## Code Structure

### New Redis Module (Optional - can be in app.py)

```python
# Redis connection and utilities
class RedisManager:
    def __init__(self):
        self.client = None
        self.connect()
    
    def connect(self):
        # Connection logic
    
    def get_counter(self):
        # INCR and return counter
    
    def init_counter(self):
        # Initialize counter to 10000 if not exists
    
    def cache_url(self, short_code, long_url, ttl):
        # Cache short_code -> long_url
    
    def get_cached_url(self, short_code):
        # Get cached long_url
    
    def cache_reverse(self, long_url, short_code, ttl):
        # Cache long_url -> short_code
    
    def get_cached_short_code(self, long_url):
        # Get cached short_code from long_url
```

## Configuration Details

### Redis Counter Key
- Key: `url_shortener:counter` (configurable via env)
- Initial Value: 10000
- Operation: `INCR` (atomic increment)

### Cache Keys Pattern
- Short code lookup: `url_shortener:url:{short_code}`
- Reverse lookup: `url_shortener:reverse:{hash(long_url)}`

### Cache TTL
- Default: 3600 seconds (1 hour)
- Configurable via `REDIS_CACHE_TTL` environment variable
- Can be set per cache entry if needed

## Error Handling

### Redis Connection Failures
- Graceful degradation: fall back to MongoDB-only if Redis unavailable
- Log errors for monitoring
- Return appropriate error messages

### Counter Initialization
- Check if counter exists on startup
- Initialize if missing
- Handle race conditions (multiple instances)

### Cache Failures
- If cache set fails, continue with MongoDB (non-blocking)
- If cache get fails, fall back to MongoDB query
- Log cache errors for monitoring

## Migration Considerations

### Existing Short Codes
- Existing short codes in MongoDB will continue to work
- No migration needed for existing data
- New short codes will use Redis counter

### Counter Synchronization
- If counter is reset, there's a risk of collision with old codes
- Consider checking MongoDB for existing short_code before saving
- Or ensure counter is never reset below max existing counter in MongoDB

### Backward Compatibility
- System should work with or without Redis
- If Redis unavailable, fall back to old random generation (or fail gracefully)

## Testing Plan

### Unit Tests
1. Test counter initialization
2. Test counter increment
3. Test hashids encoding with counter values
4. Test cache get/set operations
5. Test cache TTL expiration

### Integration Tests
1. Test full URL creation flow with Redis
2. Test URL lookup with cache hit/miss
3. Test duplicate URL detection with cache
4. Test Redis connection failure handling
5. Test counter collision handling

### Performance Tests
1. Measure cache hit rate
2. Measure response time improvement
3. Compare MongoDB queries before/after caching
4. Test counter increment performance

## Deployment Checklist

- [ ] Update `requirements.txt` (Redis already installed)
- [ ] Update `env.example` with Redis configuration
- [ ] Update `app.py` with Redis connection
- [ ] Update `generate_short_code()` to use Redis counter
- [ ] Implement Redis caching functions
- [ ] Update `/api/shorten` endpoint with caching
- [ ] Update `GET /<short_code>` endpoint with caching
- [ ] Add Redis health checks
- [ ] Update README.md with Redis setup instructions
- [ ] Test Redis connection and counter initialization
- [ ] Test cache functionality
- [ ] Test error handling (Redis unavailable)
- [ ] Update documentation

## Environment Variables Reference

```env
# Redis Configuration
REDIS_HOST=localhost              # Redis host (default: localhost)
REDIS_PORT=6379                  # Redis port (default: 6379)
REDIS_DB=0                       # Redis database number (default: 0)
REDIS_PASSWORD=                  # Redis password (optional, default: empty)
REDIS_COUNTER_KEY=url_shortener:counter  # Counter key name
REDIS_COUNTER_INITIAL_VALUE=10000        # Initial counter value
REDIS_CACHE_TTL=3600            # Cache TTL in seconds (default: 1 hour)
```

## Performance Benefits

### Before (Random Generation)
- Random number generation: ~0.1ms
- MongoDB duplicate check: ~5-10ms
- Potential retries: up to 10 attempts
- Average case: 1-2 MongoDB queries
- Worst case: 10+ MongoDB queries

### After (Redis Counter + Cache)
- Redis counter increment: ~0.5ms (network + atomic operation)
- Hashids encoding: ~0.1ms
- MongoDB save: ~5-10ms (no duplicate check needed)
- Cache lookup: ~0.5ms (much faster than MongoDB)
- Average case: 1 Redis query + 1 MongoDB write (no read needed)
- Cache hit case: 1 Redis query only (~0.5ms total)

### Expected Improvements
- **URL Creation**: 50-70% faster (no retry logic, cache for duplicates)
- **URL Lookup**: 90-95% faster on cache hits
- **Database Load**: Reduced by 80-90% for lookups
- **Scalability**: Better performance under high load

## Security Considerations

1. **Counter Security**: Counter is sequential, but hashids makes it non-obvious
2. **Cache Security**: Cache TTL prevents stale data
3. **Redis Authentication**: Use Redis password in production
4. **Redis Network**: Consider Redis over TLS in production
5. **Cache Invalidation**: Manual cache invalidation may be needed for updates

## Future Enhancements

1. **Cache Warming**: Pre-populate cache with frequently accessed URLs
2. **Cache Statistics**: Track cache hit/miss rates
3. **Distributed Counter**: Consider Redis Cluster for high availability
4. **Cache Invalidation**: Admin endpoint to invalidate specific cache entries
5. **Redis Persistence**: Configure Redis persistence for counter durability
6. **Monitoring**: Add Redis metrics to monitoring dashboard

