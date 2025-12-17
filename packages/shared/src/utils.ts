import type { PaginatedResponse } from "./types";

/**
 * Cria uma resposta paginada
 */
export function paginate<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Delay para testes e desenvolvimento
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gera um ID unico (UUID v4)
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Remove propriedades undefined de um objeto
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

/**
 * Formata data para exibicao
 */
export function formatDate(date: Date | string, locale = "pt-BR"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formata data e hora para exibicao
 */
export function formatDateTime(date: Date | string, locale = "pt-BR"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Capitaliza primeira letra
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Trunca texto com ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

/**
 * Verifica se esta em ambiente de producao
 */
export function isProduction(): boolean {
  return typeof Bun !== "undefined"
    ? Bun.env["NODE_ENV"] === "production"
    : import.meta.env?.["MODE"] === "production";
}

/**
 * Verifica se esta em ambiente de desenvolvimento
 */
export function isDevelopment(): boolean {
  return typeof Bun !== "undefined"
    ? Bun.env["NODE_ENV"] === "development" || !Bun.env["NODE_ENV"]
    : import.meta.env?.["MODE"] === "development" || !import.meta.env?.["MODE"];
}
