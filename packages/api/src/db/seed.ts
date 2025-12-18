import { sql } from "drizzle-orm";
import { db } from "./index";
import type { NewChatMessage, NewConversation, NewSlaConfig } from "./schema";
import { chatMessages, conversations, slaConfigs, users } from "./schema";

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

    console.log("\n✅ Seed completed successfully!");
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
