# Ai Website Doctor

An MVP web app that takes one website URL and returns a health report: performance,
SEO/meta tags, image hygiene and broken internal links. Everything is computed on
demand — there is no database and nothing is stored.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4**
- **Next.js API routes** (Node.js runtime) for the backend
- **cheerio** for server-side HTML parsing
- **Google PageSpeed Insights API** for Lighthouse performance data

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000, paste a URL, click **Run Audit**. A full run takes
roughly 10–30 seconds because it waits on two live Lighthouse runs.

### Optional: PageSpeed API key

The PageSpeed Insights API works without a key at low volume, but the keyless
quota is shared per IP and starts returning `429 Quota exceeded` once exhausted.
When that happens the Performance section shows the error and the rest of the
report still renders. To raise the quota:

```bash
cp .env.example .env.local
# then set PAGESPEED_API_KEY=...
```

## What it checks

| Section         | Checks                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Performance** | Mobile + desktop Lighthouse score, FCP, LCP, TBT, CLS, Speed Index, and the top 5 improvement opportunities ranked by est. savings |
| **SEO tags**    | `<title>` + length, meta description + length, `og:title`, `og:description`, `og:image`, canonical, `robots.txt`, `sitemap.xml`   |
| **Images**      | Every `<img>`: missing `alt`, empty `alt`, missing `loading="lazy"`, missing `width`/`height`                                     |
| **Links**       | Unique same-domain links, checked with `HEAD` (falling back to `GET`), flagging 4xx / 5xx / timeouts                              |

Scores use Lighthouse's own thresholds — green ≥ 90, amber 50–89, red < 50.

## API

The UI is a thin client over a single endpoint.

```bash
# POST — what the UI uses
curl -s -X POST http://localhost:3000/api/audit \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'

# GET — convenient for manual testing
curl -s 'http://localhost:3000/api/audit?url=https://example.com'
```

One request returns one `AuditReport` JSON object (see [lib/types.ts](lib/types.ts)).
Every section is `{ data, error }`, so a single failing check — a PageSpeed rate
limit, say — degrades that section only instead of failing the whole report.

Input is normalised and validated in [lib/url.ts](lib/url.ts): the scheme is
optional (`example.com` works), only `http`/`https` are accepted, and localhost /
private / link-local hosts are refused so the auditor cannot be pointed at
internal infrastructure.

## Project layout

```
app/
  page.tsx                  input screen + loading state + report (client)
  api/audit/route.ts        the single orchestrating endpoint
  components/               presentational report sections
lib/
  audit.ts                  orchestrator — runs every check, assembles the report
  types.ts                  the AuditReport contract shared by server and client
  url.ts                    URL normalisation, validation, host safety
  http.ts                   fetch timeouts, error messages, concurrency helper
  checks/
    page.ts                 the single HTML fetch the content checks share
    performance.ts          PageSpeed Insights
    seo.ts                  meta/SEO tags + robots.txt + sitemap.xml
    images.ts               <img> analysis
    links.ts                internal link status sweep
```

The audit runs two branches concurrently: the two PageSpeed calls, and one HTML
fetch that the SEO, image and link checks all read from — the page is never
downloaded twice.

## MVP limits (deliberate)

- **Single URL only** — no crawling. The link check only scans links found on that one page.
- Internal links only, capped at 40 per audit, 8 concurrent, 10s timeout each.
- Image checks are static analysis of the HTML; no image files are downloaded.
- HTML is read up to a 3 MB cap.
- The private-host guard is best effort; it does not re-resolve DNS, so it will
  not stop a deliberate DNS-rebinding attack. A public deployment should also run
  outbound requests through an egress proxy.

## Future modules

Out of scope for this version. Plug-in points are marked with `FUTURE` comments
in the code:

- **Code audit** — unused CSS, minification, console errors ([lib/audit.ts](lib/audit.ts), [app/components/Report.tsx](app/components/Report.tsx))
- **AI recommendations** — plain-English summary layer over the finished report ([lib/audit.ts](lib/audit.ts))
- **Whole-site crawling** ([lib/checks/links.ts](lib/checks/links.ts))
- **Image weight analysis** — file size vs. rendered size, modern format hints ([lib/checks/images.ts](lib/checks/images.ts))
- **User accounts / saved report history** — the first feature that would need a database
- **PDF export** of the report
