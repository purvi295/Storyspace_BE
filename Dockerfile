# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install all dependencies (including devDependencies required for compilation)
RUN npm ci

# Copy tsconfig and source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to dist
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install curl for docker healthcheck
RUN apk add --no-cache curl

# Create non-root application user for security
RUN addgroup -S nodejs -g 1001 && \
    adduser -S nodeapp -u 1001 -G nodejs

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript output from builder
COPY --from=builder --chown=nodeapp:nodejs /app/dist ./dist

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chown -R nodeapp:nodejs /app/uploads

# Switch to non-root user
USER nodeapp

# Expose port (default 3000)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
