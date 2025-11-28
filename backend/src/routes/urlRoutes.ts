import express, { Request, Response } from 'express';
import {
  UrlValidationError,
  ShortCodeGenerationError,
  UrlNotFoundError
} from '../exceptions/urlExceptions.js';
import { UrlService } from '../services/urlService.js';
import { AuthService } from '../services/authService.js';
import { AuthCookieConfig } from '../controllers/authController.js';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

export function registerUrlRoutes(
  app: express.Application,
  urlService: UrlService,
  authService: AuthService,
  cookieConfig: AuthCookieConfig
): void {
  const router = express.Router();

  router.post(
    '/api/shorten',
    authenticateJwt(authService, cookieConfig),
    async (req: Request, res: Response): Promise<Response | void> => {
      const origin = req.headers.origin;
      const contentType = req.headers['content-type'];
      logger.debug({ origin, contentType }, 'POST /api/shorten request received');

      try {
        const authReq = req as AuthenticatedRequest;
        const payload = req.body || {};
        logger.debug({ payload }, 'Request payload');

        const longUrl = payload.url;
        if (!longUrl) {
          logger.warn('Missing url in request body');
          return res.status(400).json({ error: 'URL is required in the request body' });
        }

        logger.info({ longUrl, userId: authReq.user?.id }, 'Attempting to shorten URL');
        const result = await urlService.shortenUrl(longUrl, authReq.user?.id);
        logger.info({ shortCode: result.shortCode, shortUrl: result.shortUrl }, 'URL shortened successfully');
        const statusCode = 201;
        return res.status(statusCode).json(result);
      } catch (error) {
        if (error instanceof UrlValidationError) {
          logger.warn({ error: error.message }, 'URL validation error');
          return res.status(400).json({ error: error.message });
        }

        if (error instanceof ShortCodeGenerationError) {
          logger.error({ error: error.message }, 'Short code generation error');
          return res.status(500).json({ error: error.message });
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ error: errorMessage, stack: error instanceof Error ? error.stack : undefined }, 'Unhandled error in /api/shorten');
        return res.status(500).json({ error: `Server error: ${errorMessage}` });
      }
    }
  );

  router.get('/:shortCode', async (req: Request, res: Response): Promise<Response | void> => {
    const shortCode = req.params.shortCode;
    const origin = req.headers.origin;
    logger.debug({ shortCode, origin }, `GET /${shortCode} request received`);

    try {
      const longUrl = await urlService.getLongUrl(shortCode);
      logger.info({ shortCode, longUrl }, 'Redirecting to long URL');
      return res.redirect(302, longUrl);
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        logger.warn({ shortCode }, 'Short code not found');
        return res.status(404).json({ error: error.message });
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ shortCode, error: errorMessage, stack: error instanceof Error ? error.stack : undefined }, 'Unhandled error in redirect');
      return res.status(500).json({ error: `Server error: ${errorMessage}` });
    }
  });

  router.get(
    '/api/urls',
    authenticateJwt(authService, cookieConfig),
    async (req: Request, res: Response): Promise<Response | void> => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      try {
        const urls = await urlService.listUrlsForUser(userId);
        return res.status(200).json({ urls });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          { userId, error: errorMessage, stack: error instanceof Error ? error.stack : undefined },
          'Unhandled error in GET /api/urls'
        );
        return res.status(500).json({ error: `Server error: ${errorMessage}` });
      }
    }
  );

  router.delete(
    '/api/urls/:shortCode',
    authenticateJwt(authService, cookieConfig),
    async (req: Request, res: Response): Promise<Response | void> => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { shortCode } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      try {
        await urlService.deleteUrlForUser(userId, shortCode);
        return res.status(200).json({ success: true });
      } catch (error) {
        if (error instanceof UrlNotFoundError) {
          logger.warn({ userId, shortCode }, 'URL not found for user in DELETE /api/urls/:shortCode');
          return res.status(404).json({ error: error.message });
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          { userId, shortCode, error: errorMessage, stack: error instanceof Error ? error.stack : undefined },
          'Unhandled error in DELETE /api/urls/:shortCode'
        );
        return res.status(500).json({ error: `Server error: ${errorMessage}` });
      }
    }
  );

  app.use('/', router);
}

