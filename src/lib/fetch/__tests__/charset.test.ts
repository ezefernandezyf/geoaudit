import { describe, expect, it } from "vitest";
import {
  charsetFromHeader,
  charsetFromMeta,
  decodeBody,
  decodeHtml,
  resolveCharset,
} from "@/lib/fetch/charset";

/** Encode a latin-1 string as raw bytes (chars > 0xff are masked, as in ISO-8859-1). */
function latin1Bytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff;
  return bytes;
}

const UTF8 = new TextEncoder();

describe("charsetFromHeader (RFL-9 header path)", () => {
  it("extracts the charset parameter from a Content-Type header", () => {
    expect(charsetFromHeader("text/html; charset=ISO-8859-1")).toBe(
      "ISO-8859-1",
    );
  });

  it("returns null when the header has no charset parameter", () => {
    expect(charsetFromHeader("text/html")).toBeNull();
    expect(charsetFromHeader(null)).toBeNull();
  });
});

describe("charsetFromMeta (RFL-9 meta path)", () => {
  it("detects <meta charset>", () => {
    expect(
      charsetFromMeta('<html><head><meta charset="UTF-8"></head></html>'),
    ).toBe("UTF-8");
  });

  it("detects the http-equiv Content-Type form", () => {
    const html =
      '<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">';
    expect(charsetFromMeta(html)).toBe("ISO-8859-1");
  });

  it("returns null when no meta charset exists", () => {
    expect(
      charsetFromMeta(
        "<html><head><title>no charset here</title></head></html>",
      ),
    ).toBeNull();
  });
});

describe("resolveCharset (RFL-9 resolution chain)", () => {
  it("prefers the Content-Type header over a conflicting meta tag", () => {
    expect(
      resolveCharset("text/html; charset=ISO-8859-1", '<meta charset="UTF-8">'),
    ).toEqual({
      charset: "ISO-8859-1",
      source: "header",
    });
  });

  it("falls back to the meta charset when the header has none", () => {
    expect(
      resolveCharset(
        "text/html",
        '<html><head><meta charset="UTF-8"></head></html>',
      ),
    ).toEqual({
      charset: "UTF-8",
      source: "meta",
    });
  });

  it("defaults to UTF-8 with source default_utf8 when nothing declares a charset", () => {
    expect(resolveCharset(null, "<html><body>plain</body></html>")).toEqual({
      charset: "UTF-8",
      source: "default_utf8",
    });
  });
});

describe("decodeBody (RFL-10 latin-1)", () => {
  it("decodes ISO-8859-1 bytes with accented characters as single code units", () => {
    const text = "réseau électrique";
    const decoded = decodeBody(latin1Bytes(text), "ISO-8859-1");
    expect(decoded).toBe(text);
    expect(Array.from(decoded).length).toBe(Array.from(text).length);
  });

  it("falls back to UTF-8 for an unknown TextDecoder label instead of throwing", () => {
    const decoded = decodeBody(UTF8.encode("plain text"), "made-up-charset");
    expect(decoded).toBe("plain text");
  });
});

describe("decodeHtml (full chain)", () => {
  it("decodes a latin-1 page using the header charset", () => {
    const html = "<html><head><title>réseau électrique</title></head></html>";
    const {
      html: decoded,
      charset,
      source,
    } = decodeHtml(latin1Bytes(html), "text/html; charset=ISO-8859-1");
    expect(decoded).toContain("réseau électrique");
    expect(charset).toBe("ISO-8859-1");
    expect(source).toBe("header");
  });

  it("decodes a page using the meta charset when the header has none", () => {
    const html =
      '<html><head><meta charset="UTF-8"><title>réseau électrique</title></head></html>';
    const {
      html: decoded,
      charset,
      source,
    } = decodeHtml(UTF8.encode(html), "text/html");
    expect(decoded).toContain("réseau électrique");
    expect(charset).toBe("UTF-8");
    expect(source).toBe("meta");
  });

  it("defaults to UTF-8 when no charset is declared anywhere", () => {
    const html = "<html><body>no declared charset</body></html>";
    const {
      html: decoded,
      charset,
      source,
    } = decodeHtml(UTF8.encode(html), null);
    expect(decoded).toBe(html);
    expect(charset).toBe("UTF-8");
    expect(source).toBe("default_utf8");
  });
});
