import type { HtmlReport, SectionResult } from "@/lib/types";
import { Card, EmptyNote, Pill } from "./ui";

export default function HtmlSection({
  html,
}: {
  html: SectionResult<HtmlReport>;
}) {
  const report = html.data;

  return (
    <Card
      title="HTML Structure"
      subtitle="Checks whether the page has a structurally sound HTML document"
      error={html.error}
      collapsible
      defaultExpanded={false}
      aside={
        report ? (
          <Pill status={report.valid ? "pass" : "warn"}>
            {report.valid
              ? "Valid structure"
              : `${report.issues.length} issue${report.issues.length === 1 ? "" : "s"}`}
          </Pill>
        ) : null
      }
    >
      {report ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-medium text-slate-500">Doctype</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {report.doctypePresent ? "Present" : "Missing"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-medium text-slate-500">&lt;html&gt;</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {report.hasHtmlTag ? "Present" : "Missing"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-medium text-slate-500">Body/head</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {report.hasHeadTag && report.hasBodyTag
                  ? "Present"
                  : "Incomplete"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">
              Heading hierarchy
            </p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-slate-600">
              {report.hierarchy.length > 0
                ? report.hierarchy
                    .map(
                      (node) =>
                        `${"  ".repeat(node.level - 1)}<${node.tag}> ${node.text}`,
                    )
                    .join("\n")
                : "No heading tags detected."}
            </pre>
          </div>

          {report.issues.length === 0 ? (
            <EmptyNote>The HTML markup looks structurally sound.</EmptyNote>
          ) : (
            <ul className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              {report.issues.map((issue, index) => (
                <li key={`${issue}-${index}`} className="text-sm text-amber-800">
                  • {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </Card>
  );
}
