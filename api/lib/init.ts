import { MongoClient, Db, Collection } from 'mongodb';
import { UrlController } from '../../backend/src/controllers/urlController.js';
import { ShortCodeGenerator } from '../../backend/src/utils/shortCodeGenerator.js';
import { UrlValidator } from '../../backend/src/utils/urlValidator.js';
import { UrlService } from '../../backend/src/services/urlService.js';
import { UrlDocument } from '../../backend/src/models/urlModel.js';

// Global connection cache for serverless functions
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let cachedCollection: Collection<UrlDocument> | null = null;

export async function getDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
  const databaseName = process.env.DATABASE_NAME || 'urlshortener';

  if (!cachedClient) {
    cachedClient = new MongoClient(mongodbUri);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(databaseName);

  // Ensure index exists
  try {
    const collection = cachedDb.collection<UrlDocument>('urls');
    await collection.createIndex('short_code', { unique: true, background: true });
    cachedCollection = collection;
  } catch (error) {
    // Index may already exist, ignore
    if (!cachedCollection) {
      cachedCollection = cachedDb.collection<UrlDocument>('urls');
    }
  }

  return cachedDb;
}

async function getUrlsCollection(): Promise<Collection<UrlDocument>> {
  if (cachedCollection) {
    return cachedCollection;
  }
  
  const db = await getDatabase();
  cachedCollection = db.collection<UrlDocument>('urls');
  return cachedCollection;
}

export async function getUrlService(): Promise<UrlService> {
  // Base URL used to build the public short URLs.
  // In production on Vercel, this should resolve to: https://<your-domain>/
  // and *not* include `/api`, so that short links look like `/<shortCode>`.
  const baseUrl =
    process.env.BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:8080');

  const hashIdSalt = process.env.HASH_ID_SALT || 'url-shortner';

  const shortCodeGenerator = new ShortCodeGenerator(hashIdSalt);
  const urlValidator = new UrlValidator();

  // Initialize database and collection
  const collection = await getUrlsCollection();
  const urlController = new UrlController(collection);

  return new UrlService({
    urlController,
    shortCodeGenerator,
    urlValidator,
    baseUrl
  });
}

export function getAllowedOrigins(): string[] {
  const frontendUrl = process.env.FRONTEND_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
  
  const origins: string[] = [frontendUrl];
  
  // Add localhost for development
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:5173', 'http://127.0.0.1:5173');
  }
  
  // Add custom allowed origins from env
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(','));
  }
  
  return origins;
}

