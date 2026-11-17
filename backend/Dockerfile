# Stage 1: Build the app
# Use Node.js 24 Alpine as the base for a smaller, secure container image
FROM node:24-alpine as builder

# Set the working directory inside the container for all subsequent commands
WORKDIR /app

# Copy dependency definitions first to optimize Docker layer rebuilds
COPY package.json package-lock.json ./

# Install the exact dependency versions recorded in package-lock.json
RUN npm ci

# Copy the rest of the application source code into the container
COPY . .

# Build the Backend application (compiles TypeScript to JavaScript)
RUN npm run build

# Remove development dependencies after building
RUN npm prune --omit=dev

# Stage 2: Copy the build to runner
FROM node:24-alpine as runner

WORKDIR /app

# Copy build output and production dependencies from builder
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Inform Docker that the container will listen on port 5000 at runtime
EXPOSE 5000

# Start the production server
CMD [ "npm", "run", "start" ]
