FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
COPY packages/app/package.json ./packages/app/
RUN bun install

# Build
FROM base AS builder
ENV VITE_API_URL=https://api-production-26d8.up.railway.app
ENV VITE_APP_NAME=Mastertrack
ENV VITE_SUPABASE_URL=https://jrygnvyiaveexkixwkvu.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyeWdudnlpYXZlZXhraXh3a3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzUwNDgsImV4cCI6MjA4MTY1MTA0OH0.XdoUtNjXudb_7jqu6jUUlYhWaWsDmlTqq5SnYDLxgjQ

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/app/node_modules ./packages/app/node_modules
COPY . .
RUN cd packages/app && bun run build

# Production - serve static files
FROM nginx:alpine AS runner
COPY --from=builder /app/packages/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
