import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getAgreementDetail } from "@/lib/admin/queries/agreements";
import {
  ALERT_STATUS_LABELS,
  INSTRUMENT_LABELS,
  PHASE_LABELS,
  SECTOR_LABELS,
} from "@/lib/admin/schemas/agreement";
import { cn } from "@/lib/utils";

import { AdminPageHeader } from "../../_components/page-header";
import { DeleteButton } from "./_components/delete-button";
import { DocumentManager } from "./_components/document-manager";
import { TransitionButton } from "./_components/transition-button";

export const metadata = { title: "Detalle de acuerdo" };

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const datetimeFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

type Params = Promise<{ id: string }>;

export default async function AgreementDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const a = await getAgreementDetail(id);
  if (!a) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <Link
          href="/admin/agreements"
          className="text-text-muted hover:text-text text-xs transition-colors"
        >
          ← Acuerdos
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <AdminPageHeader
            eyebrow={`${INSTRUMENT_LABELS[a.instrumentType]} · ${a.edition.name}`}
            title={`${a.partyA.name} ↔ ${a.partyB.name}`}
            description={a.subject || undefined}
          />
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/admin/agreements/${a.id}/edit`}
              className="border-border bg-surface text-text hover:bg-surface-canvas inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors"
            >
              <Pencil className="size-3.5" />
              Editar
            </Link>
            <TransitionButton
              agreementId={a.id}
              currentPhase={a.phase}
              currentAlert={a.alertStatus}
            />
            <DeleteButton agreementId={a.id} />
          </div>
        </div>
      </div>

      <section className="border-border bg-surface grid grid-cols-2 gap-y-4 gap-x-6 rounded-xl border p-6 md:grid-cols-4">
        <Field label="Código">{a.code}</Field>
        <Field label="Fecha de firma">{dateFmt.format(a.signedDate)}</Field>
        <Field label="Sector">{SECTOR_LABELS[a.primarySector] ?? a.primarySector}</Field>
        <Field label="Fase">
          <Pill dot={phaseDot(a.phase)}>{PHASE_LABELS[a.phase]}</Pill>
        </Field>
        <Field label="Alerta">
          <Pill dot={alertDot(a.alertStatus)}>{ALERT_STATUS_LABELS[a.alertStatus]}</Pill>
        </Field>
        {a.delegate ? <Field label="Delegado">{a.delegate}</Field> : null}
        {a.tags.length > 0 ? (
          <Field label="Etiquetas">
            <div className="flex flex-wrap gap-1.5">
              {a.tags.map((t) => (
                <span
                  key={t}
                  className="border-border text-text-muted inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]"
                >
                  {t}
                </span>
              ))}
            </div>
          </Field>
        ) : null}
        {a.resultDate ? (
          <Field label="Fecha de resultado">{dateFmt.format(a.resultDate)}</Field>
        ) : null}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <PartyCard label="Parte A" name={a.partyA.name} signer={a.signerA?.fullName ?? null} />
        <PartyCard label="Parte B" name={a.partyB.name} signer={a.signerB?.fullName ?? null} />
      </section>

      <section>
        <h2 className="text-text mb-3 text-base font-semibold tracking-tight">Documento firmado</h2>
        <DocumentManager agreementId={a.id} currentDocumentUrl={a.documentUrl} />
      </section>

      {a.resultSummary ? (
        <section className="border-border bg-surface rounded-xl border p-6">
          <h2 className="text-text mb-3 text-base font-semibold tracking-tight">Resultado</h2>
          <p className="text-text-muted text-sm leading-relaxed whitespace-pre-wrap">
            {a.resultSummary}
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="text-text mb-4 text-base font-semibold tracking-tight">
          Historial de cambios
        </h2>
        {a.statusChanges.length === 0 ? (
          <p className="text-text-subtle text-sm">Sin transiciones registradas todavía.</p>
        ) : (
          <ol className="border-border space-y-3 border-l-2 pl-5">
            {a.statusChanges.map((change) => (
              <li key={change.id} className="relative">
                <span className="bg-secondary absolute -left-[27px] top-1.5 size-2 rounded-full" />
                <p className="text-text text-sm">
                  {change.fromPhase && change.toPhase ? (
                    <>
                      <span className="text-text-muted">Fase:</span>{" "}
                      <strong>{PHASE_LABELS[change.fromPhase]}</strong> →{" "}
                      <strong>{PHASE_LABELS[change.toPhase]}</strong>
                    </>
                  ) : change.fromStatus && change.toStatus ? (
                    <>
                      <span className="text-text-muted">Alerta:</span>{" "}
                      <strong>{ALERT_STATUS_LABELS[change.fromStatus]}</strong> →{" "}
                      <strong>{ALERT_STATUS_LABELS[change.toStatus]}</strong>
                    </>
                  ) : (
                    "Cambio de estado"
                  )}
                </p>
                {change.note ? (
                  <p className="text-text-muted mt-1 text-xs">{change.note}</p>
                ) : null}
                <p className="text-text-subtle mt-1 text-xs">
                  {datetimeFmt.format(change.createdAt)} ·{" "}
                  {change.changedBy?.name ?? change.changedBy?.email}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-text-subtle text-[11px] font-medium tracking-widest uppercase">
        {label}
      </p>
      <div className="text-text mt-1.5 text-sm">{children}</div>
    </div>
  );
}

function PartyCard({
  label,
  name,
  signer,
}: {
  label: string;
  name: string;
  signer: string | null;
}) {
  return (
    <div className="border-border bg-surface rounded-xl border p-6">
      <p className="text-text-subtle text-[11px] font-medium tracking-widest uppercase">
        {label}
      </p>
      <p className="text-text mt-2 text-lg font-semibold tracking-tight">{name}</p>
      {signer ? (
        <p className="text-text-muted mt-2 text-sm">Firmante: {signer}</p>
      ) : (
        <p className="text-text-subtle mt-2 text-xs">Sin firmante vinculado.</p>
      )}
    </div>
  );
}

function Pill({ children, dot }: { children: React.ReactNode; dot: string }) {
  return (
    <span className="border-border text-text inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
      {children}
    </span>
  );
}

function phaseDot(phase: string): string {
  return (
    {
      SIGNED: "bg-primary",
      CONTACTED: "bg-secondary",
      ACTIVE: "bg-state-active",
      RESULT: "bg-accent",
    }[phase] ?? "bg-text-subtle"
  );
}

function alertDot(status: string): string {
  return (
    {
      ACTIVE: "bg-state-active",
      NEEDS_ATTENTION: "bg-state-warning",
      CLOSED: "bg-state-closed",
    }[status] ?? "bg-text-subtle"
  );
}
