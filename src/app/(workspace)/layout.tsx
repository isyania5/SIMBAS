import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/authorization";

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  return (
    <AppShell name={user.name ?? "Pengguna"} role={user.role}>
      {children}
    </AppShell>
  );
}
