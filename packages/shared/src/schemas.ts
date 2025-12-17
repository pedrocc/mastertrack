import { z } from "zod";

/**
 * Schema de paginacao
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

/**
 * Schema de ID (UUID)
 */
export const idSchema = z.string().uuid("ID invalido");

/**
 * Schema de email
 */
export const emailSchema = z.string().email("Email invalido").toLowerCase().trim();

/**
 * Schema de senha
 */
export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no minimo 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiuscula")
  .regex(/[a-z]/, "Senha deve conter ao menos uma letra minuscula")
  .regex(/[0-9]/, "Senha deve conter ao menos um numero");

/**
 * Schema de nome
 */
export const nameSchema = z
  .string()
  .min(2, "Nome deve ter no minimo 2 caracteres")
  .max(100, "Nome deve ter no maximo 100 caracteres")
  .trim();

/**
 * Schema de ordenacao
 */
export const orderBySchema = z.enum(["asc", "desc"]).default("desc");

/**
 * Schema de busca
 */
export const searchSchema = z.object({
  q: z.string().optional(),
  orderBy: orderBySchema.optional(),
});

/**
 * Schema de filtro por data
 */
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
