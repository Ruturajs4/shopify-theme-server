s#!/bin/bash

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

echo "Bootstrap completed successfully. Starting server..."

# Start the server
node dist/index.js
