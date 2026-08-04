import type { AuditReport } from "@/lib/types";

export const AUDIT_REPORT_STORAGE_KEY = "ai-website-doctor-latest-report";
export const AUDIT_REPORT_URL_STORAGE_KEY = "ai-website-doctor-latest-url";

export function saveLatestAuditReport(report: AuditReport) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(AUDIT_REPORT_STORAGE_KEY, JSON.stringify(report));
  window.localStorage.setItem(
    AUDIT_REPORT_URL_STORAGE_KEY,
    report.page.data?.finalUrl ?? report.requestedUrl,
  );
}

export function loadLatestAuditReport(): AuditReport | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUDIT_REPORT_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuditReport;
  } catch {
    return null;
  }
}

export function loadLatestAuditUrl(): string {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(AUDIT_REPORT_URL_STORAGE_KEY) ?? "";
}
