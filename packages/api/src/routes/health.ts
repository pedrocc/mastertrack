import { Hono } from "hono";
import { checkDatabaseHealth } from "../db";

export const healthRoutes = new Hono()
  /**
   * GET /health
   * Health check basico
   */
  .get("/", (c) => {
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  })

  /**
   * GET /health/ready
   * Readiness check (inclui database)
   */
  .get("/ready", async (c) => {
    const dbHealthy = await checkDatabaseHealth();

    if (!dbHealthy) {
      return c.json(
        {
          status: "error",
          message: "Database not ready",
          timestamp: new Date().toISOString(),
        },
        503
      );
    }

    return c.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  })

  /**
   * GET /health/live
   * Liveness check
   */
  .get("/live", (c) => {
    return c.json({
      status: "ok",
      uptime: Math.floor(Bun.nanoseconds() / 1e9),
      timestamp: new Date().toISOString(),
    });
  });
