# ts-reset

## Propósito
Corrige defaults inseguros do TypeScript, tornando os tipos built-in mais previsíveis e seguros.

## Instalação
```bash
bun add -d @total-typescript/ts-reset
```

## Configuração

```typescript
// reset.d.ts (na raiz do projeto)
import "@total-typescript/ts-reset";
```

Ou importar seletivamente:
```typescript
// Apenas algumas correções
import "@total-typescript/ts-reset/filter-boolean";
import "@total-typescript/ts-reset/array-includes";
```

## Correções Disponíveis

### 1. `.filter(Boolean)` Type-Safe

**Sem ts-reset:**
```typescript
const arr = [1, undefined, 2, null, 3];
const filtered = arr.filter(Boolean);
// tipo: (number | undefined | null)[] ❌
```

**Com ts-reset:**
```typescript
const arr = [1, undefined, 2, null, 3];
const filtered = arr.filter(Boolean);
// tipo: number[] ✅
```

### 2. `JSON.parse()` Retorna `unknown`

**Sem ts-reset:**
```typescript
const data = JSON.parse('{"name": "John"}');
// tipo: any ❌ (perigoso!)
```

**Com ts-reset:**
```typescript
const data = JSON.parse('{"name": "John"}');
// tipo: unknown ✅ (força validação)

// Agora você precisa validar
const validated = UserSchema.parse(data);
```

### 3. `.includes()` Aceita Tipos Mais Amplos

**Sem ts-reset:**
```typescript
const arr = ["a", "b", "c"] as const;
const input: string = getInput();
arr.includes(input); // Erro: string não é "a" | "b" | "c"
```

**Com ts-reset:**
```typescript
const arr = ["a", "b", "c"] as const;
const input: string = getInput();
arr.includes(input); // OK ✅
```

### 4. `Set.has()` e `Map.has()` Type-Safe

**Sem ts-reset:**
```typescript
const set = new Set(["a", "b", "c"] as const);
const input: string = getInput();
set.has(input); // Erro
```

**Com ts-reset:**
```typescript
const set = new Set(["a", "b", "c"] as const);
const input: string = getInput();
set.has(input); // OK ✅
```

### 5. `fetch()` Retorna `unknown` no `.json()`

**Sem ts-reset:**
```typescript
const response = await fetch("/api/users");
const data = await response.json();
// tipo: any ❌
```

**Com ts-reset:**
```typescript
const response = await fetch("/api/users");
const data = await response.json();
// tipo: unknown ✅

// Força validação
const users = UsersSchema.parse(data);
```

### 6. Comparações com `===` Mais Estritas

Previne comparações sempre-falsas ou sempre-verdadeiras.

## Lista de Resets Disponíveis

| Reset | Descrição |
|-------|-----------|
| `filter-boolean` | `.filter(Boolean)` remove nullish |
| `json-parse` | `JSON.parse()` retorna `unknown` |
| `fetch` | `response.json()` retorna `unknown` |
| `array-includes` | `.includes()` aceita tipos amplos |
| `set-has` | `Set.has()` aceita tipos amplos |
| `map-has` | `Map.has()` aceita tipos amplos |
| `array-index-of` | `.indexOf()` aceita tipos amplos |

## Configuração Recomendada

```typescript
// reset.d.ts
// Importar todos os resets recomendados
import "@total-typescript/ts-reset";

// Ou ser seletivo para projetos legados
// import "@total-typescript/ts-reset/filter-boolean";
// import "@total-typescript/ts-reset/json-parse";
```

## Integração com a Stack

- **Zod**: Complementa ts-reset ao forçar validação de `JSON.parse()` e `fetch`
- **TypeScript strict**: Funciona junto com todas as flags strict
- **Bun**: Compatível sem configuração adicional
