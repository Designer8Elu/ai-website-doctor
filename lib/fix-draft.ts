export interface FixDraftContext {
  category: string;
  label: string;
  status?: string;
  detail: string;
  value?: string | null;
  pageUrl?: string;
}

export interface FixDraft {
  summary: string;
  patch: string;
  notes: string[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildFixDraft(context: FixDraftContext): FixDraft {
  const normalizedCategory = context.category?.toLowerCase() ?? "";
  const detailText = context.detail ?? "";
  const pageUrl = context.pageUrl ?? "https://example.com";

  if (normalizedCategory.includes("image")) {
    const src = context.value?.trim() || "/image.jpg";
    return {
      summary: "Add better image markup for the flagged asset so it is more accessible and lighter to load.",
      patch: `<img src="${escapeHtml(src)}" alt="Descriptive alt text" loading="lazy" width="1200" height="800" />`,
      notes: [
        "Replace the placeholder alt text with a concise description of the image.",
        "Keep the width and height attributes aligned with the rendered image size.",
      ],
    };
  }

  if (normalizedCategory.includes("seo") || detailText.toLowerCase().includes("meta description")) {
    return {
      summary: "Add or refine the SEO metadata so search engines and social platforms receive better page context.",
      patch: `<meta name="description" content="A concise summary of the page content for search results and social previews." />`,
      notes: [
        "Keep the description between 140 and 160 characters for best results.",
        "Use unique descriptions for each page.",
      ],
    };
  }

  return {
    summary: "Add a focused content or markup improvement for the flagged issue.",
    patch: `<!-- Apply the recommended change near the affected markup -->`,
    notes: [
      `Review the affected section on ${pageUrl} before applying the patch.`,
      "If the issue is structural, test the page again after editing.",
    ],
  };
}
