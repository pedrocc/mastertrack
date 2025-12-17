import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

/**
 * Schema de validacao para criar usuario
 */
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email("Email invalido").toLowerCase().trim(),
  name: (schema) => schema.name.min(2, "Nome deve ter no minimo 2 caracteres").trim(),
  role: (schema) => schema.role.optional(),
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
