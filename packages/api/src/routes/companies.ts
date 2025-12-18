import { zValidator } from "@hono/zod-validator";
import { paginationSchema } from "@mastertrack/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { companies } from "../db/schema";
import { companyIdSchema, insertCompanySchema, updateCompanySchema } from "../db/schemas";
import { authMiddleware, requireRole } from "../middleware/auth";
import { writeRateLimiter } from "../middleware/rate-limit";

export const companiesRoutes = new Hono()
  /**
   * GET /api/companies
   * Lista todas as empresas com paginacao
   * Requer autenticacao
   */
  .get("/", authMiddleware, zValidator("query", paginationSchema), async (c) => {
    const { page, pageSize } = c.req.valid("query");
    const offset = (page - 1) * pageSize;

    const [allCompanies, countResult] = await Promise.all([
      db.select().from(companies).limit(pageSize).offset(offset).orderBy(companies.createdAt),
      db.select().from(companies),
    ]);

    const total = countResult.length;

    return c.json({
      data: allCompanies,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  })

  /**
   * GET /api/companies/:id
   * Busca empresa por ID
   * Requer autenticacao
   */
  .get("/:id", authMiddleware, zValidator("param", companyIdSchema), async (c) => {
    const { id } = c.req.valid("param");

    const company = await db.query.companies.findFirst({
      where: eq(companies.id, id),
    });

    if (!company) {
      return c.json({ error: { code: "NOT_FOUND", message: "Empresa nao encontrada" } }, 404);
    }

    return c.json({ data: company });
  })

  /**
   * POST /api/companies
   * Cria nova empresa
   * Requer autenticacao + role admin
   */
  .post(
    "/",
    authMiddleware,
    requireRole("admin"),
    writeRateLimiter,
    zValidator("json", insertCompanySchema),
    async (c) => {
      const data = c.req.valid("json");

      // Verificar se CNPJ ja existe
      const existing = await db.query.companies.findFirst({
        where: eq(companies.cnpj, data.cnpj),
      });

      if (existing) {
        return c.json({ error: { code: "CONFLICT", message: "CNPJ ja cadastrado" } }, 409);
      }

      const [company] = await db.insert(companies).values(data).returning();

      return c.json({ data: company }, 201);
    }
  )

  /**
   * PUT /api/companies/:id
   * Atualiza empresa
   * Requer autenticacao + role admin
   */
  .put(
    "/:id",
    authMiddleware,
    requireRole("admin"),
    writeRateLimiter,
    zValidator("param", companyIdSchema),
    zValidator("json", updateCompanySchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");

      // Verificar se empresa existe
      const existing = await db.query.companies.findFirst({
        where: eq(companies.id, id),
      });

      if (!existing) {
        return c.json({ error: { code: "NOT_FOUND", message: "Empresa nao encontrada" } }, 404);
      }

      // Se estiver atualizando CNPJ, verificar se ja existe
      if (data.cnpj && data.cnpj !== existing.cnpj) {
        const cnpjExists = await db.query.companies.findFirst({
          where: eq(companies.cnpj, data.cnpj),
        });

        if (cnpjExists) {
          return c.json({ error: { code: "CONFLICT", message: "CNPJ ja cadastrado" } }, 409);
        }
      }

      const [company] = await db
        .update(companies)
        .set(data)
        .where(eq(companies.id, id))
        .returning();

      return c.json({ data: company });
    }
  )

  /**
   * DELETE /api/companies/:id
   * Remove empresa
   * Requer autenticacao + role admin
   */
  .delete(
    "/:id",
    authMiddleware,
    requireRole("admin"),
    writeRateLimiter,
    zValidator("param", companyIdSchema),
    async (c) => {
      const { id } = c.req.valid("param");

      const existing = await db.query.companies.findFirst({
        where: eq(companies.id, id),
      });

      if (!existing) {
        return c.json({ error: { code: "NOT_FOUND", message: "Empresa nao encontrada" } }, 404);
      }

      await db.delete(companies).where(eq(companies.id, id));

      return c.json({ message: "Empresa removida com sucesso" });
    }
  );
