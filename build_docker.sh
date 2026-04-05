#!/bin/sh

set -e

echo "Installing dependencies..."
npm install

echo "Compiling TypeScript..."
npm run build

echo "Building Docker image..."
docker build -t valtheradb-server .

mkdir -p volumes

echo "Done! Run the server with:"
echo "docker run -d --name valtheradb -p 14785:14785 --env-file .env -v \"\$(pwd)/volumes:/app/volumes\" valtheradb-server"
