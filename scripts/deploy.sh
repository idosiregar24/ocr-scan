#!/usr/bin/env bash
set -e

echo "=== [StrukScan] Starting Deployment on aaPanel ==="

# 1. Pastikan folder uploads ada dan memiliki izin tulis
mkdir -p .uploads
chmod 775 .uploads

# 2. Install dependencies (termasuk Prisma CLI dan TypeScript untuk build)
echo "--> Installing dependencies..."
npm install

# 3. Generate Prisma Client
echo "--> Generating Prisma Client..."
npx prisma generate

# 4. Apply database migrations
echo "--> Applying database migrations..."
npx prisma migrate deploy

# 5. Build Next.js
echo "--> Building Next.js application..."
npm run build

# 6. Restart PM2 Process (jika PM2 terpasang)
if command -v pm2 &> /dev/null; then
  echo "--> Reloading/Starting PM2 process..."
  pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs
  pm2 save
fi

echo "=== [StrukScan] Deployment Successful! ==="
