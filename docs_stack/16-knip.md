# Knip

## Propósito
Detecta código morto: arquivos não utilizados, exports não usados, dependências desnecessárias. Mantém o codebase limpo.

## Instalação
```bash
bun add -d knip
```

## Uso Básico

```bash
# Analisar projeto
bunx knip

# Modo watch
bunx knip --watch

# Saída JSON
bunx knip --reporter json
```

## Configuração

```json
// knip.json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": ["src/index.ts", "src/main.tsx"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": ["**/*.test.ts", "**/*.spec.ts"],
  "ignoreDependencies": ["@types/*"]
}
```

## Configuração TypeScript

```typescript
// knip.ts
import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/index.ts"],
  project: ["src/**/*.ts"],
  ignore: ["**/generated/**"],
  ignoreDependencies: ["prettier"], // Usado pelo editor
  ignoreExportsUsedInFile: true,
};

export default config;
```

## Monorepo (Bun Workspaces)

```json
// knip.json
{
  "workspaces": {
    "packages/app": {
      "entry": ["src/main.tsx"],
      "project": ["src/**/*.{ts,tsx}"]
    },
    "packages/api": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    },
    "packages/shared": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    }
  }
}
```

## O Que Knip Detecta

### Arquivos Não Utilizados
```bash
Unused files (2)
src/utils/deprecated.ts
src/components/OldButton.tsx
```

### Exports Não Utilizados
```bash
Unused exports (3)
src/utils/helpers.ts: formatDate
src/utils/helpers.ts: parseJSON
src/types/index.ts: OldUserType
```

### Dependências Não Utilizadas
```bash
Unused dependencies (2)
lodash
moment
```

### devDependencies em Produção
```bash
Unlisted dependencies (1)
@types/node (used in src/index.ts)
```

## Ignorar Falsos Positivos

### Por Comentário
```typescript
// knip-ignore-next
export const usedExternally = () => {};

// knip:ignore
export type ExternalType = string;
```

### No Config
```json
{
  "ignore": [
    "src/generated/**",
    "**/*.d.ts"
  ],
  "ignoreDependencies": [
    "@types/node",
    "typescript"
  ],
  "ignoreExportsUsedInFile": {
    "interface": true,
    "type": true
  }
}
```

## Plugins

Knip detecta automaticamente configurações de:
- React, Next.js, Vite
- TypeScript, ESLint, Biome
- Jest, Vitest
- Tailwind CSS
- E muitos outros

```json
{
  "vite": {
    "config": ["vite.config.ts"]
  },
  "vitest": {
    "config": ["vitest.config.ts"]
  },
  "tailwind": {
    "config": ["tailwind.config.ts"]
  }
}
```

## Scripts package.json

```json
{
  "scripts": {
    "knip": "knip",
    "knip:fix": "knip --fix",
    "knip:watch": "knip --watch"
  }
}
```

## Opções CLI

```bash
# Mostrar apenas arquivos não usados
bunx knip --include files

# Mostrar apenas exports não usados
bunx knip --include exports

# Mostrar apenas dependências não usadas
bunx knip --include dependencies

# Excluir tipos
bunx knip --exclude types

# Auto-fix (remove exports não usados)
bunx knip --fix

# Modo strict (inclui tipos)
bunx knip --strict
```

## CI Integration

```yaml
# .github/workflows/ci.yml
jobs:
  knip:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bunx knip
```

## Integração com a Stack

- **Bun Workspaces**: Suporte nativo a monorepos
- **TypeScript**: Análise de tipos
- **Biome**: Complementa lint (Knip foca em código morto)
- **CI**: Previne acúmulo de código não usado

