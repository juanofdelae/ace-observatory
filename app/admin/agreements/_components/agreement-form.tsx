"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import {
  ALERT_STATUS_LABELS,
  INSTRUMENT_LABELS,
  PHASE_LABELS,
  SECTOR_LABELS,
} from "@/lib/admin/schemas/agreement";
import { submitNewAgreement } from "../_actions/form-actions";

type InstitutionOption = { id: string; name: string; countryLabel: string };
type EditionOption = { id: string; name: string; endDate: Date };

type FormState =
  | { ok: true; id: string }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string }
  | null;

export function AgreementForm({
  editions,
  institutions,
}: {
  editions: EditionOption[];
  institutions: InstitutionOption[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result = await submitNewAgreement(formData);
      if (result.ok) {
        toast.success("Acuerdo creado.");
        router.push(`/admin/agreements/${result.id}`);
        return result;
      }
      toast.error(result.formError ?? "Revisa los campos marcados.");
      return result;
    },
    null,
  );

  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};
  const defaultSigned = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-6">
      <Row>
        <Field label="Código" name="code" error={fe.code}>
          <Input name="code" placeholder="LOI-ACE-22-NEW-001" required />
        </Field>
        <Field label="Edición" name="editionId" error={fe.editionId}>
          <select
            name="editionId"
            required
            className="border-surface-border bg-white text-ink h-11 w-full rounded-xl border px-4 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona una edición…
            </option>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Row>
        <Field label="Tipo de instrumento" name="instrumentType" error={fe.instrumentType}>
          <select
            name="instrumentType"
            defaultValue="LOI"
            className="border-surface-border bg-white text-ink h-11 w-full rounded-xl border px-4 text-sm"
          >
            {Object.entries(INSTRUMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha de firma" name="signedDate" error={fe.signedDate}>
          <Input type="date" name="signedDate" defaultValue={defaultSigned} required />
        </Field>
      </Row>

      <Row>
        <Field label="Parte A" name="partyAId" error={fe.partyAId}>
          <InstitutionSelect name="partyAId" institutions={institutions} />
        </Field>
        <Field label="Parte B" name="partyBId" error={fe.partyBId}>
          <InstitutionSelect name="partyBId" institutions={institutions} />
        </Field>
      </Row>

      <Field label="Asunto" name="subject" error={fe.subject}>
        <textarea
          name="subject"
          required
          rows={3}
          className="border-surface-border bg-white text-ink w-full rounded-xl border px-4 py-3 text-sm leading-relaxed"
          placeholder="Carta de intención para…"
        />
      </Field>

      <Row>
        <Field label="Sector principal" name="primarySector" error={fe.primarySector}>
          <select
            name="primarySector"
            defaultValue="OTHER"
            className="border-surface-border bg-white text-ink h-11 w-full rounded-xl border px-4 text-sm"
          >
            {Object.entries(SECTOR_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Etiquetas (separadas por coma)" name="tags" error={fe.tags}>
          <Input name="tags" placeholder="delegates, academia" />
        </Field>
      </Row>

      <Row>
        <Field label="Fase inicial" name="phase" error={fe.phase}>
          <select
            name="phase"
            defaultValue="SIGNED"
            className="border-surface-border bg-white text-ink h-11 w-full rounded-xl border px-4 text-sm"
          >
            {Object.entries(PHASE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado de alerta" name="alertStatus" error={fe.alertStatus}>
          <select
            name="alertStatus"
            defaultValue="ACTIVE"
            className="border-surface-border bg-white text-ink h-11 w-full rounded-xl border px-4 text-sm"
          >
            {Object.entries(ALERT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Field label="Delegado (opcional)" name="delegate" error={fe.delegate}>
        <Input name="delegate" placeholder="Nombre del delegado responsable" />
      </Field>

      {state && !state.ok && state.formError ? (
        <p className="text-state-blocked bg-state-blocked-bg rounded-md px-3 py-2 text-sm">
          {state.formError}
        </p>
      ) : null}

      <div className="border-border flex items-center justify-end gap-3 border-t pt-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creando…" : "Crear acuerdo"}
    </Button>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-text text-xs font-medium">
        {label}
      </label>
      {children}
      {error ? <p className="text-state-blocked text-xs">{error}</p> : null}
    </div>
  );
}

function InstitutionSelect({
  name,
  institutions,
}: {
  name: string;
  institutions: InstitutionOption[];
}) {
  return (
    <select
      name={name}
      required
      defaultValue=""
      className="border-surface-border bg-white text-ink h-11 w-full rounded-xl border px-4 text-sm"
    >
      <option value="" disabled>
        Selecciona una institución…
      </option>
      {institutions.map((i) => (
        <option key={i.id} value={i.id}>
          {i.name} [{i.countryLabel.toUpperCase()}]
        </option>
      ))}
    </select>
  );
}
