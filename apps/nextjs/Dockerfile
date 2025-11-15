# apps/nextjs/Dockerfile
FROM node:20-bullseye AS base
WORKDIR /usr/src/app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Expose port and start Next.js in dev mode
EXPOSE 3000
CMD ["npm", "run", "dev"]

