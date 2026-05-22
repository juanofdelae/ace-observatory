import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * QuickAccessCard — modular tablet-style "click-here-to-enter-X" panel.
 *
 * Used on the Overview page as a 2x2 / 4-up row of large entry tiles
 * (Atlas / Reports / Editions / Participants). Each card is a full-area
 * Next.js link with a colored icon chip, eyebrow label, headline, supporting
 * descriptor and an arrow that translates on hover.
 *
 * Variants set the icon-chip background + the corner glow, picked from the
 * institutional accent palette: navy, blue, orange, teal.
 */

export type QuickAccessAccent = "navy" | "blue" | "orange" | "teal" | "purple" | "amber";

interface Props {
  href: string;
  label: string;          // small uppercase eyebrow
  title: string;          // bold headline
  description: string;    // supporting copy
  icon: LucideIcon;
  accent?: QuickAccessAccent;
  className?: string;
}

const accentMap: Record<
  QuickAccessAccent,
  {
    chipBg: string;
    chipFg: string;
    glow: string;
    ringHover: string;
  }
> = {
  navy: {
    chipBg: "bg-ink",
    chipFg: "text-white",
    glow: "from-ink/8 via-transparent",
    ringHover: "group-hover:border-ink/30",
  },
  blue: {
    chipBg: "bg-accent-blue",
    chipFg: "text-white",
    glow: "from-accent-blue/12 via-transparent",
    ringHover: "group-hover:border-accent-blue/40",
  },
  orange: {
    chipBg: "bg-accent-orange-cta",
    chipFg: "text-white",
    glow: "from-accent-orange-cta/12 via-transparent",
    ringHover: "group-hover:border-accent-orange-cta/40",
  },
  teal: {
    chipBg: "bg-accent-teal-soft",
    chipFg: "text-white",
    glow: "from-accent-teal-soft/12 via-transparent",
    ringHover: "group-hover:border-accent-teal-soft/40",
  },
  purple: {
    chipBg: "bg-accent-purple-soft",
    chipFg: "text-white",
    glow: "from-accent-purple-soft/12 via-transparent",
    ringHover: "group-hover:border-accent-purple-soft/40",
  },
  amber: {
    chipBg: "bg-accent-amber",
    chipFg: "text-white",
    glow: "from-accent-amber/12 via-transparent",
    ringHover: "group-hover:border-accent-amber/40",
  },
};

export function QuickAccessCard({
  href,
  label,
  title,
  description,
  icon: Icon,
  accent = "navy",
  className,
}: Props) {
  const a = accentMap[accent];

  return (
    <Link
      href={href}
      className={cn(
        "group relative isolate flex h-full flex-col rounded-2xl bg-white border border-surface-border p-5 md:p-6 shadow-card",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-card-hover",
        a.ringHover,
        className,
      )}
    >
      {/* Diagonal corner glow — subtle accent bleed from the bottom-left.
          Stays under everything via -z-10. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 rounded-2xl bg-linear-to-tr opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          a.glow,
          "to-transparent",
        )}
      />

      {/* Top row: icon chip + arrow */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-soft",
            a.chipBg,
          )}
        >
          <Icon size={20} strokeWidth={1.75} className={a.chipFg} />
        </div>
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-text-muted",
            "border border-surface-border bg-surface-canvas",
            "transition-all duration-200 group-hover:text-ink group-hover:border-ink/30 group-hover:bg-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
          )}
          aria-hidden
        >
          <ArrowUpRight size={16} strokeWidth={2} />
        </div>
      </div>

      {/* Eyebrow */}
      <div className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
        {label}
      </div>

      {/* Headline */}
      <h3 className="mt-1.5 text-[18px] md:text-[19px] font-bold text-ink tracking-tight leading-tight">
        {title}
      </h3>

      {/* Descriptor */}
      <p className="mt-2 text-[12.5px] leading-relaxed text-text-secondary">
        {description}
      </p>
    </Link>
  );
}

/**
 * QuickAccessGrid — convenience wrapper. Defaults to 4-up at desktop,
 * 2-up at tablet, single column on mobile. Pass `cols={3}` for the 6-card
 * layout used on the redesigned Overview (2 rows × 3 cols on desktop).
 */
export function QuickAccessGrid({
  children,
  className,
  cols = 4,
}: {
  children: React.ReactNode;
  className?: string;
  cols?: 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-4",
        cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
