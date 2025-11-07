# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
# Copy client build into the server's expected `server/public` directory
# Vite builds the client to /app/dist/public (see vite.config.ts outDir)
COPY --from=builder /app/dist/public ./server/public

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Install a small HTTP client and add a health check
# Use curl (available via apk) for the healthcheck to avoid wget-not-found
RUN apk add --no-cache curl

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Container optimization
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "dist/server/index.js"]