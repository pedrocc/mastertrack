# shadcn/ui

## Propósito
Biblioteca de componentes acessíveis construídos com Radix UI e Tailwind CSS. Componentes são copiados para o projeto (não é dependência).

## Instalação
```bash
bunx shadcn@latest init
```

Responda às perguntas:
- Style: Default ou New York
- Base color: Slate, Gray, Zinc, etc.
- CSS variables: Yes

## Adicionar Componentes

```bash
# Adicionar componente individual
bunx shadcn@latest add button
bunx shadcn@latest add dialog
bunx shadcn@latest add form

# Adicionar múltiplos
bunx shadcn@latest add button card dialog input

# Ver componentes disponíveis
bunx shadcn@latest add
```

## Estrutura de Arquivos

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── form.tsx
└── lib/
    └── utils.ts   # cn() helper
```

## cn() Utility

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Componentes Principais

### Button
```tsx
import { Button } from "@/components/ui/button";

// Variantes
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamanhos
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconComponent /></Button>

// Com loading
<Button disabled>
  <Spinner className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

### Input
```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="email@example.com"
  />
</div>
```

### Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Edit Profile</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <Input id="name" defaultValue="John Doe" />
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Card
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description here.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Form (com React Hook Form + Zod)
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
});

function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                Your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Select
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
    <SelectItem value="orange">Orange</SelectItem>
  </SelectContent>
</Select>
```

## Customização

```tsx
// Estender variantes do Button
<Button
  variant="outline"
  className="border-blue-500 text-blue-500 hover:bg-blue-50"
>
  Custom Style
</Button>

// Componente wrapper customizado
function PrimaryButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      className="bg-gradient-to-r from-blue-500 to-purple-500"
      {...props}
    >
      {children}
    </Button>
  );
}
```

## Integração com a Stack

- **Tailwind CSS**: Base de estilização
- **React Hook Form**: Componente Form integrado
- **Zod**: Validação com zodResolver
- **Radix UI**: Primitivos acessíveis
