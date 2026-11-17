import {
  boolean,
  check,
  integer,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  numeric,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["admin", "warga"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const nasabah = pgTable(
  "nasabah",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    nama: varchar("nama", { length: 120 }).notNull(),
    alamat: text("alamat").notNull().default(""),
    noTelepon: varchar("no_telepon", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("nasabah_user_id_unique").on(table.userId),
    uniqueIndex("nasabah_no_telepon_unique").on(table.noTelepon),
  ],
);

export const jenisSampah = pgTable(
  "jenis_sampah",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nama: varchar("nama", { length: 100 }).notNull(),
    hargaPerKg: integer("harga_per_kg").notNull(),
    deskripsi: text("deskripsi").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("jenis_sampah_nama_unique").on(table.nama),
    check("jenis_sampah_harga_positive", sql`${table.hargaPerKg} > 0`),
  ],
);

export const setoran = pgTable(
  "setoran",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    idempotencyKey: uuid("idempotency_key").notNull(),
    nasabahId: uuid("nasabah_id").notNull().references(() => nasabah.id, { onDelete: "restrict" }),
    jenisSampahId: uuid("jenis_sampah_id").notNull().references(() => jenisSampah.id, { onDelete: "restrict" }),
    beratKg: numeric("berat_kg", { precision: 10, scale: 3, mode: "string" }).notNull(),
    hargaPerKg: integer("harga_per_kg").notNull(),
    nilaiRupiah: integer("nilai_rupiah").notNull(),
    dicatatOleh: uuid("dicatat_oleh").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("setoran_idempotency_unique").on(table.idempotencyKey),
    index("setoran_nasabah_created_idx").on(table.nasabahId, table.createdAt),
    index("setoran_created_idx").on(table.createdAt),
    index("setoran_jenis_idx").on(table.jenisSampahId),
    check("setoran_berat_positive", sql`${table.beratKg} > 0`),
    check("setoran_harga_positive", sql`${table.hargaPerKg} > 0`),
    check("setoran_nilai_positive", sql`${table.nilaiRupiah} > 0`),
  ],
);

export const penarikan = pgTable(
  "penarikan",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    idempotencyKey: uuid("idempotency_key").notNull(),
    nasabahId: uuid("nasabah_id").notNull().references(() => nasabah.id, { onDelete: "restrict" }),
    jumlahRupiah: integer("jumlah_rupiah").notNull(),
    keterangan: varchar("keterangan", { length: 240 }).notNull().default(""),
    dicatatOleh: uuid("dicatat_oleh").notNull().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("penarikan_idempotency_unique").on(table.idempotencyKey),
    index("penarikan_nasabah_created_idx").on(table.nasabahId, table.createdAt),
    index("penarikan_created_idx").on(table.createdAt),
    check("penarikan_jumlah_positive", sql`${table.jumlahRupiah} > 0`),
  ],
);
