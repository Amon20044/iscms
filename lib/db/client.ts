import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@/lib/db/schema";

const connectionString =
  process.env.DATABASE_URL ?? process.env.NEONDB_CONN ?? null;

neonConfig.webSocketConstructor = ws;

const pool = connectionString ? new Pool({ connectionString }) : null;
const db = pool ? drizzle({ client: pool, schema }) : null;

export function isDatabaseConfigured() {
  return Boolean(connectionString);
}

export function getDb() {
  if (!db) {
    throw new Error(
      "DATABASE_URL or NEONDB_CONN must be configured before using the Neon backend."
    );
  }

  return db;
}
