Execute todas as verificacoes de qualidade do projeto.

## Comandos a executar:

1. **Lint (Biome)**
```bash
bun run lint
```

2. **Type Check (TypeScript)**
```bash
bun run typecheck
```

3. **Testes (Bun)**
```bash
bun test
```

4. **Codigo Morto (Knip)**
```bash
bun run knip
```

## Se houver erros:

### Erros de Lint
- Execute `bun run lint:fix` para corrigir automaticamente
- Erros de `noExplicitAny` requerem tipagem adequada

### Erros de Tipo
- Verifique se os schemas Zod estao sincronizados
- Verifique imports de tipos

### Testes Falhando
- Verifique se o banco esta rodando (`docker compose up -d`)
- Verifique se as migrations foram aplicadas (`bun run db:push`)

### Codigo Morto (Knip)
- Remova exports nao utilizados
- Remova dependencias nao utilizadas
- Use `// knip-ignore-next` para falsos positivos
