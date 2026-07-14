FROM node:22-slim

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy portal UI static files
COPY *.html ./

# Copy server code
COPY server ./server

# Environment configuration
ENV PORT=3002
ENV NODE_ENV=production

EXPOSE 3002

# Run server
CMD ["node", "server/index.js"]
