import type { AppType } from "@mastertrack/api";
import { hc } from "hono/client";

const baseUrl = import.meta.env["VITE_API_URL"] || "";

const AUTH_STORAGE_KEY = "mastertrack_auth";

/**
 * Get mock token from stored user
 * In development, we use the user ID as a mock token
 */
function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const user = JSON.parse(stored);
      // Use user ID as mock token in development
      return user.id || null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
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
