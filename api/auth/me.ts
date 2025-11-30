import {
  applyCors,
  getAuthService,
  getCookieFromHeaders,
  VercelRequestBase,
  VercelResponseFull
} from '../lib/auth.js';

export default async function handler(
  req: VercelRequestBase,
  res: VercelResponseFull
) {
  applyCors(res, req.headers, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookieName = process.env.JWT_COOKIE_NAME || 'auth_token';
    const token = getCookieFromHeaders(req.headers, cookieName);

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


