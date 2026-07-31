/** Small presentational primitives shared by every report section. */

import { useState, type ReactNode } from "react";

import type { CheckStatus } from "@/lib/types";

/* Lighthouse's own colour thresholds, reused everywhere for consistency. */
export const GOOD_SCORE = 90;
export const OK_SCORE = 50;

/** Map a 0–100 score to the traffic-light status used across the report. */
export function statusFromScore(score: number | null): CheckStatus | null {
  if (score === null) return null;
  if (score >= GOOD_SCORE) return "pass";
  if (score >= OK_SCORE) return "warn";
  return "fail";
}

/** Map a Lighthouse 0–1 audit score to the same scale. */
export function statusFromUnitScore(score: number | null): CheckStatus | null {
  return score === null ? null : statusFromScore(Math.round(score * 100));
}

const STATUS_STYLES: Record<CheckStatus, { chip: string; text: string; ring: string }> = {
  pass: {
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-600",
    ring: "border-emerald-500 text-emerald-600 bg-emerald-50",
  },
  warn: {
    chip: "bg-amber-50 text-amber-800 border-amber-200",
    text: "text-amber-600",
    ring: "border-amber-500 text-amber-700 bg-amber-50",
  },
  fail: {
    chip: "bg-red-50 text-red-700 border-red-200",
    text: "text-red-600",
    ring: "border-red-500 text-red-600 bg-red-50",
  },
};

const NEUTRAL = {
  chip: "bg-slate-100 text-slate-600 border-slate-200",
  text: "text-slate-500",
  ring: "border-slate-300 text-slate-500 bg-slate-50",
};

export function stylesFor(status: CheckStatus | null) {
  return status ? STATUS_STYLES[status] : NEUTRAL;
}

/** ✅ / ⚠️ / ❌ as a coloured glyph. */
export function StatusIcon({ status }: { status: CheckStatus }) {
  const glyph = status === "pass" ? "✅" : status === "warn" ? "⚠️" : "❌";
  const label = status === "pass" ? "Pass" : status === "warn" ? "Warning" : "Fail";
  return (
    <span role="img" aria-label={label} className="text-base leading-none">
      {glyph}
    </span>
  );
}

export function Pill({
  status,
  children,
}: {
  status: CheckStatus | null;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stylesFor(status).chip}`}
    >
      {children}
    </span>
  );
}

/** The big 0–100 number used for the two PageSpeed scores. */
export function ScoreDial({
  score,
  label,
  size = "lg",
}: {
  score: number | null;
  label: string;
  size?: "lg" | "sm";
}) {
  const styles = stylesFor(statusFromScore(score));
  const dimensions = size === "lg" ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex ${dimensions} items-center justify-center rounded-full border-4 font-bold tabular-nums ${styles.ring}`}
      >
        {score ?? "–"}
      </div>
      <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</span>
    </div>
  );
}

/** Section shell: heading, optional right-hand summary, and error handling. */
export function Card({
  title,
  subtitle,
  aside,
  error,
  children,
  collapsible = false,
  defaultExpanded = true,
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
  error?: string | null;
  children?: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const showBody = !collapsible || expanded;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {aside ? <div className="flex items-center gap-2">{aside}</div> : null}
          {collapsible ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
            >
              {expanded ? "Hide" : "Show"}
            </button>
          ) : null}
        </div>
      </header>

      {showBody ? (
        <div className="px-5 py-4">
          {error ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error}
            </p>
          ) : (
            children
          )}
        </div>
      ) : null}
    </section>
  );
}

/** Zero-state line used when a check ran but found nothing to report. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}
