export interface PlaySceneQaControls {
  freezeElapsedMs?: number;
  canvasCapture?: boolean;
}

const MAX_QA_FREEZE_ELAPSED_MS = 120_000;

export function playSceneQaControlsFromUrl(url: string | undefined): PlaySceneQaControls {
  if (!url) {
    return {};
  }

  try {
    const parsed = new URL(url);
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const controls: PlaySceneQaControls = {};
    const freezeElapsedMs = parseQaFreezeElapsedMs(
      parsed.searchParams.get("qaFreezeElapsedMs")
        ?? hashParams.get("qaFreezeElapsedMs")
    );
    const canvasCapture = parseQaCanvasCapture(
      parsed.searchParams.get("qaCanvasCapture")
        ?? hashParams.get("qaCanvasCapture")
    );

    if (freezeElapsedMs !== undefined) {
      controls.freezeElapsedMs = freezeElapsedMs;
    }
    if (canvasCapture !== undefined) {
      controls.canvasCapture = canvasCapture;
    }

    return controls;
  } catch {
    return {};
  }
}

export function parseQaFreezeElapsedMs(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }

  const elapsedMs = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(elapsedMs)) {
    return undefined;
  }

  return Math.min(elapsedMs, MAX_QA_FREEZE_ELAPSED_MS);
}

export function parseQaCanvasCapture(value: string | null): boolean | undefined {
  if (value === null) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}
