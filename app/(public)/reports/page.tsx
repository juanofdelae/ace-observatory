import { PageHeader } from "@/components/ui/PageHeader";
import { reports } from "@/data/reports";
import { ReportCard } from "@/components/reports/ReportCard";
import { FileText } from "lucide-react";

export const metadata = {
  title: "ACE Reports Intelligence — Data Observatory",
  description:
    "Structured analytical dashboards built from each ACE edition's official Final Report.",
};

export default function ReportsIndexPage() {
  return (
    <div className="max-w-canvas mx-auto px-4 md:px-8 py-6 space-y-6">
      <PageHeader
        eyebrow="Final Report Intelligence"
        title="ACE Reports Intelligence"
        description="Each ACE edition produces a Final Report packed with metrics, partnerships and stories. We turn those PDFs into structured, analytical dashboards — so you can read the numbers, not just the narrative."
      />

      {reports.length === 0 ? (
        <div className="bg-white border border-dashed border-surface-border rounded-2xl p-12 text-center shadow-soft">
          <FileText size={28} className="mx-auto text-text-muted mb-2" />
          <p className="text-text-muted text-sm">
            No report intelligence dashboards available yet. Reports will appear here as Final
            Report PDFs are ingested.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map(r => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}

      <div className="text-[11px] text-text-muted">
        Showing <span className="font-semibold text-ink">{reports.length}</span> available report
        {reports.length === 1 ? "" : "s"}.
      </div>
    </div>
  );
}
