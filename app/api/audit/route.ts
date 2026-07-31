/**
 * POST /api/audit  { "url": "https://example.com" }  -> AuditReport
 * GET  /api/audit?url=https://example.com            -> AuditReport (handy for curl)
 *
 * One request runs every check and returns a single JSON object. There is no
 * database — reports are computed on demand and never persisted.
 */

import { NextResponse } from "next/server";

import { runAudit } from "@/lib/audit";
import { AuditInputError, normalizeUrl } from "@/lib/url";

// Node runtime: cheerio and the streaming body reader need Node APIs.
export const runtime = "nodejs";
// A full audit is two Lighthouse runs plus a link sweep; give it room.
export const maxDuration = 120;
export const dynamic = "force-dynamic";

async function handle(rawUrl: unknown) {
  if (typeof rawUrl !== "string") {
    return NextResponse.json({ error: "Provide a `url` string." }, { status: 400 });
  }

  let target: URL;
  try {
    target = normalizeUrl(rawUrl);
  } catch (error) {
    if (error instanceof AuditInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  try {
    const report = await runAudit(target.toString());
    return NextResponse.json(report);
  } catch (error) {
    // Individual checks already degrade gracefully, so reaching here means
    // something unexpected broke in the orchestrator itself.
    console.error("[audit] unexpected failure", error);
    return NextResponse.json(
      { error: "The audit failed unexpectedly. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  return handle((body as { url?: unknown } | null)?.url);
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  return handle(url);
}
