import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { Card, EmptyState, PageHeader, TransactionBadge, formatDate } from "@/components/ui";
import { requireResident } from "@/lib/authorization";
import { getResidentTransactions } from "@/lib/queries";
import { rupiah } from "@/lib/money";

export const metadata: Metadata = { title: "Riwayat Transaksi" };

export default async function ResidentHistoryPage() {
  const user = await requireResident();
  const transactions = await getResidentTransactions(user.nasabahId);
  return (
    <>
      <PageHeader eyebrow="Aktivitas tabungan" title="Riwayat transaksi" description="Daftar setoran dan penarikan pada akun nasabah Anda." action={<span className="inline-flex items-center gap-2 rounded-xl border border-[#e7e8f0] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#737b94]"><ClipboardList size={15} />{transactions.length} transaksi</span>} />
      <Card title="Semua transaksi" description="Riwayat ini hanya memuat transaksi milik akun Anda.">
        {transactions.length === 0 ? <EmptyState title="Belum ada riwayat" description="Transaksi Anda akan muncul setelah petugas mencatat setoran atau penarikan." /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left">
            <thead><tr className="border-b border-[#eff0f5] text-[10px] font-semibold uppercase tracking-wide text-[#9a9fb0]"><th className="pb-3 pr-4">Tanggal</th><th className="pb-3 pr-4">Transaksi</th><th className="pb-3 pr-4">Keterangan</th><th className="pb-3 pr-4">Detail</th><th className="pb-3 text-right">Nilai</th></tr></thead>
            <tbody>{transactions.map((transaction) => <tr key={`${transaction.jenis}-${transaction.id}`} className="border-b border-[#f2f3f7] last:border-0"><td className="py-4 pr-4 text-[11px] text-[#858ba1]">{formatDate(transaction.createdAt)}</td><td className="py-4 pr-4"><TransactionBadge jenis={transaction.jenis} /></td><td className="py-4 pr-4 text-xs font-semibold text-navy">{transaction.keterangan}</td><td className="py-4 pr-4 text-[11px] text-[#858ba1]">{transaction.detail || "—"}</td><td className={`py-4 text-right text-xs font-bold ${transaction.jenis === "setoran" ? "text-indigo" : "text-[#a75e50]"}`}>{transaction.jenis === "setoran" ? "+" : "−"}{rupiah(transaction.jumlah)}</td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
