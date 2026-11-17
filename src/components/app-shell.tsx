import Link from "next/link";
import {
  Banknote,
  ChevronRight,
  ClipboardList,
  FileChartColumn,
  LayoutDashboard,
  Recycle,
  UsersRound,
  Wallet,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

type Role = "admin" | "warga";

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/nasabah", label: "Data Nasabah", icon: UsersRound },
  { href: "/jenis-sampah", label: "Jenis Sampah", icon: Recycle },
  { href: "/setoran", label: "Setoran Sampah", icon: Banknote },
  { href: "/penarikan", label: "Penarikan", icon: Wallet },
  { href: "/laporan", label: "Laporan", icon: FileChartColumn },
];

const residentLinks = [
  { href: "/warga/dashboard", label: "Dashboard Saya", icon: LayoutDashboard },
  { href: "/warga/riwayat", label: "Riwayat Transaksi", icon: ClipboardList },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-[14px] bg-indigo text-white shadow-[0_7px_16px_rgba(98,88,216,0.28)]">
        <Recycle size={21} strokeWidth={2.2} />
      </span>
      <span>
        <span className="block text-[15px] font-extrabold tracking-[0.14em] text-navy">SIMBAS</span>
        <span className="mt-0.5 block text-[10px] tracking-wide text-[#858ba1]">Bank Sampah</span>
      </span>
    </Link>
  );
}

export function AppShell({
  children,
  name,
  role,
}: {
  children: React.ReactNode;
  name: string;
  role: Role;
}) {
  const links = role === "admin" ? adminLinks : residentLinks;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <div className="min-h-screen bg-canvas">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-[#eceef5] bg-white px-5 py-6 lg:flex">
        <Brand />
        <div className="mt-9">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a0a5b7]">Menu utama</p>
          <nav className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#737b94] transition hover:bg-[#f4f2ff] hover:text-indigo"
              >
                <Icon size={17} strokeWidth={1.8} />
                <span className="flex-1">{label}</span>
                <ChevronRight className="opacity-0 transition group-hover:opacity-70" size={14} />
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto rounded-2xl bg-[#f6f5ff] p-4">
          <div className="mb-2 flex items-center gap-2 text-indigo">
            <Recycle size={16} />
            <span className="text-xs font-bold">Sampah jadi berkah</span>
          </div>
          <p className="text-[11px] leading-5 text-[#747b95]">Catat setiap setoran dan pantau tabungan dengan mudah.</p>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="no-print sticky top-0 z-20 border-b border-[#eceef5] bg-white/90 backdrop-blur-xl">
          <div className="flex h-[68px] items-center justify-between px-4 sm:px-7 lg:px-9">
            <div className="lg:hidden"><Brand /></div>
            <div className="hidden text-xs text-[#858ba1] lg:block">
              Sistem Informasi <span className="mx-1.5 text-[#c8cada]">/</span> <span className="font-semibold text-navy">{role === "admin" ? "Panel petugas" : "Akun nasabah"}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-44 truncate text-xs font-bold text-navy">{name}</p>
                <p className="mt-1 text-[10px] text-[#858ba1]">{role === "admin" ? "Admin / Petugas" : "Warga / Nasabah"}</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-full bg-lavender text-xs font-bold text-indigo">{initials || "S"}</span>
              <LogoutButton />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-[#f1f2f7] px-3 py-2 lg:hidden">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold text-[#737b94] hover:bg-lavender hover:text-indigo">
                <Icon size={14} />{label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[1500px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9">
          {children}
          <footer className="mt-12 border-t border-[#e9ebf2] py-5 text-center text-[10px] text-[#9a9fb0]">
            SIMBAS · Sistem Informasi Manajemen Bank Sampah
          </footer>
        </main>
      </div>
    </div>
  );
}
