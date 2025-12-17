# React 19

## Propósito
Biblioteca para construção de interfaces de usuário com componentes reutilizáveis.

## Hooks Fundamentais

### useState
```typescript
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Cliques: {count}
    </button>
  );
}

// Com função de inicialização (lazy init)
const [state, setState] = useState(() => computeExpensiveValue());

// Atualização funcional
setCount(prev => prev + 1);
```

### useEffect
```typescript
import { useEffect, useState } from "react";

function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Setup
    const connection = createConnection(roomId);
    connection.connect();

    // Cleanup
    return () => {
      connection.disconnect();
    };
  }, [roomId]); // Dependências

  return <MessageList messages={messages} />;
}
```

### useRef
```typescript
import { useRef, useEffect } from "react";

function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} />;
}

// Para valores mutáveis que não causam re-render
const renderCount = useRef(0);
renderCount.current += 1;
```

### useMemo e useCallback
```typescript
import { useMemo, useCallback } from "react";

function ProductList({ products, filter }: Props) {
  // Memoiza valor computado
  const filteredProducts = useMemo(
    () => products.filter(p => p.category === filter),
    [products, filter]
  );

  // Memoiza função
  const handleClick = useCallback((id: string) => {
    console.log("Clicked:", id);
  }, []);

  return (
    <ul>
      {filteredProducts.map(p => (
        <ProductItem key={p.id} product={p} onClick={handleClick} />
      ))}
    </ul>
  );
}
```

### useContext
```typescript
import { createContext, useContext, ReactNode } from "react";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### useReducer
```typescript
import { useReducer } from "react";

interface State {
  count: number;
  error: string | null;
}

type Action =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET_ERROR"; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    case "DECREMENT":
      return { ...state, count: state.count - 1 };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, error: null });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
      <button onClick={() => dispatch({ type: "DECREMENT" })}>-</button>
    </div>
  );
}
```

## React 19 - Novidades

### use() Hook
```typescript
import { use, Suspense } from "react";

// Ler Promise diretamente
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);
  return <h1>{user.name}</h1>;
}

// Ler Context condicionalmente
function Button({ showTheme }: { showTheme: boolean }) {
  if (showTheme) {
    const theme = use(ThemeContext);
    return <button className={theme}>Click</button>;
  }
  return <button>Click</button>;
}
```

### Actions e useActionState
```typescript
import { useActionState } from "react";

async function submitForm(prevState: State, formData: FormData) {
  const name = formData.get("name");
  // Validação e submit
  return { success: true };
}

function Form() {
  const [state, formAction, isPending] = useActionState(submitForm, null);

  return (
    <form action={formAction}>
      <input name="name" />
      <button disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
```

### useOptimistic
```typescript
import { useOptimistic } from "react";

function TodoList({ todos, addTodo }: Props) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, { ...newTodo, pending: true }]
  );

  async function handleAdd(formData: FormData) {
    const newTodo = { id: Date.now(), text: formData.get("text") };
    addOptimisticTodo(newTodo);
    await addTodo(newTodo);
  }

  return (
    <form action={handleAdd}>
      <input name="text" />
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
            {todo.text}
          </li>
        ))}
      </ul>
    </form>
  );
}
```

## Componentes Tipados

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  onClick?: () => void;
}

function Button({
  variant = "primary",
  size = "md",
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Com genéricos
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}
```

## Integração com a Stack

- **Vite**: Build tool e dev server
- **TanStack Query**: Data fetching e cache
- **React Hook Form**: Formulários
- **Tailwind + shadcn/ui**: Estilização
