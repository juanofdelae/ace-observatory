"use client";
import { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, File as FileIcon } from "lucide-react";

export interface DownloadColumn<T> {
  /** Column header rendered in the file. */
  header: string;
  /** Cell value resolver. Should always return a primitive (string / number);
   *  arrays must be pre-joined by the caller. */
  cell: (row: T) => string | number;
}

interface Props<T> {
  /** Filename without extension — gets ".csv", ".pdf", ".docx" appended. */
  filename: string;
  /** Document title rendered at the top of PDF / Word exports. */
  title: string;
  /** Subtitle (e.g. "N delegates · filters applied"). */
  subtitle?: string;
  rows: T[];
  columns: DownloadColumn<T>[];
}

/**
 * Three-way export dropdown — CSV (Excel-ready), PDF, Word (DOCX).
 *
 * The libraries (jspdf, jspdf-autotable, docx) are dynamically imported
 * only when the user actually triggers the corresponding download, so
 * they don't bloat the initial bundle of any page that mounts this menu.
 */
export function DownloadMenu<T>({ filename, title, subtitle, rows, columns }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<null | "csv" | "pdf" | "docx">(null);
  const ref = useRef<HTMLDivElement>(null);

  // Click outside / Esc closes the menu.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerSave = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCsv = () => {
    setBusy("csv");
    try {
      // Quote any cell containing a comma, quote, or newline. Excel reads
      // UTF-8 CSVs correctly when the BOM (﻿) is prepended.
      const escape = (v: string | number) => {
        const s = String(v);
        return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [
        columns.map(c => escape(c.header)).join(","),
        ...rows.map(r => columns.map(c => escape(c.cell(r))).join(",")),
      ];
      const csv = "﻿" + lines.join("\n");
      triggerSave(new Blob([csv], { type: "text/csv;charset=utf-8" }), "csv");
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  const handlePdf = async () => {
    setBusy("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      doc.setFontSize(16);
      doc.setTextColor("#0B1F3A");
      doc.text(title, 40, 40);
      if (subtitle) {
        doc.setFontSize(10);
        doc.setTextColor("#64748B");
        doc.text(subtitle, 40, 58);
      }
      autoTable(doc, {
        startY: subtitle ? 76 : 60,
        head: [columns.map(c => c.header)],
        body: rows.map(r => columns.map(c => String(c.cell(r)))),
        styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, textColor: "#0B1F3A" },
        headStyles: { fillColor: [11, 31, 58], textColor: "#FFFFFF", fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 76, left: 40, right: 40, bottom: 40 },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.setFontSize(8);
          doc.setTextColor("#94A3B8");
          doc.text(
            `ACE Observatory · Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`,
            40,
            pageHeight - 18,
          );
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth - 90,
            pageHeight - 18,
          );
        },
      });
      doc.save(`${filename}.pdf`);
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  const handleDocx = async () => {
    setBusy("docx");
    try {
      const docx = await import("docx");
      const {
        Document,
        Packer,
        Paragraph,
        Table,
        TableRow,
        TableCell,
        HeadingLevel,
        TextRun,
        WidthType,
        AlignmentType,
      } = docx;

      const headerRow = new TableRow({
        tableHeader: true,
        children: columns.map(c =>
          new TableCell({
            shading: { fill: "0B1F3A" },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: c.header, bold: true, color: "FFFFFF", size: 20 }),
                ],
              }),
            ],
          }),
        ),
      });

      const bodyRows = rows.map(r =>
        new TableRow({
          children: columns.map(c =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: String(c.cell(r)), size: 18, color: "0B1F3A" })],
                }),
              ],
            }),
          ),
        }),
      );

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: title, bold: true, color: "0B1F3A", size: 32 })],
            }),
            ...(subtitle ? [
              new Paragraph({
                children: [new TextRun({ text: subtitle, color: "64748B", size: 20, italics: true })],
                spacing: { after: 200 },
              }),
            ] : []),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [headerRow, ...bodyRows],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { before: 200 },
              children: [new TextRun({
                text: `ACE Observatory · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`,
                color: "94A3B8",
                size: 16,
                italics: true,
              })],
            }),
          ],
        }],
      });
      const blob = await Packer.toBlob(doc);
      triggerSave(blob, "docx");
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink bg-white border border-surface-border rounded-full shadow-soft hover:border-ink/30 hover:shadow-card transition-all"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download size={13} />
        Export
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-52 bg-white border border-surface-border rounded-xl shadow-panel z-50 overflow-hidden"
        >
          <MenuItem
            icon={FileSpreadsheet}
            iconColor="#22C55E"
            label="CSV (Excel)"
            sub={`${rows.length} rows`}
            onClick={handleCsv}
            busy={busy === "csv"}
          />
          <MenuItem
            icon={FileText}
            iconColor="#EF4444"
            label="PDF"
            sub={`${rows.length} rows`}
            onClick={handlePdf}
            busy={busy === "pdf"}
          />
          <MenuItem
            icon={FileIcon}
            iconColor="#2563EB"
            label="Word (DOCX)"
            sub={`${rows.length} rows`}
            onClick={handleDocx}
            busy={busy === "docx"}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  iconColor,
  label,
  sub,
  onClick,
  busy,
}: {
  icon: typeof Download;
  iconColor: string;
  label: string;
  sub?: string;
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-surface-subtle disabled:opacity-60"
      role="menuitem"
    >
      <Icon size={15} style={{ color: iconColor }} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-ink leading-tight">{label}</div>
        {sub && <div className="text-[10px] text-text-muted">{sub}</div>}
      </div>
      {busy && (
        <span className="inline-block w-3 h-3 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      )}
    </button>
  );
}
