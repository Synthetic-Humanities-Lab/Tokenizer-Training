export type ClipboardCopyResult = "copied" | "unavailable";

export interface ClipboardEnvironment {
  navigator?: {
    clipboard?: {
      writeText(text: string): Promise<void>;
    };
  };
  document?: LegacyCopyDocument;
}

export interface LegacyCopyDocument {
  body?: {
    appendChild(element: LegacyTextArea): void;
    removeChild(element: LegacyTextArea): void;
  };
  createElement(tagName: "textarea"): LegacyTextArea;
  execCommand?(command: "copy"): boolean;
}

export interface LegacyTextArea {
  value: string;
  style: {
    position?: string;
    left?: string;
    top?: string;
    opacity?: string;
  };
  setAttribute(name: string, value: string): void;
  select(): void;
  setSelectionRange(start: number, end: number): void;
}

export async function copyTextToClipboard(
  text: string,
  environment: ClipboardEnvironment = browserClipboardEnvironment()
): Promise<ClipboardCopyResult> {
  try {
    await environment.navigator?.clipboard?.writeText(text);
    if (environment.navigator?.clipboard?.writeText) {
      return "copied";
    }
  } catch {
    // Fall through to the legacy copy path below.
  }

  return legacyCopy(text, environment.document) ? "copied" : "unavailable";
}

function legacyCopy(text: string, documentRef: LegacyCopyDocument | undefined): boolean {
  if (!documentRef?.body || !documentRef.execCommand) {
    return false;
  }

  const textarea = documentRef.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.style.opacity = "0";

  try {
    documentRef.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return documentRef.execCommand("copy") === true;
  } catch {
    return false;
  } finally {
    try {
      documentRef.body.removeChild(textarea);
    } catch {
      // Removing the fallback element is best effort.
    }
  }
}

function browserClipboardEnvironment(): ClipboardEnvironment {
  const documentRef = globalThis.document;

  return {
    navigator: globalThis.navigator,
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
          return documentRef.createElement("textarea") as unknown as LegacyTextArea;
        },
        execCommand(command) {
          return documentRef.execCommand(command);
        }
      }
      : undefined
  };
}
