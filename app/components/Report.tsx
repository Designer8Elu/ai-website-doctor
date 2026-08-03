import type { AuditReport, CheckStatus } from "@/lib/types";
import AccessibilitySection from "./AccessibilitySection";
import ContentSeoSection from "./ContentSeoSection";
import HtmlSection from "./HtmlSection";
import ImagesSection from "./ImagesSection";
import LinksSection from "./LinksSection";
import PerformanceSection from "./PerformanceSection";
import SeoSection from "./SeoSection";
import { ScoreDial, statusFromScore, stylesFor } from "./ui";

/** One at-a-glance tile in the summary strip. */
function SummaryTile({
  label,
  value,
  status,
  hint,
}: {
  label: string;
  value: string;
  status: CheckStatus | null;
  hint: string;
}) {
  const styles = stylesFor(status);
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${styles.text}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function Report({ report }: { report: AuditReport }) {
  const mobileScore = report.performance.mobile.data?.performanceScore ?? null;
  const seo = report.seo.data;
  const contentSeo = report.contentSeo.data;
  const images = report.images.data;
  const links = report.links.data;
  const html = report.html.data;
  const accessibility = report.accessibility.data;
  const pageUrl = report.page.data?.finalUrl ?? report.requestedUrl;

  const seoTotal = seo?.checks.length ?? 0;
  const contentSeoTotal = contentSeo?.checks.length ?? 0;
  const imageIssues = images ? images.missingAlt + images.missingLazy : null;
  const brokenCount = links?.broken.length ?? null;
  const accessibilityIssues = accessibility?.issues.length ?? null;

  return (
    <div className="space-y-5">
      {/* Report header ------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Health report
          </p>
          <a
            href={report.page.data?.finalUrl ?? report.requestedUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="break-anywhere text-lg font-semibold text-slate-900 hover:text-blue-700 hover:underline"
          >
            {report.page.data?.finalUrl ?? report.requestedUrl}
          </a>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(report.fetchedAt).toLocaleString()} - completed in{" "}
            {(report.durationMs / 1000).toFixed(1)}s
          </p>
        </div>
        <ScoreDial score={mobileScore} label="Mobile score" />
      </div>

      {/* At-a-glance summary ------------------------------------------ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <SummaryTile
          label="Performance"
          value={mobileScore === null ? "-" : String(mobileScore)}
          status={statusFromScore(mobileScore)}
          hint="Mobile Lighthouse score"
        />
        <SummaryTile
          label="SEO tags"
          value={seo ? `${seo.passed}/${seoTotal}` : "-"}
          status={seo ? (seo.failed > 0 ? "fail" : seo.warned > 0 ? "warn" : "pass") : null}
          hint={seo ? `${seo.failed} missing, ${seo.warned} to review` : "Check unavailable"}
        />
        <SummaryTile
          label="Content SEO"
          value={contentSeo ? `${contentSeo.passed}/${contentSeoTotal}` : "-"}
          status={
            contentSeo
              ? contentSeo.failed > 0
                ? "fail"
                : contentSeo.warned > 0
                  ? "warn"
                  : "pass"
              : null
          }
          hint={contentSeo ? `${contentSeo.failed} fail, ${contentSeo.warned} warn` : "Check unavailable"}
        />
        <SummaryTile
          label="Images"
          value={imageIssues === null ? "-" : String(imageIssues)}
          status={imageIssues === null ? null : imageIssues === 0 ? "pass" : "warn"}
          hint={images ? `across ${images.total} images` : "Check unavailable"}
        />
        <SummaryTile
          label="Broken links"
          value={brokenCount === null ? "-" : String(brokenCount)}
          status={brokenCount === null ? null : brokenCount === 0 ? "pass" : "fail"}
          hint={links ? `of ${links.checked} internal links` : "Check unavailable"}
        />
        <SummaryTile
          label="Accessibility"
          value={accessibilityIssues === null ? "-" : String(accessibilityIssues)}
          status={accessibilityIssues === null ? null : accessibilityIssues === 0 ? "pass" : "warn"}
          hint={accessibility ? `${accessibility.failed} blocking issues` : "Check unavailable"}
        />
      </div>

      {/* Detailed sections -------------------------------------------- */}
      <PerformanceSection performance={report.performance} pageUrl={pageUrl} />
      <HtmlSection html={report.html} pageUrl={pageUrl} />
      <AccessibilitySection accessibility={report.accessibility} pageUrl={pageUrl} />
      <SeoSection seo={report.seo} pageUrl={pageUrl} />
      <ContentSeoSection contentSeo={report.contentSeo} pageUrl={pageUrl} />
      <ImagesSection images={report.images} pageUrl={pageUrl} />
      <LinksSection links={report.links} pageUrl={pageUrl} />

      {/* FUTURE SECTIONS - drop new <Card> blocks in here once the modules exist:
       *   <CodeAuditSection />       unused CSS, minification, console errors
       *   <RecommendationsSection /> AI plain-English summary of everything above
       */}
    </div>
  );
}
