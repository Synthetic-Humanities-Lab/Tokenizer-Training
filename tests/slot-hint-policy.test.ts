import { describe, expect, it } from "vitest";
import {
  playableSlotHintVisualStyle,
  shouldShowPlayableSlotHints
} from "../src/game/systems/SlotHintPolicySystem";

describe("shouldShowPlayableSlotHints", () => {
  it("keeps tutorial cut-slot affordances explicit unless a round opts out", () => {
    expect(shouldShowPlayableSlotHints({
      tutorialMode: true,
      round: 5
    })).toBe(true);
    expect(shouldShowPlayableSlotHints({
      tutorialMode: true,
      round: 5,
      tutorialShowSlotHints: false
    })).toBe(false);
  });

  it("shows early endless slot hints, then removes scaffolding for challenge", () => {
    expect(shouldShowPlayableSlotHints({
      tutorialMode: false,
      round: 1
    })).toBe(true);
    expect(shouldShowPlayableSlotHints({
      tutorialMode: false,
      round: 3
    })).toBe(true);
    expect(shouldShowPlayableSlotHints({
      tutorialMode: false,
      round: 4
    })).toBe(false);
  });
});

describe("playableSlotHintVisualStyle", () => {
  it("keeps legal slot hints subordinate to tutorial target hints and staged cuts", () => {
    const beforeCut = playableSlotHintVisualStyle({
      tutorialMode: true,
      targetHintsVisible: true,
      stagedCutCount: 0,
      compact: true
    });
    const afterCut = playableSlotHintVisualStyle({
      tutorialMode: true,
      targetHintsVisible: true,
      stagedCutCount: 1,
      compact: true
    });

    expect(beforeCut.alpha).toBeLessThan(0.4);
    expect(beforeCut.lineWidth).toBeLessThan(2);
    expect(afterCut.alpha).toBeLessThan(beforeCut.alpha);
  });

  it("keeps unguided tutorial and early endless scaffolding visible but restrained", () => {
    const tutorial = playableSlotHintVisualStyle({
      tutorialMode: true,
      targetHintsVisible: false,
      stagedCutCount: 0,
      compact: false
    });
    const endless = playableSlotHintVisualStyle({
      tutorialMode: false,
      targetHintsVisible: false,
      stagedCutCount: 0,
      compact: false
    });
    const compact = playableSlotHintVisualStyle({
      tutorialMode: false,
      targetHintsVisible: false,
      stagedCutCount: 0,
      compact: true
    });

    expect(tutorial.alpha).toBeGreaterThan(endless.alpha);
    expect(tutorial.alpha).toBeLessThan(0.5);
    expect(endless.alpha).toBeLessThanOrEqual(0.22);
    expect(compact.lineWidth).toBeLessThanOrEqual(endless.lineWidth);
  });
});
