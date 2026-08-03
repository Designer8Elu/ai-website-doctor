import { NextResponse } from "next/server";

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

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Set GROQ_API_KEY in .env.local to enable recommended fixes." },
      { status: 500 },
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

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const messages = [
    {
      role: "system",
      content:
        "You are a senior website health consultant. Give practical fixes for SEO, accessibility, performance, HTML, image, and broken-link audit issues. Keep the answer specific, concise, and implementation-oriented.",
    },
    {
      role: "user",
      content: [
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
        .join("\n"),
    },
  ];

  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });
    console.log("Groq Status:", response.status);
  } catch (err) {
  console.error(err);
    return NextResponse.json(
      { error: "Could not reach the Groq API. Please try again." },
      { status: 502 },
    );
    
  }
  

  let payload: GroqResponse;
  try {
    payload = (await response.json()) as GroqResponse;
  } catch (err) {
  console.error(err);
    return NextResponse.json(
      {
        error: `Groq API returned an unreadable response (HTTP ${response.status}).`,
      },
      { status: 502 },
    );
  }
  console.log(payload);

  if (!response.ok || payload.error) {
    return NextResponse.json(
      {
        error:
          payload.error?.message ??
          `Groq API failed with HTTP ${response.status}.`,
      },
      { status: 502 },
    );
  }

  const recommendation =
  payload.choices?.[0]?.message?.content?.trim() ?? "";

if (!recommendation) {
  return NextResponse.json(
    {
      error: "Groq returned no recommendation.",
      payload,
    },
    { status: 502 },
  );
}

  return NextResponse.json({ recommendation, model });
}
