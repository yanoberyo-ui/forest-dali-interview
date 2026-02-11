#!/bin/sh
set -e

echo "🌳 Forest Dali AI Interview - Starting..."

# Initialize database from template if it doesn't exist
if [ ! -f /app/data/interview.db ]; then
  echo "📦 Initializing database from template..."
  cp /app/template.db /app/data/interview.db
  echo "✅ Database initialized"
else
  echo "📦 Database already exists, skipping initialization"
fi

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
