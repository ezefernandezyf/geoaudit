import { describe, expect, it } from "vitest";
import {
  BodyTooLargeError,
  MAX_BODY_BYTES,
  readBody,
} from "@/lib/fetch/body-reader";

const MEGABYTE = 1024 * 1024;

function chunkStream(
  chunks: Uint8Array[],
  options: { close?: boolean; onCancel?: () => void } = {},
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      if (options.close ?? true) controller.close();
    },
    cancel() {
      options.onCancel?.();
    },
  });
}

function byteChunk(size: number, fill = 65): Uint8Array {
  return new Uint8Array(size).fill(fill);
}

describe("readBody (RFL-7 decoded-size cap)", () => {
  it("aborts a stream exceeding the default ~5MB cap with TOO_LARGE", async () => {
    let cancelled = false;
    // Stream stays open (like a live network body) so cancel() is observable.
    const stream = chunkStream(
      [
        byteChunk(MEGABYTE),
        byteChunk(MEGABYTE),
        byteChunk(MEGABYTE),
        byteChunk(MEGABYTE),
        byteChunk(MEGABYTE),
        byteChunk(MEGABYTE),
      ],
      {
        close: false,
        onCancel: () => {
          cancelled = true;
        },
      },
    );

    const error = await readBody(stream, MAX_BODY_BYTES).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(BodyTooLargeError);
    if (error instanceof BodyTooLargeError) {
      expect(error.limitBytes).toBe(MAX_BODY_BYTES);
      expect(error.message).toContain(String(MAX_BODY_BYTES));
    }
    expect(cancelled).toBe(true);
  });

  it("aborts a stream exceeding a custom small cap", async () => {
    const stream = chunkStream([byteChunk(700), byteChunk(700)]);

    const error = await readBody(stream, 1024).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BodyTooLargeError);
    if (error instanceof BodyTooLargeError) {
      expect(error.limitBytes).toBe(1024);
    }
  });

  it("accepts a body exactly at the cap boundary (total === maxBytes)", async () => {
    const stream = chunkStream([
      byteChunk(2 * MEGABYTE, 65),
      byteChunk(3 * MEGABYTE, 66),
    ]);

    const bytes = await readBody(stream, MAX_BODY_BYTES);

    expect(bytes.byteLength).toBe(MAX_BODY_BYTES);
  });

  it("returns the concatenated bytes in order for a body under the cap", async () => {
    const stream = chunkStream([
      byteChunk(3, 65),
      byteChunk(2, 66),
      byteChunk(1, 67),
    ]);

    const bytes = await readBody(stream, MAX_BODY_BYTES);

    expect(Array.from(bytes)).toEqual([65, 65, 65, 66, 66, 67]);
  });

  it("returns an empty buffer for an empty stream", async () => {
    const stream = chunkStream([]);

    const bytes = await readBody(stream, MAX_BODY_BYTES);

    expect(bytes.byteLength).toBe(0);
  });

  it("returns an empty buffer for a null body (defensive)", async () => {
    const bytes = await readBody(null, MAX_BODY_BYTES);

    expect(bytes.byteLength).toBe(0);
  });
});
