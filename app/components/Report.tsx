import type { AuditReport, CheckStatus } from "@/lib/types";
import AccessibilitySection from "./AccessibilitySection";
import ClientSummarySection from "./ClientSummarySection";
import ContentSeoSection from "./ContentSeoSection";
import HtmlSection from "./HtmlSection";
import ImagesSection from "./ImagesSection";
import LinksSection from "./LinksSection";
import PerformanceSection from "./PerformanceSection";
import SecuritySection from "./SecuritySection";
import SeoSection from "./SeoSection";
import StructuredDataSection from "./StructuredDataSection";
import { ScoreDial, statusFromScore, stylesFor } from "./ui";

/** One at-a-glance tile in the summary strip. */
function SummaryTile({
  label,
  value,
  status,
  hint,
  targetId,
}: {
  label: string;
  value: string;
  status: CheckStatus | null;
  hint: string;
  targetId: string;
}) {
  const styles = stylesFor(status);

  function handleClick() {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-3xl border border-gray-200 bg-white px-5 py-4 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 ">{label}</p>
      <p className={`mt-3 text-2xl font-semibold tabular-nums  ${styles.text}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-400 ">{hint}</p>
    </button>
  );
}

function ExportPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden cursor-pointer inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      Export PDF
    </button>
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
  const security = report.security.data;
  const structuredData = report.structuredData.data;
  const pageUrl = report.page.data?.finalUrl ?? report.requestedUrl;

  const seoTotal = seo?.checks.length ?? 0;
  const contentSeoTotal = contentSeo?.checks.length ?? 0;
  const imageIssues = images ? images.missingAlt + images.missingLazy : null;
  const brokenCount = links?.broken.length ?? null;
  const accessibilityIssues = accessibility?.issues.length ?? null;
  const securityIssues = security?.issues.length ?? null;
  const structuredDataIssues = structuredData?.issues.length ?? null;

  return (
    <div className="space-y-5">
      {/* Report header ------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl glass px-5 py-4">
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
        <div className="flex items-center gap-4">
          <ExportPdfButton />
          <ScoreDial score={mobileScore} label="Mobile score" />
        </div>
      </div>

      {/* At-a-glance summary ------------------------------------------ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <SummaryTile
          label="Performance"
          value={mobileScore === null ? "-" : String(mobileScore)}
          status={statusFromScore(mobileScore)}
          hint="Mobile Lighthouse score"
          targetId="performance-section"
        />
        <SummaryTile
          label="SEO tags"
          value={seo ? `${seo.passed}/${seoTotal}` : "-"}
          status={seo ? (seo.failed > 0 ? "fail" : seo.warned > 0 ? "warn" : "pass") : null}
          hint={seo ? `${seo.failed} missing, ${seo.warned} to review` : "Check unavailable"}
          targetId="seo-section"
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
          targetId="content-seo-section"
        />
        <SummaryTile
          label="Images"
          value={imageIssues === null ? "-" : String(imageIssues)}
          status={imageIssues === null ? null : imageIssues === 0 ? "pass" : "warn"}
          hint={images ? `across ${images.total} images` : "Check unavailable"}
          targetId="images-section"
        />
        <SummaryTile
          label="Broken links"
          value={brokenCount === null ? "-" : String(brokenCount)}
          status={brokenCount === null ? null : brokenCount === 0 ? "pass" : "fail"}
          hint={links ? `of ${links.checked} internal links` : "Check unavailable"}
          targetId="links-section"
        />
        <SummaryTile
          label="Accessibility"
          value={accessibilityIssues === null ? "-" : String(accessibilityIssues)}
          status={accessibilityIssues === null ? null : accessibilityIssues === 0 ? "pass" : "warn"}
          hint={accessibility ? `${accessibility.failed} blocking issues` : "Check unavailable"}
          targetId="accessibility-section"
        />
      </div>

      <ClientSummarySection report={report} />

      {/* Detailed sections -------------------------------------------- */}
      <div id="performance-section" />
      <PerformanceSection performance={report.performance} pageUrl={pageUrl} />
      <div id="html-section" />
      <HtmlSection html={report.html} pageUrl={pageUrl} />
      <div id="accessibility-section" />
      <AccessibilitySection accessibility={report.accessibility} pageUrl={pageUrl} />
      <div id="security-section" />
      <SecuritySection security={report.security} pageUrl={pageUrl} />
      <div id="structured-data-section" />
      <StructuredDataSection structuredData={report.structuredData} pageUrl={pageUrl} />
      <div id="seo-section" />
      <SeoSection seo={report.seo} pageUrl={pageUrl} />
      <div id="content-seo-section" />
      <ContentSeoSection contentSeo={report.contentSeo} pageUrl={pageUrl} />
      <div id="images-section" />
      <ImagesSection images={report.images} pageUrl={pageUrl} />
      <div id="links-section" />
      <LinksSection links={report.links} pageUrl={pageUrl} />

      {/* FUTURE SECTIONS - drop new <Card> blocks in here once the modules exist:
       *   <CodeAuditSection />       unused CSS, minification, console errors
       *   <RecommendationsSection /> AI plain-English summary of everything above
       */}
    </div>
  );
}
