import { existsSync, readFileSync } from "node:fs";

export type ImageEvidenceFormat = "png" | "jpeg";

export interface ImageEvidence {
  format: ImageEvidenceFormat;
  width: number;
  height: number;
  bytes: number;
}

export interface ImageEvidenceExpectation {
  label: string;
  width?: number;
  height?: number;
  minBytes?: number;
  requireVisualContent?: boolean;
  minUniqueByteValues?: number;
  maxDominantByteRatio?: number;
}

const pngSignature = "89504e470d0a1a0a";
const defaultMinBytes = 1_000;
const defaultMinUniqueByteValues = 24;
const defaultMaxDominantByteRatio = 0.6;

export function imageEvidenceIssues(path: string, expectation: ImageEvidenceExpectation): string[] {
  if (!existsSync(path)) {
    return [`${expectation.label} image is missing: ${path}.`];
  }

  const bytes = readFileSync(path);
  const evidence = readImageEvidence(bytes);
  if (!evidence) {
    return [`${expectation.label} must be PNG or JPEG image evidence: ${path}.`];
  }

  const issues: string[] = [];
  const minBytes = expectation.minBytes ?? defaultMinBytes;
  if (evidence.bytes < minBytes) {
    issues.push(`${expectation.label} image is too small to be useful: ${path} (${evidence.bytes} bytes).`);
  }

  if (expectation.width !== undefined && evidence.width !== expectation.width) {
    issues.push(`${expectation.label} image width: expected ${expectation.width}, got ${evidence.width}.`);
  }
  if (expectation.height !== undefined && evidence.height !== expectation.height) {
    issues.push(`${expectation.label} image height: expected ${expectation.height}, got ${evidence.height}.`);
  }

  if (expectation.requireVisualContent) {
    issues.push(...encodedVisualContentIssues(bytes, expectation));
  }

  return issues;
}

export function readImageEvidence(bytes: Buffer): ImageEvidence | undefined {
  return readPngEvidence(bytes) ?? readJpegEvidence(bytes);
}

function readPngEvidence(bytes: Buffer): ImageEvidence | undefined {
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== pngSignature) {
    return undefined;
  }

  return {
    format: "png",
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bytes: bytes.length
  };
}

function readJpegEvidence(bytes: Buffer): ImageEvidence | undefined {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return undefined;
  }

  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (bytes[offset] === 0xff) {
      offset += 1;
    }

    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }

    if (offset + 2 > bytes.length) {
      break;
    }

    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      break;
    }

    if (isStartOfFrameMarker(marker) && segmentLength >= 7) {
      return {
        format: "jpeg",
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
        bytes: bytes.length
      };
    }

    offset += segmentLength;
  }

  return undefined;
}

function isStartOfFrameMarker(marker: number): boolean {
  return (
    (marker >= 0xc0 && marker <= 0xc3)
    || (marker >= 0xc5 && marker <= 0xc7)
    || (marker >= 0xc9 && marker <= 0xcb)
    || (marker >= 0xcd && marker <= 0xcf)
  );
}

function encodedVisualContentIssues(bytes: Buffer, expectation: ImageEvidenceExpectation): string[] {
  const byteCounts = new Array<number>(256).fill(0);
  for (const byte of bytes) {
    byteCounts[byte] += 1;
  }

  const uniqueByteValues = byteCounts.filter((count) => count > 0).length;
  const dominantByteRatio = Math.max(...byteCounts) / bytes.length;
  const minUniqueByteValues = expectation.minUniqueByteValues ?? defaultMinUniqueByteValues;
  const maxDominantByteRatio = expectation.maxDominantByteRatio ?? defaultMaxDominantByteRatio;
  const issues: string[] = [];

  if (uniqueByteValues < minUniqueByteValues) {
    issues.push(
      `${expectation.label} image has too little encoded variation to prove visual content: expected at least ${minUniqueByteValues} byte values, got ${uniqueByteValues}.`
    );
  }

  if (dominantByteRatio > maxDominantByteRatio) {
    issues.push(
      `${expectation.label} image is dominated by one byte value and may be blank: expected at most ${maxDominantByteRatio}, got ${roundRatio(dominantByteRatio)}.`
    );
  }

  return issues;
}

function roundRatio(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}
