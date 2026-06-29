export interface QaViewport {
  width: number;
  height: number;
}

const MIN_WIDTH = 240;
const MAX_WIDTH = 1920;
const MIN_HEIGHT = 320;
const MAX_HEIGHT = 1440;

export function qaViewportFromUrl(url: string | undefined): QaViewport | undefined {
  const parsed = parseLaunchUrl(url);
  if (!parsed) {
    return undefined;
  }

  return parseQaViewport(parsed.searchParams.get("qaViewport"))
    ?? parseQaViewport(new URLSearchParams(parsed.hash.replace(/^#/, "")).get("qaViewport"));
}

export function parseQaViewport(value: string | null | undefined): QaViewport | undefined {
  const match = value?.trim().match(/^(\d{3,4})\s*x\s*(\d{3,4})$/i);
  if (!match) {
    return undefined;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!validDimension(width, MIN_WIDTH, MAX_WIDTH) || !validDimension(height, MIN_HEIGHT, MAX_HEIGHT)) {
    return undefined;
  }

  return { width, height };
}

function validDimension(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function parseLaunchUrl(url: string | undefined): URL | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}
