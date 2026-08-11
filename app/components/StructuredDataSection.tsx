import type { SectionResult, StructuredDataReport } from "@/lib/types";
import { Card, EmptyNote, Pill } from "./ui";

export default function StructuredDataSection({
  structuredData,
  pageUrl,
}: {
  structuredData: SectionResult<StructuredDataReport>;
  pageUrl: string;
}) {
  const report = structuredData.data;

  return (
    <Card
      title="Structured data"
      subtitle="Checks whether JSON-LD schema blocks are present and parseable"
      error={structuredData.error}
      collapsible
      defaultExpanded={false}
      aside={
        report ? (
          <Pill status={report.failed > 0 ? "warn" : report.warned > 0 ? "warn" : "pass"}>
            {report.failed > 0 ? `${report.failed} issue${report.failed === 1 ? "" : "s"}` : "Schema looks good"}
          </Pill>
        ) : null
      }
    >
      {report ? (
        <div className="space-y-3">
          {report.issues.length === 0 ? (
            <EmptyNote>No structured-data issues were detected.</EmptyNote>
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
