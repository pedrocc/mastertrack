import type { AppType } from "@mastertrack/api";
import { hc } from "hono/client";
import { isSupabaseConfigured, supabase } from "./supabase";

const baseUrl = import.meta.env["VITE_API_URL"] || "";

// Cache the access token to avoid calling getSession() for every API call
let cachedToken: string | null = null;

// Subscribe to auth changes and cache the token
if (isSupabaseConfigured() && supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedToken = session?.access_token || null;
  });
}

/**
 * Get cached Supabase access token
 */
function getAuthToken(): string | null {
  return cachedToken;
}

/**
 * Cliente Hono RPC type-safe
 */
export const api = hc<AppType>(baseUrl, {
  headers: () => {
    const token = getAuthToken();
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
