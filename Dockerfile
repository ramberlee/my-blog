# ── Stage 1: Build frontend ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Production ──
FROM node:20-alpine AS production
WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source (runs via tsx)
COPY server ./server
COPY .env.example .env.example

# Create data directories
RUN mkdir -p server/data server/uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# Start server
CMD ["node", "--import", "tsx", "server/index.ts"]
