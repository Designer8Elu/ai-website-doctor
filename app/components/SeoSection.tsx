import type { SectionResult, SeoReport } from "@/lib/types";
import RecommendedFixButton from "./RecommendedFixButton";
import { Card, Pill, StatusIcon } from "./ui";

export default function SeoSection({
  seo,
  pageUrl,
}: {
  seo: SectionResult<SeoReport>;
  pageUrl: string;
}) {
  const report = seo.data;

  return (
    <Card
      title="SEO & Meta Tags"
      subtitle="Tags that control how the page appears in search results and social previews"
      error={seo.error}
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
        <>
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
                        category: "SEO tags",
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

          {report.declaredSitemaps.length > 0 ? (
            <p className="break-anywhere mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Sitemaps declared in robots.txt: {report.declaredSitemaps.join(", ")}
            </p>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
