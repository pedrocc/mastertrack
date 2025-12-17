# Husky + lint-staged

## Propósito
Husky: Git hooks automatizados. lint-staged: Executa comandos apenas em arquivos staged. Juntos garantem qualidade antes do commit.

## Instalação

```bash
bun add -d husky lint-staged
```

## Setup Husky

```bash
# Inicializar husky
bunx husky init

# Isso cria:
# - .husky/ diretório
# - .husky/pre-commit hook
# - Adiciona "prepare": "husky" no package.json
```

## Configuração lint-staged

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "biome check --write",
      "biome format --write"
    ],
    "*.{json,md}": [
      "biome format --write"
    ]
  }
}
```

Ou em arquivo separado:

```javascript
// lint-staged.config.js
export default {
  "*.{ts,tsx}": [
    "biome check --write",
    "biome format --write",
  ],
  "*.{json,md}": [
    "biome format --write",
  ],
};
```

## Hook Pre-commit

```bash
# .husky/pre-commit
bunx lint-staged
```

## Hook Commit-msg (Conventional Commits)

```bash
# Instalar commitlint
bun add -d @commitlint/cli @commitlint/config-conventional
```

```javascript
// commitlint.config.js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "chore",
        "revert",
      ],
    ],
    "subject-case": [2, "always", "lower-case"],
    "subject-max-length": [2, "always", 72],
  },
};
```

```bash
# .husky/commit-msg
bunx commitlint --edit $1
```

## Hook Pre-push

```bash
# .husky/pre-push
bun run typecheck
bun test
```

## Configuração Completa

```json
// package.json
{
  "scripts": {
    "prepare": "husky",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "biome check --write"
    ],
    "*.{json,md,css}": [
      "biome format --write"
    ]
  }
}
```

## Estrutura de Arquivos

```
.husky/
├── _/
│   └── husky.sh
├── pre-commit
├── commit-msg
└── pre-push
```

## Bypass Hooks (Emergência)

```bash
# Pular pre-commit
git commit --no-verify -m "emergency fix"

# Pular pre-push
git push --no-verify
```

## Monorepo Setup

```javascript
// lint-staged.config.js
export default {
  "packages/app/**/*.{ts,tsx}": [
    "biome check --write",
  ],
  "packages/api/**/*.ts": [
    "biome check --write",
  ],
  "*.json": [
    "biome format --write",
  ],
};
```

## Executar Testes em Arquivos Modificados

```javascript
// lint-staged.config.js
export default {
  "*.{ts,tsx}": [
    "biome check --write",
    // Testa apenas arquivos relacionados
    "bun test --related",
  ],
};
```

## Debug

```bash
# Ver o que lint-staged vai executar
bunx lint-staged --debug

# Executar sem modificar arquivos
bunx lint-staged --dry-run
```

## CI Skip

```bash
# .husky/pre-commit
# Pular em CI
[ -n "$CI" ] && exit 0

bunx lint-staged
```

## Integração com a Stack

- **Biome**: Lint e format nos hooks
- **TypeScript**: Type check no pre-push
- **Bun**: Test runner no pre-push
- **Git**: Conventional commits com commitlint

