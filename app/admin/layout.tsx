import { redirect } from "next/navigation";

import { Header } from "@/components/admin-layout/header";
import { Sidebar } from "@/components/admin-layout/sidebar";
import { TooltipProvider } from "@/components/admin-ui/tooltip";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <TooltipProvider>
      <div className="bg-bg grid h-full min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
        <div className="hidden md:block">
          <Sidebar
            user={{
              email: session.user.email ?? "",
              name: session.user.name,
              role: session.user.role,
            }}
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
