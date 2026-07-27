export type AudioCue =
  | "cut"
  | "clear"
  | "resolve"
  | "good"
  | "bad"
  | "miss"
  | "falseCut"
  | "warning"
  | "ui";

export type CueMaterial = "paper" | "relay";

export interface CueShape {
  frequency: number;
  endFrequency?: number;
  durationMs: number;
  gain: number;
  type: OscillatorType;
  material: CueMaterial;
  attackMs: number;
  noiseGain: number;
  noiseDurationMs: number;
  filterFrequency: number;
  filterQ: number;
}

export interface CueEnvelope {
  durationSeconds: number;
  attackSeconds: number;
  noiseDurationSeconds: number;
  oscillatorGain: number;
  noiseGain: number;
}

export interface ScheduledAudioCue {
  cue: AudioCue;
  delayMs: number;
}

export interface NativeAudioMessageHandlerLike {
  postMessage: (message: { cue: AudioCue }) => void;
}

export const RESOLUTION_CUE_SPACING_MS = 56;
export const CUT_CONFIRMATION_CUE_SPACING_MS = 28;
export const MAX_CUT_CONFIRMATION_CUES = 4;
export const NATIVE_AUDIO_MESSAGE_HANDLER_NAME = "tokenizerTrainingAudio";

export const audioCueShapes: Record<AudioCue, CueShape> = {
  cut: paperCue(760, 180, 58, 0.0065, 0.012, 3400),
  clear: paperCue(350, 220, 82, 0.018, 0.006, 1500),
  resolve: relayCue(210, 270, 128, 0.024, 0.005, 1050),
  good: relayCue(470, 680, 118, 0.025, 0.006, 1850),
  bad: relayCue(205, 142, 150, 0.028, 0.008, 900),
  miss: paperCue(185, 128, 112, 0.024, 0.008, 1050),
  falseCut: paperCue(310, 230, 64, 0.022, 0.009, 1750),
  warning: relayCue(106, 90, 190, 0.03, 0.005, 620),
  ui: paperCue(440, 350, 46, 0.016, 0.005, 2200)
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

export function cueEnvelope(shape: CueShape): CueEnvelope {
  const durationSeconds = clamp(shape.durationMs / 1000, 0.024, 0.25);
  const attackSeconds = clamp(shape.attackMs / 1000, 0.002, Math.min(0.02, durationSeconds * 0.4));
  return {
    durationSeconds,
    attackSeconds,
    noiseDurationSeconds: clamp(shape.noiseDurationMs / 1000, 0.008, durationSeconds),
    oscillatorGain: clamp(shape.gain, 0.0001, 0.03),
    noiseGain: clamp(shape.noiseGain, 0, 0.012)
  };
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

    if (this.playNative(cue)) {
      return;
    }

    const context = this.getContext();
    if (!context) {
      return;
    }

    if (context.state !== "running") {
      try {
        void context.resume()
          .then(() => {
            if (!this.muted && context.state === "running") {
              this.playVoiceSafely(context, audioCueShapes[cue]);
            }
          })
          .catch(() => undefined);
      } catch {
        return;
      }
      return;
    }

    this.playVoiceSafely(context, audioCueShapes[cue]);
  }

  private playVoiceSafely(context: AudioContext, shape: CueShape): void {
    try {
      this.playVoice(context, shape);
    } catch {
      // Audio capability differs across embedded browsers; a failed cue must never block play.
    }
  }

  private playNative(cue: AudioCue): boolean {
    const runtime = globalThis as unknown as {
      webkit?: {
        messageHandlers?: Record<string, NativeAudioMessageHandlerLike | undefined>;
      };
    };
    const handler = runtime.webkit?.messageHandlers?.[NATIVE_AUDIO_MESSAGE_HANDLER_NAME];
    if (typeof handler?.postMessage !== "function") {
      return false;
    }

    try {
      handler.postMessage({ cue });
      return true;
    } catch {
      return false;
    }
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

    try {
      this.context = new AudioContext();
      return this.context;
    } catch {
      return null;
    }
  }

  private playVoice(context: AudioContext, shape: CueShape): void {
    const now = context.currentTime;
    const envelope = cueEnvelope(shape);
    const oscillator = context.createOscillator();
    const oscillatorGain = context.createGain();
    const noiseGain = context.createGain();
    const toneFilter = context.createBiquadFilter();
    const noiseFilter = context.createBiquadFilter();
    const noise = context.createBufferSource();

    oscillator.type = shape.type;
    oscillator.frequency.setValueAtTime(Math.max(40, shape.frequency), now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(40, shape.endFrequency ?? shape.frequency * 0.82),
      now + envelope.durationSeconds
    );
    toneFilter.type = "lowpass";
    toneFilter.frequency.setValueAtTime(
      shape.material === "paper"
        ? clamp(shape.filterFrequency * 0.55, 600, 3200)
        : clamp(shape.filterFrequency, 300, 4000),
      now
    );
    toneFilter.Q.setValueAtTime(clamp(shape.filterQ * 0.65, 0.25, 8), now);
    noiseFilter.type = shape.material === "paper" ? "bandpass" : "lowpass";
    noiseFilter.frequency.setValueAtTime(clamp(shape.filterFrequency, 300, 4000), now);
    noiseFilter.Q.setValueAtTime(clamp(shape.material === "paper" ? 0.72 : shape.filterQ, 0.25, 8), now);
    applyGainEnvelope(oscillatorGain.gain, envelope.oscillatorGain, now, envelope.durationSeconds, envelope.attackSeconds);
    applyGainEnvelope(noiseGain.gain, envelope.noiseGain, now, envelope.noiseDurationSeconds, Math.min(0.006, envelope.attackSeconds));

    noise.buffer = createNoiseBuffer(context, envelope.noiseDurationSeconds, shape.frequency);
    oscillator.connect(oscillatorGain);
    oscillatorGain.connect(toneFilter);
    noise.connect(noiseGain);
    noiseGain.connect(noiseFilter);
    toneFilter.connect(context.destination);
    noiseFilter.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + envelope.durationSeconds);
    noise.start(now);
    noise.stop(now + envelope.noiseDurationSeconds);
  }
}

function paperCue(
  frequency: number,
  endFrequency: number,
  durationMs: number,
  gain: number,
  noiseGain: number,
  filterFrequency: number
): CueShape {
  return {
    frequency,
    endFrequency,
    durationMs,
    gain,
    type: "triangle",
    material: "paper",
    attackMs: 2,
    noiseGain,
    noiseDurationMs: Math.min(26, durationMs),
    filterFrequency,
    filterQ: 0.9
  };
}

function relayCue(
  frequency: number,
  endFrequency: number,
  durationMs: number,
  gain: number,
  noiseGain: number,
  filterFrequency: number
): CueShape {
  return {
    frequency,
    endFrequency,
    durationMs,
    gain,
    type: "sine",
    material: "relay",
    attackMs: 7,
    noiseGain,
    noiseDurationMs: Math.min(34, durationMs),
    filterFrequency,
    filterQ: 0.7
  };
}

function applyGainEnvelope(
  gain: AudioParam,
  peak: number,
  now: number,
  durationSeconds: number,
  attackSeconds: number
): void {
  gain.setValueAtTime(0.0001, now);
  gain.linearRampToValueAtTime(peak, now + attackSeconds);
  gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);
}

function createNoiseBuffer(context: AudioContext, durationSeconds: number, seed: number): AudioBuffer {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  let state = (Math.floor(seed) >>> 0) || 1;
  for (let index = 0; index < data.length; index += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    data[index] = (state / 0xffffffff) * 2 - 1;
  }
  return buffer;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function limitedCueCount(value: number, limit: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.min(limit, Math.max(1, Math.floor(value)));
}
