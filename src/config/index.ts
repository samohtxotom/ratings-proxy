import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databasePath: process.env.DATABASE_PATH || './data/ratings.db',
  imdbDatasetUrl: process.env.IMDB_DATASET_URL || 'https://datasets.imdbws.com/title.ratings.tsv.gz',
  updateCronSchedule: process.env.UPDATE_CRON_SCHEDULE || '0 3 * * *',
  autoSeed: process.env.AUTO_SEED !== 'false', // Default to true
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
};
