# Drizzle ORM

## Propósito
ORM TypeScript-first, leve e type-safe para PostgreSQL, MySQL e SQLite.

## Instalação
```bash
bun add drizzle-orm postgres
bun add -d drizzle-kit
```

## Schema Definition

```typescript
// db/schema.ts
import { pgTable, text, integer, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  published: boolean("published").default(false).notNull(),
  authorId: uuid("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  postId: uuid("post_id").notNull().references(() => posts.id),
  authorId: uuid("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));
```

## Database Connection

```typescript
// db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

## Drizzle Kit Config

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Gerenciamento de Schema

O Drizzle Kit oferece duas abordagens para aplicar mudancas no banco de dados:

### Push (Usado neste template)

```bash
# Sincroniza schema direto com o banco
bunx drizzle-kit push
```

O comando `push` aplica mudancas diretamente no banco sem gerar arquivos de migration. E a abordagem **codebase first** onde o schema TypeScript e a fonte da verdade.

**Quando usar push:**
- Desenvolvimento local e prototipacao rapida
- Projetos pequenos/medios onde auditoria de migrations nao e critica
- Iteracoes rapidas sem overhead de gerenciar arquivos SQL

**Este template usa `db:push`** porque:
1. Simplifica o fluxo de desenvolvimento
2. O schema TypeScript ja serve como documentacao
3. Em producao com Supabase, mudancas criticas devem passar por review manual

### Migrations (Recomendado para CI/CD e producao)

```bash
# Gerar arquivo de migration SQL
bunx drizzle-kit generate

# Aplicar migrations pendentes (nao-interativo, seguro para CI/CD)
bunx drizzle-kit migrate
```

**Quando usar migrations:**
- **CI/CD pipelines** - `migrate` nao e interativo, diferente de `push`
- Ambientes de producao que exigem auditoria completa
- Times grandes onde mudancas precisam de review
- Rollbacks precisam ser deterministicos

**IMPORTANTE: `db:push` e interativo e NAO funciona em CI/CD**

O comando `drizzle-kit push` pode fazer perguntas interativas quando detecta mudancas ambiguas (ex: "esta coluna foi renomeada ou criada?"). Para CI/CD, use sempre migrations:

```bash
# Em CI/CD, use migrate em vez de push
bunx drizzle-kit migrate
```

Se optar por migrations, os arquivos SQL serao gerados em `./drizzle/` (configurado em `drizzle.config.ts`).

### Drizzle Studio

```bash
# Abrir interface visual do banco
bunx drizzle-kit studio
```

## Queries

### Select
```typescript
import { db } from "./db";
import { users, posts } from "./db/schema";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";

// Select all
const allUsers = await db.select().from(users);

// Select with where
const user = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);

// Select specific columns
const userNames = await db
  .select({ id: users.id, name: users.name })
  .from(users);

// Complex where
const filteredUsers = await db
  .select()
  .from(users)
  .where(
    and(
      like(users.email, "%@gmail.com"),
      or(
        eq(users.name, "John"),
        eq(users.name, "Jane")
      )
    )
  );

// Order and pagination
const paginatedPosts = await db
  .select()
  .from(posts)
  .orderBy(desc(posts.createdAt))
  .limit(10)
  .offset(20);
```

### Relational Queries
```typescript
// Com relations definidas
const postsWithAuthor = await db.query.posts.findMany({
  with: {
    author: true,
    comments: {
      with: {
        author: true,
      },
    },
  },
  where: eq(posts.published, true),
  orderBy: [desc(posts.createdAt)],
  limit: 10,
});

// Single result
const post = await db.query.posts.findFirst({
  where: eq(posts.id, postId),
  with: {
    author: true,
  },
});
```

### Insert
```typescript
// Single insert
const newUser = await db
  .insert(users)
  .values({
    email: "john@example.com",
    name: "John Doe",
  })
  .returning();

// Multiple insert
const newUsers = await db
  .insert(users)
  .values([
    { email: "user1@example.com", name: "User 1" },
    { email: "user2@example.com", name: "User 2" },
  ])
  .returning();

// On conflict (upsert)
await db
  .insert(users)
  .values({ email: "john@example.com", name: "John" })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: "John Updated" },
  });
```

### Update
```typescript
const updated = await db
  .update(users)
  .set({ name: "New Name" })
  .where(eq(users.id, userId))
  .returning();
```

### Delete
```typescript
await db
  .delete(users)
  .where(eq(users.id, userId));
```

### Transactions
```typescript
await db.transaction(async (tx) => {
  const user = await tx
    .insert(users)
    .values({ email: "new@example.com", name: "New User" })
    .returning();

  await tx
    .insert(posts)
    .values({
      title: "First Post",
      content: "Content",
      authorId: user[0].id,
    });
});
```

## Integração com drizzle-zod

```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./db/schema";

// Gerar schemas Zod do Drizzle schema
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email(),
  name: (schema) => schema.name.min(2),
});

export const selectUserSchema = createSelectSchema(users);

// Types
export type InsertUser = typeof insertUserSchema._type;
export type User = typeof selectUserSchema._type;
```

## Seeds (Dados de Teste)

```typescript
// db/seed.ts
import { db } from "./index";
import { users, posts, comments } from "./schema";

async function seed() {
  console.log("Seeding database...");

  // Limpar tabelas (ordem importa por causa das FKs)
  await db.delete(comments);
  await db.delete(posts);
  await db.delete(users);

  // Criar usuários
  const [alice, bob] = await db
    .insert(users)
    .values([
      { email: "alice@example.com", name: "Alice" },
      { email: "bob@example.com", name: "Bob" },
    ])
    .returning();

  console.log(`Created ${2} users`);

  // Criar posts
  const [post1, post2] = await db
    .insert(posts)
    .values([
      {
        title: "Primeiro Post",
        content: "Conteúdo do primeiro post",
        published: true,
        authorId: alice.id,
      },
      {
        title: "Segundo Post",
        content: "Conteúdo do segundo post",
        published: false,
        authorId: bob.id,
      },
    ])
    .returning();

  console.log(`Created ${2} posts`);

  // Criar comentários
  await db.insert(comments).values([
    { content: "Ótimo post!", postId: post1.id, authorId: bob.id },
    { content: "Concordo!", postId: post1.id, authorId: alice.id },
  ]);

  console.log(`Created ${2} comments`);
  console.log("Seeding complete!");
}

seed()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
```

```json
// package.json
{
  "scripts": {
    "db:seed": "bun run db/seed.ts"
  }
}
```

## Conexão por Ambiente

```typescript
// db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Configuração diferente para dev vs prod
const client = postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 10 : 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
```

## Raw SQL e PGMQ

```typescript
import { sql } from "drizzle-orm";
import { db } from "./db";

// Criar fila PGMQ
await db.execute(sql`SELECT pgmq.create('notifications')`);

// Enviar mensagem
await db.execute(
  sql`SELECT pgmq.send('notifications', ${JSON.stringify({
    type: "new_post",
    postId: "123",
    userId: "456",
  })})`
);

// Ler mensagens
const messages = await db.execute<{
  msg_id: number;
  message: unknown;
}>(sql`SELECT * FROM pgmq.read('notifications', 30, 10)`);

// Processar e deletar
for (const msg of messages.rows) {
  // Processar...
  await db.execute(sql`SELECT pgmq.delete('notifications', ${msg.msg_id})`);
}
```

## Integração com a Stack

- **Hono**: Queries nos handlers
- **Zod**: drizzle-zod para validação
- **Supabase**: Mesmo PostgreSQL em produção
- **TypeScript**: Tipos inferidos automaticamente
- **Docker**: PostgreSQL local para desenvolvimento
