import { describe, expect, it } from "vitest";
import {
  TUTORIAL_PASS_ACCURACY,
  tutorialCompleteCopy,
  tutorialCompletionStatus,
  tutorialPerformanceScore
} from "../src/game/systems/TutorialCompleteContentSystem";

describe("tutorialCompleteCopy", () => {
  it("frames a passed tutorial as a handoff into the paid Endless Training loop", () => {
    const copy = tutorialCompleteCopy();

    expect(copy.status).toBe("passed");
    expect(copy.chromePath).toBe("wienerworks://tutorial-cleared");
    expect(copy.title).toBe("Tutorial Cleared");
    expect(copy.title).not.toContain("Filed");
    expect(copy.title).not.toMatch(/\bfiled\b/i);
    expect(copy.summary).not.toMatch(/\bfiled\b/i);
    expect(copy.summary).toBe(
      "Training threshold met. WienerWorks now considers you safe enough for live cost exposure. This should not be confused with trust."
    );
    expect(copy.primaryAction).toBe("Start Endless Training");
    expect(copy.secondaryAction).toBe("Return to Menu");
  });

  it("fails weak tutorial performance and offers a retry path", () => {
    const copy = tutorialCompleteCopy({
      accuracy: TUTORIAL_PASS_ACCURACY - 0.01,
      totalCorrectCuts: 2,
      totalMissedCuts: 5,
      totalFalseCuts: 3
    });

    expect(tutorialCompletionStatus({ accuracy: TUTORIAL_PASS_ACCURACY })).toBe("passed");
    expect(tutorialCompletionStatus({ accuracy: TUTORIAL_PASS_ACCURACY - 0.01 })).toBe("failed");
    expect(copy.status).toBe("failed");
    expect(copy.chromePath).toBe("wienerworks://tutorial-failed");
    expect(copy.title).toBe("Tutorial Failed");
    expect(copy.title).not.toContain("Filed");
    expect(copy.title).not.toMatch(/\bfiled\b/i);
    expect(copy.summary).not.toMatch(/\bfiled\b/i);
    expect(copy.summary).toBe(
      "Boundary accuracy stayed below the readiness threshold. Retry the tutorial before the mistakes become payroll events. Wiener has preserved the evidence, unnecessarily well."
    );
    expect(copy.primaryAction).toBe("Retry Tutorial");
    expect(copy.secondaryAction).toBe("Return to Menu");
  });

  it("penalizes false tutorial cuts instead of passing on recall alone", () => {
    expect(tutorialPerformanceScore({
      accuracy: 1,
      totalCorrectCuts: 5,
      totalMissedCuts: 0,
      totalFalseCuts: 4
    })).toBeCloseTo(5 / 9);
    expect(tutorialCompletionStatus({
      accuracy: 1,
      totalCorrectCuts: 5,
      totalMissedCuts: 0,
      totalFalseCuts: 4
    })).toBe("failed");
    expect(tutorialCompleteCopy({
      accuracy: 1,
      totalCorrectCuts: 5,
      totalMissedCuts: 0,
      totalFalseCuts: 4
    }).primaryAction).toBe("Retry Tutorial");
  });
});
