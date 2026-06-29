import { describe, expect, it, vi } from "vitest";
import {
  downloadTextFile,
  summaryFilename,
  type DownloadAnchor,
  type DownloadEnvironment,
  type TextBlobConstructor
} from "../src/game/systems/DownloadSystem";

class FakeBlob {
  readonly parts: BlobPart[];
  readonly options?: BlobPropertyBag;

  constructor(parts: BlobPart[], options?: BlobPropertyBag) {
    this.parts = parts;
    this.options = options;
  }
}

function downloadEnvironment(): DownloadEnvironment & {
  anchor: DownloadAnchor;
  appended: DownloadAnchor[];
  createdBlobs: FakeBlob[];
  revokedUrls: string[];
} {
  const appended: DownloadAnchor[] = [];
  const createdBlobs: FakeBlob[] = [];
  const revokedUrls: string[] = [];
  const anchor: DownloadAnchor = {
    href: "",
    download: "",
    style: {},
    click: vi.fn()
  };

  return {
    anchor,
    appended,
    createdBlobs,
    revokedUrls,
    blobConstructor: class extends FakeBlob {
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        createdBlobs.push(this);
      }
    } as unknown as TextBlobConstructor,
    url: {
      createObjectURL: vi.fn(() => "blob:summary"),
      revokeObjectURL: vi.fn((url: string) => {
        revokedUrls.push(url);
      })
    },
    document: {
      body: {
        appendChild(element) {
          appended.push(element);
        },
        removeChild(element) {
          const index = appended.indexOf(element);
          if (index >= 0) {
            appended.splice(index, 1);
          }
        }
      },
      createElement() {
        return anchor;
      }
    }
  };
}

describe("downloadTextFile", () => {
  it("creates, clicks, cleans up, and revokes a text download", () => {
    const environment = downloadEnvironment();

    const result = downloadTextFile("summary text", "manual summary.txt", environment);

    expect(result).toBe("saved");
    expect(environment.createdBlobs[0]?.parts).toEqual(["summary text"]);
    expect(environment.createdBlobs[0]?.options).toEqual({ type: "text/plain;charset=utf-8" });
    expect(environment.anchor.href).toBe("blob:summary");
    expect(environment.anchor.download).toBe("manual-summary.txt");
    expect(environment.anchor.style.display).toBe("none");
    expect(environment.anchor.click).toHaveBeenCalledTimes(1);
    expect(environment.appended).toEqual([]);
    expect(environment.revokedUrls).toEqual(["blob:summary"]);
  });

  it("returns unavailable when browser download APIs are missing", () => {
    expect(downloadTextFile("summary", "summary.txt", {})).toBe("unavailable");
  });

  it("sanitizes playtest summary filenames", () => {
    expect(summaryFilename("mtt-20260606-172531z")).toBe(
      "tokenization-training-summary-mtt-20260606-172531z.txt"
    );
    expect(summaryFilename("bad run/id")).toBe("tokenization-training-summary-bad-run-id.txt");
    expect(summaryFilename(undefined)).toBe("tokenization-training-summary-unidentified-run.txt");
  });
});
