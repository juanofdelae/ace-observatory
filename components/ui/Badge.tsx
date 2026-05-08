import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Variant =
  | "default"
  | "outline"
  | "sample"
  | "sector"
  | "success"
  | "warning"
  | "info"
  | "soft-blue"
  | "soft-orange"
  | "soft-teal"
  | "soft-purple"
  | "soft-amber";

/**
 * Badge — pill-shape, lighter text on tinted background by category.
 */
export function Badge({
  className,
  variant = "default",
  color,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant; color?: string }) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide";
  const variants: Record<Variant, string> = {
    default: "bg-ink/8 text-ink",
    outline: "bg-white text-ink-700 border border-surface-border",
    sample: "sample-ribbon",
    sector: "",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    info: "bg-sky-50 text-sky-800",
    "soft-blue": "bg-accent-blue/10 text-accent-blue",
    "soft-orange": "bg-accent-orange-cta/10 text-accent-orange-cta",
    "soft-teal": "bg-accent-teal-soft/10 text-accent-teal-soft",
    "soft-purple": "bg-accent-purple-soft/10 text-accent-purple-soft",
    "soft-amber": "bg-accent-amber/10 text-accent-amber",
  };
  const style =
    variant === "sector" && color
      ? { backgroundColor: `${color}18`, color, border: `1px solid ${color}33` }
      : undefined;
  return (
    <span
      className={cn(base, variants[variant], className)}
      style={style}
      {...props}
    />
  );
}
