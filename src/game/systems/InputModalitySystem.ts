export type PlaytestInputModality = "none" | "mouse" | "touch" | "pen" | "mixed" | "unknown";

export interface InputPointerLike {
  wasTouch?: boolean;
  event?: {
    pointerType?: string;
    type?: string;
  } | null;
}

export function inputModalityFromPointer(pointer: InputPointerLike): Exclude<PlaytestInputModality, "none" | "mixed"> {
  const pointerType = pointer.event?.pointerType?.trim().toLowerCase();
  if (pointerType === "mouse" || pointerType === "touch" || pointerType === "pen") {
    return pointerType;
  }

  if (pointer.wasTouch) {
    return "touch";
  }

  const eventType = pointer.event?.type?.trim().toLowerCase() ?? "";
  if (eventType.startsWith("touch")) {
    return "touch";
  }
  if (eventType.startsWith("mouse")) {
    return "mouse";
  }

  return pointer.wasTouch === false ? "mouse" : "unknown";
}

export function mergeInputModality(
  current: PlaytestInputModality,
  observed: PlaytestInputModality
): PlaytestInputModality {
  if (observed === "none") {
    return current;
  }
  if (current === "none" || current === "unknown") {
    return observed;
  }
  if (observed === "unknown" || current === observed) {
    return current;
  }

  return "mixed";
}

export function inputModalitySummaryLine(modality: PlaytestInputModality | undefined): string {
  if (!modality || modality === "none") {
    return "Input: not captured";
  }
  if (modality === "unknown") {
    return "Input: unknown";
  }

  return `Input: ${modality}`;
}

export function inputModalityEvidenceLine(modality: PlaytestInputModality | undefined): string {
  if (!modality || modality === "none") {
    return "Input evidence: no in-game pointer event captured";
  }
  if (modality === "unknown") {
    return "Input evidence: pointer event captured, browser type unknown";
  }
  if (modality === "mouse") {
    return "Input evidence: browser pointer reported mouse; not mobile-gate evidence";
  }
  if (modality === "touch") {
    return "Input evidence: browser pointer reported touch; verify device metadata";
  }
  if (modality === "pen") {
    return "Input evidence: browser pointer reported pen; verify device metadata";
  }

  return "Input evidence: browser reported mixed pointer types; verify session context";
}
