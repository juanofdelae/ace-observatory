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

export function SidebarNav({ onNavigate, counters }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-px">
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
              "group flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
              active
                ? "bg-surface text-text border-border border font-medium"
                : "text-text-muted hover:text-text hover:bg-surface",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                active ? "text-primary" : "text-text-subtle group-hover:text-text-muted",
              )}
              aria-hidden
              strokeWidth={1.75}
            />
            <span className="flex-1 truncate">{item.label}</span>
            {count !== null ? (
              <span
                className={cn(
                  "ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                  item.href === "/admin/agreements"
                    ? "bg-state-warning/15 text-state-warning"
                    : "bg-surface-canvas text-text-muted",
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
