#!/bin/bash

# Set your Docker Hub username
DOCKER_USERNAME="atiq296"
IMAGE_NAME="collabeditor"

echo "Building and pushing images to Docker Hub..."

# Build frontend image
echo "Building frontend image..."
cd client/frontend
docker build -t ${DOCKER_USERNAME}/${IMAGE_NAME}-frontend:latest .

# Build backend image
echo "Building backend image..."
cd ../../server
docker build -t ${DOCKER_USERNAME}/${IMAGE_NAME}-backend:latest .

# Push to Docker Hub
echo "Pushing to Docker Hub..."
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}-frontend:latest
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}-backend:latest

echo "Images pushed successfully!"
