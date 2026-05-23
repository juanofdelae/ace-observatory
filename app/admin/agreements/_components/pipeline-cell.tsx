import { Activity, CheckCircle2, FileSignature, Send } from "lucide-react";
import { Phase } from "@prisma/client";

import { cn } from "@/lib/utils";

type StepDef = {
  phase: Phase;
  icon: typeof Activity;
  label: string;
};

const STEPS: ReadonlyArray<StepDef> = [
  { phase: Phase.SIGNED, icon: FileSignature, label: "Firmado" },
  { phase: Phase.CONTACTED, icon: Send, label: "Contactado" },
  { phase: Phase.ACTIVE, icon: Activity, label: "Activo" },
  { phase: Phase.RESULT, icon: CheckCircle2, label: "Resultado" },
];

const ORDER: Record<Phase, number> = {
  SIGNED: 0,
  CONTACTED: 1,
  ACTIVE: 2,
  RESULT: 3,
};

type DotState = "done" | "current" | "future";

function stateFor(idx: number, currentIdx: number): DotState {
  if (idx < currentIdx) return "done";
  if (idx === currentIdx) return "current";
  return "future";
}

// Inline 4-phase pipeline. Completed steps fill, current step gets a ring,
// future steps are muted. When the agreement is CLOSED everything reads as
// muted — closed agreements have no current step to act on.
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
        const muted = closed;
        return (
          <div key={step.phase} className="flex items-center" title={step.label}>
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                muted &&
                  "border-border bg-surface-canvas text-text-subtle",
                !muted &&
                  state === "done" &&
                  "border-state-active bg-state-active text-white",
                !muted &&
                  state === "current" &&
                  "border-state-active text-state-active bg-state-active/10 ring-2 ring-state-active/20",
                !muted &&
                  state === "future" &&
                  "border-border bg-surface-canvas text-text-subtle",
              )}
            >
              <Icon className="size-2.5" strokeWidth={2.5} aria-hidden />
            </span>
            {idx < STEPS.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "block h-px w-2.5",
                  !muted && state === "done" ? "bg-state-active" : "bg-border",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
