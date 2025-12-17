# Zod

## Propósito
Validação runtime com inferência de tipos TypeScript - schema declaration e validation em uma única fonte de verdade.

## Instalação
```bash
bun add zod
```

## Schemas Básicos

```typescript
import { z } from "zod";

// Primitivos
const stringSchema = z.string();
const numberSchema = z.number();
const booleanSchema = z.boolean();
const dateSchema = z.date();

// Com validações
const email = z.string().email();
const age = z.number().min(0).max(120);
const password = z.string().min(8).max(100);
const url = z.string().url();
const uuid = z.string().uuid();
```

## Objects

```typescript
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().int().positive().optional(),
  role: z.enum(["admin", "user", "guest"]),
  createdAt: z.date(),
});

// Inferir tipo TypeScript
type User = z.infer<typeof UserSchema>;

// Parsing
const user = UserSchema.parse(data); // throws se inválido
const result = UserSchema.safeParse(data); // retorna { success, data/error }

if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error.issues);
}
```

## Arrays e Records

```typescript
// Arrays
const StringArraySchema = z.array(z.string());
const UsersSchema = z.array(UserSchema);

// Tuplas
const CoordinateSchema = z.tuple([z.number(), z.number()]);

// Records
const UserMapSchema = z.record(z.string(), UserSchema);
```

## Unions e Discriminated Unions

```typescript
// Union simples
const StringOrNumber = z.union([z.string(), z.number()]);

// Discriminated Union (melhor performance)
const ResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);
```

## Transformações

```typescript
const NumberFromString = z.string().transform((val) => parseInt(val, 10));

const UserInputSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().trim(),
  birthDate: z.string().transform((str) => new Date(str)),
});
```

## Refinements

```typescript
const PasswordSchema = z
  .string()
  .min(8)
  .refine((val) => /[A-Z]/.test(val), {
    message: "Deve conter pelo menos uma letra maiúscula",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Deve conter pelo menos um número",
  });

// Super refine para validações complexas
const FormSchema = z
  .object({
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Senhas não conferem",
        path: ["confirmPassword"],
      });
    }
  });
```

## Schemas Opcionais e Nullable

```typescript
const OptionalString = z.string().optional(); // string | undefined
const NullableString = z.string().nullable(); // string | null
const NullishString = z.string().nullish(); // string | null | undefined

// Default values
const WithDefault = z.string().default("default value");
const WithDefaultFn = z.date().default(() => new Date());
```

## Coercion

```typescript
// Converte automaticamente para o tipo
const coercedNumber = z.coerce.number(); // "123" -> 123
const coercedBoolean = z.coerce.boolean(); // "true" -> true
const coercedDate = z.coerce.date(); // "2024-01-01" -> Date
```

## Extend e Merge

```typescript
const BaseUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

// Extend
const UserWithIdSchema = BaseUserSchema.extend({
  id: z.string().uuid(),
});

// Merge
const UserWithMetaSchema = BaseUserSchema.merge(
  z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
  })
);

// Pick e Omit
const UserEmailOnly = UserSchema.pick({ email: true });
const UserWithoutId = UserSchema.omit({ id: true });

// Partial e Required
const PartialUser = UserSchema.partial();
const RequiredUser = UserSchema.required();
```

## Integração com drizzle-zod

```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./schema";

// Gera schema Zod a partir da tabela Drizzle
const insertUserSchema = createInsertSchema(users);
const selectUserSchema = createSelectSchema(users);

// Com refinamentos adicionais
const insertUserSchemaRefined = createInsertSchema(users, {
  email: (schema) => schema.email.email(),
  name: (schema) => schema.name.min(2),
});
```

## Error Messages Customizadas

```typescript
const UserSchema = z.object({
  email: z.string({
    required_error: "Email é obrigatório",
    invalid_type_error: "Email deve ser uma string",
  }).email({ message: "Email inválido" }),
  age: z.number().min(18, { message: "Deve ter pelo menos 18 anos" }),
});
```

## Integração com a Stack

- **Drizzle**: drizzle-zod gera schemas do banco
- **Hono**: zValidator para validação de requests
- **React Hook Form**: zodResolver para validação de formulários
- **TypeScript**: z.infer para tipos
