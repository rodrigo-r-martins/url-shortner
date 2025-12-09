import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

export class AppConfig {
  public readonly port: number;
  public readonly debug: boolean;
  public readonly env: string;
  public readonly baseUrl: string;
  public readonly frontendUrl: string;
  public readonly allowedOrigins: string[];
  public readonly mongodbUri: string;
  public readonly databaseName: string;
  public readonly redisUrl: string;
  public readonly hashIdSalt: string;
  public readonly jwtSecret: string;
  public readonly jwtExpiresIn: string;
  public readonly authCookieName: string;
  public readonly authCookieSecure: boolean;
  public readonly authCookieSameSite: 'lax' | 'strict' | 'none';

  constructor() {
    // Server configuration
    this.port = parseInt(process.env.PORT || '8080', 10);
    this.debug = process.env.NODE_ENV === 'development';
    this.env = process.env.NODE_ENV || 'development';

    // Application URLs
    this.baseUrl = process.env.BASE_URL || 'http://localhost:8080';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Database configuration
    this.mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
    this.databaseName = process.env.DATABASE_NAME || 'urlshortener';

    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // Hashids configuration
    this.hashIdSalt = process.env.HASH_ID_SALT || 'url-shortner';

    // Auth / JWT configuration
    this.jwtSecret = process.env.JWT_SECRET || 'change-this-secret-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.authCookieName = process.env.JWT_COOKIE_NAME || 'auth_token';
    this.authCookieSecure = this.env !== 'development';
    const sameSite = (process.env.JWT_COOKIE_SAMESITE || 'lax').toLowerCase();
    this.authCookieSameSite =
      sameSite === 'strict' || sameSite === 'none' ? (sameSite as 'strict' | 'none') : 'lax';

    // CORS configuration (needs to be last since it uses other properties)
    this.allowedOrigins = this._buildAllowedOrigins();
  }

  private _buildAllowedOrigins(): string[] {
    const allowedOrigins: string[] = [];

    // Always add production frontend
    allowedOrigins.push(this.frontendUrl);

    // Add localhost for development
    if (this.env === 'development' || this.debug) {
      allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
    }

    logger.debug({ allowedOrigins }, 'CORS origins configured');

    return allowedOrigins;
  }
}

