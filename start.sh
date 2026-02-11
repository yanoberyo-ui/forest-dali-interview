#!/bin/sh
set -e

echo "🌳 Forest Dali AI Interview - Starting..."

# Run database migration
echo "📦 Running database migration..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss

# Seed admin user if not exists
echo "👤 Seeding admin user..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  const email = process.env.ADMIN_EMAIL || 'admin@forestdali.co.jp';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.create({
      data: { email, passwordHash, name: '管理者' }
    });
    console.log('Admin user created:', email);
  } else {
    console.log('Admin user already exists:', email);
  }
  await prisma.\$disconnect();
}
seed().catch(e => { console.error(e); process.exit(1); });
" || echo "Warning: Admin seed failed, continuing..."

# Create video upload directory
mkdir -p /app/data/videos

echo "🚀 Starting Next.js server..."
exec node server.js
