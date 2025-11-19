# URL Shortener - Backend

A TypeScript/Express.js backend service for the URL shortener application with MongoDB storage.

## Features

- POST `/api/shorten` - Create short URLs from long URLs (returns existing short URL if already created)
- GET `/<short_code>` - Redirect to original long URL
- GET `/health` - Health check endpoint
- GET `/db/health` - Database health check endpoint
- Cryptographically secure short code generation using Hashids with base62 alphabet
- Unique short codes with collision detection and automatic retry
- Duplicate URL detection (same long URL returns existing short URL)

## Setup

### Prerequisites

- Node.js 18+ (with ES modules support)
- TypeScript 5.3+
- MongoDB (local or cloud instance)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Copy `.env.example` to `.env` and update with your MongoDB connection string:

```bash
cp env.example .env
```

Edit `.env`:

```
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=urlshortener
NODE_ENV=development
FLASK_DEBUG=True
BASE_URL=http://localhost:8080
HASH_ID_SALT=url-shortner
PORT=8080
```

For MongoDB Atlas (cloud), use:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

### Building and Running the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

First, build the TypeScript code:

```bash
npm run build
```

Then run the compiled JavaScript:

```bash
npm start
```

**Type checking (without building):**

```bash
npm run type-check
```

The server will start on `http://localhost:8080` (or the PORT specified in `.env`).

## API Endpoints

### POST `/api/shorten`

Create a short URL from a long URL.

**Request:**

```json
{
  "url": "https://example.com/very/long/url"
}
```

**Response (201 Created) - New URL:**

```json
{
  "shortUrl": "http://localhost:8080/abc12345",
  "shortCode": "abc12345",
  "longUrl": "https://example.com/very/long/url",
  "created_at": "2024-11-03T12:34:56.789Z"
}
```

**Response (200 OK) - Existing URL:**

If the URL has already been shortened, the existing short URL is returned:

```json
{
  "shortUrl": "http://localhost:8080/abc12345",
  "shortCode": "abc12345",
  "longUrl": "https://example.com/very/long/url",
  "created_at": "2024-11-03T12:34:56.789Z"
}
```

**Error Responses:**

- `400` - Invalid URL format or missing URL in body
- `500` - Server error (e.g., failed to generate unique short code after max attempts)

### GET `/<short_code>`

Redirect to the original long URL.

**Example:**

```
GET http://localhost:8080/abc12345
```

**Response:**

- `302 Redirect` - Redirects to the original URL
- `404` - Short URL not found

### GET `/health`

Health check endpoint to verify server and database connectivity.

**Response:**

```json
{
  "status": "healthy",
  "database": "connected"
}
```

### GET `/db/health`

Database-specific health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "database": "connected"
}
```

**Error Response (503):**

```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "error message"
}
```

## Database Schema

The `urls` collection stores documents with the following structure:

```json
{
  "_id": ObjectId("..."),
  "short_code": "abc12345",
  "long_url": "https://example.com/very/long/url",
  "created_at": ISODate("2024-11-03T12:34:56.789Z")
}
```

The `short_code` field has a unique index for fast lookups and to prevent collisions. The `long_url` field is not indexed, but the system checks for existing URLs before creating new entries to avoid duplicates.

## Short Code Generation

Short codes are generated using:

- Cryptographically secure random number generation (`crypto.randomInt`)
- Hashids library with base62 alphabet (a-z, A-Z, 0-9)
- Random number range: 1000 to 99,999,999 (4-8 digits)
- Minimum encoded length of 4 characters
- Maximum encoded length of 8 characters (truncated if longer)
- Salted with `HASH_ID_SALT` environment variable for additional security

The system automatically retries up to 10 times if a collision is detected (duplicate short code), ensuring uniqueness. If a unique code cannot be generated after max attempts, a 500 error is returned.

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017/`)
- `DATABASE_NAME` - Database name (default: `urlshortener`)
- `BASE_URL` - Base URL for generated short URLs (default: `http://localhost:8080`)
- `HASH_ID_SALT` - Salt for Hashids encoding (default: `url-shortner`)
- `PORT` - Server port (default: `8080`)
- `NODE_ENV` - Node environment (default: `development`)
- `FLASK_DEBUG` - Enable debug mode (default: `False`) - kept for compatibility
- `FRONTEND_URL` - Frontend URL for CORS configuration

## Development

The server supports CORS for development with the frontend. Make sure to update the frontend's API URL configuration when connecting.
