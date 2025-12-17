import type { InsertUser, UpdateUser } from "@mastertrack/api/db/schemas";
import type { InferResponseType } from "hono/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, handleResponse } from "../lib/api";

// Inferir tipos de resposta do Hono RPC (type-safety end-to-end)
// Usamos status 200 para extrair apenas respostas de sucesso
type UsersListResponse = InferResponseType<typeof api.api.users.$get, 200>;
type UserResponse = InferResponseType<(typeof api.api.users)[":id"]["$get"], 200>;
type CreateUserResponse = InferResponseType<typeof api.api.users.$post, 201>;
type UpdateUserResponse = InferResponseType<(typeof api.api.users)[":id"]["$put"], 200>;
type DeleteUserResponse = InferResponseType<(typeof api.api.users)[":id"]["$delete"], 200>;

const USERS_KEY = ["users"] as const;

/**
 * Hook para listar usuarios
 */
export function useUsers(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...USERS_KEY, { page, pageSize }],
    queryFn: async () => {
      const res = await api.api.users.$get({
        query: { page: String(page), pageSize: String(pageSize) },
      });
      return handleResponse<UsersListResponse>(res);
    },
  });
}

/**
 * Hook para buscar usuario por ID
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: [...USERS_KEY, id],
    queryFn: async () => {
      const res = await api.api.users[":id"].$get({
        param: { id },
      });
      return handleResponse<UserResponse>(res);
    },
    enabled: Boolean(id),
  });
}

/**
 * Hook para criar usuario
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await api.api.users.$post({
        json: data,
      });
      return handleResponse<CreateUserResponse>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

/**
 * Hook para atualizar usuario
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUser }) => {
      const res = await api.api.users[":id"].$put({
        param: { id },
        json: data,
      });
      return handleResponse<UpdateUserResponse>(res);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
      queryClient.invalidateQueries({ queryKey: [...USERS_KEY, id] });
    },
  });
}

/**
 * Hook para deletar usuario
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.api.users[":id"].$delete({
        param: { id },
      });
      return handleResponse<DeleteUserResponse>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}
