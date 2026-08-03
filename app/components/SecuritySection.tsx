import type { SectionResult, SecurityHeadersReport } from "@/lib/types";
import { Card, EmptyNote, Pill } from "./ui";

export default function SecuritySection({
  security,
  pageUrl,
}: {
  security: SectionResult<SecurityHeadersReport>;
  pageUrl: string;
}) {
  const report = security.data;

  return (
    <Card
      title="Security headers"
      subtitle="Checks for basic response headers that improve site security"
      error={security.error}
      collapsible
      defaultExpanded={false}
      aside={
        report ? (
          <Pill status={report.failed > 0 ? "warn" : report.warned > 0 ? "warn" : "pass"}>
            {report.failed > 0 ? `${report.failed} missing` : "Headers look good"}
          </Pill>
        ) : null
      }
    >
      {report ? (
        <div className="space-y-3">
          {report.issues.length === 0 ? (
            <EmptyNote>No missing security headers were detected.</EmptyNote>
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
