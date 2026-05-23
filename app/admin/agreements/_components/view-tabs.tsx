import Link from "next/link";

import { cn } from "@/lib/utils";

export type ViewKey = "all" | "needs-attention" | "active" | "closed";

const TABS: Array<{ key: ViewKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "needs-attention", label: "Necesitan atención" },
  { key: "active", label: "Activos" },
  { key: "closed", label: "Cerrados" },
];

/**
 * Filter tabs above the agreements table. Server-rendered links — the
 * selected tab swaps the ?view= query param, which the page reads and feeds
 * to listAgreements({ view }). Each tab also shows a count so the user
 * knows where the volume is before clicking.
 */
export function ViewTabs({
  current,
  counts,
}: {
  current: ViewKey;
  counts: Record<ViewKey, number>;
}) {
  return (
    <nav
      role="tablist"
      aria-label="Vistas predefinidas"
      className="border-border flex items-end gap-6 border-b"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === current;
        const href = tab.key === "all" ? "/admin/agreements" : `/admin/agreements?view=${tab.key}`;
        return (
          <Link
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            href={href}
            className={cn(
              "relative -mb-px flex items-center gap-2 border-b-2 pb-3 pt-2 text-sm transition-colors",
              isActive
                ? "border-ink text-text font-medium"
                : "text-text-muted hover:text-text border-transparent",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                isActive ? "bg-ink text-white" : "bg-surface-canvas text-text-muted",
              )}
            >
              {counts[tab.key].toLocaleString()}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
