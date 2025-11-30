import {
  applyCors,
  buildAuthClearCookieHeader,
  VercelRequestBase,
  VercelResponseFull
} from '../lib/auth.js';

export default async function handler(
  req: VercelRequestBase,
  res: VercelResponseFull
) {
  applyCors(res, req.headers, 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clearCookie = buildAuthClearCookieHeader();
  res.setHeader('Set-Cookie', clearCookie);

  return res.status(200).json({ success: true });
}


