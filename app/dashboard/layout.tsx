import { requireDashboardUser } from "@/lib/auth/service";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireDashboardUser();
  return <DashboardShell viewer={viewer}>{children}</DashboardShell>;
}
