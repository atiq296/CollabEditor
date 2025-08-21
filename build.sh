#!/bin/bash

echo "Building CollabEditor application..."

# Build frontend
echo "Building frontend..."
cd client/frontend
docker build -t collabeditor-frontend .

# Build backend
echo "Building backend..."
cd ../../server
docker build -t collabeditor-backend .

# Build with docker-compose
echo "Building with docker-compose..."
cd ..
docker-compose build

echo "Build completed!"
