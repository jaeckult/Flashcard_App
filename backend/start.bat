@echo off
echo 🚀 Starting Burbly Backend...

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Please copy env-template.txt to .env and configure it.
    echo copy env-template.txt .env
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npx prisma generate

REM Push database schema
echo 🗄️  Setting up database...
npx prisma db push

REM Seed database
echo 🌱 Seeding database...
node seed.js

REM Start development server
echo 🔥 Starting development server...
npm run dev
