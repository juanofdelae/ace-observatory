import { Header } from "@/components/admin-layout/header";
import { Sidebar } from "@/components/admin-layout/sidebar";
import { TooltipProvider } from "@/components/admin-ui/tooltip";
import { STUB_USER } from "@/lib/admin/authz";
import { getSidebarCounters } from "@/lib/admin/queries/sidebar-counters";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const counters = await getSidebarCounters();

  return (
    <TooltipProvider>
      <div className="bg-bg grid h-full min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
        <div className="hidden md:block">
          <Sidebar
            user={{
              email: STUB_USER.email,
              name: STUB_USER.name,
              role: STUB_USER.role,
            }}
            counters={counters}
          />
        </div>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
