# Stack Tecnológica

## Estratégia de Ambientes

### Controle de Versão
- **GitHub** - Repositório principal do código

### Desenvolvimento Local
- **Docker** - Containerização dos serviços
- **PostgreSQL** (container) - Banco de dados local
- Ambiente isolado e reproduzível para todos os desenvolvedores

### Produção
- **Supabase** - Banco de dados, Auth, Storage, Realtime, PGMQ
- **Hospedagem** - Duas opções conforme o projeto:
  - **Railway** - Deploy automático via GitHub, escala automática
  - **Portainer** - Container Docker em ambiente corporativo gerenciado

### Benefícios dessa Abordagem
1. **Custo zero em dev** - Sem dependência de serviços pagos durante desenvolvimento
2. **Paridade de ambiente** - PostgreSQL local idêntico ao Supabase (que usa PostgreSQL)
3. **Velocidade** - Desenvolvimento offline sem latência de rede
4. **Controle total** - Reset do banco, seeds, migrations sem afetar produção

---

| Camada | Tecnologia | Propósito |
|--------|------------|-----------|
| Core | TypeScript (strict máximo) | Tipagem estática com flags de segurança |
| | Bun | Runtime all-in-one (bundler, test, pkg manager) |
| | Zod + drizzle-zod | Validação runtime unificada com DB schemas |
| | ts-reset | Corrige defaults inseguros do TS |
| | neverthrow | Error handling type-safe (Result types) |
| Monorepo | Bun Workspaces | Gerenciamento nativo de workspaces |
| Frontend | Vite + React 19 | SPA com HMR instantâneo |
| | Tailwind CSS + shadcn/ui | UI com componentes acessíveis |
| | TanStack Query + Hono RPC | Type-safety end-to-end |
| | React Hook Form + Zod | Formulários com validação |
| Backend | Hono + Zod-OpenAPI | REST API com validação automática |
| | Supabase Auth | Autenticação (email + Azure AD SSO) |
| Database | Supabase PostgreSQL | Managed DB com pooling |
| | Drizzle ORM | Queries type-safe, migrations |
| Background Jobs | Supabase PGMQ | Filas nativas PostgreSQL |
| Storage | Supabase Storage | 100GB incluído, CDN, RLS |
| Realtime | Supabase Realtime | WebSocket para notificações |
| Code Quality | Biome | Linting + formatting (instantâneo) |
| | Knip | Detecta código morto |
| | Husky + lint-staged | Pre-commit hooks |
