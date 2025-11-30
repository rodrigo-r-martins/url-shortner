import { AuthService } from '../../backend/src/services/authService.js';
import { initializeDatabase } from '../../backend/src/models/database.js';
import { getAllowedOrigins } from '../lib/init.js';

type VercelRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
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

function parseCookies(
  cookieHeader: string | string[] | undefined,
): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  const headerValue = Array.isArray(cookieHeader)
    ? cookieHeader.join(';')
    : cookieHeader;

  const parts = headerValue.split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (!name) continue;
    const value = rest.join('=');
    cookies[name] = decodeURIComponent(value || '');
  }
  return cookies;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin as string | undefined;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookieHeader =
      req.headers.cookie || (req.headers.Cookie as string | undefined);
    const cookies = parseCookies(cookieHeader);

    const cookieName = process.env.JWT_COOKIE_NAME || 'auth_token';
    const token = cookies[cookieName];

    if (!token || typeof token !== 'string') {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const service = getAuthService();
    const payload = service.verifyJwt(token);

    return res.status(200).json({
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      },
    });
  } catch (_error) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
}


