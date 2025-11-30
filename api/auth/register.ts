import {
  applyCors,
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


