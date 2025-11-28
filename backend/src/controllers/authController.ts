import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { logger } from '../utils/logger.js';

const AUTH_COOKIE_DEFAULT_NAME = 'auth_token';

export interface AuthCookieConfig {
  name?: string;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  httpOnly: boolean;
}

export class AuthController {
  private authService: AuthService;
  private cookieConfig: AuthCookieConfig;

  constructor(authService: AuthService, cookieConfig: AuthCookieConfig) {
    this.authService = authService;
    this.cookieConfig = {
      name: cookieConfig.name || AUTH_COOKIE_DEFAULT_NAME,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      httpOnly: cookieConfig.httpOnly
    };
  }

  private get cookieName(): string {
    return this.cookieConfig.name || AUTH_COOKIE_DEFAULT_NAME;
  }

  private getCookieOptions() {
    return {
      httpOnly: this.cookieConfig.httpOnly,
      secure: this.cookieConfig.secure,
      sameSite: this.cookieConfig.sameSite,
      // Let JWT expiry control validity; cookie itself can be a bit longer
      // Max-Age is in seconds (e.g., 1 day)
      maxAge: 24 * 60 * 60 * 1000
    } as const;
  }

  register = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Invalid email or password format' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      const user = await this.authService.registerUser(email, password, 'admin');

      return res.status(201).json({ user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn({ error: errorMessage }, 'User registration failed');
      return res.status(400).json({ error: errorMessage });
    }
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Invalid email or password format' });
      }

      const user = await this.authService.validateUser(email, password);
      if (!user) {
        // Do not reveal whether email exists
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = this.authService.generateJwt(user);

      res.cookie(this.cookieName, token, this.getCookieOptions());

      logger.info({ email: user.email }, 'User logged in');

      return res.status(200).json({ user: user.toSafeResponse() });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: errorMessage }, 'Unhandled error in login');
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };

  logout = async (_req: Request, res: Response): Promise<Response> => {
    res.clearCookie(this.cookieName, this.getCookieOptions());
    return res.status(200).json({ success: true });
  };

  me = async (req: Request, res: Response): Promise<Response> => {
    // `req.user` will be set by auth middleware for /me, but we also allow
    // checking the cookie directly as a fallback for this endpoint.
    try {
      // Prefer user attached by middleware
      const anyReq = req as Request & { user?: unknown };
      if (anyReq.user) {
        return res.status(200).json({ user: anyReq.user });
      }

      const token = req.cookies?.[this.cookieName];
      if (!token || typeof token !== 'string') {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const payload = this.authService.verifyJwt(token);

      return res.status(200).json({
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role
        }
      });
    } catch (_error) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
  };
}


