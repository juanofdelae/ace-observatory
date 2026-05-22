"use server";

import { Phase } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { defineAction } from "@/lib/admin/actions";
import {
  ConflictError,
  ForbiddenError,
  WRITE_ROLES,
  canAdmin,
} from "@/lib/admin/authz";
import { prisma } from "@/lib/prisma";
import {
  bulkTransitionSchema,
  classifyPhaseTransition,
  transitionSchema,
} from "@/lib/admin/schemas/transition";

export const transitionAgreement = defineAction({
  schema: transitionSchema,
  // We use the broad WRITE_ROLES gate at the entry; the action body
  // further checks backward = ADMIN_ONLY before applying.
  allowedRoles: WRITE_ROLES,
  handler: async (input, ctx) => {
    const agreement = await prisma.agreement.findFirst({
      where: { id: input.agreementId, deletedAt: null },
      select: {
        id: true,
        phase: true,
        alertStatus: true,
      },
    });
    if (!agreement) throw new ConflictError("El acuerdo no existe o fue eliminado.");

    const direction = classifyPhaseTransition(agreement.phase, input.toPhase);
    if (direction === "same") {
      throw new ConflictError("El acuerdo ya está en esa fase.");
    }
    if (direction === "backward" && !canAdmin(ctx.role)) {
      throw new ForbiddenError(
        "Las reversiones de fase requieren rol ADMIN. Pide a un administrador que aplique el cambio.",
      );
    }

    const goingToResult = input.toPhase === Phase.RESULT;
    if (goingToResult) {
      if (!input.resultSummary || !input.resultDate) {
        throw new ConflictError(
          "Para cerrar en RESULT necesitas registrar un resumen y la fecha del resultado.",
        );
      }
    }

    const alertChanged =
      input.toAlertStatus !== undefined && input.toAlertStatus !== agreement.alertStatus;
    const phaseChanged = direction === "forward" || direction === "backward";

    if (!phaseChanged && !alertChanged) {
      throw new ConflictError("Nada para actualizar — fase y estado son iguales a los actuales.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.agreement.update({
        where: { id: agreement.id },
        data: {
          ...(phaseChanged ? { phase: input.toPhase } : {}),
          ...(alertChanged ? { alertStatus: input.toAlertStatus } : {}),
          ...(goingToResult
            ? {
                resultSummary: input.resultSummary,
                resultDate: new Date(input.resultDate!),
              }
            : {}),
          updatedById: ctx.id,
        },
      });
      await tx.statusChange.create({
        data: {
          agreementId: agreement.id,
          fromPhase: phaseChanged ? agreement.phase : null,
          toPhase: phaseChanged ? input.toPhase : null,
          fromStatus: alertChanged ? agreement.alertStatus : null,
          toStatus: alertChanged ? input.toAlertStatus : null,
          note: input.note,
          changedById: ctx.id,
        },
      });
    });

    revalidatePath(`/agreements/${agreement.id}`);
    revalidatePath("/agreements");
    return { id: agreement.id };
  },
});

export const bulkTransitionAgreements = defineAction({
  schema: bulkTransitionSchema,
  allowedRoles: WRITE_ROLES,
  handler: async (input, ctx) => {
    const agreements = await prisma.agreement.findMany({
      where: { id: { in: input.agreementIds }, deletedAt: null },
      select: { id: true, phase: true, alertStatus: true },
    });
    if (agreements.length === 0) {
      throw new ConflictError("Ninguno de los acuerdos seleccionados está disponible.");
    }

    // Pre-validate: if ANY transition would be backward and caller isn't
    // ADMIN, reject the whole batch — partial bulk operations are worse
    // than a clean failure.
    if (input.toPhase !== undefined && !canAdmin(ctx.role)) {
      const someBackward = agreements.some(
        (a) => classifyPhaseTransition(a.phase, input.toPhase) === "backward",
      );
      if (someBackward) {
        throw new ForbiddenError(
          "Al menos uno de los acuerdos requiere reversión (rol ADMIN). El cambio masivo fue rechazado completo.",
        );
      }
    }
    // RESULT is not supported in bulk — requires per-agreement result fields.
    if (input.toPhase === Phase.RESULT) {
      throw new ConflictError(
        "Transicionar a RESULT requiere registrar resumen y fecha por acuerdo. Hazlo desde el detalle.",
      );
    }

    const results: Array<{ id: string; skipped: boolean; reason?: string }> = [];

    await prisma.$transaction(async (tx) => {
      for (const agreement of agreements) {
        const direction = classifyPhaseTransition(agreement.phase, input.toPhase);
        const phaseChanged = direction === "forward" || direction === "backward";
        const alertChanged =
          input.toAlertStatus !== undefined && input.toAlertStatus !== agreement.alertStatus;
        if (!phaseChanged && !alertChanged) {
          results.push({ id: agreement.id, skipped: true, reason: "sin cambios" });
          continue;
        }
        await tx.agreement.update({
          where: { id: agreement.id },
          data: {
            ...(phaseChanged ? { phase: input.toPhase } : {}),
            ...(alertChanged ? { alertStatus: input.toAlertStatus } : {}),
            updatedById: ctx.id,
          },
        });
        await tx.statusChange.create({
          data: {
            agreementId: agreement.id,
            fromPhase: phaseChanged ? agreement.phase : null,
            toPhase: phaseChanged ? input.toPhase : null,
            fromStatus: alertChanged ? agreement.alertStatus : null,
            toStatus: alertChanged ? input.toAlertStatus : null,
            note: input.note,
            changedById: ctx.id,
          },
        });
        results.push({ id: agreement.id, skipped: false });
      }
    });

    revalidatePath("/agreements");
    return {
      total: results.length,
      applied: results.filter((r) => !r.skipped).length,
      skipped: results.filter((r) => r.skipped).length,
    };
  },
});
