import { ChevronRight } from "lucide-react";

import { PHASE_STEPS } from "./pipeline-cell";

// Discrete legend rendered above the table so users learn what the inline
// pipeline icons mean without hovering each cell. Uses the same PHASE_STEPS
// constant as PipelineCell — change icons there, the legend follows.
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
            <span className="border-border bg-surface-canvas text-text-subtle inline-flex h-4 w-4 items-center justify-center rounded-full border">
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
