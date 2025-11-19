import express, { Express } from 'express';
import cors from 'cors';
import { AppConfig } from './config/appConfig.js';
import { initializeDatabase, closeConnection } from './models/database.js';
import { UrlController } from './controllers/urlController.js';
import { ShortCodeGenerator } from './utils/shortCodeGenerator.js';
import { UrlValidator } from './utils/urlValidator.js';
import { UrlService } from './services/urlService.js';
import { registerUrlRoutes } from './routes/urlRoutes.js';
import { registerHealthRoutes } from './routes/healthRoutes.js';

// Configure logging
console.log('Initializing Express application...');

// Initialize configuration
const config = new AppConfig();
console.log(`Allowed origins: ${config.allowedOrigins.join(', ')}`);

// Create Express app
const app: Express = express();

// Middleware
app.use(cors({
  origin: config.allowedOrigins,
  credentials: false
}));
app.use(express.json());

// Initialize database
console.log(`Initializing database connection to ${config.databaseName}`);
initializeDatabase(config.mongodbUri, config.databaseName);

// Initialize dependencies (Dependency Injection)
console.log('Initializing service dependencies');
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
console.log('Registering routes');
registerUrlRoutes(app, urlService);
registerHealthRoutes(app, config);

console.log('Application initialization complete');

// Start server
const PORT = config.port;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (debug=${config.debug})`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closeConnection();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closeConnection();
    process.exit(0);
  });
});

export default app;

