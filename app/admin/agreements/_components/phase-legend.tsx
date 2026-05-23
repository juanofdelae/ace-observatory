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
    <div className="text-text-subtle flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="text-text-muted text-[10px] font-semibold tracking-widest uppercase">
        Fases
      </span>
      {PHASE_STEPS.map((step, idx) => {
        const Icon = step.icon;
        return (
          <span key={step.phase} className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex h-4 w-4 items-center justify-center rounded-full border",
                PHASE_CLS[step.phase].legend,
              )}
            >
              <Icon className="size-2" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-text-muted">{step.label}</span>
            {idx < PHASE_STEPS.length - 1 ? (
              <ChevronRight className="text-text-subtle size-3" aria-hidden />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
