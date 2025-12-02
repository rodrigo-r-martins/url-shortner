# URL Shortener

A full-stack web application that transforms long, unwieldy URLs into elegant, short, and shareable links. Built with modern web technologies and designed for scalability and performance.

## Problem

Long URLs are problematic for:

- **Social media sharing** - Character limits and messy links
- **Print materials** - Difficult to type and error-prone
- **User experience** - Hard to remember and share
- **Analytics** - Hard to track and measure engagement

This application solves these problems by providing a simple, fast, and reliable URL shortening service.

## Solution

A full-stack URL shortener that:

- Generates cryptographically secure short codes (4-8 characters)
- Detects and reuses existing short URLs for duplicate long URLs
- Provides fast redirects with minimal latency
- Offers a beautiful, responsive user interface
- Includes comprehensive error handling and validation

## Tech Stack

### Frontend

- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TanStack React Query** - Efficient data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code quality and consistency

### Backend

- **Express.js** - Fast, minimalist web framework
- **TypeScript** - Type-safe Node.js development
- **MongoDB** - Document database for URL storage
- **Hashids** - Cryptographically secure short code generation
- **Pino** - High-performance structured logging
- **CORS** - Cross-origin resource sharing support

### Infrastructure

- **Fly.io** - Backend hosting for the Dockerized Express/TypeScript API
- **Vercel** - Frontend hosting with rewrites that proxy requests to the Fly.io backend
- **MongoDB Atlas/Cloud** - Database hosting (optional)
- **Redis** - In-memory data store (planned) - Counter-based short code generation and caching layer

### System Flow

1. **User submits URL** → Frontend validates and sends to API
2. **Backend processes** → Validates URL, checks for duplicates
3. **Code generation** → Creates unique short code if new URL
4. **Database storage** → Stores mapping in MongoDB
5. **Response** → Returns short URL to user
6. **Redirect** → Short code redirects to original URL

## Key Features

- ✅ **Cryptographically secure** short code generation
- ✅ **Duplicate detection** - Same URL returns existing short code
- ✅ **Collision handling** - Automatic retry for unique codes
- ✅ **Health checks** - Server and database monitoring
- ✅ **Type safety** - Full TypeScript coverage
- ✅ **Structured logging** - Production-ready logging
- ✅ **CORS support** - Cross-origin API access
- ✅ **Responsive UI** - Works on all device sizes
- ✅ **Error handling** - Graceful error messages
- ✅ **Graceful shutdown** - Proper resource cleanup

## Planned Improvements

### Redis Integration

**Status:** 🚧 Planned

The application plans to integrate Redis for enhanced performance and scalability:

#### Goals

- **Counter-based short codes** - Replace random generation with Redis INCR counter for guaranteed unique codes
- **Performance caching** - Implement Redis caching layer for URL lookups to reduce database queries
- **Improved scalability** - Better performance under high load with in-memory caching

#### Expected Benefits

- **50-70% faster** URL creation (eliminates retry logic, uses atomic counter)
- **90-95% faster** URL lookups on cache hits
- **80-90% reduction** in database load for read operations
- **Zero collisions** - Atomic counter ensures uniqueness without duplicate checks

#### Implementation Plan

- Replace random number generation with Redis counter starting at 10,000
- Implement two-way caching: `short_code → long_url` and `long_url → short_code`
- Cache TTL of 1 hour with configurable expiration
- Graceful fallback to MongoDB if Redis is unavailable
- Maintain backward compatibility with existing short codes

For detailed implementation plan, see [REDIS_IMPLEMENTATION_PLAN.md](./planning/REDIS_IMPLEMENTATION_PLAN.md)

For detailed setup and deployment instructions, see:

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## License

This project is open source and available for use.
