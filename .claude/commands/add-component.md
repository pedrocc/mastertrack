Crie um novo componente React com tipagem.

Nome e descricao: $ARGUMENTS

## Estrutura padrao:

```tsx
import { cn } from "@/lib/utils";

interface [Nome]Props {
  className?: string;
  // outras props...
}

export function [Nome]({ className, ...props }: [Nome]Props) {
  return (
    <div className={cn("", className)}>
      {/* conteudo */}
    </div>
  );
}
```

## Checklist:
- [ ] Criar arquivo em `packages/app/src/components/`
- [ ] Definir interface de props
- [ ] Usar cn() para classes condicionais
- [ ] Usar componentes shadcn/ui quando apropriado
- [ ] Adicionar className como prop opcional

## Componentes shadcn disponiveis:
- Button, Input, Label
- Card, CardHeader, CardContent, CardTitle, CardDescription
- Badge, Avatar, Skeleton
- Separator, Toast/Toaster

Para adicionar novos componentes shadcn:
```bash
bunx shadcn@latest add [componente]
```
