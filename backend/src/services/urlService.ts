import { UrlController } from '../controllers/urlController.js';
import { ShortCodeGenerator } from '../utils/shortCodeGenerator.js';
import { UrlValidator } from '../utils/urlValidator.js';
import {
  ShortCodeGenerationError,
  UrlNotFoundError,
  UrlValidationError
} from '../exceptions/urlExceptions.js';
import { UrlResponse } from '../models/urlModel.js';

interface MongoError extends Error {
  code?: number;
}

export interface UrlServiceConfig {
  urlController: UrlController;
  shortCodeGenerator: ShortCodeGenerator;
  urlValidator: UrlValidator;
  baseUrl: string;
  maxAttempts?: number;
}

export class UrlService {
  private urlController: UrlController;
  private shortCodeGenerator: ShortCodeGenerator;
  private urlValidator: UrlValidator;
  private baseUrl: string;
  private maxAttempts: number;

  constructor({
    urlController,
    shortCodeGenerator,
    urlValidator,
    baseUrl,
    maxAttempts = 10
  }: UrlServiceConfig) {
    this.urlController = urlController;
    this.shortCodeGenerator = shortCodeGenerator;
    this.urlValidator = urlValidator;
    this.baseUrl = baseUrl;
    this.maxAttempts = maxAttempts;
  }

  async shortenUrl(longUrl: string): Promise<UrlResponse> {
    // Validate URL
    if (!this.urlValidator.validate(longUrl)) {
      throw new UrlValidationError('Invalid URL format. URL must start with http:// or https://');
    }

    // Check if URL already exists
    const existing = await this.urlController.findByLongUrl(longUrl);
    if (existing) {
      return existing.toResponseDict(this.baseUrl);
    }

    // Generate new short code
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const shortCode = this.shortCodeGenerator.generate();

      try {
        const urlModel = await this.urlController.create(shortCode, longUrl);
        return urlModel.toResponseDict(this.baseUrl);
      } catch (error) {
        // Check if it's a duplicate key error (MongoDB error code 11000)
        const mongoError = error as MongoError;
        if (mongoError.code === 11000) {
          // If short code already exists, try again
          continue;
        }
        // Re-throw other errors
        throw error;
      }
    }

    // If we couldn't generate a unique code after max attempts
    throw new ShortCodeGenerationError('Failed to generate unique short code after maximum attempts');
  }

  async getLongUrl(shortCode: string): Promise<string> {
    const urlModel = await this.urlController.findByShortCode(shortCode);
    if (!urlModel) {
      throw new UrlNotFoundError('Short URL not found');
    }

    return urlModel.longUrl;
  }
}

