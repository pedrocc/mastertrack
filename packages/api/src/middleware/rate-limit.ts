import type { Context, Next } from "hono";
import { rateLimiter } from "hono-rate-limiter";

const isProduction = Bun.env["NODE_ENV"] === "production";

/**
 * Middleware noop para desabilitar rate limit em desenvolvimento
 */
const noopMiddleware = async (_c: Context, next: Next) => next();

/**
 * Rate limiter geral para API
 * Limite: 100 requests por minuto por IP
 * Desabilitado em desenvolvimento para facilitar testes
 */
export const generalRateLimiter = isProduction
  ? rateLimiter({
      windowMs: 60 * 1000, // 1 minuto
      limit: 500, // Aumentado para 500 requests por minuto
      standardHeaders: "draft-6",
      keyGenerator: (c) =>
        c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown",
      message: {
        error: { code: "RATE_LIMITED", message: "Muitas requisicoes. Tente novamente em breve." },
      },
    })
  : noopMiddleware;

/**
 * Rate limiter mais restrito para rotas de autenticacao
 * Limite: 10 requests por minuto por IP
 * Desabilitado em desenvolvimento
 */
export const authRateLimiter = isProduction
  ? rateLimiter({
      windowMs: 60 * 1000, // 1 minuto
      limit: 10,
      standardHeaders: "draft-6",
      keyGenerator: (c) =>
        c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown",
      message: {
        error: {
          code: "RATE_LIMITED",
          message: "Muitas tentativas de autenticacao. Aguarde 1 minuto.",
        },
      },
    })
  : noopMiddleware;

/**
 * Rate limiter para operacoes de escrita (POST/PUT/DELETE)
 * Limite: 30 requests por minuto por IP
 * Desabilitado em desenvolvimento
 */
export const writeRateLimiter = isProduction
  ? rateLimiter({
      windowMs: 60 * 1000, // 1 minuto
      limit: 30,
      standardHeaders: "draft-6",
      keyGenerator: (c) =>
        c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown",
      message: {
        error: {
          code: "RATE_LIMITED",
          message: "Muitas operacoes de escrita. Tente novamente em breve.",
        },
      },
    })
  : noopMiddleware;
