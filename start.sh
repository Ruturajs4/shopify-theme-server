s#!/bin/bash

echo "Starting Shopify Theme Manager..."

# Run bootstrap script to fetch and send theme list
echo "Running bootstrap: Fetching themes and sending to webhook..."
npx ts-node src/bootstrap.ts

# Check if bootstrap succeeded
if [ $? -ne 0 ]; then
    echo "Bootstrap failed. Exiting..."
    exit 1
fi

echo "Bootstrap completed successfully. Starting server..."

# Start the server
npm run dev
