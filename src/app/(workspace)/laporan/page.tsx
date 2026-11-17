import type { Metadata } from "next";
import Link from "next/link";
import { FileChartColumn } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { Card, EmptyState, PageHeader, TransactionBadge, formatDate } from "@/components/ui";
import { requireAdmin } from "@/lib/authorization";
import { getReportTransactions } from "@/lib/queries";
import { rupiah } from "@/lib/money";

export const metadata: Metadata = { title: "Laporan Transaksi" };

function parseDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const validationDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(validationDate.getTime()) || validationDate.toISOString().slice(0, 10) !== value) return null;
  return new Date(`${value}T00:00:00.000+07:00`);
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const parsedFrom = params.dari ? parseDate(params.dari) : undefined;
  const parsedUntil = params.sampai ? parseDate(params.sampai) : undefined;
  let issue = (params.dari && !parsedFrom) || (params.sampai && !parsedUntil)
    ? "Format tanggal tidak valid. Pilih tanggal dengan benar."
    : undefined;
  if (parsedFrom && parsedUntil && parsedFrom > parsedUntil) issue = "Tanggal awal tidak boleh melewati tanggal akhir.";
  const from = parsedFrom ?? undefined;
  const untilDate = parsedUntil ?? undefined;
  const until = untilDate ? new Date(untilDate.getTime() + 24 * 60 * 60 * 1000) : undefined;
  const transactions = issue ? [] : await getReportTransactions(from, until);
  const totalSetoran = transactions.filter((item) => item.jenis === "setoran").reduce((total, item) => {
    const next = total + item.jumlah;
    if (!Number.isSafeInteger(next)) throw new Error("Total Rupiah laporan melampaui batas presisi yang didukung.");
    return next;
  }, 0);
  const totalPenarikan = transactions.filter((item) => item.jenis === "penarikan").reduce((total, item) => {
    const next = total + item.jumlah;
    if (!Number.isSafeInteger(next)) throw new Error("Total Rupiah laporan melampaui batas presisi yang didukung.");
    return next;
  }, 0);
  return (
    <>
      <PageHeader eyebrow="Rekapitulasi" title="Laporan transaksi" description="Tinjau setoran dan penarikan berdasarkan periode. Gunakan fitur cetak browser untuk menyimpan atau mencetak laporan." action={<PrintButton />} />
      <div className="no-print mb-5 rounded-2xl border border-[#eceef5] bg-white p-5 shadow-[0_6px_24px_rgba(34,43,69,0.035)]">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-navy">Dari tanggal</span><input name="dari" type="date" defaultValue={params.dari} className="form-input min-w-[180px]" /></label>
          <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-navy">Sampai tanggal</span><input name="sampai" type="date" defaultValue={params.sampai} className="form-input min-w-[180px]" /></label>
          <button className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo"><FileChartColumn size={15} />Terapkan filter</button>
          <Link href="/laporan" className="rounded-xl border border-[#e7e8f0] px-4 py-2.5 text-xs font-semibold text-[#737b94] hover:bg-[#f8f8fc]">Reset</Link>
        </form>
        {issue && <p role="alert" className="mt-3 text-xs text-[#a75e50]">{issue}</p>}
      </div>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#eceef5] bg-white p-5"><p className="text-[11px] text-[#858ba1]">Total nilai setoran</p><p className="mt-2 text-xl font-bold text-indigo">{rupiah(totalSetoran)}</p></div>
        <div className="rounded-2xl border border-[#eceef5] bg-white p-5"><p className="text-[11px] text-[#858ba1]">Total penarikan</p><p className="mt-2 text-xl font-bold text-[#a75e50]">{rupiah(totalPenarikan)}</p></div>
        <div className="rounded-2xl border border-[#eceef5] bg-white p-5"><p className="text-[11px] text-[#858ba1]">Jumlah transaksi</p><p className="mt-2 text-xl font-bold text-navy">{transactions.length.toLocaleString("id-ID")}</p></div>
      </div>
      <Card title="Rincian transaksi" description={params.dari || params.sampai ? `Periode ${params.dari || "awal"} sampai ${params.sampai || "terbaru"}` : "Seluruh periode transaksi"}>
        {transactions.length === 0 ? <EmptyState title={issue ? "Filter tanggal perlu diperiksa" : "Tidak ada transaksi pada periode ini"} description={issue ? "Perbaiki rentang tanggal untuk melihat laporan." : "Transaksi yang sesuai dengan periode akan muncul di sini."} /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left">
            <thead><tr className="border-b border-[#eff0f5] text-[10px] font-semibold uppercase tracking-wide text-[#9a9fb0]"><th className="pb-3 pr-4">Tanggal</th><th className="pb-3 pr-4">Nasabah</th><th className="pb-3 pr-4">Transaksi</th><th className="pb-3 pr-4">Keterangan</th><th className="pb-3 pr-4">Detail</th><th className="pb-3 text-right">Nilai</th></tr></thead>
            <tbody>{transactions.map((transaction) => <tr key={`${transaction.jenis}-${transaction.id}`} className="border-b border-[#f2f3f7] last:border-0"><td className="py-3.5 pr-4 text-[11px] text-[#737b94]">{formatDate(transaction.createdAt)}</td><td className="py-3.5 pr-4 text-xs font-semibold text-navy">{transaction.nama}</td><td className="py-3.5 pr-4"><TransactionBadge jenis={transaction.jenis} /></td><td className="py-3.5 pr-4 text-xs text-[#737b94]">{transaction.keterangan}</td><td className="py-3.5 pr-4 text-[11px] text-[#858ba1]">{transaction.detail || "—"}</td><td className={`py-3.5 text-right text-xs font-bold ${transaction.jenis === "setoran" ? "text-indigo" : "text-[#a75e50]"}`}>{rupiah(transaction.jumlah)}</td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
