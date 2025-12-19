import type { AppType } from "@mastertrack/api";
import { hc } from "hono/client";
import { isSupabaseConfigured, supabase } from "./supabase";

const baseUrl = import.meta.env["VITE_API_URL"] || "";

// Local storage key for local auth token (development only)
const LOCAL_AUTH_TOKEN_KEY = "mastertrack_local_auth_token";

// Cache the access token to avoid calling getSession() for every API call
let cachedToken: string | null = null;

// Subscribe to auth changes and cache the token
if (isSupabaseConfigured() && supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedToken = session?.access_token || null;
  });
} else {
  // Em desenvolvimento sem Supabase, usar token local do localStorage
  cachedToken = localStorage.getItem(LOCAL_AUTH_TOKEN_KEY);
}

/**
 * Set local auth token (for development without Supabase)
 */
export function setLocalAuthToken(token: string | null): void {
  cachedToken = token;
  if (token) {
    localStorage.setItem(LOCAL_AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(LOCAL_AUTH_TOKEN_KEY);
  }
}

/**
 * Get local auth token (for development without Supabase)
 */
export function getLocalAuthToken(): string | null {
  return localStorage.getItem(LOCAL_AUTH_TOKEN_KEY);
}

/**
 * Clear local auth token
 */
export function clearLocalAuthToken(): void {
  cachedToken = null;
  localStorage.removeItem(LOCAL_AUTH_TOKEN_KEY);
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
