/**
 * Resposta padrao da API
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Resposta de erro da API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Parametros de paginacao
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Usuario autenticado
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

/**
 * Roles de usuario
 */
export type UserRole = "admin" | "user" | "guest";

/**
 * Empresa
 */
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

/**
 * Usuario com empresa
 */
export interface UserWithCompany extends AuthUser {
  companyId?: string;
  companyName?: string;
}

/**
 * Timestamps padrao
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidade base com ID e timestamps
 */
export interface BaseEntity extends Timestamps {
  id: string;
}

/**
 * Converte campos Date para string (para uso com respostas JSON da API)
 *
 * Quando o Drizzle infere tipos de schema, campos timestamp sao tipados como Date.
 * Porem, ao serializar para JSON, esses campos se tornam strings ISO.
 * Use este tipo para representar corretamente dados recebidos da API.
 *
 * @example
 * // Tipo do Drizzle
 * type SelectUser = { id: string; createdAt: Date; updatedAt: Date; }
 *
 * // Tipo correto para uso no frontend apos receber da API
 * type User = JsonSerialized<SelectUser>
 * // Resultado: { id: string; createdAt: string; updatedAt: string; }
 */
export type JsonSerialized<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K] extends Date | undefined
        ? string | undefined
        : T[K] extends object
          ? JsonSerialized<T[K]>
          : T[K];
};
