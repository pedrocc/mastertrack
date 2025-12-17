# Docker

## Propósito
Containerização para desenvolvimento local. PostgreSQL e serviços auxiliares rodam em containers, mantendo ambiente consistente.

## Ambiente Local

O desenvolvimento local usa Docker apenas para serviços (PostgreSQL, Redis, etc.). A aplicação roda diretamente com Bun para hot reload rápido.

## Docker Compose - Desenvolvimento

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: app_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: app_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Comandos Docker Compose

```bash
# Iniciar serviços
docker compose up -d

# Parar serviços
docker compose down

# Ver logs
docker compose logs -f postgres

# Reiniciar serviço específico
docker compose restart postgres

# Remover volumes (reset banco)
docker compose down -v
```

## Variáveis de Ambiente

```bash
# .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_dev"
REDIS_URL="redis://localhost:6379"
```

## PostgreSQL com Extensões

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

```sql
-- init.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Dockerfile - Produção (Bun)

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

## Dockerfile - Frontend (Vite + Bun)

```dockerfile
# Dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Serve com nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Docker Compose - Produção Local

```yaml
# docker-compose.prod.yml
services:
  api:
    build:
      context: ./packages/api
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build:
      context: ./packages/app
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## .dockerignore

```
node_modules
dist
.git
.env*
*.log
coverage
.turbo
```

## Scripts package.json

```json
{
  "scripts": {
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:logs": "docker compose logs -f",
    "docker:reset": "docker compose down -v && docker compose up -d",
    "db:push": "bunx drizzle-kit push",
    "db:studio": "bunx drizzle-kit studio"
  }
}
```

## Workflow de Desenvolvimento

```bash
# 1. Subir banco de dados
docker compose up -d

# 2. Aplicar schema do Drizzle
bun run db:push

# 3. Rodar aplicação localmente
bun run dev

# 4. Abrir Drizzle Studio para visualizar dados
bun run db:studio
```

## Multi-stage Build Otimizado

```dockerfile
# Dockerfile otimizado para monorepo
FROM oven/bun:1 AS base

# Deps
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile --production

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build --filter=api

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/packages/api/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

USER bun
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

## Integração com a Stack

- **Bun**: Runtime em produção via imagem oficial
- **PostgreSQL**: Banco local idêntico ao Supabase
- **Drizzle**: Migrations e push no container
- **Deploy**: Dockerfile usado tanto para Railway quanto Portainer

