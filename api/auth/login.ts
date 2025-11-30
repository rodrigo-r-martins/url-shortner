import { AuthService } from '../../backend/src/services/authService.js';
import { initializeDatabase } from '../../backend/src/models/database.js';
import { getAllowedOrigins } from '../lib/init.js';

// Minimal Vercel types to avoid depending on @vercel/node
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

let authService: AuthService | null = null;
let dbInitialized = false;

function getAuthService(): AuthService {
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
      jwtExpiresIn,
    });
  }

  return authService;
}

function buildCookieOptions() {
  const env = process.env.NODE_ENV || 'development';
  const cookieName = process.env.JWT_COOKIE_NAME || 'auth_token';
  const sameSiteEnv = (process.env.JWT_COOKIE_SAMESITE || 'lax').toLowerCase();
  const sameSite =
    sameSiteEnv === 'strict' || sameSiteEnv === 'none' ? sameSiteEnv : 'lax';

  const secure = env !== 'development';
  const maxAgeSeconds = 24 * 60 * 60; // 1 day

  return {
    name: cookieName,
    secure,
    sameSite: sameSite as 'lax' | 'strict' | 'none',
    httpOnly: true,
    maxAgeSeconds,
  };
}

function buildSetCookieHeader(token: string): string {
  const opts = buildCookieOptions();

  const parts = [
    `${opts.name}=${encodeURIComponent(token)}`,
    `Max-Age=${opts.maxAgeSeconds}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${opts.sameSite.charAt(0).toUpperCase()}${opts.sameSite.slice(
      1,
    )}`,
  ];

  if (opts.secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin as string | undefined;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = (req.body || {}) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email and password are required' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res
        .status(400)
        .json({ error: 'Invalid email or password format' });
    }

    const service = getAuthService();
    const user = await service.validateUser(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = service.generateJwt(user);
    const setCookie = buildSetCookieHeader(token);
    res.setHeader('Set-Cookie', setCookie);

    return res.status(200).json({ user: user.toSafeResponse() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // For security, do not leak internal details
    console.error('Unhandled error in /api/auth/login:', message);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}


