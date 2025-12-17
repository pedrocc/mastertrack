# TanStack Router

## Visao Geral

TanStack Router e uma biblioteca de roteamento type-safe para React, com suporte nativo a file-based routing.

## Instalacao

```bash
bun add @tanstack/react-router @tanstack/router-devtools
bun add -D @tanstack/router-plugin
```

## Configuracao

### Vite Plugin

```typescript
// vite.config.ts
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [TanStackRouterVite({ autoCodeSplitting: true }), react()],
});
```

### Registro do Router

```typescript
// App.tsx
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} />;
}
```

## Estrutura de Rotas

```
src/routes/
├── __root.tsx        # Layout raiz (header, footer)
├── index.tsx         # Rota "/"
├── about.tsx         # Rota "/about"
└── users/
    ├── index.tsx     # Rota "/users"
    └── $userId.tsx   # Rota "/users/:userId" (dinamica)
```

## Criando Rotas

### Rota Raiz (Layout)

```typescript
// routes/__root.tsx
import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div>
      <header>...</header>
      <main>
        <Outlet /> {/* Renderiza rotas filhas */}
      </main>
    </div>
  );
}
```

### Rota Estatica

```typescript
// routes/about.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return <h1>Sobre</h1>;
}
```

### Rota Dinamica

```typescript
// routes/users/$userId.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$userId")({
  component: UserPage,
});

function UserPage() {
  const { userId } = Route.useParams();
  return <h1>Usuario: {userId}</h1>;
}
```

## Navegacao

### Link Component

```tsx
import { Link } from "@tanstack/react-router";

// Link simples
<Link to="/about">Sobre</Link>

// Link com parametros dinamicos
<Link to="/users/$userId" params={{ userId: "123" }}>
  Ver Usuario
</Link>

// Link com search params
<Link to="/users" search={{ page: 1, sort: "name" }}>
  Usuarios
</Link>

// Estilo condicional (classe .active adicionada automaticamente)
<Link
  to="/"
  className="text-muted-foreground [&.active]:text-foreground"
>
  Home
</Link>
```

### Navegacao Programatica

```tsx
import { useNavigate } from "@tanstack/react-router";

function Component() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: "/users/$userId", params: { userId: "123" } });
  };
}
```

## Search Params

### Definindo Schema

```typescript
// routes/users.tsx
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().default(1),
  sort: z.enum(["name", "email"]).default("name"),
});

export const Route = createFileRoute("/users")({
  validateSearch: searchSchema,
  component: UsersPage,
});

function UsersPage() {
  const { page, sort } = Route.useSearch();
  // page e sort sao tipados automaticamente
}
```

## Loaders (Data Fetching)

### Com TanStack Query

```typescript
// routes/users/$userId.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$userId")({
  loader: async ({ params }) => {
    // Pode usar queryClient aqui
    return { userId: params.userId };
  },
  component: UserPage,
});

function UserPage() {
  const { userId } = Route.useLoaderData();
  const { data } = useUser(userId); // Hook do TanStack Query
}
```

## DevTools

DevTools sao incluidos automaticamente em desenvolvimento:

```tsx
// routes/__root.tsx
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

function RootLayout() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}
```

## Type Safety

### Links Type-Safe

```tsx
// TypeScript vai reclamar se a rota nao existir
<Link to="/rota-inexistente">Erro!</Link>

// Parametros obrigatorios sao validados
<Link to="/users/$userId">Erro! Falta params</Link>
<Link to="/users/$userId" params={{ userId: "123" }}>OK!</Link>
```

### Inferencia de Tipos

```typescript
// O tipo do parametro e inferido automaticamente
const { userId } = Route.useParams();
// userId: string

// Search params tambem
const { page } = Route.useSearch();
// page: number (se definido no schema)
```

## Integracao com TanStack Query

O TanStack Router integra naturalmente com TanStack Query. Os hooks de query podem ser usados dentro dos componentes de rota normalmente:

```typescript
function UserPage() {
  const { userId } = Route.useParams();
  const { data, isLoading } = useUser(userId);

  if (isLoading) return <Skeleton />;
  return <UserDetails user={data} />;
}
```

## Arquivos Gerados

O plugin gera automaticamente `routeTree.gen.ts` que contem a arvore de rotas tipada. Este arquivo:

- E gerado automaticamente pelo Vite plugin
- Nao deve ser editado manualmente
- Deve ser ignorado no Knip (ja configurado)
- Pode ser commitado ou gitignored (preferencia do time)

## Regeneracao de Rotas

**Problema comum:** Ao criar uma nova pagina em `packages/app/src/routes/`, o TypeScript pode reclamar que a rota nao existe.

**Causa:** O arquivo `routeTree.gen.ts` precisa ser regenerado para incluir a nova rota.

**Solucao:**

```bash
# Se o servidor de desenvolvimento estiver rodando, a regeneracao e automatica.
# Caso contrario, execute manualmente:
bun run routes:generate
```

O comando `routes:generate` usa o CLI do TanStack Router (`tsr generate`) para regenerar a arvore de rotas sem precisar iniciar o servidor de desenvolvimento.

## Recursos Adicionais

- [Documentacao Oficial](https://tanstack.com/router/latest)
- [File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)
- [Type Safety](https://tanstack.com/router/latest/docs/framework/react/guide/type-safety)
