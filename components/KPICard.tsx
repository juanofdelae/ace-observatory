import { cn, formatNumber } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  accent?: "navy" | "blue" | "turquoise" | "orange" | "purple" | "amber";
  size?: "md" | "lg";
  className?: string;
}

const accentMap: Record<
  NonNullable<Props["accent"]>,
  { bg: string; fg: string; stripe: string }
> = {
  navy:      { bg: "bg-ink/8",                  fg: "text-ink",                stripe: "bg-ink"             },
  blue:      { bg: "bg-accent-blue/10",         fg: "text-accent-blue",        stripe: "bg-accent-blue"     },
  turquoise: { bg: "bg-accent-teal-soft/10",    fg: "text-accent-teal-soft",   stripe: "bg-accent-teal-soft"},
  orange:    { bg: "bg-accent-orange-cta/10",   fg: "text-accent-orange-cta",  stripe: "bg-accent-orange-cta"},
  purple:    { bg: "bg-accent-purple-soft/10",  fg: "text-accent-purple-soft", stripe: "bg-accent-purple-soft"},
  amber:     { bg: "bg-accent-amber/10",        fg: "text-accent-amber",       stripe: "bg-accent-amber"    },
};

/**
 * KPICard — premium tablet-style stat panel.
 *
 * Visual ladder:
 * - tiny uppercase tracked label
 * - massive tabular-numeral figure (32px / 40px on `size="lg"`)
 * - optional one-line hint
 * - colored icon chip top-right
 * - accent stripe in the top-left corner
 *
 * Uses `font-feature-settings: tnum` (inherited from globals.css) so digits
 * align across cards in a strip — important for the hero KPI ribbon.
 */
export function KPICard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "navy",
  size = "md",
  className,
}: Props) {
  const a = accentMap[accent];
  const isLg = size === "lg";

  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden",
        "transition-all duration-200 ease-out hover:shadow-card-hover hover:translate-y-[-2px]",
        isLg ? "p-6 md:p-7" : "p-5 md:p-6",
        className,
      )}
    >
      {/* Accent stripe — top-left corner. Slightly thicker on `lg` for
          visual heft alongside the bigger number. */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 rounded-br-xl",
          a.stripe,
          isLg ? "h-[5px] w-14" : "h-1 w-12",
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
          {label}
        </div>
        {Icon && (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center shrink-0",
              a.bg,
              isLg ? "w-10 h-10" : "w-9 h-9",
            )}
          >
            <Icon size={isLg ? 19 : 18} strokeWidth={1.75} className={a.fg} />
          </div>
        )}
      </div>

      <div
        className={cn(
          "font-bold text-ink tracking-tight counter-up leading-none tabular-nums",
          isLg ? "mt-6 text-kpi-lg" : "mt-5 text-kpi",
        )}
        style={{ fontFeatureSettings: '"tnum", "ss01"' }}
      >
        {typeof value === "number" ? formatNumber(value) : value}
      </div>

      {hint && (
        <div
          className={cn(
            "text-text-secondary leading-relaxed",
            isLg ? "mt-3 text-[12.5px]" : "mt-2 text-xs",
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export function KPIGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {children}
    </div>
  );
}
