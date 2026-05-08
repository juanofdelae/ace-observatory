import type { ACEReport, ReportVerificationStatus } from "@/data/reports";
import { Badge } from "@/components/ui/Badge";
import { FileText, Download, ExternalLink, ShieldCheck, AlertTriangle, Beaker, FileSearch } from "lucide-react";

const STATUS_LABEL: Record<ReportVerificationStatus, string> = {
  extracted_from_report: "Extracted from Final Report",
  pending_verification: "Pending verification",
  sample: "Sample data",
};

export function ReportVerificationChip({ status }: { status: ReportVerificationStatus }) {
  if (status === "extracted_from_report") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck size={12} />
        {STATUS_LABEL[status]}
      </span>
    );
  }
  if (status === "pending_verification") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <AlertTriangle size={12} />
        {STATUS_LABEL[status]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
      <Beaker size={12} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ReportSourceBlock({ report }: { report: ACEReport }) {
  // Best-effort page count read — supports either an explicit `pageCount`
  // field or `pages` on the report record. Falls back gracefully.
  const pageCount =
    (report as unknown as { pageCount?: number; pages?: number }).pageCount ??
    (report as unknown as { pageCount?: number; pages?: number }).pages;

  return (
    <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card flex flex-col md:flex-row md:items-center md:justify-between gap-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent-blue/12 flex items-center justify-center shrink-0">
          <FileText size={20} className="text-accent-blue" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted mb-1">
            Source document
          </div>
          <div className="text-base font-bold text-ink">Official ACE Final Report</div>
          <div className="text-xs text-text-secondary mt-1 leading-relaxed max-w-md">
            All metrics on this page are extracted from the official ACE Final
            Report unless flagged as sample.
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {report.editionId}
            </Badge>
            {pageCount && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-surface-canvas border border-surface-border text-text-secondary">
                <FileSearch size={11} /> {pageCount} pages
              </span>
            )}
            <ReportVerificationChip status={report.verificationStatus} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {report.sourcePdf ? (
          <>
            <a
              href={report.sourcePdf}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink bg-white border border-surface-border hover:border-ink/30 rounded-full px-3.5 py-2 transition-colors"
            >
              <ExternalLink size={12} /> Open
            </a>
            <a
              href={report.sourcePdf}
              download
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-ink hover:bg-ink-700 rounded-full px-4 py-2 shadow-soft transition-colors"
            >
              <Download size={12} /> Download PDF
            </a>
          </>
        ) : (
          <span className="text-[11px] text-text-muted italic">PDF pending upload</span>
        )}
      </div>
    </div>
  );
}
