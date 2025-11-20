# IMDb Ratings API

Agregarr hosts a free open source IMDb ratings proxy for both Movies and TV Shows. 

You are welcome to use this in your own open source project, no API key required. Any issues can be reported on the [GitHub page](https://github.com/agregarr/imdb-ratings-api/issues)

## API Endpoints

### Get Ratings

**GET** `https://api.agregarr.org/api/ratings?id=...&id=...`

Retrieve ratings for one or more IMDb titles (max 100 per request).

**Single ID:**
```bash
curl "https://api.agregarr.org/api/ratings?id=tt0111161"
```

**Multiple IDs:**
```bash
curl "https://api.agregarr.org/api/ratings?id=tt0111161&id=tt0068646&id=tt0468569"
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
  }
]
```

**Not Found:**
If a title isn't in the database, `rating` and `votes` will be `null`:
```json
[
  {
    "imdbId": "tt9999999",
    "rating": null,
    "votes": null
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

The API uses IMDb's official non-commercial datasets, `title.ratings.tsv.gz` from [https://datasets.imdbws.com/](https://datasets.imdbws.com/). This dataset is updated daily by IMDb. Please refer to IMDb's terms of service for usage restrictions.

