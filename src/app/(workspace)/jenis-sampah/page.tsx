import type { Metadata } from "next";
import Link from "next/link";
import { Recycle } from "lucide-react";
import { createWasteType, setWasteTypeActive, updateWasteType } from "@/lib/actions";
import { Card, EmptyState, Notice, PageHeader, SearchBox } from "@/components/ui";
import { ModalDialog } from "@/components/modal-dialog";
import { requireAdmin } from "@/lib/authorization";
import { getWasteTypes } from "@/lib/queries";
import { rupiah } from "@/lib/money";

export const metadata: Metadata = { title: "Jenis Sampah" };

export default async function WasteTypePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; edit?: string; error?: string; sukses?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const types = await getWasteTypes(params.q?.trim() ?? "");
  const selected = params.edit ? types.find((type) => type.id === params.edit) : undefined;
  return (
    <>
      <PageHeader eyebrow="Katalog sampah" title="Jenis & harga sampah" description="Atur harga pembelian per kilogram. Perubahan harga hanya berlaku untuk setoran baru." action={<a href="#form-jenis" className="inline-flex items-center gap-2 rounded-xl bg-indigo px-4 py-2.5 text-xs font-bold text-white hover:bg-[#5248c4]"><Recycle size={15} />Tambah jenis</a>} />
      <Notice error={params.error} success={params.sukses} />
      <div className="grid items-start gap-5 xl:grid-cols-[350px_1fr]">
        <Card title={selected ? "Ubah jenis sampah" : "Tambah jenis sampah"} description="Harga disimpan sebagai snapshot pada setiap transaksi setoran.">
          <form id="form-jenis" action={selected ? updateWasteType : createWasteType} className="space-y-4">
            {selected && <input type="hidden" name="id" value={selected.id} />}
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Nama jenis</span><input name="nama" required minLength={2} maxLength={100} defaultValue={selected?.nama} className="form-input" placeholder="Contoh: Botol plastik" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Harga per kg (Rupiah)</span><input name="hargaPerKg" type="number" required min={1} max={2000000000} step={1} defaultValue={selected?.hargaPerKg} className="form-input" placeholder="Contoh: 2000" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Keterangan <span className="font-normal text-[#9a9fb0]">(opsional)</span></span><textarea name="deskripsi" maxLength={500} rows={3} defaultValue={selected?.deskripsi} className="form-input resize-y" placeholder="Informasi jenis sampah" /></label>
            <div className="flex gap-2"><button className="flex-1 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo">{selected ? "Simpan perubahan" : "Simpan jenis sampah"}</button>{selected && <Link href="/jenis-sampah" className="rounded-xl border border-[#e7e8f0] px-4 py-2.5 text-xs font-semibold text-[#737b94]">Batal</Link>}</div>
          </form>
        </Card>
        <Card title="Katalog harga" description={`${types.length} jenis${params.q ? " ditemukan" : " terdaftar"}`} action={<SearchBox value={params.q} placeholder="Cari jenis sampah..." />}>
          {types.length === 0 ? <EmptyState title="Belum ada jenis sampah" description={params.q ? "Coba kata kunci lain." : "Tambahkan jenis sampah dan harga beli untuk mulai menerima setoran."} /> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left">
              <thead><tr className="border-b border-[#eff0f5] text-[10px] font-semibold uppercase tracking-wide text-[#9a9fb0]"><th className="pb-3 pr-4">Jenis sampah</th><th className="pb-3 pr-4">Harga per kg</th><th className="pb-3 pr-4">Status</th><th className="pb-3 text-right">Aksi</th></tr></thead>
              <tbody>{types.map((type) => <tr key={type.id} className="border-b border-[#f2f3f7] last:border-0">
                <td className="py-4 pr-4"><p className="text-xs font-bold text-navy">{type.nama}</p><p className="mt-1 max-w-xs truncate text-[10px] text-[#858ba1]">{type.deskripsi || "Tidak ada keterangan"}</p></td>
                <td className="py-4 pr-4 text-xs font-bold text-navy">{rupiah(type.hargaPerKg)}<span className="font-normal text-[#858ba1]"> / kg</span></td>
                <td className="py-4 pr-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${type.isActive ? "bg-[#f0eeff] text-indigo" : "bg-[#f0f1f5] text-[#7d8295]"}`}>{type.isActive ? "Aktif" : "Nonaktif"}</span></td>
                <td className="py-4 text-right"><div className="flex justify-end gap-2"><Link href={`/jenis-sampah?edit=${type.id}`} className="rounded-lg border border-[#e7e8f0] px-2.5 py-1.5 text-[10px] font-semibold text-navy hover:bg-[#f7f6ff]">Ubah</Link>{type.isActive ? <ModalDialog title="Nonaktifkan jenis sampah?" description={`"${type.nama}" tidak bisa dipilih untuk setoran baru, tetapi transaksi lama tetap utuh.`} trigger="Nonaktifkan" triggerClassName="rounded-lg border border-[#e7e8f0] px-2.5 py-1.5 text-[10px] font-semibold text-[#737b94] hover:bg-[#fff3ef] hover:text-[#a75e50]"><form action={setWasteTypeActive} className="space-y-4"><input type="hidden" name="id" value={type.id} /><input type="hidden" name="active" value="false" /><p className="text-xs leading-5 text-[#737b94]">Jenis sampah dapat diaktifkan kembali oleh petugas.</p><button className="w-full rounded-xl bg-[#a75e50] px-4 py-2.5 text-xs font-bold text-white">Ya, nonaktifkan jenis</button></form></ModalDialog> : <form action={setWasteTypeActive}><input type="hidden" name="id" value={type.id} /><input type="hidden" name="active" value="true" /><button className="rounded-lg border border-[#e7e8f0] px-2.5 py-1.5 text-[10px] font-semibold text-[#737b94] hover:bg-[#f7f6ff]">Aktifkan</button></form>}</div></td>
              </tr>)}</tbody>
            </table></div>
          )}
        </Card>
      </div>
    </>
  );
}
