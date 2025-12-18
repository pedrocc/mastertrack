import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { slaConfigs } from "../db/schema";
import { slaTypeParamSchema, updateSlaConfigSchema } from "../db/schemas";
import { authMiddleware, requireRole } from "../middleware/auth";
import { writeRateLimiter } from "../middleware/rate-limit";

export const slaConfigsRoutes = new Hono()
  /**
   * GET /api/sla-configs
   * Lista todas as configuracoes de SLA
   * Requer autenticacao
   */
  .get("/", authMiddleware, async (c) => {
    const configs = await db.select().from(slaConfigs).orderBy(slaConfigs.label);

    return c.json({ data: configs });
  })

  /**
   * GET /api/sla-configs/:type
   * Busca configuracao de SLA por tipo
   * Requer autenticacao
   */
  .get("/:type", authMiddleware, zValidator("param", slaTypeParamSchema), async (c) => {
    const { type } = c.req.valid("param");

    const config = await db.query.slaConfigs.findFirst({
      where: eq(slaConfigs.type, type),
    });

    if (!config) {
      return c.json(
        { error: { code: "NOT_FOUND", message: "Configuracao de SLA nao encontrada" } },
        404
      );
    }

    return c.json({ data: config });
  })

  /**
   * PUT /api/sla-configs/:type
   * Atualiza configuracao de SLA (apenas slaDays)
   * Requer autenticacao + role admin
   */
  .put(
    "/:type",
    authMiddleware,
    requireRole("admin"),
    writeRateLimiter,
    zValidator("param", slaTypeParamSchema),
    zValidator("json", updateSlaConfigSchema),
    async (c) => {
      const { type } = c.req.valid("param");
      const { slaDays } = c.req.valid("json");

      const existing = await db.query.slaConfigs.findFirst({
        where: eq(slaConfigs.type, type),
      });

      if (!existing) {
        return c.json(
          { error: { code: "NOT_FOUND", message: "Configuracao de SLA nao encontrada" } },
          404
        );
      }

      const [updated] = await db
        .update(slaConfigs)
        .set({ slaDays })
        .where(eq(slaConfigs.type, type))
        .returning();

      return c.json({ data: updated });
    }
  );
