import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

const migrationUrl = process.env.DATABASE_URL_UNPOOLED;
if (!migrationUrl) {
  throw new Error("DATABASE_URL_UNPOOLED harus diatur untuk menjalankan migrasi Drizzle.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
  strict: true,
  verbose: true,
});
