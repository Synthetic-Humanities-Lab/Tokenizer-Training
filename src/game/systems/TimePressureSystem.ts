export interface TimeWarningInput {
  tutorialMode: boolean;
  resolving: boolean;
  warningPlayed: boolean;
  timeRemainingMs: number;
  thresholdMs?: number;
}

export interface TimerPressureVisualInput {
  tutorialMode: boolean;
  resolving: boolean;
  paused?: boolean;
  timeRemainingMs: number;
  durationMs: number;
  timeMs?: number;
  thresholdMs?: number;
}

export interface TimerPressureVisualState {
  ratio: number;
  warningActive: boolean;
  warningIntensity: number;
  pulseStrength: number;
  fillAlpha: number;
  height: number;
  laneAlpha: number;
  laneStrokeWidth: number;
  laneHighlightAlpha: number;
  deadlineGateAlpha: number;
  deadlineGateInsetRatio: number;
  deadlineGateStrokeWidth: number;
}

export const DEFAULT_TIME_WARNING_THRESHOLD_MS = 2000;
export const TIME_WARNING_PULSE_MS = 520;

export function shouldPlayTimeWarning(input: TimeWarningInput): boolean {
  const thresholdMs = input.thresholdMs ?? DEFAULT_TIME_WARNING_THRESHOLD_MS;

  return !input.tutorialMode &&
    !input.resolving &&
    !input.warningPlayed &&
    input.timeRemainingMs > 0 &&
    input.timeRemainingMs <= thresholdMs;
}

export function timerPressureVisualState(input: TimerPressureVisualInput): TimerPressureVisualState {
  const ratio = normalizedTimeRatio(input.timeRemainingMs, input.durationMs);
  const thresholdMs = input.thresholdMs ?? DEFAULT_TIME_WARNING_THRESHOLD_MS;
  const warningActive = !input.tutorialMode &&
    !input.resolving &&
    !input.paused &&
    input.timeRemainingMs > 0 &&
    input.timeRemainingMs <= thresholdMs;
  const urgency = warningActive
    ? 0.35 + 0.65 * (1 - Math.max(0, Math.min(1, input.timeRemainingMs / thresholdMs)))
    : 0;
  const phase = ((Number.isFinite(input.timeMs) ? input.timeMs ?? 0 : 0) % TIME_WARNING_PULSE_MS) / TIME_WARNING_PULSE_MS;
  const pulseStrength = warningActive ? 0.5 + 0.5 * Math.sin(phase * Math.PI * 2) : 0;

  return {
    ratio,
    warningActive,
    warningIntensity: urgency,
    pulseStrength,
    fillAlpha: input.resolving || input.paused ? 0.62 : warningActive ? 0.78 + pulseStrength * 0.2 : 1,
    height: warningActive ? 8 + Math.round((urgency * 1.8 + pulseStrength * 1.2) * 10) / 10 : 8,
    laneAlpha: warningActive ? 0.16 + urgency * 0.18 + pulseStrength * 0.12 : 0,
    laneStrokeWidth: warningActive ? 1.4 + urgency * 0.9 : 0,
    laneHighlightAlpha: warningActive ? 0.1 + pulseStrength * 0.12 : 0,
    deadlineGateAlpha: warningActive ? 0.18 + urgency * 0.28 + pulseStrength * 0.12 : 0,
    deadlineGateInsetRatio: warningActive ? 0.055 + urgency * 0.085 + pulseStrength * 0.018 : 0,
    deadlineGateStrokeWidth: warningActive ? 1.3 + urgency * 1.2 : 0
  };
}

function normalizedTimeRatio(timeRemainingMs: number, durationMs: number): number {
  if (!Number.isFinite(timeRemainingMs) || !Number.isFinite(durationMs) || durationMs <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, timeRemainingMs / durationMs));
}
