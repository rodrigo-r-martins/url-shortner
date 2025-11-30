import jwt from 'jsonwebtoken';
import { getAllowedOrigins } from './init.js';
import { AuthService } from '../../backend/src/services/authService.js';
import { initializeDatabase } from '../../backend/src/models/database.js';

// Shared minimal types for Vercel-style handlers
export type HeadersLike = Record<string, string | string[] | undefined>;

export type VercelLikeResponse = {
  setHeader: (name: string, value: string) => void;
};

export type VercelRequestBase = {
  method?: string;
  headers: HeadersLike;
};

export type VercelRequestWithBody<TBody = unknown> = VercelRequestBase & {
  body?: TBody;
};

export type VercelRequestWithQuery<TQuery = Record<string, string | string[] | undefined>> =
  VercelRequestBase & {
    query: TQuery;
  };

export type VercelResponseFull = VercelLikeResponse & {
  status: (code: number) => VercelResponseFull;
  json: (body: unknown) => void;
  end: () => void;
};

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

// ----- Cookie & JWT helpers -----

export function parseCookies(
  header: string | string[] | undefined
): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  const value = Array.isArray(header) ? header.join(';') : header;

  const parts = value.split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (!name) continue;
    const cookieValue = rest.join('=');
    cookies[name] = decodeURIComponent(cookieValue || '');
  }

  return cookies;
}

export function getCookieFromHeaders(
  headers: HeadersLike,
  cookieName: string
): string | null {
  const cookieHeader = headers.cookie ?? headers.Cookie;
  const cookies = parseCookies(cookieHeader);
  const token = cookies[cookieName];
  return token && typeof token === 'string' ? token : null;
}

export function getUserIdFromHeaders(headers: HeadersLike): string | null {
  const cookieName = process.env.JWT_COOKIE_NAME || 'auth_token';
  const token = getCookieFromHeaders(headers, cookieName);
  if (!token) {
    return null;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured');
    return null;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload;
    if (payload && typeof payload.sub === 'string') {
      return payload.sub;
    }
    return null;
  } catch (error) {
    console.warn('Failed to verify JWT from headers:', error);
    return null;
  }
}

// ----- CORS helper -----

export function applyCors(
  res: VercelLikeResponse,
  headers: HeadersLike,
  allowMethods: string
): void {
  const allowedOrigins = getAllowedOrigins();
  const origin = headers.origin as string | undefined;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', allowMethods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// ----- AuthService + cookie helpers -----

let authService: AuthService | null = null;
let dbInitialized = false;

export function getAuthService(): AuthService {
  if (!dbInitialized) {
    const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
    const databaseName = process.env.DATABASE_NAME || 'urlshortener';
    initializeDatabase(mongodbUri, databaseName);
    dbInitialized = true;
  }

  if (!authService) {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    authService = new AuthService({
      jwtSecret,
      jwtExpiresIn
    });
  }

  return authService;
}

export type AuthCookieOptions = {
  name: string;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  httpOnly: boolean;
  maxAgeSeconds: number;
};

export function getAuthCookieOptions(): AuthCookieOptions {
  const env = process.env.NODE_ENV || 'development';
  const cookieName = process.env.JWT_COOKIE_NAME || 'auth_token';
  const sameSiteEnv = (process.env.JWT_COOKIE_SAMESITE || 'lax').toLowerCase();
  const sameSite =
    sameSiteEnv === 'strict' || sameSiteEnv === 'none'
      ? (sameSiteEnv as 'strict' | 'none')
      : 'lax';

  const secure = env !== 'development';
  const maxAgeSeconds = 24 * 60 * 60; // 1 day

  return {
    name: cookieName,
    secure,
    sameSite,
    httpOnly: true,
    maxAgeSeconds
  };
}

export function buildAuthSetCookieHeader(token: string): string {
  const opts = getAuthCookieOptions();

  const parts = [
    `${opts.name}=${encodeURIComponent(token)}`,
    `Max-Age=${opts.maxAgeSeconds}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${opts.sameSite.charAt(0).toUpperCase()}${opts.sameSite.slice(1)}`
  ];

  if (opts.secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export function buildAuthClearCookieHeader(): string {
  const opts = getAuthCookieOptions();

  const parts = [
    `${opts.name}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    `SameSite=${opts.sameSite.charAt(0).toUpperCase()}${opts.sameSite.slice(1)}`
  ];

  if (opts.secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}


