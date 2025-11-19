import dotenv from 'dotenv';

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
  public readonly hashIdSalt: string;

  constructor() {
    this._initializeConfig();
  }

  private _initializeConfig(): void {
    // Server configuration
    this.port = parseInt(process.env.PORT || '8080', 10);
    this.debug = process.env.FLASK_DEBUG === 'True' || process.env.NODE_ENV === 'development';
    this.env = process.env.FLASK_ENV || process.env.NODE_ENV || 'development';

    // Application URLs
    this.baseUrl = process.env.BASE_URL || 'http://localhost:8080';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // CORS configuration
    this.allowedOrigins = this._buildAllowedOrigins();

    // Database configuration
    this.mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
    this.databaseName = process.env.DATABASE_NAME || 'urlshortener';

    // Hashids configuration
    this.hashIdSalt = process.env.HASH_ID_SALT || 'url-shortner';
  }

  private _buildAllowedOrigins(): string[] {
    const allowedOrigins: string[] = [];

    // Always add production frontend
    allowedOrigins.push(this.frontendUrl);

    // Add localhost for development
    if (this.env === 'development' || this.debug) {
      allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
    }

    console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);

    return allowedOrigins;
  }
}

