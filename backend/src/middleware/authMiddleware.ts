import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthCookieConfig } from '../controllers/authController.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticateJwt(authService: AuthService, cookieConfig: AuthCookieConfig) {
  const cookieName = cookieConfig.name || 'auth_token';

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const token = req.cookies?.[cookieName];

      if (!token || typeof token !== 'string') {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const payload = authService.verifyJwt(token);

      (req as AuthenticatedRequest).user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      };

      next();
    } catch (_error) {
      res.status(401).json({ error: 'Not authenticated' });
    }
  };
}


