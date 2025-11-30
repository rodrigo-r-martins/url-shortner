import { getUrlService } from '../lib/init.js';
import { UrlNotFoundError } from '../../backend/src/exceptions/urlExceptions.js';
import {
  applyCors,
  getUserIdFromHeaders,
  VercelRequestWithQuery,
  VercelResponseFull
} from '../lib/auth.js';

export default async function handler(
  req: VercelRequestWithQuery,
  res: VercelResponseFull
) {
  applyCors(res, req.headers, 'DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromHeaders(req.headers);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  let shortCode = req.query.shortCode as string | string[] | undefined;
  if (Array.isArray(shortCode)) {
    shortCode = shortCode[0];
  }

  if (!shortCode || typeof shortCode !== 'string') {
    return res.status(400).json({ error: 'Short code is required' });
  }

  try {
    const urlService = await getUrlService();
    await urlService.deleteUrlForUser(userId, shortCode);
    return res.status(204).end();
  } catch (error) {
    if (error instanceof UrlNotFoundError) {
      return res.status(404).json({ error: error.message });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: `Server error: ${message}` });
  }
}


