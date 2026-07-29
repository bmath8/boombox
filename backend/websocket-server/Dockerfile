# ============================================================================
# FAM Music WebSocket Server - Production Dockerfile
# ============================================================================

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 websocket

# Copy node_modules from deps
COPY --from=deps --chown=websocket:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=websocket:nodejs . .

# Set environment to production
ENV NODE_ENV=production

# Switch to non-root user
USER websocket

# Expose WebSocket port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start server
CMD ["node", "server.js"]
