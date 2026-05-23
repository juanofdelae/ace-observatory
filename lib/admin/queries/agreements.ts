import "server-only";

import {
  AlertStatus,
  type InstrumentType,
  type Phase,
  Prisma,
  type Sector,
} from "@prisma/client";

import {
  type AgreementFilters,
  type AgreementView,
  VIEW_OPTIONS,
} from "@/lib/admin/agreements/url-state";
import { SECTOR_LABELS } from "@/lib/admin/schemas/agreement";
import { prisma } from "@/lib/prisma";

export type AgreementListItem = {
  id: string;
  code: string;
  instrumentType: InstrumentType;
  signedDate: Date;
  phase: Phase;
  alertStatus: AlertStatus;
  primarySector: Sector;
  partyAId: string;
  partyAName: string;
  partyACountry: string | null;
  partyACountryCode: string | null;
  signerAId: string | null;
  partyBId: string;
  partyBName: string;
  partyBCountry: string | null;
  partyBCountryCode: string | null;
  editionId: string;
  editionName: string;
  editionYear: number;
  subject: string;
  delegate: string | null;
  tags: string[];
  resultSummary: string | null;
  resultDate: Date | null;
  documentUrl: string | null;
  updatedAt: Date;
};

export type AgreementsListResult = {
  items: AgreementListItem[];
  countsPerView: Record<AgreementView, number>;
};

// Map a view to the AlertStatus/Phase predicate used in the WHERE clause.
// Kept here (instead of inlined) so the same definition seeds both the list
// query and the per-view counts query.
function viewWhere(view: AgreementView): Prisma.AgreementWhereInput {
  switch (view) {
    case "needs-attention":
      return { alertStatus: AlertStatus.NEEDS_ATTENTION };
    case "active":
      return { alertStatus: AlertStatus.ACTIVE };
    case "result":
      return { resultSummary: { not: null } };
    case "closed":
      return { alertStatus: AlertStatus.CLOSED };
    case "all":
    default:
      return {};
  }
}

// Free-text search against text columns + relation names + sector enum (by
// matching the user's input against the Spanish SECTOR_LABELS, then OR-ing in
// the matching enum values). Postgres `mode: "insensitive"` is required for
// case-insensitive matches.
function searchWhere(search: string): Prisma.AgreementWhereInput | null {
  const trimmed = search.trim();
  if (trimmed.length === 0) return null;
  const needle = trimmed;
  const sectorMatches = (Object.entries(SECTOR_LABELS) as Array<[Sector, string]>)
    .filter(([, label]) => label.toLowerCase().includes(needle.toLowerCase()))
    .map(([value]) => value);
  return {
    OR: [
      { code: { contains: needle, mode: "insensitive" } },
      { subject: { contains: needle, mode: "insensitive" } },
      { delegate: { contains: needle, mode: "insensitive" } },
      { partyA: { name: { contains: needle, mode: "insensitive" } } },
      { partyB: { name: { contains: needle, mode: "insensitive" } } },
      { edition: { name: { contains: needle, mode: "insensitive" } } },
      ...(sectorMatches.length > 0 ? [{ primarySector: { in: sectorMatches } }] : []),
    ],
  };
}

function buildWhere(filters: AgreementFilters): Prisma.AgreementWhereInput {
  const clauses: Prisma.AgreementWhereInput[] = [
    { deletedAt: null },
    viewWhere(filters.view),
  ];

  const search = searchWhere(filters.search);
  if (search) clauses.push(search);

  if (filters.editionId) clauses.push({ editionId: filters.editionId });
  if (filters.phase) clauses.push({ phase: filters.phase });
  if (filters.alertStatus) clauses.push({ alertStatus: filters.alertStatus });
  if (filters.sector) clauses.push({ primarySector: filters.sector });
  if (filters.instrumentType) clauses.push({ instrumentType: filters.instrumentType });
  if (filters.countryId) {
    clauses.push({
      OR: [
        { partyA: { countryId: filters.countryId } },
        { partyB: { countryId: filters.countryId } },
      ],
    });
  }
  if (filters.dateFrom) clauses.push({ signedDate: { gte: new Date(filters.dateFrom) } });
  if (filters.dateTo) clauses.push({ signedDate: { lte: new Date(filters.dateTo) } });
  if (filters.hasDocument === "yes") clauses.push({ documentUrl: { not: null } });
  if (filters.hasDocument === "no") clauses.push({ documentUrl: null });

  return { AND: clauses };
}

export async function listAgreements(filters: AgreementFilters): Promise<AgreementsListResult> {
  // Run the filtered list AND the five view-counts in parallel. The counts
  // use the same non-view filters so the tab badges reflect the user's
  // current filter set (a sensible default — if you've filtered to Cordoba,
  // the badge counts are within Cordoba).
  const baseFiltersNoView = { ...filters, view: "all" as const };
  const where = buildWhere(filters);

  const countsPromises = VIEW_OPTIONS.map((opt) =>
    prisma.agreement.count({
      where: buildWhere({ ...baseFiltersNoView, view: opt.value }),
    }),
  );

  const [rows, ...counts] = await Promise.all([
    prisma.agreement.findMany({
      where,
      orderBy: [{ signedDate: "desc" }],
      include: {
        partyA: { select: { name: true, countryLabel: true, countryId: true } },
        partyB: { select: { name: true, countryLabel: true, countryId: true } },
        edition: { select: { name: true, year: true } },
      },
    }),
    ...countsPromises,
  ]);

  const countsPerView = VIEW_OPTIONS.reduce(
    (acc, opt, idx) => {
      acc[opt.value] = counts[idx] ?? 0;
      return acc;
    },
    {} as Record<AgreementView, number>,
  );

  const items: AgreementListItem[] = rows.map((row) => ({
    id: row.id,
    code: row.code,
    instrumentType: row.instrumentType,
    signedDate: row.signedDate,
    phase: row.phase,
    alertStatus: row.alertStatus,
    primarySector: row.primarySector,
    partyAId: row.partyAId,
    partyAName: row.partyA.name,
    partyACountry: row.partyA.countryLabel || null,
    partyACountryCode: row.partyA.countryId,
    signerAId: row.signerAId,
    partyBId: row.partyBId,
    partyBName: row.partyB.name,
    partyBCountry: row.partyB.countryLabel || null,
    partyBCountryCode: row.partyB.countryId,
    editionId: row.editionId,
    editionName: row.edition.name,
    editionYear: row.edition.year,
    subject: row.subject,
    delegate: row.delegate,
    tags: row.tags,
    resultSummary: row.resultSummary,
    resultDate: row.resultDate,
    documentUrl: row.documentUrl,
    updatedAt: row.updatedAt,
  }));

  return { items, countsPerView };
}

export async function getAgreementDetail(id: string) {
  return prisma.agreement.findFirst({
    where: { id, deletedAt: null },
    include: {
      edition: true,
      partyA: true,
      signerA: true,
      partyB: true,
      signerB: true,
      createdBy: { select: { email: true, name: true } },
      updatedBy: { select: { email: true, name: true } },
      statusChanges: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { email: true, name: true } } },
      },
    },
  });
}

export type AgreementDetail = NonNullable<
  Awaited<ReturnType<typeof getAgreementDetail>>
>;

// ─── Lookup tables for the filter dropdowns ─────────────────────────────────

export type EditionOption = { id: string; name: string; year: number };

export async function getEditionsForFilter(): Promise<EditionOption[]> {
  const rows = await prisma.edition.findMany({
    select: { id: true, name: true, year: true },
    orderBy: [{ year: "desc" }],
  });
  return rows;
}

export type CountryOption = { id: string; name: string };

export async function getCountriesForFilter(): Promise<CountryOption[]> {
  const rows = await prisma.country.findMany({
    select: { id: true, name: true },
    orderBy: [{ name: "asc" }],
  });
  return rows;
}
