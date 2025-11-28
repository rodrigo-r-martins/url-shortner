import express, { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthController, AuthCookieConfig } from '../controllers/authController.js';
import { authenticateJwt } from '../middleware/authMiddleware.js';

export function registerAuthRoutes(
  app: express.Application,
  authService: AuthService,
  cookieConfig: AuthCookieConfig
): void {
  const router = express.Router();
  const controller = new AuthController(authService, cookieConfig);

  // Register a user (intended to be called manually for bootstrap)
  router.post(
    '/api/auth/register',
    (req: Request, res: Response, next: NextFunction) => controller.register(req, res).catch(next)
  );

  router.post(
    '/api/auth/login',
    (req: Request, res: Response, next: NextFunction) => controller.login(req, res).catch(next)
  );

  router.post(
    '/api/auth/logout',
    (req: Request, res: Response, next: NextFunction) => controller.logout(req, res).catch(next)
  );

  // Current user – requires valid JWT cookie
  router.get(
    '/api/auth/me',
    authenticateJwt(authService, cookieConfig),
    (req: Request, res: Response, next: NextFunction) => controller.me(req, res).catch(next)
  );

  app.use('/', router);
}


