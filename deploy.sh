#!/bin/bash
echo "Deploying Industry 4.0 AI Control Center..."

# Ensure directories exist
mkdir -p backend/database
mkdir -p datasets
mkdir -p runs

echo "Building and starting Docker containers..."
docker-compose up -d --build

echo "Deployment complete!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
