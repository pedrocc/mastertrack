import postgres from "postgres";

const migrationSql = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sla_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL UNIQUE,
  sla_days INTEGER NOT NULL DEFAULT 3,
  label VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(100) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  last_message TEXT NOT NULL DEFAULT '',
  unread_count INTEGER NOT NULL DEFAULT 0,
  client_unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(100) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'aberta',
  data TEXT NOT NULL DEFAULT '{}',
  status_seen_by_client BOOLEAN NOT NULL DEFAULT TRUE,
  seen_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  author_id VARCHAR(100) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_requests_company_id ON requests(company_id);
CREATE INDEX IF NOT EXISTS idx_request_comments_request_id ON request_comments(request_id);

-- Add company_id column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Containers table
CREATE TABLE IF NOT EXISTS containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  number VARCHAR(20) NOT NULL,
  is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'a_embarcar',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  departure_date VARCHAR(20) NOT NULL,
  arrival_forecast VARCHAR(20) NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  route TEXT NOT NULL DEFAULT '[]',
  cargo VARCHAR(255) NOT NULL,
  weight VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_containers_company_id ON containers(company_id);
`;

// Usuarios do Supabase Auth para sincronizar
const supabaseAuthUsers = [
  {
    id: "a597392b-33b3-489e-8abc-a7adb113d2b8",
    email: "admin@mastertrack.com",
    name: "Admin",
    role: "admin",
  },
  {
    id: "ca399df7-310e-4ad6-bba3-00299a3effaf",
    email: "user@mastertrack.com",
    name: "User",
    role: "user",
  },
];

// Configuracoes de SLA iniciais
const initialSlaConfigs = [
  // Pre-Embarque
  {
    type: "pre_proforma",
    slaDays: 2,
    label: "Pre-Proforma",
    description: "Informacoes logisticas",
  },
  {
    type: "dados_importador",
    slaDays: 3,
    label: "Dados Importador",
    description: "Importer, Consignee e Notify",
  },
  {
    type: "schedule_proforma",
    slaDays: 2,
    label: "Schedule e Proforma",
    description: "Aprovacao de embarque",
  },
  // Documentos
  {
    type: "fichas_tecnicas",
    slaDays: 5,
    label: "Fichas Tecnicas",
    description: "Fichas e etiquetas",
  },
  { type: "drafts", slaDays: 3, label: "Drafts", description: "Solicitar drafts do contrato" },
  {
    type: "schedule_booking",
    slaDays: 2,
    label: "Schedule do Booking",
    description: "Dados do booking",
  },
  // Alteracoes
  {
    type: "alteracao_documento",
    slaDays: 2,
    label: "Alteracao de Documento",
    description: "Invoice, Packing List, etc.",
  },
  { type: "alteracao_bl", slaDays: 3, label: "Alteracao de BL", description: "Pode gerar custo" },
  // Liberacao
  { type: "telex_release", slaDays: 1, label: "Telex Release", description: "Liberacao de carga" },
  // Outros
  {
    type: "documento",
    slaDays: 3,
    label: "Solicitacao de Documento",
    description: "Documentos diversos",
  },
  {
    type: "embarque",
    slaDays: 5,
    label: "Acompanhamento de Embarque",
    description: "Tracking de embarque",
  },
  {
    type: "financeiro",
    slaDays: 3,
    label: "Solicitacao Financeira",
    description: "Questoes financeiras",
  },
];

// Empresas iniciais para seed
const initialCompanies = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Importadora Brasil Sul Ltda",
    cnpj: "12.345.678/0001-90",
    email: "contato@brasilsul.com.br",
    phone: "(47) 3333-4444",
    address: "Rua das Palmeiras, 500 - Itajai, SC",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Global Trading S.A.",
    cnpj: "98.765.432/0001-11",
    email: "comercial@globaltrading.com.br",
    phone: "(11) 5555-6666",
    address: "Av. Paulista, 1000 - Sao Paulo, SP",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Exporta Mais Comercio Exterior",
    cnpj: "55.666.777/0001-22",
    email: "logistica@exportamais.com.br",
    phone: "(21) 7777-8888",
    address: "Rua do Porto, 250 - Rio de Janeiro, RJ",
  },
];

// Seed containers for all companies
async function seedContainers(sql: ReturnType<typeof postgres>) {
  const containerNumbers = [
    "MSCU7234561",
    "MAEU9876543",
    "CMAU4567890",
    "OOLU1122334",
    "HLCU5544332",
  ];

  const origins = [
    "Shanghai, China",
    "Rotterdam, Holanda",
    "Busan, Coreia do Sul",
    "Hamburg, Alemanha",
    "Singapore",
  ];

  const destinations = [
    "Santos, Brasil",
    "Paranagua, Brasil",
    "Rio Grande, Brasil",
    "Itajai, Brasil",
    "Navegantes, Brasil",
  ];

  const cargos = [
    "Produtos Congelados",
    "Maquinario Industrial",
    "Frutos do Mar",
    "Pecas Automotivas",
    "Eletronicos",
  ];

  const statuses = ["a_embarcar", "embarcado", "em_transito", "entregue"];
  const paymentStatuses = ["ok", "pendente"];

  // Get all companies
  const companies = await sql`SELECT id, name FROM companies`;

  for (const company of companies) {
    const companyId = company["id"] as string;
    const companyName = company["name"] as string;

    // Check if company already has containers
    const existingContainers =
      await sql`SELECT COUNT(*) as count FROM containers WHERE company_id = ${companyId}`;
    if (Number(existingContainers[0]?.["count"]) > 0) {
      console.log(`  Company ${companyName} already has containers, skipping`);
      continue;
    }

    // Create 5 containers per company
    for (let i = 0; i < 5; i++) {
      const status = statuses[i % statuses.length] ?? "a_embarcar";
      const progress =
        status === "entregue"
          ? 100
          : status === "em_transito"
            ? 60
            : status === "embarcado"
              ? 25
              : 0;
      const origin = origins[i % origins.length] ?? "Shanghai, China";
      const destination = destinations[i % destinations.length] ?? "Santos, Brasil";
      const cargo = cargos[i % cargos.length] ?? "Produtos Diversos";
      const containerNumber = containerNumbers[i % containerNumbers.length] ?? `CONT${i}`;
      const paymentStatus = paymentStatuses[i % paymentStatuses.length] ?? "pendente";

      const route = JSON.stringify([
        {
          location: origin,
          lat: 31.2304,
          lng: 121.4737,
          date: "01/12/2024",
          status: progress > 0 ? "completed" : "pending",
        },
        {
          location: "Singapore",
          lat: 1.3521,
          lng: 103.8198,
          date: "15/12/2024",
          status: progress > 50 ? "completed" : progress > 0 ? "current" : "pending",
        },
        {
          location: destination,
          lat: -23.9608,
          lng: -46.3336,
          date: "15/01/2025",
          status: progress === 100 ? "completed" : "pending",
        },
      ]);

      await sql`
        INSERT INTO containers (
          company_id, number, is_frozen, status, payment_status,
          origin, destination, departure_date, arrival_forecast,
          progress, route, cargo, weight
        ) VALUES (
          ${companyId},
          ${containerNumber},
          ${i % 3 === 0},
          ${status},
          ${paymentStatus},
          ${origin},
          ${destination},
          ${`2024-${String(12 - i).padStart(2, "0")}-${String(1 + i * 5).padStart(2, "0")}`},
          ${`2025-${String(1 + i).padStart(2, "0")}-${String(10 + i * 3).padStart(2, "0")}`},
          ${progress},
          ${route},
          ${cargo},
          ${`${18 + i * 2}.${i} ton`}
        )
      `;
    }
    console.log(`  Created 5 containers for: ${companyName}`);
  }
}

async function migrate() {
  const databaseUrl = Bun.env["DATABASE_URL"];

  if (!databaseUrl) {
    console.error("DATABASE_URL not set, skipping migrations");
    process.exit(0);
  }

  console.log("=== Starting database migrations ===");

  const sql = postgres(databaseUrl, {
    connect_timeout: 30,
    idle_timeout: 20,
  });

  try {
    // Run schema migrations
    await sql.unsafe(migrationSql);
    console.log("Schema migrations completed");

    // Sync Supabase Auth users
    console.log("Syncing Supabase Auth users...");
    for (const user of supabaseAuthUsers) {
      const exists = await sql`SELECT id FROM users WHERE id = ${user.id}`;
      if (exists.length === 0) {
        await sql`
          INSERT INTO users (id, email, name, role)
          VALUES (${user.id}, ${user.email}, ${user.name}, ${user.role})
        `;
        console.log(`  Created user: ${user.email}`);
      } else {
        // Update existing user to ensure sync
        await sql`
          UPDATE users
          SET email = ${user.email}, name = ${user.name}, role = ${user.role}
          WHERE id = ${user.id}
        `;
        console.log(`  Updated user: ${user.email}`);
      }
    }

    // Seed SLA configs
    console.log("Seeding SLA configs...");
    for (const sla of initialSlaConfigs) {
      const exists = await sql`SELECT id FROM sla_configs WHERE type = ${sla.type}`;
      if (exists.length === 0) {
        await sql`
          INSERT INTO sla_configs (type, sla_days, label, description)
          VALUES (${sla.type}, ${sla.slaDays}, ${sla.label}, ${sla.description})
        `;
        console.log(`  Created SLA config: ${sla.label} (${sla.slaDays} dias)`);
      } else {
        console.log(`  SLA config already exists: ${sla.label}`);
      }
    }

    // Seed initial companies
    console.log("Seeding initial companies...");
    for (const company of initialCompanies) {
      const exists = await sql`SELECT id FROM companies WHERE id = ${company.id}`;
      if (exists.length === 0) {
        await sql`
          INSERT INTO companies (id, name, cnpj, email, phone, address)
          VALUES (${company.id}, ${company.name}, ${company.cnpj}, ${company.email}, ${company.phone}, ${company.address})
        `;
        console.log(`  Created company: ${company.name}`);
      } else {
        console.log(`  Company already exists: ${company.name}`);
      }
    }

    // Associate user@mastertrack.com with Importadora Brasil Sul Ltda
    console.log("Associating user with company...");
    const userId = "ca399df7-310e-4ad6-bba3-00299a3effaf";
    const companyId = "11111111-1111-1111-1111-111111111111";
    await sql`UPDATE users SET company_id = ${companyId} WHERE id = ${userId}`;
    console.log("  Associated user@mastertrack.com with Importadora Brasil Sul Ltda");

    // Seed containers for companies
    console.log("Seeding containers...");
    await seedContainers(sql);

    console.log("=== Migrations completed successfully ===");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sql.end();
  }
}

migrate();
