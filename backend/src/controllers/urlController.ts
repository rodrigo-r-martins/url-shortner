import { Collection, ObjectId } from 'mongodb';
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

  async findByLongUrl(longUrl: string, userId?: string): Promise<UrlModel | null> {
    const collection = await this.getCollection();
    const query: Partial<UrlDocument> = { long_url: longUrl };

    if (userId) {
      query.user_id = new ObjectId(userId);
    }

    const doc = await collection.findOne(query);
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

  async create(
    shortCode: string,
    longUrl: string,
    createdAt: Date | null = null,
    userId?: string
  ): Promise<UrlModel> {
    if (createdAt === null) {
      createdAt = new Date();
    }

    const urlModel = new UrlModel({
      shortCode,
      longUrl,
      createdAt,
      userId: userId ? new ObjectId(userId) : null
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

  async findAllByUserId(userId: string): Promise<UrlModel[]> {
    const collection = await this.getCollection();
    const docs = await collection
      .find({ user_id: new ObjectId(userId) })
      .sort({ created_at: -1 })
      .toArray();

    return docs.map((doc) => UrlModel.fromDb(doc));
  }

  async deleteByShortCodeForUser(userId: string, shortCode: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({
      short_code: shortCode,
      user_id: new ObjectId(userId)
    });

    return result.deletedCount === 1;
  }
}

