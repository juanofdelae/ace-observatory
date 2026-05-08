import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Cloud,
  FileText,
  Database,
  Map as MapIcon,
  Users,
  Building2,
  Sparkles,
  Globe2,
} from "lucide-react";
import { participants } from "@/data/participants";
import { editions } from "@/data/editions";
import { visitedSites } from "@/data/visited-sites";
import { reports } from "@/data/reports";
import { outcomes } from "@/data/outcomes";

export const metadata = { title: "About · Methodology — ACE Observatory" };

export default function AboutPage() {
  const totalParticipants = participants.length;
  const totalEditions = editions.length;
  const totalSites = visitedSites.length;
  const totalReports = reports.length;
  const sampleOutcomes = outcomes.filter(o =>
    /sample/i.test(o.description ?? ""),
  ).length;
  const verifiedOutcomes = outcomes.length - sampleOutcomes;

  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-7">
      {/* Hero */}
      <header className="bg-ink text-white rounded-3xl p-7 md:p-10 shadow-panel">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60 mb-3">
          About the observatory
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-[1.05]">
          How the ACE Observatory is built
        </h1>
        <p className="mt-4 text-sm md:text-base text-white/75 leading-relaxed max-w-2xl">
          The ACE Observatory is an institutional reference platform for the Americas
          Competitiveness Exchange — the OAS-led program that has connected
          more than {totalParticipants.toLocaleString()} leaders across{" "}
          {totalEditions} editions since 2014. This page explains where the
          data comes from, how it's verified, and what's still in flight.
        </p>
      </header>

      {/* Status grid */}
      <section aria-label="Data status">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-3">
          Data status — what's real, what's sample
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            tone="real"
            title="Verified from ACE archives"
            icon={CheckCircle2}
            items={[
              `${totalEditions} editions with dates, host countries and host cities`,
              `${totalParticipants.toLocaleString()} alumni ingested from TablePress / Memphis JSON`,
              "Official organizers and partner institutions",
              "Photos and short bios for backfilled delegates",
            ]}
          />
          <StatusCard
            tone="sample"
            title="Illustrative for the MVP"
            icon={AlertCircle}
            items={[
              "Some visited-site descriptions (templated, will be replaced from trip-books)",
              "Selected outcome metrics (LOIs, derived projects)",
              "Pre / exit-survey figures for older editions",
              `${sampleOutcomes} of ${outcomes.length} outcomes flagged "sample"`,
            ]}
          />
          <StatusCard
            tone="pending"
            title="In ingestion queue"
            icon={Cloud}
            items={[
              `${23 - totalReports} Final Reports pending structured extraction`,
              "Verified outcomes from Final Reports",
              "Trip-book PDFs → structured site descriptions",
              "Media assets and social-impact metrics",
            ]}
          />
        </div>
      </section>

      {/* Sources */}
      <section className="bg-white rounded-2xl border border-surface-border shadow-card p-6 md:p-8">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-3">
          Where the data comes from
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Sources</h2>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-3xl">
          Every record in the observatory traces back to one of four classes
          of source. Where a record is illustrative or pending verification,
          a banner on the page surfaces that explicitly.
        </p>
        <ul className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SourceRow
            icon={FileText}
            title="Official Final Report PDFs"
            body="Trip-books and Final Reports issued after each ACE edition (e.g. ACE 4 Córdoba, ACE 7 Texas, ACE 22 Córdoba). KPIs, Letters of Intent, sectors and outcomes are extracted with PyMuPDF and structured into data/reports.ts."
          />
          <SourceRow
            icon={Database}
            title="TablePress alumni archives"
            body="Country-by-country alumni lists published by RIAC. Cleaned and deduplicated into 776 unique participant records spanning ACE 1–23."
          />
          <SourceRow
            icon={Globe2}
            title="riacevents.org edition sites"
            body="The official WordPress site for each edition (panama, illinois, ecuador, seattle, belem, etc.) provides delegate photos, biographies and special-guest profiles."
          />
          <SourceRow
            icon={MapIcon}
            title="Manual curation"
            body="A handful of host cities, sites and outcomes were curated by hand from the program documents — these records are flagged in their data files for traceability."
          />
        </ul>
      </section>

      {/* Methodology */}
      <section className="bg-white rounded-2xl border border-surface-border shadow-card p-6 md:p-8">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-3">
          Methodology
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
          How records are built and verified
        </h2>
        <ol className="mt-5 space-y-4 text-sm text-text-secondary leading-relaxed list-decimal pl-5">
          <li>
            <span className="font-semibold text-ink">Ingest.</span> Raw
            sources (PDFs, HTML pages, CSV exports) are processed into JSON
            staging files — <code className="text-[12px] bg-surface-muted px-1.5 py-0.5 rounded">_historical-participants.json</code>,{" "}
            <code className="text-[12px] bg-surface-muted px-1.5 py-0.5 rounded">_visited-sites-wave2.json</code>,{" "}
            <code className="text-[12px] bg-surface-muted px-1.5 py-0.5 rounded">_pdf-cache/*</code>.
          </li>
          <li>
            <span className="font-semibold text-ink">Deduplicate.</span>{" "}
            Names normalized for accents and punctuation; cross-edition
            duplicates merged with recency-weighted field selection.
          </li>
          <li>
            <span className="font-semibold text-ink">Map to schema.</span>{" "}
            Every record is shaped to the typed schemas in{" "}
            <code className="text-[12px] bg-surface-muted px-1.5 py-0.5 rounded">types/index.ts</code>{" "}
            (Participant, VisitedSite, Edition, Report, Outcome).
          </li>
          <li>
            <span className="font-semibold text-ink">Cross-link.</span>{" "}
            Editions ↔ host cities ↔ visited sites ↔ participants ↔
            sectors ↔ countries — every entity references the others by
            id so the Atlas, the Network, and the Reports can read from a
            single graph.
          </li>
          <li>
            <span className="font-semibold text-ink">Surface honestly.</span>{" "}
            Wherever a field is still illustrative, the page makes the
            distinction explicit (e.g. the "Verified outcomes" vs
            "Illustrative outcomes" split on the Impact page). The intent
            is institutional credibility: never let a stakeholder believe
            a placeholder is verified.
          </li>
        </ol>
      </section>

      {/* What you can do */}
      <section className="bg-white rounded-2xl border border-surface-border shadow-card p-6 md:p-8">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-blue mb-3">
          What you can do here
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
          Five canonical workflows
        </h2>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <UseCaseCard
            href="/map"
            icon={MapIcon}
            title="Spatial analysis"
            body="Drill from country to state to city to site. See delegation arcs from the host city to every represented home country."
          />
          <UseCaseCard
            href="/network"
            icon={Sparkles}
            title="Network analysis"
            body="Per-edition or cross-edition delegate connections by shared sector or shared country. Click any name to see their direct ties."
          />
          <UseCaseCard
            href="/participants"
            icon={Users}
            title="Alumni directory"
            body="Search 776 alumni by name, role, country, sector, actor type or edition. Open any profile to see their full ACE history."
          />
          <UseCaseCard
            href="/editions"
            icon={Building2}
            title="Edition library"
            body="Each edition with its host cities, sectors, organizers, and visited sites. Toggle grid or table view."
          />
          <UseCaseCard
            href="/reports"
            icon={FileText}
            title="Reports Intelligence"
            body="Final Report PDFs transformed into structured analytical dashboards — KPIs, partnerships, knowledge gain, feedback."
          />
          <UseCaseCard
            href="/impact"
            icon={Sparkles}
            title="Impact tracking"
            body="Documented partnerships, derived projects, policy alignment and investment outcomes (verified ones flagged distinctly)."
          />
        </div>
      </section>

      {/* Footer numbers */}
      <section className="text-[11px] text-text-muted text-center pt-2">
        Observatory state · {totalParticipants.toLocaleString()} alumni ·{" "}
        {totalEditions} editions · {totalSites.toLocaleString()} institutions mapped ·{" "}
        {totalReports} structured reports · {verifiedOutcomes} verified outcomes
      </section>
    </div>
  );
}

// ---------- Sub-components ----------

function StatusCard({
  tone,
  title,
  icon: Icon,
  items,
}: {
  tone: "real" | "sample" | "pending";
  title: string;
  icon: typeof CheckCircle2;
  items: string[];
}) {
  const palette = {
    real:    { dot: "#10B981", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)" },
    sample:  { dot: "#2563EB", bg: "rgba(37,99,235,0.06)",  border: "rgba(37,99,235,0.2)"  },
    pending: { dot: "#F97316", bg: "rgba(249,115,22,0.06)", border: "rgba(249,115,22,0.2)" },
  }[tone];
  return (
    <div
      className="rounded-2xl p-5 shadow-card border bg-white"
      style={{ borderColor: palette.border }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full" style={{ background: palette.dot }} />
        <Icon size={14} style={{ color: palette.dot }} />
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
          {tone === "real" ? "Real data" : tone === "sample" ? "Sample data" : "Pending upload"}
        </div>
      </div>
      <h3 className="text-sm font-bold text-ink leading-tight">{title}</h3>
      <ul className="mt-3 space-y-1.5">
        {items.map(it => (
          <li
            key={it}
            className="text-[12px] text-text-secondary leading-relaxed flex items-start gap-1.5"
          >
            <span
              className="w-1 h-1 rounded-full mt-2 shrink-0"
              style={{ background: palette.dot }}
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SourceRow({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof FileText;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-lg bg-surface-canvas border border-surface-border flex items-center justify-center shrink-0 text-accent-blue">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="text-[12px] text-text-secondary leading-relaxed mt-0.5">{body}</div>
      </div>
    </li>
  );
}

function UseCaseCard({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: typeof MapIcon;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl bg-surface-canvas border border-surface-border hover:border-accent-blue/40 hover:bg-white hover:shadow-card transition-all p-4"
    >
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-accent-blue" />
        <div className="text-[13px] font-bold text-ink">{title}</div>
      </div>
      <p className="mt-2 text-[12px] text-text-secondary leading-relaxed">{body}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-accent-blue group-hover:gap-1.5 transition-all">
        Open <ArrowRight size={11} />
      </div>
    </Link>
  );
}
