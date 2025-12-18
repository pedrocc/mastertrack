import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { requestComments, requests } from "../db/schema";
import { authMiddleware } from "../middleware/auth";

const addCommentSchema = z.object({
  authorId: z.string().min(1, "Author ID obrigatorio"),
  authorName: z.string().min(1, "Nome do autor obrigatorio"),
  authorRole: z.enum(["admin", "user"]),
  content: z.string().min(1, "Conteudo obrigatorio"),
});

const requestIdParamSchema = z.object({
  requestId: z.string().uuid("ID de requisicao invalido"),
});

export const requestCommentsRoutes = new Hono()
  /**
   * GET /api/requests/:requestId/comments
   * Lista todos os comentarios de uma requisicao
   */
  .get(
    "/:requestId/comments",
    authMiddleware,
    zValidator("param", requestIdParamSchema),
    async (c) => {
      const { requestId } = c.req.valid("param");

      // Verificar se a requisicao existe
      const request = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);
      if (request.length === 0) {
        return c.json({ error: { code: "NOT_FOUND", message: "Requisicao nao encontrada" } }, 404);
      }

      const comments = await db
        .select()
        .from(requestComments)
        .where(eq(requestComments.requestId, requestId))
        .orderBy(desc(requestComments.createdAt));

      return c.json({ data: comments });
    }
  )

  /**
   * POST /api/requests/:requestId/comments
   * Adiciona um comentario a uma requisicao
   */
  .post(
    "/:requestId/comments",
    authMiddleware,
    zValidator("param", requestIdParamSchema),
    zValidator("json", addCommentSchema),
    async (c) => {
      const { requestId } = c.req.valid("param");
      const { authorId, authorName, authorRole, content } = c.req.valid("json");

      // Verificar se a requisicao existe
      const request = await db.select().from(requests).where(eq(requests.id, requestId)).limit(1);
      if (request.length === 0) {
        return c.json({ error: { code: "NOT_FOUND", message: "Requisicao nao encontrada" } }, 404);
      }

      const [newComment] = await db
        .insert(requestComments)
        .values({
          requestId,
          authorId,
          authorName,
          authorRole,
          content,
        })
        .returning();

      return c.json({ data: newComment }, 201);
    }
  );
