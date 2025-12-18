import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { type Request, requests } from "../db/schema";
import {
  createRequestSchema,
  markRequestSeenSchema,
  requestIdSchema,
  updateRequestDataSchema,
  updateRequestStatusSchema,
} from "../db/schemas";
import { authMiddleware } from "../middleware/auth";

export const requestsRoutes = new Hono()
  /**
   * GET /api/requests
   * Lista todas as requisicoes (admin) ou por empresa (cliente)
   */
  .get("/", authMiddleware, async (c) => {
    const companyId = c.req.query("companyId");

    let allRequests: Request[];
    if (companyId) {
      // Filtrar por empresa (para clientes)
      allRequests = await db
        .select()
        .from(requests)
        .where(eq(requests.companyId, companyId))
        .orderBy(desc(requests.createdAt));
    } else {
      // Todas as requisicoes (para admin)
      allRequests = await db.select().from(requests).orderBy(desc(requests.createdAt));
    }

    return c.json({ data: allRequests });
  })

  /**
   * GET /api/requests/stats/unseen
   * Retorna contagem de requisicoes nao vistas
   * IMPORTANTE: Esta rota deve vir ANTES de /:id para evitar conflito de matching
   */
  .get("/stats/unseen", authMiddleware, async (c) => {
    const companyId = c.req.query("companyId");

    if (companyId) {
      // Contagem para cliente: requisicoes com status nao visto
      const unseenByClient = await db
        .select()
        .from(requests)
        .where(and(eq(requests.companyId, companyId), eq(requests.statusSeenByClient, false)));

      return c.json({ data: { count: unseenByClient.length } });
    }

    // Contagem para admin: requisicoes nao vistas pelo admin
    const unseenByAdmin = await db.select().from(requests).where(eq(requests.seenByAdmin, false));

    return c.json({ data: { count: unseenByAdmin.length } });
  })

  /**
   * GET /api/requests/:id
   * Busca uma requisicao pelo ID
   */
  .get("/:id", authMiddleware, zValidator("param", requestIdSchema), async (c) => {
    const { id } = c.req.valid("param");

    const request = await db.select().from(requests).where(eq(requests.id, id)).limit(1);

    if (request.length === 0) {
      return c.json({ error: { code: "NOT_FOUND", message: "Requisicao nao encontrada" } }, 404);
    }

    return c.json({ data: request[0] });
  })

  /**
   * POST /api/requests
   * Cria uma nova requisicao
   */
  .post("/", authMiddleware, zValidator("json", createRequestSchema), async (c) => {
    const { companyId, type, title, data } = c.req.valid("json");

    const [newRequest] = await db
      .insert(requests)
      .values({
        companyId,
        type,
        title,
        data: data || "{}",
        status: "aberta",
        statusSeenByClient: true, // cliente criou, ja viu o status
        seenByAdmin: false, // admin ainda nao viu
      })
      .returning();

    return c.json({ data: newRequest }, 201);
  })

  /**
   * PUT /api/requests/:id/data
   * Atualiza os dados de uma requisicao
   */
  .put(
    "/:id/data",
    authMiddleware,
    zValidator("param", requestIdSchema),
    zValidator("json", updateRequestDataSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { data } = c.req.valid("json");

      // Verificar se existe
      const existing = await db.select().from(requests).where(eq(requests.id, id)).limit(1);
      if (existing.length === 0) {
        return c.json({ error: { code: "NOT_FOUND", message: "Requisicao nao encontrada" } }, 404);
      }

      const [updated] = await db
        .update(requests)
        .set({ data })
        .where(eq(requests.id, id))
        .returning();

      return c.json({ data: updated });
    }
  )

  /**
   * PUT /api/requests/:id/status
   * Atualiza o status de uma requisicao
   */
  .put(
    "/:id/status",
    authMiddleware,
    zValidator("param", requestIdSchema),
    zValidator("json", updateRequestStatusSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { status, seenByClient } = c.req.valid("json");

      // Verificar se existe
      const existing = await db.select().from(requests).where(eq(requests.id, id)).limit(1);
      if (existing.length === 0) {
        return c.json({ error: { code: "NOT_FOUND", message: "Requisicao nao encontrada" } }, 404);
      }

      const [updated] = await db
        .update(requests)
        .set({
          status,
          statusSeenByClient: seenByClient,
        })
        .where(eq(requests.id, id))
        .returning();

      return c.json({ data: updated });
    }
  )

  /**
   * PUT /api/requests/:id/seen
   * Marca requisicao como vista (pelo admin ou cliente)
   */
  .put(
    "/:id/seen",
    authMiddleware,
    zValidator("param", requestIdSchema),
    zValidator("json", markRequestSeenSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { seenByAdmin, statusSeenByClient } = c.req.valid("json");

      // Verificar se existe
      const existing = await db.select().from(requests).where(eq(requests.id, id)).limit(1);
      if (existing.length === 0) {
        return c.json({ error: { code: "NOT_FOUND", message: "Requisicao nao encontrada" } }, 404);
      }

      const updateData: { seenByAdmin?: boolean; statusSeenByClient?: boolean } = {};
      if (seenByAdmin !== undefined) {
        updateData.seenByAdmin = seenByAdmin;
      }
      if (statusSeenByClient !== undefined) {
        updateData.statusSeenByClient = statusSeenByClient;
      }

      const [updated] = await db
        .update(requests)
        .set(updateData)
        .where(eq(requests.id, id))
        .returning();

      return c.json({ data: updated });
    }
  )

  /**
   * DELETE /api/requests/:id
   * Remove uma requisicao
   */
  .delete("/:id", authMiddleware, zValidator("param", requestIdSchema), async (c) => {
    const { id } = c.req.valid("param");

    const deleted = await db.delete(requests).where(eq(requests.id, id)).returning();

    if (deleted.length === 0) {
      return c.json({ error: { code: "NOT_FOUND", message: "Requisicao nao encontrada" } }, 404);
    }

    return c.json({ success: true });
  });
