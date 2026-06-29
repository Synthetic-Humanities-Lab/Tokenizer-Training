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
