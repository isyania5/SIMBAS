import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { ArrowUpRight, Wallet } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { createWithdrawal } from "@/lib/actions";
import { Card, EmptyState, Notice, PageHeader, formatDate } from "@/components/ui";
import { requireAdmin } from "@/lib/authorization";
import { getDb } from "@/db";
import { nasabah, penarikan, users } from "@/db/schema";
import { getResidentBalance } from "@/lib/queries";
import { rupiah } from "@/lib/money";

export const metadata: Metadata = { title: "Penarikan Tabungan" };

export default async function WithdrawalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sukses?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const db = getDb();
  const [residents, recent] = await Promise.all([
    db.select({ id: nasabah.id, nama: nasabah.nama })
      .from(nasabah).innerJoin(users, eq(users.id, nasabah.userId))
      .where(eq(users.isActive, true)).orderBy(nasabah.nama),
    db.select({
      id: penarikan.id,
      nama: nasabah.nama,
      jumlah: penarikan.jumlahRupiah,
      alasan: penarikan.keterangan,
      dibuat: penarikan.createdAt,
    }).from(penarikan).innerJoin(nasabah, eq(nasabah.id, penarikan.nasabahId))
      .orderBy(desc(penarikan.createdAt)).limit(20),
  ]);
  const balances = await Promise.all(residents.map(async (resident) => ({
    ...resident,
    saldo: (await getResidentBalance(resident.id)).saldo,
  })));
  return (
    <>
      <PageHeader eyebrow="Transaksi keluar" title="Penarikan tabungan" description="Catat penarikan nasabah. Nominal yang melebihi saldo akan ditolak secara aman." />
      <Notice error={params.error} success={params.sukses} />
      <div className="grid items-start gap-5 xl:grid-cols-[370px_1fr]">
        <Card title="Penarikan baru" description="Saldo dihitung ulang dari seluruh transaksi tersimpan.">
          {residents.length === 0 ? <EmptyState title="Belum ada nasabah aktif" description="Tambahkan nasabah aktif sebelum mencatat penarikan." href="/nasabah" linkText="Kelola nasabah" /> : (
            <form action={createWithdrawal} className="space-y-4">
              <input type="hidden" name="idempotencyKey" value={randomUUID()} />
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Nasabah</span><select name="nasabahId" required defaultValue="" className="form-input"><option value="" disabled>Pilih nasabah</option>{balances.map((resident) => <option key={resident.id} value={resident.id}>{resident.nama} · saldo {rupiah(resident.saldo)}</option>)}</select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Nominal (Rupiah)</span><div className="relative"><Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#989eb0]" size={16} /><input name="jumlahRupiah" type="number" required min={1} max={2000000000} step={1} inputMode="numeric" className="form-input pl-10" placeholder="Contoh: 50000" /></div></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Keterangan <span className="font-normal text-[#9a9fb0]">(opsional)</span></span><input name="keterangan" maxLength={240} className="form-input" placeholder="Catatan penarikan" /></label>
              <div className="rounded-xl border border-[#f1d4cd] bg-[#fff7f4] px-4 py-3.5"><p className="text-[11px] font-semibold text-[#9b5b4e]">Pemeriksaan saldo aktif</p><p className="mt-1.5 text-[11px] leading-5 text-[#956f67]">Saldo nasabah dikunci dan diperiksa kembali di dalam transaksi database sebelum penarikan disimpan.</p></div>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-xs font-bold text-white transition hover:bg-indigo"><ArrowUpRight size={15} />Simpan penarikan</button>
            </form>
          )}
        </Card>
        <Card title="Penarikan terbaru" description="Riwayat transaksi keluar nasabah.">
          {recent.length === 0 ? <EmptyState title="Belum ada penarikan" description="Penarikan yang dicatat akan muncul di sini." /> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[590px] text-left">
              <thead><tr className="border-b border-[#eff0f5] text-[10px] font-semibold uppercase tracking-wide text-[#9a9fb0]"><th className="pb-3 pr-4">Nasabah</th><th className="pb-3 pr-4">Keterangan</th><th className="pb-3 pr-4">Tanggal</th><th className="pb-3 text-right">Nominal</th></tr></thead>
              <tbody>{recent.map((row) => <tr key={row.id} className="border-b border-[#f2f3f7] last:border-0"><td className="py-3.5 pr-4 text-xs font-semibold text-navy">{row.nama}</td><td className="py-3.5 pr-4 text-xs text-[#737b94]">{row.alasan || "Penarikan tabungan"}</td><td className="py-3.5 pr-4 text-[10px] text-[#858ba1]">{formatDate(row.dibuat)}</td><td className="py-3.5 text-right text-xs font-bold text-[#a75e50]">{rupiah(row.jumlah)}</td></tr>)}</tbody>
            </table></div>
          )}
        </Card>
      </div>
    </>
  );
}
