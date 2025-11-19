import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUrlService, getAllowedOrigins } from './lib/init.js';
import {
  UrlValidationError,
  ShortCodeGenerationError
} from '../backend/src/exceptions/urlExceptions.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    const longUrl = payload.url;

    if (!longUrl) {
      return res.status(400).json({ error: 'URL is required in the request body' });
    }

    const urlService = await getUrlService();
    const result = await urlService.shortenUrl(longUrl);

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

