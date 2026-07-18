FROM node:22-bookworm

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy remaining source code
COPY . .

# Expose port
EXPOSE 3000

# Start in development mode for live reload (can be overridden in production)
CMD ["npm", "run", "dev"]
