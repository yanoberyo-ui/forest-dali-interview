FROM node:20-alpine AS base

# ---- Dependencies ----
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---- Builder ----
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate
RUN npx prisma generate

# Build Next.js (needs dummy env vars for build)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/build.db"
RUN npm run build

# Create template DB with schema (so we don't need prisma CLI at runtime)
RUN npx prisma db push --accept-data-loss && ls -la /app/build.db

# ---- Runner ----
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma client (runtime only - no CLI needed)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy template database (created during build with schema)
COPY --from=builder /app/build.db ./template.db

# Copy seed dependencies
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x start.sh

# Create data directories with correct permissions
RUN mkdir -p /app/data/videos && chown -R nextjs:nodejs /app/data
RUN mkdir -p /app/public/uploads/videos && chown -R nextjs:nodejs /app/public/uploads

# Set volume for persistent data (DB + videos)
VOLUME ["/app/data"]

# Default env vars (override via Railway/Render dashboard)
ENV DATABASE_URL="file:/app/data/interview.db"
ENV VIDEO_UPLOAD_DIR="/app/data/videos"

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./start.sh"]
