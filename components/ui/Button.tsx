import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "outline";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/**
 * Button — observatory-grade.
 * - primary: navy filled (most actions)
 * - accent: orange filled — reserved for ONE primary CTA per page
 * - secondary: white card outline
 * - outline / ghost: subdued
 */
export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent-blue/40 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
    const variants: Record<Variant, string> = {
      primary: "bg-ink text-white hover:bg-ink-700 shadow-soft",
      secondary:
        "bg-white text-ink border border-surface-border hover:border-ink/30 hover:bg-surface-canvas shadow-soft",
      accent:
        "bg-accent-orange-cta text-white hover:bg-brand-orange-ace-hover shadow-soft",
      ghost: "bg-transparent text-text-secondary hover:bg-surface-canvas hover:text-ink",
      outline:
        "bg-transparent text-ink border border-ink/20 hover:border-ink/40 hover:bg-surface-canvas",
    };
    const sizes: Record<Size, string> = {
      sm: "h-8 px-3.5 text-xs",
      md: "h-10 px-5 text-sm",
      lg: "h-12 px-7 text-sm",
    };
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
