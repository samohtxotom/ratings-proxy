#!/bin/bash
# Auto-update script for IMDb Ratings API
# Checks for GitHub updates every 5 minutes and deploys automatically

cd /home/ubuntu/ratings-proxy

# Fetch latest from GitHub
git fetch origin latest

# Compare local and remote commits
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/latest)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date)] Updates detected - deploying..."

    # Pull latest code
    git pull origin latest

    # Rebuild and restart Docker container
    docker-compose build
    docker-compose up -d --no-deps --build api

    # Wait for health check
    sleep 10

    # Verify it's running
    if docker-compose ps api | grep -q "Up"; then
        echo "[$(date)] Deployment successful!"
    else
        echo "[$(date)] ERROR: Deployment failed!"
        # Optionally: rollback or send alert
    fi
else
    echo "[$(date)] No updates found"
fi
