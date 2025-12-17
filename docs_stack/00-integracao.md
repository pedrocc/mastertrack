# Guia de Integração da Stack

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 19 + Vite + TanStack Query + React Hook Form          │
│                           │                                  │
│                    Hono RPC Client                           │
│                    (type-safe)                               │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP
┌───────────────────────────┴─────────────────────────────────┐
│                        BACKEND                               │
│  Hono + Zod Validation + Supabase Auth Middleware            │
│                           │                                  │
│                    Drizzle ORM                               │
│                    (type-safe)                               │
└───────────────────────────┬─────────────────────────────────┘
                            │ SQL
┌───────────────────────────┴─────────────────────────────────┐
│                       DATABASE                               │
│  Local: Docker + PostgreSQL                                  │
│  Prod:  Supabase PostgreSQL + Auth + Storage + Realtime      │
└─────────────────────────────────────────────────────────────┘
```

## Estratégia de Ambientes

### Desenvolvimento Local
```bash
# Serviços rodam em Docker
docker compose up -d

# Aplicação roda com Bun (hot reload)
bun run dev
```

- **PostgreSQL**: Container Docker local (sem custo)
- **Auth**: Simulado ou Supabase local (opcional)
- **Storage**: Sistema de arquivos local
- **Migrations**: Drizzle push direto no banco

### Produção
- **PostgreSQL**: Supabase (managed, pooling, backups)
- **Auth**: Supabase Auth (email + Azure AD SSO)
- **Storage**: Supabase Storage (CDN, RLS)
- **Realtime**: Supabase Realtime (WebSocket)
- **Deploy**: Railway ou Portainer (conforme o projeto)

## Estrutura do Monorepo

```
myapp/
├── package.json              # Workspace root
├── bun.lockb
├── docker-compose.yml        # PostgreSQL local
├── .env.local               # Variáveis locais
├── .env.production          # Template para produção
├── packages/
│   ├── api/                 # Backend Hono
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── drizzle.config.ts
│   │   └── src/
│   │       ├── index.ts     # Entry point
│   │       ├── db/
│   │       │   ├── index.ts # Conexão
│   │       │   ├── schema.ts
│   │       │   └── seed.ts
│   │       ├── routes/
│   │       │   ├── users.ts
│   │       │   └── posts.ts
│   │       └── middleware/
│   │           └── auth.ts
│   ├── app/                 # Frontend React
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── lib/
│   │       │   ├── api.ts   # Hono RPC client
│   │       │   └── supabase.ts
│   │       ├── hooks/
│   │       │   └── useUsers.ts
│   │       └── components/
│   └── shared/              # Tipos e utils compartilhados
│       ├── package.json
│       └── src/
│           ├── types.ts
│           └── schemas.ts   # Zod schemas compartilhados
└── drizzle/                 # Migrations
    └── 0000_*.sql
```

## Configuração Root

```json
// package.json (root)
{
  "name": "myapp",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "bun run --filter=* dev",
    "dev:api": "bun run --filter=@myapp/api dev",
    "dev:app": "bun run --filter=@myapp/app dev",
    "build": "bun run --filter=* build",
    "db:push": "bun run --filter=@myapp/api db:push",
    "db:seed": "bun run --filter=@myapp/api db:seed",
    "db:studio": "bun run --filter=@myapp/api db:studio",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "tsc -b"
  },
  "devDependencies": {
    "@biomejs/biome": "latest",
    "typescript": "latest"
  }
}
```

## Fluxo de Type-Safety End-to-End

### 1. Schema do Banco (Drizzle)
```typescript
// packages/api/src/db/schema.ts
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 2. Schemas Zod (Validação)
```typescript
// packages/api/src/db/schemas.ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./schema";
import { z } from "zod";

export const insertUserSchema = createInsertSchema(users, {
  email: (s) => s.email.email("Email inválido"),
  name: (s) => s.name.min(2, "Nome muito curto"),
}).omit({ id: true, createdAt: true });

export const selectUserSchema = createSelectSchema(users);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
```

### 3. API Hono (Backend)
```typescript
// packages/api/src/routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { users } from "../db/schema";
import { insertUserSchema } from "../db/schemas";

export const usersRoutes = new Hono()
  .get("/", async (c) => {
    const allUsers = await db.select().from(users);
    return c.json({ users: allUsers });
  })
  .post("/", zValidator("json", insertUserSchema), async (c) => {
    const data = c.req.valid("json"); // Tipado!
    const [user] = await db.insert(users).values(data).returning();
    return c.json({ user }, 201);
  });
```

### 4. Export do Tipo da API
```typescript
// packages/api/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { usersRoutes } from "./routes/users";

const app = new Hono()
  .use("*", cors())
  .route("/api/users", usersRoutes);

export type AppType = typeof app;
export default app;
```

### 5. Cliente RPC (Frontend)
```typescript
// packages/app/src/lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@myapp/api";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const api = hc<AppType>(baseUrl);
```

### 6. Hooks com TanStack Query
```typescript
// packages/app/src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { InsertUser } from "@myapp/api/db/schemas";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.api.users.$get();
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await api.api.users.$post({ json: data });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

### 7. Componente React
```tsx
// packages/app/src/components/UserForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@myapp/api/db/schemas";
import { useCreateUser } from "../hooks/useUsers";

export function UserForm() {
  const { mutate, isPending } = useCreateUser();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
  });

  const onSubmit = (data: InsertUser) => {
    mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("email")} placeholder="Email" />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}

      <input {...form.register("name")} placeholder="Nome" />
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}

      <button disabled={isPending}>
        {isPending ? "Criando..." : "Criar Usuário"}
      </button>
    </form>
  );
}
```

## Variáveis de Ambiente

```bash
# .env.local (desenvolvimento)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_dev"

# Opcional em dev local
SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="eyJ..."

# .env.production (template)
DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

## Workflow de Desenvolvimento

```bash
# 1. Clonar e instalar
git clone <repo>
bun install

# 2. Subir banco local
docker compose up -d

# 3. Aplicar schema
bun run db:push

# 4. Popular com dados de teste
bun run db:seed

# 5. Rodar em desenvolvimento
bun run dev

# 6. Abrir Drizzle Studio
bun run db:studio
```

## Storage: Local vs Produção

```typescript
// packages/api/src/lib/storage.ts
import { supabase } from "./supabase";
import fs from "fs/promises";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";
const LOCAL_STORAGE_PATH = "./uploads";

export const storage = {
  async upload(bucket: string, filePath: string, file: Buffer): Promise<string> {
    if (isProduction) {
      // Supabase Storage em produção
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (error) throw error;
      return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
    } else {
      // Sistema de arquivos local em dev
      const fullPath = path.join(LOCAL_STORAGE_PATH, bucket, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file);
      return `/uploads/${bucket}/${filePath}`;
    }
  },

  async delete(bucket: string, filePath: string): Promise<void> {
    if (isProduction) {
      await supabase.storage.from(bucket).remove([filePath]);
    } else {
      const fullPath = path.join(LOCAL_STORAGE_PATH, bucket, filePath);
      await fs.unlink(fullPath).catch(() => {});
    }
  },

  getPublicUrl(bucket: string, filePath: string): string {
    if (isProduction) {
      return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
    }
    return `/uploads/${bucket}/${filePath}`;
  },
};
```

```typescript
// Servir arquivos locais em dev (Hono)
import { serveStatic } from "hono/bun";

if (process.env.NODE_ENV !== "production") {
  app.use("/uploads/*", serveStatic({ root: "./" }));
}
```

## GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Type check
        run: bun run typecheck

      - name: Test
        run: bun test

  build:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1

      - run: bun install --frozen-lockfile
      - run: bun run build

  # Deploy para Railway (quando aplicável)
  deploy-railway:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && vars.DEPLOY_TARGET == 'railway'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api

  # Deploy para Portainer (quando aplicável)
  deploy-portainer:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && vars.DEPLOY_TARGET == 'portainer'
    steps:
      - uses: actions/checkout@v4

      - name: Login to Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ vars.REGISTRY_URL }}
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ vars.REGISTRY_URL }}/myapp-api:latest

      - name: Trigger Portainer Webhook
        run: curl -X POST ${{ secrets.PORTAINER_WEBHOOK_URL }}
```

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks

on:
  pull_request:

jobs:
  knip:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - run: bunx knip

  biome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - run: bunx biome ci .
```

## Testes

### Configuração do Bun Test

```toml
# bunfig.toml
[test]
coverage = true
coverageDir = "coverage"
```

### Testes Unitários

```typescript
// packages/api/src/utils/validators.test.ts
import { expect, test, describe } from "bun:test";
import { insertUserSchema } from "../db/schemas";

describe("User Schema Validation", () => {
  test("accepts valid user data", () => {
    const result = insertUserSchema.safeParse({
      email: "test@example.com",
      name: "John Doe",
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid email", () => {
    const result = insertUserSchema.safeParse({
      email: "invalid-email",
      name: "John",
    });
    expect(result.success).toBe(false);
  });

  test("rejects short name", () => {
    const result = insertUserSchema.safeParse({
      email: "test@example.com",
      name: "J",
    });
    expect(result.success).toBe(false);
  });
});
```

### Testes de Integração (API)

```typescript
// packages/api/src/routes/users.test.ts
import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import app from "../index";

describe("Users API", () => {
  // Testar endpoints usando app.request() do Hono
  test("GET /api/users returns list", async () => {
    const res = await app.request("/api/users");
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("users");
    expect(Array.isArray(data.users)).toBe(true);
  });

  test("POST /api/users creates user", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "newuser@example.com",
        name: "New User",
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user).toHaveProperty("id");
    expect(data.user.email).toBe("newuser@example.com");
  });

  test("POST /api/users rejects invalid data", async () => {
    const res = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid",
        name: "J",
      }),
    });

    expect(res.status).toBe(400);
  });

  test("GET /api/users/:id returns 404 for non-existent user", async () => {
    const res = await app.request("/api/users/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });
});
```

### Testes E2E com Banco Real

```typescript
// packages/api/src/e2e/users.e2e.test.ts
import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import app from "../index";

describe("Users E2E", () => {
  let testUserId: string;

  beforeAll(async () => {
    // Limpar dados de teste anteriores
    await db.delete(users).where(eq(users.email, "e2e-test@example.com"));
  });

  afterAll(async () => {
    // Limpar após testes
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  test("full user lifecycle", async () => {
    // 1. Criar usuário
    const createRes = await app.request("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "e2e-test@example.com",
        name: "E2E Test User",
      }),
    });

    expect(createRes.status).toBe(201);
    const { user } = await createRes.json();
    testUserId = user.id;

    // 2. Buscar usuário criado
    const getRes = await app.request(`/api/users/${testUserId}`);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.user.email).toBe("e2e-test@example.com");

    // 3. Verificar no banco direto
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.name).toBe("E2E Test User");
  });
});
```

### Testes de Hooks React

```typescript
// packages/app/src/hooks/useUsers.test.tsx
import { expect, test, describe } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUsers } from "./useUsers";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useUsers hook", () => {
  test("fetches users successfully", async () => {
    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    // Inicialmente loading
    expect(result.current.isLoading).toBe(true);

    // Aguardar resultado
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.users).toBeDefined();
  });
});
```

### Scripts de Teste

```json
// package.json (root)
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
    "test:api": "bun test --filter=api",
    "test:app": "bun test --filter=app",
    "test:e2e": "bun test --filter=e2e"
  }
}
```

### CI com Testes

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run migrations
        run: bun run db:push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run tests
        run: bun test --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

## Checklist de Integração

- [ ] Docker Compose configurado com PostgreSQL
- [ ] Drizzle schema definido com relations
- [ ] drizzle-zod gerando schemas de validação
- [ ] Hono routes usando zValidator
- [ ] AppType exportado para RPC client
- [ ] Hono client configurado no frontend
- [ ] TanStack Query hooks usando o client
- [ ] React Hook Form com zodResolver
- [ ] Biome configurado para lint/format
- [ ] Husky + lint-staged para pre-commit
- [ ] GitHub Actions CI/CD configurado
- [ ] Storage abstraction (local/Supabase)
- [ ] Testes unitários e de integração
