/** Thin fetch helpers shared by every check module. */

/** Identify the bot honestly; some hosts block unknown/absent user agents. */
export const USER_AGENT =
  "Mozilla/5.0 (compatible; SiteHealthChecker/1.0; +https://example.com/site-health-checker)";

export const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export interface FetchOptions {
  method?: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  redirect?: RequestRedirect;
}

export async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { method = "GET", timeoutMs = 15_000, headers, redirect = "follow" } = options;

  return fetch(url, {
    method,
    redirect,
    headers: { ...DEFAULT_HEADERS, ...headers },
    signal: AbortSignal.timeout(timeoutMs),
    // Always hit the network — audits must never be served from a cache.
    cache: "no-store",
  });
}

/** Turn an unknown throwable into a short message safe to show in the report. */
export function describeFetchError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return "Request timed out";
    }

    const code = (error.cause as { code?: string } | undefined)?.code;
    switch (code) {
      case "ENOTFOUND":
      case "EAI_AGAIN":
        return "Domain could not be resolved (DNS lookup failed)";
      case "ECONNREFUSED":
        return "Connection refused";
      case "ECONNRESET":
        return "Connection reset by the server";
      case "CERT_HAS_EXPIRED":
        return "TLS certificate has expired";
      case "DEPTH_ZERO_SELF_SIGNED_CERT":
      case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
        return "TLS certificate could not be verified";
      case "ETIMEDOUT":
        return "Connection timed out";
      default:
        return code ? `${error.message} (${code})` : error.message;
    }
  }
  return "Unknown network error";
}

/**
 * Run `task` over `items` with a fixed number of in-flight requests.
 * `task` must not reject — callers wrap their own failures into a result value.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await task(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}
