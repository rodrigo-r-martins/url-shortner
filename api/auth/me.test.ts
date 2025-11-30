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
vi.mock('../lib/auth.js', async () => {
  const actual = await vi.importActual('../lib/auth.js');
  return {
    ...actual,
    getAuthService: vi.fn()
  };
});

vi.mock('../lib/init.js', () => ({
  getUrlService: vi.fn(),
  getAllowedOrigins: vi.fn(() => ['http://localhost:5173'])
}));

import handler from './me.js';
import { createMockRequest, createMockResponse, createMockHeaders } from '../test-utils/mock-vercel.js';
import { getAuthService } from '../lib/auth.js';

// Mock process.env
const originalEnv = process.env;

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
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

  it('should return 401 when no cookie is provided', async () => {
    const req = createMockRequest({
      method: 'GET',
      headers: createMockHeaders()
    });
    const { res, getStatusCode, getResponseBody } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(401);
    expect(getResponseBody()).toEqual({ error: 'Not authenticated' });
  });

  it('should return 401 when token is invalid', async () => {
    const mockAuthService = {
      verifyJwt: vi.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      })
    };

    vi.mocked(getAuthService).mockReturnValue(mockAuthService as any);

    const req = createMockRequest({
      method: 'GET',
      headers: createMockHeaders('auth_token=invalid-token')
    });
    const { res, getStatusCode, getResponseBody } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(401);
    expect(getResponseBody()).toEqual({ error: 'Not authenticated' });
    expect(mockAuthService.verifyJwt).toHaveBeenCalledWith('invalid-token');
  });

  it('should return 200 with user data when token is valid', async () => {
    const mockUserPayload = {
      sub: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: 'admin'
    };

    const mockAuthService = {
      verifyJwt: vi.fn().mockReturnValue(mockUserPayload)
    };

    vi.mocked(getAuthService).mockReturnValue(mockAuthService as any);

    const token = 'valid-jwt-token';
    const req = createMockRequest({
      method: 'GET',
      headers: createMockHeaders(`auth_token=${token}`)
    });
    const { res, getStatusCode, getResponseBody } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(200);
    expect(getResponseBody()).toEqual({
      user: {
        id: mockUserPayload.sub,
        email: mockUserPayload.email,
        role: mockUserPayload.role
      }
    });
    expect(mockAuthService.verifyJwt).toHaveBeenCalledWith(token);
  });

  it('should handle cookie with different name from env', async () => {
    process.env.JWT_COOKIE_NAME = 'custom_token';

    const mockUserPayload = {
      sub: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: 'user'
    };

    const mockAuthService = {
      verifyJwt: vi.fn().mockReturnValue(mockUserPayload)
    };

    vi.mocked(getAuthService).mockReturnValue(mockAuthService as any);

    const token = 'valid-token';
    const req = createMockRequest({
      method: 'GET',
      headers: createMockHeaders(`custom_token=${token}`)
    });
    const { res, getStatusCode, getResponseBody } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(200);
    expect(getResponseBody()).toEqual({
      user: {
        id: mockUserPayload.sub,
        email: mockUserPayload.email,
        role: mockUserPayload.role
      }
    });
    expect(mockAuthService.verifyJwt).toHaveBeenCalledWith(token);
  });

  it('should handle multiple cookies correctly', async () => {
    const mockUserPayload = {
      sub: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: 'admin'
    };

    const mockAuthService = {
      verifyJwt: vi.fn().mockReturnValue(mockUserPayload)
    };

    vi.mocked(getAuthService).mockReturnValue(mockAuthService as any);

    const token = 'valid-token';
    const cookies = `other_cookie=value; auth_token=${token}; another_cookie=value2`;
    const req = createMockRequest({
      method: 'GET',
      headers: createMockHeaders(cookies)
    });
    const { res, getStatusCode, getResponseBody } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(200);
    expect(mockAuthService.verifyJwt).toHaveBeenCalledWith(token);
  });

  it('should return 401 when cookie value is empty string', async () => {
    const req = createMockRequest({
      method: 'GET',
      headers: createMockHeaders('auth_token=')
    });
    const { res, getStatusCode, getResponseBody } = createMockResponse();

    await handler(req, res);

    expect(getStatusCode()).toBe(401);
    expect(getResponseBody()).toEqual({ error: 'Not authenticated' });
  });
});

