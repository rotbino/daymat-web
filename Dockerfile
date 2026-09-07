# -------------------------------------------------------------------
# 1. Base stage – Install dependencies
# -------------------------------------------------------------------
FROM node:20-slim AS deps
WORKDIR /app

# Copy lockfile + package.json
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --silent --no-progress

# -------------------------------------------------------------------
# 2. Build stage – Build Next.js in standalone mode
# -------------------------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy all project files
COPY . .

# Build project
RUN yarn build

# -------------------------------------------------------------------
# 3. Runtime stage – Run lightweight standalone build
# -------------------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.env.local ./.env.local

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Use non-root user
USER nextjs
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
