# Hono

## Propósito
Framework web ultrarrápido e leve para APIs. Funciona em qualquer runtime (Bun, Node, Cloudflare Workers, Deno).

## Instalação
```bash
bun add hono @hono/zod-validator
```

## App Básico

```typescript
// src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// Middlewares
app.use("*", logger());
app.use("*", cors());

// Routes
app.get("/", (c) => c.text("Hello Hono!"));

app.get("/api/health", (c) => c.json({ status: "ok" }));

export default app;
```

## Executar com Bun

```typescript
// src/index.ts
import { Hono } from "hono";

const app = new Hono();

// ... routes

export default {
  port: 3000,
  fetch: app.fetch,
};
```

```bash
bun run src/index.ts
```

## Rotas e Parâmetros

```typescript
const app = new Hono();

// Parâmetros de rota
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id });
});

// Query params
app.get("/search", (c) => {
  const query = c.req.query("q");
  const page = c.req.query("page") ?? "1";
  return c.json({ query, page });
});

// Body (JSON)
app.post("/users", async (c) => {
  const body = await c.req.json();
  return c.json(body, 201);
});

// Headers
app.get("/headers", (c) => {
  const auth = c.req.header("Authorization");
  return c.json({ auth });
});
```

## Validação com Zod

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono();

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

app.post(
  "/users",
  zValidator("json", createUserSchema),
  (c) => {
    const data = c.req.valid("json");
    // data é tipado automaticamente
    return c.json({ user: data }, 201);
  }
);

// Validar query params
const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

app.get(
  "/users",
  zValidator("query", querySchema),
  (c) => {
    const { page, limit } = c.req.valid("query");
    return c.json({ page, limit });
  }
);
```

## Agrupamento de Rotas

```typescript
import { Hono } from "hono";

// Criar sub-app
const users = new Hono();

users.get("/", (c) => c.json({ users: [] }));
users.get("/:id", (c) => c.json({ id: c.req.param("id") }));
users.post("/", (c) => c.json({ created: true }));

// Montar no app principal
const app = new Hono();
app.route("/api/users", users);
```

## Middlewares

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bearerAuth } from "hono/bearer-auth";
import { jwt } from "hono/jwt";

const app = new Hono();

// Built-in middlewares
app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:3000"],
  credentials: true,
}));

// Auth middleware
app.use("/api/*", jwt({ secret: process.env.JWT_SECRET! }));

// Custom middleware
const timing = async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  c.header("X-Response-Time", `${ms}ms`);
};

app.use("*", timing);
```

## Error Handling

```typescript
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

// Throw HTTP exception
app.get("/protected", (c) => {
  throw new HTTPException(401, { message: "Unauthorized" });
});

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Not found handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});
```

## RPC Client (Type-Safe)

```typescript
// server.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono()
  .get("/users", (c) => {
    return c.json({ users: [{ id: "1", name: "John" }] });
  })
  .post(
    "/users",
    zValidator("json", z.object({
      name: z.string(),
      email: z.string().email(),
    })),
    (c) => {
      const data = c.req.valid("json");
      return c.json({ id: "new-id", ...data }, 201);
    }
  )
  .get("/users/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ id, name: "John" });
  });

export type AppType = typeof app;
export default app;
```

```typescript
// client.ts
import { hc } from "hono/client";
import type { AppType } from "./server";

const client = hc<AppType>("http://localhost:3000");

// GET /users - type-safe!
const usersRes = await client.users.$get();
const users = await usersRes.json();

// POST /users
const createRes = await client.users.$post({
  json: { name: "Jane", email: "jane@example.com" },
});

// GET /users/:id
const userRes = await client.users[":id"].$get({
  param: { id: "123" },
});
```

## OpenAPI com Zod

```bash
bun add @hono/zod-openapi
```

### Setup Básico

```typescript
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const app = new OpenAPIHono();
```

### Schemas Reutilizáveis

```typescript
// schemas/user.ts
import { z } from "@hono/zod-openapi";

export const UserSchema = z.object({
  id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  email: z.string().email().openapi({ example: "user@example.com" }),
  name: z.string().min(2).openapi({ example: "John Doe" }),
  createdAt: z.string().datetime().openapi({ example: "2024-01-15T10:30:00Z" }),
}).openapi("User");

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true }).openapi("CreateUser");

export const ErrorSchema = z.object({
  error: z.string().openapi({ example: "Resource not found" }),
  code: z.string().optional().openapi({ example: "NOT_FOUND" }),
}).openapi("Error");
```

### Definindo Rotas com OpenAPI

```typescript
// routes/users.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { UserSchema, CreateUserSchema, ErrorSchema } from "../schemas/user";

const users = new OpenAPIHono();

// GET /users - Listar usuários
const listUsersRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Users"],
  summary: "List all users",
  description: "Returns a paginated list of users",
  request: {
    query: z.object({
      page: z.coerce.number().default(1).openapi({ example: 1 }),
      limit: z.coerce.number().default(10).openapi({ example: 10 }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            users: z.array(UserSchema),
            total: z.number(),
            page: z.number(),
          }),
        },
      },
      description: "List of users",
    },
  },
});

users.openapi(listUsersRoute, async (c) => {
  const { page, limit } = c.req.valid("query");
  const allUsers = await db.select().from(usersTable).limit(limit).offset((page - 1) * limit);
  return c.json({ users: allUsers, total: 100, page });
});

// GET /users/:id - Buscar usuário
const getUserRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Users"],
  summary: "Get user by ID",
  request: {
    params: z.object({
      id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ user: UserSchema }),
        },
      },
      description: "User found",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "User not found",
    },
  },
});

users.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid("param");
  const user = await db.query.users.findFirst({ where: eq(usersTable.id, id) });

  if (!user) {
    return c.json({ error: "User not found", code: "NOT_FOUND" }, 404);
  }

  return c.json({ user });
});

// POST /users - Criar usuário
const createUserRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Users"],
  summary: "Create a new user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ user: UserSchema }),
        },
      },
      description: "User created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Validation error",
    },
  },
});

users.openapi(createUserRoute, async (c) => {
  const data = c.req.valid("json");
  const [newUser] = await db.insert(usersTable).values(data).returning();
  return c.json({ user: newUser }, 201);
});

export { users };
```

### App Principal com Swagger UI

```typescript
// index.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { users } from "./routes/users";

const app = new OpenAPIHono();

// Rotas da API
app.route("/api/users", users);

// Gerar spec OpenAPI JSON
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "My API",
    version: "1.0.0",
    description: "API documentation with OpenAPI 3.0",
  },
  servers: [
    { url: "http://localhost:3000", description: "Development" },
    { url: "https://api.myapp.com", description: "Production" },
  ],
  tags: [
    { name: "Users", description: "User management endpoints" },
  ],
});

// Swagger UI - documentação interativa
app.get("/swagger", swaggerUI({ url: "/doc" }));

export default app;
```

### Segurança (Bearer Token)

```typescript
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const app = new OpenAPIHono();

// Registrar esquema de segurança
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

// Rota protegida
const protectedRoute = createRoute({
  method: "get",
  path: "/api/me",
  tags: ["Auth"],
  summary: "Get current user",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "Current authenticated user",
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Unauthorized",
    },
  },
});
```

## Auth Middleware com Supabase JWT

```typescript
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createClient } from "@supabase/supabase-js";

// Tipos
type Variables = {
  user: {
    id: string;
    email: string;
    role: string;
  };
};

// Middleware de autenticação Supabase
const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      throw new HTTPException(401, { message: "Missing authorization header" });
    }

    const token = authHeader.slice(7);

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new HTTPException(401, { message: "Invalid token" });
    }

    c.set("user", {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role ?? "user",
    });

    await next();
  }
);

// Uso
const app = new Hono<{ Variables: Variables }>();

// Rotas públicas
app.get("/api/health", (c) => c.json({ status: "ok" }));

// Rotas protegidas
app.use("/api/protected/*", authMiddleware);

app.get("/api/protected/me", (c) => {
  const user = c.get("user");
  return c.json({ user });
});
```

## Integração Completa: Drizzle + Zod + RPC

```typescript
// packages/api/src/routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

// Schemas Zod gerados do Drizzle
const insertUserSchema = createInsertSchema(users, {
  email: (s) => s.email.email(),
  name: (s) => s.name.min(2),
}).omit({ id: true, createdAt: true, updatedAt: true });

const selectUserSchema = createSelectSchema(users);

export const usersRoutes = new Hono()
  .get("/", async (c) => {
    const allUsers = await db.select().from(users);
    return c.json({ users: allUsers });
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ user });
  })
  .post("/", zValidator("json", insertUserSchema), async (c) => {
    const data = c.req.valid("json");
    const [newUser] = await db.insert(users).values(data).returning();
    return c.json({ user: newUser }, 201);
  });

// packages/api/src/index.ts
import { Hono } from "hono";
import { usersRoutes } from "./routes/users";

const app = new Hono()
  .route("/api/users", usersRoutes);

export type AppType = typeof app;
export default app;
```

```typescript
// packages/app/src/lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@myapp/api";

export const api = hc<AppType>(import.meta.env.VITE_API_URL);
```

```typescript
// packages/app/src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.api.users.$get();
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const res = await api.api.users.$post({ json: data });
      if (!res.ok) throw new Error("Failed to create user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

## Integração com a Stack

- **Bun**: Runtime nativo
- **Zod**: Validação de requests
- **Drizzle**: Queries no banco + drizzle-zod para schemas
- **TanStack Query**: RPC client no frontend
- **Supabase**: Auth middleware com JWT
