Verifique se o projeto esta pronto para deploy em producao.

## Checklist de Deploy

### 1. Qualidade de Codigo
- [ ] `bun run lint` passa sem erros
- [ ] `bun run typecheck` passa sem erros
- [ ] `bun test` passa sem erros
- [ ] `bun run knip` nao encontra codigo morto

### 2. Build
- [ ] `bun run build` completa sem erros
- [ ] Bundle size esta aceitavel

### 3. Variaveis de Ambiente
- [ ] `.env.example` esta atualizado
- [ ] Secrets estao configurados no GitHub/Railway/Portainer:
  - DATABASE_URL
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY

### 4. Database
- [ ] Migrations estao geradas (`bun run db:generate`)
- [ ] Schema esta sincronizado com producao

### 5. CI/CD
- [ ] Workflows GitHub Actions estao configurados
- [ ] `DEPLOY_TARGET` esta definido (railway ou portainer)
- [ ] Secrets de deploy estao configurados

### 6. Seguranca
- [ ] Nenhum secret hardcoded no codigo
- [ ] CORS configurado corretamente
- [ ] Rate limiting configurado (se necessario)

## Comandos de Verificacao

```bash
# Executar todas as verificacoes
bun run lint && bun run typecheck && bun test && bun run knip

# Build de producao
bun run build

# Verificar tamanho do bundle
du -sh packages/app/dist
du -sh packages/api/dist
```

## Deploy

### Railway
```bash
# Via CLI
railway up

# Via GitHub (automatico em tags v*)
git tag v1.0.0
git push origin v1.0.0
```

### Portainer
```bash
# Push de tag dispara build e deploy automatico
git tag v1.0.0
git push origin v1.0.0
```
