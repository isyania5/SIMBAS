import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: "admin" | "warga";
    nasabahId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: "admin" | "warga";
      nasabahId: string | null;
    } & NonNullable<DefaultSession["user"]>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "warga";
    nasabahId: string | null;
  }
}

import type { DefaultSession } from "next-auth";
