#!/bin/sh

# Stop the script on error
set -e

echo "Removing old build files..."
rm -rf dist gui-script/dist

echo "Installing dependencies..."
yarn

echo "Compiling TypeScript..."
yarn build

echo "Compiling GUI script..."
cd gui-script
yarn
yarn build
cd ..

echo "Building Docker image..."
docker build -t valtheradb-server .

echo "Done! Run the server with:"
echo "docker run -d --name valtheradb -p 14785:14785 --env-file .env valtheradb-server"

