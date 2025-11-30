import { getUrlService } from './lib/init.js';
import {
  UrlValidationError,
  ShortCodeGenerationError
} from '../backend/src/exceptions/urlExceptions.js';
import {
  applyCors,
  getUserIdFromHeaders,
  VercelRequestWithBody,
  VercelResponseFull
} from './lib/auth.js';

export default async function handler(
  req: VercelRequestWithBody<{ url?: string }>,
  res: VercelResponseFull
) {
  // Handle CORS
  applyCors(res, req.headers, 'POST, OPTIONS');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user via JWT cookie
  const userId = getUserIdFromHeaders(req.headers);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { url: longUrl } = req.body || {};

    if (!longUrl) {
      return res
        .status(400)
        .json({ error: 'URL is required in the request body' });
    }

    const urlService = await getUrlService();
    const result = await urlService.shortenUrl(longUrl, userId);

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

