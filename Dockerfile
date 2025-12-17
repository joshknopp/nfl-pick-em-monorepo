# Use official Node.js LTS image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy only files needed for install and build
COPY package*.json nx.json tsconfig.base.json ./
COPY api/package*.json api/
COPY libs/package*.json libs/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of the monorepo
COPY . .

# Build the API app (output to dist/api)
RUN npx nx build api

# Prune dev dependencies
RUN npm prune --production

# Set environment variables
ENV NODE_ENV=production

# Expose the port Cloud Run expects
EXPOSE 8080

# Start the NestJS API (ensure main.js is built to dist/api/)
CMD ["node", "dist/api/main.js"]
