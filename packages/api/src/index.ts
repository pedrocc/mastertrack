import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "./middleware/error";
import { generalRateLimiter } from "./middleware/rate-limit";
import { authRoutes } from "./routes/auth";
import { chatRoutes } from "./routes/chat";
import { companiesRoutes } from "./routes/companies";
import { containersRoutes } from "./routes/containers";
import { healthRoutes } from "./routes/health";
import { requestCommentsRoutes } from "./routes/request-comments";
import { requestsRoutes } from "./routes/requests";
import { slaConfigsRoutes } from "./routes/sla-configs";
import { usersRoutes } from "./routes/users";

const isProduction = Bun.env["NODE_ENV"] === "production";

// Origens permitidas para CORS
const allowedOrigins = isProduction
  ? (Bun.env["ALLOWED_ORIGINS"]?.split(",") ?? [])
  : ["http://localhost:5173", "http://localhost:3000"];

const app = new Hono()
  // Middlewares globais - CORS deve vir primeiro para funcionar mesmo em erros
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
        // Fallback: aceita a origem do Railway app
        if (origin?.includes("railway.app")) {
          return origin;
        }
        return null;
      },
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
  .use("*", logger())
  .use("*", secureHeaders())
  .use("*", prettyJSON())
  .use("*", generalRateLimiter)
  // Error handler
  .onError(errorHandler)
  // Routes
  .route("/health", healthRoutes)
  .route("/api/auth", authRoutes)
  .route("/api/users", usersRoutes)
  .route("/api/companies", companiesRoutes)
  .route("/api/sla-configs", slaConfigsRoutes)
  .route("/api/chat", chatRoutes)
  .route("/api/requests", requestsRoutes)
  .route("/api/requests", requestCommentsRoutes)
  .route("/api/containers", containersRoutes);

// Export type for RPC client
export type AppType = typeof app;

// Export public types for frontend consumption
export type { InsertUser, UpdateUser, SelectUser } from "./db/schemas";
export type { InsertCompany, UpdateCompany, SelectCompany } from "./db/schemas";
export type { InsertSlaConfig, UpdateSlaConfig, SelectSlaConfig } from "./db/schemas";
export type {
  InsertConversation,
  SelectConversation,
  InsertChatMessage,
  SelectChatMessage,
  SendMessage,
} from "./db/schemas";
export type {
  RequestType,
  RequestStatus,
  SlaConfig,
  Conversation,
  ChatMessage,
  ConversationStatus,
  SenderRole,
  Request,
} from "./db/schema";
export type {
  CreateRequest,
  UpdateRequestData,
  UpdateRequestStatus,
  SelectRequest,
  CreateRequestComment,
  SelectRequestComment,
} from "./db/schemas";
export type { RequestComment, Container, ContainerStatus, PaymentStatus } from "./db/schema";
export type {
  CreateContainer,
  UpdateContainer,
  SelectContainer,
  RoutePoint,
} from "./db/schemas";

// Start server
const port = Number(Bun.env["PORT"]) || 3000;
console.log(`Server running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
