# Bun

## Propósito
Runtime all-in-one: bundler, test runner, package manager - substituto do Node.js com performance superior.

## Instalação
```bash
curl -fsSL https://bun.sh/install | bash
```

## Package Manager

```bash
# Instalar dependências
bun install

# Adicionar pacote
bun add zod

# Adicionar dev dependency
bun add -d typescript

# Remover pacote
bun remove lodash

# Atualizar pacotes
bun update
```

## Runtime

```bash
# Executar arquivo TypeScript diretamente
bun run src/index.ts

# Executar script do package.json
bun run dev

# Watch mode
bun --watch run src/index.ts
```

## Bundler

```typescript
// build.ts
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun", // ou "browser", "node"
  minify: true,
  splitting: true,
  sourcemap: "external",
});
```

```bash
bun build ./src/index.ts --outdir ./dist --minify
```

## Test Runner

```typescript
// math.test.ts
import { expect, test, describe, beforeEach } from "bun:test";

describe("math", () => {
  test("addition", () => {
    expect(2 + 2).toBe(4);
  });

  test("async operation", async () => {
    const result = await fetchData();
    expect(result).toBeDefined();
  });
});
```

```bash
# Executar testes
bun test

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

## APIs Nativas

### File I/O
```typescript
// Ler arquivo
const file = Bun.file("./data.json");
const content = await file.text();
const json = await file.json();

// Escrever arquivo
await Bun.write("./output.txt", "Hello, World!");
await Bun.write("./data.json", JSON.stringify(data));
```

### HTTP Server
```typescript
Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") {
      return new Response("Hello!");
    }
    return new Response("Not Found", { status: 404 });
  },
});
```

### SQLite
```typescript
import { Database } from "bun:sqlite";

const db = new Database("mydb.sqlite");
db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");

const insert = db.prepare("INSERT INTO users (name) VALUES (?)");
insert.run("Alice");

const users = db.query("SELECT * FROM users").all();
```

### Environment Variables
```typescript
// Acesso direto (sem dotenv)
const apiKey = Bun.env.API_KEY;
const port = Bun.env.PORT ?? "3000";
```

## bunfig.toml

```toml
[install]
# Usar lockfile
frozen = false

[run]
# Variáveis de ambiente padrão
shell = "bash"

[test]
# Configuração de testes
coverage = true
coverageDir = "coverage"
```

## Scripts no package.json

```json
{
  "scripts": {
    "dev": "bun --watch run src/index.ts",
    "build": "bun build ./src/index.ts --outdir ./dist",
    "test": "bun test",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit"
  }
}
```

## Integração com a Stack

- **Workspaces**: Suporte nativo a monorepos
- **TypeScript**: Executa .ts diretamente sem compilação
- **Vite**: Pode usar Bun como runtime para dev server
- **Hono**: Adapter nativo para Bun.serve()
