import { Header } from "@/components/admin-layout/header";
import { Sidebar } from "@/components/admin-layout/sidebar";
import { TooltipProvider } from "@/components/admin-ui/tooltip";

/**
 * ⚠️ AUTH TEMPORARILY DISABLED — see proxy.ts header.
 *
 * The session check was removed so testers can walk every admin page without
 * sign-in. The sidebar still renders user-shaped data so the UI doesn't
 * break; it just shows a synthetic "Testing" user.
 */
const TESTING_USER = {
  email: "testing@observatory.ace",
  name: "Testing (open mode)",
  role: "ADMIN" as const,
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <TooltipProvider>
      <div className="bg-bg grid h-full min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
        <div className="hidden md:block">
          <Sidebar user={TESTING_USER} />
        </div>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
