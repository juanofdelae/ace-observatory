"use server";

import { Phase } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { defineAction, type ActionResult } from "@/lib/admin/actions";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  WRITE_ROLES,
  requireRole,
} from "@/lib/admin/authz";
import { prisma } from "@/lib/prisma";
import { agreementSchema } from "@/lib/admin/schemas/agreement";
import {
  buildAgreementKey,
  deleteObject,
  isStorageConfigured,
  uploadObject,
} from "@/lib/admin/storage";
import { scheduleSurveysForAgreement } from "@/lib/admin/surveys/scheduling";

const uniqueFields = {
  code: { field: "code", message: "Ya existe un acuerdo con ese código." },
};

function toDbPayload(input: z.infer<typeof agreementSchema>) {
  return {
    code: input.code,
    editionId: input.editionId,
    instrumentType: input.instrumentType,
    signedDate: new Date(input.signedDate),
    partyAId: input.partyAId,
    signerAId: input.signerAId,
    partyBId: input.partyBId,
    signerBId: input.signerBId,
    subject: input.subject,
    primarySector: input.primarySector,
    tags: input.tags ?? [],
    phase: input.phase ?? Phase.SIGNED,
    alertStatus: input.alertStatus ?? "ACTIVE",
    resultSummary: input.resultSummary,
    resultDate: input.resultDate ? new Date(input.resultDate) : null,
  };
}

export const createAgreement = defineAction({
  schema: agreementSchema,
  revalidate: ["/agreements", "/surveys"],
  uniqueFields,
  handler: async (input, ctx) => {
    const agreement = await prisma.agreement.create({
      data: { ...toDbPayload(input), createdById: ctx.id, updatedById: ctx.id },
    });
    // Schedule the 30/60/90/180/365-day surveys upfront. Idempotent.
    await scheduleSurveysForAgreement(prisma, {
      agreementId: agreement.id,
      signedDate: agreement.signedDate,
    });
    return agreement;
  },
});

const updateAgreementSchema = z.object({
  id: z.string().min(1),
  data: agreementSchema,
});

export const updateAgreement = defineAction({
  schema: updateAgreementSchema,
  revalidate: ["/agreements"],
  uniqueFields,
  handler: async ({ id, data }, ctx) => {
    return prisma.agreement.update({
      where: { id, deletedAt: null },
      data: { ...toDbPayload(data), updatedById: ctx.id },
    });
  },
});

const deleteAgreementSchema = z.object({ id: z.string().min(1) });

export const softDeleteAgreement = defineAction({
  schema: deleteAgreementSchema,
  revalidate: ["/agreements"],
  handler: async ({ id }) => {
    const agreement = await prisma.agreement.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, documentUrl: true },
    });
    if (!agreement) {
      throw new ConflictError("El acuerdo no existe o ya fue eliminado.");
    }
    if (agreement.documentUrl && isStorageConfigured()) {
      await deleteObject(agreement.documentUrl).catch(() => {
        // Stored file is best-effort cleanup; soft-delete should succeed
        // even if the storage call fails (orphan reaped manually).
      });
    }
    await prisma.agreement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  },
});

// ─── Document upload ────────────────────────────────────────────────────────

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = "application/pdf";

/**
 * File uploads can't ride the `defineAction` Zod pipeline (FormData isn't
 * a plain JSON value), so this action manages auth + validation manually.
 */
export async function setAgreementDocument(
  formData: FormData,
): Promise<ActionResult<{ key: string }>> {
  try {
    const ctx = await requireRole(WRITE_ROLES);
    if (!isStorageConfigured()) {
      return {
        ok: false,
        formError: "Storage no está configurado. Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.",
      };
    }
    const agreementId = formData.get("agreementId");
    const file = formData.get("file");
    if (typeof agreementId !== "string" || agreementId.length === 0) {
      return { ok: false, formError: "Falta el identificador del acuerdo." };
    }
    if (!(file instanceof File)) {
      return { ok: false, formError: "No se recibió ningún archivo." };
    }
    if (file.type !== ALLOWED_MIME) {
      return { ok: false, formError: "Solo se aceptan archivos PDF." };
    }
    if (file.size === 0) {
      return { ok: false, formError: "El archivo está vacío." };
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return {
        ok: false,
        formError: `El archivo supera el máximo de ${Math.round(MAX_DOCUMENT_BYTES / 1024 / 1024)} MB.`,
      };
    }
    const agreement = await prisma.agreement.findFirst({
      where: { id: agreementId, deletedAt: null },
      select: { id: true, documentUrl: true },
    });
    if (!agreement) {
      return { ok: false, formError: "El acuerdo no existe o fue eliminado." };
    }

    const key = buildAgreementKey(agreement.id, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadObject({ key, contentType: ALLOWED_MIME, data: buffer });

    if (agreement.documentUrl && agreement.documentUrl !== key) {
      // Best-effort: delete the previous file so the bucket doesn't accrete orphans.
      await deleteObject(agreement.documentUrl).catch(() => {});
    }

    await prisma.agreement.update({
      where: { id: agreement.id },
      data: { documentUrl: key, updatedById: ctx.id },
    });
    revalidatePath(`/agreements/${agreement.id}`);
    revalidatePath("/agreements");
    return { ok: true, data: { key } };
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return { ok: false, formError: err.message };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, formError: `Fallo al subir: ${message}` };
  }
}

const clearAgreementDocumentSchema = z.object({ id: z.string().min(1) });

export const clearAgreementDocument = defineAction({
  schema: clearAgreementDocumentSchema,
  revalidate: ["/agreements"],
  handler: async ({ id }, ctx) => {
    const agreement = await prisma.agreement.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, documentUrl: true },
    });
    if (!agreement) {
      throw new ConflictError("El acuerdo no existe o ya fue eliminado.");
    }
    if (agreement.documentUrl && isStorageConfigured()) {
      await deleteObject(agreement.documentUrl).catch(() => {});
    }
    await prisma.agreement.update({
      where: { id },
      data: { documentUrl: null, updatedById: ctx.id },
    });
    revalidatePath(`/agreements/${id}`);
    return { id };
  },
});
