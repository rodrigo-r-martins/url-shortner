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

function buildClearCookieHeader(): string {
  const env = process.env.NODE_ENV || 'development';
  const cookieName = process.env.JWT_COOKIE_NAME || 'auth_token';
  const sameSiteEnv = (process.env.JWT_COOKIE_SAMESITE || 'lax').toLowerCase();
  const sameSite =
    sameSiteEnv === 'strict' || sameSiteEnv === 'none' ? sameSiteEnv : 'lax';

  const secure = env !== 'development';

  const parts = [
    `${cookieName}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite.slice(1)}`,
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const clearCookie = buildClearCookieHeader();
  res.setHeader('Set-Cookie', clearCookie);

  return res.status(200).json({ success: true });
}


