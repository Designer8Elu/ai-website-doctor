import type { CheerioAPI } from "cheerio";

import { resolveUrl } from "@/lib/url";
import type { CheckStatus, ContentSeoQualityCheck, ContentSeoQualityReport, StructuredDataItem } from "@/lib/types";

const THIN_CONTENT_FAIL_WORDS = 100;
const THIN_CONTENT_WARN_WORDS = 300;
const MAX_H1_EXAMPLES = 5;

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  const words = compactText(text).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g);
  return words?.length ?? 0;
}

function tally(checks: ContentSeoQualityCheck[], status: CheckStatus): number {
  return checks.filter((check) => check.status === status).length;
}

function visibleBodyWordCount($: CheerioAPI): number {
  const body = $("body").clone();
  body.find("script, style, noscript, svg, canvas, template").remove();
  return countWords(body.text());
}

function getRobotsDirectives($: CheerioAPI): string[] {
  const directives = new Set<string>();

  $('meta[name="robots" i], meta[name="googlebot" i]').each((_, element) => {
    const content = $(element).attr("content");
    if (!content) return;

    for (const directive of content.split(",")) {
      const normalized = directive.trim().toLowerCase();
      if (normalized) directives.add(normalized);
    }
  });

  return [...directives];
}

function parseStructuredData($: CheerioAPI): StructuredDataItem[] {
  return $('script[type="application/ld+json" i]')
    .toArray()
    .map((element, index) => {
      const raw = $(element).contents().text().trim();
      if (!raw) {
        return { type: `JSON-LD #${index + 1}`, valid: false, issue: "Script is empty." };
      }

      try {
        const parsed = JSON.parse(raw) as unknown;
        const entries = Array.isArray(parsed) ? parsed : [parsed];
        const types = entries
          .map((entry) => {
            if (!entry || typeof entry !== "object" || !("@type" in entry)) return null;
            const type = (entry as { "@type"?: unknown })["@type"];
            return Array.isArray(type) ? type.join(", ") : typeof type === "string" ? type : null;
          })
          .filter((type): type is string => Boolean(type));

        return {
          type: types.length > 0 ? types.join(" + ") : `JSON-LD #${index + 1}`,
          valid: types.length > 0,
          issue: types.length > 0 ? null : "Missing @type.",
        };
      } catch {
        return { type: `JSON-LD #${index + 1}`, valid: false, issue: "Invalid JSON." };
      }
    });
}

function checkH1(h1Count: number, h1Texts: string[]): ContentSeoQualityCheck {
  if (h1Count === 0) {
    return {
      id: "h1-count",
      label: "Primary H1",
      status: "fail",
      value: null,
      detail: "Missing H1. Each indexable page should have one clear primary heading.",
    };
  }

  if (h1Count > 1) {
    return {
      id: "h1-count",
      label: "Primary H1",
      status: "warn",
      value: `${h1Count} H1 tags`,
      detail: "Multiple H1 tags can dilute the page topic. Keep one primary H1 where possible.",
    };
  }

  return {
    id: "h1-count",
    label: "Primary H1",
    status: "pass",
    value: h1Texts[0],
    detail: "Exactly one H1 found.",
  };
}

function checkTitleH1(title: string | null, h1Texts: string[]): ContentSeoQualityCheck {
  if (!title || h1Texts.length === 0) {
    return {
      id: "title-h1",
      label: "Title and H1 relationship",
      status: "warn",
      value: null,
      detail: "Could not compare because the title or H1 is missing.",
    };
  }

  const primaryH1 = h1Texts[0];
  if (compactText(title).toLowerCase() === compactText(primaryH1).toLowerCase()) {
    return {
      id: "title-h1",
      label: "Title and H1 relationship",
      status: "warn",
      value: primaryH1,
      detail: "The title and H1 are identical. Use the title for search context and the H1 for the page promise.",
    };
  }

  return {
    id: "title-h1",
    label: "Title and H1 relationship",
    status: "pass",
    value: primaryH1,
    detail: "Title and H1 are distinct.",
  };
}

function checkContentDepth(wordCount: number): ContentSeoQualityCheck {
  if (wordCount < THIN_CONTENT_FAIL_WORDS) {
    return {
      id: "content-depth",
      label: "Content depth",
      status: "fail",
      value: `${wordCount} words`,
      detail: `Very little readable body copy found. Aim for at least ${THIN_CONTENT_WARN_WORDS} useful words on pages meant to rank.`,
    };
  }

  if (wordCount < THIN_CONTENT_WARN_WORDS) {
    return {
      id: "content-depth",
      label: "Content depth",
      status: "warn",
      value: `${wordCount} words`,
      detail: `Thin content risk. Pages meant to rank usually need at least ${THIN_CONTENT_WARN_WORDS} useful words.`,
    };
  }

  return {
    id: "content-depth",
    label: "Content depth",
    status: "pass",
    value: `${wordCount} words`,
    detail: "Readable body copy is above the MVP threshold.",
  };
}

function checkRobots(directives: string[]): ContentSeoQualityCheck {
  const blocking = directives.filter((directive) => directive === "noindex" || directive === "none");

  if (blocking.length > 0) {
    return {
      id: "indexing-directives",
      label: "Indexing directives",
      status: "fail",
      value: directives.join(", "),
      detail: "This page tells search engines not to index it.",
    };
  }

  if (directives.includes("nofollow")) {
    return {
      id: "indexing-directives",
      label: "Indexing directives",
      status: "warn",
      value: directives.join(", "),
      detail: "The page allows indexing but discourages following links.",
    };
  }

  return {
    id: "indexing-directives",
    label: "Indexing directives",
    status: "pass",
    value: directives.length > 0 ? directives.join(", ") : null,
    detail: directives.length > 0 ? "No blocking robots directives found." : "No robots meta restrictions found.",
  };
}

function checkCanonical($: CheerioAPI, pageUrl: string): ContentSeoQualityCheck {
  const rawCanonical = $('link[rel="canonical" i]').first().attr("href")?.trim() || null;

  if (!rawCanonical) {
    return {
      id: "canonical-quality",
      label: "Canonical URL quality",
      status: "fail",
      value: null,
      detail: "Missing canonical URL.",
    };
  }

  const resolved = resolveUrl(rawCanonical, pageUrl);
  if (!resolved) {
    return {
      id: "canonical-quality",
      label: "Canonical URL quality",
      status: "fail",
      value: rawCanonical,
      detail: "Canonical URL could not be resolved.",
    };
  }

  const canonical = new URL(resolved);
  const current = new URL(pageUrl);
  canonical.hash = "";
  current.hash = "";

  if (canonical.hostname.replace(/^www\./, "") !== current.hostname.replace(/^www\./, "")) {
    return {
      id: "canonical-quality",
      label: "Canonical URL quality",
      status: "warn",
      value: canonical.toString(),
      detail: "Canonical points to a different hostname. Confirm this is intentional.",
    };
  }

  return {
    id: "canonical-quality",
    label: "Canonical URL quality",
    status: "pass",
    value: canonical.toString(),
    detail: "Canonical URL is present and resolvable.",
  };
}

function checkStructuredData(items: StructuredDataItem[]): ContentSeoQualityCheck {
  if (items.length === 0) {
    return {
      id: "structured-data",
      label: "Structured data",
      status: "warn",
      value: null,
      detail: "No JSON-LD structured data found.",
    };
  }

  const invalid = items.filter((item) => !item.valid);
  if (invalid.length > 0) {
    return {
      id: "structured-data",
      label: "Structured data",
      status: "fail",
      value: `${invalid.length}/${items.length} invalid`,
      detail: "One or more JSON-LD blocks are invalid or missing @type.",
    };
  }

  return {
    id: "structured-data",
    label: "Structured data",
    status: "pass",
    value: items.map((item) => item.type).join(", "),
    detail: "JSON-LD blocks parse successfully and declare @type.",
  };
}

export function runContentSeoQualityCheck($: CheerioAPI, pageUrl: string): ContentSeoQualityReport {
  const title = $("head title").first().text().trim() || null;
  const allH1Texts = $("h1")
    .toArray()
    .map((element) => compactText($(element).text()))
    .filter(Boolean);
  const h1Texts = allH1Texts.slice(0, MAX_H1_EXAMPLES);
  const wordCount = visibleBodyWordCount($);
  const directives = getRobotsDirectives($);
  const structuredData = parseStructuredData($);

  const checks = [
    checkH1(allH1Texts.length, h1Texts),
    checkTitleH1(title, h1Texts),
    checkContentDepth(wordCount),
    checkRobots(directives),
    checkCanonical($, pageUrl),
    checkStructuredData(structuredData),
  ];

  return {
    checks,
    passed: tally(checks, "pass"),
    warned: tally(checks, "warn"),
    failed: tally(checks, "fail"),
    wordCount,
    h1Count: allH1Texts.length,
    h1Texts,
    noindex: directives.includes("noindex") || directives.includes("none"),
    structuredData,
  };
}
