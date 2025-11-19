import express, { Express } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { AppConfig } from './config/appConfig.js';
import { initializeDatabase, closeConnection } from './models/database.js';
import { UrlController } from './controllers/urlController.js';
import { ShortCodeGenerator } from './utils/shortCodeGenerator.js';
import { UrlValidator } from './utils/urlValidator.js';
import { UrlService } from './services/urlService.js';
import { registerUrlRoutes } from './routes/urlRoutes.js';
import { registerHealthRoutes } from './routes/healthRoutes.js';
import { logger } from './utils/logger.js';

// Configure logging
logger.info('Initializing Express application...');

// Initialize configuration
const config = new AppConfig();
logger.info({ allowedOrigins: config.allowedOrigins }, 'CORS configuration loaded');

// Create Express app
const app: Express = express();

// Middleware
app.use(cors({
  origin: config.allowedOrigins,
  credentials: false
}));
app.use(express.json());

// HTTP request logging middleware
app.use(pinoHttp({ logger }));

// Initialize database
logger.info({ databaseName: config.databaseName }, 'Initializing database connection');
initializeDatabase(config.mongodbUri, config.databaseName);

// Initialize dependencies (Dependency Injection)
logger.debug('Initializing service dependencies');
const shortCodeGenerator = new ShortCodeGenerator(config.hashIdSalt);
const urlValidator = new UrlValidator();
const urlController = new UrlController();
const urlService = new UrlService({
  urlController,
  shortCodeGenerator,
  urlValidator,
  baseUrl: config.baseUrl
});

// Register routes
logger.debug('Registering routes');
registerUrlRoutes(app, urlService);
registerHealthRoutes(app, config);

logger.info('Application initialization complete');

// Start server
const PORT = config.port;
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT, debug: config.debug }, 'Server started');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await closeConnection();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await closeConnection();
    process.exit(0);
  });
});

export default app;

