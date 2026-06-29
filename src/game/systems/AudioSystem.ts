export type AudioCue = "cut" | "clear" | "resolve" | "good" | "bad" | "miss" | "falseCut" | "warning" | "ui";

export interface CueShape {
  frequency: number;
  endFrequency?: number;
  durationMs: number;
  gain: number;
  type: OscillatorType;
}

export interface ScheduledAudioCue {
  cue: AudioCue;
  delayMs: number;
}

export const RESOLUTION_CUE_SPACING_MS = 40;
export const CUT_CONFIRMATION_CUE_SPACING_MS = 24;
export const MAX_CUT_CONFIRMATION_CUES = 4;

export const audioCueShapes: Record<AudioCue, CueShape> = {
  cut: { frequency: 760, endFrequency: 420, durationMs: 42, gain: 0.018, type: "triangle" },
  clear: { frequency: 330, endFrequency: 210, durationMs: 92, gain: 0.018, type: "sine" },
  resolve: { frequency: 196, endFrequency: 262, durationMs: 160, gain: 0.026, type: "sine" },
  good: { frequency: 520, endFrequency: 740, durationMs: 132, gain: 0.024, type: "triangle" },
  bad: { frequency: 220, endFrequency: 148, durationMs: 170, gain: 0.028, type: "sine" },
  miss: { frequency: 164, endFrequency: 118, durationMs: 132, gain: 0.026, type: "triangle" },
  falseCut: { frequency: 330, endFrequency: 248, durationMs: 68, gain: 0.022, type: "triangle" },
  warning: { frequency: 112, endFrequency: 94, durationMs: 220, gain: 0.03, type: "sine" },
  ui: { frequency: 430, endFrequency: 360, durationMs: 46, gain: 0.016, type: "sine" }
};

export function scheduleAudioCues(
  cues: AudioCue[],
  spacingMs = RESOLUTION_CUE_SPACING_MS
): ScheduledAudioCue[] {
  return cues.map((cue, index) => ({
    cue,
    delayMs: Math.max(0, Math.floor(index * spacingMs))
  }));
}

export function cutConfirmationAudioCues(cutCount: number): AudioCue[] {
  const count = limitedCueCount(cutCount, MAX_CUT_CONFIRMATION_CUES);
  return Array.from({ length: count }, () => "cut");
}

export class AudioSystem {
  private context: AudioContext | null = null;
  private pendingTimeouts: ReturnType<typeof globalThis.setTimeout>[] = [];

  constructor(private muted = false) {}

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(value: boolean): void {
    this.muted = value;
  }

  toggleMuted(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  play(cue: AudioCue, delayMs = 0): void {
    if (this.muted) {
      return;
    }

    if (delayMs > 0) {
      const timeout = globalThis.setTimeout(() => {
        this.pendingTimeouts = this.pendingTimeouts.filter((pending) => pending !== timeout);
        this.play(cue);
      }, delayMs);
      this.pendingTimeouts.push(timeout);
      return;
    }

    const context = this.getContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume();
    }

    const shape = audioCueShapes[cue];
    const now = context.currentTime;
    const durationSeconds = shape.durationMs / 1000;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = shape.type;
    oscillator.frequency.setValueAtTime(shape.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(40, shape.endFrequency ?? shape.frequency * 0.82),
      now + durationSeconds
    );
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(shape.gain, now + Math.min(0.018, durationSeconds * 0.28));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds);
  }

  playSequence(cues: AudioCue[], spacingMs = RESOLUTION_CUE_SPACING_MS): void {
    for (const scheduled of scheduleAudioCues(cues, spacingMs)) {
      this.play(scheduled.cue, scheduled.delayMs);
    }
  }

  cancelPending(): void {
    for (const timeout of this.pendingTimeouts) {
      globalThis.clearTimeout(timeout);
    }
    this.pendingTimeouts = [];
  }

  private getContext(): AudioContext | null {
    if (this.context) {
      return this.context;
    }

    if (typeof AudioContext === "undefined") {
      return null;
    }

    this.context = new AudioContext();
    return this.context;
  }
}

function limitedCueCount(value: number, limit: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(limit, Math.max(1, Math.floor(value)));
}
