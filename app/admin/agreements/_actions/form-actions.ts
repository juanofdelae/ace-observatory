"use server";

import { createAgreement } from "@/lib/admin/actions/agreements";

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
