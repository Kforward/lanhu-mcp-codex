import type { ImageSize } from "../types.js";

export function readImageSize(bytes: Buffer, contentType?: string, sourceUrl?: string): ImageSize | undefined {
  if (isPng(bytes, contentType, sourceUrl)) {
    return readPngSize(bytes);
  }

  if (isJpeg(bytes, contentType, sourceUrl)) {
    return readJpegSize(bytes);
  }

  if (isWebp(bytes, contentType, sourceUrl)) {
    return readWebpSize(bytes);
  }

  return undefined;
}

function isPng(bytes: Buffer, contentType?: string, sourceUrl?: string): boolean {
  return contentType?.includes("image/png") === true
    || extensionMatches(sourceUrl, ".png")
    || bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function readPngSize(bytes: Buffer): ImageSize | undefined {
  if (bytes.length < 24) {
    return undefined;
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  return validSize(width, height);
}

function isJpeg(bytes: Buffer, contentType?: string, sourceUrl?: string): boolean {
  return contentType?.includes("image/jpeg") === true
    || contentType?.includes("image/jpg") === true
    || extensionMatches(sourceUrl, ".jpg")
    || extensionMatches(sourceUrl, ".jpeg")
    || (bytes[0] === 0xff && bytes[1] === 0xd8);
}

function readJpegSize(bytes: Buffer): ImageSize | undefined {
  let offset = 2;

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2) {
      return undefined;
    }

    if (isStartOfFrameMarker(marker)) {
      const height = bytes.readUInt16BE(offset + 5);
      const width = bytes.readUInt16BE(offset + 7);
      return validSize(width, height);
    }

    offset += 2 + length;
  }

  return undefined;
}

function isStartOfFrameMarker(marker: number): boolean {
  return marker === 0xc0
    || marker === 0xc1
    || marker === 0xc2
    || marker === 0xc3
    || marker === 0xc5
    || marker === 0xc6
    || marker === 0xc7
    || marker === 0xc9
    || marker === 0xca
    || marker === 0xcb
    || marker === 0xcd
    || marker === 0xce
    || marker === 0xcf;
}

function isWebp(bytes: Buffer, contentType?: string, sourceUrl?: string): boolean {
  return contentType?.includes("image/webp") === true
    || extensionMatches(sourceUrl, ".webp")
    || (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP");
}

function readWebpSize(bytes: Buffer): ImageSize | undefined {
  if (bytes.length < 30 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
    return undefined;
  }

  const chunkType = bytes.toString("ascii", 12, 16);
  if (chunkType === "VP8X" && bytes.length >= 30) {
    const width = 1 + readUInt24LE(bytes, 24);
    const height = 1 + readUInt24LE(bytes, 27);
    return validSize(width, height);
  }

  if (chunkType === "VP8 " && bytes.length >= 30) {
    const width = bytes.readUInt16LE(26) & 0x3fff;
    const height = bytes.readUInt16LE(28) & 0x3fff;
    return validSize(width, height);
  }

  if (chunkType === "VP8L" && bytes.length >= 25) {
    const b1 = bytes[21];
    const b2 = bytes[22];
    const b3 = bytes[23];
    const b4 = bytes[24];
    const width = 1 + (((b2 & 0x3f) << 8) | b1);
    const height = 1 + ((b4 << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    return validSize(width, height);
  }

  return undefined;
}

function readUInt24LE(bytes: Buffer, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function extensionMatches(sourceUrl: string | undefined, extension: string): boolean {
  if (!sourceUrl) {
    return false;
  }

  try {
    return new URL(sourceUrl).pathname.toLowerCase().endsWith(extension);
  } catch {
    return sourceUrl.toLowerCase().endsWith(extension);
  }
}

function validSize(width: number, height: number): ImageSize | undefined {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return undefined;
  }

  return { width, height };
}
