/**
 * Charset resolution (RFL-9/RFL-10): Content-Type header → <meta charset> →
 * UTF-8 fallback, decoding via TextDecoder. ISO-8859-1 (latin-1) pages decode
 * correctly through the WHATWG label mapping.
 */

export type CharsetSource = "header" | "meta" | "default_utf8";

export interface CharsetResolution {
  charset: string;
  source: CharsetSource;
}

export type DecodedHtml = {
  html: string;
  charset: string;
  source: CharsetSource;
};

/** Bytes prescanned for a <meta charset> per the HTML5 sniffing guidance. */
const META_PRESCAN_BYTES = 1024;

export function charsetFromHeader(contentType: string | null): string | null {
  if (!contentType) return null;
  const match = /charset\s*=\s*["']?([^;"'\s]+)/i.exec(contentType);
  return match ? match[1] : null;
}

export function charsetFromMeta(html: string): string | null {
  const charsetTag = /<meta[^>]+charset\s*=\s*["']?([a-zA-Z0-9_\-]+)/i.exec(
    html,
  );
  if (charsetTag) return charsetTag[1];

  const httpEquiv =
    /<meta[^>]+http-equiv\s*=\s*["']?content-type["']?[^>]*content\s*=\s*["'][^"']*charset\s*=\s*([a-zA-Z0-9_\-]+)/i.exec(
      html,
    );
  return httpEquiv ? httpEquiv[1] : null;
}

export function resolveCharset(
  contentType: string | null,
  html: string,
): CharsetResolution {
  const fromHeader = charsetFromHeader(contentType);
  if (fromHeader) return { charset: fromHeader, source: "header" };

  const fromMeta = charsetFromMeta(html);
  if (fromMeta) return { charset: fromMeta, source: "meta" };

  return { charset: "UTF-8", source: "default_utf8" };
}

export function decodeBody(body: Uint8Array, charset: string): string {
  try {
    return new TextDecoder(charset).decode(body);
  } catch {
    // Unknown label: fall back to UTF-8 instead of failing the audit.
    return new TextDecoder("utf-8").decode(body);
  }
}

export function decodeHtml(
  body: Uint8Array,
  contentType: string | null,
): DecodedHtml {
  const fromHeader = charsetFromHeader(contentType);
  if (fromHeader) {
    return {
      html: decodeBody(body, fromHeader),
      charset: fromHeader,
      source: "header",
    };
  }

  const prefix = decodeBody(body.subarray(0, META_PRESCAN_BYTES), "utf-8");
  const fromMeta = charsetFromMeta(prefix);
  if (fromMeta) {
    return {
      html: decodeBody(body, fromMeta),
      charset: fromMeta,
      source: "meta",
    };
  }

  return {
    html: decodeBody(body, "utf-8"),
    charset: "UTF-8",
    source: "default_utf8",
  };
}
