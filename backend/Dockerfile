# syntax = docker/dockerfile:1

 # syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=24.2.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install node modules (including devDependencies needed to build TypeScript)
COPY package-lock.json package.json ./
# Force install devDependencies for the build step (TypeScript, tsx, etc.)
RUN NODE_ENV=development npm ci

# Copy application code
COPY . .

# Build application (outputs to dist/)
RUN npm run build

# Remove development dependencies from node_modules to slim the final image
RUN npm prune --omit=dev

# Final stage for app image
FROM base

# Copy built application (including pruned node_modules and dist/)
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 8080
CMD [ "npm", "run", "start" ]
