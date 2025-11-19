import { Collection } from 'mongodb';
import { getUrlsCollection } from '../models/database.js';
import { UrlModel, UrlDocument } from '../models/urlModel.js';

export class UrlController {
  private _collection: Collection<UrlDocument> | null = null;

  constructor(collection: Collection<UrlDocument> | null = null) {
    this._collection = collection;
  }

  private async getCollection(): Promise<Collection<UrlDocument>> {
    if (this._collection === null) {
      this._collection = await getUrlsCollection();
    }
    return this._collection;
  }

  async findByLongUrl(longUrl: string): Promise<UrlModel | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ long_url: longUrl });
    if (doc) {
      return UrlModel.fromDb(doc);
    }
    return null;
  }

  async findByShortCode(shortCode: string): Promise<UrlModel | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ short_code: shortCode });
    if (doc) {
      return UrlModel.fromDb(doc);
    }
    return null;
  }

  async create(shortCode: string, longUrl: string, createdAt: Date | null = null): Promise<UrlModel> {
    if (createdAt === null) {
      createdAt = new Date();
    }

    const urlModel = new UrlModel({
      shortCode,
      longUrl,
      createdAt
    });

    const collection = await this.getCollection();
    const result = await collection.insertOne(urlModel.toDb());
    urlModel._id = result.insertedId;

    return urlModel;
  }

  async existsByShortCode(shortCode: string): Promise<boolean> {
    const collection = await this.getCollection();
    const count = await collection.countDocuments({ short_code: shortCode }, { limit: 1 });
    return count > 0;
  }

  async existsByLongUrl(longUrl: string): Promise<boolean> {
    const collection = await this.getCollection();
    const count = await collection.countDocuments({ long_url: longUrl }, { limit: 1 });
    return count > 0;
  }
}

