/** Shared Gemini text-generation call, used by every AI-powered route. */

export interface GeminiCallOptions {
  temperature?: number;
  maxOutputTokens?: number;
  /**
   * gemini-3.x "flash" models spend part of maxOutputTokens on internal
   * reasoning before the visible answer. Left uncapped, a long prompt can burn
   * the whole budget on thinking and return a response truncated mid-sentence.
   * A small fixed budget keeps just enough reasoning while leaving the rest
   * of the token budget for the actual answer.
   */
  thinkingBudget?: number;
}

export class GeminiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

/** Newer preview "flash" models occasionally return 503/UNAVAILABLE under load. */
function isOverloaded(httpStatus: number, payload: GeminiResponse | null): boolean {
  if (httpStatus === 503) return true;
  return payload?.error?.status === "UNAVAILABLE";
}

/** A stable, generally-available fallback used only when the primary model is overloaded. */
const FALLBACK_MODEL = "gemini-2.5-flash";

interface AttemptResult {
  ok: boolean;
  overloaded: boolean;
  text: string | null;
  error: GeminiError | null;
}

async function attemptGeneration(
  model: string,
  apiKey: string,
  prompt: string,
  temperature: number,
  maxOutputTokens: number,
  thinkingBudget: number,
  timeoutMs: number,
): Promise<AttemptResult> {
  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens,
            thinkingConfig: { thinkingBudget },
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      },
    );
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      overloaded: false,
      text: null,
      error: new GeminiError("Could not reach the Gemini API. Please try again.", 502),
    };
  }

  let payload: GeminiResponse;
  try {
    payload = (await response.json()) as GeminiResponse;
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      overloaded: false,
      text: null,
      error: new GeminiError(`Gemini API returned an unreadable response (HTTP ${response.status}).`, 502),
    };
  }

  if (!response.ok || payload.error) {
    const overloaded = isOverloaded(response.status, payload);
    return {
      ok: false,
      overloaded,
      text: null,
      error: new GeminiError(payload.error?.message ?? `Gemini API failed with HTTP ${response.status}.`, 502),
    };
  }

  const text =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? "";

  if (!text) {
    return { ok: false, overloaded: false, text: null, error: new GeminiError("Gemini returned no content.", 502) };
  }

  return { ok: true, overloaded: false, text, error: null };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function callGeminiText(
  prompt: string,
  options: GeminiCallOptions = {},
): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError("Set GEMINI_API_KEY in .env.local to enable AI features.", 500);
  }

  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const { temperature = 0.3, maxOutputTokens = 900, thinkingBudget = 256 } = options;

  // Try the primary model, then once more after a short delay, then fall back to a
  // stable model — only when the failure is specifically an overload (503/UNAVAILABLE).
  // Any other error fails fast. Total worst case stays well under the route's 60s cap.
  const first = await attemptGeneration(primaryModel, apiKey, prompt, temperature, maxOutputTokens, thinkingBudget, 20_000);
  if (first.ok) return { text: first.text!, model: primaryModel };
  if (!first.overloaded) throw first.error;

  await sleep(600);
  const second = await attemptGeneration(primaryModel, apiKey, prompt, temperature, maxOutputTokens, thinkingBudget, 20_000);
  if (second.ok) return { text: second.text!, model: primaryModel };
  if (!second.overloaded) throw second.error;

  if (primaryModel === FALLBACK_MODEL) {
    throw new GeminiError("Gemini is currently experiencing high demand. Please try again in a moment.", 503);
  }

  const fallback = await attemptGeneration(
    FALLBACK_MODEL,
    apiKey,
    prompt,
    temperature,
    maxOutputTokens,
    thinkingBudget,
    15_000,
  );
  if (fallback.ok) return { text: fallback.text!, model: FALLBACK_MODEL };

  throw new GeminiError("Gemini is currently experiencing high demand. Please try again in a moment.", 503);
}
