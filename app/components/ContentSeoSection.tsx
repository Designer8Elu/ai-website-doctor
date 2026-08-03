import type { ContentSeoQualityReport, SectionResult } from "@/lib/types";
import RecommendedFixButton from "./RecommendedFixButton";
import { Card, EmptyNote, Pill, StatusIcon } from "./ui";

export default function ContentSeoSection({
  contentSeo,
  pageUrl,
}: {
  contentSeo: SectionResult<ContentSeoQualityReport>;
  pageUrl: string;
}) {
  const report = contentSeo.data;

  return (
    <Card
      title="Content SEO Quality"
      subtitle="H1, content depth, indexing, canonical quality and structured data"
      error={contentSeo.error}
      aside={
        report ? (
          <>
            <Pill status="pass">{report.passed} pass</Pill>
            {report.warned > 0 ? <Pill status="warn">{report.warned} warn</Pill> : null}
            {report.failed > 0 ? <Pill status="fail">{report.failed} fail</Pill> : null}
          </>
        ) : null
      }
    >
      {report ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-medium text-slate-500">Readable words</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{report.wordCount}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-medium text-slate-500">H1 tags</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{report.h1Count}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-medium text-slate-500">Indexing</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {report.noindex ? "Blocked" : "Allowed"}
              </p>
            </div>
          </div>

          <ul className="divide-y divide-slate-100">
            {report.checks.map((check) => (
              <li key={check.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5">
                  <StatusIcon status={check.status} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{check.label}</p>
                  <p className="text-sm text-slate-500">{check.detail}</p>
                  {check.value ? (
                    <p className="break-anywhere mt-1 rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600">
                      {check.value}
                    </p>
                  ) : null}
                  {check.status !== "pass" ? (
                    <RecommendedFixButton
                      context={{
                        category: "Content SEO quality",
                        label: check.label,
                        status: check.status,
                        detail: check.detail,
                        value: check.value,
                        pageUrl,
                      }}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          {report.h1Texts.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">H1 text</p>
              <ul className="mt-2 space-y-1">
                {report.h1Texts.map((text, index) => (
                  <li key={`${text}-${index}`} className="break-anywhere text-sm text-slate-600">
                    {text}
                  </li>
                ))}
              </ul>
              {report.h1Count > report.h1Texts.length ? (
                <p className="mt-2 text-xs text-slate-500">
                  Showing first {report.h1Texts.length} of {report.h1Count}.
                </p>
              ) : null}
            </div>
          ) : null}

          {report.structuredData.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">Structured data</p>
              <ul className="mt-2 space-y-1">
                {report.structuredData.map((item, index) => (
                  <li key={`${item.type}-${index}`} className="break-anywhere text-sm text-slate-600">
                    {item.type}: {item.valid ? "valid" : item.issue}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyNote>No JSON-LD blocks were found.</EmptyNote>
          )}
        </div>
      ) : null}
    </Card>
  );
}
