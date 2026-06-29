import type { PlaytestInputModality } from "./InputModalitySystem";

export type HapticFeedbackCue = "cut" | "confirm" | "clear" | "miss" | "warning";
export type HapticPattern = number | number[];

export interface HapticNavigatorLike {
  vibrate?: (pattern: HapticPattern) => boolean;
}

export const hapticFeedbackPatterns: Record<HapticFeedbackCue, HapticPattern> = {
  cut: 12,
  confirm: 8,
  clear: [6, 14, 6],
  miss: [10, 18, 10],
  warning: [8, 22, 8]
};

export const MAX_CUT_CONFIRMATION_HAPTIC_PULSES = 4;

export function hapticModalityCanPlay(modality: PlaytestInputModality): boolean {
  return modality === "touch" || modality === "pen" || modality === "mixed";
}

export function cutConfirmationHapticPattern(cutCount: number): HapticPattern | null {
  const count = limitedPulseCount(cutCount, MAX_CUT_CONFIRMATION_HAPTIC_PULSES);
  if (count <= 0) {
    return null;
  }

  if (count === 1) {
    return hapticFeedbackPatterns.cut;
  }

  return Array.from({ length: count * 2 - 1 }, (_, index) => index % 2 === 0 ? 7 : 12);
}

export class HapticFeedbackSystem {
  constructor(
    private muted = false,
    private readonly navigatorRef: HapticNavigatorLike | undefined = defaultHapticNavigator()
  ) {}

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(value: boolean): void {
    this.muted = value;
  }

  canPlay(modality: PlaytestInputModality): boolean {
    return !this.muted && hapticModalityCanPlay(modality) && typeof this.navigatorRef?.vibrate === "function";
  }

  play(cue: HapticFeedbackCue, modality: PlaytestInputModality): boolean {
    if (!this.canPlay(modality)) {
      return false;
    }

    try {
      return this.navigatorRef?.vibrate?.(hapticFeedbackPatterns[cue]) === true;
    } catch {
      return false;
    }
  }

  playCutBurst(cutCount: number, modality: PlaytestInputModality): boolean {
    const pattern = cutConfirmationHapticPattern(cutCount);
    if (!pattern || !this.canPlay(modality)) {
      return false;
    }

    try {
      return this.navigatorRef?.vibrate?.(pattern) === true;
    } catch {
      return false;
    }
  }
}

function defaultHapticNavigator(): HapticNavigatorLike | undefined {
  return (globalThis as typeof globalThis & { navigator?: HapticNavigatorLike }).navigator;
}

function limitedPulseCount(value: number, limit: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(limit, Math.max(1, Math.floor(value)));
}
