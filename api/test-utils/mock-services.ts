import type { UrlService } from '../../backend/src/services/urlService.js';
import type { AuthService } from '../../backend/src/services/authService.js';
import type { UrlResponse } from '../../backend/src/models/urlModel.js';

export function createMockUrlService(overrides?: Partial<UrlService>): Partial<UrlService> {
  return {
    listUrlsForUser: async (userId: string): Promise<UrlResponse[]> => {
      return [
        {
          shortUrl: 'http://localhost:8080/test123',
          shortCode: 'test123',
          longUrl: 'https://example.com',
          created_at: new Date('2024-01-01')
        }
      ];
    },
    shortenUrl: async (longUrl: string, userId?: string): Promise<UrlResponse> => {
      return {
        shortUrl: 'http://localhost:8080/newcode',
        shortCode: 'newcode',
        longUrl,
        created_at: new Date()
      };
    },
    getLongUrl: async (shortCode: string): Promise<string> => {
      return 'https://example.com';
    },
    deleteUrlForUser: async (userId: string, shortCode: string): Promise<void> => {
      // Mock implementation
    },
    ...overrides
  };
}

export function createMockAuthService(overrides?: Partial<AuthService>): Partial<AuthService> {
  return {
    verifyJwt: (token: string) => {
      return {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'admin'
      };
    },
    generateJwt: () => {
      return 'mock-jwt-token';
    },
    registerUser: async () => {
      return {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'admin' as const,
        created_at: new Date()
      };
    },
    validateUser: async () => {
      return null;
    },
    ...overrides
  };
}

