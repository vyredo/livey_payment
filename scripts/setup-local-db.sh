#!/bin/bash
set -e

echo "🔧 Setting up local database for development..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📦 Generating Prisma Client..."
bunx prisma generate

echo "🗄️  Running database migrations..."
bunx prisma migrate dev --name init

echo "🌱 Seeding database (optional)..."
read -p "Do you want to seed the database with demo data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    bun run db:seed
fi

echo "✅ Local database setup complete!"
echo ""
echo "You can now:"
echo "  • Run 'bun run server:dev' to start the backend server"
echo "  • Run 'bun run dev' to start the frontend"
echo "  • Run 'bun run db:studio' to open Prisma Studio"