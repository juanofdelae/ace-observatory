import "server-only";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/admin/mail";
import { env } from "@/lib/env";
import { MILESTONE_LABELS } from "@/lib/admin/surveys/questions";

export type DispatchResult = {
  scanned: number;
  attempted: number;
  sent: number;
  failed: Array<{ surveyId: string; reason: string }>;
  mode: "live" | "dry-run";
};

/**
 * Find every survey whose scheduledFor is in the past, hasn't been sent, and
 * whose agreement is still active, then send the corresponding email.
 * Idempotent at the row level — once `sentAt` is set, we skip on next run.
 */
export async function dispatchDueSurveys(now: Date = new Date()): Promise<DispatchResult> {
  const due = await prisma.survey.findMany({
    where: {
      sentAt: null,
      scheduledFor: { lte: now },
      agreement: { deletedAt: null },
    },
    include: {
      agreement: {
        select: {
          code: true,
          signerA: { select: { fullName: true, email: true } },
          signerB: { select: { fullName: true, email: true } },
          partyA: { select: { name: true } },
          partyB: { select: { name: true } },
        },
      },
    },
    take: 200, // safety cap per run; daily cadence makes this enough
  });

  const failed: DispatchResult["failed"] = [];
  let sent = 0;
  let mode: "live" | "dry-run" = "dry-run";

  for (const survey of due) {
    if (!survey.agreement || !survey.milestone) {
      failed.push({ surveyId: survey.id, reason: "Survey missing agreement or milestone" });
      continue;
    }
    const recipients = [
      survey.agreement.signerA?.email,
      survey.agreement.signerB?.email,
    ].filter((email): email is string => !!email && !email.endsWith("@no-email.observatory.ace"));
    if (recipients.length === 0) {
      failed.push({
        surveyId: survey.id,
        reason: "No signer with a real email on this agreement",
      });
      continue;
    }
    const link = `${env.NEXTAUTH_URL}/survey/${survey.uniqueToken}`;
    const milestoneLabel = MILESTONE_LABELS[survey.milestone];
    const subject = `[ACE Bridge] Encuesta ${milestoneLabel} — Acuerdo ${survey.agreement.code}`;
    const text = `Hola,

Como parte del seguimiento al acuerdo ${survey.agreement.code} firmado entre
${survey.agreement.partyA.name} y ${survey.agreement.partyB.name}, te invitamos
a responder una breve encuesta de ${milestoneLabel}.

Es corta (3 preguntas, ~2 minutos). El enlace es personal y caduca al ser respondido.

${link}

Gracias por mantener viva la alianza.
— Equipo ACE / OAS`;

    const html = `<p>Hola,</p>
<p>Como parte del seguimiento al acuerdo <strong>${survey.agreement.code}</strong>
firmado entre <em>${survey.agreement.partyA.name}</em> y
<em>${survey.agreement.partyB.name}</em>, te invitamos a responder una breve
encuesta de <strong>${milestoneLabel}</strong>.</p>
<p>Es corta (3 preguntas, ~2 minutos). El enlace es personal y caduca al ser respondido.</p>
<p><a href="${link}">Responder encuesta</a></p>
<p style="color:#6b7280;font-size:12px">Gracias por mantener viva la alianza.<br/>— Equipo ACE / OAS</p>`;

    const result = await sendMail({
      to: recipients,
      subject,
      text,
      html,
    });
    mode = result.mode;

    if (result.ok) {
      await prisma.survey.update({
        where: { id: survey.id },
        data: { sentAt: now },
      });
      sent++;
    } else {
      failed.push({ surveyId: survey.id, reason: result.reason });
    }
  }

  return { scanned: due.length, attempted: due.length, sent, failed, mode };
}
