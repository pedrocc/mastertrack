import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "";
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] || "";

/**
 * Verifica se Supabase esta configurado
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith("https://") &&
      supabaseAnonKey.length > 20
  );
}

/**
 * Cliente Supabase para frontend
 * Retorna null se não configurado (desenvolvimento local sem Supabase)
 */
function createSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    console.warn("[Supabase] Failed to create client, running without auth");
    return null;
  }
}

export const supabase = createSupabaseClient();
