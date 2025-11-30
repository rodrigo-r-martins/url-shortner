import type {
  VercelRequestBase,
  VercelRequestWithBody,
  VercelRequestWithQuery,
  VercelResponseFull,
  HeadersLike
} from '../lib/auth.js';

export function createMockRequest(
  overrides: Partial<VercelRequestBase> = {}
): VercelRequestBase {
  return {
    method: 'GET',
    headers: {},
    ...overrides
  };
}

export function createMockRequestWithBody<T = unknown>(
  body: T,
  overrides: Partial<VercelRequestWithBody<T>> = {}
): VercelRequestWithBody<T> {
  return {
    method: 'POST',
    headers: {},
    body,
    ...overrides
  };
}

export function createMockRequestWithQuery<T = Record<string, string | string[] | undefined>>(
  query: T,
  overrides: Partial<VercelRequestWithQuery<T>> = {}
): VercelRequestWithQuery<T> {
  return {
    method: 'GET',
    headers: {},
    query,
    ...overrides
  };
}

export function createMockResponse(): {
  res: VercelResponseFull;
  getStatusCode: () => number | null;
  getResponseBody: () => unknown;
  getHeaders: () => Record<string, string>;
  wasEndCalled: () => boolean;
} {
  let statusCode: number | null = null;
  let responseBody: unknown = null;
  const headers: Record<string, string> = {};
  let endCalled = false;

  const res: VercelResponseFull = {
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (body: unknown) => {
      responseBody = body;
    },
    end: () => {
      endCalled = true;
    }
  };

  return {
    res,
    getStatusCode: () => statusCode,
    getResponseBody: () => responseBody,
    getHeaders: () => headers,
    wasEndCalled: () => endCalled
  };
}

export function createMockHeaders(cookies?: string, origin?: string): HeadersLike {
  const headers: HeadersLike = {};
  if (cookies) {
    headers.cookie = cookies;
  }
  if (origin) {
    headers.origin = origin;
  }
  return headers;
}

