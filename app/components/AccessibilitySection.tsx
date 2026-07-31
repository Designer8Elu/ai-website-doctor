import type { AccessibilityReport, SectionResult } from "@/lib/types";
import { Card, EmptyNote, Pill } from "./ui";

export default function AccessibilitySection({
  accessibility,
}: {
  accessibility: SectionResult<AccessibilityReport>;
}) {
  const report = accessibility.data;

  return (
    <Card
      title="Accessibility"
      subtitle="Checks for common accessibility issues in the rendered HTML"
      error={accessibility.error}
      collapsible
      defaultExpanded={false}
      aside={
        report ? (
          <Pill status={report.failed > 0 ? "warn" : report.warned > 0 ? "warn" : "pass"}>
            {report.failed > 0 ? `${report.failed} issue${report.failed === 1 ? "" : "s"}` : "No blocking issues"}
          </Pill>
        ) : null
      }
    >
      {report ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-medium text-slate-500">Checks</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{report.issues.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-medium text-slate-500">Warnings</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{report.warned}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-medium text-slate-500">Failures</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{report.failed}</p>
            </div>
          </div>

          {report.issues.length === 0 ? (
            <EmptyNote>No accessibility issues were detected.</EmptyNote>
          ) : (
            <ul className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              {report.issues.map((issue, index) => (
                <li key={`${issue.label}-${index}`} className="text-sm text-amber-800">
                  <p className="font-semibold">{issue.label}</p>
                  <p className="mt-1 text-sm text-amber-700">{issue.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </Card>
  );
}
