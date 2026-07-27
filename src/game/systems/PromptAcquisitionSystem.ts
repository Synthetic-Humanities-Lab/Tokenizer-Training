export const PROMPT_ACQUISITION_MS = 420;
export const ENDLESS_PROMPT_ACQUISITION_MS = 240;

export interface PromptAcquisitionVisualInput {
  elapsedMs?: number | null;
  compact?: boolean;
  tutorialMode?: boolean;
  durationMs?: number;
}

export interface PromptAcquisitionVisualState {
  active: boolean;
  progress: number;
  labelText: string;
  labelAlpha: number;
  frameAlpha: number;
  sweepAlpha: number;
  sweepScale: number;
  strokeWidth: number;
  paddingX: number;
  paddingY: number;
}

export function promptAcquisitionVisualState(
  input: PromptAcquisitionVisualInput = {}
): PromptAcquisitionVisualState {
  const compact = input.compact ?? false;
  const elapsedMs = input.elapsedMs === undefined
    ? 0
    : Number.isFinite(input.elapsedMs)
      ? Math.max(0, input.elapsedMs ?? 0)
      : PROMPT_ACQUISITION_MS;
  const durationMs = Number.isFinite(input.durationMs)
    ? Math.max(1, input.durationMs ?? PROMPT_ACQUISITION_MS)
    : PROMPT_ACQUISITION_MS;
  const progress = Math.max(0, Math.min(1, elapsedMs / durationMs));
  const active = elapsedMs < durationMs;
  const attack = Math.min(1, progress / 0.22);
  const decay = Math.pow(1 - progress, 1.65);

  if (!active) {
    return {
      active: false,
      progress: 1,
      labelText: promptAcquisitionLabel(input.tutorialMode ?? false),
      labelAlpha: 0,
      frameAlpha: 0,
      sweepAlpha: 0,
      sweepScale: 1,
      strokeWidth: compact ? 1.5 : 2,
      paddingX: compact ? 14 : 20,
      paddingY: compact ? 11 : 14
    };
  }

  return {
    active,
    progress,
    labelText: promptAcquisitionLabel(input.tutorialMode ?? false),
    labelAlpha: Math.min(0.9, attack * decay * 0.92),
    frameAlpha: Math.min(0.8, (0.16 + attack * 0.62) * decay),
    sweepAlpha: Math.min(0.72, (0.18 + attack * 0.54) * decay),
    sweepScale: 0.2 + (1 - Math.pow(1 - progress, 3)) * 0.8,
    strokeWidth: compact ? 1.5 : 2,
    paddingX: compact ? 14 : 20,
    paddingY: compact ? 11 : 14
  };
}

function promptAcquisitionLabel(tutorialMode: boolean): string {
  return tutorialMode ? "TUTORIAL LIVE" : "ROUTE LIVE";
}
