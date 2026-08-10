import { describe, expect, it, vi } from "vitest";
import {
  followRedirects,
  MAX_REDIRECTS,
  RedirectChainError,
} from "@/lib/fetch/redirect";
import { SsrfError } from "@/lib/fetch/ssrf";
import type { FetchImpl, HopValidator } from "@/lib/fetch/redirect";

function redirectResponse(status: number, location: string): Response {
  return new Response(null, { status, headers: { location } });
}

const noopValidate: HopValidator = async () => {};

describe("followRedirects (RFL-6 manual redirect loop)", () => {
  it("follows a 3-hop chain and returns the final 200 response body", async () => {
    const fetcher: FetchImpl = vi.fn(async (input) => {
      const url = String(input);
      if (url === "https://a.test/")
        return redirectResponse(301, "https://b.test/");
      if (url === "https://b.test/")
        return redirectResponse(302, "https://c.test/");
      if (url === "https://c.test/")
        return new Response("final body", { status: 200 });
      throw new Error(`unexpected fetch: ${url}`);
    });
    const validated: string[] = [];
    const validateHop: HopValidator = async (url) => {
      validated.push(url.hostname);
    };

    const response = await followRedirects(new URL("https://a.test/"), {
      fetcher,
      validateHop,
      timeoutMs: 5000,
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("final body");
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(validated).toEqual(["a.test", "b.test", "c.test"]);
  });

  it("aborts a chain longer than MAX_REDIRECTS with TOO_MANY_REDIRECTS", async () => {
    const fetcher: FetchImpl = vi.fn(async (input) => {
      const n = Number(String(input).split("/").pop());
      return redirectResponse(301, `https://a.test/${n + 1}`);
    });

    const error = await followRedirects(new URL("https://a.test/0"), {
      fetcher,
      validateHop: noopValidate,
      timeoutMs: 5000,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RedirectChainError);
    if (error instanceof RedirectChainError) {
      expect(error.code).toBe("TOO_MANY_REDIRECTS");
    }
    expect(fetcher).toHaveBeenCalledTimes(MAX_REDIRECTS + 1);
  });

  it("propagates an SsrfError when the next hop resolves to a private IP", async () => {
    const fetcher: FetchImpl = vi.fn(async () =>
      redirectResponse(302, "https://10.0.0.1/admin"),
    );
    const validateHop: HopValidator = async (url) => {
      if (url.hostname === "10.0.0.1") {
        throw new SsrfError(url.hostname, "10.0.0.1", "private_ip_range");
      }
    };

    const error = await followRedirects(new URL("https://a.test/"), {
      fetcher,
      validateHop,
      timeoutMs: 5000,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SsrfError);
    if (error instanceof SsrfError) {
      expect(error.hostname).toBe("10.0.0.1");
      expect(error.ip).toBe("10.0.0.1");
    }
  });

  it("rejects an https→http scheme downgrade with SSRF_BLOCKED", async () => {
    const fetcher: FetchImpl = vi.fn(async () =>
      redirectResponse(301, "http://insecure.test/page"),
    );

    const error = await followRedirects(new URL("https://a.test/"), {
      fetcher,
      validateHop: noopValidate,
      timeoutMs: 5000,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RedirectChainError);
    if (error instanceof RedirectChainError) {
      expect(error.code).toBe("SSRF_BLOCKED");
      expect(error.message).toContain("http");
    }
  });

  it("fails a redirect response without a Location header", async () => {
    const fetcher: FetchImpl = vi.fn(
      async () => new Response(null, { status: 301 }),
    );

    const error = await followRedirects(new URL("https://a.test/"), {
      fetcher,
      validateHop: noopValidate,
      timeoutMs: 5000,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RedirectChainError);
    if (error instanceof RedirectChainError) {
      expect(error.code).toBe("HTTP_STATUS");
    }
  });

  it("propagates transport failures from the fetcher (mapped upstream)", async () => {
    const fetcher: FetchImpl = vi.fn(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    });

    const error = await followRedirects(new URL("https://a.test/"), {
      fetcher,
      validateHop: noopValidate,
      timeoutMs: 5000,
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DOMException);
  });
});
