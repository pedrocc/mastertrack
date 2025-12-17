# CLAUDE.md - Contexto para Claude Code

## Sobre Este Projeto

Template fullstack TypeScript da Masterboi otimizado para desenvolvimento assistido por IA (vibe coding).

**Stack principal:**
- **Runtime:** Bun (all-in-one: bundler, test runner, package manager)
- **Frontend:** React 19 + Vite + TanStack Router + TanStack Query + Tailwind CSS + shadcn/ui
- **Backend:** Hono + Drizzle ORM + Zod
- **Database:** PostgreSQL (Docker local, Supabase em producao)
- **Code Quality:** Biome + Knip + Husky

## Documentacao Completa

Consulte `docs_stack/` para guias detalhados de cada tecnologia:

| Arquivo | Conteudo |
|---------|----------|
| `00-integracao.md` | Guia de integracao completo, CI/CD, testes |
| `01-typescript.md` | Configuracao TypeScript strict |
| `02-bun.md` | Runtime, bundler, test runner |
| `03-zod.md` | Validacao de schemas |
| `04-ts-reset.md` | Correcoes de tipos inseguros |
| `05-bun-workspaces.md` | Estrutura monorepo |
| `06-vite.md` | Frontend bundler |
| `07-react-19.md` | React hooks e componentes |
| `08-tailwind.md` | Estilizacao |
| `09-shadcn-ui.md` | Componentes UI |
| `10-tanstack-query.md` | Data fetching |
| `11-react-hook-form.md` | Formularios |
| `12-hono.md` | Backend framework |
| `13-supabase.md` | Auth, Storage, Realtime |
| `14-drizzle.md` | ORM e gerenciamento de schema |
| `15-biome.md` | Linting e formatting |
| `16-knip.md` | Deteccao de codigo morto |
| `17-husky-lint-staged.md` | Git hooks |
| `18-docker.md` | Containerizacao |
| `19-deploy-producao.md` | Deploy Railway/Portainer |
| `20-tanstack-router.md` | Roteamento type-safe |

## Comandos Principais

```bash
# Desenvolvimento
bun install              # Instalar dependencias
docker compose up -d     # Subir PostgreSQL local
bun run db:push          # Aplicar schema do banco
bun run db:seed          # Popular banco com dados teste
bun run dev              # Rodar em desenvolvimento

# Qualidade
bun run lint             # Verificar codigo
bun run typecheck        # Verificar tipos
bun test                 # Rodar testes
bun run knip             # Verificar codigo morto

# Frontend
bun run routes:generate  # Regenerar tipos do TanStack Router

# Build
bun run build            # Build para producao
```

## Estrutura do Projeto

```
myapp/
├── packages/
│   ├── api/             # Backend Hono
│   │   └── src/
│   │       ├── db/      # Drizzle schema e conexao
│   │       ├── routes/  # Rotas da API
│   │       ├── middleware/
│   │       └── lib/     # Utilitarios (supabase, storage)
│   ├── app/             # Frontend React
│   │   └── src/
│   │       ├── routes/  # Paginas (TanStack Router file-based)
│   │       ├── components/
│   │       │   └── ui/  # Componentes shadcn
│   │       ├── hooks/   # React hooks
│   │       └── lib/     # API client, utils
│   └── shared/          # Tipos e utils compartilhados
├── docs_stack/          # Documentacao da stack
└── .github/workflows/   # CI/CD
```

## Padroes Obrigatorios

### 1. TypeScript Strict Maximo
- Build falha em qualquer erro de tipo
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- Nunca usar `any` (Biome bloqueia)

**Propriedades opcionais com `exactOptionalPropertyTypes`:**
Com essa opcao, nao e possivel passar `undefined` explicitamente para propriedades opcionais. Use o helper `removeUndefined` do `@myapp/shared`:

```typescript
// ERRADO - causa erro TS2379
addGreeting.mutate({ message: "Hello", author: author || undefined });

// CORRETO - usar helper para omitir propriedades undefined
import { removeUndefined } from "@myapp/shared";
addGreeting.mutate(removeUndefined({ message: "Hello", author }));

// ALTERNATIVO - omitir a propriedade condicionalmente
addGreeting.mutate(
  author ? { message: "Hello", author } : { message: "Hello" }
);
```

### 2. Validacao End-to-End com Zod
- Schemas Drizzle geram Zod schemas via drizzle-zod
- API valida requests com @hono/zod-validator
- Frontend valida forms com react-hook-form + zodResolver
- Mesmo schema usado em todas as camadas

### 3. Error Handling
- Middleware usa `HTTPException` para erros de auth (401, 403)
- Rotas retornam `c.json({ error: { code, message } }, status)` para erros de negocio
- Middleware de erro centralizado captura exceptions e formata resposta
- Zod validation errors retornam 400 automaticamente

### 4. Conventional Commits
- `feat:` nova funcionalidade
- `fix:` correcao de bug
- `docs:` documentacao
- `refactor:` refatoracao
- `test:` testes
- `chore:` manutencao

### 5. Organizacao de Codigo
- **Imports sempre no topo:** Ao adicionar novos schemas, tipos ou funcoes, mantenha todos os imports agrupados no topo do arquivo. Nunca adicione imports no meio do arquivo.
- **Ordem de imports:** 1) externos (npm), 2) internos relativos, 3) tipos (usando `type`)

### 6. Formularios com Acessibilidade (a11y)
Labels devem estar sempre associados a inputs via `htmlFor` e `id`:

```typescript
// ERRADO - Biome bloqueia (noLabelWithoutControl)
<label>Nome</label>
<input type="text" />

// CORRETO - label associado ao input
<label htmlFor="user-name">Nome</label>
<input id="user-name" type="text" />

// CORRETO - com shadcn/ui
<Label htmlFor="user-email">Email</Label>
<Input id="user-email" type="email" />
```

### 7. Tipos de Data em Respostas JSON (JsonSerialized)
O Drizzle infere campos `timestamp` como `Date`, mas JSON serializa como `string`. Use `JsonSerialized<T>` para representar dados recebidos da API:

```typescript
import type { JsonSerialized } from "@myapp/shared";
import type { SelectUser } from "@myapp/api/db/schema";

// SelectUser tem createdAt: Date (tipo do Drizzle)
// Mas a API retorna createdAt: string (JSON serializado)

// Use JsonSerialized para o tipo correto no frontend
type User = JsonSerialized<SelectUser>;
// Resultado: { id: string; createdAt: string; updatedAt: string; ... }
```

## Type-Safety End-to-End

```
Drizzle Schema → drizzle-zod → Hono Routes → Hono RPC → React Hooks
     ↓              ↓              ↓            ↓           ↓
   Tabela      Validacao       API type      Cliente    Hook tipado
```

O tipo flui automaticamente do banco ate o componente React.

## Ambiente Local vs Producao

| Servico | Local | Producao |
|---------|-------|----------|
| Database | Docker PostgreSQL | Supabase PostgreSQL |
| Auth | Mock/Local | Supabase Auth |
| Storage | Sistema de arquivos | Supabase Storage |
| Deploy | - | Railway ou Portainer |

## Comandos Claude Customizados

Use os comandos em `.claude/commands/` para tarefas comuns:
- `/new-project <nome>` - Renomear projeto de @myapp para @nome
- `/add-table` - Criar nova tabela com schema completo
- `/add-route` - Criar nova rota Hono (backend)
- `/add-page` - Criar nova pagina/rota frontend (TanStack Router)
- `/add-component` - Criar componente React
- `/check` - Executar lint + typecheck + tests
- `/deploy-checklist` - Verificar prontidao para deploy
