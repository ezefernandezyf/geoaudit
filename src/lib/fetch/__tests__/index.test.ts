import { describe, expect, it, vi } from "vitest";
import {
  fetchAuditResource,
  PAGE_TIMEOUT_MS,
  PROBE_TIMEOUT_MS,
  resolveTimeoutMs,
} from "@/lib/fetch/index";
import type { FetchImpl } from "@/lib/fetch/redirect";
import type { LookupFn } from "@/lib/fetch/ssrf";

/**
 * T7 - fetchAuditResource composition tests (RFL-1, RFL-4/5, RFL-8, RFL-11,
 * RFL-12). Zero network: every fetch uses a mocked FetchImpl and every DNS
 * resolution uses an injected lookup.
 */

const HTML_BODY = "<h1>secure</h1>";

const publicLookup: LookupFn = async () => [
  { address: "93.184.216.34", family: 4 },
];

const privateLookup: LookupFn = async () => [
  { address: "10.0.0.1", family: 4 },
];

function htmlResponse(body: string = HTML_BODY): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/** Fetcher that only settles when the request's AbortSignal fires. */
function hangingFetcher(): FetchImpl {
  return (_input, init) => {
    const signal = init?.signal;
    return new Promise<Response>((_resolve, reject) => {
      if (!signal) return;
      signal.addEventListener("abort", () => reject(signal.reason));
    });
  };
}

describe("fetchAuditResource (RFL-1 scheme validation)", () => {
  it("upgrades http:// to https:// before fetching", async () => {
    const fetcher: FetchImpl = vi.fn(async () => htmlResponse());

    const result = await fetchAuditResource("http://example.com/", {
      kind: "page",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      "https://example.com/",
      expect.objectContaining({ redirect: "manual" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.finalUrl).toBe("https://example.com/");
      expect(result.parsed.html).toBe(HTML_BODY);
      expect(result.parsed.statusCode).toBe(200);
      expect(result.parsed.contentType).toBe("text/html; charset=utf-8");
    }
  });

  it("rejects an ftp:// scheme with SSRF_BLOCKED without fetching", async () => {
    const fetcher = vi.fn();

    const result = await fetchAuditResource("ftp://example.com/file.txt", {
      kind: "probe",
      maxBytes: 1024,
      fetcher,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "SSRF_BLOCKED", message: expect.stringContaining("ftp") },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects a file:// scheme with SSRF_BLOCKED (triangulation)", async () => {
    const fetcher = vi.fn();

    const result = await fetchAuditResource("file:///etc/passwd", {
      kind: "probe",
      maxBytes: 1024,
      fetcher,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "SSRF_BLOCKED" },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns NETWORK_ERROR for an unparsable URL (defensive)", async () => {
    const fetcher = vi.fn();

    const result = await fetchAuditResource("not a url", {
      kind: "page",
      maxBytes: 1024,
      fetcher,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "NETWORK_ERROR" },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("fetchAuditResource (RFL-8 content-type gate)", () => {
  it("accepts a text/html Content-Type and decodes the body", async () => {
    const fetcher: FetchImpl = vi.fn(async () => htmlResponse());

    const result = await fetchAuditResource("https://example.com/", {
      kind: "page",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.html).toBe(HTML_BODY);
      expect(result.parsed.charset).toBe("utf-8");
    }
  });

  it("gates a PDF Content-Type as unsupported_content_type with the type preserved", async () => {
    const fetcher: FetchImpl = vi.fn(
      async () =>
        new Response("%PDF-1.4 fake", {
          status: 200,
          headers: { "content-type": "application/pdf" },
        }),
    );

    const result = await fetchAuditResource("https://example.com/report.pdf", {
      kind: "page",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && "reason" in result) {
      expect(result.reason).toBe("unsupported_content_type");
      expect(result.contentType).toBe("application/pdf");
    }
  });

  it("treats a missing Content-Type as unsupported_content_type (triangulation)", async () => {
    // A BufferSource body carries no auto content-type header (unlike strings).
    const fetcher: FetchImpl = vi.fn(
      async () =>
        new Response(new TextEncoder().encode("<p>x</p>"), { status: 200 }),
    );

    const result = await fetchAuditResource("https://example.com/", {
      kind: "page",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "unsupported_content_type",
      contentType: null,
    });
  });
});

describe("fetchAuditResource (RFL-11 typed errors, never throw)", () => {
  it("returns TIMEOUT when the AbortSignal fires before a response", async () => {
    const result = await fetchAuditResource("https://slow.test/", {
      kind: "page",
      timeoutMs: 20,
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher: hangingFetcher(),
    });

    expect(result).toMatchObject({ ok: false, error: { code: "TIMEOUT" } });
  });

  it("blocks a hostname resolving to a private IP with SSRF_BLOCKED", async () => {
    const fetcher: FetchImpl = vi.fn(async () => htmlResponse());

    const result = await fetchAuditResource("https://10.0.0.1/", {
      kind: "page",
      maxBytes: 1024,
      lookup: privateLookup,
      fetcher,
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "SSRF_BLOCKED",
        message: expect.stringContaining("10.0.0.1"),
      },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns HTTP_STATUS for a non-2xx final response", async () => {
    const fetcher: FetchImpl = vi.fn(
      async () => new Response("not found", { status: 404 }),
    );

    const result = await fetchAuditResource("https://example.com/missing", {
      kind: "probe",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result).toMatchObject({ ok: false, error: { code: "HTTP_STATUS" } });
  });

  it("maps a DNS resolution failure to DNS_FAILURE", async () => {
    const dnsLookup: LookupFn = async () => {
      throw Object.assign(new Error("getaddrinfo ENOTFOUND nowhere.test"), {
        code: "ENOTFOUND",
      });
    };
    const fetcher = vi.fn();

    const result = await fetchAuditResource("https://nowhere.test/", {
      kind: "page",
      maxBytes: 1024,
      lookup: dnsLookup,
      fetcher,
    });

    expect(result).toMatchObject({ ok: false, error: { code: "DNS_FAILURE" } });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("maps a transport failure from the fetcher to NETWORK_ERROR", async () => {
    const fetcher: FetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });

    const result = await fetchAuditResource("https://example.com/", {
      kind: "page",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "NETWORK_ERROR" },
    });
  });

  it("maps a body exceeding maxBytes to TOO_LARGE (RFL-7 composition)", async () => {
    const fetcher: FetchImpl = vi.fn(
      async () =>
        new Response("a".repeat(2048), {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
    );

    const result = await fetchAuditResource("https://example.com/", {
      kind: "page",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result).toMatchObject({ ok: false, error: { code: "TOO_LARGE" } });
  });
});

describe("fetchAuditResource (RFL-6 composition)", () => {
  it("tracks the final URL across a redirect hop", async () => {
    const fetcher: FetchImpl = vi.fn(async (input) => {
      if (String(input) === "https://a.test/") {
        return new Response(null, {
          status: 301,
          headers: { location: "https://b.test/" },
        });
      }
      return htmlResponse("<p>landed</p>");
    });

    const result = await fetchAuditResource("https://a.test/", {
      kind: "page",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.finalUrl).toBe("https://b.test/");
      expect(result.parsed.html).toBe("<p>landed</p>");
    }
  });
});

describe("fetchAuditResource (RFL-4/5 default timeouts per kind)", () => {
  it("exports the P4 default timeouts as constants", () => {
    expect(PAGE_TIMEOUT_MS).toBe(15_000);
    expect(PROBE_TIMEOUT_MS).toBe(10_000);
  });

  it("resolves 15000ms for kind 'page' and 10000ms for kind 'probe'", () => {
    expect(resolveTimeoutMs("page")).toBe(15_000);
    expect(resolveTimeoutMs("probe")).toBe(10_000);
  });

  it("lets an explicit timeoutMs override the kind default", () => {
    expect(resolveTimeoutMs("page", 500)).toBe(500);
    expect(resolveTimeoutMs("probe", 250)).toBe(250);
  });

  it("applies the resolved default to AbortSignal.timeout when omitted", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    try {
      const fetcher: FetchImpl = vi.fn(async () => htmlResponse());

      const result = await fetchAuditResource("https://example.com/", {
        kind: "page",
        maxBytes: 1024,
        lookup: publicLookup,
        fetcher,
      });

      expect(timeoutSpy).toHaveBeenCalledWith(15_000);
      expect(result.ok).toBe(true);
    } finally {
      timeoutSpy.mockRestore();
    }
  });
});

describe("fetchAuditResource sitemap kind (MPA-5, D5)", () => {
  it("accepts application/xml for kind 'sitemap' and decodes the body", async () => {
    const sitemapBody =
      '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/</loc></url></urlset>';
    const fetcher: FetchImpl = vi.fn(
      async () =>
        new Response(sitemapBody, {
          status: 200,
          headers: { "content-type": "application/xml; charset=utf-8" },
        }),
    );

    const result = await fetchAuditResource("https://example.com/sitemap.xml", {
      kind: "sitemap",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.html).toBe(sitemapBody);
      expect(result.parsed.contentType).toBe("application/xml; charset=utf-8");
    }
  });

  it("accepts text/xml for kind 'sitemap' (triangulation)", async () => {
    const fetcher: FetchImpl = vi.fn(
      async () =>
        new Response(
          "<urlset><url><loc>https://example.com/</loc></url></urlset>",
          {
            status: 200,
            headers: { "content-type": "text/xml" },
          },
        ),
    );

    const result = await fetchAuditResource("https://example.com/sitemap.xml", {
      kind: "sitemap",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.contentType).toBe("text/xml");
    }
  });

  it("gates a text/html response for kind 'sitemap' as unsupported (XML only)", async () => {
    const fetcher: FetchImpl = vi.fn(async () => htmlResponse());

    const result = await fetchAuditResource("https://example.com/sitemap.xml", {
      kind: "sitemap",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && "reason" in result) {
      expect(result.reason).toBe("unsupported_content_type");
    }
  });

  it("still gates application/xml for kind 'page' as unsupported (RFL-8 unchanged)", async () => {
    const fetcher: FetchImpl = vi.fn(
      async () =>
        new Response("<urlset></urlset>", {
          status: 200,
          headers: { "content-type": "application/xml" },
        }),
    );

    const result = await fetchAuditResource("https://example.com/", {
      kind: "page",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && "reason" in result) {
      expect(result.reason).toBe("unsupported_content_type");
      expect(result.contentType).toBe("application/xml");
    }
  });

  it("still gates application/xml for kind 'probe' as unsupported (RFL-8 unchanged)", async () => {
    const fetcher: FetchImpl = vi.fn(
      async () =>
        new Response("<urlset></urlset>", {
          status: 200,
          headers: { "content-type": "application/xml" },
        }),
    );

    const result = await fetchAuditResource("https://example.com/robots.txt", {
      kind: "probe",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && "reason" in result) {
      expect(result.reason).toBe("unsupported_content_type");
    }
  });

  it("blocks a sitemap hostname resolving to a private IP with SSRF_BLOCKED (threat)", async () => {
    const fetcher: FetchImpl = vi.fn();

    const result = await fetchAuditResource(
      "https://sitemap.internal/sitemap.xml",
      {
        kind: "sitemap",
        maxBytes: 1024,
        lookup: privateLookup,
        fetcher,
      },
    );

    expect(result).toMatchObject({
      ok: false,
      error: { code: "SSRF_BLOCKED" },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("fetchAuditResource (robots.txt text/plain gate fix)", () => {
  it("accepts text/plain robots.txt for kind 'probe' and parses it", async () => {
    const robotsBody = "User-agent: *\nDisallow: /private\n";
    const fetcher: FetchImpl = vi.fn(async () => {
      return new Response(robotsBody, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    });

    const result = await fetchAuditResource("https://example.com/robots.txt", {
      kind: "probe",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.html).toBe(robotsBody);
      expect(result.parsed.contentType).toBe("text/plain; charset=utf-8");
    }
  });

  it("still gates non-HTML pages for kind 'page' as unsupported", async () => {
    const fetcher: FetchImpl = vi.fn(async () => {
      return new Response("data", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    });

    const result = await fetchAuditResource("https://example.com/", {
      kind: "page",
      maxBytes: 1024,
      lookup: publicLookup,
      fetcher,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && "reason" in result) {
      expect(result.reason).toBe("unsupported_content_type");
    }
  });
});
