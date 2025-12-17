# Bun Workspaces

## Propósito
Gerenciamento nativo de monorepos com Bun, permitindo múltiplos pacotes em um único repositório.

## Estrutura de Pastas
```
my-monorepo/
├── package.json          # Root package.json
├── bun.lock
├── packages/
│   ├── api/
│   │   ├── package.json
│   │   └── src/
│   ├── web/
│   │   ├── package.json
│   │   └── src/
│   └── shared/
│       ├── package.json
│       └── src/
└── apps/
    └── admin/
        ├── package.json
        └── src/
```

## Configuração do Root

```json
// package.json (root)
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "bun run --filter '*' dev",
    "build": "bun run --filter '*' build",
    "test": "bun test",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit"
  }
}
```

## Package Interno

```json
// packages/shared/package.json
{
  "name": "@myapp/shared",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./utils": "./src/utils/index.ts"
  }
}
```

## Dependência entre Workspaces

```json
// packages/api/package.json
{
  "name": "@myapp/api",
  "version": "1.0.0",
  "dependencies": {
    "@myapp/shared": "workspace:*"
  }
}
```

```json
// packages/web/package.json
{
  "name": "@myapp/web",
  "version": "1.0.0",
  "dependencies": {
    "@myapp/shared": "workspace:*",
    "@myapp/api": "workspace:*"
  }
}
```

## Instalar Dependências

```bash
# Instalar todas as dependências de todos os workspaces
bun install

# Adicionar dependência a um workspace específico
cd packages/api
bun add zod

# Ou do root
bun add zod --filter @myapp/api
```

## bunfig.toml para Workspaces

```toml
# bunfig.toml (root)
[install]
# Link workspaces automaticamente
linkWorkspacePackages = true

# Hoisting de dependências
hoist = true
```

## Catalog de Versões

```json
// package.json (root)
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["packages/*"],
  "catalog": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.7.0"
  },
  "catalog:testing": {
    "vitest": "^2.0.0"
  }
}
```

```json
// packages/web/package.json
{
  "name": "@myapp/web",
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "vitest": "catalog:testing"
  }
}
```

## Executar Scripts

```bash
# Executar script em todos os workspaces
bun run --filter '*' build

# Executar em workspace específico
bun run --filter @myapp/api dev

# Executar em múltiplos workspaces
bun run --filter '@myapp/api' --filter '@myapp/web' dev
```

## TypeScript Config

```json
// tsconfig.json (root)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@myapp/*": ["packages/*/src"]
    }
  },
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/api" },
    { "path": "./packages/web" }
  ]
}
```

```json
// packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src/**/*"]
}
```

## Estrutura Recomendada para a Stack

```
myapp/
├── package.json              # Workspace root
├── bun.lockb
├── tsconfig.json             # Config base TS
├── biome.json                # Lint/format
├── docker-compose.yml        # PostgreSQL local
├── .env.local                # Variáveis dev
├── packages/
│   ├── api/                  # Hono backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── drizzle.config.ts
│   │   └── src/
│   │       ├── index.ts      # Entry + export AppType
│   │       ├── db/
│   │       │   ├── index.ts  # Conexão
│   │       │   ├── schema.ts # Drizzle schema
│   │       │   ├── schemas.ts # Zod schemas (drizzle-zod)
│   │       │   └── seed.ts
│   │       ├── routes/
│   │       │   ├── users.ts
│   │       │   └── posts.ts
│   │       └── middleware/
│   │           └── auth.ts
│   ├── app/                  # Vite + React frontend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── lib/
│   │       │   ├── api.ts    # Hono RPC client
│   │       │   └── supabase.ts
│   │       ├── hooks/
│   │       │   └── useUsers.ts
│   │       └── components/
│   └── shared/               # Tipos e utils compartilhados
│       ├── package.json
│       └── src/
│           ├── index.ts
│           ├── types.ts
│           └── utils.ts
└── drizzle/                  # Migrations geradas
    └── 0000_*.sql
```

## Compartilhando Tipos Frontend/Backend

```typescript
// packages/api/src/index.ts
import { Hono } from "hono";
import { usersRoutes } from "./routes/users";

const app = new Hono()
  .route("/api/users", usersRoutes);

// IMPORTANTE: exportar o tipo da app para o RPC client
export type AppType = typeof app;
export default app;
```

```json
// packages/api/package.json
{
  "name": "@myapp/api",
  "exports": {
    ".": "./src/index.ts",
    "./db/schemas": "./src/db/schemas.ts"
  }
}
```

```typescript
// packages/app/src/lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@myapp/api";

export const api = hc<AppType>(import.meta.env.VITE_API_URL);
```

```typescript
// packages/app/src/components/UserForm.tsx
// Reutilizar schemas Zod do backend!
import { insertUserSchema, type InsertUser } from "@myapp/api/db/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function UserForm() {
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
  });
  // ...
}
```

## Package.json Completo do Root

```json
{
  "name": "myapp",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "bun run --filter=* dev",
    "dev:api": "bun run --filter=@myapp/api dev",
    "dev:app": "bun run --filter=@myapp/app dev",
    "build": "bun run --filter=* build",
    "typecheck": "tsc -b",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "test": "bun test",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:reset": "docker compose down -v && docker compose up -d",
    "db:push": "bun run --filter=@myapp/api db:push",
    "db:seed": "bun run --filter=@myapp/api db:seed",
    "db:studio": "bun run --filter=@myapp/api db:studio"
  },
  "devDependencies": {
    "@biomejs/biome": "latest",
    "typescript": "latest"
  }
}
```

## Integração com a Stack

- **Bun**: Runtime e package manager nativo
- **TypeScript**: Path aliases e project references
- **Biome**: Config único no root
- **Drizzle**: Schemas no package api
- **Hono RPC**: Tipos compartilhados via exports
- **drizzle-zod**: Validação reutilizada frontend/backend
