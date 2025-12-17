#!/usr/bin/env bun
/**
 * Script para executar drizzle-kit push sem confirmacoes interativas
 * - Usa 'yes' para auto-confirmar todas as perguntas
 * - Carrega .env da raiz automaticamente
 */

import { $ } from "bun";

async function main() {
  console.log("🗄️  Executando drizzle-kit push...\n");

  try {
    // Usar 'yes' para auto-confirmar todas as perguntas do drizzle-kit
    // O 'yes' envia "y\n" continuamente para stdin
    await $`yes | bun --env-file=../../.env x drizzle-kit push --force`.cwd("packages/api");

    console.log("\n✅ Schema sincronizado com sucesso!");
  } catch (error) {
    // drizzle-kit pode retornar exit code != 0 mesmo quando funciona
    // porque o 'yes' continua enviando após o comando terminar
    // Verificamos se foi erro real ou apenas o pipe quebrado
    const err = error as { exitCode?: number; stderr?: Buffer };

    if (err.exitCode === 141 || err.exitCode === 0) {
      // SIGPIPE (141) é esperado quando 'yes' é terminado
      console.log("\n✅ Schema sincronizado com sucesso!");
    } else {
      console.error("\n❌ Erro ao sincronizar schema:");
      console.error(err.stderr?.toString() || error);
      process.exit(1);
    }
  }
}

main();
