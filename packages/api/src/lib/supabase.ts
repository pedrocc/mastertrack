import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = Bun.env["SUPABASE_URL"] ?? "";
const supabaseServiceKey = Bun.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
const supabaseAnonKey = Bun.env["SUPABASE_ANON_KEY"] ?? "";

let _supabaseAdmin: SupabaseClient | null = null;
let _supabase: SupabaseClient | null = null;

/**
 * Verifica se Supabase esta configurado (anon key)
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && (supabaseServiceKey || supabaseAnonKey));
}

/**
 * Verifica se Supabase Admin esta configurado (service role key)
 * Necessario para operacoes administrativas como atualizar user_metadata
 */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey);
}

/**
 * Cliente Supabase com service role (backend)
 * Usar para operacoes administrativas
 * Lazy initialization - so cria o client quando necessario
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Supabase nao configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env"
      );
    }
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

/**
 * Cliente Supabase com anon key
 * Usar para operacoes que respeitam RLS
 * Lazy initialization - so cria o client quando necessario
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase nao configurado. Defina SUPABASE_URL e SUPABASE_ANON_KEY no .env");
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}
