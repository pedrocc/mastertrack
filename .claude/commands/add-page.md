Crie uma nova pagina/rota frontend com TanStack Router.

Detalhes da pagina: $ARGUMENTS

## Estrutura de arquivos

As rotas ficam em `packages/app/src/routes/`:

```
routes/
├── __root.tsx        # Layout raiz (ja existe)
├── index.tsx         # Rota "/"
├── about.tsx         # Rota "/about"
└── users/
    ├── index.tsx     # Rota "/users"
    └── $userId.tsx   # Rota "/users/:userId" (dinamica)
```

## Template: Rota Estatica

```typescript
// routes/[nome].tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/[caminho]")({
  component: [Nome]Page,
});

function [Nome]Page() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">[Titulo]</h2>
        <p className="text-muted-foreground">[Descricao]</p>
      </div>

      {/* Conteudo da pagina */}
    </>
  );
}
```

## Template: Rota Dinamica

```typescript
// routes/[recurso]/$[param].tsx
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { use[Recurso] } from "../../hooks/use[Recursos]";

export const Route = createFileRoute("/[recurso]/$[param]Id")({
  component: [Recurso]Page,
});

function [Recurso]Page() {
  const { [param]Id } = Route.useParams();
  const { data, isLoading, error } = use[Recurso]([param]Id);
  const [recurso] = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[100px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || ![recurso]) {
    return (
      <div className="space-y-4">
        <Link to="/[recurso]">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/[recurso]">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{[recurso].name}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Detalhes do recurso */}
        </CardContent>
      </Card>
    </div>
  );
}
```

## Template: Rota com Search Params

```typescript
// routes/[nome].tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(20),
  sort: z.enum(["name", "createdAt"]).default("createdAt"),
});

export const Route = createFileRoute("/[caminho]")({
  validateSearch: searchSchema,
  component: [Nome]Page,
});

function [Nome]Page() {
  const { page, pageSize, sort } = Route.useSearch();
  // Use os parametros de busca tipados
}
```

## Checklist

- [ ] Criar arquivo em `packages/app/src/routes/`
- [ ] Usar `createFileRoute` com o caminho correto
- [ ] Para rotas dinamicas, usar `$param` no nome do arquivo
- [ ] Importar componentes UI de `../components/ui/`
- [ ] Se precisar de dados, criar/usar hooks em `../hooks/`
- [ ] Rodar `bun run routes:generate` para regenerar tipos (ou `bun run dev` inicia automaticamente)
- [ ] Testar navegacao com `<Link to="...">` type-safe

## Navegacao

Adicione links para a nova pagina no `__root.tsx` se necessario:

```tsx
<nav className="flex gap-4">
  <Link to="/" className="...">Home</Link>
  <Link to="/[nova-rota]" className="...">Nova Pagina</Link>
</nav>
```
