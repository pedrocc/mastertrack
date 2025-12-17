import { sql } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";

const seedUsers = [
  {
    email: "admin@example.com",
    name: "Administrador",
    role: "admin",
  },
  {
    email: "user@example.com",
    name: "Usuario Teste",
    role: "user",
  },
  {
    email: "guest@example.com",
    name: "Visitante",
    role: "guest",
  },
];

// Verificar se flag --force foi passada
const forceMode = process.argv.includes("--force");

async function seed() {
  console.log("🌱 Seeding database...");

  if (forceMode) {
    console.log("⚠️  Modo --force: limpando tabelas antes de popular...\n");
  }

  try {
    // Em modo force, limpar tabelas primeiro
    if (forceMode) {
      // Desabilitar verificacao de foreign keys temporariamente
      await db.execute(sql`SET session_replication_role = 'replica'`);

      // Limpar tabela de usuarios
      await db.delete(users);
      console.log("  🗑️  Tabela users limpa");

      // Reabilitar verificacao de foreign keys
      await db.execute(sql`SET session_replication_role = 'origin'`);
      console.log("");
    }

    // Inserir usuarios
    for (const user of seedUsers) {
      await db.insert(users).values(user).onConflictDoNothing({ target: users.email });
      console.log(`  ✅ Usuario: ${user.email}`);
    }

    console.log("\n✅ Seed completed successfully!");
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
