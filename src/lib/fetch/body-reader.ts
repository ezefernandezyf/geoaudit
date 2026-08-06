/**
 * Bounded body reader (RFL-7): streams the response body with a decoded-size
 * cap of ~5MB and aborts (cancels the stream) as soon as the cap is exceeded.
 */

export const MAX_BODY_BYTES = 5 * 1024 * 1024; // ~5MB

export class BodyTooLargeError extends Error {
  constructor(readonly limitBytes: number) {
    super(`response body exceeds ${limitBytes} byte limit`);
    this.name = "BodyTooLargeError";
  }
}

export async function readBody(
  stream: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<Uint8Array> {
  if (!stream) return new Uint8Array(0);

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("body exceeds size limit");
        throw new BodyTooLargeError(maxBytes);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
