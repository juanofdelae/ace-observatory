import docsRaw from "./_documents.json";
import { asset } from "@/lib/asset-path";

export type DocumentKind =
  | "tripbook"
  | "agenda"
  | "participants"
  | "final-report"
  | "overview"
  | "other";

export interface EditionDocument {
  kind: DocumentKind;
  label: string;
  filename: string;
  url: string;
  pages: number;
}

// Structure from scripts/build_documents_map.py → keyed by editionId.
// Prefix every doc URL with the deploy basePath so PDFs resolve under
// /ACE/observatory/documents/* in production.
const docs: Record<string, EditionDocument[]> = Object.fromEntries(
  Object.entries(docsRaw as Record<string, EditionDocument[]>).map(([editionId, list]) => [
    editionId,
    list.map(d => ({ ...d, url: asset(d.url) })),
  ]),
);

export const documentsByEdition = (editionId: string): EditionDocument[] =>
  docs[editionId] ?? [];

export const hasDocuments = (editionId: string): boolean =>
  (docs[editionId]?.length ?? 0) > 0;
