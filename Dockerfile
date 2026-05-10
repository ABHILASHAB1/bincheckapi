# --- Stage 1: Build Frontend ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Runtime ---
FROM node:18-alpine
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built frontend and server
COPY --from=builder /app/dist ./dist
COPY server ./server

# Persistent Data Setup
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/bins.sqlite

# Environment
ENV PORT=5173
ENV NODE_ENV=production

EXPOSE 5173
EXPOSE 8583

CMD ["node", "server/index.js"]
