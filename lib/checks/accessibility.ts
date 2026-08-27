import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import type { AccessibilityIssue, AccessibilityReport } from "../types";

function textContent(node: Cheerio<AnyNode>): string {
  return node.text().replace(/\s+/g, " ").trim();
}

function describeElement($: CheerioAPI, el: AnyNode, attrKeys?: string[]): string {
  const $el = $(el);
  const tagName = (($el.prop("tagName") as string | undefined) ?? "element").toLowerCase();
  const attribs = (el as Element).attribs ?? {};
  const keys = attrKeys ?? Object.keys(attribs).slice(0, 3);
  const attrStr = keys
    .filter((key) => attribs[key] !== undefined)
    .map((key) => `${key}="${attribs[key]}"`)
    .join(" ");
  return attrStr ? `<${tagName} ${attrStr}>` : `<${tagName}>`;
}

function buildIssue(label: string, detail: string, target?: string): AccessibilityIssue {
  return { label, detail, status: "fail", target };
}

export function runAccessibilityCheck($: CheerioAPI): AccessibilityReport {
  const issues: AccessibilityIssue[] = [];

  const html = $("html");
  const lang = html.attr("lang");
  if (!lang) {
    issues.push(
      buildIssue(
        "Missing page language",
        "Add a lang attribute to the <html> element so screen readers can announce the page correctly.",
        "<html>",
      ),
    );
  }

  const title = $("title").first().text().trim();
  if (!title) {
    issues.push(buildIssue("Missing page title", "Add a descriptive <title> tag for the page.", "<head>"));
  }

  const images = $("img").toArray();
  for (const image of images) {
    const $img = $(image);
    const alt = $img.attr("alt");
    if (alt === undefined || alt.trim() === "") {
      issues.push(
        buildIssue(
          "Missing image alt text",
          "Images should have meaningful alt text or be marked decorative.",
          describeElement($, image, ["src"]),
        ),
      );
    }
  }

  const inputs = $("input, textarea, select").toArray();
  const unlabeled = inputs.filter((input) => {
    const $input = $(input);
    const id = $input.attr("id");
    const ariaLabel = $input.attr("aria-label");
    const ariaLabelledBy = $input.attr("aria-labelledby");
    const placeholder = $input.attr("placeholder");
    const type = $input.attr("type")?.toLowerCase();
    const isHidden = type === "hidden";

    if (isHidden) return false;

    if (ariaLabel || ariaLabelledBy) return false;

    if (id) {
      const label = $("label[for=\"" + id + "\"]").first();
      if (label.length > 0) return false;
    }

    return !placeholder && !textContent($input);
  });

  for (const input of unlabeled) {
    issues.push(
      buildIssue(
        "Missing form labels",
        "Form controls should have labels or accessible names.",
        describeElement($, input, ["type", "name", "id"]),
      ),
    );
  }

  const buttonsWithoutText = $("button")
    .filter((_, el) => {
      const $button = $(el);
      const hasText = textContent($button).length > 0;
      const ariaLabel = $button.attr("aria-label");
      return !hasText && !ariaLabel;
    })
    .toArray();

  for (const button of buttonsWithoutText) {
    issues.push(
      buildIssue(
        "Buttons without accessible names",
        "Buttons should expose text or an aria-label.",
        describeElement($, button, ["type", "class", "id"]),
      ),
    );
  }

  const emptyLinks = $("a")
    .filter((_, el) => {
      const $link = $(el);
      const href = $link.attr("href");
      const hasText = textContent($link).length > 0;
      const ariaLabel = $link.attr("aria-label");
      return Boolean(href) && !hasText && !ariaLabel;
    })
    .toArray();

  for (const link of emptyLinks) {
    issues.push(
      buildIssue(
        "Links without accessible names",
        "Links should expose visible text or an aria-label.",
        describeElement($, link, ["href"]),
      ),
    );
  }

  const headings = $("h1, h2, h3, h4, h5, h6")
    .toArray()
    .map((el) => ({
      el,
      level: Number(String($(el).prop("tagName") ?? "").toLowerCase().replace("h", "")),
    }));

  let previousLevel = 0;
  for (const heading of headings) {
    if (previousLevel && heading.level > previousLevel + 1) {
      issues.push(
        buildIssue(
          "Heading levels jump",
          "Heading order should not skip levels unexpectedly.",
          `<h${heading.level}> "${textContent($(heading.el)).slice(0, 60)}"`,
        ),
      );
      break;
    }
    previousLevel = heading.level;
  }

  const failed = issues.filter((issue) => issue.status === "fail").length;
  const warned = issues.filter((issue) => issue.status === "warn").length;

  return { issues, passed: issues.length - failed - warned, warned, failed };
}
