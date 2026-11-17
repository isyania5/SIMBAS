import type { Metadata } from "next";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import Link from "next/link";
import { Card, EmptyState, PageHeader, StatCard, TransactionBadge, formatDate } from "@/components/ui";
import { requireResident } from "@/lib/authorization";
import { rupiah } from "@/lib/money";
import { getResidentBalance, getResidentTransactions } from "@/lib/queries";

export const metadata: Metadata = { title: "Dashboard Nasabah" };

export default async function ResidentDashboardPage() {
  const user = await requireResident();
  const [balance, transactions] = await Promise.all([
    getResidentBalance(user.nasabahId),
    getResidentTransactions(user.nasabahId),
  ]);
  return (
    <>
      <PageHeader eyebrow="Ringkasan tabungan" title={`Halo, ${user.name ?? "Nasabah"}`} description="Berikut ringkasan tabungan dan aktivitas bank sampah Anda." action={<Link href="/warga/riwayat" className="rounded-xl border border-[#e7e8f0] bg-white px-4 py-2.5 text-xs font-bold text-navy hover:bg-[#f7f6ff]">Lihat riwayat</Link>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Saldo tabungan" value={rupiah(balance.saldo)} detail="Saldo saat ini" icon={<Wallet size={19} />} />
        <StatCard label="Total setoran" value={rupiah(balance.totalSetoran)} detail="Akumulasi nilai sampah yang disetor" icon={<ArrowDownLeft size={19} />} tone="navy" />
        <StatCard label="Total penarikan" value={rupiah(balance.totalPenarikan)} detail="Akumulasi tabungan yang ditarik" icon={<ArrowUpRight size={19} />} tone="peach" />
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_290px]">
        <Card title="Transaksi terbaru" description="Aktivitas tabungan pada akun Anda.">
          {transactions.length === 0 ? <EmptyState title="Belum ada transaksi" description="Setoran dan penarikan Anda akan tampil setelah dicatat petugas." /> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[550px] text-left">
              <thead><tr className="border-b border-[#eff0f5] text-[10px] font-semibold uppercase tracking-wide text-[#9a9fb0]"><th className="pb-3 pr-4">Tanggal</th><th className="pb-3 pr-4">Transaksi</th><th className="pb-3 pr-4">Keterangan</th><th className="pb-3 text-right">Nilai</th></tr></thead>
              <tbody>{transactions.slice(0, 6).map((transaction) => <tr key={`${transaction.jenis}-${transaction.id}`} className="border-b border-[#f2f3f7] last:border-0"><td className="py-3.5 pr-4 text-[11px] text-[#858ba1]">{formatDate(transaction.createdAt)}</td><td className="py-3.5 pr-4"><TransactionBadge jenis={transaction.jenis} /></td><td className="py-3.5 pr-4"><p className="text-xs font-semibold text-navy">{transaction.keterangan}</p><p className="mt-1 text-[10px] text-[#858ba1]">{transaction.detail || "—"}</p></td><td className={`py-3.5 text-right text-xs font-bold ${transaction.jenis === "setoran" ? "text-indigo" : "text-[#a75e50]"}`}>{rupiah(transaction.jumlah)}</td></tr>)}</tbody>
            </table></div>
          )}
        </Card>
        <Card title="Tentang saldo" description="Ringkasan akun Anda.">
          <div className="rounded-xl bg-[#f7f6ff] p-4"><span className="flex size-9 items-center justify-center rounded-lg bg-lavender text-indigo"><Wallet size={17} /></span><p className="mt-4 text-[11px] leading-5 text-[#747b95]">Saldo dihitung otomatis dari total setoran dikurangi total penarikan yang tercatat.</p><p className="mt-3 text-xl font-bold tracking-tight text-navy">{rupiah(balance.saldo)}</p></div>
          <Link href="/warga/riwayat" className="mt-4 block rounded-xl border border-[#e7e8f0] px-4 py-3 text-center text-xs font-semibold text-navy hover:bg-[#f7f6ff]">Buka semua riwayat</Link>
        </Card>
      </div>
    </>
  );
}
