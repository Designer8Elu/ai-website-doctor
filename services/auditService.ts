import type { AuditReport } from "@/lib/types";

export async function runAudit(url: string): Promise<AuditReport> {
  const response = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  let payload: unknown = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(
      (payload as { error?: string } | null)?.error ??
        `Request failed with HTTP ${response.status}.`,
    );
  }

  return payload as AuditReport;
}
