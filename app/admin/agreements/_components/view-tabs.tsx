import Link from "next/link";

import {
  type AgreementFilters,
  type AgreementView,
  VIEW_OPTIONS,
  serializeFilters,
} from "@/lib/admin/agreements/url-state";
import { cn } from "@/lib/utils";

// URL-state tabs. Each tab is a Link that preserves all other filters and
// only swaps the `view` param. Counts come from the parent query so the
// badges always reflect the current filter set.
export function ViewTabs({
  filters,
  counts,
  basePath = "/admin/agreements",
}: {
  filters: AgreementFilters;
  counts: Record<AgreementView, number>;
  basePath?: string;
}) {
  return (
    <div
      className="border-border flex items-center gap-0 overflow-x-auto border-b"
      role="tablist"
    >
      {VIEW_OPTIONS.map((opt) => {
        const active = filters.view === opt.value;
        const count = counts[opt.value] ?? 0;
        const qs = serializeFilters({ ...filters, view: opt.value });
        const href = qs ? `${basePath}?${qs}` : basePath;
        return (
          <Link
            key={opt.value}
            href={href}
            role="tab"
            aria-selected={active}
            className={cn(
              "relative -mb-px flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[13px] transition-colors",
              active
                ? "text-text border-primary border-b-2 font-medium"
                : "text-text-muted hover:text-text border-b-2 border-transparent",
            )}
          >
            <span>{opt.label}</span>
            <span
              className={cn(
                "inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-canvas text-text-muted",
              )}
            >
              {count > 999 ? "999+" : count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
