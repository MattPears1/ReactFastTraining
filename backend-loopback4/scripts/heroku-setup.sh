#!/bin/bash

# Heroku Database Setup Script
# This script sets up the database on Heroku

echo "🚀 React Fast Training - Heroku Database Setup"
echo "============================================="

# Check if we're on Heroku
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found. Are you running this on Heroku?"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Set Node environment
export NODE_ENV=production

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
npm run migrate:latest

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed!"
    exit 1
fi

# Run production seed
echo "🌱 Seeding production data..."
export FORCE_PRODUCTION_SEED=true
npm run seed:run --specific 00_production_setup.ts

if [ $? -eq 0 ]; then
    echo "✅ Seeding completed successfully"
else
    echo "⚠️  Seeding failed (may already exist)"
fi

# Verify setup
echo "🔍 Verifying database setup..."
node test-connection.js

echo ""
echo "✅ Heroku database setup complete!"
echo ""
echo "Next steps:"
echo "1. Set ADMIN_PASSWORD environment variable"
echo "2. Update Stripe API keys for production"
echo "3. Configure email settings"
echo "4. Set FRONTEND_URL to your domain"