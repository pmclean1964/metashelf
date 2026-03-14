FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Create uploads dir
RUN mkdir -p /app/uploads

EXPOSE 3000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
