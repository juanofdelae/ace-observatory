import Link from "next/link";

import { SidebarNav } from "@/components/admin-layout/sidebar-nav";
import { UserMenu } from "@/components/admin-layout/user-menu";
import { cn } from "@/lib/utils";

type SidebarProps = {
  user: { email: string; name?: string | null; role: string };
  className?: string;
};

export function Sidebar({ user, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "bg-muted/50 border-sidebar-border flex h-full w-full flex-col border-r",
        className,
      )}
    >
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold tracking-tight">
            AB
          </span>
          <span className="text-text text-[15px] font-semibold tracking-tight">ACE Bridge</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
        <SidebarNav />
      </div>

      <div className="px-3 pb-3">
        <UserMenu email={user.email} name={user.name} role={user.role} />
      </div>
    </aside>
  );
}
