Crie uma nova tabela Drizzle com todos os arquivos necessarios para CRUD completo.

Nome da tabela: $ARGUMENTS

## Checklist de Arquivos

Crie/modifique os seguintes arquivos na ordem:

- [ ] `packages/api/src/db/schema.ts` - Adicionar tabela
- [ ] `packages/api/src/db/schemas.ts` - Adicionar Zod schemas
- [ ] `packages/api/src/routes/[nome].ts` - Criar rota CRUD
- [ ] `packages/api/src/index.ts` - Registrar rota + exportar tipos
- [ ] `packages/app/src/hooks/use[Nome].ts` - Criar hooks React
- [ ] Rodar `bun run db:push` para aplicar schema

---

## 1. Schema Drizzle (`packages/api/src/db/schema.ts`)

Adicione a tabela seguindo o padrao:

```typescript
// Adicionar import se necessario
// import { relations } from "drizzle-orm";

export const nomePlural = pgTable("nome_plural", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Adicionar campos especificos aqui
  // exemplo: title: varchar("title", { length: 255 }).notNull(),
  // exemplo: description: text("description"),
  // exemplo: status: varchar("status", { length: 50 }).default("draft"),
  // exemplo: userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Se tiver relacoes, adicionar:
// export const nomePluralRelations = relations(nomePlural, ({ one, many }) => ({
//   user: one(users, { fields: [nomePlural.userId], references: [users.id] }),
// }));

// Tipos inferidos
export type NomeSingular = typeof nomePlural.$inferSelect;
export type NewNomeSingular = typeof nomePlural.$inferInsert;
```

---

## 2. Zod Schemas (`packages/api/src/db/schemas.ts`)

Adicione os schemas de validacao:

```typescript
import { nomePlural } from "./schema";

// Schema para criar
export const insertNomeSingularSchema = createInsertSchema(nomePlural, {
  // Customizar validacoes aqui
  // title: (schema) => schema.title.min(1, "Titulo obrigatorio").max(255),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema para atualizar (todos campos opcionais)
export const updateNomeSingularSchema = insertNomeSingularSchema.partial();

// Schema para select
export const selectNomeSingularSchema = createSelectSchema(nomePlural);

// Schema para ID nos params
export const nomeSingularIdSchema = z.object({
  id: z.string().uuid("ID invalido"),
});

// Types inferidos
export type InsertNomeSingular = z.infer<typeof insertNomeSingularSchema>;
export type UpdateNomeSingular = z.infer<typeof updateNomeSingularSchema>;
export type SelectNomeSingular = z.infer<typeof selectNomeSingularSchema>;
```

---

## 3. Rota CRUD (`packages/api/src/routes/[nome].ts`)

Criar arquivo com todas as operacoes:

```typescript
import { zValidator } from "@hono/zod-validator";
import { paginationSchema } from "@myapp/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { nomePlural } from "../db/schema";
import {
  insertNomeSingularSchema,
  updateNomeSingularSchema,
  nomeSingularIdSchema,
} from "../db/schemas";
import { authMiddleware } from "../middleware/auth";
import { writeRateLimiter } from "../middleware/rate-limit";

export const nomePluralRoutes = new Hono()
  // GET / - Listar com paginacao
  .get("/", authMiddleware, zValidator("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const offset = (page - 1) * pageSize;

    const [items, countResult] = await Promise.all([
      db.select().from(nomePlural).limit(pageSize).offset(offset).orderBy(nomePlural.createdAt),
      db.select().from(nomePlural),
    ]);

    return c.json({
      data: items,
      pagination: {
        page,
        pageSize,
        total: countResult.length,
        totalPages: Math.ceil(countResult.length / pageSize),
      },
    });
  })

  // GET /:id - Buscar por ID
  .get("/:id", authMiddleware, zValidator("param", nomeSingularIdSchema), async (c) => {
    const { id } = c.req.valid("param");

    const item = await db.query.nomePlural.findFirst({
      where: eq(nomePlural.id, id),
    });

    if (!item) {
      return c.json({ error: { code: "NOT_FOUND", message: "NomeSingular nao encontrado" } }, 404);
    }

    return c.json({ data: item });
  })

  // POST / - Criar
  .post(
    "/",
    authMiddleware,
    writeRateLimiter,
    zValidator("json", insertNomeSingularSchema),
    async (c) => {
      const data = c.req.valid("json");

      const [item] = await db.insert(nomePlural).values(data).returning();

      return c.json({ data: item }, 201);
    }
  )

  // PUT /:id - Atualizar
  .put(
    "/:id",
    authMiddleware,
    writeRateLimiter,
    zValidator("param", nomeSingularIdSchema),
    zValidator("json", updateNomeSingularSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");

      const existing = await db.query.nomePlural.findFirst({
        where: eq(nomePlural.id, id),
      });

      if (!existing) {
        return c.json({ error: { code: "NOT_FOUND", message: "NomeSingular nao encontrado" } }, 404);
      }

      const [item] = await db.update(nomePlural).set(data).where(eq(nomePlural.id, id)).returning();

      return c.json({ data: item });
    }
  )

  // DELETE /:id - Remover
  .delete(
    "/:id",
    authMiddleware,
    writeRateLimiter,
    zValidator("param", nomeSingularIdSchema),
    async (c) => {
      const { id } = c.req.valid("param");

      const existing = await db.query.nomePlural.findFirst({
        where: eq(nomePlural.id, id),
      });

      if (!existing) {
        return c.json({ error: { code: "NOT_FOUND", message: "NomeSingular nao encontrado" } }, 404);
      }

      await db.delete(nomePlural).where(eq(nomePlural.id, id));

      return c.json({ message: "NomeSingular removido com sucesso" });
    }
  );
```

---

## 4. Registrar Rota (`packages/api/src/index.ts`)

```typescript
// Adicionar import
import { nomePluralRoutes } from "./routes/nomePlural";

// Adicionar na cadeia de rotas
.route("/api/nome-plural", nomePluralRoutes)

// Adicionar export de tipos (apos AppType)
export type { InsertNomeSingular, UpdateNomeSingular, SelectNomeSingular } from "./db/schemas";
```

---

## 5. Hook React (`packages/app/src/hooks/useNomePlural.ts`)

```typescript
import type { InsertNomeSingular, UpdateNomeSingular } from "@myapp/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, handleResponse } from "../lib/api";

const NOME_PLURAL_KEY = ["nomePlural"] as const;

interface NomeSingular {
  id: string;
  // Adicionar campos aqui
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: NomeSingular[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function useNomePlural(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...NOME_PLURAL_KEY, { page, pageSize }],
    queryFn: async () => {
      const res = await api.api["nome-plural"].$get({
        query: { page: String(page), pageSize: String(pageSize) },
      });
      return handleResponse<PaginatedResponse>(res);
    },
  });
}

export function useNomeSingular(id: string) {
  return useQuery({
    queryKey: [...NOME_PLURAL_KEY, id],
    queryFn: async () => {
      const res = await api.api["nome-plural"][":id"].$get({
        param: { id },
      });
      return handleResponse<{ data: NomeSingular }>(res);
    },
    enabled: Boolean(id),
  });
}

export function useCreateNomeSingular() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertNomeSingular) => {
      const res = await api.api["nome-plural"].$post({ json: data });
      return handleResponse<{ data: NomeSingular }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOME_PLURAL_KEY });
    },
  });
}

export function useUpdateNomeSingular() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNomeSingular }) => {
      const res = await api.api["nome-plural"][":id"].$put({
        param: { id },
        json: data,
      });
      return handleResponse<{ data: NomeSingular }>(res);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: NOME_PLURAL_KEY });
      queryClient.invalidateQueries({ queryKey: [...NOME_PLURAL_KEY, id] });
    },
  });
}

export function useDeleteNomeSingular() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.api["nome-plural"][":id"].$delete({
        param: { id },
      });
      return handleResponse<{ message: string }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOME_PLURAL_KEY });
    },
  });
}
```

---

## 6. Aplicar Schema

```bash
bun run db:push
```

---

## 7. Atualizar Seed (opcional)

Se quiser dados de exemplo, adicione ao `packages/api/src/db/seed.ts`:

```typescript
import { nomePlural } from "./schema";

const seedNomePlural = [
  { /* campos */ },
  { /* campos */ },
];

// Dentro da funcao seed(), adicionar:

// Em modo force, limpar tabela
if (forceMode) {
  await db.delete(nomePlural);
  console.log("  🗑️  Tabela nome_plural limpa");
}

// Inserir dados
for (const item of seedNomePlural) {
  await db.insert(nomePlural).values(item).onConflictDoNothing();
  console.log(`  ✅ NomeSingular: ${item./* campo identificador */}`);
}
```

Executar seed:
```bash
bun run db:seed          # Adiciona sem duplicar
bun run db:seed --force  # Limpa e recria tudo
```

---

## Verificacao Final

- [ ] `bun run typecheck` passa sem erros
- [ ] `bun run lint` passa sem erros
- [ ] API responde em `/api/nome-plural`
- [ ] Hooks funcionam no frontend
