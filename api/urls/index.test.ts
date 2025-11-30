import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock backend dependencies first to avoid module resolution errors
vi.mock('../../backend/src/controllers/urlController.js', () => ({
  UrlController: vi.fn()
}));

vi.mock('../../backend/src/utils/shortCodeGenerator.js', () => ({
  ShortCodeGenerator: vi.fn()
}));

vi.mock('../../backend/src/utils/urlValidator.js', () => ({
  UrlValidator: vi.fn()
}));

vi.mock('../../backend/src/services/urlService.js', () => ({
  UrlService: vi.fn()
}));

vi.mock('../../backend/src/models/urlModel.js', () => ({
  UrlModel: vi.fn(),
  UrlDocument: {}
}));

vi.mock('../../backend/src/exceptions/urlExceptions.js', () => ({
  UrlNotFoundError: class UrlNotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UrlNotFoundError';
    }
  },
  UrlValidationError: class UrlValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UrlValidationError';
    }
  },
  ShortCodeGenerationError: class ShortCodeGenerationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ShortCodeGenerationError';
    }
  }
}));

vi.mock('../../backend/src/models/database.js', () => ({
  initializeDatabase: vi.fn()
}));

vi.mock('../../backend/src/services/authService.js', () => ({
  AuthService: vi.fn()
}));

vi.mock('mongodb', () => ({
  MongoClient: vi.fn(),
  Db: vi.fn(),
  Collection: vi.fn()
}));

// Mock the modules
vi.mock('../lib/init.js', () => ({
  getUrlService: vi.fn(),
  getAllowedOrigins: vi.fn(() => ['http://localhost:5173'])
}));


vi.mock('../lib/auth.js', () => ({
  applyCors: vi.fn((res: any, headers: any, methods: string) => {
    const origin = headers.origin;
    if (origin && ['http://localhost:5173'].includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }),
  getUserIdFromHeaders: vi.fn(() => null),
  VercelRequestBase: {},
  VercelResponseFull: {}
}));

import handler from './index.js';
import { createMockRequest, createMockResponse, createMockHeaders } from '../test-utils/mock-vercel.js';
import { getUrlService } from '../lib/init.js';
import { getUserIdFromHeaders } from '../lib/auth.js';

// Mock process.env
const originalEnv = process.env;

describe('GET /api/urls/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret',
      JWT_COOKIE_NAME: 'auth_token',
      FRONTEND_URL: 'http://localhost:5173',
      NODE_ENV: 'test'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 405 for non-GET methods', async () => {
    const req = createMockRequest({ method: 'POST' });
    const { res, getStatusCode } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(405);
  });

  it('should return 401 when no authentication token is provided', async () => {
    const req = createMockRequest({
      method: 'GET',
      headers: createMockHeaders()
    });
    const { res, getStatusCode, getResponseBody } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(401);
    expect(getResponseBody()).toEqual({ error: 'Not authenticated' });
  });

  it('should return 401 when JWT verification fails', async () => {
    vi.mocked(getUserIdFromHeaders).mockReturnValue(null);

    const req = createMockRequest({
      method: 'GET',
      headers: createMockHeaders('auth_token=invalid-token')
    });
    const { res, getStatusCode, getResponseBody } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(401);
    expect(getResponseBody()).toEqual({ error: 'Not authenticated' });
  });

  it('should return 200 with user URLs when authenticated', async () => {
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockUrls = [
      {
        shortUrl: 'http://localhost:8080/test123',
        shortCode: 'test123',
        longUrl: 'https://example.com',
        created_at: new Date('2024-01-01')
      },
      {
        shortUrl: 'http://localhost:8080/test456',
        shortCode: 'test456',
        longUrl: 'https://example.org',
        created_at: new Date('2024-01-02')
      }
    ];

    vi.mocked(getUserIdFromHeaders).mockReturnValue(mockUserId);

    const mockUrlService = {
      listUrlsForUser: vi.fn().mockResolvedValue(mockUrls)
    };

    vi.mocked(getUrlService).mockResolvedValue(mockUrlService as any);

    const req = createMockRequest({
      method: 'GET',
      headers: createMockHeaders(`auth_token=valid-token`)
    });
    const { res, getStatusCode, getResponseBody } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(200);
    expect(getResponseBody()).toEqual({ urls: mockUrls });
    expect(mockUrlService.listUrlsForUser).toHaveBeenCalledWith(mockUserId);
  });

  it('should handle OPTIONS request for CORS preflight', async () => {
    const req = createMockRequest({
      method: 'OPTIONS',
      headers: createMockHeaders(undefined, 'http://localhost:5173')
    });
    const { res, getStatusCode, wasEndCalled, getHeaders } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(200);
    expect(wasEndCalled()).toBe(true);
    expect(getHeaders()['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
  });

  it('should return 500 when service throws an unexpected error', async () => {
    const mockUserId = '507f1f77bcf86cd799439011';

    vi.mocked(getUserIdFromHeaders).mockReturnValue(mockUserId);

    const mockUrlService = {
      listUrlsForUser: vi.fn().mockRejectedValue(new Error('Database connection failed'))
    };

    vi.mocked(getUrlService).mockResolvedValue(mockUrlService as any);

    const req = createMockRequest({
      method: 'GET',
      headers: createMockHeaders('auth_token=valid-token')
    });
    const { res, getStatusCode, getResponseBody } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(500);
    expect(getResponseBody()).toEqual({
      error: 'Server error: Database connection failed'
    });
  });

  it('should return empty array when user has no URLs', async () => {
    const mockUserId = '507f1f77bcf86cd799439011';

    vi.mocked(getUserIdFromHeaders).mockReturnValue(mockUserId);

    const mockUrlService = {
      listUrlsForUser: vi.fn().mockResolvedValue([])
    };

    vi.mocked(getUrlService).mockResolvedValue(mockUrlService as any);

    const req = createMockRequest({
      method: 'GET',
      headers: createMockHeaders('auth_token=valid-token')
    });
    const { res, getStatusCode, getResponseBody } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(200);
    expect(getResponseBody()).toEqual({ urls: [] });
  });
});

