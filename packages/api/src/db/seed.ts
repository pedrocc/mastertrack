import { sql } from "drizzle-orm";
import { db } from "./index";
import type { NewChatMessage, NewContainer, NewConversation, NewSlaConfig } from "./schema";
import { chatMessages, companies, containers, conversations, slaConfigs, users } from "./schema";

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

// Conversas de exemplo (sem ID, será gerado automaticamente)
const seedConversations: NewConversation[] = [
  {
    companyId: "company-1",
    companyName: "Importadora Brasil Sul Ltda",
    userId: "user-1",
    userName: "Joao Silva",
    status: "open",
    lastMessage: "Olá, preciso de ajuda com minha requisição",
    unreadCount: 1,
    clientUnreadCount: 0, // cliente nao tem mensagens nao lidas
  },
];

const seedSlaConfigs: NewSlaConfig[] = [
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
  {
    type: "drafts",
    slaDays: 3,
    label: "Drafts",
    description: "Solicitar drafts do contrato",
  },
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
  {
    type: "alteracao_bl",
    slaDays: 3,
    label: "Alteracao de BL",
    description: "Pode gerar custo",
  },
  // Liberacao
  {
    type: "telex_release",
    slaDays: 1,
    label: "Telex Release",
    description: "Liberacao de carga",
  },
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

// Function to generate container data for a company
function generateContainersForCompany(companyId: string): NewContainer[] {
  const containerNumbers = [
    "MSCU7234561",
    "MAEU9876543",
    "CMAU4567890",
    "OOLU1122334",
    "HLCU5544332",
    "EISU7788990",
    "TCKU3344556",
  ];

  const origins = [
    "Shanghai, China",
    "Rotterdam, Holanda",
    "Busan, Coreia do Sul",
    "Hamburg, Alemanha",
    "Los Angeles, EUA",
    "Yokohama, Japao",
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
    "Produtos Refrigerados",
    "Texteis",
  ];

  const statuses = ["a_embarcar", "embarcado", "em_transito", "entregue"] as const;
  const paymentStatuses = ["ok", "pendente"] as const;

  const containersData: NewContainer[] = [];

  // Generate 5 containers per company
  for (let i = 0; i < 5; i++) {
    const statusIndex = i % statuses.length;
    const status = statuses[statusIndex] ?? "a_embarcar";
    const progress =
      status === "entregue"
        ? 100
        : status === "em_transito"
          ? 50 + i * 10
          : status === "embarcado"
            ? 20 + i * 5
            : 0;

    const originIndex = (i + Math.floor(Math.random() * 3)) % origins.length;
    const destIndex = i % destinations.length;
    const cargoIndex = i % cargos.length;
    const originStr = origins[originIndex] ?? "Shanghai, China";
    const destStr = destinations[destIndex] ?? "Santos, Brasil";

    // Generate route based on status
    const route = generateRoute(originStr, destStr, status, progress);

    containersData.push({
      companyId,
      number: containerNumbers[i % containerNumbers.length] ?? `CONT${Date.now()}${i}`,
      isFrozen: i % 3 === 0,
      status,
      paymentStatus: paymentStatuses[i % 2] ?? "pendente",
      origin: originStr,
      destination: destStr,
      departureDate: `2024-${String(12 - i).padStart(2, "0")}-${String(1 + i * 5).padStart(2, "0")}`,
      arrivalForecast: `2025-${String(1 + i).padStart(2, "0")}-${String(10 + i * 3).padStart(2, "0")}`,
      progress,
      route: JSON.stringify(route),
      cargo: cargos[cargoIndex] ?? "Produtos Diversos",
      weight: `${18 + i * 2}.${i} ton`,
    });
  }

  return containersData;
}

// Generate route points for a container
function generateRoute(origin: string, destination: string, status: string, progress: number) {
  const portCoords: Record<string, { lat: number; lng: number }> = {
    Shanghai: { lat: 31.2304, lng: 121.4737 },
    Singapore: { lat: 1.3521, lng: 103.8198 },
    Rotterdam: { lat: 51.9244, lng: 4.4777 },
    Santos: { lat: -23.9608, lng: -46.3336 },
    Paranagua: { lat: -25.5163, lng: -48.5225 },
    Itajai: { lat: -26.9078, lng: -48.6619 },
    Navegantes: { lat: -26.8986, lng: -48.6544 },
    "Rio Grande": { lat: -32.0353, lng: -52.0986 },
    Busan: { lat: 35.1796, lng: 129.0756 },
    Hamburg: { lat: 53.5511, lng: 9.9937 },
    "Los Angeles": { lat: 33.7501, lng: -118.2197 },
    Yokohama: { lat: 35.4437, lng: 139.638 },
    "Hong Kong": { lat: 22.3193, lng: 114.1694 },
    "Cape Town": { lat: -33.9249, lng: 18.4241 },
    Lisboa: { lat: 38.7223, lng: -9.1393 },
    Panama: { lat: 9.08, lng: -79.68 },
  };

  const getCoords = (location: string) => {
    for (const [port, coords] of Object.entries(portCoords)) {
      if (location.toLowerCase().includes(port.toLowerCase())) {
        return coords;
      }
    }
    return { lat: 0, lng: 0 };
  };

  const originCoords = getCoords(origin);
  const destCoords = getCoords(destination);

  // Simple route with origin, optional midpoint, and destination
  const midpoints = ["Singapore", "Cape Town", "Lisboa", "Panama", "Hong Kong"];
  const midpoint = midpoints[Math.floor(Math.random() * midpoints.length)] ?? "Singapore";
  const midCoords = portCoords[midpoint] ?? { lat: 0, lng: 0 };

  type RoutePointStatus = "completed" | "current" | "pending";
  const getStatus = (index: number): RoutePointStatus => {
    if (status === "entregue") return "completed";
    if (status === "a_embarcar") return "pending";
    if (progress > 66 && index < 3) return "completed";
    if (progress > 33 && index < 2) return "completed";
    if (index === 0) return "completed";
    if (status === "em_transito" && index === 1) return "current";
    if (status === "embarcado" && index === 0) return "current";
    return "pending";
  };

  return [
    { location: origin, ...originCoords, date: "01/12/2024", status: getStatus(0) },
    { location: midpoint, ...midCoords, date: "15/12/2024", status: getStatus(1) },
    { location: destination, ...destCoords, date: "15/01/2025", status: getStatus(2) },
  ];
}

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

      // Limpar tabelas (ordem importa por causa das foreign keys)
      await db.delete(chatMessages);
      console.log("  🗑️  Tabela chat_messages limpa");
      await db.delete(conversations);
      console.log("  🗑️  Tabela conversations limpa");
      await db.delete(containers);
      console.log("  🗑️  Tabela containers limpa");
      await db.delete(users);
      console.log("  🗑️  Tabela users limpa");
      await db.delete(slaConfigs);
      console.log("  🗑️  Tabela sla_configs limpa");

      // Reabilitar verificacao de foreign keys
      await db.execute(sql`SET session_replication_role = 'origin'`);
      console.log("");
    }

    // Inserir usuarios
    for (const user of seedUsers) {
      await db.insert(users).values(user).onConflictDoNothing({ target: users.email });
      console.log(`  ✅ Usuario: ${user.email}`);
    }

    console.log("");

    // Inserir configuracoes de SLA
    for (const config of seedSlaConfigs) {
      await db.insert(slaConfigs).values(config).onConflictDoNothing({ target: slaConfigs.type });
      console.log(`  ✅ SLA Config: ${config.label} (${config.slaDays} dias)`);
    }

    console.log("");

    // Inserir conversas e mensagens de exemplo
    for (const conv of seedConversations) {
      // Verificar se já existe conversa para esta empresa
      const existing = await db.query.conversations.findFirst({
        where: (c, { eq }) => eq(c.companyId, conv.companyId),
      });

      if (!existing) {
        const [newConv] = await db.insert(conversations).values(conv).returning();
        if (!newConv) {
          console.log(`  ❌ Erro ao criar conversa: ${conv.companyName}`);
          continue;
        }
        console.log(`  ✅ Conversa: ${conv.companyName}`);

        // Inserir mensagem de exemplo
        const seedMessage: NewChatMessage = {
          conversationId: newConv.id,
          senderId: conv.userId,
          senderName: conv.userName,
          senderRole: "client",
          content: "Olá, preciso de ajuda com minha requisição",
          read: false,
        };
        await db.insert(chatMessages).values(seedMessage);
        console.log(`  ✅ Mensagem: ${seedMessage.content.substring(0, 30)}...`);
      } else {
        console.log(`  ⏭️  Conversa ja existe: ${conv.companyName}`);
      }
    }

    // Inserir containers para cada empresa
    console.log("\n📦 Populando containers...");
    const allCompanies = await db.select().from(companies);

    if (allCompanies.length === 0) {
      console.log("  ⚠️  Nenhuma empresa encontrada. Crie empresas primeiro.");
    } else {
      for (const company of allCompanies) {
        // Verificar se empresa ja tem containers
        const existingContainers = await db.query.containers.findMany({
          where: (c, { eq }) => eq(c.companyId, company.id),
        });

        if (existingContainers.length > 0 && !forceMode) {
          console.log(
            `  ⏭️  Empresa ${company.name} ja tem ${existingContainers.length} containers`
          );
          continue;
        }

        // Gerar e inserir containers para esta empresa
        const containersData = generateContainersForCompany(company.id);
        for (const containerData of containersData) {
          await db.insert(containers).values(containerData);
        }
        console.log(`  ✅ ${containersData.length} containers criados para: ${company.name}`);
      }
    }

    console.log("\n✅ Seed completed successfully!");
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
