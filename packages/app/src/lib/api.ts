import type { AppType } from "@mastertrack/api";
import { hc } from "hono/client";

const baseUrl = import.meta.env["VITE_API_URL"] || "";

/**
 * Cliente Hono RPC type-safe
 */
export const api = hc<AppType>(baseUrl);

/**
 * Helper para tratar erros de resposta
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro desconhecido" }));
    throw new Error(error.error?.message || error.message || `HTTP ${response.status}`);
  }
  return response.json();
}
