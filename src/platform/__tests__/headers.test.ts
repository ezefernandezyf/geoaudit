import { describe, expect, it } from "vitest";
import { analyzeHeaders } from "@/platform/headers";
import {
  HEADERS_COMPLETE,
  HEADERS_NO_CANONICAL,
} from "@/platform/__fixtures__/headers";

describe("analyzeHeaders (RPL-1)", () => {
  it("reports complete headers with no warnings and records HSTS as a positive signal", () => {
    const result = analyzeHeaders(HEADERS_COMPLETE);
    expect(result.contentTypeValidHtml).toBe(true);
    expect(result.hasHsts).toBe(true);
    expect(result.hasNoindex).toBe(false);
    expect(result.canonicalLink).toBe("https://example.com/");
    expect(result.findings).toEqual([]);
  });

  it("raises a Low missing_canonical_header finding when no canonical Link header exists", () => {
    const result = analyzeHeaders(HEADERS_NO_CANONICAL);
    const finding = result.findings.find(
      (f) => f.key === "missing_canonical_header",
    );
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("Low");
  });

  it("flags a noindex X-Robots-Tag as a High finding", () => {
    const result = analyzeHeaders(new Headers({ "x-robots-tag": "noindex" }));
    const finding = result.findings.find((f) => f.key === "x_robots_noindex");
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("High");
  });

  it("handles empty headers gracefully without crashing", () => {
    const result = analyzeHeaders(new Headers());
    expect(result.contentType).toBeNull();
    expect(result.contentTypeValidHtml).toBe(false);
    expect(result.findings.length).toBeGreaterThan(0);
  });
});
