import type { SurfaceProfile } from "./SurfaceProfileSystem";

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type SafeAreaInput = Partial<SafeAreaInsets> | undefined;

export function zeroSafeAreaInsets(): SafeAreaInsets {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
}

export function safeAreaInsets(input: SafeAreaInput): SafeAreaInsets {
  return {
    top: safeInset(input?.top),
    right: safeInset(input?.right),
    bottom: safeInset(input?.bottom),
    left: safeInset(input?.left)
  };
}

export function safeAreaInsetsForSurface(_surfaceProfile: SurfaceProfile, input: SafeAreaInput): SafeAreaInsets {
  return safeAreaInsets(input);
}

export function readSafeAreaInsets(documentRef: Document | undefined = globalThis.document): SafeAreaInsets {
  if (!documentRef?.documentElement || typeof globalThis.getComputedStyle !== "function") {
    return zeroSafeAreaInsets();
  }

  const style = globalThis.getComputedStyle(documentRef.documentElement);

  return safeAreaInsets({
    top: readCssPx(style.getPropertyValue("--safe-area-top")),
    right: readCssPx(style.getPropertyValue("--safe-area-right")),
    bottom: readCssPx(style.getPropertyValue("--safe-area-bottom")),
    left: readCssPx(style.getPropertyValue("--safe-area-left"))
  });
}

export function readSafeAreaInsetsForSurface(
  _surfaceProfile: SurfaceProfile,
  documentRef: Document | undefined = globalThis.document
): SafeAreaInsets {
  return readSafeAreaInsets(documentRef);
}

function safeInset(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function readCssPx(value: string): number {
  const parsed = Number.parseFloat(value.trim());

  return Number.isFinite(parsed) ? parsed : 0;
}
