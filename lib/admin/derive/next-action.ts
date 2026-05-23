import { AlertStatus, Phase } from "@prisma/client";

export type NextActionTone = "urgent" | "warning" | "neutral" | "success" | "muted";

export type NextActionResult = {
  label: string;
  tone: NextActionTone;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / DAY_MS);
}

// Derives the operational next step for an agreement from its current phase,
// alert status, document presence, result data, and recency. Pure function —
// no DB access — so the same logic can run server-side (table render) or
// client-side (optimistic UI). Keep ordering: rules are checked top-down and
// the first match wins.
export function deriveNextAction(input: {
  phase: Phase;
  alertStatus: AlertStatus;
  documentUrl: string | null;
  resultSummary: string | null;
  updatedAt: Date;
}): NextActionResult {
  const { phase, alertStatus, documentUrl, resultSummary, updatedAt } = input;
  const days = daysSince(updatedAt);

  if (alertStatus === AlertStatus.CLOSED) {
    return { label: "Cerrado", tone: "muted" };
  }

  if (phase === Phase.RESULT) {
    if (resultSummary && resultSummary.trim().length > 0) {
      return { label: "Cerrar acuerdo", tone: "success" };
    }
    return { label: "Registrar resultado", tone: "warning" };
  }

  if (alertStatus === AlertStatus.NEEDS_ATTENTION) {
    return { label: "Enviar seguimiento", tone: "urgent" };
  }

  if (phase === Phase.ACTIVE && !documentUrl) {
    return { label: "Subir documento", tone: "warning" };
  }

  if (phase === Phase.ACTIVE && days > 30) {
    return { label: "Agendar reunión", tone: "warning" };
  }

  if (phase === Phase.CONTACTED && days > 14) {
    return { label: "Esperando respuesta", tone: "neutral" };
  }

  if (phase === Phase.SIGNED && days > 30) {
    return { label: "Enviar seguimiento", tone: "warning" };
  }

  if (phase === Phase.SIGNED) {
    return { label: "Contactar parte", tone: "neutral" };
  }

  if (phase === Phase.CONTACTED) {
    return { label: "Activar acuerdo", tone: "neutral" };
  }

  return { label: "Agendar reunión", tone: "neutral" };
}
