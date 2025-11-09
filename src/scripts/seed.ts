import { initDatabase } from '../database';
import { updateDatabase } from '../services/dataLoader';

async function seed() {
  console.log('Starting initial data seed...');

  try {
    // Initialize database
    initDatabase();

    // Download and load data
    await updateDatabase();

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
