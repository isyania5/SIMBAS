import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Boxes, UsersRound, Wallet } from "lucide-react";
import { Card, EmptyState, PageHeader, StatCard, TransactionBadge, formatDate } from "@/components/ui";
import { requireAdmin } from "@/lib/authorization";
import { rupiah } from "@/lib/money";
import { getAdminDashboard, getRecentTransactions } from "@/lib/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [stats, transactions] = await Promise.all([getAdminDashboard(), getRecentTransactions()]);
  return (
    <>
      <PageHeader eyebrow="Ringkasan bank sampah" title="Dashboard" description="Pantau tabungan, aktivitas, dan data bank sampah Anda hari ini." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total saldo tabungan" value={rupiah(stats.saldoTabungan)} detail="Setoran dikurangi penarikan" icon={<Wallet size={19} />} tone="lavender" />
        <StatCard label="Total nilai setoran" value={rupiah(stats.totalSetoran)} detail={`${stats.transactionCount.toLocaleString("id-ID")} transaksi tercatat`} icon={<ArrowDownLeft size={19} />} tone="navy" />
        <StatCard label="Total penarikan" value={rupiah(stats.totalPenarikan)} detail="Akumulasi penarikan nasabah" icon={<ArrowUpRight size={19} />} tone="peach" />
        <StatCard label="Nasabah aktif" value={stats.residentCount.toLocaleString("id-ID")} detail={`${stats.activeWasteCount} jenis sampah aktif`} icon={<UsersRound size={19} />} />
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_290px]">
        <Card title="Aktivitas terbaru" description="Setoran dan penarikan terakhir dari seluruh nasabah.">
          {transactions.length === 0 ? (
            <EmptyState title="Belum ada transaksi" description="Setoran dan penarikan yang dicatat akan muncul di sini." href="/setoran" linkText="Catat setoran pertama" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead><tr className="border-b border-[#eff0f5] text-[10px] font-semibold uppercase tracking-wide text-[#9a9fb0]">
                  <th className="pb-3 pr-4">Nasabah</th><th className="pb-3 pr-4">Transaksi</th><th className="pb-3 pr-4">Keterangan</th><th className="pb-3 pr-4">Tanggal</th><th className="pb-3 text-right">Nilai</th>
                </tr></thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={`${transaction.jenis}-${transaction.id}`} className="border-b border-[#f2f3f7] last:border-0">
                      <td className="py-3.5 pr-4 text-xs font-semibold text-navy">{transaction.nama}</td>
                      <td className="py-3.5 pr-4"><TransactionBadge jenis={transaction.jenis} /></td>
                      <td className="py-3.5 pr-4 text-xs text-[#737b94]">{transaction.keterangan}</td>
                      <td className="py-3.5 pr-4 text-[11px] text-[#858ba1]">{formatDate(transaction.createdAt)}</td>
                      <td className="py-3.5 text-right text-xs font-bold text-navy">{rupiah(transaction.jumlah)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title="Ringkasan cepat" description="Kondisi keseluruhan saat ini.">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-[#f7f6ff] px-4 py-3.5">
              <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-lavender text-indigo"><Boxes size={17} /></span><span className="text-xs font-medium text-[#68708a]">Jenis sampah aktif</span></div>
              <span className="text-sm font-bold text-navy">{stats.activeWasteCount}</span>
            </div>
            <div className="rounded-xl border border-[#eff0f5] p-4">
              <p className="text-[11px] font-medium text-[#858ba1]">Tabungan yang dikelola</p>
              <p className="mt-2 text-xl font-bold tracking-tight text-navy">{rupiah(stats.saldoTabungan)}</p>
              <p className="mt-2 text-[10px] leading-5 text-[#969bad]">Saldo dihitung dari transaksi tersimpan, bukan angka yang dimasukkan manual.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/setoran" className="rounded-xl bg-indigo px-3 py-3 text-center text-[11px] font-bold text-white transition hover:bg-[#5248c4]">Catat setoran</Link>
              <Link href="/laporan" className="rounded-xl border border-[#e7e8f0] bg-white px-3 py-3 text-center text-[11px] font-bold text-navy transition hover:bg-[#f7f6ff]">Buka laporan</Link>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
