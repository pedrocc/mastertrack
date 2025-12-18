import { zValidator } from "@hono/zod-validator";
import { paginationSchema } from "@mastertrack/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { containers } from "../db/schema";
import {
  containerIdSchema,
  containersByCompanySchema,
  createContainerSchema,
  updateContainerSchema,
} from "../db/schemas";
import { authMiddleware, requireRole } from "../middleware/auth";
import { writeRateLimiter } from "../middleware/rate-limit";

export const containersRoutes = new Hono()
  /**
   * GET /api/containers
   * Lista todos os containers com paginacao
   * Requer autenticacao
   */
  .get("/", authMiddleware, zValidator("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const offset = (page - 1) * pageSize;

    const [allContainers, countResult] = await Promise.all([
      db.select().from(containers).limit(pageSize).offset(offset).orderBy(containers.createdAt),
      db.select().from(containers),
    ]);

    const total = countResult.length;

    return c.json({
      data: allContainers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  })

  /**
   * GET /api/containers/company/:companyId
   * Lista containers de uma empresa
   * Requer autenticacao
   */
  .get(
    "/company/:companyId",
    authMiddleware,
    zValidator("param", containersByCompanySchema),
    async (c) => {
      const { companyId } = c.req.valid("param");

      const companyContainers = await db.query.containers.findMany({
        where: eq(containers.companyId, companyId),
        orderBy: containers.createdAt,
      });

      return c.json({ data: companyContainers });
    }
  )

  /**
   * GET /api/containers/:id
   * Busca container por ID
   * Requer autenticacao
   */
  .get("/:id", authMiddleware, zValidator("param", containerIdSchema), async (c) => {
    const { id } = c.req.valid("param");

    const container = await db.query.containers.findFirst({
      where: eq(containers.id, id),
    });

    if (!container) {
      return c.json({ error: { code: "NOT_FOUND", message: "Container nao encontrado" } }, 404);
    }

    return c.json({ data: container });
  })

  /**
   * POST /api/containers
   * Cria novo container
   * Requer autenticacao + role admin
   */
  .post(
    "/",
    authMiddleware,
    requireRole("admin"),
    writeRateLimiter,
    zValidator("json", createContainerSchema),
    async (c) => {
      const data = c.req.valid("json");

      const [container] = await db.insert(containers).values(data).returning();

      return c.json({ data: container }, 201);
    }
  )

  /**
   * PUT /api/containers/:id
   * Atualiza container
   * Requer autenticacao + role admin
   */
  .put(
    "/:id",
    authMiddleware,
    requireRole("admin"),
    writeRateLimiter,
    zValidator("param", containerIdSchema),
    zValidator("json", updateContainerSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");

      // Verificar se container existe
      const existing = await db.query.containers.findFirst({
        where: eq(containers.id, id),
      });

      if (!existing) {
        return c.json({ error: { code: "NOT_FOUND", message: "Container nao encontrado" } }, 404);
      }

      const [container] = await db
        .update(containers)
        .set(data)
        .where(eq(containers.id, id))
        .returning();

      return c.json({ data: container });
    }
  )

  /**
   * DELETE /api/containers/:id
   * Remove container
   * Requer autenticacao + role admin
   */
  .delete(
    "/:id",
    authMiddleware,
    requireRole("admin"),
    writeRateLimiter,
    zValidator("param", containerIdSchema),
    async (c) => {
      const { id } = c.req.valid("param");

      const existing = await db.query.containers.findFirst({
        where: eq(containers.id, id),
      });

      if (!existing) {
        return c.json({ error: { code: "NOT_FOUND", message: "Container nao encontrado" } }, 404);
      }

      await db.delete(containers).where(eq(containers.id, id));

      return c.json({ message: "Container removido com sucesso" });
    }
  );
