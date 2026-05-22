"use client";

import { Eye, FileText, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  clearAgreementDocument,
  setAgreementDocument,
} from "@/lib/admin/actions/agreements";

/**
 * Inline document manager for the agreement detail page.
 *
 *  - No document: shows an "Upload" button → file picker → uploads to
 *    Supabase Storage via setAgreementDocument (which writes the storage
 *    key into Agreement.documentUrl).
 *  - Has document: shows the storage key, a "View" link (opens a 5-min
 *    signed URL via /api/admin/agreements/[id]/document/view), and a
 *    "Remove" button that calls clearAgreementDocument.
 *
 * Upload errors surface as toast messages with the server's exact reason
 * (wrong MIME, too big, storage not configured, etc.).
 */
export function DocumentManager({
  agreementId,
  currentDocumentUrl,
}: {
  agreementId: string;
  currentDocumentUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUpload] = useTransition();
  const [isRemoving, startRemove] = useTransition();
  const [armedRemove, setArmedRemove] = useState(false);

  function pickFile() {
    inputRef.current?.click();
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("agreementId", agreementId);
    formData.set("file", file);

    startUpload(async () => {
      const result = await setAgreementDocument(formData);
      if (result.ok) {
        toast.success("PDF subido.");
        router.refresh();
      } else {
        toast.error(result.formError ?? "No se pudo subir el archivo.");
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function remove() {
    startRemove(async () => {
      const result = await clearAgreementDocument({ id: agreementId });
      if (result.ok) {
        toast.success("Documento eliminado.");
        setArmedRemove(false);
        router.refresh();
      } else {
        toast.error(result.formError ?? "No se pudo eliminar.");
      }
    });
  }

  if (!currentDocumentUrl) {
    return (
      <div className="border-border bg-surface flex items-center justify-between gap-4 rounded-xl border border-dashed p-6">
        <div className="flex items-center gap-3">
          <span className="bg-surface-canvas text-text-subtle flex size-10 items-center justify-center rounded-lg">
            <FileText className="size-5" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-text text-sm font-medium">Sin documento adjunto</p>
            <p className="text-text-muted text-xs">Subí el PDF firmado (máx. 10 MB)</p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={onFileSelected}
          className="hidden"
        />
        <button
          type="button"
          onClick={pickFile}
          disabled={isUploading}
          className="bg-ink hover:bg-ink-700 inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white transition-colors disabled:opacity-50"
        >
          <Upload className="size-3.5" />
          {isUploading ? "Subiendo…" : "Subir PDF"}
        </button>
      </div>
    );
  }

  // currentDocumentUrl is the storage key, e.g. "agreements/abc123/1716401234-file.pdf"
  const filename = currentDocumentUrl.split("/").pop()?.replace(/^\d+-/, "") ?? "documento.pdf";

  return (
    <div className="border-border bg-surface flex items-center justify-between gap-4 rounded-xl border p-6">
      <div className="flex items-center gap-3 min-w-0">
        <span className="bg-state-active-bg text-state-active flex size-10 shrink-0 items-center justify-center rounded-lg">
          <FileText className="size-5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <p className="text-text truncate text-sm font-medium" title={filename}>
            {filename}
          </p>
          <p className="text-text-muted text-xs">PDF · listo</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={`/api/admin/agreements/${agreementId}/document/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-surface text-text hover:bg-surface-canvas inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors"
        >
          <Eye className="size-3.5" />
          Ver
        </a>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={onFileSelected}
          className="hidden"
        />
        <button
          type="button"
          onClick={pickFile}
          disabled={isUploading}
          className="border-border bg-surface text-text hover:bg-surface-canvas inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Upload className="size-3.5" />
          {isUploading ? "Subiendo…" : "Reemplazar"}
        </button>
        {!armedRemove ? (
          <button
            type="button"
            onClick={() => {
              setArmedRemove(true);
              setTimeout(() => setArmedRemove(false), 5000);
            }}
            className="text-text-muted hover:text-state-blocked inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-xs transition-colors"
          >
            <Trash2 className="size-3.5" />
            Eliminar
          </button>
        ) : (
          <button
            type="button"
            onClick={remove}
            disabled={isRemoving}
            className="bg-state-blocked text-white hover:bg-state-blocked/90 inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            {isRemoving ? "Eliminando…" : "¿Confirmar?"}
          </button>
        )}
      </div>
    </div>
  );
}
