export interface PlaySceneQaControls {
  freezeElapsedMs?: number;
  canvasCapture?: boolean;
  fixtureId?: string;
  cuts?: number[];
  autoResolve?: boolean;
  holdSplit?: boolean;
  holdReview?: boolean;
}

const MAX_QA_FREEZE_ELAPSED_MS = 120_000;
const MAX_QA_CUT_COUNT = 64;
const QA_FIXTURE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

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
    const fixtureId = parseQaFixtureId(
      parsed.searchParams.get("qaFixtureId")
        ?? hashParams.get("qaFixtureId")
    );
    const cuts = parseQaCuts(
      parsed.searchParams.get("qaCuts")
        ?? hashParams.get("qaCuts")
    );
    const autoResolve = parseQaCanvasCapture(
      parsed.searchParams.get("qaAutoResolve")
        ?? hashParams.get("qaAutoResolve")
    );
    const holdSplit = parseQaCanvasCapture(
      parsed.searchParams.get("qaHoldSplit")
        ?? hashParams.get("qaHoldSplit")
    );
    const holdReview = parseQaHoldReview(
      parsed.searchParams.get("qaHoldReview")
        ?? hashParams.get("qaHoldReview")
    );

    if (freezeElapsedMs !== undefined) {
      controls.freezeElapsedMs = freezeElapsedMs;
    }
    if (canvasCapture !== undefined) {
      controls.canvasCapture = canvasCapture;
    }
    if (fixtureId !== undefined) {
      controls.fixtureId = fixtureId;
    }
    if (cuts !== undefined) {
      controls.cuts = cuts;
    }
    if (autoResolve !== undefined) {
      controls.autoResolve = autoResolve;
    }
    if (holdSplit !== undefined) {
      controls.holdSplit = holdSplit;
    }
    if (holdReview !== undefined) {
      controls.holdReview = holdReview;
    }

    return controls;
  } catch {
    return {};
  }
}

export function parseQaCuts(value: string | null): number[] | undefined {
  if (value === null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parts = trimmed.split(",");
  if (parts.length > MAX_QA_CUT_COUNT || parts.some((part) => !/^\d+$/.test(part))) {
    return undefined;
  }

  const cuts = parts.map((part) => Number.parseInt(part, 10));
  if (
    cuts.some((cut) => !Number.isSafeInteger(cut) || cut <= 0)
    || new Set(cuts).size !== cuts.length
  ) {
    return undefined;
  }

  return cuts;
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

export function parseQaFixtureId(value: string | null): string | undefined {
  if (value === null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!QA_FIXTURE_ID_PATTERN.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

export function parseQaHoldReview(value: string | null): boolean | undefined {
  return parseQaCanvasCapture(value);
}
