import Link from "next/link";

import { SidebarNav } from "@/components/admin-layout/sidebar-nav";
import { UserMenu } from "@/components/admin-layout/user-menu";
import type { SidebarCounters } from "@/lib/admin/queries/sidebar-counters";
import { cn } from "@/lib/utils";

type SidebarProps = {
  user: { email: string; name?: string | null; role: string };
  counters?: SidebarCounters;
  className?: string;
};

// Dark navy admin sidebar — matches the public Observatory's signature
// "premium tablet" treatment. Inherits the public site's sidebar-* tokens
// (bg #0b1f3a, idle #9db0cb, hover #162e4a, accent #f97316).
export function Sidebar({ user, counters, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "bg-sidebar-bg flex h-full w-full flex-col text-white shadow-sidebar",
        className,
      )}
    >
      <div className="border-sidebar-border flex h-16 items-center border-b px-6">
        <Link href="/admin/agreements" className="flex items-center gap-2.5">
          <span className="bg-sidebar-accent text-white inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold tracking-tight">
            AB
          </span>
          <span className="text-sidebar-active text-[15px] font-semibold tracking-tight">
            ACE Bridge
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-4 pb-4">
        <SidebarNav counters={counters} />
      </div>

      <div className="border-sidebar-border border-t px-3 py-3">
        <UserMenu email={user.email} name={user.name} role={user.role} />
      </div>
    </aside>
  );
}
