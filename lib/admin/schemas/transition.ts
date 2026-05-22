import { AlertStatus, Phase } from "@prisma/client";
import { z } from "zod";

/** Canonical pipeline order. Lower index = earlier. */
export const PHASE_ORDER: Record<Phase, number> = {
  SIGNED: 0,
  CONTACTED: 1,
  ACTIVE: 2,
  RESULT: 3,
};

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const transitionSchema = z
  .object({
    agreementId: z.string().min(1),
    toPhase: z.enum(Phase).optional(),
    toAlertStatus: z.enum(AlertStatus).optional(),
    note: z
      .string()
      .trim()
      .max(500, "Máximo 500 caracteres")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    // Required only when transitioning to RESULT.
    resultSummary: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    resultDate: z
      .string()
      .refine((v) => v === undefined || v === "" || isoDateRegex.test(v), "Fecha inválida")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((d) => d.toPhase !== undefined || d.toAlertStatus !== undefined, {
    path: ["toPhase"],
    message: "Selecciona una nueva fase o estado para aplicar la transición",
  });

export type TransitionInput = z.infer<typeof transitionSchema>;

export const bulkTransitionSchema = z
  .object({
    agreementIds: z.array(z.string().min(1)).min(1).max(50),
    toPhase: z.enum(Phase).optional(),
    toAlertStatus: z.enum(AlertStatus).optional(),
    note: z
      .string()
      .trim()
      .max(500)
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((d) => d.toPhase !== undefined || d.toAlertStatus !== undefined, {
    path: ["toPhase"],
    message: "Selecciona una nueva fase o estado para aplicar la transición",
  });

export type BulkTransitionInput = z.infer<typeof bulkTransitionSchema>;

export type TransitionDirection = "forward" | "backward" | "same" | "phase-unchanged";

export function classifyPhaseTransition(
  from: Phase,
  to: Phase | undefined,
): TransitionDirection {
  if (to === undefined) return "phase-unchanged";
  if (to === from) return "same";
  return PHASE_ORDER[to] > PHASE_ORDER[from] ? "forward" : "backward";
}
