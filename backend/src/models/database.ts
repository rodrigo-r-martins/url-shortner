import { MongoClient, Db, Collection } from 'mongodb';
import { UrlDocument } from './urlModel.js';

// Global client instance
let _client: MongoClient | null = null;
let _db: Db | null = null;
let _mongodbUri: string | null = null;
let _databaseName: string | null = null;

export function initializeDatabase(mongodbUri: string, databaseName: string): void {
  _mongodbUri = mongodbUri;
  _databaseName = databaseName;
}

export function getClient(): MongoClient {
  if (_mongodbUri === null) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  if (_client === null) {
    _client = new MongoClient(_mongodbUri);
  }
  return _client;
}

export async function getDb(): Promise<Db> {
  if (_databaseName === null) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  if (_db === null) {
    const client = getClient();
    await client.connect();
    _db = client.db(_databaseName);
  }
  return _db;
}

export async function getUrlsCollection(): Promise<Collection<UrlDocument>> {
  const db = await getDb();
  const collection = db.collection<UrlDocument>('urls');

  // Ensure index exists (lazy creation - will fail silently if DB not available)
  try {
    await collection.createIndex('short_code', { unique: true, background: true });
  } catch (error) {
    // Index creation will happen when MongoDB is available
    // This allows the app to start even if MongoDB is temporarily unavailable
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Could not create index (may already exist or DB unavailable):', errorMessage);
  }

  return collection;
}

export async function closeConnection(): Promise<void> {
  if (_client) {
    await _client.close();
    _client = null;
    _db = null;
  }
}

