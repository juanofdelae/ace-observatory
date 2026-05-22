"use server";

import {
  createAgreement,
  softDeleteAgreement,
  updateAgreement,
} from "@/lib/admin/actions/agreements";
import { transitionAgreement } from "@/lib/admin/actions/transitions";

/**
 * Adapter between the native FormData submitted by AgreementForm and the
 * typed createAgreement action. Lifts strings out of FormData, splits the
 * comma-separated tag input, and returns a thin {ok, id|fieldErrors|formError}
 * shape the form's useActionState reducer understands.
 */
export async function submitNewAgreement(
  formData: FormData,
): Promise<
  | { ok: true; id: string }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string }
> {
  const raw = Object.fromEntries(formData);

  const tags = String(raw.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const input = {
    code: String(raw.code ?? "").trim(),
    editionId: String(raw.editionId ?? "").trim(),
    instrumentType: String(raw.instrumentType ?? "LOI"),
    signedDate: String(raw.signedDate ?? ""),
    partyAId: String(raw.partyAId ?? "").trim(),
    partyBId: String(raw.partyBId ?? "").trim(),
    signerAId: undefined,
    signerBId: undefined,
    subject: String(raw.subject ?? "").trim(),
    primarySector: String(raw.primarySector ?? "OTHER"),
    delegate: String(raw.delegate ?? "").trim() || undefined,
    tags,
    phase: String(raw.phase ?? "SIGNED"),
    alertStatus: String(raw.alertStatus ?? "ACTIVE"),
    resultSummary: undefined,
    resultDate: undefined,
  };

  const result = await createAgreement(input);
  if (!result.ok) {
    return { ok: false, fieldErrors: result.fieldErrors, formError: result.formError };
  }
  return { ok: true, id: result.data.id };
}

function formDataToInput(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const tags = String(raw.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    code: String(raw.code ?? "").trim(),
    editionId: String(raw.editionId ?? "").trim(),
    instrumentType: String(raw.instrumentType ?? "LOI"),
    signedDate: String(raw.signedDate ?? ""),
    partyAId: String(raw.partyAId ?? "").trim(),
    partyBId: String(raw.partyBId ?? "").trim(),
    signerAId: undefined,
    signerBId: undefined,
    subject: String(raw.subject ?? "").trim(),
    primarySector: String(raw.primarySector ?? "OTHER"),
    delegate: String(raw.delegate ?? "").trim() || undefined,
    tags,
    phase: String(raw.phase ?? "SIGNED"),
    alertStatus: String(raw.alertStatus ?? "ACTIVE"),
    resultSummary: String(raw.resultSummary ?? "").trim() || undefined,
    resultDate: String(raw.resultDate ?? "").trim() || undefined,
  };
}

export async function submitEditAgreement(
  id: string,
  formData: FormData,
): Promise<
  | { ok: true; id: string }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string }
> {
  const result = await updateAgreement({ id, data: formDataToInput(formData) });
  if (!result.ok) {
    return { ok: false, fieldErrors: result.fieldErrors, formError: result.formError };
  }
  return { ok: true, id: result.data.id };
}

export async function submitTransition(input: {
  agreementId: string;
  toPhase?: string;
  toAlertStatus?: string;
  note?: string;
}): Promise<{ ok: true } | { ok: false; formError?: string }> {
  const result = await transitionAgreement({
    agreementId: input.agreementId,
    toPhase: input.toPhase as never,
    toAlertStatus: input.toAlertStatus as never,
    note: input.note,
  });
  if (!result.ok) {
    return { ok: false, formError: result.formError };
  }
  return { ok: true };
}

export async function submitDelete(
  id: string,
): Promise<{ ok: true } | { ok: false; formError?: string }> {
  const result = await softDeleteAgreement({ id });
  if (!result.ok) {
    return { ok: false, formError: result.formError };
  }
  return { ok: true };
}
