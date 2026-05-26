"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/admin/nav";
import type { SidebarCounters } from "@/lib/admin/queries/sidebar-counters";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  /** Optional callback for closing the mobile sheet after a link click. */
  onNavigate?: () => void;
  counters?: SidebarCounters;
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Map nav href → counter key. Null counters (or 0) hide the badge.
function counterFor(href: string, counters?: SidebarCounters): number | null {
  if (!counters) return null;
  if (href === "/admin/agreements") return counters.needsAttention || null;
  if (href === "/admin/support") return counters.openSupport || null;
  if (href === "/admin/surveys") return counters.pendingSurveys || null;
  return null;
}

// Dark-theme nav rows. Idle items are muted blue-gray, hover surfaces a
// subtle navy panel, active item gets a left-orange-rail + white text
// (mirroring the public Observatory sidebar's "current page" treatment).
export function SidebarNav({ onNavigate, counters }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        const count = counterFor(item.href, counters);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-hover text-sidebar-active font-semibold"
                : "text-sidebar-idle hover:bg-sidebar-hover hover:text-sidebar-active",
            )}
          >
            {active ? (
              <span
                aria-hidden
                className="bg-sidebar-accent absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-r-full"
              />
            ) : null}
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0 transition-colors",
                active
                  ? "text-sidebar-accent"
                  : "text-sidebar-idle group-hover:text-sidebar-active",
              )}
              aria-hidden
              strokeWidth={1.75}
            />
            <span className="flex-1 truncate">{item.label}</span>
            {count !== null ? (
              <span
                className={cn(
                  "ml-auto inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                  item.href === "/admin/agreements"
                    ? "bg-sidebar-accent text-white"
                    : "bg-sidebar-hover text-sidebar-active border-sidebar-border border",
                )}
                aria-label={`${count} pendientes`}
              >
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
