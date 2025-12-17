Crie uma nova rota Hono com validacao Zod.

Detalhes da rota: $ARGUMENTS

## Estrutura padrao:

```typescript
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

// Schema de validacao
const inputSchema = z.object({
  // campos...
});

export const [nome]Routes = new Hono()
  .get("/", async (c) => {
    // implementacao
    return c.json({ data: [] });
  })
  .post("/", zValidator("json", inputSchema), async (c) => {
    const data = c.req.valid("json");
    // implementacao
    return c.json({ data }, 201);
  });
```

## Checklist:
- [ ] Criar arquivo em `packages/api/src/routes/`
- [ ] Definir schemas Zod para validacao
- [ ] Usar zValidator em rotas que recebem dados
- [ ] Retornar respostas padronizadas ({ data } ou { error })
- [ ] Registrar rota no `packages/api/src/index.ts`
- [ ] Exportar em `packages/api/src/routes/index.ts`
