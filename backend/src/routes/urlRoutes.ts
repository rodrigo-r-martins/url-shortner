import express, { Request, Response } from 'express';
import {
  UrlValidationError,
  ShortCodeGenerationError,
  UrlNotFoundError
} from '../exceptions/urlExceptions.js';
import { UrlService } from '../services/urlService.js';

export function registerUrlRoutes(app: express.Application, urlService: UrlService): void {
  const router = express.Router();

  router.post('/api/shorten', async (req: Request, res: Response): Promise<Response | void> => {
    const origin = req.headers.origin;
    const contentType = req.headers['content-type'];
    console.log(`POST /api/shorten - origin=${origin} content_type=${contentType}`);

    try {
      const payload = req.body || {};
      console.log('Request JSON payload:', payload);

      const longUrl = payload.url;
      if (!longUrl) {
        console.warn("Missing 'url' in request body");
        return res.status(400).json({ error: 'URL is required in the request body' });
      }

      console.log(`Attempting to shorten URL: ${longUrl}`);
      const result = await urlService.shortenUrl(longUrl);
      console.log(`Shorten success - shortCode=${result.shortCode} shortUrl=${result.shortUrl}`);
      const statusCode = 201;
      return res.status(statusCode).json(result);
    } catch (error) {
      if (error instanceof UrlValidationError) {
        console.warn(`Validation error: ${error.message}`);
        return res.status(400).json({ error: error.message });
      }

      if (error instanceof ShortCodeGenerationError) {
        console.error(`Short code generation error: ${error.message}`);
        return res.status(500).json({ error: error.message });
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Unhandled error in /api/shorten:', error);
      return res.status(500).json({ error: `Server error: ${errorMessage}` });
    }
  });

  router.get('/:shortCode', async (req: Request, res: Response): Promise<Response | void> => {
    const shortCode = req.params.shortCode;
    const origin = req.headers.origin;
    console.log(`GET /${shortCode} - origin=${origin}`);

    try {
      const longUrl = await urlService.getLongUrl(shortCode);
      console.log(`Redirecting shortCode=${shortCode} to ${longUrl}`);
      return res.redirect(302, longUrl);
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        console.warn(`Short code not found: ${shortCode}`);
        return res.status(404).json({ error: error.message });
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Unhandled error in redirect for shortCode=${shortCode}:`, error);
      return res.status(500).json({ error: `Server error: ${errorMessage}` });
    }
  });

  app.use('/', router);
}

