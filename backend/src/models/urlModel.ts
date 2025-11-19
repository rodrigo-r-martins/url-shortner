import { ObjectId } from 'mongodb';

export interface UrlResponse {
  shortUrl: string;
  shortCode: string;
  longUrl: string;
  created_at: Date;
}

export interface UrlDocument {
  _id?: ObjectId;
  short_code: string;
  long_url: string;
  created_at: Date;
}

export class UrlModel {
  public _id: ObjectId | null;
  public shortCode: string;
  public longUrl: string;
  public createdAt: Date;

  constructor({
    shortCode,
    longUrl,
    createdAt = null,
    _id = null
  }: {
    shortCode: string;
    longUrl: string;
    createdAt?: Date | null;
    _id?: ObjectId | null;
  }) {
    this._id = _id;
    this.shortCode = shortCode;
    this.longUrl = longUrl;
    this.createdAt = createdAt || new Date();
  }

  toDict(): UrlDocument {
    const result: UrlDocument = {
      short_code: this.shortCode,
      long_url: this.longUrl,
      created_at: this.createdAt
    };

    if (this._id) {
      result._id = this._id;
    }

    return result;
  }

  static fromDict(doc: UrlDocument): UrlModel {
    return new UrlModel({
      _id: doc._id || null,
      shortCode: doc.short_code,
      longUrl: doc.long_url,
      createdAt: doc.created_at
    });
  }

  toResponseDict(baseUrl: string): UrlResponse {
    return {
      shortUrl: `${baseUrl}/${this.shortCode}`,
      shortCode: this.shortCode,
      longUrl: this.longUrl,
      created_at: this.createdAt
    };
  }
}

