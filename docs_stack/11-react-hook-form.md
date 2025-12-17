# React Hook Form

## Propósito
Formulários performáticos e flexíveis com validação fácil. Mínimo re-renders.

## Instalação
```bash
bun add react-hook-form @hookform/resolvers zod
```

## Uso Básico

```tsx
import { useForm } from "react-hook-form";

interface FormData {
  email: string;
  password: string;
}

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("email", {
          required: "Email é obrigatório",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Email inválido",
          },
        })}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}

      <input
        type="password"
        {...register("password", {
          required: "Senha é obrigatória",
          minLength: {
            value: 8,
            message: "Mínimo 8 caracteres",
          },
        })}
        placeholder="Senha"
      />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
```

## Com Zod Resolver

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register("password")} placeholder="Senha" />
      {errors.password && <span>{errors.password.message}</span>}

      <input
        type="password"
        {...register("confirmPassword")}
        placeholder="Confirmar Senha"
      />
      {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}

      <button type="submit">Registrar</button>
    </form>
  );
}
```

## Integração com shadcn/ui

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
});

type FormData = z.infer<typeof schema>;

function ProfileForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

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

        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  );
}
```

## Métodos Úteis

```tsx
const {
  register,
  handleSubmit,
  watch,
  setValue,
  getValues,
  reset,
  setError,
  clearErrors,
  formState: {
    errors,
    isSubmitting,
    isValid,
    isDirty,
    dirtyFields,
    touchedFields,
  },
} = useForm<FormData>();

// Watch - observar valores
const email = watch("email");
const allValues = watch();

// SetValue - definir valor programaticamente
setValue("email", "test@example.com");

// GetValues - obter valores
const values = getValues();
const emailValue = getValues("email");

// Reset - resetar formulário
reset(); // para defaultValues
reset({ email: "new@example.com" }); // para valores específicos

// SetError - definir erro manualmente
setError("email", {
  type: "manual",
  message: "Email já cadastrado",
});
```

## Validação Async

```tsx
const schema = z.object({
  username: z.string().min(3),
});

function Form() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  // Validação async no register
  <input
    {...register("username", {
      validate: async (value) => {
        const available = await checkUsernameAvailable(value);
        return available || "Username já em uso";
      },
    })}
  />
}
```

## Arrays de Campos

```tsx
import { useForm, useFieldArray } from "react-hook-form";

interface FormData {
  users: { name: string; email: string }[];
}

function DynamicForm() {
  const { control, register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      users: [{ name: "", email: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "users",
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`users.${index}.name`)} />
          <input {...register(`users.${index}.email`)} />
          <button type="button" onClick={() => remove(index)}>
            Remover
          </button>
        </div>
      ))}

      <button type="button" onClick={() => append({ name: "", email: "" })}>
        Adicionar Usuário
      </button>

      <button type="submit">Enviar</button>
    </form>
  );
}
```

## Mode de Validação

```tsx
useForm({
  mode: "onSubmit",    // Valida apenas no submit (default)
  mode: "onChange",    // Valida a cada mudança
  mode: "onBlur",      // Valida quando perde foco
  mode: "onTouched",   // Valida quando tocado e depois a cada mudança
  mode: "all",         // Valida em todos os eventos
});
```

## Integração com a Stack

- **Zod**: zodResolver para validação
- **shadcn/ui**: Componente Form integrado
- **TanStack Query**: useMutation no onSubmit
- **TypeScript**: Inferência de tipos automática
