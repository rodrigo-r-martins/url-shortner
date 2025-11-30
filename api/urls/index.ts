import { getUrlService } from '../lib/init.js';
import { UrlNotFoundError } from '../../backend/src/exceptions/urlExceptions.js';
import {
  applyCors,
  getUserIdFromHeaders,
  VercelRequestBase,
  VercelResponseFull
} from '../lib/auth.js';

export default async function handler(
  req: VercelRequestBase,
  res: VercelResponseFull
) {
  // CORS
  applyCors(res, req.headers, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromHeaders(req.headers);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const urlService = await getUrlService();
    const urls = await urlService.listUrlsForUser(userId);

    return res.status(200).json({ urls });
  } catch (error) {
    if (error instanceof UrlNotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: `Server error: ${message}` });
  }
}


