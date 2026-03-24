import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url =
  process.env.DATABASE_URL ??
  process.env.NEONDB_CONN ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
  strict: true,
  verbose: true,
});
