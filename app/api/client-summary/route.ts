import { NextResponse } from "next/server";

import { buildClientSummaryPrompt } from "@/lib/client-summary";
import { callGeminiText, GeminiError } from "@/lib/gemini";
import type { AuditReport } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface SummaryRequest {
  report?: unknown;
}

function isAuditReport(value: unknown): value is AuditReport {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AuditReport).requestedUrl === "string" &&
    typeof (value as AuditReport).performance === "object"
  );
}

export async function POST(request: Request) {
  let body: SummaryRequest;
  try {
    body = (await request.json()) as SummaryRequest;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  if (!isAuditReport(body.report)) {
    return NextResponse.json({ error: "Provide a completed audit report." }, { status: 400 });
  }

  const prompt = buildClientSummaryPrompt(body.report);

  try {
    const { text, model } = await callGeminiText(prompt, { maxOutputTokens: 2000, temperature: 0.4 });
    return NextResponse.json({ summary: text, model });
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Could not generate a client summary." }, { status: 500 });
  }
}
