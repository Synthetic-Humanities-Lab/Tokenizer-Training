import { describe, expect, it } from "vitest";
import { inflateSync } from "node:zlib";
import { encodeRgbaPngDataUrl } from "../src/game/systems/GameQaPngSystem";

function decodeDataUrl(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function chunkData(bytes: Uint8Array, type: string): Uint8Array {
  let offset = 8;
  while (offset < bytes.length) {
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
    const chunkType = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (chunkType === type) {
      return bytes.subarray(offset + 8, offset + 8 + length);
    }
    offset += 12 + length;
  }

  throw new Error(`Missing PNG chunk ${type}`);
}

describe("encodeRgbaPngDataUrl", () => {
  it("encodes RGBA pixels as a browser-readable PNG data URL", () => {
    const dataUrl = encodeRgbaPngDataUrl(1, 1, new Uint8Array([255, 0, 0, 255]));
    const bytes = decodeDataUrl(dataUrl);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(view.getUint32(16)).toBe(1);
    expect(view.getUint32(20)).toBe(1);
    expect(Array.from(inflateSync(chunkData(bytes, "IDAT")))).toEqual([0, 255, 0, 0, 255]);
  });

  it("can flip WebGL bottom-up rows into PNG top-down rows", () => {
    const bottomRedTopBlue = new Uint8Array([
      255, 0, 0, 255,
      0, 0, 255, 255
    ]);
    const dataUrl = encodeRgbaPngDataUrl(1, 2, bottomRedTopBlue, { flipY: true });
    const inflated = inflateSync(chunkData(decodeDataUrl(dataUrl), "IDAT"));

    expect(Array.from(inflated)).toEqual([
      0, 0, 0, 255, 255,
      0, 255, 0, 0, 255
    ]);
  });
});
