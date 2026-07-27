export type SurfaceProfile = "browser" | "mobile";

const SURFACE_QUERY_KEYS = ["surface", "ttSurface"];

export function surfaceProfileFromUrl(url: string | undefined): SurfaceProfile {
  const parsed = parseSurfaceUrl(url);
  if (!parsed) {
    return "browser";
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

  return "browser";
}

export function readSurfaceProfile(url = globalThis.location?.href): SurfaceProfile {
  return surfaceProfileFromUrl(url);
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
