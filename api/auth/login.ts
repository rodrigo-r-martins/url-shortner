import {
  applyCors,
  buildAuthSetCookieHeader,
  getAuthService,
  VercelRequestWithBody,
  VercelResponseFull
} from '../lib/auth.js';

export default async function handler(
  req: VercelRequestWithBody<{ email?: string; password?: string }>,
  res: VercelResponseFull
) {
  // CORS
  applyCors(res, req.headers, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

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
    const setCookie = buildAuthSetCookieHeader(token);
    res.setHeader('Set-Cookie', setCookie);

    return res.status(200).json({ user: user.toSafeResponse() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // For security, do not leak internal details
    console.error('Unhandled error in /api/auth/login:', message);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}


