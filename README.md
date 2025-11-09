# IMDb Ratings API

A free, open-source API for accessing IMDb ratings data. Built with Node.js, Express, and SQLite, designed for global deployment with Cloudflare caching.

## Features

- **Fast & Lightweight**: SQLite with WAL mode for concurrent reads during updates
- **Zero Downtime**: Database updates happen daily without interrupting service
- **Bulk Queries**: Retrieve ratings for up to 100 titles in a single request
- **Docker Ready**: Optimized Docker image for easy deployment to Oracle Cloud
- **Auto-Updates**: Daily automatic updates from IMDb's official dataset
- **Free & Open Source**: No API keys required, completely free to use

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/imdb-ratings-api.git
cd imdb-ratings-api
```

2. Start the service:
```bash
docker-compose up -d
```

**That's it!** The API will automatically:
- Start the server immediately at `http://localhost:3000`
- Detect the empty database
- Download and load IMDb data in the background (~5-10 minutes)
- Serve requests once data is loaded

Check progress:
```bash
# View logs
docker-compose logs -f api

# Check health
curl http://localhost:3000/api/health
```

During initial seeding, the API returns:
- Health endpoint: `{"status": "seeding", ...}`
- Rating endpoints: `503 Service Unavailable`

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

**Auto-seed enabled by default** - The server will automatically download and load IMDb data on first run if the database is empty.

To disable auto-seed, set `AUTO_SEED=false` in `.env`, then manually load data:
```bash
npm run seed
```

For development with hot reload:
```bash
npm run dev
```

## API Endpoints

### Get Single Rating

**GET** `/api/rating/:imdbId`

Retrieve rating information for a single IMDb title.

**Example Request:**
```bash
curl http://localhost:3000/api/rating/tt0111161
```

**Example Response:**
```json
{
  "imdbId": "tt0111161",
  "rating": 9.3,
  "votes": 2800000,
  "found": true
}
```

**Response (Not Found):**
```json
{
  "imdbId": "tt9999999",
  "rating": null,
  "votes": null,
  "found": false
}
```

### Get Bulk Ratings

**POST** `/api/ratings`

Retrieve ratings for multiple IMDb titles (max 100 per request).

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/ratings \
  -H "Content-Type: application/json" \
  -d '{
    "imdbIds": ["tt0111161", "tt0068646", "tt0468569"]
  }'
```

**Example Response:**
```json
[
  {
    "imdbId": "tt0111161",
    "rating": 9.3,
    "votes": 2800000,
    "found": true
  },
  {
    "imdbId": "tt0068646",
    "rating": 9.2,
    "votes": 1900000,
    "found": true
  },
  {
    "imdbId": "tt0468569",
    "rating": 9.0,
    "votes": 2700000,
    "found": true
  }
]
```

### Health Check

**GET** `/api/health`

Check the API health and status.

**Example Response:**
```json
{
  "status": "healthy",
  "lastUpdate": "2025-01-09T03:00:00.000Z",
  "totalRatings": 1350000,
  "uptime": 86400
}
```

**Status values:**
- `healthy` - Normal operation, data loaded
- `seeding` - Initial data load in progress
- `updating` - Daily update in progress
- `error` - System error occurred

## Configuration

Environment variables can be set in `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DATABASE_PATH` | `./data/ratings.db` | SQLite database file location |
| `IMDB_DATASET_URL` | IMDb URL | URL to download ratings dataset |
| `UPDATE_CRON_SCHEDULE` | `0 3 * * *` | Cron schedule for daily updates (3 AM) |
| `AUTO_SEED` | `true` | Automatically download and load data on first startup if database is empty |
| `NODE_ENV` | `production` | Environment mode |

## How It Works

### Data Source

The API uses IMDb's official non-commercial datasets, specifically `title.ratings.tsv.gz` from [https://datasets.imdbws.com/](https://datasets.imdbws.com/). This dataset is updated daily by IMDb.

### Zero-Downtime Updates

1. **SQLite WAL Mode**: The database uses Write-Ahead Logging, allowing reads to continue while writes happen
2. **Atomic Transactions**: Updates are wrapped in transactions to ensure data consistency
3. **Scheduled Updates**: Daily updates run at 3 AM (configurable) during low-traffic hours
4. **Health Monitoring**: The `/api/health` endpoint shows update status

### Caching Strategy

- **Cache-Control Headers**: All rating responses include `Cache-Control: public, max-age=86400` (24 hours)
- **Cloudflare CDN**: When deployed behind Cloudflare, responses are cached globally
- **Reduced Database Load**: Most requests are served from CDN edge locations

## Deployment

### Oracle Cloud with Docker

1. Create a Compute Instance
2. Install Docker and Docker Compose
3. Clone the repository
4. Run `docker-compose up -d`
5. Run initial seed: `docker-compose exec api npm run seed`
6. Configure Cloudflare to proxy your domain

### Environment Recommendations

- **Memory**: 512MB minimum (2GB recommended for updates)
- **Disk**: 500MB for database + app
- **CPU**: 1 core minimum

## Performance

- **Single Query**: < 5ms average response time
- **Bulk Query (100 IDs)**: < 50ms average response time
- **Database Size**: ~140MB (1.3M+ titles)
- **Update Time**: ~5-10 minutes (depends on network speed)

## Development

### Project Structure

```
.
├── src/
│   ├── config/          # Configuration management
│   ├── database/        # SQLite database layer
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   │   ├── dataLoader.ts    # Download & parse IMDb data
│   │   └── scheduler.ts     # Cron job scheduler
│   ├── scripts/         # Utility scripts
│   ├── types/           # TypeScript types
│   └── index.ts         # Application entry point
├── Dockerfile
├── docker-compose.yml
└── package.json
```

### Running Tests

Test the API locally:

```bash
# Start the server
npm run dev

# In another terminal, test endpoints
curl http://localhost:3000/api/rating/tt0111161
curl http://localhost:3000/api/health
```

## License

MIT License - see LICENSE file for details

## Credits

- Data provided by [IMDb](https://www.imdb.com/)
- IMDb datasets: [https://datasets.imdbws.com/](https://datasets.imdbws.com/)

## Disclaimer

This API uses publicly available IMDb datasets for non-commercial use. Please refer to IMDb's terms of service for usage restrictions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
