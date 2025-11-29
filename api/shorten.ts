import jwt from 'jsonwebtoken';
import { getUrlService, getAllowedOrigins } from './lib/init.js';
import {
  UrlValidationError,
  ShortCodeGenerationError
} from '../backend/src/exceptions/urlExceptions.js';

// Minimal Vercel types to avoid depending on @vercel/node type package
type VercelRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: () => void;
};

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (!name) continue;
    const value = rest.join('=');
    cookies[name] = decodeURIComponent(value || '');
  }
  return cookies;
}

function getUserIdFromRequest(req: VercelRequest): string | null {
  const cookieHeader =
    (req.headers as Record<string, string | string[] | undefined>).cookie ||
    (req.headers as Record<string, string | string[] | undefined>).Cookie;
  const cookies = parseCookies(
    Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader
  );

  const cookieName = process.env.JWT_COOKIE_NAME || 'auth_token';
  const token = cookies[cookieName];
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
    console.warn('Failed to verify JWT in api/shorten:', error);
    return null;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin as string | undefined;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user via JWT cookie
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = (req.body || {}) as { url?: string };
    const longUrl = payload.url;

    if (!longUrl) {
      return res
        .status(400)
        .json({ error: 'URL is required in the request body' });
    }

    const urlService = await getUrlService();
    const result = await urlService.shortenUrl(longUrl, userId);

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof UrlValidationError) {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof ShortCodeGenerationError) {
      return res.status(500).json({ error: error.message });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: `Server error: ${errorMessage}` });
  }
}

