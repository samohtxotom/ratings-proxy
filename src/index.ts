import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from './config';
import { initDatabase, closeDatabase, isDatabaseEmpty } from './database';
import ratingsRouter from './routes/ratings';
import { startScheduler, stopScheduler } from './services/scheduler';
import { seedDatabase } from './services/dataLoader';

const app: Application = express();

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Routes
app.use('/api', ratingsRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'IMDb Ratings API',
    version: '1.0.0',
    description: 'Free, open-source API for IMDb ratings data',
    endpoints: {
      'GET /api/rating/:imdbId': 'Get rating for a single IMDb ID',
      'POST /api/ratings': 'Get ratings for multiple IMDb IDs (body: { imdbIds: string[] })',
      'GET /api/health': 'Health check and system status',
    },
    documentation: 'https://github.com/yourusername/imdb-ratings-api',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.isDevelopment ? err.message : undefined,
  });
});

// Initialize database and start server
async function start() {
  try {
    console.log('Initializing database...');
    initDatabase();

    // Start server first so health checks work
    app.listen(config.port, () => {
      console.log(`
┌─────────────────────────────────────────┐
│   IMDb Ratings API                      │
│   Server running on port ${config.port}          │
│   Environment: ${config.nodeEnv}           │
│   Database: ${config.databasePath}     │
└─────────────────────────────────────────┘
      `);
    });

    // Check if database is empty and auto-seed if enabled
    if (config.autoSeed && isDatabaseEmpty()) {
      console.log('Database is empty. Starting auto-seed in background...');
      console.log('API is available but will return 503 until seeding completes.');

      // Run seed in background (non-blocking)
      seedDatabase()
        .then(() => {
          console.log('Auto-seed completed successfully!');
          console.log('API is now fully operational.');
        })
        .catch((error) => {
          console.error('Auto-seed failed:', error);
          console.error('Please run `npm run seed` manually to load data.');
        });
    } else if (!config.autoSeed && isDatabaseEmpty()) {
      console.log('⚠️  Database is empty. Run `npm run seed` to load IMDb data.');
    } else {
      console.log('Database ready with existing data.');
    }

    console.log('Starting scheduler...');
    startScheduler();

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  stopScheduler();
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  stopScheduler();
  closeDatabase();
  process.exit(0);
});

start();
