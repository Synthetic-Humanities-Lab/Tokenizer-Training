export type DifficultyPhase = "plain-language" | "punctuation" | "machine-text" | "edge-cases";

export interface DifficultyState {
  round: number;
  tierCap: number;
  roundDurationMs: number;
  penaltyScale: number;
  phase: DifficultyPhase;
  contentFocus: string;
  label: string;
}

export interface DifficultyWorkload {
  boundaryCount: number;
  tokenCount: number;
  textLength: number;
}

export const ENDLESS_START_DURATION_MS = 10000;
export const ENDLESS_MIN_DURATION_MS = 1800;
export const ENDLESS_ROUND_TIME_MULTIPLIER = 0.935;
export const ENDLESS_MIN_WORKLOAD_FACTOR = 0.85;
export const ENDLESS_MAX_WORKLOAD_FACTOR = 1.4;
const DURATION_STEP_MS = 50;

export class DifficultySystem {
  getState(round: number): DifficultyState {
    const normalizedRound = Math.max(1, Math.floor(round));
    const tierCap = this.tierCapForRound(normalizedRound);
    const roundDurationMs = this.roundDurationForRound(normalizedRound);
    const penaltyScale = Number((1 + (normalizedRound - 1) * 0.035).toFixed(3));
    const curriculum = curriculumForTier(tierCap);

    return {
      round: normalizedRound,
      tierCap,
      roundDurationMs,
      penaltyScale,
      phase: curriculum.phase,
      contentFocus: curriculum.contentFocus,
      label: `Tier ${tierCap} // ${curriculum.contentFocus}`
    };
  }

  applyWorkload(state: DifficultyState, workload: DifficultyWorkload): DifficultyState {
    return {
      ...state,
      roundDurationMs: workloadAdjustedRoundDurationMs(state.roundDurationMs, workload)
    };
  }

  private roundDurationForRound(round: number): number {
    const accelerated = ENDLESS_START_DURATION_MS * Math.pow(ENDLESS_ROUND_TIME_MULTIPLIER, round - 1);
    const stepped = Math.round(accelerated / DURATION_STEP_MS) * DURATION_STEP_MS;
    return Math.max(ENDLESS_MIN_DURATION_MS, stepped);
  }

  private tierCapForRound(round: number): number {
    if (round >= 13) return 4;
    if (round >= 8) return 3;
    if (round >= 4) return 2;
    return 1;
  }
}

export function difficultyPhaseAnnouncement(phase: DifficultyPhase): string {
  switch (phase) {
    case "punctuation":
      return "Punctuation queue opened: numbers and informal traffic. People kept typing.";
    case "machine-text":
      return "Machine-text queue: code, URLs, and commands. The systems left paperwork.";
    case "edge-cases":
      return "Full queue released: multilingual spacing and symbols included. Speed will not negotiate.";
    default:
      return "Plain-language queue open. Familiar words are not a guarantee of familiar tokens.";
  }
}

export function workloadAdjustedRoundDurationMs(
  baseDurationMs: number,
  workload: DifficultyWorkload
): number {
  const boundaryCount = normalizedCount(workload.boundaryCount);
  const tokenCount = normalizedCount(workload.tokenCount);
  const textLength = normalizedCount(workload.textLength);
  const boundaryAdjustment = (boundaryCount - 3) * 0.1;
  const tokenAdjustment = clamp((tokenCount - 4) * 0.025, -0.05, 0.075);
  const lengthAdjustment = clamp((textLength - 18) * 0.008, -0.06, 0.12);
  const workloadFactor = clamp(
    1 + boundaryAdjustment + tokenAdjustment + lengthAdjustment,
    ENDLESS_MIN_WORKLOAD_FACTOR,
    ENDLESS_MAX_WORKLOAD_FACTOR
  );
  const adjusted = Math.round((Math.max(0, baseDurationMs) * workloadFactor) / DURATION_STEP_MS) * DURATION_STEP_MS;

  return clamp(adjusted, ENDLESS_MIN_DURATION_MS, ENDLESS_START_DURATION_MS);
}

function normalizedCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function curriculumForTier(tier: number): Pick<DifficultyState, "phase" | "contentFocus"> {
  if (tier >= 4) {
    return { phase: "edge-cases", contentFocus: "full queue with edge cases" };
  }
  if (tier === 3) {
    return { phase: "machine-text", contentFocus: "URLs, code, and identifiers" };
  }
  if (tier === 2) {
    return { phase: "punctuation", contentFocus: "punctuation and numbers" };
  }
  return { phase: "plain-language", contentFocus: "word-like chunks" };
}
