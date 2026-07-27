export type SurfaceProfile = "browser" | "mobile";

const SURFACE_QUERY_KEYS = ["surface", "ttSurface"];
const MOBILE_SURFACE_MAX_WIDTH = 1024;

export interface SurfaceRuntimeHints {
  viewportWidth?: number;
  maxTouchPoints?: number;
  coarsePointer?: boolean;
}

export function surfaceProfileFromUrl(url: string | undefined): SurfaceProfile {
  return surfaceProfileOverrideFromUrl(url) ?? "browser";
}

export function surfaceProfileOverrideFromUrl(url: string | undefined): SurfaceProfile | undefined {
  const parsed = parseSurfaceUrl(url);
  if (!parsed) {
    return undefined;
  }

  for (const key of SURFACE_QUERY_KEYS) {
    const profile = parseSurfaceProfile(parsed.searchParams.get(key));
    if (profile) {
      return profile;
    }
  }

  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  for (const key of SURFACE_QUERY_KEYS) {
    const profile = parseSurfaceProfile(hashParams.get(key));
    if (profile) {
      return profile;
    }
  }

  return undefined;
}

export function surfaceProfileForRuntime(
  url: string | undefined,
  hints: SurfaceRuntimeHints
): SurfaceProfile {
  const override = surfaceProfileOverrideFromUrl(url);
  if (override) {
    return override;
  }

  const touchCapable = (hints.maxTouchPoints ?? 0) > 0 || hints.coarsePointer === true;
  const viewportWidth = hints.viewportWidth ?? Number.POSITIVE_INFINITY;
  return touchCapable && viewportWidth <= MOBILE_SURFACE_MAX_WIDTH ? "mobile" : "browser";
}

export function readSurfaceProfile(
  url = globalThis.location?.href,
  hints = readSurfaceRuntimeHints()
): SurfaceProfile {
  return surfaceProfileForRuntime(url, hints);
}

export function parseSurfaceProfile(value: string | null | undefined): SurfaceProfile | undefined {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "mobile" || normalized === "native" || normalized === "ios") {
    return "mobile";
  }

  if (normalized === "browser" || normalized === "web" || normalized === "desktop") {
    return "browser";
  }
}

function parseSurfaceUrl(url: string | undefined): URL | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

function readSurfaceRuntimeHints(): SurfaceRuntimeHints {
  const browserWindow = typeof window === "undefined" ? undefined : window;
  const viewportWidth = browserWindow?.visualViewport?.width
    ?? browserWindow?.innerWidth
    ?? browserWindow?.screen?.width;
  const maxTouchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints;
  const coarsePointer = browserWindow?.matchMedia?.("(pointer: coarse)").matches ?? false;

  return {
    viewportWidth,
    maxTouchPoints,
    coarsePointer
  };
}
