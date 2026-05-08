import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Page header — institutional, generous spacing.
 * Eyebrow in ACE blue, large display title, supporting description.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6",
        className,
      )}
    >
      <div className="max-w-3xl">
        {eyebrow && (
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-3">
            {eyebrow}
          </div>
        )}
        <h1 className="text-display-2 font-bold text-ink tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-text-secondary leading-relaxed">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
