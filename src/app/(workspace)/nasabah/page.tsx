import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { createNasabah, setNasabahActive, updateNasabah } from "@/lib/actions";
import { Card, EmptyState, Notice, PageHeader, SearchBox, formatDate } from "@/components/ui";
import { ModalDialog } from "@/components/modal-dialog";
import { requireAdmin } from "@/lib/authorization";
import { searchResidents } from "@/lib/queries";

export const metadata: Metadata = { title: "Data Nasabah" };

export default async function NasabahPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; edit?: string; error?: string; sukses?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const residents = await searchResidents(params.q?.trim() ?? "");
  const selected = params.edit ? residents.find((resident) => resident.id === params.edit) : undefined;
  const action = selected ? updateNasabah : createNasabah;
  return (
    <>
      <PageHeader eyebrow="Pengelolaan akun" title="Data nasabah" description="Buat akun, perbarui profil, dan atur akses nasabah tanpa menghapus riwayat transaksinya." action={<a href="#form-nasabah" className="inline-flex items-center gap-2 rounded-xl bg-indigo px-4 py-2.5 text-xs font-bold text-white hover:bg-[#5248c4]"><UserPlus size={15} />Nasabah baru</a>} />
      <Notice error={params.error} success={params.sukses} />
      <div className="grid items-start gap-5 xl:grid-cols-[350px_1fr]">
        <Card title={selected ? "Ubah data nasabah" : "Tambah nasabah"} description={selected ? "Perubahan nama dan email juga memperbarui akun login." : "Akun warga dibuat oleh petugas; tidak ada pendaftaran mandiri."}>
          <form id="form-nasabah" action={action} className="space-y-4">
            {selected && <input type="hidden" name="id" value={selected.id} />}
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Nama lengkap</span><input name="nama" required minLength={2} maxLength={120} defaultValue={selected?.nama} className="form-input" placeholder="Nama nasabah" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Email login</span><input name="email" type="email" required maxLength={255} defaultValue={selected?.email} className="form-input" placeholder="nama@email.com" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Nomor telepon <span className="font-normal text-[#9a9fb0]">(opsional)</span></span><input name="noTelepon" maxLength={20} defaultValue={selected?.noTelepon ?? ""} className="form-input" placeholder="08xxxxxxxxxx" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">Alamat</span><textarea name="alamat" maxLength={1000} rows={2} defaultValue={selected?.alamat ?? ""} className="form-input resize-y" placeholder="Alamat nasabah" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-navy">{selected ? "Kata sandi baru" : "Kata sandi awal"} {selected && <span className="font-normal text-[#9a9fb0]">(kosongkan jika tidak diubah)</span>}</span><input name="password" type="password" minLength={selected ? undefined : 8} maxLength={72} required={!selected} autoComplete="new-password" className="form-input" placeholder={selected ? "Opsional · 8–72 karakter" : "8–72 karakter"} /></label>
            <div className="flex gap-2 pt-1">
              <button className="flex-1 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo">{selected ? "Simpan perubahan" : "Buat akun nasabah"}</button>
              {selected && <Link href="/nasabah" className="rounded-xl border border-[#e7e8f0] px-4 py-2.5 text-xs font-semibold text-[#737b94] hover:bg-[#f8f8fc]">Batal</Link>}
            </div>
          </form>
        </Card>

        <Card title="Daftar nasabah" description={`${residents.length} nasabah${params.q ? " ditemukan" : " terdaftar"}`} action={<SearchBox value={params.q} placeholder="Cari nama, email, telepon..." />}>
          {residents.length === 0 ? <EmptyState title="Nasabah belum ditemukan" description={params.q ? "Coba kata kunci lain." : "Buat akun nasabah pertama untuk mulai mencatat transaksi."} /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead><tr className="border-b border-[#eff0f5] text-[10px] font-semibold uppercase tracking-wide text-[#9a9fb0]"><th className="pb-3 pr-4">Nasabah</th><th className="pb-3 pr-4">Kontak</th><th className="pb-3 pr-4">Tanggal bergabung</th><th className="pb-3 pr-4">Status</th><th className="pb-3 text-right">Aksi</th></tr></thead>
                <tbody>{residents.map((resident) => (
                  <tr key={resident.id} className="border-b border-[#f2f3f7] last:border-0">
                    <td className="py-4 pr-4"><p className="text-xs font-bold text-navy">{resident.nama}</p><p className="mt-1 text-[10px] text-[#858ba1]">{resident.alamat || "Alamat belum diisi"}</p></td>
                    <td className="py-4 pr-4"><p className="text-xs text-[#606983]">{resident.email}</p><p className="mt-1 text-[10px] text-[#858ba1]">{resident.noTelepon || "—"}</p></td>
                    <td className="py-4 pr-4 text-[11px] text-[#737b94]">{formatDate(resident.dibuat)}</td>
                    <td className="py-4 pr-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${resident.aktif ? "bg-[#f0eeff] text-indigo" : "bg-[#f0f1f5] text-[#7d8295]"}`}>{resident.aktif ? "Aktif" : "Nonaktif"}</span></td>
                    <td className="py-4 text-right"><div className="flex justify-end gap-2"><Link href={`/nasabah?edit=${resident.id}`} className="rounded-lg border border-[#e7e8f0] px-2.5 py-1.5 text-[10px] font-semibold text-navy hover:bg-[#f7f6ff]">Ubah</Link>{resident.aktif ? <ModalDialog title="Nonaktifkan akun nasabah?" description={`Akun ${resident.nama} tidak lagi dapat masuk. Histori transaksi akan tetap tersimpan.`} trigger="Nonaktifkan" triggerClassName="rounded-lg border border-[#e7e8f0] px-2.5 py-1.5 text-[10px] font-semibold text-[#737b94] hover:bg-[#fff3ef] hover:text-[#a75e50]"><form action={setNasabahActive} className="space-y-4"><input type="hidden" name="id" value={resident.id} /><input type="hidden" name="active" value="false" /><p className="text-xs leading-5 text-[#737b94]">Nasabah dapat diaktifkan kembali kapan saja oleh petugas.</p><button className="w-full rounded-xl bg-[#a75e50] px-4 py-2.5 text-xs font-bold text-white">Ya, nonaktifkan akun</button></form></ModalDialog> : <form action={setNasabahActive}><input type="hidden" name="id" value={resident.id} /><input type="hidden" name="active" value="true" /><button className="rounded-lg border border-[#e7e8f0] px-2.5 py-1.5 text-[10px] font-semibold text-[#737b94] hover:bg-[#f7f6ff]">Aktifkan</button></form>}</div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
