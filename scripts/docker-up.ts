#!/usr/bin/env bun
/**
 * Script inteligente para subir containers Docker
 * - Verifica se as portas padrao estao em uso
 * - Encontra portas alternativas automaticamente
 * - Atualiza o .env e sobe os containers
 */

import { $ } from "bun";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";

const DEFAULT_POSTGRES_PORT = 5432;
const DEFAULT_REDIS_PORT = 6379;
const ENV_FILE = ".env";

interface PortConfig {
  postgres: number;
  redis: number;
}

/**
 * Verifica se uma porta esta disponivel
 */
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port, "0.0.0.0");
  });
}

/**
 * Encontra uma porta disponivel a partir de uma porta base
 */
async function findAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`Nao foi possivel encontrar porta disponivel a partir de ${startPort}`);
}

/**
 * Le as portas configuradas no .env ou retorna os padroes
 */
function readEnvPorts(): PortConfig {
  if (!existsSync(ENV_FILE)) {
    return {
      postgres: DEFAULT_POSTGRES_PORT,
      redis: DEFAULT_REDIS_PORT,
    };
  }

  const envContent = readFileSync(ENV_FILE, "utf-8");
  const postgresMatch = envContent.match(/POSTGRES_PORT=(\d+)/);
  const redisMatch = envContent.match(/REDIS_PORT=(\d+)/);

  return {
    postgres: postgresMatch ? Number.parseInt(postgresMatch[1], 10) : DEFAULT_POSTGRES_PORT,
    redis: redisMatch ? Number.parseInt(redisMatch[1], 10) : DEFAULT_REDIS_PORT,
  };
}

/**
 * Atualiza ou adiciona uma variavel no .env
 */
function updateEnvVar(key: string, value: string): void {
  let envContent = "";

  if (existsSync(ENV_FILE)) {
    envContent = readFileSync(ENV_FILE, "utf-8");
  }

  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    const prefix = envContent ? `${envContent.trim()}\n` : "";
    envContent = `${prefix}${key}=${value}\n`;
  }

  writeFileSync(ENV_FILE, envContent);
}

/**
 * Verifica se os containers ja estao rodando
 */
async function areContainersRunning(): Promise<boolean> {
  try {
    const result = await $`docker compose ps --format json`.quiet();
    const output = result.stdout.toString().trim();
    return output.length > 0 && output !== "[]";
  } catch {
    return false;
  }
}

/**
 * Obtem informacoes sobre o que esta usando uma porta
 */
async function getPortUser(port: number): Promise<string> {
  try {
    const result = await $`lsof -i :${port} -P -n | head -2`.quiet();
    const lines = result.stdout.toString().trim().split("\n");
    if (lines.length > 1) {
      const parts = lines[1]?.split(/\s+/);
      return parts?.[0] ?? "processo desconhecido";
    }
    return "processo desconhecido";
  } catch {
    return "processo desconhecido";
  }
}

async function main() {
  console.log("🐳 Iniciando Docker Compose...\n");

  // Verificar se os containers ja estao rodando
  if (await areContainersRunning()) {
    console.log("✅ Containers ja estao rodando!");
    await $`docker compose ps`;
    return;
  }

  const currentPorts = readEnvPorts();
  const finalPorts: PortConfig = { ...currentPorts };
  let portsChanged = false;

  // Verificar porta do PostgreSQL
  console.log(`📊 Verificando porta PostgreSQL (${currentPorts.postgres})...`);
  if (!(await isPortAvailable(currentPorts.postgres))) {
    const user = await getPortUser(currentPorts.postgres);
    console.log(`   ⚠️  Porta ${currentPorts.postgres} em uso por: ${user}`);

    const newPort = await findAvailablePort(DEFAULT_POSTGRES_PORT);
    finalPorts.postgres = newPort;
    portsChanged = true;
    console.log(`   ✅ Usando porta alternativa: ${newPort}`);
  } else {
    console.log(`   ✅ Porta ${currentPorts.postgres} disponivel`);
  }

  // Verificar porta do Redis
  console.log(`📊 Verificando porta Redis (${currentPorts.redis})...`);
  if (!(await isPortAvailable(currentPorts.redis))) {
    const user = await getPortUser(currentPorts.redis);
    console.log(`   ⚠️  Porta ${currentPorts.redis} em uso por: ${user}`);

    const newPort = await findAvailablePort(DEFAULT_REDIS_PORT);
    finalPorts.redis = newPort;
    portsChanged = true;
    console.log(`   ✅ Usando porta alternativa: ${newPort}`);
  } else {
    console.log(`   ✅ Porta ${currentPorts.redis} disponivel`);
  }

  // Atualizar .env se necessario
  if (portsChanged) {
    console.log("\n📝 Atualizando .env com novas portas...");
    updateEnvVar("POSTGRES_PORT", String(finalPorts.postgres));
    updateEnvVar("REDIS_PORT", String(finalPorts.redis));

    // Atualizar DATABASE_URL se PostgreSQL mudou
    if (finalPorts.postgres !== DEFAULT_POSTGRES_PORT) {
      const dbUrl = `postgresql://postgres:postgres@localhost:${finalPorts.postgres}/app_dev`;
      updateEnvVar("DATABASE_URL", dbUrl);
      console.log(`   DATABASE_URL atualizada para usar porta ${finalPorts.postgres}`);
    }
  }

  // Subir containers
  console.log("\n🚀 Subindo containers...\n");

  try {
    await $`docker compose up -d`;

    console.log("\n✅ Containers iniciados com sucesso!\n");
    console.log("📌 Configuracao:");
    console.log(`   PostgreSQL: localhost:${finalPorts.postgres}`);
    console.log(`   Redis:      localhost:${finalPorts.redis}`);

    if (finalPorts.postgres !== DEFAULT_POSTGRES_PORT) {
      console.log(`\n⚠️  ATENCAO: PostgreSQL usando porta nao-padrao (${finalPorts.postgres})`);
      console.log("   Certifique-se de que DATABASE_URL no .env esta correto:");
      console.log(
        `   DATABASE_URL=postgresql://postgres:postgres@localhost:${finalPorts.postgres}/app_dev`
      );
    }

    // Aguardar containers ficarem saudaveis
    console.log("\n⏳ Aguardando containers ficarem saudaveis...");
    await $`docker compose ps`;
  } catch (error) {
    console.error("\n❌ Erro ao subir containers:");
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);
