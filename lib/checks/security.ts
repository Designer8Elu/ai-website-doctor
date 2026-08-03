import type { SecurityHeadersIssue, SecurityHeadersReport } from "../types";

function buildIssue(label: string, detail: string): SecurityHeadersIssue {
  return { label, detail, status: "fail" };
}

export function runSecurityHeadersCheck(headers: Record<string, string | null | undefined>): SecurityHeadersReport {
  const issues: SecurityHeadersIssue[] = [];
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value ?? ""]),
  );

  const required = [
    {
      key: "x-frame-options",
      label: "X-Frame-Options",
      detail: "Add X-Frame-Options to prevent clickjacking.",
    },
    {
      key: "strict-transport-security",
      label: "HSTS",
      detail: "Add Strict-Transport-Security to enforce HTTPS.",
    },
    {
      key: "content-security-policy",
      label: "Content-Security-Policy",
      detail: "Add a Content-Security-Policy to reduce XSS risk.",
    },
    {
      key: "referrer-policy",
      label: "Referrer-Policy",
      detail: "Add Referrer-Policy to limit leakage of referral data.",
    },
    {
      key: "x-content-type-options",
      label: "X-Content-Type-Options",
      detail: "Add X-Content-Type-Options: nosniff to reduce MIME sniffing risk.",
    },
  ];

  for (const header of required) {
    if (!normalized[header.key] || normalized[header.key].trim() === "") {
      issues.push(buildIssue(header.label, header.detail));
    }
  }

  const failed = issues.filter((issue) => issue.status === "fail").length;
  const warned = issues.filter((issue) => issue.status === "warn").length;

  return { issues, passed: required.length - failed - warned, warned, failed };
}
