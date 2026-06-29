export type WienerReactionKind = "cut" | "clean" | "error";
export const WIENER_CUT_REACTION_MS = 118;

export interface WienerReactionPlan {
  kind: WienerReactionKind;
  angle: number;
  xOffset: number;
  scaleX: number;
  scaleY: number;
  durationMs: number;
  yoyo: boolean;
  repeat: number;
  ease: string;
}

export interface WienerResolveReactionInput {
  missedCuts: number;
  falseCuts: number;
}

export function wienerCutReaction(addedCutCount: number): WienerReactionPlan | null {
  if (!Number.isFinite(addedCutCount) || addedCutCount <= 0) {
    return null;
  }

  return {
    kind: "cut",
    angle: -5,
    xOffset: 0,
    scaleX: 1.08,
    scaleY: 0.93,
    durationMs: WIENER_CUT_REACTION_MS,
    yoyo: true,
    repeat: 0,
    ease: "Sine.easeOut"
  };
}

export function wienerResolveReaction(input: WienerResolveReactionInput): WienerReactionPlan {
  const errorCount = Math.max(0, Math.floor(input.missedCuts)) + Math.max(0, Math.floor(input.falseCuts));

  if (errorCount === 0) {
    return {
      kind: "clean",
      angle: 5,
      xOffset: 0,
      scaleX: 0.97,
      scaleY: 1.04,
      durationMs: 140,
      yoyo: true,
      repeat: 1,
      ease: "Sine.easeInOut"
    };
  }

  return {
    kind: "error",
    angle: -6,
    xOffset: -7,
    scaleX: 1.05,
    scaleY: 0.96,
    durationMs: 74,
    yoyo: true,
    repeat: Math.min(3, 1 + errorCount),
    ease: "Sine.easeInOut"
  };
}
