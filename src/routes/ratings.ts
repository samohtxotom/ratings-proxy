import { Router, Request, Response } from 'express';
import { getRating, getBulkRatings, getTotalRatings, getUpdatingStatus, getSeedingStatus, getLastUpdate, isDatabaseEmpty } from '../database';
import { RatingResponse, BulkRatingRequest, HealthStatus } from '../types';

const router = Router();

// GET /rating/:imdbId - Get single rating
router.get('/rating/:imdbId', (req: Request, res: Response) => {
  const { imdbId } = req.params;

  // Check if database is seeding
  if (getSeedingStatus()) {
    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database is being populated with initial data. Please try again in a few minutes.',
      status: 'seeding',
    });
    return;
  }

  // Validate IMDb ID format (should start with 'tt' followed by digits)
  if (!/^tt\d+$/.test(imdbId)) {
    res.status(400).json({
      error: 'Invalid IMDb ID format. Expected format: tt1234567',
    });
    return;
  }

  try {
    const rating = getRating(imdbId);

    const response: RatingResponse = {
      imdbId,
      rating: rating?.averageRating ?? null,
      votes: rating?.numVotes ?? null,
    };

    // Set cache headers for Cloudflare
    res.set('Cache-Control', 'public, max-age=86400'); // 24 hours

    if (rating) {
      res.json(response);
    } else {
      res.status(404).json(response);
    }
  } catch (error) {
    console.error('Error fetching rating:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Helper function to process bulk ratings (used by both GET and POST)
function processBulkRatings(imdbIds: string[], res: Response): void {
  // Check if database is seeding
  if (getSeedingStatus()) {
    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database is being populated with initial data. Please try again in a few minutes.',
      status: 'seeding',
    });
    return;
  }

  // Validate array
  if (!Array.isArray(imdbIds)) {
    res.status(400).json({
      error: 'Invalid request format',
    });
    return;
  }

  if (imdbIds.length === 0) {
    res.status(400).json({
      error: 'At least one IMDb ID is required',
    });
    return;
  }

  if (imdbIds.length > 100) {
    res.status(400).json({
      error: 'Maximum 100 IMDb IDs per request',
    });
    return;
  }

  // Validate all IMDb IDs
  const invalidIds = imdbIds.filter(id => !/^tt\d+$/.test(id));
  if (invalidIds.length > 0) {
    res.status(400).json({
      error: 'Invalid IMDb ID format',
      invalidIds: invalidIds.slice(0, 5), // Show first 5 invalid IDs
    });
    return;
  }

  try {
    const ratings = getBulkRatings(imdbIds);

    const response: RatingResponse[] = imdbIds.map((imdbId, index) => {
      const rating = ratings[index];
      return {
        imdbId,
        rating: rating?.averageRating ?? null,
        votes: rating?.numVotes ?? null,
      };
    });

    // Set cache headers for Cloudflare
    res.set('Cache-Control', 'public, max-age=86400'); // 24 hours

    res.json(response);
  } catch (error) {
    console.error('Error fetching bulk ratings:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}

// GET /ratings?id=tt0111161&id=tt0068646 - Get bulk ratings via query params
router.get('/ratings', (req: Request, res: Response) => {
  // Extract 'id' query params (can be string or array)
  const idParam = req.query.id;

  let imdbIds: string[];

  if (typeof idParam === 'string') {
    // Single ID: ?id=tt0111161
    imdbIds = [idParam];
  } else if (Array.isArray(idParam)) {
    // Multiple IDs: ?id=tt0111161&id=tt0068646
    imdbIds = idParam.filter(id => typeof id === 'string') as string[];
  } else {
    res.status(400).json({
      error: 'Missing id parameter. Use: /api/ratings?id=tt0111161&id=tt0068646',
    });
    return;
  }

  processBulkRatings(imdbIds, res);
});

// POST /ratings - Get bulk ratings via JSON body
router.post('/ratings', (req: Request, res: Response) => {
  const { imdbIds } = req.body as Partial<BulkRatingRequest>;

  if (!imdbIds) {
    res.status(400).json({
      error: 'Request body must contain an array of imdbIds',
    });
    return;
  }

  processBulkRatings(imdbIds, res);
});

// GET /health - Health check
router.get('/health', (req: Request, res: Response) => {
  try {
    const totalRatings = getTotalRatings();
    const isUpdating = getUpdatingStatus();
    const isSeeding = getSeedingStatus();
    const lastUpdate = getLastUpdate();

    let status: 'healthy' | 'updating' | 'seeding' | 'error' = 'healthy';
    if (isSeeding) {
      status = 'seeding';
    } else if (isUpdating) {
      status = 'updating';
    }

    const response: HealthStatus = {
      status,
      lastUpdate: lastUpdate ? lastUpdate.toISOString() : null,
      totalRatings,
      uptime: process.uptime(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      status: 'error',
      lastUpdate: null,
      totalRatings: 0,
      uptime: process.uptime(),
    });
  }
});

export default router;
