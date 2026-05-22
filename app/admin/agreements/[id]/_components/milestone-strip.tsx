import { Check } from "lucide-react";

import { PHASE_LABELS } from "@/lib/admin/schemas/agreement";
import { cn } from "@/lib/utils";

type PhaseId = "SIGNED" | "CONTACTED" | "ACTIVE" | "RESULT";

const PHASE_ORDER: PhaseId[] = ["SIGNED", "CONTACTED", "ACTIVE", "RESULT"];

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type StatusChange = {
  fromPhase: PhaseId | null;
  toPhase: PhaseId | null;
  createdAt: Date;
};

/**
 * Horizontal milestone bar inspired by the Manorlead "My Orders" reference —
 * shows the agreement's journey through SIGNED → CONTACTED → ACTIVE → RESULT.
 *
 *   ● ───── ● ───── ◐ ╴╴╴╴╴ ○
 *  Past    Past    Now     Future
 *
 * Reached dates are derived from the StatusChange audit log; SIGNED falls
 * back to the agreement's signedDate, RESULT to resultDate.
 */
export function MilestoneStrip({
  currentPhase,
  signedDate,
  resultDate,
  statusChanges,
}: {
  currentPhase: PhaseId;
  signedDate: Date;
  resultDate: Date | null;
  statusChanges: StatusChange[];
}) {
  const reachedDates = computeReachedDates({
    currentPhase,
    signedDate,
    resultDate,
    statusChanges,
  });

  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  const completionPct = Math.round(((currentIdx + 1) / PHASE_ORDER.length) * 100);

  return (
    <section className="border-border bg-surface rounded-xl border p-6">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="text-text-subtle text-[11px] font-medium tracking-widest uppercase">
            Avance del acuerdo
          </p>
          <p className="text-text mt-1 text-sm">
            <span className="text-text text-2xl font-semibold tabular-nums">
              {completionPct}%
            </span>{" "}
            <span className="text-text-muted text-xs">
              {currentIdx + 1} de {PHASE_ORDER.length} fases
            </span>
          </p>
        </div>
        <p className="text-text-muted text-xs">
          Fase actual:{" "}
          <span className="text-text font-medium">{PHASE_LABELS[currentPhase]}</span>
        </p>
      </header>

      <ol className="relative flex items-start justify-between">
        {/* Connector line behind all the nodes */}
        <div
          className="bg-border absolute left-0 right-0 top-[18px] h-px"
          aria-hidden
        />
        {/* Filled portion of the connector (up to current phase) */}
        <div
          className="bg-ink absolute left-0 top-[18px] h-px"
          style={{
            width: `${(currentIdx / (PHASE_ORDER.length - 1)) * 100}%`,
          }}
          aria-hidden
        />

        {PHASE_ORDER.map((phase, i) => {
          const state =
            i < currentIdx ? "done" : i === currentIdx ? "current" : "future";
          const reachedAt = reachedDates[phase];

          return (
            <li
              key={phase}
              className="relative z-10 flex flex-col items-center gap-2"
              style={{ flex: i === 0 || i === PHASE_ORDER.length - 1 ? "0 0 auto" : "1" }}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 transition-colors",
                  state === "done" && "border-ink bg-ink text-white",
                  state === "current" &&
                    "border-ink bg-surface text-ink ring-ink/15 ring-4",
                  state === "future" && "border-border bg-surface text-text-subtle",
                )}
              >
                {state === "done" ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  <span className="text-xs font-semibold tabular-nums">{i + 1}</span>
                )}
              </span>

              <div className="text-center">
                <p
                  className={cn(
                    "text-xs font-medium",
                    state === "future" ? "text-text-subtle" : "text-text",
                  )}
                >
                  {PHASE_LABELS[phase]}
                </p>
                {reachedAt ? (
                  <p className="text-text-muted mt-0.5 text-[10px] tabular-nums">
                    {dateFmt.format(reachedAt)}
                  </p>
                ) : (
                  <p className="text-text-subtle mt-0.5 text-[10px]">—</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Walk the StatusChange log to find when each phase was first entered.
 * SIGNED is implicit at signedDate (the agreement creation moment).
 * RESULT, if reached, can use resultDate as a more semantically meaningful
 * date than the bare audit row.
 */
function computeReachedDates({
  currentPhase,
  signedDate,
  resultDate,
  statusChanges,
}: {
  currentPhase: PhaseId;
  signedDate: Date;
  resultDate: Date | null;
  statusChanges: StatusChange[];
}): Partial<Record<PhaseId, Date>> {
  const out: Partial<Record<PhaseId, Date>> = { SIGNED: signedDate };

  // statusChanges is newest-first; reverse to walk chronologically.
  const chronological = [...statusChanges].reverse();
  for (const change of chronological) {
    if (change.toPhase && !out[change.toPhase]) {
      out[change.toPhase] = change.createdAt;
    }
  }

  if (currentPhase === "RESULT" && resultDate) {
    out.RESULT = resultDate;
  }

  return out;
}
