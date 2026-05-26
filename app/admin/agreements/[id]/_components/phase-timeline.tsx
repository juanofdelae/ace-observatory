import { Phase } from "@prisma/client";

import { PHASE_CLS, PHASE_STEPS } from "../../_components/pipeline-cell";
import { cn } from "@/lib/utils";

const ORDER: Record<Phase, number> = {
  SIGNED: 0,
  CONTACTED: 1,
  ACTIVE: 2,
  RESULT: 3,
};

type StatusChange = {
  fromPhase: Phase | null;
  toPhase: Phase | null;
  createdAt: Date;
};

type Props = {
  currentPhase: Phase;
  signedDate: Date;
  resultDate: Date | null;
  resultSummary: string | null;
  documentUrl: string | null;
  statusChanges: ReadonlyArray<StatusChange>;
  closed?: boolean;
};

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

// Returns the earliest StatusChange that LANDED the agreement in this phase
// (toPhase === phase). Used to date each step.
function entryDate(phase: Phase, changes: ReadonlyArray<StatusChange>): Date | null {
  const match = changes
    .filter((c) => c.toPhase === phase)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  return match?.createdAt ?? null;
}

function relative(from: Date): string {
  const days = Math.floor((Date.now() - from.getTime()) / 86_400_000);
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} mes${months > 1 ? "es" : ""}`;
  const years = Math.floor(days / 365);
  return `hace ${years} año${years > 1 ? "s" : ""}`;
}

// Vertical phase stepper for the agreement detail page. Each step is a
// colored dot (or icon in dot) connected by a vertical line; completed
// steps are filled, current step gets a ring + extra detail block, future
// steps stay muted. Inspired by the wizard-style "checkout/booking"
// pattern — phases read as a journey, not a status snapshot.
export function PhaseTimeline({
  currentPhase,
  signedDate,
  resultDate,
  resultSummary,
  documentUrl,
  statusChanges,
  closed,
}: Props) {
  const currentIdx = ORDER[currentPhase];

  return (
    <ol className="relative space-y-0">
      {PHASE_STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const muted = closed;
        const cls = PHASE_CLS[step.phase];

        // Per-step factual details — kept short. Current step gets the
        // richest info (what's pending); past steps get the date they were
        // entered; future steps stay silent.
        const detail = stepDetail(step.phase, {
          isDone,
          isCurrent,
          signedDate,
          resultDate,
          resultSummary,
          documentUrl,
          changes: statusChanges,
        });

        return (
          <li
            key={step.phase}
            className="relative grid grid-cols-[32px_1fr] gap-x-4 pb-14 last:pb-0"
          >
            {/* Vertical connector — drawn from this dot's center toward the
                next dot. Color: phase color if this step is done, otherwise
                muted border. */}
            {idx < PHASE_STEPS.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[15px] top-8 bottom-0 w-0.5",
                  muted || !isDone ? "bg-border" : cls.line,
                )}
              />
            ) : null}

            {/* Dot */}
            <span
              className={cn(
                "z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                muted && "border-border bg-surface-canvas text-text-subtle",
                !muted && isDone && cls.done,
                !muted && isCurrent && cls.current,
                !muted && !isDone && !isCurrent && cls.future,
              )}
            >
              <Icon className="size-3.5" strokeWidth={2.5} aria-hidden />
            </span>

            {/* Label + factual detail */}
            <div className="min-w-0 pt-1">
              <p
                className={cn(
                  isCurrent ? "text-ink text-base font-semibold" : "text-text-muted text-sm font-medium",
                  muted && "text-text-subtle",
                )}
              >
                {step.label}
                {isCurrent ? (
                  <span className="ml-2 text-[11px] font-semibold uppercase tracking-widest text-text-subtle">
                    actual
                  </span>
                ) : null}
              </p>
              {detail ? (
                <div className="text-text-muted mt-1.5 space-y-0.5 text-[13px] leading-relaxed">
                  {detail}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function stepDetail(
  phase: Phase,
  ctx: {
    isDone: boolean;
    isCurrent: boolean;
    signedDate: Date;
    resultDate: Date | null;
    resultSummary: string | null;
    documentUrl: string | null;
    changes: ReadonlyArray<StatusChange>;
  },
): React.ReactNode {
  if (phase === Phase.SIGNED) {
    return (
      <>
        <p>{dateFmt.format(ctx.signedDate)}</p>
        <p>{ctx.documentUrl ? "PDF registrado" : "Sin documento"}</p>
      </>
    );
  }
  const entered = entryDate(phase, ctx.changes);
  if (phase === Phase.RESULT) {
    if (ctx.resultDate || ctx.resultSummary) {
      return (
        <>
          {ctx.resultDate ? <p>{dateFmt.format(ctx.resultDate)}</p> : null}
          {ctx.resultSummary ? (
            <p className="line-clamp-2">{ctx.resultSummary}</p>
          ) : null}
        </>
      );
    }
    return ctx.isCurrent ? <p>Pendiente registrar el resultado.</p> : null;
  }

  if (entered) {
    return (
      <>
        <p>Desde {dateFmt.format(entered)}</p>
        <p>{relative(entered)}</p>
      </>
    );
  }
  if (ctx.isCurrent) return <p>En curso, sin transición registrada.</p>;
  if (ctx.isDone) return <p>Completado.</p>;
  return null;
}
