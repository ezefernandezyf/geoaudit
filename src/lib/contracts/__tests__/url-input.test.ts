import { describe, expect, it } from "vitest";
import { urlInputSchema } from "@/lib/contracts/url-input";

describe("urlInputSchema", () => {
  it("accepts a valid absolute URL", () => {
    const result = urlInputSchema.safeParse({ url: "https://example.com/page" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe("https://example.com/page");
    }
  });

  it("rejects a non-URL string with 'Invalid URL format'", () => {
    const result = urlInputSchema.safeParse({ url: "not-a-url" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid URL format");
    }
  });

  it("rejects an empty string with 'Invalid URL format'", () => {
    const result = urlInputSchema.safeParse({ url: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid URL format");
    }
  });

  it("rejects a missing url field", () => {
    const result = urlInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
