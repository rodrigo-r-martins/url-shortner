export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlValidationError';
    Object.setPrototypeOf(this, UrlValidationError.prototype);
  }
}

export class ShortCodeGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShortCodeGenerationError';
    Object.setPrototypeOf(this, ShortCodeGenerationError.prototype);
  }
}

export class UrlNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlNotFoundError';
    Object.setPrototypeOf(this, UrlNotFoundError.prototype);
  }
}

export class DatabaseConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConnectionError';
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }
}

