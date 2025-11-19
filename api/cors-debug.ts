import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllowedOrigins } from './lib/init.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin || 'No Origin header';
  const allowedOrigins = getAllowedOrigins();
  const baseUrl = process.env.BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:8080';

  return res.json({
    request_origin: origin,
    allowed_origins: allowedOrigins,
    origin_allowed: typeof origin === 'string' && allowedOrigins.includes(origin),
    request_headers: req.headers,
    base_url: baseUrl
  });
}

