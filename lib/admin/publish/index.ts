import "server-only";

import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { exportLois } from "./exporters/lois";

/**
 * Snapshot the admin database into the JSON files the public static build
 * reads (ADR-008). Returns a per-file report so callers can decide whether
 * to commit + push to trigger CI, or just stage the diff for review.
 *
 * IMPORTANT: this writes to data/_*.json in the repo working tree. In
 * production (Vercel) writing to the runtime filesystem is ephemeral and
 * gets blown away on the next deploy — so the calling endpoint (
 * /api/admin/publish) must immediately git-commit + push the changes,
 * which is what triggers the public CI rebuild on Apache.
 */
export type PublishReport = Array<{
  path: string;
  bytes: number;
  records: number;
}>;

const DATA_DIR = join(process.cwd(), "data");

async function writeJson<T>(filename: string, payload: T[]): Promise<{ path: string; bytes: number; records: number }> {
  const body = JSON.stringify(payload, null, 2) + "\n";
  const path = join(DATA_DIR, filename);
  await writeFile(path, body, "utf8");
  return { path: `data/${filename}`, bytes: body.length, records: payload.length };
}

export async function runPublish(): Promise<PublishReport> {
  const report: PublishReport = [];

  const lois = await exportLois();
  report.push(await writeJson("_lois.json", lois));

  // Future exporters: editions, participants, surveys, reports.
  // Each one adds an entry to `report` and writes to data/_*.json.

  return report;
}
