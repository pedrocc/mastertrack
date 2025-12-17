import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "./middleware/error";
import { generalRateLimiter } from "./middleware/rate-limit";
import { healthRoutes } from "./routes/health";
import { usersRoutes } from "./routes/users";

const isProduction = Bun.env["NODE_ENV"] === "production";

// Origens permitidas para CORS
const allowedOrigins = isProduction
  ? (Bun.env["ALLOWED_ORIGINS"]?.split(",") ?? [])
  : ["http://localhost:5173", "http://localhost:3000"];

const app = new Hono()
  // Middlewares globais
  .use("*", logger())
  .use("*", secureHeaders())
  .use("*", prettyJSON())
  .use("*", generalRateLimiter)
  .use(
    "*",
    cors({
      origin: (origin) => {
        // Em desenvolvimento, aceita qualquer origem localhost
        if (!isProduction && origin?.includes("localhost")) {
          return origin;
        }
        // Em producao, verifica lista de origens permitidas
        if (allowedOrigins.includes(origin ?? "")) {
          return origin;
        }
        return null;
      },
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
  // Error handler
  .onError(errorHandler)
  // Routes
  .route("/health", healthRoutes)
  .route("/api/users", usersRoutes);

// Export type for RPC client
export type AppType = typeof app;

// Export public types for frontend consumption
export type { InsertUser, UpdateUser, SelectUser } from "./db/schemas";

// Start server
const port = Number(Bun.env["PORT"]) || 3000;
console.log(`Server running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
