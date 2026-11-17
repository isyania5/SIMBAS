"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirect: false,
        callbackUrl: "/",
      });
      if (!result?.ok || result.error) {
        setError("Email atau kata sandi tidak sesuai, atau akun tidak aktif.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi layanan masuk. Silakan coba kembali.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-navy">Alamat email</span>
          <input name="email" type="email" required autoComplete="email" maxLength={255} placeholder="nama@email.com" className="w-full rounded-xl border border-[#e6e8f0] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#b3b7c5] focus:border-indigo focus:ring-4 focus:ring-indigo/10" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-navy">Kata sandi</span>
          <input name="password" type="password" required autoComplete="current-password" maxLength={72} placeholder="Masukkan kata sandi" className="w-full rounded-xl border border-[#e6e8f0] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#b3b7c5] focus:border-indigo focus:ring-4 focus:ring-indigo/10" />
        </label>
        {error && <p role="alert" className="rounded-xl border border-[#f2c3b9] bg-[#fff3ef] px-4 py-3 text-sm text-[#8b4d40]">{error}</p>}
        <button disabled={pending} className="flex w-full items-center justify-center rounded-xl bg-indigo px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(98,88,216,0.2)] transition hover:bg-[#5248c4] disabled:cursor-not-allowed disabled:opacity-65">
          {pending ? "Memeriksa akun..." : "Masuk"}
        </button>
      </form>
    </>
  );
}
