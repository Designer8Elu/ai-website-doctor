/** URL parsing, normalisation and basic safety checks. */

/** Thrown for user-fixable input problems — the API maps these to HTTP 400. */
export class AuditInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuditInputError";
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "ip6-localhost",
  "metadata",
  "metadata.google.internal",
]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"];

function isPrivateIpv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!match) return false;

  const octets = match.slice(1, 5).map(Number);
  if (octets.some((n) => n > 255)) return true; // malformed — refuse rather than guess
  const [a, b] = octets;

  if (a === 0 || a === 10 || a === 127) return true; // this-host, private, loopback
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 169 && b === 254) return true; // link-local (cloud metadata lives here)
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "::1" || host === "::") return true;
  if (/^f[cd][0-9a-f]{2}:/.test(host)) return true; // unique local fc00::/7
  if (/^fe[89ab][0-9a-f]:/.test(host)) return true; // link-local fe80::/10
  return false;
}

/**
 * Best-effort guard against pointing the auditor at internal infrastructure.
 *
 * This blocks the obvious cases only. A hardened deployment would also resolve
 * DNS and re-check the resolved address to defeat rebinding, and run outbound
 * requests through an egress proxy — out of scope for the MVP.
 */
export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (isPrivateIpv4(host)) return true;
  if (isPrivateIpv6(host)) return true;
  return false;
}

/**
 * Turn raw user input into a URL we are willing to fetch.
 * Accepts "example.com" as well as a fully qualified URL.
 */
export function normalizeUrl(raw: string): URL {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    throw new AuditInputError("Enter a website URL to audit.");
  }
  if (trimmed.length > 2048) {
    throw new AuditInputError("That URL is too long.");
  }

  // Reject schemeless-but-dangerous input explicitly so the error is specific.
  if (/^(javascript|data|file|mailto|tel|about|blob|ftp|ws|wss):/i.test(trimmed)) {
    throw new AuditInputError("Only http:// and https:// URLs can be audited.");
  }

  // Require "://" before treating the input as already-schemed, otherwise
  // "example.com:8080" would parse as a URL with the scheme "example.com".
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new AuditInputError(`"${trimmed}" is not a valid URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AuditInputError("Only http:// and https:// URLs can be audited.");
  }

  const isIpLiteral =
    /^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname) || parsed.hostname.startsWith("[");
  if (!isIpLiteral && !parsed.hostname.includes(".")) {
    throw new AuditInputError("Enter a full domain, for example https://example.com.");
  }

  if (isBlockedHost(parsed.hostname)) {
    throw new AuditInputError("Only publicly reachable websites can be audited.");
  }

  parsed.hash = "";
  return parsed;
}

/** Resolve a possibly-relative attribute value against the page URL. */
export function resolveUrl(value: string, base: string): string | null {
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

/** Same-domain check used to keep the link scan on the audited site. */
export function isSameHost(a: string, b: string): boolean {
  try {
    const stripWww = (h: string) => h.toLowerCase().replace(/^www\./, "");
    return stripWww(new URL(a).hostname) === stripWww(new URL(b).hostname);
  } catch {
    return false;
  }
}
