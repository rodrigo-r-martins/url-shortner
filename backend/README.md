# URL Shortener - Backend

A TypeScript/Express.js backend service for the URL shortener application with MongoDB storage.

## Features

- POST `/api/shorten` - Create short URLs from long URLs (returns existing short URL if already created)
- GET `/<short_code>` - Redirect to original long URL
- GET `/health` - Health check endpoint
- GET `/db/health` - Database health check endpoint
- POST `/api/auth/login` - Login with email and password (sets secure HTTP-only JWT cookie)
- POST `/api/auth/logout` - Logout and clear the auth cookie
- GET `/api/auth/me` - Get current authenticated user based on JWT cookie
- GET `/api/dashboard/summary` - Protected endpoint returning basic dashboard stats
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

Edit `.env`

- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017/`)
- `DATABASE_NAME` - Database name (default: `urlshortener`)
- `BASE_URL` - Base URL for generated short URLs (default: `http://localhost:8080`)
- `HASH_ID_SALT` - Salt for Hashids encoding (default: `url-shortner`)
- `PORT` - Server port (default: `8080`)
- `NODE_ENV` - Node environment (default: `development`)
- `FRONTEND_URL` - Frontend URL for CORS configuration
- `JWT_SECRET` - Secret key used to sign JWTs (required for authentication)
- `JWT_EXPIRES_IN` - JWT lifetime (e.g. `15m`, `1h`)
- `JWT_COOKIE_NAME` - Name of the HTTP-only cookie that stores the JWT (default: `auth_token`)
- `JWT_COOKIE_SAMESITE` - SameSite mode for auth cookie (`lax`, `strict`, or `none`)

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

## Deployment (Fly.io)

This backend is configured to be deployed to **Fly.io** using the provided `Dockerfile` and `fly.toml`.

### Prerequisites

- A Fly.io account
- The Fly CLI (`flyctl`) installed locally
- A MongoDB instance reachable from Fly (e.g., MongoDB Atlas)

### One-time Fly.io setup

From the `backend` directory:

```bash
fly launch
```

This command:

- Creates a Fly app (e.g. `backend-holy-shadow-7671`, as referenced in the project config)
- Generates `fly.toml`
- Detects the `Dockerfile` for building the image

If you already have `fly.toml` and an app created, you can skip `fly launch` next time and go straight to deploy.

### Environment variables / secrets

Set your production configuration as Fly secrets so they are available at runtime:

```bash
fly secrets set \
  MONGODB_URI="your-mongodb-connection-string" \
  DATABASE_NAME="urlshortener" \
  BASE_URL="https://backend-holy-shadow-7671.fly.dev" \
  HASH_ID_SALT="your-secure-salt" \
  JWT_SECRET="your-production-jwt-secret" \
  JWT_EXPIRES_IN="15m" \
  JWT_COOKIE_NAME="auth_token" \
  JWT_COOKIE_SAMESITE="lax" \
  FRONTEND_URL="https://your-frontend-domain"
```

- `BASE_URL` should point to the public URL of your Fly app (or your custom domain).
- `FRONTEND_URL` should be the URL of your Vercel frontend so CORS works correctly.

### Deploying to Fly.io

From the `backend` directory:

```bash
fly deploy
```

Fly will:

- Build the Docker image using the `Dockerfile` (Node 24 + production build)
- Run the app exposing port `8080` internally (as configured in `fly.toml`)
- Make it available at `https://<your-app-name>.fly.dev` (or your custom domain)

After deployment, the Vercel frontend can communicate with the backend via relative `/api/...` paths, which are proxied to this Fly app by the Vercel rewrites configuration.

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

### GET `/api/urls`

Returns all URLs created by the currently authenticated user.

**Response (200 OK):**

```json
{
  "urls": [
    {
      "shortUrl": "http://localhost:8080/abc12345",
      "shortCode": "abc12345",
      "longUrl": "https://example.com/very/long/url",
      "created_at": "2024-11-03T12:34:56.789Z"
    }
  ]
}
```

**Error Responses:**

- `401` - Not authenticated
- `500` - Server error

### DELETE `/api/urls/:shortCode`

Deletes a URL owned by the currently authenticated user.

**Response (200 OK):**

```json
{
  "success": true
}
```

**Error Responses:**

- `401` - Not authenticated
- `404` - URL not found for this user
- `500` - Server error

### POST `/api/auth/login`

Authenticate a user and set a secure HTTP-only cookie with a short-lived JWT.

**Request:**

```json
{
  "email": "admin@example.com",
  "password": "strong-password"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "656f5a4e...",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

On success, a JWT is stored in an HTTP-only cookie (not accessible via JavaScript).

### POST `/api/auth/logout`

Clears the authentication cookie.

**Response (200 OK):**

```json
{
  "success": true
}
```

### GET `/api/auth/me`

Returns the current authenticated user based on the JWT cookie.

**Response (200 OK):**

```json
{
  "user": {
    "id": "656f5a4e...",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Error (401):**

```json
{
  "error": "Not authenticated"
}
```

### GET `/api/dashboard/summary`

Protected endpoint requiring a valid JWT cookie. Returns basic stats for the dashboard.

**Response (200 OK):**

```json
{
  "totalUrls": 42,
  "user": {
    "id": "656f5a4e...",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

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

## Project Structure

The backend follows a layered architecture with clear separation of concerns:

- **app.ts** - Main application entry point with Express setup and middleware configuration
- **config/** - Application configuration and environment variable management
- **controllers/** - Request handlers and business logic orchestration
- **services/** - Core business logic and service layer
- **models/** - Database models and connection management
- **routes/** - API route definitions and registration
- **utils/** - Utility functions (logger, URL validator, short code generator)
- **exceptions/** - Custom exception classes for error handling

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

## Development

The server supports CORS for development with the frontend. Make sure to update the frontend's API URL configuration when connecting.

### Architecture Notes

- **Dependency Injection**: Services are initialized with their dependencies in `app.ts` for better testability and modularity
- **Logging**: Uses Pino for structured logging with HTTP request logging middleware
- **Error Handling**: Custom exception classes provide consistent error responses
- **Type Safety**: Full TypeScript support with strict type checking
- **Graceful Shutdown**: Handles SIGTERM and SIGINT signals to close database connections properly
