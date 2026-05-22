import "server-only";

import { SurveyMilestone, type PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { MILESTONE_OFFSETS_DAYS } from "@/lib/admin/surveys/questions";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function generateToken(): string {
  return randomBytes(32).toString("hex"); // 64 hex chars — matches @db.VarChar(64)
}

/**
 * Idempotent: only inserts the surveys that don't already exist for the
 * agreement, so calling this twice is safe (e.g., on resync).
 */
export async function scheduleSurveysForAgreement(
  prisma: Pick<PrismaClient, "survey"> | PrismaClient,
  args: { agreementId: string; signedDate: Date },
): Promise<{ created: number }> {
  const existing = await prisma.survey.findMany({
    where: { agreementId: args.agreementId },
    select: { milestone: true },
  });
  const have = new Set(existing.map((s) => s.milestone));
  const milestones = Object.values(SurveyMilestone);
  const toCreate = milestones.filter((m) => !have.has(m));

  if (toCreate.length === 0) return { created: 0 };

  await prisma.survey.createMany({
    data: toCreate.map((milestone) => ({
      agreementId: args.agreementId,
      milestone,
      scheduledFor: addDays(args.signedDate, MILESTONE_OFFSETS_DAYS[milestone]),
      uniqueToken: generateToken(),
    })),
    skipDuplicates: true,
  });
  return { created: toCreate.length };
}
