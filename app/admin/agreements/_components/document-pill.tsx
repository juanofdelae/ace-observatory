import { FileText, FileX2 } from "lucide-react";

export function DocumentPill({ url }: { url: string | null }) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="border-border bg-surface-canvas text-text hover:bg-surface inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-colors"
        title="Abrir PDF en una pestaña nueva"
      >
        <FileText className="size-3" aria-hidden />
        PDF
      </a>
    );
  }
  return (
    <span
      className="text-text-subtle inline-flex items-center gap-1 text-[11px] font-medium"
      title="No hay documento adjunto"
    >
      <FileX2 className="size-3" aria-hidden />
      Falta
    </span>
  );
}
