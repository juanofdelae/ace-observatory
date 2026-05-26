import Link from "next/link";
import { notFound } from "next/navigation";

import { CountryFlag } from "@/app/admin/_components/country-flag";
import { getAgreementDetail } from "@/lib/admin/queries/agreements";
import {
  ALERT_STATUS_LABELS,
  INSTRUMENT_LABELS,
  PHASE_LABELS,
  SECTOR_LABELS,
} from "@/lib/admin/schemas/agreement";
import { cn } from "@/lib/utils";

import { PhaseTimeline } from "./_components/phase-timeline";

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

// Compact edition short label for the breadcrumb eyebrow.
function shortEdition(editionId: string, editionName: string): string {
  const m = editionId.match(/^ace-(\d+)/i);
  if (!m) return editionName;
  return `ACE ${m[1]}`;
}

export default async function AgreementDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const a = await getAgreementDetail(id);
  if (!a) notFound();

  const closed = a.alertStatus === "CLOSED";
  const partyACountryCode = a.partyA.countryId ?? null;
  const partyBCountryCode = a.partyB.countryId ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link
        href="/admin/agreements"
        className="text-text-muted hover:text-ink inline-flex items-center gap-1 text-xs transition-colors"
      >
        ← Acuerdos
      </Link>

      {/* Header — Observatory display typography */}
      <header className="space-y-3">
        <p className="text-accent-blue text-xs font-semibold tracking-widest uppercase">
          {INSTRUMENT_LABELS[a.instrumentType]} · {shortEdition(a.editionId, a.edition.name)}
        </p>
        <h1 className="text-ink flex flex-wrap items-center gap-x-3 gap-y-1 text-3xl font-bold tracking-tight leading-[1.05] md:text-[2.125rem]">
          {a.partyA.name}
          <span className="text-text-subtle text-2xl font-normal" aria-hidden>↔</span>
          {a.partyB.name}
        </h1>
        {a.subject ? (
          <p className="text-text-muted max-w-3xl text-sm leading-relaxed">{a.subject}</p>
        ) : null}
      </header>

      {/* KPI strip — premium card */}
      <section className="border-surface-border bg-white shadow-card grid grid-cols-2 gap-y-5 gap-x-6 rounded-2xl border p-6 md:grid-cols-4 md:p-8">
        <Field label="Código" mono>
          {a.code}
        </Field>
        <Field label="Fecha de firma">{dateFmt.format(a.signedDate)}</Field>
        <Field label="Sector">{SECTOR_LABELS[a.primarySector] ?? a.primarySector}</Field>
        <Field label="Alerta">
          <Pill dot={alertDot(a.alertStatus)}>{ALERT_STATUS_LABELS[a.alertStatus]}</Pill>
        </Field>
        {a.delegate ? <Field label="Delegado">{a.delegate}</Field> : null}
        {a.documentUrl ? (
          <Field label="Documento">
            <a
              href={a.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:underline"
            >
              Abrir PDF →
            </a>
          </Field>
        ) : (
          <Field label="Documento">
            <span className="text-state-warning">Falta PDF</span>
          </Field>
        )}
        {a.tags.length > 0 ? (
          <Field label="Etiquetas">
            <div className="flex flex-wrap gap-1.5">
              {a.tags.map((t) => (
                <span
                  key={t}
                  className="border-border text-text-muted inline-flex items-center rounded-full border px-2.5 py-1 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          </Field>
        ) : null}
      </section>

      {/* Body: vertical phase stepper (left) + parties / history (right) */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="border-surface-border bg-white shadow-card rounded-2xl border p-6 md:p-7">
          <h2 className="text-accent-blue mb-6 text-xs font-semibold tracking-widest uppercase">
            Recorrido
          </h2>
          <PhaseTimeline
            currentPhase={a.phase}
            signedDate={a.signedDate}
            resultDate={a.resultDate}
            resultSummary={a.resultSummary}
            documentUrl={a.documentUrl}
            statusChanges={a.statusChanges}
            closed={closed}
          />
        </aside>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <PartyCard
              label="Parte A"
              name={a.partyA.name}
              countryCode={partyACountryCode}
              countryLabel={a.partyA.countryLabel}
              signer={a.signerA?.fullName ?? null}
            />
            <PartyCard
              label="Parte B"
              name={a.partyB.name}
              countryCode={partyBCountryCode}
              countryLabel={a.partyB.countryLabel}
              signer={a.signerB?.fullName ?? null}
            />
          </div>

          {a.resultSummary ? (
            <div className="border-surface-border bg-white shadow-card rounded-2xl border p-6 md:p-7">
              <h2 className="text-ink mb-3 text-lg font-semibold tracking-tight">
                Resumen del resultado
              </h2>
              <p className="text-text-muted text-base leading-relaxed whitespace-pre-wrap">
                {a.resultSummary}
              </p>
            </div>
          ) : null}

          <div className="border-surface-border bg-white shadow-card rounded-2xl border p-6 md:p-7">
            <h2 className="text-ink mb-4 text-lg font-semibold tracking-tight">
              Historial de cambios
            </h2>
            {a.statusChanges.length === 0 ? (
              <p className="text-text-muted text-base">Sin transiciones registradas todavía.</p>
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
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-text-subtle text-xs font-semibold tracking-widest uppercase">
        {label}
      </p>
      <div className={cn("text-ink mt-2 text-base", mono && "font-mono text-sm")}>{children}</div>
    </div>
  );
}

function PartyCard({
  label,
  name,
  countryCode,
  countryLabel,
  signer,
}: {
  label: string;
  name: string;
  countryCode: string | null;
  countryLabel: string | null;
  signer: string | null;
}) {
  return (
    <div className="border-surface-border bg-white shadow-card rounded-2xl border p-6">
      <p className="text-accent-blue text-xs font-semibold tracking-widest uppercase">
        {label}
      </p>
      <p className="text-ink mt-3 flex items-center gap-2.5 text-xl font-semibold tracking-tight leading-tight">
        <CountryFlag code={countryCode} title={countryLabel ?? undefined} className="text-2xl shrink-0" />
        <span>{name}</span>
      </p>
      {signer ? (
        <p className="text-text-muted mt-3 text-sm">
          Firmante: <span className="text-ink font-medium">{signer}</span>
        </p>
      ) : (
        <p className="text-text-subtle mt-3 text-sm">Sin firmante vinculado.</p>
      )}
    </div>
  );
}

function Pill({ children, dot }: { children: React.ReactNode; dot: string }) {
  return (
    <span className="border-border text-ink inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold">
      <span className={cn("size-2 rounded-full", dot)} aria-hidden />
      {children}
    </span>
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
