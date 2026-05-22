"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/admin-ui/button";
import { Input } from "@/components/admin-ui/input";
import {
  ALERT_STATUS_LABELS,
  INSTRUMENT_LABELS,
  PHASE_LABELS,
  SECTOR_LABELS,
} from "@/lib/admin/schemas/agreement";
import { cn } from "@/lib/utils";

import { submitNewAgreement } from "../_actions/form-actions";

type InstitutionOption = { id: string; name: string; countryLabel: string };
type EditionOption = { id: string; name: string };

type FormValues = {
  code: string;
  editionId: string;
  instrumentType: string;
  signedDate: string;
  partyAId: string;
  partyBId: string;
  subject: string;
  primarySector: string;
  tags: string;
  delegate: string;
  phase: string;
  alertStatus: string;
};

const STEPS = [
  {
    key: "identity",
    label: "Identidad",
    summary: (v: FormValues, editions: EditionOption[]) => {
      if (!v.code && !v.editionId) return null;
      const ed = editions.find((e) => e.id === v.editionId);
      return [
        v.code || "—",
        ed?.name ?? "—",
        v.signedDate ? new Date(v.signedDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—",
      ].join(" · ");
    },
  },
  {
    key: "parties",
    label: "Partes",
    summary: (v: FormValues, _e: EditionOption[], institutions: InstitutionOption[]) => {
      const a = institutions.find((i) => i.id === v.partyAId);
      const b = institutions.find((i) => i.id === v.partyBId);
      if (!a && !b) return null;
      return `${a?.name ?? "—"} ↔ ${b?.name ?? "—"}`;
    },
  },
  {
    key: "details",
    label: "Detalle",
    summary: (v: FormValues) => {
      if (!v.subject && !v.primarySector) return null;
      const subj = v.subject.length > 48 ? `${v.subject.slice(0, 48)}…` : v.subject;
      return [subj || "—", SECTOR_LABELS[v.primarySector as keyof typeof SECTOR_LABELS] ?? v.primarySector].join(" · ");
    },
  },
  {
    key: "state",
    label: "Estado inicial",
    summary: (v: FormValues) =>
      `${PHASE_LABELS[v.phase as keyof typeof PHASE_LABELS] ?? v.phase} · ${ALERT_STATUS_LABELS[v.alertStatus as keyof typeof ALERT_STATUS_LABELS] ?? v.alertStatus}`,
  },
  { key: "review", label: "Revisar", summary: () => null },
] as const;

function validateStep(step: number, v: FormValues): string | null {
  if (step === 0) {
    if (!v.code.trim()) return "El código es obligatorio";
    if (v.code.length > 60) return "Máximo 60 caracteres en el código";
    if (!v.editionId) return "Selecciona una edición";
    if (!v.signedDate) return "Fecha de firma inválida";
  }
  if (step === 1) {
    if (!v.partyAId) return "Selecciona la institución A";
    if (!v.partyBId) return "Selecciona la institución B";
    if (v.partyAId === v.partyBId) return "Las dos partes no pueden ser la misma";
  }
  if (step === 2) {
    if (v.subject.trim().length < 10) return "El asunto debe tener al menos 10 caracteres";
  }
  return null;
}

const today = () => new Date().toISOString().slice(0, 10);

export function AgreementForm({
  editions,
  institutions,
}: {
  editions: EditionOption[];
  institutions: InstitutionOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<FormValues>({
    code: "",
    editionId: "",
    instrumentType: "LOI",
    signedDate: today(),
    partyAId: "",
    partyBId: "",
    subject: "",
    primarySector: "OTHER",
    tags: "",
    delegate: "",
    phase: "SIGNED",
    alertStatus: "ACTIVE",
  });

  // Memoize the "step completion" array so the stepper rail and Next button
  // share one source of truth.
  const stepValid = useMemo(
    () => STEPS.map((_, i) => validateStep(i, values) === null),
    [values],
  );

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function goNext() {
    const err = validateStep(step, values);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goTo(target: number) {
    // Allow free navigation backward; forward only to validated steps.
    if (target <= step) {
      setStep(target);
      setFormError(null);
      return;
    }
    for (let i = step; i < target; i++) {
      if (!stepValid[i]) {
        setFormError(`Completa "${STEPS[i].label}" antes de avanzar`);
        return;
      }
    }
    setStep(target);
    setFormError(null);
  }

  function submit() {
    // Final validation across every step before posting.
    for (let i = 0; i < STEPS.length - 1; i++) {
      const err = validateStep(i, values);
      if (err) {
        setStep(i);
        setFormError(err);
        return;
      }
    }

    const fd = new FormData();
    for (const [k, v] of Object.entries(values)) fd.set(k, v);

    startTransition(async () => {
      const result = await submitNewAgreement(fd);
      if (result.ok) {
        toast.success("Acuerdo creado.");
        router.push(`/admin/agreements/${result.id}`);
        return;
      }
      setFormError(result.formError ?? "Revisa los campos marcados.");
      setFieldErrors(result.fieldErrors ?? {});
      toast.error(result.formError ?? "Revisa los campos marcados.");
    });
  }

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <StepperRail
        steps={STEPS.map((s, i) => ({
          label: s.label,
          summary: s.summary(values, editions, institutions),
          state: i < step ? "done" : i === step ? "current" : "future",
          done: stepValid[i],
        }))}
        onJump={goTo}
      />

      <div className="space-y-6">
        <header>
          <p className="text-text-subtle text-[11px] font-medium tracking-widest uppercase">
            Paso {step + 1} de {STEPS.length}
          </p>
          <h2 className="text-text mt-1 text-xl font-semibold tracking-tight">
            {STEPS[step].label}
          </h2>
        </header>

        <div className="space-y-5">
          {step === 0 && (
            <IdentityStep
              values={values}
              set={set}
              editions={editions}
              fieldErrors={fieldErrors}
            />
          )}
          {step === 1 && (
            <PartiesStep
              values={values}
              set={set}
              institutions={institutions}
              fieldErrors={fieldErrors}
            />
          )}
          {step === 2 && <DetailsStep values={values} set={set} fieldErrors={fieldErrors} />}
          {step === 3 && <StateStep values={values} set={set} fieldErrors={fieldErrors} />}
          {step === 4 && (
            <ReviewStep values={values} editions={editions} institutions={institutions} />
          )}
        </div>

        {formError ? (
          <p className="text-state-blocked bg-state-blocked-bg rounded-md px-3 py-2 text-sm">
            {formError}
          </p>
        ) : null}

        <div className="border-border flex items-center justify-between gap-3 border-t pt-6">
          {step === 0 ? (
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              ← Anterior
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Siguiente →
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={isPending}>
              {isPending ? "Creando…" : "Crear acuerdo"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepperRail({
  steps,
  onJump,
}: {
  steps: Array<{
    label: string;
    summary: string | null;
    state: "done" | "current" | "future";
    done: boolean;
  }>;
  onJump: (i: number) => void;
}) {
  return (
    <ol className="relative space-y-5 md:sticky md:top-6 md:self-start">
      <span
        className="bg-border absolute left-[14px] top-2 bottom-2 w-px"
        aria-hidden
      />
      {steps.map((s, i) => (
        <li key={s.label} className="relative pl-10">
          <button
            type="button"
            onClick={() => onJump(i)}
            className="text-left transition-colors"
          >
            <span
              className={cn(
                "absolute left-0 top-0 z-10 flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                s.state === "done" && "border-ink bg-ink text-white",
                s.state === "current" &&
                  "border-ink bg-surface text-ink ring-ink/15 ring-4",
                s.state === "future" && "border-border bg-surface text-text-subtle",
              )}
            >
              {s.state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <p
              className={cn(
                "text-sm font-medium",
                s.state === "future" ? "text-text-subtle" : "text-text",
              )}
            >
              {s.label}
            </p>
            {s.summary ? (
              <p className="text-text-muted mt-0.5 text-xs">{s.summary}</p>
            ) : null}
          </button>
        </li>
      ))}
    </ol>
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

const selectClass =
  "border-surface-border bg-white text-ink h-11 w-full rounded-xl border px-4 text-sm";

function IdentityStep({
  values,
  set,
  editions,
  fieldErrors,
}: {
  values: FormValues;
  set: <K extends keyof FormValues>(key: K, val: FormValues[K]) => void;
  editions: EditionOption[];
  fieldErrors: Record<string, string>;
}) {
  return (
    <>
      <Row>
        <Field label="Código" name="code" error={fieldErrors.code}>
          <Input
            name="code"
            placeholder="LOI-ACE-22-NEW-001"
            value={values.code}
            onChange={(e) => set("code", e.target.value)}
          />
        </Field>
        <Field label="Edición" name="editionId" error={fieldErrors.editionId}>
          <select
            name="editionId"
            value={values.editionId}
            onChange={(e) => set("editionId", e.target.value)}
            className={selectClass}
          >
            <option value="">Selecciona una edición…</option>
            {editions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>
      </Row>
      <Row>
        <Field
          label="Tipo de instrumento"
          name="instrumentType"
          error={fieldErrors.instrumentType}
        >
          <select
            name="instrumentType"
            value={values.instrumentType}
            onChange={(e) => set("instrumentType", e.target.value)}
            className={selectClass}
          >
            {Object.entries(INSTRUMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha de firma" name="signedDate" error={fieldErrors.signedDate}>
          <Input
            type="date"
            name="signedDate"
            value={values.signedDate}
            onChange={(e) => set("signedDate", e.target.value)}
          />
        </Field>
      </Row>
    </>
  );
}

function PartiesStep({
  values,
  set,
  institutions,
  fieldErrors,
}: {
  values: FormValues;
  set: <K extends keyof FormValues>(key: K, val: FormValues[K]) => void;
  institutions: InstitutionOption[];
  fieldErrors: Record<string, string>;
}) {
  return (
    <Row>
      <Field label="Parte A" name="partyAId" error={fieldErrors.partyAId}>
        <select
          name="partyAId"
          value={values.partyAId}
          onChange={(e) => set("partyAId", e.target.value)}
          className={selectClass}
        >
          <option value="">Selecciona una institución…</option>
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} [{i.countryLabel.toUpperCase()}]
            </option>
          ))}
        </select>
      </Field>
      <Field label="Parte B" name="partyBId" error={fieldErrors.partyBId}>
        <select
          name="partyBId"
          value={values.partyBId}
          onChange={(e) => set("partyBId", e.target.value)}
          className={selectClass}
        >
          <option value="">Selecciona una institución…</option>
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} [{i.countryLabel.toUpperCase()}]
            </option>
          ))}
        </select>
      </Field>
    </Row>
  );
}

function DetailsStep({
  values,
  set,
  fieldErrors,
}: {
  values: FormValues;
  set: <K extends keyof FormValues>(key: K, val: FormValues[K]) => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <>
      <Field label="Asunto" name="subject" error={fieldErrors.subject}>
        <textarea
          name="subject"
          rows={3}
          value={values.subject}
          onChange={(e) => set("subject", e.target.value)}
          className="border-surface-border bg-white text-ink w-full rounded-xl border px-4 py-3 text-sm leading-relaxed"
          placeholder="Carta de intención para…"
        />
      </Field>
      <Row>
        <Field label="Sector principal" name="primarySector" error={fieldErrors.primarySector}>
          <select
            name="primarySector"
            value={values.primarySector}
            onChange={(e) => set("primarySector", e.target.value)}
            className={selectClass}
          >
            {Object.entries(SECTOR_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Etiquetas (separadas por coma)"
          name="tags"
          error={fieldErrors.tags}
        >
          <Input
            name="tags"
            placeholder="delegates, academia"
            value={values.tags}
            onChange={(e) => set("tags", e.target.value)}
          />
        </Field>
      </Row>
      <Field label="Delegado (opcional)" name="delegate" error={fieldErrors.delegate}>
        <Input
          name="delegate"
          placeholder="Nombre del delegado responsable"
          value={values.delegate}
          onChange={(e) => set("delegate", e.target.value)}
        />
      </Field>
    </>
  );
}

function StateStep({
  values,
  set,
  fieldErrors,
}: {
  values: FormValues;
  set: <K extends keyof FormValues>(key: K, val: FormValues[K]) => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <Row>
      <Field label="Fase inicial" name="phase" error={fieldErrors.phase}>
        <select
          name="phase"
          value={values.phase}
          onChange={(e) => set("phase", e.target.value)}
          className={selectClass}
        >
          {Object.entries(PHASE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Estado de alerta" name="alertStatus" error={fieldErrors.alertStatus}>
        <select
          name="alertStatus"
          value={values.alertStatus}
          onChange={(e) => set("alertStatus", e.target.value)}
          className={selectClass}
        >
          {Object.entries(ALERT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Field>
    </Row>
  );
}

function ReviewStep({
  values,
  editions,
  institutions,
}: {
  values: FormValues;
  editions: EditionOption[];
  institutions: InstitutionOption[];
}) {
  const ed = editions.find((e) => e.id === values.editionId);
  const a = institutions.find((i) => i.id === values.partyAId);
  const b = institutions.find((i) => i.id === values.partyBId);
  return (
    <div className="space-y-3 text-sm">
      <p className="text-text-muted">
        Revisá los datos antes de crear el acuerdo. Podés volver con "Anterior" si necesitás
        cambiar algo.
      </p>
      <dl className="border-border bg-surface-canvas divide-border divide-y rounded-xl border">
        <ReviewRow label="Código" value={values.code} />
        <ReviewRow label="Edición" value={ed?.name ?? "—"} />
        <ReviewRow label="Tipo" value={INSTRUMENT_LABELS[values.instrumentType as keyof typeof INSTRUMENT_LABELS] ?? values.instrumentType} />
        <ReviewRow label="Fecha de firma" value={new Date(values.signedDate).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" })} />
        <ReviewRow label="Parte A" value={a?.name ?? "—"} />
        <ReviewRow label="Parte B" value={b?.name ?? "—"} />
        <ReviewRow label="Asunto" value={values.subject} />
        <ReviewRow label="Sector" value={SECTOR_LABELS[values.primarySector as keyof typeof SECTOR_LABELS] ?? values.primarySector} />
        <ReviewRow label="Etiquetas" value={values.tags || "—"} />
        <ReviewRow label="Fase inicial" value={PHASE_LABELS[values.phase as keyof typeof PHASE_LABELS] ?? values.phase} />
        <ReviewRow label="Alerta" value={ALERT_STATUS_LABELS[values.alertStatus as keyof typeof ALERT_STATUS_LABELS] ?? values.alertStatus} />
        {values.delegate ? <ReviewRow label="Delegado" value={values.delegate} /> : null}
      </dl>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 px-4 py-3">
      <dt className="text-text-muted text-xs uppercase tracking-widest">{label}</dt>
      <dd className="text-text text-right text-sm">{value}</dd>
    </div>
  );
}
