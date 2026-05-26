import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { PHASE_CLS, PHASE_STEPS } from "./pipeline-cell";

// Discrete legend rendered above the table so users learn what the inline
// pipeline icons mean without hovering each cell. Uses the same PHASE_STEPS
// + PHASE_CLS constants as PipelineCell — change icons or colors there, the
// legend follows. Each phase icon shows in its phase color so the legend
// doubles as a color key.
export function PhaseLegend() {
  return (
    <div className="text-text-subtle flex flex-wrap items-center gap-2 text-xs">
      <span className="text-text-muted text-xs font-semibold tracking-widest uppercase">
        Fases
      </span>
      {PHASE_STEPS.map((step, idx) => {
        const Icon = step.icon;
        return (
          <span key={step.phase} className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full border",
                PHASE_CLS[step.phase].legend,
              )}
            >
              <Icon className="size-2.5" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-text-muted text-sm">{step.label}</span>
            {idx < PHASE_STEPS.length - 1 ? (
              <ChevronRight className="text-text-subtle size-3.5" aria-hidden />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
