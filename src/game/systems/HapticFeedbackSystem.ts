import type { PlaytestInputModality } from "./InputModalitySystem";

export type HapticFeedbackCue = "cut" | "confirm" | "clear" | "miss" | "warning";
export type HapticPattern = number | number[];
export type HapticFeedbackRoute = "native" | "browser" | "unavailable";

export interface NativeHapticFeedbackMessage {
  cue: HapticFeedbackCue;
  repeats: number;
}

export interface HapticNavigatorLike {
  vibrate?: (pattern: HapticPattern) => boolean;
}

export interface NativeHapticMessageHandlerLike {
  postMessage: (message: NativeHapticFeedbackMessage) => void;
}

export interface HapticFeedbackEnvironment {
  navigator?: HapticNavigatorLike;
  native?: {
    available: boolean;
    handler?: NativeHapticMessageHandlerLike;
  };
}

export interface HapticFeedbackCapability {
  available: boolean;
  route: HapticFeedbackRoute;
}

export const hapticFeedbackPatterns: Record<HapticFeedbackCue, HapticPattern> = {
  cut: 12,
  confirm: 8,
  clear: [6, 14, 6],
  miss: [10, 18, 10],
  warning: [8, 22, 8]
};

export const MAX_CUT_CONFIRMATION_HAPTIC_PULSES = 4;
export const NATIVE_HAPTIC_MESSAGE_HANDLER_NAME = "tokenizerTrainingHaptics";

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
    private readonly environment: HapticFeedbackEnvironment = defaultHapticFeedbackEnvironment()
  ) {}

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(value: boolean): void {
    this.muted = value;
  }

  canPlay(modality: PlaytestInputModality): boolean {
    return !this.muted
      && hapticModalityCanPlay(modality)
      && hapticFeedbackCapability(this.environment).available;
  }

  play(cue: HapticFeedbackCue, modality: PlaytestInputModality): boolean {
    if (!this.canPlay(modality)) {
      return false;
    }

    return this.playNative(cue, 1) || this.playBrowser(hapticFeedbackPatterns[cue]);
  }

  playCutBurst(cutCount: number, modality: PlaytestInputModality): boolean {
    const repeats = limitedPulseCount(cutCount, MAX_CUT_CONFIRMATION_HAPTIC_PULSES);
    const pattern = cutConfirmationHapticPattern(cutCount);
    if (repeats <= 0 || !pattern || !this.canPlay(modality)) {
      return false;
    }

    return this.playNative("cut", repeats) || this.playBrowser(pattern);
  }

  private playNative(cue: HapticFeedbackCue, repeats: number): boolean {
    const native = this.environment.native;
    if (!native?.available || typeof native.handler?.postMessage !== "function") {
      return false;
    }

    try {
      native.handler.postMessage({ cue, repeats });
      return true;
    } catch {
      return false;
    }
  }

  private playBrowser(pattern: HapticPattern): boolean {
    try {
      return this.environment.navigator?.vibrate?.(pattern) === true;
    } catch {
      return false;
    }
  }
}

export function hapticFeedbackCapability(
  environment: HapticFeedbackEnvironment = defaultHapticFeedbackEnvironment()
): HapticFeedbackCapability {
  if (environment.native?.available && typeof environment.native.handler?.postMessage === "function") {
    return { available: true, route: "native" };
  }

  if (typeof environment.navigator?.vibrate === "function") {
    return { available: true, route: "browser" };
  }

  return { available: false, route: "unavailable" };
}

export function hapticFeedbackCapabilityLabel(capability: HapticFeedbackCapability): string {
  return capability.available ? "Haptics: Available" : "Haptics: Unavailable";
}

function defaultHapticFeedbackEnvironment(): HapticFeedbackEnvironment {
  const runtime = globalThis as unknown as {
    navigator?: HapticNavigatorLike;
    webkit?: {
      messageHandlers?: Record<string, NativeHapticMessageHandlerLike | undefined>;
    };
    __TOKENIZER_TRAINING_NATIVE_CAPABILITIES__?: {
      haptics?: boolean;
    };
  };

  return {
    navigator: runtime.navigator,
    native: {
      available: runtime.__TOKENIZER_TRAINING_NATIVE_CAPABILITIES__?.haptics === true,
      handler: runtime.webkit?.messageHandlers?.[NATIVE_HAPTIC_MESSAGE_HANDLER_NAME]
    }
  };
}

function limitedPulseCount(value: number, limit: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(limit, Math.max(1, Math.floor(value)));
}
