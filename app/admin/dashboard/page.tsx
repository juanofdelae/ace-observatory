import { FileText, LifeBuoy, MailCheck, Users } from "lucide-react";

import { loadDashboardSnapshot } from "@/lib/admin/queries/dashboard";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const data = await loadDashboardSnapshot();

  const activePlusResult = data.agreementsByPhase
    .filter((p) => p.phase === "ACTIVE" || p.phase === "RESULT")
    .reduce((sum, p) => sum + p.count, 0);
  const totalAgreements = data.totals.agreements;
  const activationRate =
    totalAgreements > 0 ? Math.round((activePlusResult / totalAgreements) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <header>
        <p className="text-text-muted text-xs font-semibold tracking-widest uppercase">
          OAS · RIAC · ACE
        </p>
        <h1 className="text-text mt-2 text-3xl font-semibold tracking-tight">
          Dashboard ejecutivo
        </h1>
        <p className="text-text-muted mt-2 max-w-2xl text-sm leading-relaxed">
          Métricas vivas de la cartera de alianzas firmadas durante las ediciones del Americas
          Competitiveness Exchange.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi
          icon={FileText}
          label="Acuerdos firmados"
          value={totalAgreements}
          hint={`${data.totals.agreementsBySigned} en fase inicial`}
        />
        <Kpi
          icon={Users}
          label="Tasa de activación"
          value={`${activationRate}%`}
          hint={`${activePlusResult} en Activo + Resultado`}
        />
        <Kpi
          icon={LifeBuoy}
          label="Solicitudes abiertas"
          value={data.totals.openSupportRequests}
          hint="Abiertas + en curso"
          tone={data.totals.openSupportRequests > 0 ? "warn" : "ok"}
        />
        <Kpi
          icon={MailCheck}
          label="Tasa de respuesta"
          value={`${data.surveyHealth.responseRate}%`}
          hint={`${data.surveyHealth.responded} de ${data.surveyHealth.sent} enviadas`}
          tone={data.surveyHealth.responseRate >= 50 ? "ok" : "muted"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Distribución por fase">
          <PhaseList rows={data.agreementsByPhase} />
        </Card>
        <Card title="Acuerdos por edición">
          {data.agreementsByEdition.length > 0 ? (
            <EditionList rows={data.agreementsByEdition} />
          ) : (
            <Empty message="Aún no hay acuerdos vinculados a una edición." />
          )}
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Sectores principales">
          {data.agreementsBySector.length > 0 ? (
            <SectorList rows={data.agreementsBySector} />
          ) : (
            <Empty message="Sin datos de sector aún." />
          )}
        </Card>
        <Card title="Salud de encuestas" subtitle="Cobertura del seguimiento automático">
          <div className="grid grid-cols-3 gap-3 pt-2">
            <MiniStat label="Pendientes" value={data.surveyHealth.pending} tone="muted" />
            <MiniStat label="Enviadas" value={data.surveyHealth.sent} tone="info" />
            <MiniStat label="Respondidas" value={data.surveyHealth.responded} tone="ok" />
          </div>
          <p className="text-text-muted mt-8 text-sm leading-relaxed">
            Tasa de respuesta acumulada{" "}
            <strong className="text-text">{data.surveyHealth.responseRate}%</strong> sobre las
            encuestas ya enviadas.
          </p>
        </Card>
      </section>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = "muted",
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "muted" | "ok" | "warn" | "info";
}) {
  const toneClass = {
    muted: "text-text",
    ok: "text-state-active",
    warn: "text-state-warning",
    info: "text-secondary",
  }[tone];
  return (
    <div className="border-border bg-surface rounded-xl border p-6">
      <div className="text-text-subtle flex items-center justify-between">
        <p className="text-[11px] font-medium tracking-widest uppercase">{label}</p>
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </div>
      <p
        className={cn(
          "mt-5 text-4xl font-semibold tracking-tight tabular-nums",
          toneClass,
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-text-muted mt-2 text-xs">{hint}</p> : null}
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-surface rounded-xl border p-6">
      <header className="mb-5">
        <h2 className="text-text text-base font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-text-muted mt-0.5 text-xs">{subtitle}</p> : null}
      </header>
      {children}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-text-subtle flex h-[200px] items-center justify-center text-sm">
      {message}
    </div>
  );
}

function PhaseList({ rows }: { rows: Array<{ phase: string; count: number }> }) {
  const labels: Record<string, string> = {
    SIGNED: "Firmado",
    CONTACTED: "Contactado",
    ACTIVE: "Activo",
    RESULT: "Con resultado",
  };
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.phase} className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{labels[row.phase] ?? row.phase}</span>
          <span className="text-text font-medium tabular-nums">{row.count}</span>
        </li>
      ))}
    </ul>
  );
}

function EditionList({
  rows,
}: {
  rows: Array<{ editionLabel: string; year: number; count: number }>;
}) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={`${row.editionLabel}-${row.year}`} className="flex items-center justify-between text-sm">
          <span className="text-text-muted truncate">
            {row.editionLabel}
            {row.year ? ` · ${row.year}` : ""}
          </span>
          <span className="text-text font-medium tabular-nums">{row.count}</span>
        </li>
      ))}
    </ul>
  );
}

function SectorList({ rows }: { rows: Array<{ sector: string; count: number }> }) {
  return (
    <ul className="space-y-2">
      {rows.slice(0, 8).map((row) => (
        <li key={row.sector} className="flex items-center justify-between text-sm">
          <span className="text-text-muted">{row.sector.replace(/_/g, " ")}</span>
          <span className="text-text font-medium tabular-nums">{row.count}</span>
        </li>
      ))}
    </ul>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "info" | "ok";
}) {
  const toneClass = {
    muted: "text-text-muted",
    info: "text-secondary",
    ok: "text-state-active",
  }[tone];
  return (
    <div className="border-border rounded-lg border p-4 text-center">
      <p className="text-text-subtle text-[11px] font-medium tracking-widest uppercase">
        {label}
      </p>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", toneClass)}>{value}</p>
    </div>
  );
}
