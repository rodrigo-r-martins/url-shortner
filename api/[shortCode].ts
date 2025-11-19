import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUrlService } from './lib/init.js';
import { UrlNotFoundError } from '../backend/src/exceptions/urlExceptions.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const shortCode = req.query.shortCode as string;

  if (!shortCode) {
    return res.status(400).json({ error: 'Short code is required' });
  }

  try {
    const urlService = await getUrlService();
    const longUrl = await urlService.getLongUrl(shortCode);
    
    // Redirect to the long URL
    return res.redirect(302, longUrl);
  } catch (error) {
    if (error instanceof UrlNotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: `Server error: ${errorMessage}` });
  }
}

