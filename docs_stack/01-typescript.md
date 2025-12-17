# TypeScript (Strict Mode)

## Propósito
Tipagem estática com máxima segurança através de flags strict do compilador.

## Configuração Strict Máxima

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ESNext",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

## Flags Importantes

| Flag | Propósito |
|------|-----------|
| `strict` | Ativa todas as verificações strict |
| `noUncheckedIndexedAccess` | Arrays e objetos indexados retornam `T \| undefined` |
| `exactOptionalPropertyTypes` | Diferencia `undefined` de propriedade opcional |
| `noImplicitOverride` | Exige `override` keyword em métodos sobrescritos |
| `verbatimModuleSyntax` | Imports type-only devem usar `import type` |

## Padrões de Uso

### Type Inference
```typescript
// Prefira inferência quando óbvio
const users = ["Alice", "Bob"]; // string[]
const count = 42; // number

// Anote quando necessário
const config: AppConfig = {
  port: 3000,
  host: "localhost"
};
```

### Utility Types
```typescript
// Partial - todas propriedades opcionais
type UpdateUser = Partial<User>;

// Pick - seleciona propriedades
type UserPreview = Pick<User, "id" | "name">;

// Omit - remove propriedades
type CreateUser = Omit<User, "id" | "createdAt">;

// Record - objeto tipado
type UserMap = Record<string, User>;

// Required - todas propriedades obrigatórias
type CompleteUser = Required<User>;
```

### Discriminated Unions
```typescript
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

function handleResult<T, E>(result: Result<T, E>) {
  if (result.success) {
    // TypeScript sabe que result.data existe
    console.log(result.data);
  } else {
    // TypeScript sabe que result.error existe
    console.error(result.error);
  }
}
```

### Branded Types
```typescript
type UserId = string & { readonly brand: unique symbol };
type PostId = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
  return id as UserId;
}

// Impede mistura de IDs
function getUser(id: UserId) { /* ... */ }
getUser(createUserId("123")); // OK
getUser("123"); // Erro!
```

### Const Assertions
```typescript
// as const para valores literais imutáveis
const ROLES = ["admin", "user", "guest"] as const;
type Role = typeof ROLES[number]; // "admin" | "user" | "guest"

const CONFIG = {
  api: {
    baseUrl: "https://api.example.com",
    timeout: 5000
  }
} as const;
```

### Template Literal Types
```typescript
type EventName = `on${Capitalize<string>}`;
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type ApiEndpoint = `/${string}`;
type Route = `${HttpMethod} ${ApiEndpoint}`;
```

## Integração com a Stack

- **Zod**: Inferência de tipos com `z.infer<typeof schema>`
- **Drizzle**: Tipos gerados automaticamente do schema
- **Hono**: Type-safety end-to-end com RPC
- **React**: Props tipadas com interfaces
