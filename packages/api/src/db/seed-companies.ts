import { eq } from "drizzle-orm";
import { db } from "./index";
import { companies, users } from "./schema";

const seedCompanies = [
  {
    name: "Importadora Brasil Sul Ltda",
    cnpj: "12.345.678/0001-90",
    email: "contato@brasilsul.com.br",
    phone: "(47) 3333-4444",
    address: "Rua das Palmeiras, 500 - Itajai, SC",
  },
  {
    name: "Global Trading S.A.",
    cnpj: "98.765.432/0001-11",
    email: "comercial@globaltrading.com.br",
    phone: "(11) 5555-6666",
    address: "Av. Paulista, 1000 - Sao Paulo, SP",
  },
  {
    name: "Exporta Mais Comercio Exterior",
    cnpj: "55.666.777/0001-22",
    email: "logistica@exportamais.com.br",
    phone: "(21) 7777-8888",
    address: "Rua do Porto, 250 - Rio de Janeiro, RJ",
  },
];

async function seedCompaniesScript() {
  console.log("🏢 Criando empresas...");

  try {
    const createdCompanies: { id: string; name: string }[] = [];

    for (const companyData of seedCompanies) {
      // Check if company already exists
      const existing = await db.query.companies.findFirst({
        where: eq(companies.cnpj, companyData.cnpj),
      });

      if (existing) {
        console.log(`  ⏭️  Empresa ja existe: ${companyData.name}`);
        createdCompanies.push({ id: existing.id, name: existing.name });
        continue;
      }

      const [company] = await db.insert(companies).values(companyData).returning();
      if (company) {
        console.log(`  ✅ Empresa criada: ${company.name} (${company.id})`);
        createdCompanies.push({ id: company.id, name: company.name });
      }
    }

    // Associate first company with user@example.com
    console.log("\n👤 Associando usuarios a empresas...");

    const testUser = await db.query.users.findFirst({
      where: eq(users.email, "user@example.com"),
    });

    if (testUser && createdCompanies[0]) {
      await db
        .update(users)
        .set({ companyId: createdCompanies[0].id })
        .where(eq(users.email, "user@example.com"));
      console.log(`  ✅ Usuario user@example.com associado a: ${createdCompanies[0].name}`);
    }

    console.log("\n✅ Empresas criadas com sucesso!");
    console.log("\nAgora rode: bun run --filter=@mastertrack/api db:seed");
  } catch (error) {
    console.error("\n❌ Erro ao criar empresas:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedCompaniesScript();
