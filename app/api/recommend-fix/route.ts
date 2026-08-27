import { NextResponse } from "next/server";

import { callGeminiText, GeminiError } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface FixRequest {
  category?: unknown;
  label?: unknown;
  status?: unknown;
  detail?: unknown;
  value?: unknown;
  pageUrl?: unknown;
}

function asShortString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, 2000) : fallback;
}

export async function POST(request: Request) {
  let body: FixRequest;
  try {
    body = (await request.json()) as FixRequest;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Request body must be JSON." },
      { status: 400 },
    );
  }

  const category = asShortString(body.category, "Website health");
  const label = asShortString(body.label, "Audit issue");
  const status = asShortString(body.status, "issue");
  const detail = asShortString(body.detail);
  const value = asShortString(body.value);
  const pageUrl = asShortString(body.pageUrl);

  if (!label || !detail) {
    return NextResponse.json(
      { error: "Provide an issue label and detail." },
      { status: 400 },
    );
  }

  const prompt = [
    "Recommend a fix for this website audit issue.",
    "",
    `Page URL: ${pageUrl || "Not provided"}`,
    `Category: ${category}`,
    `Issue: ${label}`,
    `Status: ${status}`,
    `Detail: ${detail}`,
    value ? `Observed value: ${value}` : "",
    "",
    "Return Markdown with:",
    "1. What this means",
    "2. Recommended fix",
    "3. Example implementation when useful",
    "4. How to verify",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { text, model } = await callGeminiText(prompt, { maxOutputTokens: 900 });
    return NextResponse.json({ recommendation: text, model });
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Could not generate a recommendation." }, { status: 500 });
  }
}
