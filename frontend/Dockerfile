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

# DECLARE BUILD ARGUMENTS: These are passed from docker-compose.yml during 'docker build'
# They are required for 'NEXT_PUBLIC_' variables to be baked into the browser-side code
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Enable Next.js standalone output
ENV NEXT_PRIVATE_STANDALONE=true

# Build the Next.js application for production
RUN npm run build

# Stage 2: Copy the build to runner
FROM node:24-alpine as runner

WORKDIR /app

# Copy build output from builder
COPY --from=builder /app/.next/standalone /app/
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

# Inform Docker that the container will listen on port 3000 at runtime
EXPOSE 3000

# Start the production server
CMD [ "node", "server.js" ]