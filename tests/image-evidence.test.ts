import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { imageEvidenceIssues } from "../scripts/image-evidence";

describe("image evidence validation", () => {
  it("accepts structurally valid image evidence with encoded visual variation", () => {
    const directory = mkdtempSync(join(tmpdir(), "tt-image-evidence-"));
    const path = join(directory, "screen.jpg");
    writeFileSync(path, jpegEvidence(368, 552, true));

    expect(imageEvidenceIssues(path, {
      label: "mobile screenshot",
      width: 368,
      height: 552,
      minBytes: 1_000,
      requireVisualContent: true
    })).toEqual([]);
  });

  it("rejects structurally valid but visually empty encoded image evidence", () => {
    const directory = mkdtempSync(join(tmpdir(), "tt-image-evidence-"));
    const path = join(directory, "blank.jpg");
    writeFileSync(path, jpegEvidence(368, 552, false));

    const issues = imageEvidenceIssues(path, {
      label: "mobile screenshot",
      width: 368,
      height: 552,
      minBytes: 1_000,
      requireVisualContent: true
    });

    expect(issues.some((issue) => issue.includes("too little encoded variation"))).toBe(true);
    expect(issues.some((issue) => issue.includes("dominated by one byte value"))).toBe(true);
  });
});

function jpegEvidence(width: number, height: number, varied: boolean): Buffer {
  const bytes = Buffer.alloc(4_000, 0);
  if (varied) {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = (index * 37 + 19) % 256;
    }
  }
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  bytes[3] = 0xc0;
  bytes.writeUInt16BE(17, 4);
  bytes[6] = 8;
  bytes.writeUInt16BE(height, 7);
  bytes.writeUInt16BE(width, 9);
  bytes[bytes.length - 2] = 0xff;
  bytes[bytes.length - 1] = 0xd9;
  return bytes;
}
