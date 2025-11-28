import { ObjectId } from 'mongodb';

export type UserRole = 'admin' | 'user';

export interface UserDocument {
  _id?: ObjectId;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export interface UserSafeResponse {
  id: string;
  email: string;
  role: UserRole;
  created_at: Date;
}

export class UserModel {
  public _id: ObjectId | null;
  public email: string;
  public passwordHash: string;
  public role: UserRole;
  public createdAt: Date;

  constructor({
    email,
    passwordHash,
    role = 'user',
    createdAt = null,
    _id = null
  }: {
    email: string;
    passwordHash: string;
    role?: UserRole;
    createdAt?: Date | null;
    _id?: ObjectId | null;
  }) {
    this._id = _id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.createdAt = createdAt || new Date();
  }

  toDb(): UserDocument {
    const result: UserDocument = {
      email: this.email.toLowerCase(),
      password_hash: this.passwordHash,
      role: this.role,
      created_at: this.createdAt
    };

    if (this._id) {
      result._id = this._id;
    }

    return result;
  }

  static fromDb(doc: UserDocument): UserModel {
    return new UserModel({
      _id: doc._id || null,
      email: doc.email,
      passwordHash: doc.password_hash,
      role: doc.role,
      createdAt: doc.created_at
    });
  }

  toSafeResponse(): UserSafeResponse {
    return {
      id: this._id ? this._id.toHexString() : '',
      email: this.email,
      role: this.role,
      created_at: this.createdAt
    };
  }
}


