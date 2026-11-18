"use server";

import { hash } from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { jenisSampah, nasabah, penarikan, setoran, users } from "@/db/schema";
import { requireAdmin } from "@/lib/authorization";
import { calculateDepositValue, formatWeightMilli, parseWeightMilli } from "@/lib/money";

function goBack(path: string, key: "error" | "sukses", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function uniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

class ActionError extends Error {}

function inputString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function inputPassword(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function passwordWithinLimit(password: string) {
  return Buffer.byteLength(password, "utf8") <= 72;
}

export async function createNasabah(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({
    nama: z.string().trim().min(2).max(120),
    email: z.email().max(255),
    noTelepon: z.string().trim().max(20),
    alamat: z.string().trim().max(1000),
    password: z.string().min(8).max(72),
  }).safeParse({
    nama: inputString(formData, "nama"),
    email: inputString(formData, "email").toLowerCase(),
    noTelepon: inputString(formData, "noTelepon"),
    alamat: inputString(formData, "alamat"),
    password: inputPassword(formData, "password"),
  });
  if (!parsed.success || !passwordWithinLimit(parsed.data.password)) {
    goBack("/nasabah", "error", "Periksa kembali data. Kata sandi harus minimal 8 karakter dan maksimal 72 byte UTF-8.");
  }

  const data = parsed.data;
  const passwordHash = await hash(data.password, 12);
  try {
    await getDb().transaction(async (tx) => {
      const [user] = await tx.insert(users).values({
        name: data.nama,
        email: data.email,
        passwordHash,
        role: "warga",
      }).returning({ id: users.id });
      await tx.insert(nasabah).values({
        userId: user.id,
        nama: data.nama,
        noTelepon: data.noTelepon || null,
        alamat: data.alamat,
      });
    });
  } catch (error) {
    if (uniqueViolation(error)) goBack("/nasabah", "error", "Email atau nomor telepon sudah terdaftar.");
    throw error;
  }
  revalidatePath("/nasabah");
  goBack("/nasabah", "sukses", "Nasabah dan akun login berhasil dibuat.");
}

export async function updateNasabah(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({
    id: z.uuid(),
    nama: z.string().trim().min(2).max(120),
    email: z.email().max(255),
    noTelepon: z.string().trim().max(20),
    alamat: z.string().trim().max(1000),
    password: z.union([z.literal(""), z.string().min(8).max(72)]),
  }).safeParse({
    id: inputString(formData, "id"),
    nama: inputString(formData, "nama"),
    email: inputString(formData, "email").toLowerCase(),
    noTelepon: inputString(formData, "noTelepon"),
    alamat: inputString(formData, "alamat"),
    password: inputPassword(formData, "password"),
  });
  const returnPath = `/nasabah?edit=${encodeURIComponent(inputString(formData, "id"))}`;
  if (!parsed.success || (parsed.data.password && !passwordWithinLimit(parsed.data.password))) {
    goBack(returnPath, "error", "Data tidak valid. Kata sandi baru, jika diisi, harus minimal 8 karakter dan maksimal 72 byte UTF-8.");
  }

  const data = parsed.data;
  const passwordHash = data.password ? await hash(data.password, 12) : undefined;
  try {
    await getDb().transaction(async (tx) => {
      const [profile] = await tx.select({ userId: nasabah.userId }).from(nasabah)
        .where(eq(nasabah.id, data.id)).limit(1);
      if (!profile) throw new Error("Nasabah tidak ditemukan.");
      await tx.update(nasabah).set({
        nama: data.nama,
        noTelepon: data.noTelepon || null,
        alamat: data.alamat,
      }).where(eq(nasabah.id, data.id));
      await tx.update(users).set({
        name: data.nama,
        email: data.email,
        ...(passwordHash ? { passwordHash } : {}),
      }).where(eq(users.id, profile.userId));
    });
  } catch (error) {
    if (uniqueViolation(error)) goBack(returnPath, "error", "Email atau nomor telepon sudah digunakan.");
    throw error;
  }
  revalidatePath("/nasabah");
  revalidatePath("/dashboard");
  goBack("/nasabah", "sukses", "Data nasabah berhasil diperbarui.");
}

export async function setNasabahActive(formData: FormData) {
  await requireAdmin();
  const id = inputString(formData, "id");
  const activeValue = inputString(formData, "active");
  if (!z.uuid().safeParse(id).success || !["true", "false"].includes(activeValue)) {
    goBack("/nasabah", "error", "Nasabah atau status akun tidak valid.");
  }
  const active = activeValue === "true";
  const [profile] = await getDb().select({ userId: nasabah.userId }).from(nasabah)
    .where(eq(nasabah.id, id)).limit(1);
  if (!profile) goBack("/nasabah", "error", "Nasabah tidak ditemukan.");
  await getDb().update(users).set({ isActive: active }).where(eq(users.id, profile.userId));
  revalidatePath("/nasabah");
  revalidatePath("/dashboard");
  goBack("/nasabah", "sukses", active ? "Akun nasabah diaktifkan." : "Akun dinonaktifkan. Histori transaksi tetap tersimpan.");
}

export async function createWasteType(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({
    nama: z.string().trim().min(2).max(100),
    hargaPerKg: z.coerce.number().int().positive().max(2_000_000_000),
    deskripsi: z.string().trim().max(500),
  }).safeParse({
    nama: inputString(formData, "nama"),
    hargaPerKg: inputString(formData, "hargaPerKg"),
    deskripsi: inputString(formData, "deskripsi"),
  });
  if (!parsed.success) goBack("/jenis-sampah", "error", "Nama dan harga per kg wajib valid.");
  try {
    await getDb().insert(jenisSampah).values(parsed.data);
  } catch (error) {
    if (uniqueViolation(error)) goBack("/jenis-sampah", "error", "Jenis sampah dengan nama tersebut sudah ada.");
    throw error;
  }
  revalidatePath("/jenis-sampah");
  revalidatePath("/setoran");
  goBack("/jenis-sampah", "sukses", "Jenis sampah berhasil ditambahkan.");
}

export async function updateWasteType(formData: FormData) {
  await requireAdmin();
  const id = inputString(formData, "id");
  const parsed = z.object({
    nama: z.string().trim().min(2).max(100),
    hargaPerKg: z.coerce.number().int().positive().max(2_000_000_000),
    deskripsi: z.string().trim().max(500),
  }).safeParse({
    nama: inputString(formData, "nama"),
    hargaPerKg: inputString(formData, "hargaPerKg"),
    deskripsi: inputString(formData, "deskripsi"),
  });
  const returnPath = `/jenis-sampah?edit=${encodeURIComponent(id)}`;
  if (!z.uuid().safeParse(id).success || !parsed.success) goBack(returnPath, "error", "Data jenis sampah tidak valid.");
  try {
    const [updated] = await getDb().update(jenisSampah).set(parsed.data)
      .where(eq(jenisSampah.id, id)).returning({ id: jenisSampah.id });
    if (!updated) goBack("/jenis-sampah", "error", "Jenis sampah tidak ditemukan.");
  } catch (error) {
    if (uniqueViolation(error)) goBack(returnPath, "error", "Nama jenis sampah sudah digunakan.");
    throw error;
  }
  revalidatePath("/jenis-sampah");
  revalidatePath("/setoran");
  goBack("/jenis-sampah", "sukses", "Jenis sampah dan harga terbaru berhasil diperbarui.");
}

export async function setWasteTypeActive(formData: FormData) {
  await requireAdmin();
  const id = inputString(formData, "id");
  const activeValue = inputString(formData, "active");
  if (!z.uuid().safeParse(id).success || !["true", "false"].includes(activeValue)) {
    goBack("/jenis-sampah", "error", "Jenis sampah atau status tidak valid.");
  }
  const active = activeValue === "true";
  const [updated] = await getDb().update(jenisSampah).set({ isActive: active })
    .where(eq(jenisSampah.id, id)).returning({ id: jenisSampah.id });
  if (!updated) goBack("/jenis-sampah", "error", "Jenis sampah tidak ditemukan.");
  revalidatePath("/jenis-sampah");
  revalidatePath("/setoran");
  goBack("/jenis-sampah", "sukses", active ? "Jenis sampah diaktifkan." : "Jenis sampah dinonaktifkan.");
}

export async function createDeposit(formData: FormData) {
  const actor = await requireAdmin();
  const idempotencyKey = inputString(formData, "idempotencyKey");
  const nasabahId = inputString(formData, "nasabahId");
  const jenisSampahId = inputString(formData, "jenisSampahId");
  const weightMilli = parseWeightMilli(inputString(formData, "beratKg"));
  const returnPath = "/setoran";
  if (!z.uuid().safeParse(idempotencyKey).success || !z.uuid().safeParse(nasabahId).success ||
      !z.uuid().safeParse(jenisSampahId).success || weightMilli === null) {
    goBack(returnPath, "error", "Pilih nasabah dan jenis sampah; berat harus lebih dari 0 dengan maksimal 3 angka desimal.");
  }

  let inserted: boolean;
  try {
    inserted = await getDb().transaction(async (tx) => {
      const [existing] = await tx.select({ id: setoran.id }).from(setoran)
        .where(eq(setoran.idempotencyKey, idempotencyKey)).limit(1);
      if (existing) return false;
      const [resident] = await tx.select({ id: nasabah.id, userId: nasabah.userId }).from(nasabah)
        .where(eq(nasabah.id, nasabahId)).for("update").limit(1);
      if (!resident) throw new ActionError("Nasabah tidak ditemukan.");
      const [account] = await tx.select({ isActive: users.isActive }).from(users)
        .where(eq(users.id, resident.userId)).for("share").limit(1);
      if (!account?.isActive) throw new ActionError("Akun nasabah tidak aktif.");
      const [waste] = await tx.select({
        id: jenisSampah.id,
        price: jenisSampah.hargaPerKg,
      }).from(jenisSampah).where(and(eq(jenisSampah.id, jenisSampahId), eq(jenisSampah.isActive, true)))
        .for("share").limit(1);
      if (!waste) throw new ActionError("Jenis sampah tidak ditemukan atau tidak aktif.");
      let value: number;
      try {
        value = calculateDepositValue(weightMilli, waste.price);
      } catch (error) {
        if (error instanceof Error) throw new ActionError(error.message);
        throw error;
      }
      const result = await tx.insert(setoran).values({
        idempotencyKey,
        nasabahId,
        jenisSampahId,
        beratKg: formatWeightMilli(weightMilli),
        hargaPerKg: waste.price,
        nilaiRupiah: value,
        dicatatOleh: actor.id,
      }).onConflictDoNothing({ target: setoran.idempotencyKey }).returning({ id: setoran.id });
      return result.length > 0;
    });
  } catch (error) {
    if (error instanceof ActionError) {
      goBack(returnPath, "error", error.message);
    }
    if (uniqueViolation(error)) goBack(returnPath, "sukses", "Setoran ini sudah tercatat; saldo tidak ditambahkan ulang.");
    throw error;
  }
  if (!inserted) goBack(returnPath, "sukses", "Setoran ini sudah tercatat; saldo tidak ditambahkan ulang.");
  revalidatePath("/setoran");
  revalidatePath("/dashboard");
  revalidatePath("/warga/dashboard");
  revalidatePath("/warga/riwayat");
  goBack(returnPath, "sukses", "Setoran berhasil dicatat dan saldo nasabah diperbarui.");
}

export async function createWithdrawal(formData: FormData) {
  const actor = await requireAdmin();
  const idempotencyKey = inputString(formData, "idempotencyKey");
  const nasabahId = inputString(formData, "nasabahId");
  const parsed = z.object({
    jumlahRupiah: z.coerce.number().int().positive().max(2_000_000_000),
    keterangan: z.string().trim().max(240),
  }).safeParse({
    jumlahRupiah: inputString(formData, "jumlahRupiah"),
    keterangan: inputString(formData, "keterangan"),
  });
  if (!z.uuid().safeParse(idempotencyKey).success || !z.uuid().safeParse(nasabahId).success || !parsed.success) {
    goBack("/penarikan", "error", "Nasabah dan nominal penarikan harus valid serta lebih dari Rp0.");
  }

  let result: { status: "inserted" | "duplicate" | "insufficient" };
  try {
    result = await getDb().transaction(async (tx) => {
      const [resident] = await tx.select({ id: nasabah.id, userId: nasabah.userId }).from(nasabah)
        .where(eq(nasabah.id, nasabahId)).for("update").limit(1);
      if (!resident) throw new ActionError("Nasabah tidak ditemukan.");
      const [account] = await tx.select({ isActive: users.isActive }).from(users)
        .where(eq(users.id, resident.userId)).for("share").limit(1);
      if (!account?.isActive) throw new ActionError("Akun nasabah tidak aktif.");

      const [existing] = await tx.select({ id: penarikan.id }).from(penarikan)
        .where(eq(penarikan.idempotencyKey, idempotencyKey)).limit(1);
      if (existing) return { status: "duplicate" };

      const [deposit] = await tx.select({ total: sql<number>`coalesce(sum(${setoran.nilaiRupiah}), 0)::bigint` })
        .from(setoran).where(eq(setoran.nasabahId, nasabahId));
      const [withdrawal] = await tx.select({ total: sql<number>`coalesce(sum(${penarikan.jumlahRupiah}), 0)::bigint` })
        .from(penarikan).where(eq(penarikan.nasabahId, nasabahId));
      const depositTotal = Number(deposit?.total ?? 0);
      const withdrawalTotal = Number(withdrawal?.total ?? 0);
      if (!Number.isSafeInteger(depositTotal) || !Number.isSafeInteger(withdrawalTotal)) {
        throw new ActionError("Total saldo melampaui batas presisi yang didukung.");
      }
      const balance = depositTotal - withdrawalTotal;
      if (!Number.isSafeInteger(balance) || balance < 0) {
        throw new ActionError("Saldo tersimpan tidak valid. Penarikan tidak dapat diproses.");
      }
      if (parsed.data.jumlahRupiah > balance) return { status: "insufficient" };

      const inserted = await tx.insert(penarikan).values({
        idempotencyKey,
        nasabahId,
        jumlahRupiah: parsed.data.jumlahRupiah,
        keterangan: parsed.data.keterangan,
        dicatatOleh: actor.id,
      }).onConflictDoNothing({ target: penarikan.idempotencyKey }).returning({ id: penarikan.id });
      return { status: inserted.length ? "inserted" : "duplicate" };
    });
  } catch (error) {
    if (error instanceof ActionError) goBack("/penarikan", "error", error.message);
    if (uniqueViolation(error)) goBack("/penarikan", "sukses", "Penarikan ini sudah diproses; saldo tidak dikurangi ulang.");
    throw error;
  }
  if (result.status === "insufficient") goBack("/penarikan", "error", "Penarikan ditolak karena melebihi saldo nasabah.");
  if (result.status === "duplicate") goBack("/penarikan", "sukses", "Penarikan ini sudah diproses; saldo tidak dikurangi ulang.");
  revalidatePath("/penarikan");
  revalidatePath("/dashboard");
  revalidatePath("/warga/dashboard");
  revalidatePath("/warga/riwayat");
  goBack("/penarikan", "sukses", "Penarikan berhasil dicatat.");
}
