import { describe, expect, it } from "vitest";
import { readImageSize } from "../src/core/image-metadata.js";

describe("readImageSize", () => {
  it("reads PNG dimensions without requiring a full image decode", () => {
    expect(readImageSize(createPngHeader(320, 180), "image/png")).toEqual({
      width: 320,
      height: 180
    });
  });

  it("returns undefined for unsupported or truncated image bytes", () => {
    expect(readImageSize(Buffer.from("not-an-image"), "application/octet-stream")).toBeUndefined();
  });
});

function createPngHeader(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}
