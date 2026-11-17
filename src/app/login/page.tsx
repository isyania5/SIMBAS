import type { Metadata } from "next";
import { Recycle, ShieldCheck, Sparkles } from "lucide-react";
import { Notice } from "@/components/ui";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-navy px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-32 -top-20 size-[440px] rounded-full border border-white/10" />
        <div className="absolute -right-8 top-8 size-[310px] rounded-full border border-white/10" />
        <div className="absolute -bottom-48 -left-20 size-[460px] rounded-full bg-indigo/20 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-[15px] bg-indigo"><Recycle size={23} /></span>
          <div><p className="text-sm font-extrabold tracking-[0.17em]">SIMBAS</p><p className="mt-1 text-[10px] text-white/55">Bank Sampah</p></div>
        </div>
        <div className="relative max-w-xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-[#dedaff]">
            <Sparkles size={13} /> Kelola lebih bijak, tumbuh bersama
          </span>
          <h1 className="text-4xl font-semibold leading-[1.18] tracking-tight xl:text-[48px]">
            Setiap sampah punya <span className="text-[#aaa4ff]">nilai.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
            Catat setoran, pantau tabungan, dan kelola bank sampah dalam satu ruang yang sederhana.
          </p>
          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-[#c8c3ff]"><ShieldCheck size={19} /></span>
            <div><p className="text-xs font-semibold">Akses aman dan terjaga</p><p className="mt-1 text-[10px] text-white/55">Data nasabah hanya terlihat oleh akun berwenang.</p></div>
          </div>
        </div>
        <p className="relative text-[10px] text-white/40">SIMBAS · Sistem Informasi Manajemen Bank Sampah</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[390px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-[14px] bg-indigo text-white"><Recycle size={21} /></span>
            <div><p className="text-sm font-extrabold tracking-[0.15em] text-navy">SIMBAS</p><p className="mt-1 text-[10px] text-[#858ba1]">Bank Sampah</p></div>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-indigo">Selamat datang</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy">Masuk ke akun</h2>
          <p className="mt-2 text-sm leading-6 text-[#858ba1]">Gunakan email dan kata sandi yang diberikan oleh petugas.</p>
          <div className="mt-7"><Notice error={error ? "Email atau kata sandi tidak sesuai, atau akun tidak aktif." : undefined} /></div>
          <LoginForm />
          <p className="mt-7 text-center text-[11px] leading-5 text-[#9298aa]">Belum memiliki akun? Hubungi petugas bank sampah Anda.</p>
        </div>
      </section>
    </main>
  );
}
