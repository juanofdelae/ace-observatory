import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

/**
 * Card — premium tablet-style panel.
 * Larger radius (1.25rem / 20px), softer shadow, optional hover lift.
 */
export function Card({
  className,
  hoverLift = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hoverLift?: boolean }) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-surface-border shadow-card transition-all",
        hoverLift && "hover:shadow-card-hover hover:-translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-ink tracking-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-text-secondary mt-1 leading-relaxed", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-6 py-4 border-t border-surface-border flex items-center gap-2", className)}
      {...props}
    />
  );
}
