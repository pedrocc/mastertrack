import { boolean, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * Tabela de usuarios
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Types inferidos do schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * Tipos de requisicao disponiveis
 */
export const requestTypes = [
  "pre_proforma",
  "dados_importador",
  "schedule_proforma",
  "fichas_tecnicas",
  "drafts",
  "alteracao_documento",
  "alteracao_bl",
  "schedule_booking",
  "telex_release",
  "documento",
  "embarque",
  "financeiro",
] as const;

export type RequestType = (typeof requestTypes)[number];

/**
 * Tabela de configuracoes de SLA
 */
export const slaConfigs = pgTable("sla_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 50 }).notNull().unique(),
  slaDays: integer("sla_days").notNull().default(3),
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Types inferidos do schema
export type SlaConfig = typeof slaConfigs.$inferSelect;
export type NewSlaConfig = typeof slaConfigs.$inferInsert;

/**
 * Status de conversa
 */
export const conversationStatuses = ["open", "closed"] as const;
export type ConversationStatus = (typeof conversationStatuses)[number];

/**
 * Roles de remetente de mensagem
 */
export const senderRoles = ["client", "admin"] as const;
export type SenderRole = (typeof senderRoles)[number];

/**
 * Tabela de conversas de suporte
 */
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: varchar("company_id", { length: 100 }).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  lastMessage: text("last_message").notNull().default(""),
  unreadCount: integer("unread_count").notNull().default(0), // mensagens nao lidas pelo admin (do cliente)
  clientUnreadCount: integer("client_unread_count").notNull().default(0), // mensagens nao lidas pelo cliente (do admin)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Types inferidos do schema
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

/**
 * Tabela de mensagens de chat
 */
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id", { length: 100 }).notNull(),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  senderRole: varchar("sender_role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Types inferidos do schema
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

/**
 * Status de requisicao
 */
export const requestStatuses = ["aberta", "em_andamento", "concluido", "cancelado"] as const;
export type RequestStatus = (typeof requestStatuses)[number];

/**
 * Tabela de requisicoes
 */
export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: varchar("company_id", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("aberta"),
  data: text("data").notNull().default("{}"), // JSON stringified
  statusSeenByClient: boolean("status_seen_by_client").notNull().default(true),
  seenByAdmin: boolean("seen_by_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Types inferidos do schema
export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;

/**
 * Tabela de comentarios de requisicoes
 */
export const requestComments = pgTable("request_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  authorId: varchar("author_id", { length: 100 }).notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  authorRole: varchar("author_role", { length: 20 }).notNull(), // 'admin' | 'user'
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Types inferidos do schema
export type RequestComment = typeof requestComments.$inferSelect;
export type NewRequestComment = typeof requestComments.$inferInsert;
