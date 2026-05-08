import docsRaw from "./_documents.json";

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
const docs = docsRaw as Record<string, EditionDocument[]>;

export const documentsByEdition = (editionId: string): EditionDocument[] =>
  docs[editionId] ?? [];

export const hasDocuments = (editionId: string): boolean =>
  (docs[editionId]?.length ?? 0) > 0;
