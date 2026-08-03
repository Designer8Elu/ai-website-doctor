"use client";

import { useState } from "react";

import type { PerformanceReport, Strategy, StrategyReport } from "@/lib/types";
import { Card, Pill, ScoreDial, statusFromUnitScore, stylesFor } from "./ui";

function MetricGrid({ report }: { report: StrategyReport }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {report.metrics.map((metric) => {
        const styles = stylesFor(statusFromUnitScore(metric.score));
        return (
          <div key={metric.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <dt className="text-xs font-medium text-slate-500">{metric.label}</dt>
            <dd className={`mt-1 text-lg font-semibold tabular-nums ${styles.text}`}>
              {metric.displayValue ?? "–"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function Suggestions({ report }: { report: StrategyReport }) {
  if (report.suggestions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No significant improvement opportunities were reported for {report.strategy}.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {report.suggestions.map((suggestion, index) => (
        <li key={suggestion.id} className="rounded-lg border border-slate-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
              {index + 1}
            </span>
            <h4 className="text-sm font-semibold text-slate-900">{suggestion.title}</h4>
            {suggestion.savingsMs ? (
              <Pill status="warn">Est. saving {(suggestion.savingsMs / 1000).toFixed(2)}s</Pill>
            ) : null}
            {suggestion.displayValue ? (
              <span className="text-xs text-slate-500">{suggestion.displayValue}</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{suggestion.description}</p>
        </li>
      ))}
    </ol>
  );
}

export default function PerformanceSection({ performance, pageUrl }: { performance: PerformanceReport; pageUrl: string }) {
  const [strategy, setStrategy] = useState<Strategy>("mobile");

  const active = performance[strategy];
  const bothFailed = !performance.mobile.data && !performance.desktop.data;

  return (
    <Card
      title="Performance"
      subtitle="Google PageSpeed Insights (Lighthouse), lab data"
      error={
        bothFailed
          ? (performance.mobile.error ?? performance.desktop.error ?? "PageSpeed Insights failed.")
          : null
      }
      aside={
        <div className="flex items-center gap-6">
          <ScoreDial score={performance.mobile.data?.performanceScore ?? null} label="Mobile" size="sm" />
          <ScoreDial score={performance.desktop.data?.performanceScore ?? null} label="Desktop" size="sm" />
        </div>
      }
    >
      <div className="space-y-4">
        {/* Mobile / desktop toggle — both scores stay visible in the header. */}
        <div
          role="tablist"
          aria-label="PageSpeed strategy"
          className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5"
        >
          {(["mobile", "desktop"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={strategy === option}
              onClick={() => setStrategy(option)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                strategy === option
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {active.data ? (
          <div className="space-y-5">
            <MetricGrid report={active.data} />
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Top improvements</h3>
              <Suggestions report={active.data} />
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {active.error ?? `No ${strategy} result available.`}
          </p>
        )}
      </div>
    </Card>
  );
}
