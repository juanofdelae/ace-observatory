import { AlertTriangle, FileText } from "lucide-react";

// Document presence is operationally critical. Present → soft green pill so
// the eye can confirm at a glance; missing → soft orange pill so the row
// reads as "action needed". No gray fallback — missing documents should
// never be visually quiet.
export function DocumentPill({ url }: { url: string | null }) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="border-state-active/30 bg-state-active/10 text-state-active hover:bg-state-active/15 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold transition-colors"
        title="Abrir PDF en una pestaña nueva"
      >
        <FileText className="size-3.5" aria-hidden />
        PDF
      </a>
    );
  }
  return (
    <span
      className="border-state-warning/30 bg-state-warning/10 text-state-warning inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold"
      title="No hay documento adjunto — acción operativa pendiente"
    >
      <AlertTriangle className="size-3.5" aria-hidden />
      Falta PDF
    </span>
  );
}
