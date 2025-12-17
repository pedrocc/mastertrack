# Supabase

## Propósito
Backend-as-a-Service: PostgreSQL, Auth, Storage, Realtime, Edge Functions. Usado em produção.

## Instalação
```bash
bun add @supabase/supabase-js
```

## Setup do Cliente

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Authentication

### Email/Password
```typescript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password123",
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password123",
});

// Sign Out
await supabase.auth.signOut();

// Get User
const { data: { user } } = await supabase.auth.getUser();

// Get Session
const { data: { session } } = await supabase.auth.getSession();
```

### OAuth (Azure AD SSO)

#### Configuração no Azure Portal
1. Acesse Azure Portal > Azure Active Directory > App registrations
2. New registration:
   - Name: `MyApp Supabase Auth`
   - Supported account types: Single tenant ou Multitenant
   - Redirect URI: `https://xxx.supabase.co/auth/v1/callback`
3. Após criar, copie:
   - Application (client) ID
   - Directory (tenant) ID
4. Certificates & secrets > New client secret
   - Copie o valor do secret
5. API permissions > Add permission:
   - Microsoft Graph > Delegated permissions
   - `email`, `openid`, `profile`

#### Configuração no Supabase Dashboard
1. Authentication > Providers > Azure
2. Preencha:
   - Azure Tenant URL: `https://login.microsoftonline.com/{tenant_id}`
   - Client ID: `{application_client_id}`
   - Client Secret: `{client_secret_value}`

#### Código Frontend
```typescript
// Sign in with Azure AD
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "azure",
  options: {
    scopes: "email profile openid",
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});

// Callback page - /auth/callback
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error("Auth error:", error);
        navigate("/login?error=auth_failed");
      } else {
        navigate("/dashboard");
      }
    };

    handleCallback();
  }, [navigate]);

  return <div>Autenticando...</div>;
}
```

### Auth State Listener
```typescript
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";

function useSession() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return session;
}
```

## Storage

```typescript
// Upload
const { data, error } = await supabase.storage
  .from("avatars")
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: "3600",
    upsert: true,
  });

// Download
const { data, error } = await supabase.storage
  .from("avatars")
  .download("path/to/file.png");

// Get Public URL
const { data } = supabase.storage
  .from("avatars")
  .getPublicUrl("path/to/file.png");

// List files
const { data, error } = await supabase.storage
  .from("avatars")
  .list("folder", {
    limit: 100,
    offset: 0,
  });

// Delete
const { data, error } = await supabase.storage
  .from("avatars")
  .remove(["path/to/file.png"]);
```

## Realtime

```typescript
// Subscribe to table changes
const channel = supabase
  .channel("posts")
  .on(
    "postgres_changes",
    {
      event: "*", // INSERT, UPDATE, DELETE
      schema: "public",
      table: "posts",
    },
    (payload) => {
      console.log("Change received!", payload);
    }
  )
  .subscribe();

// Subscribe to specific events
const channel = supabase
  .channel("posts")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "posts" },
    (payload) => console.log("New post:", payload.new)
  )
  .on(
    "postgres_changes",
    { event: "DELETE", schema: "public", table: "posts" },
    (payload) => console.log("Deleted:", payload.old)
  )
  .subscribe();

// Unsubscribe
supabase.removeChannel(channel);
```

### Realtime + React + TanStack Query

```typescript
// hooks/useRealtimePosts.ts
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Post } from "../types";

export function useRealtimePosts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          // Invalidar cache para refetch
          queryClient.invalidateQueries({ queryKey: ["posts"] });

          // Ou atualizar cache diretamente (mais performático)
          if (payload.eventType === "INSERT") {
            queryClient.setQueryData<Post[]>(["posts"], (old) => {
              if (!old) return [payload.new as Post];
              return [payload.new as Post, ...old];
            });
          }

          if (payload.eventType === "DELETE") {
            queryClient.setQueryData<Post[]>(["posts"], (old) => {
              if (!old) return [];
              return old.filter((p) => p.id !== payload.old.id);
            });
          }

          if (payload.eventType === "UPDATE") {
            queryClient.setQueryData<Post[]>(["posts"], (old) => {
              if (!old) return [];
              return old.map((p) =>
                p.id === payload.new.id ? (payload.new as Post) : p
              );
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Uso no componente
function PostList() {
  useRealtimePosts(); // Ativa subscription

  const { data: posts } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  return (
    <ul>
      {posts?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all posts
CREATE POLICY "Public posts are viewable by everyone"
ON posts FOR SELECT
USING (true);

-- Policy: Users can only insert their own posts
CREATE POLICY "Users can insert their own posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own posts
CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can only delete their own posts
CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
USING (auth.uid() = user_id);
```

## Database Queries (via Supabase JS)

```typescript
// Select
const { data, error } = await supabase
  .from("posts")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(10);

// Select with relations
const { data, error } = await supabase
  .from("posts")
  .select(`
    *,
    author:users(id, name, avatar_url),
    comments(id, content, created_at)
  `)
  .eq("id", postId)
  .single();

// Insert
const { data, error } = await supabase
  .from("posts")
  .insert({ title: "New Post", content: "Content" })
  .select()
  .single();

// Update
const { data, error } = await supabase
  .from("posts")
  .update({ title: "Updated Title" })
  .eq("id", postId);

// Delete
const { error } = await supabase
  .from("posts")
  .delete()
  .eq("id", postId);
```

## PGMQ (Message Queue)

```sql
-- Criar fila
SELECT pgmq.create('my_queue');

-- Enviar mensagem
SELECT pgmq.send('my_queue', '{"task": "process", "data": "value"}');

-- Ler mensagens (visibilidade 30s)
SELECT * FROM pgmq.read('my_queue', 30, 1);

-- Deletar mensagem processada
SELECT pgmq.delete('my_queue', msg_id);

-- Arquivar mensagem
SELECT pgmq.archive('my_queue', msg_id);
```

## Desenvolvimento Local

### Opção 1: Docker Compose (Recomendado para Simplicidade)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Use Drizzle direto no PostgreSQL. Ideal quando não precisa de Auth/Storage/Realtime local.

### Opção 2: Supabase CLI (Stack Completa Local)

O Supabase CLI roda toda a stack localmente: PostgreSQL, Auth, Storage, Realtime, Edge Functions.

#### Instalação

```bash
# macOS
brew install supabase/tap/supabase

# npm
npm install -g supabase

# Verificar instalação
supabase --version
```

#### Inicializar Projeto

```bash
# Na raiz do projeto
supabase init

# Isso cria:
# supabase/
# ├── config.toml      # Configurações locais
# ├── seed.sql         # Seeds do banco
# └── migrations/      # Migrations SQL
```

#### Iniciar Stack Local

```bash
# Iniciar todos os serviços (primeira vez demora ~5min)
supabase start

# Output com URLs e keys:
# API URL: http://localhost:54321
# GraphQL URL: http://localhost:54321/graphql/v1
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# Anon key: eyJ...
# Service role key: eyJ...
```

#### Comandos Úteis

```bash
# Parar serviços
supabase stop

# Resetar banco (aplica migrations + seeds)
supabase db reset

# Ver status
supabase status

# Ver logs
supabase logs

# Gerar tipos TypeScript
supabase gen types typescript --local > src/types/database.ts
```

#### Configuração config.toml

```toml
# supabase/config.toml
[api]
port = 54321

[db]
port = 54322

[studio]
port = 54323

[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]

[auth.email]
enable_signup = true
enable_confirmations = false  # Dev: skip email confirmation

[storage]
file_size_limit = "50MiB"
```

#### Variáveis de Ambiente (Dev Local com CLI)

```bash
# .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="eyJ..."  # do output de supabase start
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

#### Migrations com Supabase CLI

```bash
# Criar migration
supabase migration new create_users_table

# Aplicar migrations
supabase db push

# Gerar migration de diff (compara local vs remoto)
supabase db diff --use-migra -f new_migration
```

### Quando Usar Cada Opção

| Cenário | Docker Compose | Supabase CLI |
|---------|----------------|--------------|
| API simples (só banco) | ✅ | Overkill |
| Precisa de Auth local | ❌ | ✅ |
| Precisa de Storage local | ❌ | ✅ |
| Precisa de Realtime local | ❌ | ✅ |
| Edge Functions local | ❌ | ✅ |
| CI/CD (GitHub Actions) | ✅ | Possível mas complexo |

## Edge Functions

Edge Functions são funções serverless que rodam no Deno. Úteis para webhooks, background jobs, e integrações.

### Criar Edge Function

```bash
# Criar função
supabase functions new my-function

# Estrutura criada:
# supabase/functions/my-function/
# └── index.ts
```

### Exemplo de Edge Function

```typescript
// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { to, subject, body } = await req.json();

    // Lógica de envio de email...

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### Testar Localmente

```bash
# Rodar função local
supabase functions serve my-function --env-file .env.local

# Testar com curl
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/my-function' \
  --header 'Authorization: Bearer eyJ...' \
  --header 'Content-Type: application/json' \
  --data '{"to": "user@example.com", "subject": "Test", "body": "Hello"}'
```

### Deploy

```bash
# Deploy função específica
supabase functions deploy my-function

# Deploy todas
supabase functions deploy
```

### Chamar do Frontend

```typescript
const { data, error } = await supabase.functions.invoke("my-function", {
  body: { to: "user@example.com", subject: "Test", body: "Hello" },
});
```

### Webhook Genérico

```typescript
// supabase/functions/webhook-handler/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Validar secret do webhook
  const webhookSecret = req.headers.get("x-webhook-secret");
  if (webhookSecret !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const payload = await req.json();

  // Processar evento
  switch (payload.event) {
    case "user.created":
      // Enviar email de boas-vindas, criar registros relacionados, etc.
      await supabase.from("notifications").insert({
        user_id: payload.data.user_id,
        message: "Bem-vindo!",
      });
      break;

    case "data.updated":
      // Sincronizar com sistema externo
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## Integração com a Stack

- **Hono**: Auth middleware usando Supabase JWT
- **Drizzle**: ORM para queries (prefira Drizzle ao Supabase JS para queries)
- **React**: Hooks para auth state
- **TanStack Query**: Cache de dados
- **Edge Functions**: Webhooks e background jobs
