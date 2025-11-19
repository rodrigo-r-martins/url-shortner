// Types are kept minimal here to avoid depending on @vercel/node types
type VercelRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  redirect: (status: number, url: string) => void;
};

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

  // shortCode is provided via query string: /api/redirect?shortCode=<code>
  let shortCode = req.query.shortCode as string | string[] | undefined;

  if (Array.isArray(shortCode)) {
    shortCode = shortCode[0];
  }

  if (!shortCode || typeof shortCode !== 'string') {
    return res.status(400).json({
      error: 'Short code is required',
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


