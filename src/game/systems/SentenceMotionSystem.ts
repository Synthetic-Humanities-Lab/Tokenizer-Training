export interface SentenceMotionConfig {
  startY: number;
  endY: number;
  durationMs: number;
  startedAtMs: number;
  paused: boolean;
}

export interface SentenceMotionState extends SentenceMotionConfig {
  pausedAtMs?: number;
  accumulatedPauseMs: number;
}

export class SentenceMotionSystem {
  create(config: SentenceMotionConfig): SentenceMotionState {
    return {
      ...config,
      accumulatedPauseMs: 0,
      pausedAtMs: config.paused ? config.startedAtMs : undefined
    };
  }

  pause(state: SentenceMotionState, nowMs: number): SentenceMotionState {
    if (state.paused) {
      return state;
    }

    return {
      ...state,
      paused: true,
      pausedAtMs: nowMs
    };
  }

  resume(state: SentenceMotionState, nowMs: number): SentenceMotionState {
    if (!state.paused) {
      return state;
    }

    const pauseStartedAt = state.pausedAtMs ?? nowMs;
    return {
      ...state,
      paused: false,
      pausedAtMs: undefined,
      accumulatedPauseMs: state.accumulatedPauseMs + Math.max(0, nowMs - pauseStartedAt)
    };
  }

  positionAt(state: SentenceMotionState, nowMs: number): number {
    const elapsed = this.elapsedActiveMs(state, nowMs);
    const progress = state.durationMs <= 0 ? 1 : elapsed / state.durationMs;
    return lerp(state.startY, state.endY, progress);
  }

  elapsedActiveMs(state: SentenceMotionState, nowMs: number): number {
    const effectiveNow = state.paused ? state.pausedAtMs ?? nowMs : nowMs;
    return Math.max(0, effectiveNow - state.startedAtMs - state.accumulatedPauseMs);
  }

  remainingActiveMs(state: SentenceMotionState, nowMs: number): number {
    return Math.max(0, state.durationMs - this.elapsedActiveMs(state, nowMs));
  }

  isComplete(state: SentenceMotionState, nowMs: number): boolean {
    return this.elapsedActiveMs(state, nowMs) >= state.durationMs;
  }

  timeToPosition(state: SentenceMotionState, targetY: number): number {
    const travel = state.endY - state.startY;
    if (travel === 0 || state.durationMs <= 0) {
      return 0;
    }

    const progress = (targetY - state.startY) / travel;
    return state.durationMs * Math.max(0, Math.min(1, progress));
  }
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * Math.max(0, Math.min(1, progress));
}
