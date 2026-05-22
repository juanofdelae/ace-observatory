import "server-only";

import { Phase as PhaseEnum, type AlertStatus, type InstrumentType, type Phase, type Sector } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AgreementView = "all" | "needs-attention" | "active" | "closed";

const VIEW_WHERE: Record<AgreementView, Record<string, unknown>> = {
  all: {},
  "needs-attention": { alertStatus: "NEEDS_ATTENTION" },
  active: { phase: { in: [PhaseEnum.ACTIVE, PhaseEnum.RESULT] } },
  closed: { alertStatus: "CLOSED" },
};

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
  signerAId: string | null;
  partyBId: string;
  partyBName: string;
  signerBId: string | null;
  editionId: string;
  editionName: string;
  editionYear: number;
  subject: string;
  tags: string[];
  resultSummary: string | null;
  resultDate: Date | null;
};

export async function countAgreementsByView(): Promise<Record<AgreementView, number>> {
  const [all, needsAttention, active, closed] = await Promise.all([
    prisma.agreement.count({ where: { deletedAt: null } }),
    prisma.agreement.count({
      where: { deletedAt: null, ...VIEW_WHERE["needs-attention"] },
    }),
    prisma.agreement.count({
      where: { deletedAt: null, ...VIEW_WHERE.active },
    }),
    prisma.agreement.count({
      where: { deletedAt: null, ...VIEW_WHERE.closed },
    }),
  ]);
  return { all, "needs-attention": needsAttention, active, closed };
}

export type AgreementFilters = {
  view?: AgreementView;
  phases?: Phase[];
  alertStatuses?: AlertStatus[];
  sectors?: Sector[];
  editionIds?: string[];
};

export async function listAgreements(
  opts: AgreementFilters = {},
): Promise<AgreementListItem[]> {
  const view = opts.view ?? "all";

  // Ad-hoc filter overlays compose with the view's base where clause.
  // Empty arrays are ignored (treated as "no filter on this dimension").
  const adHoc: Record<string, unknown> = {};
  if (opts.phases?.length) adHoc.phase = { in: opts.phases };
  if (opts.alertStatuses?.length) adHoc.alertStatus = { in: opts.alertStatuses };
  if (opts.sectors?.length) adHoc.primarySector = { in: opts.sectors };
  if (opts.editionIds?.length) adHoc.editionId = { in: opts.editionIds };

  const rows = await prisma.agreement.findMany({
    where: { deletedAt: null, ...VIEW_WHERE[view], ...adHoc },
    orderBy: [{ signedDate: "desc" }],
    include: {
      partyA: { select: { name: true } },
      partyB: { select: { name: true } },
      edition: { select: { name: true, year: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    instrumentType: row.instrumentType,
    signedDate: row.signedDate,
    phase: row.phase,
    alertStatus: row.alertStatus,
    primarySector: row.primarySector,
    partyAId: row.partyAId,
    partyAName: row.partyA.name,
    signerAId: row.signerAId,
    partyBId: row.partyBId,
    partyBName: row.partyB.name,
    signerBId: row.signerBId,
    editionId: row.editionId,
    editionName: row.edition.name,
    editionYear: row.edition.year,
    subject: row.subject,
    tags: row.tags,
    resultSummary: row.resultSummary,
    resultDate: row.resultDate,
  }));
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
