import crypto from 'crypto';
import Hashids from 'hashids';

export class ShortCodeGenerator {
  private salt: string;
  private hashids: Hashids;

  constructor(salt: string | null = null) {
    this.salt = salt || process.env.HASH_ID_SALT || 'url-shortner';
    this.hashids = new Hashids(
      this.salt,
      4, // min length
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    );
  }

  generate(): string {
    // Random number with 4 to 8 digits
    const minNumber = 1000;        // 4 digits
    const maxNumber = 99999999;    // 8 digits
    const randomNumber = crypto.randomInt(minNumber, maxNumber + 1);

    // Hash the number using hashids
    const code = this.hashids.encode(randomNumber);

    // Ensure length is between 4 and 8 characters
    return code.substring(0, 8);
  }
}

