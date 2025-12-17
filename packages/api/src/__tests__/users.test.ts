import { describe, expect, it, beforeEach } from "bun:test";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { paginationSchema } from "@mastertrack/shared";

// Create isolated test app that mimics user routes behavior
// without importing actual routes (which depend on Supabase)

const mockUsers = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    email: "user1@test.com",
    name: "User One",
    role: "user",
    avatarUrl: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    email: "admin@test.com",
    name: "Admin User",
    role: "admin",
    avatarUrl: null,
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02"),
  },
];

// Mock database state
let dbUsers = [...mockUsers];

// Schemas matching the real ones
const insertUserSchema = z.object({
  email: z.string().email("Email invalido").toLowerCase().trim(),
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres").trim(),
  role: z.string().optional().default("user"),
});

const updateUserSchema = insertUserSchema.partial();

const userIdSchema = z.object({
  id: z.string().uuid("ID invalido"),
});

// Mock auth middleware
const mockAuthMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Token nao fornecido" } }, 401);
  }
  c.set("user", { id: "mock-user-id", email: "dev@test.com", role: "admin" });
  await next();
};

// Create test app mimicking real routes
const createTestApp = () => {
  dbUsers = [...mockUsers]; // Reset state

  return new Hono()
    .get("/", mockAuthMiddleware, zValidator("query", paginationSchema), async (c) => {
      const { page, pageSize } = c.req.valid("query");
      const offset = (page - 1) * pageSize;
      const paginatedUsers = dbUsers.slice(offset, offset + pageSize);

      return c.json({
        data: paginatedUsers,
        pagination: {
          page,
          pageSize,
          total: dbUsers.length,
          totalPages: Math.ceil(dbUsers.length / pageSize),
        },
      });
    })
    .get("/:id", mockAuthMiddleware, zValidator("param", userIdSchema), async (c) => {
      const { id } = c.req.valid("param");
      const user = dbUsers.find((u) => u.id === id);

      if (!user) {
        return c.json({ error: { code: "NOT_FOUND", message: "Usuario nao encontrado" } }, 404);
      }

      return c.json({ data: user });
    })
    .post("/", mockAuthMiddleware, zValidator("json", insertUserSchema), async (c) => {
      const data = c.req.valid("json");

      const existing = dbUsers.find((u) => u.email === data.email);
      if (existing) {
        return c.json({ error: { code: "CONFLICT", message: "Email ja cadastrado" } }, 409);
      }

      const newUser = {
        id: crypto.randomUUID(),
        ...data,
        role: data.role ?? "user",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      dbUsers.push(newUser);
      return c.json({ data: newUser }, 201);
    })
    .put(
      "/:id",
      mockAuthMiddleware,
      zValidator("param", userIdSchema),
      zValidator("json", updateUserSchema),
      async (c) => {
        const { id } = c.req.valid("param");
        const data = c.req.valid("json");

        const userIndex = dbUsers.findIndex((u) => u.id === id);
        if (userIndex === -1) {
          return c.json({ error: { code: "NOT_FOUND", message: "Usuario nao encontrado" } }, 404);
        }

        const existingUser = dbUsers[userIndex];
        if (!existingUser) {
          return c.json({ error: { code: "NOT_FOUND", message: "Usuario nao encontrado" } }, 404);
        }

        if (data.email && data.email !== existingUser.email) {
          const emailExists = dbUsers.find((u) => u.email === data.email);
          if (emailExists) {
            return c.json({ error: { code: "CONFLICT", message: "Email ja cadastrado" } }, 409);
          }
        }

        const updatedUser = {
          ...existingUser,
          ...(data.email !== undefined && { email: data.email }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.role !== undefined && { role: data.role }),
          updatedAt: new Date(),
        };
        dbUsers[userIndex] = updatedUser;

        return c.json({ data: updatedUser });
      }
    )
    .delete("/:id", mockAuthMiddleware, zValidator("param", userIdSchema), async (c) => {
      const { id } = c.req.valid("param");

      const userIndex = dbUsers.findIndex((u) => u.id === id);
      if (userIndex === -1) {
        return c.json({ error: { code: "NOT_FOUND", message: "Usuario nao encontrado" } }, 404);
      }

      dbUsers.splice(userIndex, 1);
      return c.json({ message: "Usuario removido com sucesso" });
    });
};

describe("Users Routes Integration", () => {
  let app: ReturnType<typeof createTestApp>;
  const authHeader = { Authorization: "Bearer test-token" };

  beforeEach(() => {
    app = createTestApp();
  });

  describe("GET /", () => {
    it("returns list of users with pagination", async () => {
      const res = await app.request("/", { headers: authHeader });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.pagination).toBeDefined();
      expect(json.pagination.page).toBe(1);
      expect(json.pagination.pageSize).toBe(20);
      expect(json.pagination.total).toBe(2);
    });

    it("returns 401 without auth token", async () => {
      const res = await app.request("/");
      expect(res.status).toBe(401);
    });

    it("accepts pagination query params", async () => {
      const res = await app.request("/?page=1&pageSize=1", { headers: authHeader });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.pagination.page).toBe(1);
      expect(json.pagination.pageSize).toBe(1);
      expect(json.data.length).toBe(1);
    });

    it("returns correct total pages", async () => {
      const res = await app.request("/?pageSize=1", { headers: authHeader });
      const json = await res.json();
      expect(json.pagination.totalPages).toBe(2);
    });
  });

  describe("GET /:id", () => {
    it("returns user by id", async () => {
      const res = await app.request(`/${mockUsers[0]?.id}`, { headers: authHeader });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toBeDefined();
      expect(json.data.email).toBe("user1@test.com");
      expect(json.data.name).toBe("User One");
    });

    it("returns 404 for non-existent user", async () => {
      const res = await app.request("/550e8400-e29b-41d4-a716-446655440099", {
        headers: authHeader,
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 400 for invalid UUID", async () => {
      const res = await app.request("/invalid-id", { headers: authHeader });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /", () => {
    it("creates new user", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ email: "new@test.com", name: "New User" }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data).toBeDefined();
      expect(json.data.email).toBe("new@test.com");
      expect(json.data.name).toBe("New User");
      expect(json.data.role).toBe("user");
      expect(json.data.id).toBeDefined();
    });

    it("creates user with custom role", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ email: "newadmin@test.com", name: "New Admin", role: "admin" }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.role).toBe("admin");
    });

    it("returns 409 for duplicate email", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user1@test.com", name: "Duplicate User" }),
      });

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error.code).toBe("CONFLICT");
    });

    it("returns 400 for invalid email", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid-email", name: "Test User" }),
      });

      expect(res.status).toBe(400);
    });

    it("returns 400 for short name", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com", name: "A" }),
      });

      expect(res.status).toBe(400);
    });

    it("normalizes email to lowercase", async () => {
      const res = await app.request("/", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ email: "TEST@TEST.COM", name: "Test User" }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.email).toBe("test@test.com");
    });
  });

  describe("PUT /:id", () => {
    it("updates existing user", async () => {
      const res = await app.request(`/${mockUsers[0]?.id}`, {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toBeDefined();
      expect(json.data.name).toBe("Updated Name");
      expect(json.data.email).toBe("user1@test.com"); // Unchanged
    });

    it("updates user email", async () => {
      const res = await app.request(`/${mockUsers[0]?.id}`, {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ email: "newemail@test.com" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.email).toBe("newemail@test.com");
    });

    it("returns 404 for non-existent user", async () => {
      const res = await app.request("/550e8400-e29b-41d4-a716-446655440099", {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      expect(res.status).toBe(404);
    });

    it("returns 409 for duplicate email on update", async () => {
      const res = await app.request(`/${mockUsers[0]?.id}`, {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@test.com" }), // Already exists
      });

      expect(res.status).toBe(409);
    });
  });

  describe("DELETE /:id", () => {
    it("deletes existing user", async () => {
      const res = await app.request(`/${mockUsers[0]?.id}`, {
        method: "DELETE",
        headers: authHeader,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain("removido");

      // Verify user is deleted
      const getRes = await app.request(`/${mockUsers[0]?.id}`, { headers: authHeader });
      expect(getRes.status).toBe(404);
    });

    it("returns 404 for non-existent user", async () => {
      const res = await app.request("/550e8400-e29b-41d4-a716-446655440099", {
        method: "DELETE",
        headers: authHeader,
      });

      expect(res.status).toBe(404);
    });
  });
});
