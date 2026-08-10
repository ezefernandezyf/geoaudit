# Audit Fetch Layer Specification

## Purpose

Provide a safe, deterministic, and fully injectable HTTP(S) fetch layer for the audit engine. Guard against SSRF attacks via DNS-resolve validation of private/reserved IP ranges, enforce HTTPS-only with port 443, apply timeouts (15s page / 10s auxiliary), cap decoded body size at ~5MB, gate on HTML Content-Type, resolve charset from headers and meta fallback, and follow redirects with per-hop re-validation (≤5 hops).

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| RFL-1 | Scheme validation | MUST | Accept only `https` URLs; upgrade `http` → `https`; reject non-http/https schemes |
| RFL-2 | DNS-resolve SSRF guard | MUST | Resolve hostname via `dns.lookup` (IPv4+IPv6); reject private/link-local/reserved IPs per D6 ranges |
| RFL-3 | Port restriction | MUST | Connect only on port 443 |
| RFL-4 | Page timeout (15s) | MUST | Apply 15-second AbortSignal timeout on page fetch |
| RFL-5 | Auxiliary timeout (10s) | MUST | Apply 10-second AbortSignal timeout on auxiliary probes (robots.txt, sitemap, llms.txt) |
| RFL-6 | Redirect handling | MUST | Follow redirects manually (≤5 hops); re-validate DNS at each hop |
| RFL-7 | Decoded size cap | MUST | Cap decoded body at ~5MB; stream body and abort if exceeded |
| RFL-8 | Content-Type gate | MUST | Accept `text/html`; `kind: 'probe'` additionally accepts `text/plain` (robots.txt); other Content-Types → return `null` with reason "unsupported_content_type" |
| RFL-9 | Charset resolution | MUST | Resolve charset from Content-Type header → `<meta charset>` → UTF-8 fallback; decode via TextDecoder |
| RFL-10 | Latin-1 handling | MUST | Correctly decode ISO-8859-1 (latin-1) encoded pages via charset resolution |
| RFL-11 | Error handling | MUST | Connection errors, DNS failures, and timeouts MUST return typed error results (never throw) |
| RFL-12 | Injectable fetcher | MUST | The fetch layer MUST accept an injectable fetch implementation for test isolation |

### Requirement: DNS-Resolve SSRF Guard (RFL-2)

The system MUST resolve the hostname to IP addresses and reject any that fall within private, link-local, or reserved ranges.

#### Scenario: Public IP passes

- GIVEN hostname resolves to 93.184.216.34 (example.com)
- WHEN the SSRF guard checks the resolved IP
- THEN the IP passes validation
- AND the fetch proceeds

#### Scenario: Private IPv4 rejected

- GIVEN hostname resolves to 10.0.0.1
- WHEN the SSRF guard checks the resolved IP
- THEN the IP is rejected as "private_ip_range"
- AND the fetch returns an error with code "SSRF_BLOCKED"

#### Scenario: Cloud metadata IP rejected

- GIVEN hostname resolves to 169.254.169.254
- WHEN the SSRF guard checks the resolved IP
- THEN the IP is rejected as "link_local_reserved"
- AND the result notes the specific IP that triggered the block

#### Scenario: Localhost IPv6 rejected

- GIVEN hostname resolves to ::1
- WHEN the SSRF guard checks
- THEN the IP is rejected as "loopback"

#### Scenario: Redirect to private IP blocked

- GIVEN initial fetch to public IP returns 301 to `http://10.0.0.1/admin`
- AND the redirect chain is at hop 3 of ≤5
- WHEN the redirect target is DNS-resolved
- THEN the resolved private IP is rejected ("SSRF_BLOCKED")
- AND the fetch returns a redirect-chain error

### Requirement: Redirect Handling (RFL-6)

The system MUST follow redirects manually with DNS re-validation at each hop.

#### Scenario: Redirect within limit

- GIVEN initial URL returns 301 → target URL, which returns 302 → final URL, which returns 200
- WHEN redirects are followed (3 total hops)
- THEN the final 200 response body is returned
- AND DNS was resolved at each hop

#### Scenario: Redirect chain exceeds limit

- GIVEN a redirect chain of 6 hops
- WHEN the 6th redirect is encountered
- THEN the fetch returns an error "TOO_MANY_REDIRECTS"
- AND the body of the 5th hop is discarded

### Requirement: Content-Type Gate (RFL-8)

The system MUST accept HTML responses. For `kind: 'probe'` (auxiliary resources such as robots.txt) the gate MUST additionally accept `text/plain`, because real robots.txt files are served with that Content-Type — gating them would silently treat every robots directive as missing ("all allowed").

#### Scenario: HTML Content-Type

- GIVEN HTTP response with `Content-Type: text/html; charset=utf-8`
- WHEN the Content-Type is gated
- THEN the response passes
- AND body decoding proceeds

#### Scenario: PDF Content-Type rejected

- GIVEN HTTP response with `Content-Type: application/pdf`
- WHEN the Content-Type is gated
- THEN the response is rejected with reason "unsupported_content_type"
- AND the caller receives `null` body with the reason string

#### Scenario: Probe kind accepts text/plain robots.txt

- GIVEN a `kind: 'probe'` fetch with `Content-Type: text/plain; charset=utf-8`
- WHEN the Content-Type is gated
- THEN the response passes
- AND the robots.txt body is available for parsing

#### Scenario: Page kind still rejects text/plain

- GIVEN a `kind: 'page'` fetch with `Content-Type: text/plain`
- WHEN the Content-Type is gated
- THEN the response is rejected with reason "unsupported_content_type"

### Requirement: Charset Resolution (RFL-9)

The system MUST resolve the encoding from header, meta fallback, or UTF-8 default.

#### Scenario: Charset in Content-Type

- GIVEN header `Content-Type: text/html; charset=ISO-8859-1`
- WHEN charset is resolved
- THEN encoding is "ISO-8859-1"
- AND TextDecoder uses latin1

#### Scenario: Charset from meta fallback

- GIVEN no charset in Content-Type header
- AND HTML contains `<meta charset="UTF-8">`
- WHEN charset is resolved
- THEN encoding is "UTF-8"

#### Scenario: No charset anywhere

- GIVEN no Content-Type charset and no `<meta charset>`
- WHEN charset is resolved
- THEN encoding defaults to "UTF-8"
- AND the resolution path is logged as "default_utf8"

### Requirement: Latin-1 Handling (RFL-10)

The system MUST correctly decode ISO-8859-1 pages.

#### Scenario: French latin-1 fixture

- GIVEN an ISO-8859-1 encoded page containing "réseau électrique" (accented chars)
- AND charset is resolved as ISO-8859-1 from Content-Type
- WHEN body is decoded via TextDecoder
- THEN "réseau électrique" is correctly decoded
- AND character counts match the original (accented chars = 1 char each)

### Requirement: Injectable Fetcher (RFL-12)

The fetch layer MUST accept a custom fetch implementation for testing.

#### Scenario: Mocked fetch used in test

- GIVEN a test injects a mock fetch that returns a known HTML fixture
- WHEN the fetch layer executes via `safeFetchPage(url, { fetcher: mockFetch })`
- THEN the mock is invoked instead of native fetch
- AND the returned body matches the fixture
- AND no real network call occurs

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RFL-1 | (http→https upgrade fixture; ftp:// rejection) | Covered |
| RFL-2 | Public IP passes, Private IPv4 rejected, Cloud metadata IP, Localhost IPv6, Redirect to private IP | Covered |
| RFL-3 | (port 443 enforced via RFL-2 DNS-resolve — connection to 443) | Implicit |
| RFL-4 | (timeout fixture — AbortSignal fires → timeout error returned) | Covered |
| RFL-5 | (auxiliary timeout fixture — 10s AbortSignal on probe) | Covered |
| RFL-6 | Redirect within limit, Redirect chain exceeds limit | Covered |
| RFL-7 | (5MB fixture — body stream exceeds cap → aborted) | Covered |
| RFL-8 | HTML Content-Type, PDF Content-Type rejected, probe text/plain accepted, page text/plain rejected | Covered |
| RFL-9 | Charset in Content-Type, Charset from meta, No charset anywhere | Covered |
| RFL-10 | French latin-1 fixture | Covered |
| RFL-11 | (tested via RFL-2 rejections + RFL-8 rejections — typed errors) | Implicit |
| RFL-12 | Mocked fetch used in test | Covered |
