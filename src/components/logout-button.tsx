"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      aria-label="Keluar"
      title="Keluar"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex size-9 items-center justify-center rounded-xl text-[#858ba1] transition hover:bg-[#fff0eb] hover:text-[#a75e50]"
    >
      <LogOut size={17} />
    </button>
  );
}
