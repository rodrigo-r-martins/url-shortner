import express, { Request, Response } from 'express';
import { getClient } from '../models/database.js';
import { AppConfig } from '../config/appConfig.js';

export function registerHealthRoutes(app: express.Application, config: AppConfig): void {
  const router = express.Router();

  router.get('/health', async (_req: Request, res: Response): Promise<Response> => {
    try {
      const client = getClient();
      await client.db('admin').command({ ping: 1 });
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
  });

  router.get('/db/health', async (_req: Request, res: Response): Promise<Response> => {
    try {
      const client = getClient();
      await client.db('admin').command({ ping: 1 });
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
  });

  router.get('/cors-debug', (req: Request, res: Response): Response => {
    const origin = req.headers.origin || 'No Origin header';
    return res.json({
      request_origin: origin,
      allowed_origins: config.allowedOrigins,
      origin_allowed: config.allowedOrigins.includes(origin as string),
      request_headers: req.headers,
      base_url: config.baseUrl
    });
  });

  app.use('/', router);
}

