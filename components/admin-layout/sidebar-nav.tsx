"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

export type NavCounts = Partial<Record<string, number>>;

type SidebarNavProps = {
  /** Optional callback for closing the mobile sheet after a link click. */
  onNavigate?: () => void;
  /** Counts keyed by nav href (e.g. "/admin/agreements" → 162). */
  counts?: NavCounts;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ onNavigate, counts = {} }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-px">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        const count = counts[item.href];
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
            <span className="truncate flex-1">{item.label}</span>
            {typeof count === "number" && count > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                  active
                    ? "bg-text-subtle/15 text-text"
                    : "bg-surface-canvas text-text-subtle",
                )}
              >
                {count.toLocaleString()}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
