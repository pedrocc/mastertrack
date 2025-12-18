import type { AppType } from "@mastertrack/api";
import { hc } from "hono/client";
import { supabase } from "./supabase";

const baseUrl = import.meta.env["VITE_API_URL"] || "";

/**
 * Get Supabase access token
 */
async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Cliente Hono RPC type-safe
 */
export const api = hc<AppType>(baseUrl, {
  headers: async () => {
    const token = await getAuthToken();
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  },
});

/**
 * Helper para tratar erros de resposta
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    let errorMessage = `HTTP ${response.status}`;
    try {
      const error = JSON.parse(text);
      errorMessage = error.error?.message || error.message || errorMessage;
    } catch {
      // Response is not JSON, use status text
      errorMessage = `HTTP ${response.status}: ${response.statusText || text.substring(0, 100)}`;
    }
    console.error("API Error:", response.status, text);
    throw new Error(errorMessage);
  }
  return response.json();
}
