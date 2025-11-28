import express, { Request, Response } from 'express';
import { getUrlsCollection } from '../models/database.js';
import { AuthService } from '../services/authService.js';
import { AuthCookieConfig } from '../controllers/authController.js';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authMiddleware.js';

export function registerDashboardRoutes(
  app: express.Application,
  authService: AuthService,
  cookieConfig: AuthCookieConfig
): void {
  const router = express.Router();

  router.get(
    '/api/dashboard/summary',
    authenticateJwt(authService, cookieConfig),
    async (req: Request, res: Response): Promise<Response> => {
      const authReq = req as AuthenticatedRequest;
      const collection = await getUrlsCollection();
      const totalUrls = await collection.estimatedDocumentCount();

      return res.status(200).json({
        totalUrls,
        user: authReq.user
      });
    }
  );

  app.use('/', router);
}


