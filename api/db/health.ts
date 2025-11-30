import { getDatabase } from '../lib/init.js';

export default async function handler(
  req: {
    method?: string;
  },
  res: {
    status: (code: number) => typeof res;
    json: (body: unknown) => void;
  }
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDatabase();
    await db.admin().ping();
    
    return res.status(200).json({
      status: 'healthy',
      database: 'connected'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: errorMessage
    });
  }
}

