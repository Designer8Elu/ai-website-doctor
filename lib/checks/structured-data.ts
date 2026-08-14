import type { CheerioAPI } from "cheerio";
import type { StructuredDataIssue, StructuredDataReport } from "../types";

function buildIssue(label: string, detail: string): StructuredDataIssue {
  return { label, detail, status: "fail" };
}

export function runStructuredDataCheck($: CheerioAPI): StructuredDataReport {
  const issues: StructuredDataIssue[] = [];
  const blocks = $('script[type="application/ld+json" i]').toArray();

  if (blocks.length === 0) {
    issues.push(buildIssue("Structured data", "No JSON-LD structured data was found on the page."));
    return { items: [], issues, passed: 0, warned: 0, failed: 1 };
  }

  function extractStructuredDataTypes(entry: unknown): string[] {
    if (!entry || typeof entry !== "object") return [];
    if (Array.isArray(entry)) {
      return entry.flatMap(extractStructuredDataTypes);
    }

    const types: string[] = [];
    if ("@type" in entry) {
      const typeValue = (entry as { "@type"?: unknown })["@type"];
      if (typeof typeValue === "string") {
        types.push(typeValue);
      } else if (Array.isArray(typeValue)) {
        types.push(...typeValue.filter((item): item is string => typeof item === "string"));
      }
    }

    for (const value of Object.values(entry)) {
      if (typeof value === "object" && value !== null) {
        types.push(...extractStructuredDataTypes(value));
      }
    }

    return types;
  }

  const items = blocks.map((element, index) => {
    const raw = $(element).contents().text().trim();
    if (!raw) {
      issues.push(buildIssue(`Structured data #${index + 1}`, "The JSON-LD block is empty."));
      return { type: `JSON-LD #${index + 1}`, valid: false, issue: "Empty block" };
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      const types = Array.from(
        new Set(entries.flatMap((entry) => extractStructuredDataTypes(entry)))
      );

      if (types.length === 0) {
        issues.push(buildIssue(`Structured data #${index + 1}`, "The JSON-LD block is missing @type."));
        return { type: `JSON-LD #${index + 1}`, valid: false, issue: "Missing @type" };
      }

      return { type: types.join(" + "), valid: true, issue: null };
    } catch {
      issues.push(buildIssue(`Structured data #${index + 1}`, "The JSON-LD block contains invalid JSON."));
      return { type: `JSON-LD #${index + 1}`, valid: false, issue: "Invalid JSON" };
    }
  });

  const failed = issues.filter((issue) => issue.status === "fail").length;
  const warned = issues.filter((issue) => issue.status === "warn").length;
  return { items, issues, passed: Math.max(0, items.length - failed - warned), warned, failed };
}
