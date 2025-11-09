export interface Rating {
  tconst: string;
  averageRating: number;
  numVotes: number;
}

export interface RatingResponse {
  imdbId: string;
  rating: number | null;
  votes: number | null;
  found: boolean;
}

export interface BulkRatingRequest {
  imdbIds: string[];
}

export interface HealthStatus {
  status: 'healthy' | 'updating' | 'seeding' | 'error';
  lastUpdate: string | null;
  totalRatings: number;
  uptime: number;
}
