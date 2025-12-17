Renomeia o projeto de @myapp para o novo nome em todo o codebase.

Novo nome do projeto: $ARGUMENTS

## Instrucoes

O usuario quer renomear o projeto de `@myapp` para `@$ARGUMENTS`.

### Arquivos para alterar (codigo fonte):

1. **package.json** (raiz)
   - `name`: de `myapp` para `$ARGUMENTS`
   - Scripts: substituir `@myapp` por `@$ARGUMENTS`

2. **packages/api/package.json**
   - `name`: de `@myapp/api` para `@$ARGUMENTS/api`
   - `dependencies`: `@myapp/shared` para `@$ARGUMENTS/shared`

3. **packages/app/package.json**
   - `name`: de `@myapp/app` para `@$ARGUMENTS/app`
   - `dependencies`: `@myapp/api` e `@myapp/shared`

4. **packages/shared/package.json**
   - `name`: de `@myapp/shared` para `@$ARGUMENTS/shared`

5. **tsconfig.json**
   - `paths`: `@myapp/*` para `@$ARGUMENTS/*`

6. **knip.json**
   - `ignoreDependencies`: `@myapp/api` para `@$ARGUMENTS/api`
   - `ignoreDependencies`: `@myapp/shared` para `@$ARGUMENTS/shared`

7. **docker-compose.yml**
   - `container_name`: `myapp_postgres` para `$ARGUMENTS_postgres`
   - `container_name`: `myapp_redis` para `$ARGUMENTS_redis`

8. **.env.example**
   - `VITE_APP_NAME`: de `"MyApp"` para `"$ARGUMENTS"` (capitalizado)

9. **packages/app/index.html**
   - `<title>`: de `MyApp` para `$ARGUMENTS` (capitalizado)

10. **packages/api/src/** (todos os arquivos .ts)
    - Imports: `from "@myapp/..."` para `from "@$ARGUMENTS/..."`

11. **packages/app/src/** (todos os arquivos .ts e .tsx)
    - Imports: `from "@myapp/..."` para `from "@$ARGUMENTS/..."`

### Arquivos para NAO alterar:

- `docs_stack/` - documentacao de referencia do template
- `bun.lock` - sera regenerado automaticamente
- `README.md` - menciona @myapp como instrucao, manter

### Passos de execucao:

1. Fazer todas as substituicoes listadas acima
2. Executar `bun install` para regenerar o lockfile
3. Executar `bun run typecheck` para verificar que tudo esta correto
4. Informar o usuario sobre as mudancas feitas

### Validacao:

Apos as alteracoes, rodar:
```bash
bun install
bun run typecheck
```

Se houver erros, corrigir antes de finalizar.
