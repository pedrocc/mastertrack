import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  chatMessages,
  companies,
  containers,
  containerStatuses,
  conversationStatuses,
  conversations,
  paymentStatuses,
  requestComments,
  requests,
  requestStatuses,
  requestTypes,
  senderRoles,
  slaConfigs,
  users,
} from "./schema";

/**
 * Schema de validacao para criar usuario
 */
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email("Email invalido").toLowerCase().trim(),
  name: (schema) => schema.name.min(2, "Nome deve ter no minimo 2 caracteres").trim(),
  role: (schema) => schema.role.optional(),
  companyId: (schema) => schema.companyId.optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema de validacao para atualizar usuario
 */
export const updateUserSchema = insertUserSchema.partial();

/**
 * Schema de validacao para usuario retornado
 */
export const selectUserSchema = createSelectSchema(users);

/**
 * Schema de validacao para ID de usuario
 */
export const userIdSchema = z.object({
  id: z.string().uuid("ID invalido"),
});

// Types inferidos dos schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

// ============================================
// Schemas de Empresas
// ============================================

/**
 * Schema de validacao para criar empresa
 */
export const insertCompanySchema = createInsertSchema(companies, {
  name: (schema) => schema.name.min(2, "Nome deve ter no minimo 2 caracteres").trim(),
  cnpj: (schema) => schema.cnpj.min(14, "CNPJ invalido").trim(),
  email: (schema) => schema.email.email("Email invalido").toLowerCase().trim(),
  phone: (schema) => schema.phone.optional(),
  address: (schema) => schema.address.optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema de validacao para atualizar empresa
 */
export const updateCompanySchema = insertCompanySchema.partial();

/**
 * Schema de validacao para empresa retornada
 */
export const selectCompanySchema = createSelectSchema(companies);

/**
 * Schema de validacao para ID de empresa
 */
export const companyIdSchema = z.object({
  id: z.string().uuid("ID invalido"),
});

// Types inferidos dos schemas
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type UpdateCompany = z.infer<typeof updateCompanySchema>;
export type SelectCompany = z.infer<typeof selectCompanySchema>;

/**
 * Schema de tipo de requisicao
 */
export const requestTypeSchema = z.enum(requestTypes);

/**
 * Schema de validacao para criar config de SLA
 */
export const insertSlaConfigSchema = createInsertSchema(slaConfigs, {
  type: () => requestTypeSchema,
  slaDays: (schema) => schema.slaDays.min(1, "SLA deve ser no minimo 1 dia"),
  label: (schema) => schema.label.min(2, "Label deve ter no minimo 2 caracteres").trim(),
  description: (schema) => schema.description.trim(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema de validacao para atualizar config de SLA
 */
export const updateSlaConfigSchema = z.object({
  slaDays: z.number().min(1, "SLA deve ser no minimo 1 dia"),
});

/**
 * Schema de validacao para SLA config retornado
 */
export const selectSlaConfigSchema = createSelectSchema(slaConfigs);

/**
 * Schema de validacao para tipo de requisicao (param)
 */
export const slaTypeParamSchema = z.object({
  type: requestTypeSchema,
});

// Types inferidos dos schemas de SLA
export type InsertSlaConfig = z.infer<typeof insertSlaConfigSchema>;
export type UpdateSlaConfig = z.infer<typeof updateSlaConfigSchema>;
export type SelectSlaConfig = z.infer<typeof selectSlaConfigSchema>;

// ============================================
// Schemas de Chat/Conversas
// ============================================

/**
 * Schema de status de conversa
 */
export const conversationStatusSchema = z.enum(conversationStatuses);

/**
 * Schema de role de remetente
 */
export const senderRoleSchema = z.enum(senderRoles);

/**
 * Schema de validacao para criar conversa
 */
export const insertConversationSchema = createInsertSchema(conversations, {
  companyId: (schema) => schema.companyId.min(1, "Company ID obrigatorio"),
  companyName: (schema) => schema.companyName.min(1, "Nome da empresa obrigatorio").trim(),
  userId: (schema) => schema.userId.min(1, "User ID obrigatorio"),
  userName: (schema) => schema.userName.min(1, "Nome do usuario obrigatorio").trim(),
  status: () => conversationStatusSchema.optional(),
}).omit({
  id: true,
  lastMessage: true,
  unreadCount: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema para buscar ou criar conversa
 */
export const getOrCreateConversationSchema = z.object({
  companyId: z.string().min(1, "Company ID obrigatorio"),
  companyName: z.string().min(1, "Nome da empresa obrigatorio"),
  userId: z.string().min(1, "User ID obrigatorio"),
  userName: z.string().min(1, "Nome do usuario obrigatorio"),
});

/**
 * Schema de validacao para atualizar status da conversa
 */
export const updateConversationStatusSchema = z.object({
  status: conversationStatusSchema,
});

/**
 * Schema de validacao para conversa retornada
 */
export const selectConversationSchema = createSelectSchema(conversations);

/**
 * Schema de validacao para ID de conversa
 */
export const conversationIdSchema = z.object({
  id: z.string().uuid("ID de conversa invalido"),
});

// Types inferidos dos schemas de Conversa
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type UpdateConversationStatus = z.infer<typeof updateConversationStatusSchema>;
export type SelectConversation = z.infer<typeof selectConversationSchema>;

/**
 * Schema de validacao para criar mensagem
 */
export const insertChatMessageSchema = createInsertSchema(chatMessages, {
  senderId: (schema) => schema.senderId.min(1, "Sender ID obrigatorio"),
  senderName: (schema) => schema.senderName.min(1, "Nome do remetente obrigatorio").trim(),
  senderRole: () => senderRoleSchema,
  content: (schema) => schema.content.min(1, "Conteudo da mensagem obrigatorio"),
}).omit({
  id: true,
  conversationId: true,
  read: true,
  createdAt: true,
});

/**
 * Schema para enviar mensagem (inclui conversationId como param)
 */
export const sendMessageSchema = z.object({
  senderId: z.string().min(1, "Sender ID obrigatorio"),
  senderName: z.string().min(1, "Nome do remetente obrigatorio"),
  senderRole: senderRoleSchema,
  content: z.string().min(1, "Conteudo da mensagem obrigatorio"),
});

/**
 * Schema para marcar mensagens como lidas
 */
export const markAsReadSchema = z.object({
  role: senderRoleSchema,
});

/**
 * Schema de validacao para mensagem retornada
 */
export const selectChatMessageSchema = createSelectSchema(chatMessages);

// Types inferidos dos schemas de Mensagem
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;
export type SelectChatMessage = z.infer<typeof selectChatMessageSchema>;

// ============================================
// Schemas de Requisicoes
// ============================================

/**
 * Schema de status de requisicao
 */
export const requestStatusSchema = z.enum(requestStatuses);

/**
 * Schema de validacao para criar requisicao
 */
export const insertRequestSchema = createInsertSchema(requests, {
  companyId: (schema) => schema.companyId.min(1, "Company ID obrigatorio"),
  type: () => requestTypeSchema,
  title: (schema) => schema.title.min(1, "Titulo obrigatorio").trim(),
  status: () => requestStatusSchema.optional(),
  data: (schema) => schema.data.optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema para criar requisicao via API
 */
export const createRequestSchema = z.object({
  companyId: z.string().min(1, "Company ID obrigatorio"),
  type: requestTypeSchema,
  title: z.string().min(1, "Titulo obrigatorio"),
  data: z.string().optional().default("{}"),
});

/**
 * Schema para atualizar dados da requisicao
 */
export const updateRequestDataSchema = z.object({
  data: z.string().min(1, "Dados obrigatorios"),
});

/**
 * Schema para atualizar status da requisicao
 */
export const updateRequestStatusSchema = z.object({
  status: requestStatusSchema,
  seenByClient: z.boolean().optional().default(false),
});

/**
 * Schema para marcar requisicao como vista
 */
export const markRequestSeenSchema = z.object({
  seenByAdmin: z.boolean().optional(),
  statusSeenByClient: z.boolean().optional(),
});

/**
 * Schema de validacao para requisicao retornada
 */
export const selectRequestSchema = createSelectSchema(requests);

/**
 * Schema de validacao para ID de requisicao
 */
export const requestIdSchema = z.object({
  id: z.string().uuid("ID de requisicao invalido"),
});

// Types inferidos dos schemas de Requisicao
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type CreateRequest = z.infer<typeof createRequestSchema>;
export type UpdateRequestData = z.infer<typeof updateRequestDataSchema>;
export type UpdateRequestStatus = z.infer<typeof updateRequestStatusSchema>;
export type SelectRequest = z.infer<typeof selectRequestSchema>;

// ============================================
// Schemas de Comentarios de Requisicoes
// ============================================

/**
 * Schema de validacao para criar comentario
 */
export const insertRequestCommentSchema = createInsertSchema(requestComments, {
  requestId: (schema) => schema.requestId,
  authorId: (schema) => schema.authorId.min(1, "Author ID obrigatorio"),
  authorName: (schema) => schema.authorName.min(1, "Nome do autor obrigatorio"),
  authorRole: (schema) => schema.authorRole.min(1, "Role do autor obrigatorio"),
  content: (schema) => schema.content.min(1, "Conteudo obrigatorio"),
}).omit({
  id: true,
  createdAt: true,
});

/**
 * Schema para criar comentario via API
 */
export const createRequestCommentSchema = z.object({
  requestId: z.string().uuid("ID de requisicao invalido"),
  content: z.string().min(1, "Conteudo obrigatorio"),
});

/**
 * Schema de validacao para comentario retornado
 */
export const selectRequestCommentSchema = createSelectSchema(requestComments);

// Types inferidos dos schemas de Comentario
export type InsertRequestComment = z.infer<typeof insertRequestCommentSchema>;
export type CreateRequestComment = z.infer<typeof createRequestCommentSchema>;
export type SelectRequestComment = z.infer<typeof selectRequestCommentSchema>;

// ============================================
// Schemas de Containers
// ============================================

/**
 * Schema de status de container
 */
export const containerStatusSchema = z.enum(containerStatuses);

/**
 * Schema de status de pagamento
 */
export const paymentStatusSchema = z.enum(paymentStatuses);

/**
 * Schema de ponto de rota
 */
export const routePointSchema = z.object({
  location: z.string(),
  lat: z.number(),
  lng: z.number(),
  date: z.string(),
  status: z.enum(["completed", "current", "pending"]),
});

/**
 * Schema de validacao para criar container
 */
export const insertContainerSchema = createInsertSchema(containers, {
  companyId: (schema) => schema.companyId,
  number: (schema) => schema.number.min(1, "Numero do container obrigatorio"),
  origin: (schema) => schema.origin.min(1, "Origem obrigatoria"),
  destination: (schema) => schema.destination.min(1, "Destino obrigatorio"),
  departureDate: (schema) => schema.departureDate.min(1, "Data de partida obrigatoria"),
  arrivalForecast: (schema) => schema.arrivalForecast.min(1, "Previsao de chegada obrigatoria"),
  cargo: (schema) => schema.cargo.min(1, "Carga obrigatoria"),
  weight: (schema) => schema.weight.min(1, "Peso obrigatorio"),
  status: () => containerStatusSchema.optional(),
  paymentStatus: () => paymentStatusSchema.optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema para criar container via API
 */
export const createContainerSchema = z.object({
  companyId: z.string().uuid("Company ID invalido"),
  number: z.string().min(1, "Numero do container obrigatorio"),
  isFrozen: z.boolean().optional().default(false),
  status: containerStatusSchema.optional().default("a_embarcar"),
  paymentStatus: paymentStatusSchema.optional().default("pendente"),
  origin: z.string().min(1, "Origem obrigatoria"),
  destination: z.string().min(1, "Destino obrigatorio"),
  departureDate: z.string().min(1, "Data de partida obrigatoria"),
  arrivalForecast: z.string().min(1, "Previsao de chegada obrigatoria"),
  progress: z.number().min(0).max(100).optional().default(0),
  route: z.string().optional().default("[]"),
  cargo: z.string().min(1, "Carga obrigatoria"),
  weight: z.string().min(1, "Peso obrigatorio"),
});

/**
 * Schema para atualizar container
 */
export const updateContainerSchema = z.object({
  number: z.string().min(1).optional(),
  isFrozen: z.boolean().optional(),
  status: containerStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  origin: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  departureDate: z.string().min(1).optional(),
  arrivalForecast: z.string().min(1).optional(),
  progress: z.number().min(0).max(100).optional(),
  route: z.string().optional(),
  cargo: z.string().min(1).optional(),
  weight: z.string().min(1).optional(),
});

/**
 * Schema de validacao para container retornado
 */
export const selectContainerSchema = createSelectSchema(containers);

/**
 * Schema de validacao para ID de container
 */
export const containerIdSchema = z.object({
  id: z.string().uuid("ID de container invalido"),
});

/**
 * Schema para filtrar containers por empresa
 */
export const containersByCompanySchema = z.object({
  companyId: z.string().uuid("Company ID invalido"),
});

// Types inferidos dos schemas de Container
export type InsertContainer = z.infer<typeof insertContainerSchema>;
export type CreateContainer = z.infer<typeof createContainerSchema>;
export type UpdateContainer = z.infer<typeof updateContainerSchema>;
export type SelectContainer = z.infer<typeof selectContainerSchema>;
export type RoutePoint = z.infer<typeof routePointSchema>;
