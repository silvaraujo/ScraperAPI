#!/bin/sh

echo "Starting Playwright Scraper API..."
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Host: $HOST"

exec node dist/index.js
