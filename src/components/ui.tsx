import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CircleDashed } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo">{eyebrow}</p>
        <h1 className="text-[26px] font-bold tracking-tight text-navy sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#858ba1]">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[#eceef5] bg-white p-5 shadow-[0_6px_24px_rgba(34,43,69,0.035)] sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-bold text-navy">{title}</h2>}
            {description && <p className="mt-1 text-xs leading-5 text-[#858ba1]">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "lavender",
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: "lavender" | "peach" | "navy";
}) {
  const styles = {
    lavender: "bg-[#f4f2ff] text-indigo",
    peach: "bg-[#fff2ee] text-[#bd7464]",
    navy: "bg-[#eef0f7] text-navy",
  };
  return (
    <div className="rounded-2xl border border-[#eceef5] bg-white p-5 shadow-[0_6px_24px_rgba(34,43,69,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#858ba1]">{label}</p>
          <p className="mt-3 text-[22px] font-bold tracking-tight text-navy sm:text-2xl">{value}</p>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-[11px] text-[#858ba1]">{detail}</p>
    </div>
  );
}

export function Notice({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  const message = error || success;
  if (!message) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
        error
          ? "border-[#f2c3b9] bg-[#fff3ef] text-[#8b4d40]"
          : "border-[#dcd8ff] bg-[#f2f0ff] text-[#5147bd]"
      }`}
    >
      {message}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  href,
  linkText,
}: {
  title: string;
  description: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#dfe2ed] bg-[#fbfbfe] px-5 py-10 text-center">
      <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-lavender text-indigo">
        <CircleDashed size={19} />
      </span>
      <h3 className="text-sm font-bold text-navy">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#858ba1]">{description}</p>
      {href && linkText && (
        <Link href={href} className="mt-4 text-xs font-bold text-indigo hover:underline">{linkText}</Link>
      )}
    </div>
  );
}

export function TransactionBadge({ jenis }: { jenis: "setoran" | "penarikan" }) {
  const deposit = jenis === "setoran";
  const Icon = deposit ? ArrowDownLeft : ArrowUpRight;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
      deposit ? "bg-[#f0eeff] text-indigo" : "bg-[#fff0eb] text-[#a75e50]"
    }`}>
      <Icon size={13} />
      {deposit ? "Setoran" : "Penarikan"}
    </span>
  );
}

export function SearchBox({
  placeholder = "Cari nama atau data...",
  value = "",
}: {
  placeholder?: string;
  value?: string;
}) {
  return (
    <form method="get" className="flex w-full max-w-sm gap-2">
      <input
        name="q"
        defaultValue={value}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 rounded-xl border border-[#e7e9f1] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo focus:ring-2 focus:ring-indigo/10"
      />
      <button className="rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo">Cari</button>
    </form>
  );
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}
