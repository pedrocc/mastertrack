# Deploy em Produção

## Visão Geral

A stack suporta duas opções de hospedagem para produção:
- **Railway**: Deploy automático via GitHub, escala automática, domínios customizados
- **Portainer**: Container Docker em ambiente corporativo gerenciado internamente

A escolha depende do projeto: Railway para aplicações que se beneficiam de deploy rápido e escala automática; Portainer para aplicações que precisam rodar em infraestrutura interna.

---

# Railway

## Propósito
Plataforma de deploy simples e rápida. Deploy automático via GitHub, escala automática, domínios customizados.

## Instalação CLI

```bash
# macOS
brew install railway

# npm
npm install -g @railway/cli

# Login
railway login
```

## Criar Projeto

```bash
# Criar projeto novo
railway init

# Linkar projeto existente
railway link

# Ver status
railway status
```

## Deploy via GitHub

1. Conectar repositório no dashboard Railway
2. Selecionar branch (main/master)
3. Deploy automático em cada push

## Configuração com railway.toml

```toml
# railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "bun run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300

[service]
internalPort = 3000
```

## Configuração Nixpacks (Auto-detect)

```toml
# railway.toml (para Bun)
[build]
builder = "nixpacks"

[deploy]
startCommand = "bun run dist/index.js"
```

```json
// nixpacks.toml
[phases.setup]
nixPkgs = ["bun"]

[phases.install]
cmds = ["bun install --frozen-lockfile"]

[phases.build]
cmds = ["bun run build"]
```

## Variáveis de Ambiente

```bash
# Adicionar variável
railway variables set DATABASE_URL="postgresql://..."

# Ver variáveis
railway variables

# Importar de arquivo
railway variables set < .env.production
```

No dashboard:
- Settings > Variables
- Suporta referências: `${{Postgres.DATABASE_URL}}`

## Serviços Internos

```toml
# railway.toml
[deploy]
# Porta interna
internalPort = 3000

# Não expor publicamente (serviço interno)
# Comunicação via Private Network
```

## Conectar ao Supabase

```bash
# Variáveis necessárias no Railway
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
```

## Monorepo Deploy

```toml
# packages/api/railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"
watchPatterns = ["packages/api/**", "packages/shared/**"]

[deploy]
startCommand = "bun run start"
```

No dashboard:
- Settings > Root Directory: `packages/api`

## Health Checks

```typescript
// src/routes/health.ts
import { Hono } from "hono";

const health = new Hono();

health.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default health;
```

```toml
# railway.toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
```

## Domínio Customizado

```bash
# Gerar domínio Railway
railway domain

# Adicionar domínio customizado
# Via dashboard: Settings > Networking > Custom Domain
```

DNS:
- CNAME: `app.exemplo.com` -> `xxx.up.railway.app`

## Deploy Manual

```bash
# Deploy do diretório atual
railway up

# Deploy com build local
railway up --detach

# Ver logs
railway logs

# Abrir no browser
railway open
```

## Rollback

```bash
# Listar deployments
railway deployments

# Rollback para deployment anterior
# Via dashboard: Deployments > Redeploy
```

## Escala

No dashboard:
- Settings > Scaling
- Horizontal: múltiplas instâncias
- Vertical: CPU/RAM por instância

## Cron Jobs

```toml
# railway.toml
[deploy]
cronSchedule = "0 0 * * *"  # Diário à meia-noite
```

## Exemplo Completo - API Hono

```toml
# railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "bun run dist/index.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

```dockerfile
# Dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

## Logs e Monitoring

```bash
# Logs em tempo real
railway logs -f

# Logs filtrados
railway logs --filter="error"
```

No dashboard:
- Observability > Logs
- Métricas de CPU, RAM, Network

## CI/CD com GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway
        run: npm i -g @railway/cli

      - name: Deploy
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Integração com a Stack

- **Bun**: Runtime nativo com Dockerfile
- **Supabase**: Conecta via DATABASE_URL e keys
- **Hono**: Deploy de API com health checks
- **GitHub**: Deploy automático em push
- **Docker**: Usa Dockerfile para build

---

# Portainer (Ambiente Corporativo)

## Propósito
Gerenciador de containers Docker para ambientes de produção internos. Usado quando a aplicação precisa rodar em infraestrutura corporativa própria.

## Quando Usar Portainer

- Aplicações com requisitos de compliance que exigem infraestrutura interna
- Sistemas que precisam acessar recursos da rede corporativa
- Projetos com dados sensíveis que não podem sair do ambiente interno
- Casos onde o custo de cloud externa não é justificado

## Preparação do Container

O Dockerfile usado é o mesmo para Railway e Portainer:

```dockerfile
# Dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

## Build da Imagem

```bash
# Build local
docker build -t myapp-api:latest .

# Tag para registry interno
docker tag myapp-api:latest registry.empresa.com/myapp-api:latest

# Push para registry
docker push registry.empresa.com/myapp-api:latest
```

## Deploy via Portainer

1. Acessar o Portainer (ex: `https://portainer.empresa.com`)
2. Selecionar o ambiente/endpoint de produção
3. Ir em **Containers** > **Add container**
4. Configurar:
   - **Name**: `myapp-api`
   - **Image**: `registry.empresa.com/myapp-api:latest`
   - **Port mapping**: `3000:3000`
   - **Environment variables**: DATABASE_URL, SUPABASE_URL, etc.
5. Deploy

## Docker Compose via Portainer

Alternativamente, usar Stacks no Portainer:

```yaml
# docker-compose.prod.yml
version: "3.8"
services:
  api:
    image: registry.empresa.com/myapp-api:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    image: registry.empresa.com/myapp-web:latest
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped
```

No Portainer:
1. Ir em **Stacks** > **Add stack**
2. Colar o conteúdo do docker-compose
3. Configurar variáveis de ambiente
4. Deploy

## CI/CD para Portainer

```yaml
# .github/workflows/deploy-portainer.yml
name: Deploy to Portainer

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: registry.empresa.com
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: registry.empresa.com/myapp-api:latest

      - name: Trigger Portainer Webhook
        run: |
          curl -X POST ${{ secrets.PORTAINER_WEBHOOK_URL }}
```

## Configurar Webhook no Portainer

1. No container/stack, ir em **Webhooks**
2. Criar webhook de atualização
3. Copiar URL e adicionar como secret no GitHub: `PORTAINER_WEBHOOK_URL`

## Variáveis de Ambiente

No Portainer, configurar via:
- **Container**: Environment variables na criação
- **Stack**: Seção de environment variables ou arquivo `.env`

```bash
# Variáveis necessárias
DATABASE_URL=postgresql://user:pass@db.empresa.com:5432/app
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Monitoramento

- **Logs**: Portainer > Container > Logs
- **Stats**: Portainer > Container > Stats (CPU, RAM, Network)
- **Console**: Portainer > Container > Console (acesso ao shell)

## Integração com a Stack

- **Docker**: Mesmo Dockerfile usado no Railway
- **Supabase**: Conecta via variáveis de ambiente
- **GitHub**: CI/CD com webhook para redeploy automático
- **Bun**: Runtime em produção via imagem oficial

