export interface SlotHintPolicyInput {
  tutorialMode: boolean;
  round: number;
  tutorialShowSlotHints?: boolean;
}

export interface PlayableSlotHintVisualInput {
  tutorialMode: boolean;
  targetHintsVisible: boolean;
  stagedCutCount: number;
  compact: boolean;
}

export interface PlayableSlotHintVisualStyle {
  lineWidth: number;
  alpha: number;
}

export interface TutorialTargetHintVisualStyle {
  lineWidth: number;
  alpha: number;
  dashLength: number;
  gapLength: number;
  capRadius: number;
}

export interface TutorialSwipeCuePolicyInput {
  tutorialMode: boolean;
  targetHintsVisible: boolean;
  tutorialShowSwipeCue?: boolean;
  dismissed: boolean;
  resolving: boolean;
}

export interface TutorialSwipeCueVisualState {
  progress: number;
  alpha: number;
}

export function shouldShowPlayableSlotHints(input: SlotHintPolicyInput): boolean {
  if (input.tutorialMode) {
    return input.tutorialShowSlotHints ?? true;
  }

  return Math.max(1, Math.floor(input.round)) <= 3;
}

export function playableSlotHintVisualStyle(input: PlayableSlotHintVisualInput): PlayableSlotHintVisualStyle {
  const baseAlpha = input.tutorialMode
    ? input.targetHintsVisible ? 0.34 : 0.42
    : 0.22;
  const stagedFade = Math.max(0, Math.floor(input.stagedCutCount)) > 0 ? 0.72 : 1;

  return {
    lineWidth: input.compact ? 1.25 : 1.5,
    alpha: Math.max(0.14, baseAlpha * stagedFade)
  };
}

export function tutorialTargetHintVisualStyle(compact: boolean): TutorialTargetHintVisualStyle {
  return {
    lineWidth: compact ? 2.5 : 3,
    alpha: 0.9,
    dashLength: compact ? 7 : 9,
    gapLength: compact ? 5 : 6,
    capRadius: compact ? 2.5 : 3
  };
}

export function shouldShowTutorialSwipeCue(input: TutorialSwipeCuePolicyInput): boolean {
  return (
    input.tutorialMode
    && input.targetHintsVisible
    && input.tutorialShowSwipeCue === true
    && !input.dismissed
    && !input.resolving
  );
}

export function tutorialSwipeCueVisualState(
  elapsedMs: number,
  reducedMotion: boolean
): TutorialSwipeCueVisualState {
  if (reducedMotion) {
    return {
      progress: 0.24,
      alpha: 0.9
    };
  }

  const durationMs = 1600;
  const cycle = ((Math.max(0, elapsedMs) % durationMs) + durationMs) % durationMs / durationMs;
  const travelEnd = 0.72;
  const progress = cycle < travelEnd ? cycle / travelEnd : 1;
  const alpha = cycle < travelEnd ? 0.94 : Math.max(0, 0.94 * (1 - (cycle - travelEnd) / (1 - travelEnd)));

  return { progress, alpha };
}
