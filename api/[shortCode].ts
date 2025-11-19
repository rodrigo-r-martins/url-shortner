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

  // Extract shortCode from query parameter (Vercel dynamic route)
  // The parameter name matches the bracket name in the filename [shortCode].ts
  let shortCode = req.query.shortCode as string | string[];
  
  // Handle array case (shouldn't happen, but be safe)
  if (Array.isArray(shortCode)) {
    shortCode = shortCode[0];
  }
  
  // If not in query, try to extract from URL path as fallback
  if (!shortCode && req.url) {
    const pathMatch = req.url.match(/\/([a-zA-Z0-9]{4,8})(?:\?|$)/);
    if (pathMatch) {
      shortCode = pathMatch[1];
    }
  }

  if (!shortCode || typeof shortCode !== 'string') {
    return res.status(400).json({ 
      error: 'Short code is required',
      debug: {
        query: req.query,
        url: req.url,
        method: req.method
      }
    });
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

