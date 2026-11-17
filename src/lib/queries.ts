import "server-only";
import { and, desc, eq, gte, ilike, lt, or, sql, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { jenisSampah, nasabah, penarikan, setoran, users } from "@/db/schema";

function safeRupiahTotal(value: number | string | null | undefined) {
  const total = Number(value ?? 0);
  if (!Number.isSafeInteger(total)) {
    throw new Error("Total Rupiah melampaui batas presisi yang didukung.");
  }
  return total;
}

export async function getResidentProfile(userId: string) {
  const [profile] = await getDb()
    .select({ id: nasabah.id, nama: nasabah.nama, userId: nasabah.userId })
    .from(nasabah)
    .where(eq(nasabah.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function getResidentBalance(nasabahId: string) {
  const db = getDb();
  const [deposit] = await db
    .select({ total: sum(setoran.nilaiRupiah) })
    .from(setoran)
    .where(eq(setoran.nasabahId, nasabahId));
  const [withdrawal] = await db
    .select({ total: sum(penarikan.jumlahRupiah) })
    .from(penarikan)
    .where(eq(penarikan.nasabahId, nasabahId));
  const totalSetoran = safeRupiahTotal(deposit?.total);
  const totalPenarikan = safeRupiahTotal(withdrawal?.total);
  const saldo = totalSetoran - totalPenarikan;
  if (!Number.isSafeInteger(saldo)) {
    throw new Error("Saldo melampaui batas presisi yang didukung.");
  }
  return {
    totalSetoran,
    totalPenarikan,
    saldo,
  };
}

export async function getAdminDashboard() {
  const db = getDb();
  const [
    [residentCount],
    [activeWasteCount],
    [depositTotal],
    [withdrawalTotal],
    [depositCount],
    [withdrawalCount],
  ] = await Promise.all([
    db.select({ value: sql<number>`count(*)::int` }).from(nasabah).innerJoin(users, eq(users.id, nasabah.userId)).where(eq(users.isActive, true)),
    db.select({ value: sql<number>`count(*)::int` }).from(jenisSampah).where(eq(jenisSampah.isActive, true)),
    db.select({ value: sum(setoran.nilaiRupiah) }).from(setoran),
    db.select({ value: sum(penarikan.jumlahRupiah) }).from(penarikan),
    db.select({ value: sql<number>`count(*)::int` }).from(setoran),
    db.select({ value: sql<number>`count(*)::int` }).from(penarikan),
  ]);
  const totalSetoran = safeRupiahTotal(depositTotal?.value);
  const totalPenarikan = safeRupiahTotal(withdrawalTotal?.value);
  const saldoTabungan = safeRupiahTotal(totalSetoran - totalPenarikan);
  return {
    residentCount: Number(residentCount?.value ?? 0),
    activeWasteCount: Number(activeWasteCount?.value ?? 0),
    totalSetoran,
    totalPenarikan,
    saldoTabungan,
    transactionCount: Number(depositCount?.value ?? 0) + Number(withdrawalCount?.value ?? 0),
  };
}

export async function searchResidents(search: string) {
  const db = getDb();
  const conditions = search
    ? or(ilike(nasabah.nama, `%${search}%`), ilike(users.email, `%${search}%`), ilike(nasabah.noTelepon, `%${search}%`))
    : undefined;
  return db
    .select({
      id: nasabah.id,
      nama: nasabah.nama,
      email: users.email,
      noTelepon: nasabah.noTelepon,
      alamat: nasabah.alamat,
      aktif: users.isActive,
      dibuat: nasabah.createdAt,
    })
    .from(nasabah)
    .innerJoin(users, eq(users.id, nasabah.userId))
    .where(conditions)
    .orderBy(desc(nasabah.createdAt));
}

export async function getWasteTypes(search: string) {
  return getDb()
    .select()
    .from(jenisSampah)
    .where(search ? ilike(jenisSampah.nama, `%${search}%`) : undefined)
    .orderBy(desc(jenisSampah.createdAt));
}

export async function getRecentTransactions() {
  const db = getDb();
  const [deposits, withdrawals] = await Promise.all([
    db
      .select({
        id: setoran.id,
        nama: nasabah.nama,
        keterangan: jenisSampah.nama,
        jumlah: setoran.nilaiRupiah,
        createdAt: setoran.createdAt,
        jenis: sql<"setoran">`'setoran'`,
      })
      .from(setoran)
      .innerJoin(nasabah, eq(nasabah.id, setoran.nasabahId))
      .innerJoin(jenisSampah, eq(jenisSampah.id, setoran.jenisSampahId))
      .orderBy(desc(setoran.createdAt)).limit(8),
    db
      .select({
        id: penarikan.id,
        nama: nasabah.nama,
        keterangan: penarikan.keterangan,
        jumlah: penarikan.jumlahRupiah,
        createdAt: penarikan.createdAt,
        jenis: sql<"penarikan">`'penarikan'`,
      })
      .from(penarikan)
      .innerJoin(nasabah, eq(nasabah.id, penarikan.nasabahId))
      .orderBy(desc(penarikan.createdAt)).limit(8),
  ]);
  return [...deposits, ...withdrawals]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);
}

export async function getResidentTransactions(nasabahId: string) {
  const db = getDb();
  const [deposits, withdrawals] = await Promise.all([
    db
      .select({
        id: setoran.id,
        keterangan: jenisSampah.nama,
        detail: sql<string>`concat(${setoran.beratKg}, ' kg × Rp', ${setoran.hargaPerKg})`,
        jumlah: setoran.nilaiRupiah,
        createdAt: setoran.createdAt,
        jenis: sql<"setoran">`'setoran'`,
      })
      .from(setoran)
      .innerJoin(jenisSampah, eq(jenisSampah.id, setoran.jenisSampahId))
      .where(eq(setoran.nasabahId, nasabahId)),
    db
      .select({
        id: penarikan.id,
        keterangan: sql<string>`'Penarikan tabungan'`,
        detail: penarikan.keterangan,
        jumlah: penarikan.jumlahRupiah,
        createdAt: penarikan.createdAt,
        jenis: sql<"penarikan">`'penarikan'`,
      })
      .from(penarikan)
      .where(eq(penarikan.nasabahId, nasabahId)),
  ]);
  return [...deposits, ...withdrawals].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export async function getReportTransactions(from?: Date, until?: Date) {
  const db = getDb();
  const depositFilter = from && until
    ? and(gte(setoran.createdAt, from), lt(setoran.createdAt, until))
    : from
      ? gte(setoran.createdAt, from)
      : until
        ? lt(setoran.createdAt, until)
        : undefined;
  const withdrawalFilter = from && until
    ? and(gte(penarikan.createdAt, from), lt(penarikan.createdAt, until))
    : from
      ? gte(penarikan.createdAt, from)
      : until
        ? lt(penarikan.createdAt, until)
        : undefined;
  const [deposits, withdrawals] = await Promise.all([
    db
      .select({
        id: setoran.id,
        nama: nasabah.nama,
        keterangan: jenisSampah.nama,
        detail: sql<string>`concat(${setoran.beratKg}, ' kg × Rp', ${setoran.hargaPerKg})`,
        jumlah: setoran.nilaiRupiah,
        createdAt: setoran.createdAt,
        jenis: sql<"setoran">`'setoran'`,
      })
      .from(setoran)
      .innerJoin(nasabah, eq(nasabah.id, setoran.nasabahId))
      .innerJoin(jenisSampah, eq(jenisSampah.id, setoran.jenisSampahId))
      .where(depositFilter),
    db
      .select({
        id: penarikan.id,
        nama: nasabah.nama,
        keterangan: sql<string>`'Penarikan tabungan'`,
        detail: penarikan.keterangan,
        jumlah: penarikan.jumlahRupiah,
        createdAt: penarikan.createdAt,
        jenis: sql<"penarikan">`'penarikan'`,
      })
      .from(penarikan)
      .innerJoin(nasabah, eq(nasabah.id, penarikan.nasabahId))
      .where(withdrawalFilter),
  ]);
  return [...deposits, ...withdrawals].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
