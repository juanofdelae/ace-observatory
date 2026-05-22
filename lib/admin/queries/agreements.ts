import "server-only";

import type {
  AlertStatus,
  InstrumentType,
  Phase,
  Sector,
} from "@prisma/client";

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

export async function listAgreements(): Promise<AgreementListItem[]> {
  const rows = await prisma.agreement.findMany({
    where: { deletedAt: null },
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
