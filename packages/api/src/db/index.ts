import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  Bun.env["DATABASE_URL"] ?? "postgresql://postgres:postgres@localhost:5432/app_dev";

// Connection pool
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Drizzle instance with schema
export const db = drizzle(client, { schema });

// Export schema for queries
export { schema };

// Health check for database
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
