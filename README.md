# IMDb Ratings API

Agregarr hosts a free open source IMDb ratings proxy for both Movies and TV Shows, built with Node.js, Express, and SQLite.

## API Endpoints

### Get Single Rating

**GET** `https://api.agregarr.org/api/rating/:imdbId`

Retrieve rating information for a single IMDb title.

**Example Request:**
```bash
curl https://api.agregarr.org/api/rating/tt0111161
```

**Example Response:**
```json
{
  "imdbId": "tt0111161",
  "rating": 9.3,
  "votes": 2800000
}
```

**Response (Not Found):**
```json
{
  "imdbId": "tt9999999",
  "rating": null,
  "votes": null
}
```

Note: If `rating` and `votes` are `null`, the title was not found in the database.

### Get Bulk Ratings

Retrieve ratings for multiple IMDb titles (max 100 per request).

**Method 1: GET (Browser-friendly)**

`https://api.agregarr.org/api/ratings?id=tt0111161&id=tt0068646&id=tt0468569`

You can paste this directly in a browser! Just add `?id=IMDB_ID` for each title.

**Example Request:**
```bash
curl "https://api.agregarr.org/api/ratings?id=tt0111161&id=tt0068646&id=tt0468569"
```

**Method 2: POST (For applications)**

```bash
curl -X POST https://api.agregarr.org/api/ratings \
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
    "votes": 2800000
  },
  {
    "imdbId": "tt0068646",
    "rating": 9.2,
    "votes": 1900000
  },
  {
    "imdbId": "tt0468569",
    "rating": 9.0,
    "votes": 2700000
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

### Data Source

The API uses IMDb's official non-commercial datasets, specifically `title.ratings.tsv.gz` from [https://datasets.imdbws.com/](https://datasets.imdbws.com/). This dataset is updated daily by IMDb.

## License

MIT License - see LICENSE file for details

## Disclaimer

This API uses publicly available IMDb datasets for non-commercial use. Please refer to IMDb's terms of service for usage restrictions.

