import { Activity, CheckCircle2, FileSignature, Send } from "lucide-react";
import { Phase } from "@prisma/client";

import { cn } from "@/lib/utils";

type StepDef = {
  phase: Phase;
  icon: typeof Activity;
  label: string;
};

// Exported so the page header can render a legend using the same icons +
// labels — single source of truth for phase visualization.
export const PHASE_STEPS: ReadonlyArray<StepDef> = [
  { phase: Phase.SIGNED, icon: FileSignature, label: "Firmado" },
  { phase: Phase.CONTACTED, icon: Send, label: "Contactado" },
  { phase: Phase.ACTIVE, icon: Activity, label: "Activo" },
  { phase: Phase.RESULT, icon: CheckCircle2, label: "Resultado" },
];

const STEPS = PHASE_STEPS;

const ORDER: Record<Phase, number> = {
  SIGNED: 0,
  CONTACTED: 1,
  ACTIVE: 2,
  RESULT: 3,
};

// Per-phase color classes. Each phase owns a Tailwind color (blue → amber →
// emerald → violet) so the pipeline reads as a journey with milestones,
// not as a single-color progress bar. State (done/current/future) modulates
// intensity within the phase's color. Strings are written literally — needed
// so Tailwind's JIT picks them up (no dynamic class composition).
export const PHASE_CLS: Record<
  Phase,
  { done: string; current: string; future: string; legend: string; line: string }
> = {
  SIGNED: {
    done: "border-blue-500 bg-blue-500 text-white",
    current: "border-blue-500 bg-blue-500/10 text-blue-600 ring-2 ring-blue-500/25",
    future: "border-blue-200 bg-blue-50 text-blue-300",
    legend: "border-blue-500/40 bg-blue-500/10 text-blue-600",
    line: "bg-blue-500",
  },
  CONTACTED: {
    done: "border-amber-500 bg-amber-500 text-white",
    current: "border-amber-500 bg-amber-500/10 text-amber-600 ring-2 ring-amber-500/25",
    future: "border-amber-200 bg-amber-50 text-amber-300",
    legend: "border-amber-500/40 bg-amber-500/10 text-amber-600",
    line: "bg-amber-500",
  },
  ACTIVE: {
    done: "border-emerald-500 bg-emerald-500 text-white",
    current: "border-emerald-500 bg-emerald-500/10 text-emerald-600 ring-2 ring-emerald-500/25",
    future: "border-emerald-200 bg-emerald-50 text-emerald-300",
    legend: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
    line: "bg-emerald-500",
  },
  RESULT: {
    done: "border-violet-500 bg-violet-500 text-white",
    current: "border-violet-500 bg-violet-500/10 text-violet-600 ring-2 ring-violet-500/25",
    future: "border-violet-200 bg-violet-50 text-violet-300",
    legend: "border-violet-500/40 bg-violet-500/10 text-violet-600",
    line: "bg-violet-500",
  },
};

type DotState = "done" | "current" | "future";

function stateFor(idx: number, currentIdx: number): DotState {
  if (idx < currentIdx) return "done";
  if (idx === currentIdx) return "current";
  return "future";
}

// Inline 4-phase pipeline. Each phase has its own color (blue/amber/emerald/
// violet) so the row reads as a journey; state controls intensity (filled
// done, ringed current, muted future). Closed agreements collapse to gray
// since there's no current step to act on.
export function PipelineCell({
  phase,
  closed,
}: {
  phase: Phase;
  closed?: boolean;
}) {
  const currentIdx = ORDER[phase];
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Fase: ${STEPS[currentIdx]?.label ?? phase}`}
    >
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const state = stateFor(idx, currentIdx);
        const cls = PHASE_CLS[step.phase];
        return (
          <div key={step.phase} className="flex items-center" title={step.label}>
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                closed && "border-border bg-surface-canvas text-text-subtle",
                !closed && state === "done" && cls.done,
                !closed && state === "current" && cls.current,
                !closed && state === "future" && cls.future,
              )}
            >
              <Icon className="size-2.5" strokeWidth={2.5} aria-hidden />
            </span>
            {idx < STEPS.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "block h-px w-2.5",
                  !closed && state === "done" ? cls.line : "bg-border",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
