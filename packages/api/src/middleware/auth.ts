import type { AuthUser } from "@mastertrack/shared";
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { getSupabaseAdmin, isSupabaseConfigured } from "../lib/supabase";

const isProduction = Bun.env["NODE_ENV"] === "production";

/**
 * Middleware de autenticacao
 *
 * Em producao: Valida token JWT com Supabase Auth
 * Em desenvolvimento: Aceita qualquer token Bearer (mock user)
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Token nao fornecido" });
  }

  const token = authHeader.slice(7);

  // Em producao ou com Supabase configurado: validar token real
  if (isProduction || isSupabaseConfigured()) {
    const user = await validateSupabaseToken(token);
    c.set("user", user);
  } else {
    // Em desenvolvimento sem Supabase: usar mock
    const mockUser: AuthUser = {
      id: "mock-user-id",
      email: "dev@localhost.com",
      name: "Dev User",
      role: "admin", // Admin em dev para facilitar testes
    };
    c.set("user", mockUser);
  }

  await next();
}

/**
 * Valida token JWT com Supabase e retorna usuario
 */
async function validateSupabaseToken(token: string): Promise<AuthUser> {
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);

  if (error || !data.user) {
    throw new HTTPException(401, { message: "Token invalido ou expirado" });
  }

  const supabaseUser = data.user;

  // Extrair role dos metadados do usuario ou usar default
  const role = (supabaseUser.user_metadata?.["role"] as AuthUser["role"]) ?? "user";
  const name = supabaseUser.user_metadata?.["name"] as string | undefined;

  // Construir objeto respeitando exactOptionalPropertyTypes
  const authUser: AuthUser = {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    role,
  };

  // Apenas adicionar name se existir
  if (name) {
    authUser.name = name;
  }

  return authUser;
}

/**
 * Middleware de autorizacao por role
 */
export function requireRole(...roles: AuthUser["role"][]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as AuthUser | undefined;

    if (!user) {
      throw new HTTPException(401, { message: "Nao autenticado" });
    }

    if (!roles.includes(user.role)) {
      throw new HTTPException(403, { message: "Sem permissao para esta acao" });
    }

    await next();
  };
}

/**
 * Middleware de autenticacao opcional
 * Nao falha se nao houver token, apenas nao define o usuario
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);

      if (isProduction || isSupabaseConfigured()) {
        const user = await validateSupabaseToken(token);
        c.set("user", user);
      } else {
        c.set("user", {
          id: "mock-user-id",
          email: "dev@localhost.com",
          name: "Dev User",
          role: "admin",
        } satisfies AuthUser);
      }
    } catch {
      // Token invalido - continuar sem usuario
    }
  }

  await next();
}
