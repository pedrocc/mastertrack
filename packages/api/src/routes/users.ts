import { zValidator } from "@hono/zod-validator";
import { paginationSchema } from "@mastertrack/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { users } from "../db/schema";
import { insertUserSchema, updateUserSchema, userIdSchema } from "../db/schemas";
import { getSupabaseAdmin, isSupabaseConfigured } from "../lib/supabase";
import { authMiddleware, requireRole } from "../middleware/auth";
import { writeRateLimiter } from "../middleware/rate-limit";

export const usersRoutes = new Hono()
  /**
   * GET /api/users
   * Lista todos os usuarios com paginacao
   * Requer autenticacao
   */
  .get("/", authMiddleware, zValidator("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const offset = (page - 1) * pageSize;

    const [allUsers, countResult] = await Promise.all([
      db.select().from(users).limit(pageSize).offset(offset).orderBy(users.createdAt),
      db.select().from(users),
    ]);

    const total = countResult.length;

    return c.json({
      data: allUsers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  })

  /**
   * GET /api/users/by-email/:email
   * Busca usuario por email
   * Requer autenticacao
   */
  .get("/by-email/:email", authMiddleware, async (c) => {
    const email = c.req.param("email");

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return c.json({ error: { code: "NOT_FOUND", message: "Usuario nao encontrado" } }, 404);
    }

    return c.json({ data: user });
  })

  /**
   * GET /api/users/:id
   * Busca usuario por ID
   * Requer autenticacao
   */
  .get("/:id", authMiddleware, zValidator("param", userIdSchema), async (c) => {
    const { id } = c.req.valid("param");

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return c.json({ error: { code: "NOT_FOUND", message: "Usuario nao encontrado" } }, 404);
    }

    return c.json({ data: user });
  })

  /**
   * POST /api/users
   * Cria novo usuario
   * Requer autenticacao + role admin
   */
  .post(
    "/",
    authMiddleware,
    requireRole("admin"),
    writeRateLimiter,
    zValidator("json", insertUserSchema),
    async (c) => {
      const data = c.req.valid("json");

      // Verificar se email ja existe
      const existing = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      });

      if (existing) {
        return c.json({ error: { code: "CONFLICT", message: "Email ja cadastrado" } }, 409);
      }

      const [user] = await db.insert(users).values(data).returning();

      return c.json({ data: user }, 201);
    }
  )

  /**
   * PUT /api/users/:id
   * Atualiza usuario
   * Requer autenticacao + role admin
   */
  .put(
    "/:id",
    authMiddleware,
    requireRole("admin"),
    writeRateLimiter,
    zValidator("param", userIdSchema),
    zValidator("json", updateUserSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");

      // Verificar se usuario existe
      const existing = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!existing) {
        return c.json({ error: { code: "NOT_FOUND", message: "Usuario nao encontrado" } }, 404);
      }

      // Se estiver atualizando email, verificar se ja existe
      if (data.email && data.email !== existing.email) {
        const emailExists = await db.query.users.findFirst({
          where: eq(users.email, data.email),
        });

        if (emailExists) {
          return c.json({ error: { code: "CONFLICT", message: "Email ja cadastrado" } }, 409);
        }
      }

      const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();

      // Sincronizar name e role com Supabase Auth user_metadata
      if (isSupabaseConfigured() && (data.name || data.role)) {
        try {
          const supabaseAdmin = getSupabaseAdmin();

          // Buscar metadados atuais do usuario para fazer merge
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);

          if (authUser?.user) {
            const currentMetadata = authUser.user.user_metadata ?? {};
            const updatedMetadata = {
              ...currentMetadata,
              ...(data.name && { name: data.name }),
              ...(data.role && { role: data.role }),
            };

            await supabaseAdmin.auth.admin.updateUserById(id, {
              user_metadata: updatedMetadata,
            });
          }
        } catch (err) {
          console.error("[Users] Falha ao sincronizar user_metadata com Supabase:", err);
          // Nao falhar a operacao, o banco ja foi atualizado
        }
      }

      return c.json({ data: user });
    }
  )

  /**
   * DELETE /api/users/:id
   * Remove usuario
   * Requer autenticacao + role admin
   */
  .delete(
    "/:id",
    authMiddleware,
    requireRole("admin"),
    writeRateLimiter,
    zValidator("param", userIdSchema),
    async (c) => {
      const { id } = c.req.valid("param");

      const existing = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!existing) {
        return c.json({ error: { code: "NOT_FOUND", message: "Usuario nao encontrado" } }, 404);
      }

      await db.delete(users).where(eq(users.id, id));

      return c.json({ message: "Usuario removido com sucesso" });
    }
  );
