#!/bin/bash

echo "Starting Shopify Theme Manager..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
npm run build

# Run bootstrap script to fetch and send theme list
echo "Running bootstrap: Fetching themes and sending to webhook..."
node dist/bootstrap.js

# Check if bootstrap succeeded
if [ $? -ne 0 ]; then
    echo "Bootstrap failed. Exiting..."
    exit 1
fi

echo "Bootstrap completed successfully. Starting servers..."

# Start the proxy server in the background
echo "Starting proxy server on port 3005..."
node dist/proxy-server.js &

# Start the main API server
echo "Starting main API server..."
node dist/index.js
