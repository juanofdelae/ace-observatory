/**
 * Seed edition-level Final Survey snapshots as Report rows.
 *
 * Why Reports (not Survey/SurveyResponse): the schema's Survey model is
 * designed for token-gated post-LOI follow-ups (one row per agreement +
 * milestone). The Observatory's `_survey-ace*.json` files are pre-aggregated
 * post-event evaluations — overall + per-aspect averages and distributions.
 * They share zero structure. Treating them as Reports preserves the raw
 * shape (embedded as a fenced JSON block) for the public dashboard to
 * render, and keeps the operational Survey table for its real purpose.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "./_lib";

const DATA_DIR = join(__dirname, "..", "..", "data");

interface SurveyJson {
  editionId: string;
  totalResponses: number;
  overallRating?: { options: Array<{ label: string; count: number; pct: number }>; total: number; mean: number };
  aspectRatings?: Array<{ label: string; mean: number; levels: Record<string, number> }>;
  [k: string]: unknown;
}

function buildContent(survey: SurveyJson, editionName: string): string {
  const lines: string[] = [];
  lines.push(`# ${editionName} — Final Survey`);
  lines.push("");
  lines.push(`Total responses: **${survey.totalResponses}**.`);
  lines.push("");
  if (survey.overallRating) {
    lines.push(`## Overall rating`);
    lines.push("");
    lines.push(`Mean: **${survey.overallRating.mean}** (1 = best, 5 = worst).`);
    lines.push("");
    for (const opt of survey.overallRating.options) {
      lines.push(`- ${opt.label}: ${opt.count} (${opt.pct}%)`);
    }
    lines.push("");
  }
  if (survey.aspectRatings?.length) {
    lines.push(`## Aspect ratings`);
    lines.push("");
    for (const a of survey.aspectRatings) {
      lines.push(`- **${a.label}**: ${a.mean}`);
    }
    lines.push("");
  }
  // Raw JSON for downstream chart components.
  lines.push("```json:survey-raw");
  lines.push(JSON.stringify(survey, null, 2));
  lines.push("```");
  return lines.join("\n");
}

async function main() {
  const files = readdirSync(DATA_DIR).filter((f) => /^_survey-ace\d+\.json$/.test(f));
  console.log(`Seeding ${files.length} edition surveys…`);

  let inserted = 0;
  let skipped = 0;
  for (const f of files) {
    const raw = JSON.parse(readFileSync(join(DATA_DIR, f), "utf8")) as SurveyJson;
    const edition = await prisma.edition.findUnique({ where: { id: raw.editionId } });
    if (!edition) {
      console.warn(`  ! ${f}: edition '${raw.editionId}' not found, skipping`);
      skipped++;
      continue;
    }

    const slug = `${raw.editionId}-final-survey`;
    await prisma.report.upsert({
      where: { slug },
      create: {
        slug,
        title: `${edition.name} — Final Survey`,
        editionId: edition.id,
        publishedAt: edition.endDate,
        summary: `Aggregated post-event survey results (${raw.totalResponses} responses).`,
        contentMd: buildContent(raw, edition.name),
        tags: ["survey", "final"],
      },
      update: {
        title: `${edition.name} — Final Survey`,
        editionId: edition.id,
        publishedAt: edition.endDate,
        summary: `Aggregated post-event survey results (${raw.totalResponses} responses).`,
        contentMd: buildContent(raw, edition.name),
      },
    });
    inserted++;
  }
  console.log(`✓ Survey reports: inserted=${inserted} skipped=${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
