import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";

const isProduction = Bun.env["NODE_ENV"] === "production";

// Permite forcar autenticacao local via env var (util para dev com Supabase credentials no .env)
const forceLocalAuth = Bun.env["LOCAL_AUTH_ENABLED"] === "true";

/**
 * Verifica se autenticacao local esta disponivel
 * - Em producao: nunca
 * - Com LOCAL_AUTH_ENABLED=true: sempre
 * - Em desenvolvimento: por padrao habilitado
 */
function isLocalAuthEnabled(): boolean {
  if (isProduction) return false;
  if (forceLocalAuth) return true;
  // Por padrao, em dev, sempre permitir local auth
  return true;
}

// Schema for local login
const localLoginSchema = z.object({
  email: z.string().email(),
});

export const authRoutes = new Hono()
  /**
   * POST /api/auth/local-login
   * Login local para desenvolvimento (sem Supabase)
   *
   * Em producao: retorna erro
   * Em desenvolvimento: busca usuario pelo email e retorna token mock
   */
  .post("/local-login", zValidator("json", localLoginSchema), async (c) => {
    // Bloquear se local auth nao estiver habilitado
    if (!isLocalAuthEnabled()) {
      return c.json(
        {
          error: {
            code: "LOCAL_AUTH_DISABLED",
            message: "Autenticacao local desabilitada em producao",
          },
        },
        403
      );
    }

    const { email } = c.req.valid("json");

    // Buscar usuario no banco
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return c.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: `Usuario com email "${email}" nao encontrado no banco de dados`,
          },
        },
        404
      );
    }

    // Gerar token mock (simplesmente o ID do usuario codificado)
    // Este token e aceito pelo authMiddleware em modo desenvolvimento
    const mockToken = `local-dev-token-${user.id}`;

    return c.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          avatarUrl: user.avatarUrl,
        },
        token: mockToken,
      },
    });
  })

  /**
   * GET /api/auth/local-users
   * Lista usuarios disponiveis para login local
   *
   * Apenas em desenvolvimento
   */
  .get("/local-users", async (c) => {
    // Bloquear se local auth nao estiver habilitado
    if (!isLocalAuthEnabled()) {
      return c.json(
        {
          error: {
            code: "LOCAL_AUTH_DISABLED",
            message: "Autenticacao local desabilitada em producao",
          },
        },
        403
      );
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .limit(50);

    return c.json({ data: allUsers });
  });
