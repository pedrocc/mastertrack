import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

/**
 * Error handler global
 */
export function errorHandler(err: Error, c: Context) {
  // Erro de validacao Zod
  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados invalidos",
          details: err.flatten().fieldErrors,
        },
      },
      400
    );
  }

  // Erro HTTP do Hono
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          code:
            err.status === 401 ? "UNAUTHORIZED" : err.status === 403 ? "FORBIDDEN" : "HTTP_ERROR",
          message: err.message,
        },
      },
      err.status
    );
  }

  // Erro generico
  console.error("Unhandled error:", err);

  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: Bun.env["NODE_ENV"] === "production" ? "Erro interno do servidor" : err.message,
      },
    },
    500
  );
}
