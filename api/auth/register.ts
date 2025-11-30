import { AuthService } from '../../backend/src/services/authService.js';
import { initializeDatabase } from '../../backend/src/models/database.js';
import { getAllowedOrigins } from '../lib/init.js';

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

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters long' });
    }

    const service = getAuthService();
    const user = await service.registerUser(email, password, 'admin');

    return res.status(201).json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('User registration failed in /api/auth/register:', message);
    return res.status(400).json({ error: message });
  }
}


