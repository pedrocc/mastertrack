import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { chatMessages, conversations } from "../db/schema";
import {
  conversationIdSchema,
  getOrCreateConversationSchema,
  markAsReadSchema,
  sendMessageSchema,
  updateConversationStatusSchema,
} from "../db/schemas";
import { authMiddleware } from "../middleware/auth";

export const chatRoutes = new Hono()
  // ============================================
  // Rotas de Conversas
  // ============================================

  /**
   * GET /api/chat/conversations
   * Lista todas as conversas
   * Requer autenticacao
   */
  .get("/conversations", authMiddleware, async (c) => {
    const allConversations = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt));

    return c.json({ data: allConversations });
  })

  /**
   * GET /api/chat/conversations/:id
   * Busca conversa por ID
   * Requer autenticacao
   */
  .get(
    "/conversations/:id",
    authMiddleware,
    zValidator("param", conversationIdSchema),
    async (c) => {
      const { id } = c.req.valid("param");

      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, id),
      });

      if (!conversation) {
        return c.json({ error: { code: "NOT_FOUND", message: "Conversa nao encontrada" } }, 404);
      }

      return c.json({ data: conversation });
    }
  )

  /**
   * POST /api/chat/conversations
   * Busca conversa aberta existente ou cria nova
   * Requer autenticacao
   */
  .post(
    "/conversations",
    authMiddleware,
    zValidator("json", getOrCreateConversationSchema),
    async (c) => {
      const { companyId, companyName, userId, userName } = c.req.valid("json");

      // Buscar conversa aberta existente para esta empresa
      const existing = await db.query.conversations.findFirst({
        where: and(eq(conversations.companyId, companyId), eq(conversations.status, "open")),
      });

      if (existing) {
        return c.json({ data: existing });
      }

      // Criar nova conversa
      const [newConversation] = await db
        .insert(conversations)
        .values({
          companyId,
          companyName,
          userId,
          userName,
          status: "open",
          lastMessage: "",
          unreadCount: 0,
        })
        .returning();

      return c.json({ data: newConversation }, 201);
    }
  )

  /**
   * PUT /api/chat/conversations/:id/status
   * Atualiza status da conversa (open/closed)
   * Requer autenticacao
   */
  .put(
    "/conversations/:id/status",
    authMiddleware,
    zValidator("param", conversationIdSchema),
    zValidator("json", updateConversationStatusSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { status } = c.req.valid("json");

      const existing = await db.query.conversations.findFirst({
        where: eq(conversations.id, id),
      });

      if (!existing) {
        return c.json({ error: { code: "NOT_FOUND", message: "Conversa nao encontrada" } }, 404);
      }

      const [updated] = await db
        .update(conversations)
        .set({ status })
        .where(eq(conversations.id, id))
        .returning();

      return c.json({ data: updated });
    }
  )

  // ============================================
  // Rotas de Mensagens
  // ============================================

  /**
   * GET /api/chat/conversations/:id/messages
   * Lista todas as mensagens de uma conversa
   * Requer autenticacao
   */
  .get(
    "/conversations/:id/messages",
    authMiddleware,
    zValidator("param", conversationIdSchema),
    async (c) => {
      const { id } = c.req.valid("param");

      // Verificar se conversa existe
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, id),
      });

      if (!conversation) {
        return c.json({ error: { code: "NOT_FOUND", message: "Conversa nao encontrada" } }, 404);
      }

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, id))
        .orderBy(chatMessages.createdAt);

      return c.json({ data: messages });
    }
  )

  /**
   * POST /api/chat/conversations/:id/messages
   * Envia uma nova mensagem
   * Requer autenticacao
   */
  .post(
    "/conversations/:id/messages",
    authMiddleware,
    zValidator("param", conversationIdSchema),
    zValidator("json", sendMessageSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { senderId, senderName, senderRole, content } = c.req.valid("json");

      // Verificar se conversa existe
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, id),
      });

      if (!conversation) {
        return c.json({ error: { code: "NOT_FOUND", message: "Conversa nao encontrada" } }, 404);
      }

      // Inserir mensagem
      const [newMessage] = await db
        .insert(chatMessages)
        .values({
          conversationId: id,
          senderId,
          senderName,
          senderRole,
          content,
          read: false,
        })
        .returning();

      // Atualizar conversa
      const updateData: {
        lastMessage: string;
        unreadCount?: number;
        clientUnreadCount?: number;
      } = {
        lastMessage: content,
      };

      // Incrementar contador de nao lidas baseado em quem enviou
      if (senderRole === "client") {
        // Cliente enviou -> admin precisa ler
        updateData.unreadCount = conversation.unreadCount + 1;
      } else {
        // Admin enviou -> cliente precisa ler
        updateData.clientUnreadCount = conversation.clientUnreadCount + 1;
      }

      await db.update(conversations).set(updateData).where(eq(conversations.id, id));

      return c.json({ data: newMessage }, 201);
    }
  )

  /**
   * PUT /api/chat/conversations/:id/read
   * Marca mensagens como lidas
   * Requer autenticacao
   */
  .put(
    "/conversations/:id/read",
    authMiddleware,
    zValidator("param", conversationIdSchema),
    zValidator("json", markAsReadSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { role } = c.req.valid("json");

      // Verificar se conversa existe
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, id),
      });

      if (!conversation) {
        return c.json({ error: { code: "NOT_FOUND", message: "Conversa nao encontrada" } }, 404);
      }

      // Marcar mensagens do outro role como lidas
      const otherRole = role === "admin" ? "client" : "admin";
      await db
        .update(chatMessages)
        .set({ read: true })
        .where(
          and(
            eq(chatMessages.conversationId, id),
            eq(chatMessages.senderRole, otherRole),
            eq(chatMessages.read, false)
          )
        );

      // Resetar contador de nao lidas baseado em quem leu
      if (role === "admin") {
        // Admin leu mensagens do cliente
        await db.update(conversations).set({ unreadCount: 0 }).where(eq(conversations.id, id));
      } else {
        // Cliente leu mensagens do admin
        await db
          .update(conversations)
          .set({ clientUnreadCount: 0 })
          .where(eq(conversations.id, id));
      }

      return c.json({ success: true });
    }
  )

  /**
   * GET /api/chat/unread-count
   * Retorna total de mensagens nao lidas para admin
   * Requer autenticacao
   */
  .get("/unread-count", authMiddleware, async (c) => {
    const allConversations = await db
      .select({ unreadCount: conversations.unreadCount })
      .from(conversations);

    const total = allConversations.reduce((acc, c) => acc + c.unreadCount, 0);

    return c.json({ data: { total } });
  });
