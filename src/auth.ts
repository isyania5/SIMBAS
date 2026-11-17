import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { getDb } from "@/db";
import { nasabah, users } from "@/db/schema";

export const authOptions: NextAuthOptions = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [
    CredentialsProvider({
      name: "Kredensial",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Kata sandi", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.email().max(255), password: z.string().min(1).max(72) })
          .safeParse(credentials);
        if (!parsed.success || Buffer.byteLength(parsed.data.password, "utf8") > 72) return null;

        const [user] = await getDb()
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email.trim().toLowerCase()))
          .limit(1);
        if (!user || !user.isActive || !(await compare(parsed.data.password, user.passwordHash))) {
          return null;
        }

        let nasabahId: string | null = null;
        if (user.role === "warga") {
          const [profile] = await getDb()
            .select({ id: nasabah.id })
            .from(nasabah)
            .where(eq(nasabah.userId, user.id))
            .limit(1);
          if (!profile) return null;
          nasabahId = profile.id;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          nasabahId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (!user.id) throw new Error("ID pengguna tidak tersedia untuk sesi.");
        token.id = user.id;
        token.role = user.role;
        token.nasabahId = user.nasabahId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.nasabahId = token.nasabahId;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
