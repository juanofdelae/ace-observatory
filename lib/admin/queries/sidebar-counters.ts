import "server-only";

import { AlertStatus, RequestStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type SidebarCounters = {
  needsAttention: number;
  openSupport: number;
  pendingSurveys: number;
};

// One-shot count queries for the sidebar badges. Runs once per admin layout
// render — no caching because these change as the team works the queue and
// stale numbers defeat the purpose of the badge.
export async function getSidebarCounters(): Promise<SidebarCounters> {
  const now = new Date();
  const [needsAttention, openSupport, pendingSurveys] = await Promise.all([
    prisma.agreement.count({
      where: {
        deletedAt: null,
        alertStatus: AlertStatus.NEEDS_ATTENTION,
      },
    }),
    prisma.supportRequest.count({
      where: {
        status: { in: [RequestStatus.OPEN, RequestStatus.IN_PROGRESS] },
      },
    }),
    prisma.survey.count({
      where: {
        scheduledFor: { lte: now },
        sentAt: null,
      },
    }),
  ]);
  return { needsAttention, openSupport, pendingSurveys };
}
