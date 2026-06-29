const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const ZLIB_NO_COMPRESSION_HEADER = new Uint8Array([0x78, 0x01]);
const MAX_DEFLATE_STORED_BLOCK_SIZE = 65_535;

export function encodeRgbaPngDataUrl(
  width: number,
  height: number,
  rgba: Uint8Array | Uint8ClampedArray,
  options: { flipY?: boolean } = {}
): string {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("PNG dimensions must be positive integers.");
  }

  const rowSize = width * 4;
  if (rgba.length < rowSize * height) {
    throw new Error("RGBA buffer is smaller than the requested PNG dimensions.");
  }

  const scanlines = new Uint8Array((rowSize + 1) * height);
  for (let row = 0; row < height; row += 1) {
    const sourceRow = options.flipY ? height - 1 - row : row;
    const sourceOffset = sourceRow * rowSize;
    const targetOffset = row * (rowSize + 1) + 1;
    scanlines.set(rgba.subarray(sourceOffset, sourceOffset + rowSize), targetOffset);
  }

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const png = concatBytes([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlibStore(scanlines)),
    pngChunk("IEND", new Uint8Array())
  ]);

  return `data:image/png;base64,${bytesToBase64(png)}`;
}

function zlibStore(data: Uint8Array): Uint8Array {
  const blockCount = Math.max(1, Math.ceil(data.length / MAX_DEFLATE_STORED_BLOCK_SIZE));
  const outputLength = ZLIB_NO_COMPRESSION_HEADER.length + data.length + blockCount * 5 + 4;
  const output = new Uint8Array(outputLength);
  let outputOffset = 0;
  let dataOffset = 0;

  output.set(ZLIB_NO_COMPRESSION_HEADER, outputOffset);
  outputOffset += ZLIB_NO_COMPRESSION_HEADER.length;

  for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
    const remaining = data.length - dataOffset;
    const blockLength = Math.min(MAX_DEFLATE_STORED_BLOCK_SIZE, remaining);
    const finalBlock = blockIndex === blockCount - 1;
    output[outputOffset] = finalBlock ? 0x01 : 0x00;
    output[outputOffset + 1] = blockLength & 0xff;
    output[outputOffset + 2] = (blockLength >> 8) & 0xff;
    output[outputOffset + 3] = (~blockLength) & 0xff;
    output[outputOffset + 4] = ((~blockLength) >> 8) & 0xff;
    outputOffset += 5;
    output.set(data.subarray(dataOffset, dataOffset + blockLength), outputOffset);
    outputOffset += blockLength;
    dataOffset += blockLength;
  }

  new DataView(output.buffer).setUint32(outputOffset, adler32(data));
  return output;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = asciiBytes(type);
  const output = new Uint8Array(12 + data.length);
  const view = new DataView(output.buffer);
  view.setUint32(0, data.length);
  output.set(typeBytes, 4);
  output.set(data, 8);
  view.setUint32(8 + data.length, crc32(concatBytes([typeBytes, data])));
  return output;
}

function asciiBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index);
  }
  return bytes;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (const byte of bytes) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof globalThis.btoa !== "function") {
    throw new Error("btoa is required for browser QA PNG encoding.");
  }

  const chunkSize = 0x8000;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return globalThis.btoa(binary);
}
