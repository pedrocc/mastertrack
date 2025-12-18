import type { InsertCompany, UpdateCompany } from "@mastertrack/api";
import type { InferResponseType } from "hono/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, handleResponse } from "../lib/api";

// Inferir tipos de resposta do Hono RPC (type-safety end-to-end)
type CompaniesListResponse = InferResponseType<typeof api.api.companies.$get, 200>;
type CompanyResponse = InferResponseType<(typeof api.api.companies)[":id"]["$get"], 200>;
type CreateCompanyResponse = InferResponseType<typeof api.api.companies.$post, 201>;
type UpdateCompanyResponse = InferResponseType<(typeof api.api.companies)[":id"]["$put"], 200>;
type DeleteCompanyResponse = InferResponseType<(typeof api.api.companies)[":id"]["$delete"], 200>;

const COMPANIES_KEY = ["companies"] as const;

/**
 * Hook para listar empresas
 */
export function useCompaniesQuery(page = 1, pageSize = 100) {
  return useQuery({
    queryKey: [...COMPANIES_KEY, { page, pageSize }],
    queryFn: async () => {
      const res = await api.api.companies.$get({
        query: { page: String(page), pageSize: String(pageSize) },
      });
      return handleResponse<CompaniesListResponse>(res);
    },
  });
}

/**
 * Hook para buscar empresa por ID
 */
export function useCompany(id: string) {
  return useQuery({
    queryKey: [...COMPANIES_KEY, id],
    queryFn: async () => {
      const res = await api.api.companies[":id"].$get({
        param: { id },
      });
      return handleResponse<CompanyResponse>(res);
    },
    enabled: Boolean(id),
  });
}

/**
 * Hook para criar empresa
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertCompany) => {
      const res = await api.api.companies.$post({
        json: data,
      });
      return handleResponse<CreateCompanyResponse>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_KEY });
    },
  });
}

/**
 * Hook para atualizar empresa
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCompany }) => {
      const res = await api.api.companies[":id"].$put({
        param: { id },
        json: data,
      });
      return handleResponse<UpdateCompanyResponse>(res);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_KEY });
      queryClient.invalidateQueries({ queryKey: [...COMPANIES_KEY, id] });
    },
  });
}

/**
 * Hook para deletar empresa
 */
export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.api.companies[":id"].$delete({
        param: { id },
      });
      return handleResponse<DeleteCompanyResponse>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_KEY });
    },
  });
}
