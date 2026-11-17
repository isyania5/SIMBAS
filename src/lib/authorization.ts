import "server-only";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { nasabah, users } from "@/db/schema";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const [account] = await getDb().select({
    id: users.id,
    name: users.name,
    role: users.role,
    isActive: users.isActive,
  }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!account?.isActive) redirect("/login");
  if (account.role === "admin") {
    return { ...session.user, id: account.id, name: account.name, role: account.role, nasabahId: null };
  }
  const [profile] = await getDb().select({ id: nasabah.id }).from(nasabah)
    .where(eq(nasabah.userId, account.id)).limit(1);
  if (!profile) redirect("/login");
  return { ...session.user, id: account.id, name: account.name, role: account.role, nasabahId: profile.id };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/warga/dashboard");
  return user;
}

export async function requireResident() {
  const user = await requireUser();
  if (user.role !== "warga" || !user.nasabahId) redirect("/dashboard");
  return user;
}
