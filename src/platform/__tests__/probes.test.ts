import { describe, expect, it, vi } from "vitest";
import { probeResource, probeSite } from "@/platform/probes";
import type { ProbeFn } from "@/platform/probes";

/** Injected probe fetcher keyed by URL — never touches the network. */
function probeFetch(statuses: Record<string, number>): ProbeFn {
  return async (input) => {
    const status = statuses[String(input)] ?? 404;
    return new Response(null, { status });
  };
}

describe("probeResource (RPL-6, RPL-7)", () => {
  it("reports present when the HEAD request returns 200 without parsing content", async () => {
    const fetcher = probeFetch({ "https://example.com/sitemap.xml": 200 });
    const result = await probeResource(
      "https://example.com/sitemap.xml",
      fetcher,
    );
    expect(result.present).toBe(true);
    expect(result.run).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.error).toBeNull();
  });

  it("reports absent with the status code for a 404", async () => {
    const fetcher = probeFetch({});
    const result = await probeResource("https://example.com/llms.txt", fetcher);
    expect(result.present).toBe(false);
    expect(result.statusCode).toBe(404);
  });

  it("never throws when the fetch fails — records the error instead", async () => {
    const failing: ProbeFn = async () => {
      throw new Error("network down");
    };
    const result = await probeResource(
      "https://example.com/sitemap.xml",
      failing,
    );
    expect(result.run).toBe(false);
    expect(result.present).toBe(false);
    expect(result.error).toContain("network down");
  });

  it("issues a HEAD request and never reads the response body", async () => {
    let method = "";
    const spy: ProbeFn = async (input, init) => {
      method = init?.method ?? "GET";
      return new Response(null, { status: 200 });
    };
    await probeResource("https://example.com/sitemap.xml", spy);
    expect(method).toBe("HEAD");
  });
});

describe("probeSite (RPL-6 + RPL-7 combined)", () => {
  it("reports both files present when both return 200", async () => {
    const fetcher = probeFetch({
      "https://example.com/sitemap.xml": 200,
      "https://example.com/llms.txt": 200,
    });
    const result = await probeSite("https://example.com", fetcher);
    expect(result.sitemap.present).toBe(true);
    expect(result.llmsTxt.present).toBe(true);
  });

  it("reports both files absent when both return 404", async () => {
    const fetcher = probeFetch({});
    const result = await probeSite("https://example.com/", fetcher);
    expect(result.sitemap.present).toBe(false);
    expect(result.llmsTxt.present).toBe(false);
  });
});

describe("AbortSignal support (ARU-9)", () => {
  it("probeResource forwards the provided signal to the fetcher", async () => {
    const signal = new AbortController().signal;
    const fetcher: ProbeFn = vi.fn(
      async () => new Response(null, { status: 200 }),
    );

    await probeResource("https://example.com/sitemap.xml", fetcher, signal);

    expect(fetcher).toHaveBeenCalledWith(
      "https://example.com/sitemap.xml",
      expect.objectContaining({ signal }),
    );
  });

  it("probeResource returns a controlled error (not a hanging promise) when the signal fires", async () => {
    const signal = AbortSignal.abort();
    const fetcher: ProbeFn = vi.fn(async (_input, init) => {
      if (init?.signal?.aborted) {
        throw new DOMException("The operation was aborted", "AbortError");
      }
      return new Response(null, { status: 200 });
    });

    const result = await probeResource(
      "https://example.com/sitemap.xml",
      fetcher,
      signal,
    );

    expect(result.run).toBe(false);
    expect(result.present).toBe(false);
    expect(result.error).toContain("aborted");
  });

  it("probeSite forwards the signal to both the sitemap and llms.txt probes", async () => {
    const signal = new AbortController().signal;
    const fetcher: ProbeFn = vi.fn(
      async () => new Response(null, { status: 200 }),
    );

    await probeSite("https://example.com", fetcher, signal);

    expect(fetcher).toHaveBeenCalledTimes(2);
    for (const call of vi.mocked(fetcher).mock.calls) {
      expect(call[1]).toMatchObject({ signal });
    }
  });
});
