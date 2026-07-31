import type { HtmlReport } from "../types";

function normalize(text: string): string {
  return text.replace(/\r\n?/g, "\n").trim();
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function detectDoctype(html: string): string | null {
  const match = /<!doctype\s+html[^>]*>/i.exec(html);
  return match ? match[0] : null;
}

function detectMissingStructure(html: string): string[] {
  const issues: string[] = [];
  if (!/<html\b/i.test(html)) issues.push("Missing <html> root element.");
  if (!/<head\b/i.test(html)) issues.push("Missing <head> element.");
  if (!/<body\b/i.test(html)) issues.push("Missing <body> element.");
  return issues;
}

function getLineAndColumn(text: string, index: number): string {
  const before = text.slice(0, index);
  const line = before.split("\n").length;
  const lastLineBreak = before.lastIndexOf("\n");
  const column = lastLineBreak === -1 ? index + 1 : index - lastLineBreak;
  return `line ${line}, column ${column}`;
}

function stripIgnoredContent(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

function detectCommonTagIssues(html: string): string[] {
  const issues: string[] = [];
  const safeHtml = stripIgnoredContent(html);
  const tagPattern = /<\/?(p|div|span|li|ul|ol|main|section|article|header|footer|table|tr|td|th|form|button|select|option|textarea|details|summary|h[1-6])\b[^>]*>/gi;
  const stack: Array<{ tag: string; location: string }> = [];

  for (const match of safeHtml.matchAll(tagPattern)) {
    const raw = match[0];
    const tag = (match[1] || "").toLowerCase();
    const isClosing = raw.startsWith("</");
    const location = getLineAndColumn(safeHtml, match.index ?? 0);

    if (!tag) continue;

    if (isClosing) {
      const matchingIndex = stack.findLastIndex((entry) => entry.tag === tag);

      if (matchingIndex === -1) {
        issues.push(`Mismatched closing tag </${tag}> at ${location}.`);
        continue;
      }

      if (matchingIndex === stack.length - 1) {
        stack.pop();
      } else {
        const openTag = stack[matchingIndex];
        issues.push(`Mismatched closing tag </${tag}> at ${location}; likely unclosed: <${openTag.tag}> opened at ${openTag.location}.`);
        stack.length = matchingIndex;
      }
      continue;
    }

    if (!/\/>$/.test(raw)) {
      stack.push({ tag, location });
    }
  }

  if (stack.length > 0) {
    const pending = stack[stack.length - 1];
    issues.push(`Possible unclosed block-level elements detected. Likely unclosed: <${pending.tag}> opened at ${pending.location}.`);
  }

  return issues;
}

function buildHierarchy(html: string) {
  const headingPattern = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const hierarchy: Array<{ tag: string; text: string; level: number }> = [];
  const issues: string[] = [];
  let previousLevel = 0;

  for (const match of html.matchAll(headingPattern)) {
    const [, tag, content] = match;
    const level = Number(tag[1]);
    const text = stripTags(content);

    if (!text) continue;

    if (previousLevel && level > previousLevel + 1) {
      issues.push(`Heading structure jumps from H${previousLevel} to H${level}.`);
    }

    hierarchy.push({ tag: tag.toUpperCase(), text, level });
    previousLevel = level;
  }

  return { hierarchy, issues };
}

export function validateHtmlDocument(html: string): HtmlReport {
  const normalized = normalize(html);
  const { hierarchy, issues: hierarchyIssues } = buildHierarchy(normalized);
  const issues = [
    ...detectDoctype(normalized) ? [] : ["Missing HTML doctype declaration."],
    ...detectMissingStructure(normalized),
    ...detectCommonTagIssues(normalized),
    ...hierarchyIssues,
  ].filter((issue, index, all) => all.indexOf(issue) === index);

  return {
    valid: issues.length === 0,
    issues,
    doctypePresent: Boolean(detectDoctype(normalized)),
    hasHtmlTag: /<html\b/i.test(normalized),
    hasHeadTag: /<head\b/i.test(normalized),
    hasBodyTag: /<body\b/i.test(normalized),
    hierarchy,
  };
}
