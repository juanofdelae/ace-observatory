import "server-only";

import {
  AlertStatus,
  Phase,
  RequestStatus,
  Sector,
  SupportCategory,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type DashboardSnapshot = {
  totals: {
    agreements: number;
    agreementsBySigned: number;
    institutions: number;
    participants: number;
    openSupportRequests: number;
  };
  agreementsByPhase: Array<{ phase: Phase; count: number }>;
  agreementsByAlert: Array<{ alertStatus: AlertStatus; count: number }>;
  agreementsByEdition: Array<{ editionLabel: string; year: number; count: number }>;
  agreementsBySector: Array<{ sector: Sector; count: number }>;
  agreementsByMonth: Array<{ month: string; count: number }>;
  supportByCategory: Array<{ category: SupportCategory; count: number }>;
  supportByStatus: Array<{ status: RequestStatus; count: number }>;
  surveyHealth: {
    pending: number;
    sent: number;
    responded: number;
    responseRate: number;
  };
};

function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [
    totalAgreements,
    institutions,
    participants,
    openSupport,
    agreementsByPhaseRows,
    agreementsByAlertRows,
    agreementsByEditionRows,
    agreementsBySectorRows,
    signedAgreements,
    surveyPending,
    surveySent,
    surveyResponded,
    supportByCategoryRows,
    supportByStatusRows,
  ] = await Promise.all([
    prisma.agreement.count({ where: { deletedAt: null } }),
    prisma.institution.count({ where: { deletedAt: null } }),
    prisma.participant.count({ where: { deletedAt: null } }),
    prisma.supportRequest.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, agreement: { deletedAt: null } },
    }),
    prisma.agreement.groupBy({
      by: ["phase"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.agreement.groupBy({
      by: ["alertStatus"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.agreement.groupBy({
      by: ["editionId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.agreement.groupBy({
      by: ["primarySector"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.agreement.findMany({
      where: { deletedAt: null },
      select: { signedDate: true },
    }),
    prisma.survey.count({
      where: { sentAt: null, agreement: { deletedAt: null } },
    }),
    prisma.survey.count({
      where: { sentAt: { not: null }, agreement: { deletedAt: null } },
    }),
    prisma.survey.count({
      where: { respondedAt: { not: null }, agreement: { deletedAt: null } },
    }),
    prisma.supportRequest.groupBy({
      by: ["category"],
      where: { agreement: { deletedAt: null } },
      _count: { _all: true },
    }),
    prisma.supportRequest.groupBy({
      by: ["status"],
      where: { agreement: { deletedAt: null } },
      _count: { _all: true },
    }),
  ]);

  // Resolve edition labels in a second roundtrip (groupBy doesn't include relations).
  const editionIds = agreementsByEditionRows.map((r) => r.editionId);
  const editions = editionIds.length
    ? await prisma.edition.findMany({
        where: { id: { in: editionIds } },
        select: { id: true, name: true, year: true },
      })
    : [];
  const editionMap = new Map(editions.map((e) => [e.id, e]));

  const agreementsBySigned = agreementsByPhaseRows
    .filter((r) => r.phase === Phase.SIGNED)
    .reduce((sum, r) => sum + r._count._all, 0);

  // Monthly agreements signed (last 12 months including current).
  const now = new Date();
  const buckets: Map<string, number> = new Map();
  for (let i = 11; i >= 0; i--) {
    const d = startOfMonthUTC(new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.set(monthKey(d), 0);
  }
  for (const row of signedAgreements) {
    const key = monthKey(startOfMonthUTC(row.signedDate));
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + 1);
  }

  const agreementsByMonth = Array.from(buckets.entries()).map(([month, count]) => ({
    month,
    count,
  }));

  const responseRate =
    surveySent > 0 ? Math.round((surveyResponded / surveySent) * 100) : 0;

  return {
    totals: {
      agreements: totalAgreements,
      agreementsBySigned,
      institutions,
      participants,
      openSupportRequests: openSupport,
    },
    agreementsByPhase: agreementsByPhaseRows.map((r) => ({
      phase: r.phase,
      count: r._count._all,
    })),
    agreementsByAlert: agreementsByAlertRows.map((r) => ({
      alertStatus: r.alertStatus,
      count: r._count._all,
    })),
    agreementsByEdition: agreementsByEditionRows
      .map((r) => {
        const edition = editionMap.get(r.editionId);
        return {
          editionLabel: edition ? edition.name.replace(/^ACE \d+ — /, "") : r.editionId,
          year: edition?.year ?? 0,
          count: r._count._all,
        };
      })
      .sort((a, b) => a.year - b.year),
    agreementsBySector: agreementsBySectorRows
      .map((r) => ({ sector: r.primarySector, count: r._count._all }))
      .sort((a, b) => b.count - a.count),
    agreementsByMonth,
    supportByCategory: supportByCategoryRows.map((r) => ({
      category: r.category,
      count: r._count._all,
    })),
    supportByStatus: supportByStatusRows.map((r) => ({
      status: r.status,
      count: r._count._all,
    })),
    surveyHealth: {
      pending: surveyPending,
      sent: surveySent,
      responded: surveyResponded,
      responseRate,
    },
  };
}
