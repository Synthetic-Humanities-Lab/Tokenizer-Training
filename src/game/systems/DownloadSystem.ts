import { SUMMARY_FILENAME_PREFIX } from "./ProductIdentitySystem";

export type TextDownloadResult = "saved" | "unavailable";

export interface DownloadEnvironment {
  document?: DownloadDocument;
  url?: DownloadUrlApi;
  blobConstructor?: TextBlobConstructor;
}

export interface DownloadDocument {
  body?: {
    appendChild(element: DownloadAnchor): void;
    removeChild(element: DownloadAnchor): void;
  };
  createElement(tagName: "a"): DownloadAnchor;
}

export interface DownloadAnchor {
  href: string;
  download: string;
  style: {
    display?: string;
  };
  click(): void;
}

export interface DownloadUrlApi {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

export interface TextBlobConstructor {
  new (blobParts?: BlobPart[], options?: BlobPropertyBag): Blob;
}

export function downloadTextFile(
  text: string,
  filename: string,
  environment: DownloadEnvironment = browserDownloadEnvironment()
): TextDownloadResult {
  const documentRef = environment.document;
  const urlApi = environment.url;
  const BlobRef = environment.blobConstructor;
  if (!documentRef?.body || !urlApi || !BlobRef) {
    return "unavailable";
  }

  let objectUrl = "";
  const anchor = documentRef.createElement("a");

  try {
    const blob = new BlobRef([text], { type: "text/plain;charset=utf-8" });
    objectUrl = urlApi.createObjectURL(blob);
    anchor.href = objectUrl;
    anchor.download = safeSummaryFilename(filename);
    anchor.style.display = "none";
    documentRef.body.appendChild(anchor);
    anchor.click();
    return "saved";
  } catch {
    return "unavailable";
  } finally {
    try {
      documentRef.body.removeChild(anchor);
    } catch {
      // Removing a failed or already removed download anchor is best effort.
    }

    if (objectUrl) {
      try {
        urlApi.revokeObjectURL(objectUrl);
      } catch {
        // Revoking object URLs is best effort.
      }
    }
  }
}

export function summaryFilename(runId: string | undefined): string {
  const suffix = runId?.trim() || "unidentified-run";
  return safeSummaryFilename(`${SUMMARY_FILENAME_PREFIX}-${suffix}.txt`);
}

function safeSummaryFilename(filename: string): string {
  const clean = filename.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return clean.length > 0 ? clean : `${SUMMARY_FILENAME_PREFIX}.txt`;
}

function browserDownloadEnvironment(): DownloadEnvironment {
  const documentRef = globalThis.document;

  return {
    document: documentRef
      ? {
          body: documentRef.body
            ? {
                appendChild(element) {
                  documentRef.body.appendChild(element as unknown as Node);
                },
                removeChild(element) {
                  documentRef.body.removeChild(element as unknown as Node);
                }
              }
            : undefined,
          createElement() {
            return documentRef.createElement("a") as unknown as DownloadAnchor;
          }
        }
      : undefined,
    url: globalThis.URL,
    blobConstructor: globalThis.Blob
  };
}
