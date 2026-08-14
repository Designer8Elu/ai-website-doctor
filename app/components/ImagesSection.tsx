import type { ImagesReport, SectionResult } from "@/lib/types";
import RecommendedFixButton from "./RecommendedFixButton";
import { Card, EmptyNote, Pill } from "./ui";

function Stat({ label, value, status }: { label: string; value: number; status: "pass" | "warn" | "fail" }) {
  const tone = value === 0 ? "pass" : status;
  return (
    <div className="rounded-lg border border-gray-200 bg-white-50 px-3 py-2.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1">
        <Pill status={tone}>{value}</Pill>
      </p>
    </div>
  );
}

export default function ImagesSection({
  images,
  pageUrl,
}: {
  images: SectionResult<ImagesReport>;
  pageUrl: string;
}) {
  const report = images.data;
  const flagged = report?.items.filter((item) => item.issues.length > 0) ?? [];

  return (
    <Card
      title="Images"
      subtitle="Static checks on every <img> tag found in the HTML"
      error={images.error}
      aside={report ? <Pill status={null}>{report.total} images</Pill> : null}
    >
      {report ? (
        report.total === 0 ? (
          <EmptyNote>No &lt;img&gt; tags were found on this page.</EmptyNote>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Missing alt" value={report.missingAlt} status="fail" />
              <Stat label="Empty alt" value={report.emptyAlt} status="warn" />
              <Stat label='No loading="lazy"' value={report.missingLazy} status="warn" />
              <Stat label="No width/height" value={report.missingDimensions} status="warn" />
            </div>

            {flagged.length === 0 ? (
              <EmptyNote>Every image passed the checks. Nice.</EmptyNote>
            ) : (
              <div className="overflow-x-auto">
                <div className="w-full min-w-[32rem] text-left text-sm">
                  <div className="flex justify-between w-full">
                    <div className="flex row justify-between w-full border-b border-gray-200 text-xs tracking-wide text-slate-500 uppercase">
                      <h4 className="py-2 pr-3 font-medium">Image</h4>
                      <h4 className="py-2 font-medium">Issues</h4>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {flagged.map((item, index) => (
                      <div key={`${item.src}-${index}`} className="align-top flex justify-between gap-3 flex-row flex-wrap w-full ">
                        <div className="w-9/12 break-anywhere max-w-[22rem] py-2 pr-3 font-mono text-xs text-slate-600">
                          {item.src}
                        </div>
                        <div className="py-2 w-3/12">
                          <ul className="space-y-1">
                            {item.issues.map((issue) => (
                              <li key={issue} className="text-slate-600 text-right">
                                • {issue}
                              </li>
                            ))}
                          </ul>
                          </div>
                          <RecommendedFixButton
                            context={{
                              category: "Images",
                              label: "Image hygiene issue",
                              status: "warn",
                              detail: item.issues.join("; "),
                              value: item.src,
                              pageUrl,
                            }}
                          />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {report.truncated ? (
              <p className="text-xs text-slate-500">
                Showing the {report.items.length} images with the most issues out of {report.total}.
              </p>
            ) : null}

            {/* FUTURE (v2): actual file size vs. rendered size, and format hints. */}
          </div>
        )
      ) : null}
    </Card>
  );
}
