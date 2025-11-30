import { Collection } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { getUsersCollection } from '../models/database.js';
import { UserDocument, UserModel, UserRole, UserSafeResponse } from '../models/userModel.js';
import { logger } from '../utils/logger.js';

export interface AuthServiceConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  private _collection: Collection<UserDocument> | null = null;
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private readonly bcryptSaltRounds = 12;

  constructor({ jwtSecret, jwtExpiresIn }: AuthServiceConfig) {
    if (!jwtSecret) {
      throw new Error('JWT secret is required for AuthService');
    }
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn || '15m';
  }

  private async getCollection(): Promise<Collection<UserDocument>> {
    if (this._collection === null) {
      this._collection = await getUsersCollection();
    }
    return this._collection;
  }

  async registerUser(email: string, password: string, role: UserRole = 'admin'): Promise<UserSafeResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const collection = await this.getCollection();

    const existing = await collection.findOne({ email: normalizedEmail });
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, this.bcryptSaltRounds);
    const user = new UserModel({
      email: normalizedEmail,
      passwordHash,
      role
    });

    const result = await collection.insertOne(user.toDb());
    user._id = result.insertedId;

    logger.info({ email: normalizedEmail, role }, 'User registered');

    return user.toSafeResponse();
  }

  async validateUser(email: string, password: string): Promise<UserModel | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const collection = await this.getCollection();

    const doc = await collection.findOne({ email: normalizedEmail });
    if (!doc) {
      return null;
    }

    const user = UserModel.fromDb(doc);
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return null;
    }

    return user;
  }

  generateJwt(user: UserModel): string {
    if (!user._id) {
      throw new Error('User must have an id to generate JWT');
    }

    const payload: JwtPayload = {
      sub: user._id.toHexString(),
      email: user.email,
      role: user.role
    };

    const options: SignOptions = {
      expiresIn: this.jwtExpiresIn
    };

    return jwt.sign(payload, this.jwtSecret, options);
  }

  verifyJwt(token: string): JwtPayload {
    return jwt.verify(token, this.jwtSecret) as JwtPayload;
  }
}


