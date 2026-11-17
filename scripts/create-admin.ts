import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Buffer } from "node:buffer";
import { StringDecoder } from "node:string_decoder";
import { config } from "dotenv";
import { hash } from "bcryptjs";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../src/db/schema";
import { users } from "../src/db/schema";

config({ path: [".env.local", ".env"] });

async function askSecret(prompt: string) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Perintah ini membutuhkan terminal interaktif agar kata sandi dapat dimasukkan dengan aman.");
  }
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise<string>((resolve, reject) => {
    let value = "";
    const decoder = new StringDecoder("utf8");
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
    };
    const onData = (chunk: Buffer) => {
      for (const key of decoder.write(chunk)) {
        if (key === "\u0003") {
          cleanup();
          stdout.write("\n");
          reject(new Error("Pembuatan admin dibatalkan."));
          return;
        } else if (key === "\r" || key === "\n") {
          cleanup();
          stdout.write("\n");
          resolve(value);
          return;
        } else if (key === "\u007f" || key === "\b") {
          const chars = [...value];
          if (chars.length > 0) {
            chars.pop();
            value = chars.join("");
            stdout.write("\b \b");
          }
        } else if (key >= " ") {
          value += key;
          stdout.write("*");
        }
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL_UNPOOLED atau DATABASE_URL harus diatur sebelum membuat admin.");
  }

  const terminal = createInterface({ input: stdin, output: stdout });
  let pool: Pool | undefined;
  try {
    const name = (await terminal.question("Nama admin: ")).trim();
    const email = (await terminal.question("Email admin: ")).trim().toLowerCase();
    const parsed = z.object({
      name: z.string().min(2).max(120),
      email: z.email().max(255),
    }).safeParse({ name, email });
    if (!parsed.success) throw new Error("Nama atau email tidak valid.");

    terminal.close();
    const password = await askSecret("Kata sandi admin (minimal 12 karakter, input disamarkan): ");
    const confirmation = await askSecret("Ulangi kata sandi admin: ");
    if (password !== confirmation) throw new Error("Kedua kata sandi tidak sama.");
    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
      throw new Error("Kata sandi harus memiliki panjang 12–72 byte UTF-8.");
    }

    pool = new Pool({ connectionString, max: 1 });
    const db = drizzle(pool, { schema });
    const passwordHash = await hash(password, 12);
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(834738923142)`);
      const [existingAdmin] = await tx.select({ id: users.id }).from(users)
        .where(eq(users.role, "admin")).limit(1);
      if (existingAdmin) throw new Error("Admin sudah ada. Prosedur pembuatan admin pertama hanya dapat digunakan sekali.");
      await tx.insert(users).values({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: "admin",
      });
    });
    stdout.write(`Admin ${parsed.data.email} berhasil dibuat.\n`);
  } finally {
    terminal.close();
    if (pool) await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat admin.";
  console.error(message);
  process.exitCode = 1;
});
