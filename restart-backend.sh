#!/bin/bash

# Kill any existing Node servers on port 3000
echo "Stopping existing servers..."
pkill -f "node start-server.js" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 1

# Start the server
echo "Starting backend server..."
cd backend-loopback4
node start-server.js