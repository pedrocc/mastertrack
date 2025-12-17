# TanStack Query (React Query)

## Propósito
Data fetching, caching, sincronização e atualização de estado do servidor para React.

## Instalação
```bash
bun add @tanstack/react-query
```

## Setup

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto
      gcTime: 1000 * 60 * 5, // 5 minutos (antigo cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## useQuery - Fetching Data

```tsx
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  email: string;
}

function useUser(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json() as Promise<User>;
    },
    enabled: !!userId, // Só executa se userId existir
  });
}

function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, isError, error } = useUser(userId);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

## useMutation - Mutating Data

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateUserInput {
  name: string;
  email: string;
}

function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to create user");
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache para refetch
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Error creating user:", error);
    },
  });
}

function CreateUserForm() {
  const { mutate, isPending } = useCreateUser();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutate({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

## Optimistic Updates

```tsx
function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onMutate: async (newUser) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ["user", newUser.id] });

      // Snapshot do valor anterior
      const previousUser = queryClient.getQueryData(["user", newUser.id]);

      // Atualizar otimisticamente
      queryClient.setQueryData(["user", newUser.id], newUser);

      // Retornar contexto com snapshot
      return { previousUser };
    },
    onError: (err, newUser, context) => {
      // Rollback em caso de erro
      queryClient.setQueryData(["user", newUser.id], context?.previousUser);
    },
    onSettled: (data, error, variables) => {
      // Sempre refetch após mutation
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
}
```

## Query Keys

```tsx
// Estrutura hierárquica
const queryKeys = {
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters: UserFilters) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
};

// Uso
useQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn: () => fetchUser(userId),
});

// Invalidar toda a hierarquia
queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
```

## Prefetching

```tsx
// Prefetch para melhorar UX
function UserList() {
  const queryClient = useQueryClient();

  const prefetchUser = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["user", userId],
      queryFn: () => fetchUser(userId),
      staleTime: 1000 * 60, // 1 minuto
    });
  };

  return (
    <ul>
      {users.map((user) => (
        <li
          key={user.id}
          onMouseEnter={() => prefetchUser(user.id)}
        >
          <Link to={`/users/${user.id}`}>{user.name}</Link>
        </li>
      ))}
    </ul>
  );
}
```

## Infinite Queries

```tsx
import { useInfiniteQuery } from "@tanstack/react-query";

function useInfinitePosts() {
  return useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/posts?page=${pageParam}&limit=10`);
      return response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
    initialPageParam: 0,
  });
}

function PostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePosts();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </Fragment>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? "Loading..." : hasNextPage ? "Load More" : "No more"}
      </button>
    </div>
  );
}
```

## Integração com Hono RPC

```tsx
import { hc } from "hono/client";
import type { AppType } from "@myapp/api";

const client = hc<AppType>("/api");

function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await client.users.$get();
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });
}
```

## Integração com a Stack

- **Hono RPC**: Client type-safe para queries
- **React**: Hooks nativos
- **Zod**: Validação de responses
- **shadcn/ui**: Loading states em componentes
