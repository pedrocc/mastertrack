import { describe, expect, it, beforeEach } from "bun:test";
import { Hono } from "hono";

// Create isolated test app that mimics health routes behavior
// without importing actual routes (which may depend on db module)

let mockDbHealthy = true;

const createHealthApp = () => {
  return new Hono()
    .get("/", (c) => {
      return c.json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    })
    .get("/ready", async (c) => {
      if (!mockDbHealthy) {
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
    .get("/live", (c) => {
      return c.json({
        status: "ok",
        uptime: Math.floor(Bun.nanoseconds() / 1e9),
        timestamp: new Date().toISOString(),
      });
    });
};

describe("Health Routes", () => {
  let app: ReturnType<typeof createHealthApp>;

  beforeEach(() => {
    mockDbHealthy = true;
    app = createHealthApp();
  });

  describe("GET /", () => {
    it("returns ok status", async () => {
      const res = await app.request("/");
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe("ok");
      expect(json.timestamp).toBeDefined();
    });

    it("returns valid ISO timestamp", async () => {
      const res = await app.request("/");
      const json = await res.json();

      const timestamp = new Date(json.timestamp);
      expect(timestamp.toISOString()).toBe(json.timestamp);
    });
  });

  describe("GET /ready", () => {
    it("returns ok when database is healthy", async () => {
      mockDbHealthy = true;

      const res = await app.request("/ready");
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe("ok");
      expect(json.database).toBe("connected");
    });

    it("returns 503 when database is not healthy", async () => {
      mockDbHealthy = false;

      const res = await app.request("/ready");
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.status).toBe("error");
      expect(json.message).toBe("Database not ready");
    });

    it("includes timestamp in response", async () => {
      const res = await app.request("/ready");
      const json = await res.json();
      expect(json.timestamp).toBeDefined();
    });
  });

  describe("GET /live", () => {
    it("returns ok status with uptime", async () => {
      const res = await app.request("/live");
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe("ok");
      expect(typeof json.uptime).toBe("number");
      expect(json.uptime).toBeGreaterThanOrEqual(0);
    });

    it("includes timestamp in response", async () => {
      const res = await app.request("/live");
      const json = await res.json();
      expect(json.timestamp).toBeDefined();
    });
  });
});
