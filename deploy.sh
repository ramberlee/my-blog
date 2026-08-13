#!/bin/bash
# Blog deployment script
# Usage: ./deploy.sh [build|start|stop|restart|logs|update]

set -e

ACTION=${1:-"start"}

case $ACTION in
  build)
    echo "Building Docker image..."
    docker compose build --no-cache
    echo "Build complete!"
    ;;
  start)
    echo "Starting blog..."
    docker compose up -d
    echo "Blog is running at http://localhost:3001"
    ;;
  stop)
    echo "Stopping blog..."
    docker compose down
    ;;
  restart)
    echo "Restarting blog..."
    docker compose restart
    ;;
  logs)
    docker compose logs -f --tail=100
    ;;
  update)
    echo "Updating blog..."
    git pull
    docker compose build
    docker compose up -d
    echo "Update complete!"
    ;;
  backup)
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    echo "Creating backup..."
    docker compose exec blog tar czf /tmp/backup_${TIMESTAMP}.tar.gz -C /app/server data uploads
    docker cp my-blog:/tmp/backup_${TIMESTAMP}.tar.gz ./backup_${TIMESTAMP}.tar.gz
    echo "Backup saved to ./backup_${TIMESTAMP}.tar.gz"
    ;;
  *)
    echo "Usage: ./deploy.sh [build|start|stop|restart|logs|update|backup]"
    exit 1
    ;;
esac
