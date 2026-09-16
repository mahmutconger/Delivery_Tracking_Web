import { redirect } from "next/navigation";

import { hasRequiredRole } from "@/core/auth/roles";
import { getCurrentSession } from "@/core/auth/session";
import { LiveModeProvider } from "@/core/context/live-mode-context";
import { OperationDateProvider } from "@/core/context/operation-date-context";
import { ToastProvider } from "@/core/context/toast-context";
import { AppShell } from "@/shared/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (!hasRequiredRole(session.role, ["admin", "dispatcher"])) {
    redirect("/unauthorized");
  }

  return (
    <OperationDateProvider>
      <LiveModeProvider>
        <ToastProvider>
          <AppShell user={session}>{children}</AppShell>
        </ToastProvider>
      </LiveModeProvider>
    </OperationDateProvider>
  );
}
