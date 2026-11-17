"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl border border-[#e7e8f0] bg-white px-4 py-2.5 text-xs font-bold text-navy transition hover:bg-[#f7f6ff]"
    >
      <Printer size={15} /> Cetak laporan
    </button>
  );
}
