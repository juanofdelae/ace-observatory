import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Lightweight read-only queries for the admin list pages. Kept in one file
 * because each is a single findMany — the per-entity .ts files in Bridge
 * carry more weight than this phase needs (CRUD lives there in Bridge; we
 * only need read paths to populate /admin/* tables).
 */

export async function listInstitutions() {
  return prisma.institution.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      actorType: true,
      countryId: true,
      countryLabel: true,
      website: true,
      _count: { select: { participants: true } },
    },
  });
}

export async function listParticipants() {
  return prisma.participant.findMany({
    where: { deletedAt: null },
    orderBy: [{ fullName: "asc" }],
    take: 500,
    select: {
      id: true,
      fullName: true,
      countryId: true,
      organizationLabel: true,
      position: true,
      participantRole: true,
      actorType: true,
      photoUrl: true,
      source: true,
    },
  });
}

export async function listSurveys() {
  return prisma.survey.findMany({
    orderBy: [{ scheduledFor: "desc" }],
    take: 200,
    select: {
      id: true,
      milestone: true,
      scheduledFor: true,
      sentAt: true,
      respondedAt: true,
      agreement: {
        select: { id: true, code: true, partyA: { select: { name: true } }, partyB: { select: { name: true } } },
      },
      edition: { select: { id: true, name: true } },
      _count: { select: { responses: true } },
    },
  });
}

export async function listSupportRequests() {
  return prisma.supportRequest.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      category: true,
      priority: true,
      status: true,
      description: true,
      createdAt: true,
      agreement: {
        select: { id: true, code: true, partyA: { select: { name: true } }, partyB: { select: { name: true } } },
      },
      assignedTo: { select: { email: true, name: true } },
    },
  });
}

export async function listEditions() {
  return prisma.edition.findMany({
    orderBy: [{ year: "desc" }, { startDate: "desc" }],
    select: {
      id: true,
      name: true,
      shortLabel: true,
      year: true,
      hostCity: true,
      hostCountryId: true,
      startDate: true,
      endDate: true,
      _count: {
        select: { agreements: true, surveys: true, participants: true, reports: true },
      },
    },
  });
}
