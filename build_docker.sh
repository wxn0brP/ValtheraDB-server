#!/bin/sh

# Stop the script on error
set -e

echo "Installing dependencies..."
npm install

echo "Compiling TypeScript..."
npm run build

echo "Building Docker image..."
docker build -t valtheradb-server .

echo "Done! Run the server with:"
echo "docker run -d --name valtheradb -p 14785:14785 --env-file .env valtheradb-server"

