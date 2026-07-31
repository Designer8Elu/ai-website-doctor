import type { LinkResult, LinksReport, SectionResult } from "@/lib/types";
import { Card, EmptyNote, Pill } from "./ui";

/** 4xx/5xx and network errors are red; a slow-but-alive redirect chain is fine. */
function statusLabel(link: LinkResult): { text: string; status: "pass" | "warn" | "fail" } {
  if (link.error) return { text: link.error, status: "fail" };
  if (link.status === null) return { text: "No response", status: "fail" };
  if (link.status >= 500) return { text: `${link.status} server error`, status: "fail" };
  if (link.status >= 400) return { text: `${link.status} not found`, status: "fail" };
  if (link.status >= 300) return { text: `${link.status} redirect`, status: "warn" };
  return { text: `${link.status} OK`, status: "pass" };
}

function LinkRow({ link }: { link: LinkResult }) {
  const label = statusLabel(link);
  return (
    <tr className="align-top">
      <td className="break-anywhere max-w-[24rem] py-2 pr-3 font-mono text-xs text-slate-600">
        {link.url}
        {link.redirectedTo ? (
          <span className="block text-slate-400">→ {link.redirectedTo}</span>
        ) : null}
      </td>
      <td className="py-2">
        <Pill status={label.status}>{label.text}</Pill>
      </td>
    </tr>
  );
}

export default function LinksSection({ links }: { links: SectionResult<LinksReport> }) {
  const report = links.data;
  const broken = report?.broken ?? [];

  return (
    <Card
      title="Internal Links"
      subtitle="Same-domain links found on this page, checked with a HEAD request"
      error={links.error}
      aside={
        report ? (
          <>
            <Pill status={null}>{report.checked} checked</Pill>
            <Pill status={broken.length > 0 ? "fail" : "pass"}>{broken.length} broken</Pill>
          </>
        ) : null
      }
    >
      {report ? (
        report.checked === 0 ? (
          <EmptyNote>No internal links were found on this page.</EmptyNote>
        ) : (
          <div className="space-y-4">
            {broken.length === 0 ? (
              <EmptyNote>All {report.checked} internal links responded successfully.</EmptyNote>
            ) : (
              <div className="overflow-x-auto">
                <h3 className="mb-2 text-sm font-semibold text-red-700">Broken links</h3>
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {broken.map((link) => (
                      <LinkRow key={link.url} link={link} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <details className="rounded-lg border border-slate-200">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700 select-none">
                All {report.checked} checked links
              </summary>
              <div className="overflow-x-auto border-t border-slate-100 px-3 pb-2">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {report.results.map((link) => (
                      <LinkRow key={link.url} link={link} />
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            {report.truncated ? (
              <p className="text-xs text-slate-500">
                Found {report.found} internal links; checked the first {report.checked}. Whole-site
                crawling is a future version.
              </p>
            ) : null}
          </div>
        )
      ) : null}
    </Card>
  );
}
