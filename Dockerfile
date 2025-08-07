# Use official Node.js LTS image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY api/package*.json ./api/
COPY libs/package*.json ./libs/

# Install dependencies (root and api)
RUN npm ci --omit=dev

# Copy the rest of the monorepo
COPY . .

# Build the API app
RUN npx nx build api

# Set environment variables
ENV NODE_ENV=production

# Expose the port Cloud Run expects
EXPOSE 8080

# Start the NestJS API (ensure main.js is built to dist/)
CMD ["node", "dist/apps/api/main.js"]
