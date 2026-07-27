import { describe, expect, it } from "vitest";
import {
  TUTORIAL_PASS_ACCURACY,
  tutorialCompleteCopy,
  tutorialCompletionStatus,
  tutorialPerformanceScore
} from "../src/game/systems/TutorialCompleteContentSystem";

describe("tutorialCompleteCopy", () => {
  it("frames a passed tutorial as a handoff into Training", () => {
    const copy = tutorialCompleteCopy();

    expect(copy.status).toBe("passed");
    expect(copy.chromePath).toBe("wienerworks://tutorial-cleared");
    expect(copy.title).toBe("Tutorial Cleared");
    expect(copy.title).not.toContain("Filed");
    expect(copy.title).not.toMatch(/\bfiled\b/i);
    expect(copy.summary).not.toMatch(/\bfiled\b/i);
    expect(copy.summary).toBe(
      "Qualification approved. WienerWorks permits you to begin Machine Replacement Training with a 40 TC account. Production speed remains theoretical."
    );
    expect(copy.primaryAction).toBe("Start Training");
    expect(copy.primaryAction).not.toMatch(/\bendless\b/i);
    expect(copy.secondaryAction).toBe("Return to Menu");
  });

  it("prioritizes missed cuts in a failed tutorial summary", () => {
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
      "Boundary accuracy: 20%. Readiness requires 70%. Focus: recover missed boundaries. Qualification denied. Payroll remains unconvinced."
    );
    expect(copy.summary).not.toContain(copy.primaryAction);
    expect(copy.primaryAction).toBe("Retry Tutorial");
    expect(copy.secondaryAction).toBe("Return to Menu");
  });

  it("prioritizes false cuts while preserving the cut-audit score formula", () => {
    const performance = {
      accuracy: 1,
      totalCorrectCuts: 5,
      totalMissedCuts: 0,
      totalFalseCuts: 4
    };

    expect(tutorialPerformanceScore(performance)).toBeCloseTo(5 / 9);
    expect(tutorialCompletionStatus(performance)).toBe("failed");
    expect(tutorialCompleteCopy(performance).summary).toBe(
      "Boundary accuracy: 55%. Readiness requires 70%. Focus: remove false cuts. Qualification denied. Payroll remains unconvinced."
    );
  });

  it("names missed and false cuts together when their counts tie", () => {
    const copy = tutorialCompleteCopy({
      totalCorrectCuts: 4,
      totalMissedCuts: 2,
      totalFalseCuts: 2
    });

    expect(copy.summary).toBe(
      "Boundary accuracy: 50%. Readiness requires 70%. Focus: missed boundaries and false cuts. Qualification denied. Payroll remains unconvinced."
    );
  });

  it("falls back to boundary evidence when only accuracy is available", () => {
    const copy = tutorialCompleteCopy({ accuracy: 0.4 });

    expect(copy.summary).toBe(
      "Boundary accuracy: 40%. Readiness requires 70%. Review the boundary evidence. Qualification denied. Payroll remains unconvinced."
    );
  });

  it("floors a failing cut-audit score instead of displaying 70 percent", () => {
    const performance = {
      accuracy: 1,
      totalCorrectCuts: 699,
      totalMissedCuts: 301,
      totalFalseCuts: 0
    };
    const copy = tutorialCompleteCopy(performance);

    expect(tutorialPerformanceScore(performance)).toBeCloseTo(0.699);
    expect(tutorialCompletionStatus(performance)).toBe("failed");
    expect(copy.summary).toBe(
      "Boundary accuracy: 69%. Readiness requires 70%. Focus: recover missed boundaries. Qualification denied. Payroll remains unconvinced."
    );
    expect(copy.summary).not.toContain("Boundary accuracy: 70%.");
  });
});
