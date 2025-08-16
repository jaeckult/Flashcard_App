#!/bin/bash

echo "🚀 Starting Burbly Backend..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please copy env-template.txt to .env and configure it."
    echo "cp env-template.txt .env"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️  Setting up database..."
npx prisma db push

# Seed database
echo "🌱 Seeding database..."
node seed.js

# Start development server
echo "🔥 Starting development server..."
npm run dev
