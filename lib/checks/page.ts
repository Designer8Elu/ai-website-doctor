/**
 * Fetches the page HTML once. The SEO, image and link checks all read from
 * this single response so we never download the document more than once.
 */

import { describeFetchError, fetchWithTimeout } from "@/lib/http";
import type { PageInfo } from "@/lib/types";

/** Stop reading after this much HTML so a huge/streaming page can't exhaust memory. */
const MAX_HTML_BYTES = 3_000_000;

const PAGE_TIMEOUT_MS = 20_000;

export class PageFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PageFetchError";
  }
}

export interface FetchedPage {
  html: string;
  info: PageInfo;
}

/** Read the body, but stop once we pass the byte cap. */
async function readCappedText(response: Response): Promise<{ text: string; bytes: number }> {
  if (!response.body) {
    const text = await response.text();
    return { text, bytes: Buffer.byteLength(text) };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    bytes += value.byteLength;
    if (bytes >= MAX_HTML_BYTES) {
      await reader.cancel();
      break;
    }
  }

  return { text: Buffer.concat(chunks).toString("utf8"), bytes };
}

export async function fetchPage(url: string): Promise<FetchedPage> {
  let response: Response;
  try {
    response = await fetchWithTimeout(url, { timeoutMs: PAGE_TIMEOUT_MS });
  } catch (error) {
    throw new PageFetchError(`Could not load the page — ${describeFetchError(error)}.`);
  }

  if (!response.ok) {
    throw new PageFetchError(
      `The page returned HTTP ${response.status} ${response.statusText}`.trim() + ".",
    );
  }

  const contentType = response.headers.get("content-type");
  if (contentType && !/html|xml/i.test(contentType)) {
    throw new PageFetchError(
      `Expected an HTML page but the server returned "${contentType.split(";")[0]}".`,
    );
  }

  const { text, bytes } = await readCappedText(response);

  return {
    html: text,
    info: {
      // `response.url` reflects the URL after redirects.
      finalUrl: response.url || url,
      status: response.status,
      contentType,
      htmlBytes: bytes,
      headers: Object.fromEntries(response.headers.entries()),
    },
  };
}
