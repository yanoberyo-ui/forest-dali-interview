#!/bin/sh
set -e

echo "🌳 Forest Dali AI Interview - Starting..."

# Debug: show disk mount info
echo "📁 Checking /app/data mount..."
df -h /app/data 2>/dev/null || echo "Warning: Could not get disk info for /app/data"
ls -la /app/data/ 2>/dev/null || echo "Warning: /app/data is empty or not accessible"
echo "📁 /app/data permissions:"
stat /app/data 2>/dev/null || true

# Ensure data directory exists and is writable
mkdir -p /app/data/videos
if ! touch /app/data/.write-test 2>/dev/null; then
  echo "⚠️  WARNING: /app/data is not writable! Data will NOT persist across deploys."
  echo "⚠️  Make sure a persistent disk is mounted at /app/data in Render settings."
else
  rm -f /app/data/.write-test
  echo "✅ /app/data is writable"
fi

# Initialize database from template if it doesn't exist
if [ ! -f /app/data/interview.db ]; then
  echo "📦 Initializing database from template..."
  cp /app/template.db /app/data/interview.db
  echo "✅ Database initialized at /app/data/interview.db"
else
  echo "📦 Database already exists at /app/data/interview.db"
  ls -la /app/data/interview.db
  # Verify DB integrity
  echo "🔍 Checking database integrity..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.interview.count().then(c => {
      console.log('  Interviews in DB:', c);
      return prisma.\$disconnect();
    }).catch(e => {
      console.error('  DB check failed:', e.message);
      console.log('  Attempting to reinitialize from template...');
      process.exit(1);
    });
  " || {
    echo "⚠️  Database seems corrupted, reinitializing..."
    cp /app/template.db /app/data/interview.db
    echo "✅ Database reinitialized"
  }
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

echo "🚀 Starting Next.js server..."
exec node server.js
