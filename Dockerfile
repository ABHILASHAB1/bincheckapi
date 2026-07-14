FROM node:22-bookworm

WORKDIR /app

# Install build tools for compiling sqlite3 native module
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY package*.json ./

# Install production dependencies and compile sqlite3 from source
RUN npm install --production --build-from-source=sqlite3

# Copy portal UI static files
COPY *.html ./
COPY public ./public

# Copy server code
COPY server ./server

# Environment configuration
ENV PORT=3002
ENV NODE_ENV=production

EXPOSE 3002

# Run server
CMD ["node", "server/index.js"]
