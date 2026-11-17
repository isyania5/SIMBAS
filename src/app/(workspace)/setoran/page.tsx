import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { ArrowDownLeft, Scale } from "lucide-react";
import { eq, desc } from "drizzle-orm";
import { createDeposit } from "@/lib/actions";
import { Card, EmptyState, Notice, PageHeader, formatDate } from "@/components/ui";
import { requireAdmin } from "@/lib/authorization";
import { getDb } from "@/db";
import { jenisSampah, nasabah, setoran, users } from "@/db/schema";
import { rupiah } from "@/lib/money";

export const metadata: Metadata = { title: "Setoran Sampah" };

export default async function DepositPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sukses?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const db = getDb();
  const [residents, wasteTypes, recent] = await Promise.all([
    db.select({ id: nasabah.id, nama: nasabah.nama })
      .from(nasabah).innerJoin(users, eq(users.id, nasabah.userId))
      .where(eq(users.isActive, true)).orderBy(nasabah.nama),
    db.select({ id: jenisSampah.id, nama: jenisSampah.nama, harga: jenisSampah.hargaPerKg })
      .from(jenisSampah).where(eq(jenisSampah.isActive, true)).orderBy(jenisSampah.nama),
    db.select({
      id: setoran.id,
      nama: nasabah.nama,
      jenis: jenisSampah.nama,
      berat: setoran.beratKg,
      harga: setoran.hargaPerKg,
      nilai: setoran.nilaiRupiah,
      dibuat: setoran.createdAt,
    }).from(setoran)
      .innerJoin(nasabah, eq(nasabah.id, setoran.nasabahId))
      .innerJoin(jenisSampah, eq(jenisSampah.id, setoran.jenisSampahId))
      .orderBy(desc(setoran.createdAt)).limit(20),
  ]);
  return (
    <>
      <PageHeader eyebrow="Transaksi masuk" title="Catat setoran" description="Pilih nasabah dan jenis sampah. Nilai setoran dihitung otomatis dan harga disimpan sebagai snapshot." />
      <Notice error={params.error} success={params.sukses} />
      <div className="grid items-start gap-5 xl:grid-cols-[370px_1fr]">
        <Card title="Setoran baru" description="Berat dapat menggunakan hingga 3 angka desimal.">
          {residents.length === 0 || wasteTypes.length === 0 ? (
            <EmptyState title="Data belum siap" description={residents.length === 0 ? "Tambahkan nasabah aktif terlebih dahulu." : "Tambahkan jenis sampah aktif beserta harganya."} href={residents.length === 0 ? "/nasabah" : "/jenis-sampah"} linkText={residents.length === 0 ? "Kelola nasabah" : "Kelola jenis sampah"} />
          ) : (
            <form action={createDeposit} className="space-y-4">
              <input type="hidden" name="idempotencyKey" value={randomUUID()} />
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Nasabah</span><select name="nasabahId" required defaultValue="" className="form-input"><option value="" disabled>Pilih nasabah</option>{residents.map((resident) => <option key={resident.id} value={resident.id}>{resident.nama}</option>)}</select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Jenis sampah</span><select name="jenisSampahId" required defaultValue="" className="form-input"><option value="" disabled>Pilih jenis sampah</option>{wasteTypes.map((type) => <option key={type.id} value={type.id}>{type.nama} · {rupiah(type.harga)}/kg</option>)}</select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Berat (kg)</span><div className="relative"><Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#989eb0]" size={16} /><input name="beratKg" type="number" required min="0.001" max="9999999.999" step="0.001" inputMode="decimal" className="form-input pl-10" placeholder="Contoh: 3" /></div></label>
              <div className="rounded-xl bg-[#f7f6ff] px-4 py-3.5"><p className="text-[11px] font-semibold text-[#686f89]">Perhitungan nilai</p><p className="mt-1.5 text-xs text-[#858ba1]">Berat (kg) × harga per kg. Nilai Rupiah dibulatkan ke bilangan terdekat.</p></div>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo px-4 py-3 text-xs font-bold text-white transition hover:bg-[#5248c4]"><ArrowDownLeft size={15} />Simpan setoran</button>
            </form>
          )}
        </Card>
        <Card title="Setoran terbaru" description="Harga pada transaksi tidak berubah saat katalog diperbarui.">
          {recent.length === 0 ? <EmptyState title="Belum ada setoran" description="Transaksi setoran yang dicatat akan muncul di sini." /> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[690px] text-left">
              <thead><tr className="border-b border-[#eff0f5] text-[10px] font-semibold uppercase tracking-wide text-[#9a9fb0]"><th className="pb-3 pr-4">Nasabah</th><th className="pb-3 pr-4">Jenis sampah</th><th className="pb-3 pr-4">Berat</th><th className="pb-3 pr-4">Harga snapshot</th><th className="pb-3 pr-4">Tanggal</th><th className="pb-3 text-right">Nilai</th></tr></thead>
              <tbody>{recent.map((row) => <tr key={row.id} className="border-b border-[#f2f3f7] last:border-0">
                <td className="py-3.5 pr-4 text-xs font-semibold text-navy">{row.nama}</td><td className="py-3.5 pr-4"><span className="text-xs text-[#737b94]">{row.jenis}</span></td><td className="py-3.5 pr-4 text-xs text-navy">{row.berat} kg</td><td className="py-3.5 pr-4 text-[11px] text-[#737b94]">{rupiah(row.harga)}/kg</td><td className="py-3.5 pr-4 text-[10px] text-[#858ba1]">{formatDate(row.dibuat)}</td><td className="py-3.5 text-right text-xs font-bold text-indigo">{rupiah(row.nilai)}</td>
              </tr>)}</tbody>
            </table></div>
          )}
        </Card>
      </div>
    </>
  );
}
