import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

let pool: Pool | undefined;

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur. Hubungkan database Neon terlebih dahulu.");
  }
  pool ??= new Pool({ connectionString, max: 5 });
  return drizzle(pool, { schema });
}
