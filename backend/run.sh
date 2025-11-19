#!/bin/bash

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build TypeScript if dist/app.js doesn't exist
if [ ! -f "dist/app.js" ]; then
    echo "Building TypeScript..."
    npm run build
fi

# Run the Express app
echo "Starting server..."
npm start
