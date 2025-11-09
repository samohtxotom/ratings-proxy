import https from 'https';
import fs from 'fs';
import zlib from 'zlib';
import readline from 'readline';
import { config } from '../config';
import { Rating } from '../types';
import { bulkInsertRatings, setUpdating, setSeeding } from '../database';

const TEMP_FILE = './data/title.ratings.tsv.gz';
const BATCH_SIZE = 10000;

export async function downloadDataset(): Promise<string> {
  return new Promise((resolve, reject) => {
    const dir = './data';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(TEMP_FILE);

    console.log(`Downloading dataset from ${config.imdbDatasetUrl}...`);

    https.get(config.imdbDatasetUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      let downloaded = 0;

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        if (totalSize > 0) {
          const percent = ((downloaded / totalSize) * 100).toFixed(1);
          process.stdout.write(`\rDownloading: ${percent}%`);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('\nDownload complete');
        resolve(TEMP_FILE);
      });
    }).on('error', (err) => {
      fs.unlink(TEMP_FILE, () => {});
      reject(err);
    });
  });
}

export async function parseAndLoadData(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
      input: fileStream.pipe(gunzip),
      crlfDelay: Infinity,
    });

    let batch: Rating[] = [];
    let totalProcessed = 0;
    let isFirstLine = true;

    console.log('Parsing and loading data...');

    rl.on('line', (line) => {
      // Skip header line
      if (isFirstLine) {
        isFirstLine = false;
        return;
      }

      const parts = line.split('\t');
      if (parts.length !== 3) {
        return; // Skip malformed lines
      }

      const [tconst, averageRating, numVotes] = parts;

      // Validate data
      const rating = parseFloat(averageRating);
      const votes = parseInt(numVotes, 10);

      if (isNaN(rating) || isNaN(votes)) {
        return; // Skip invalid data
      }

      batch.push({
        tconst,
        averageRating: rating,
        numVotes: votes,
      });

      // Insert batch when it reaches BATCH_SIZE
      if (batch.length >= BATCH_SIZE) {
        bulkInsertRatings(batch);
        totalProcessed += batch.length;
        process.stdout.write(`\rProcessed: ${totalProcessed.toLocaleString()} records`);
        batch = [];
      }
    });

    rl.on('close', () => {
      // Insert remaining records
      if (batch.length > 0) {
        bulkInsertRatings(batch);
        totalProcessed += batch.length;
      }

      console.log(`\nTotal records loaded: ${totalProcessed.toLocaleString()}`);
      resolve(totalProcessed);
    });

    rl.on('error', reject);
    fileStream.on('error', reject);
    gunzip.on('error', reject);
  });
}

export async function updateDatabase(): Promise<void> {
  try {
    setUpdating(true);
    console.log('Starting database update...');

    const filePath = await downloadDataset();
    await parseAndLoadData(filePath);

    // Clean up temporary file
    if (fs.existsSync(TEMP_FILE)) {
      fs.unlinkSync(TEMP_FILE);
      console.log('Temporary file cleaned up');
    }

    setUpdating(false);
    console.log('Database update complete');
  } catch (error) {
    setUpdating(false);
    console.error('Error updating database:', error);
    throw error;
  }
}

export async function seedDatabase(): Promise<void> {
  try {
    setSeeding(true);
    console.log('Starting initial database seed...');

    const filePath = await downloadDataset();
    await parseAndLoadData(filePath);

    // Clean up temporary file
    if (fs.existsSync(TEMP_FILE)) {
      fs.unlinkSync(TEMP_FILE);
      console.log('Temporary file cleaned up');
    }

    setSeeding(false);
    console.log('Database seed complete');
  } catch (error) {
    setSeeding(false);
    console.error('Error seeding database:', error);
    throw error;
  }
}
