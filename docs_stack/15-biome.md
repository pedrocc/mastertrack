# Biome

## Propósito
Linter e formatter ultrarrápido para JavaScript, TypeScript, JSON. Substitui ESLint + Prettier com melhor performance.

## Instalação
```bash
bun add -d @biomejs/biome
```

## Configuração

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog": "warn"
      },
      "complexity": {
        "noBannedTypes": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "es5"
    }
  },
  "json": {
    "formatter": {
      "trailingCommas": "none"
    }
  }
}
```

## Scripts package.json

```json
{
  "scripts": {
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format --write .",
    "check": "biome check .",
    "check:fix": "biome check --write ."
  }
}
```

## Comandos CLI

```bash
# Lint
bunx biome lint .
bunx biome lint --write .  # com auto-fix

# Format
bunx biome format .
bunx biome format --write .

# Check (lint + format)
bunx biome check .
bunx biome check --write .

# CI (falha se houver erros)
bunx biome ci .

# Inicializar config
bunx biome init
```

## Ignorar Arquivos

```json
// biome.json
{
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      ".next",
      "coverage",
      "*.gen.ts"
    ]
  }
}
```

## Regras por Diretório

```json
// biome.json
{
  "overrides": [
    {
      "include": ["tests/**"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off"
          }
        }
      }
    },
    {
      "include": ["scripts/**"],
      "linter": {
        "rules": {
          "suspicious": {
            "noConsoleLog": "off"
          }
        }
      }
    }
  ]
}
```

## Regras Recomendadas

### Correctness
```json
{
  "correctness": {
    "noUnusedImports": "error",
    "noUnusedVariables": "error",
    "useExhaustiveDependencies": "warn",
    "useHookAtTopLevel": "error"
  }
}
```

### Style
```json
{
  "style": {
    "useConst": "error",
    "noNonNullAssertion": "warn",
    "useTemplate": "error",
    "noParameterAssign": "error"
  }
}
```

### Suspicious
```json
{
  "suspicious": {
    "noExplicitAny": "error",
    "noConsoleLog": "warn",
    "noDoubleEquals": "error",
    "noAssignInExpressions": "error"
  }
}
```

## Migração do ESLint

```bash
# Gerar config a partir do ESLint existente
bunx biome migrate eslint --write
```

## Integração VS Code

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

## Integração com a Stack

- **Bun**: Runtime nativo
- **TypeScript**: Suporte completo
- **lint-staged**: Pre-commit hooks
- **CI**: `biome ci` em pipelines

