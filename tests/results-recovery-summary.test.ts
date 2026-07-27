import { describe, expect, it, vi } from "vitest";

vi.mock("phaser", () => ({
  default: { Scene: class MockScene {} }
}));

import { resultsRecoveryCue } from "../src/game/scenes/ResultsScene";

describe("resultsRecoveryCue", () => {
  it.each([
    ["budget", 3, 1, "Review the Token Log to learn which boundaries you missed before retraining."],
    ["quit", 1, 3, "Review the Token Log to learn which cuts were false before resuming."],
    ["budget", 2, 2, "Review the Token Log to learn from both error types before retraining."],
    ["quit", 0, 0, "Review the Token Log to confirm the clean route before resuming."]
  ] as const)("gives a distinct actionable cue for %s and the dominant audit issue", (outcome, missed, falseCuts, expected) => {
    expect(resultsRecoveryCue({ outcome, totalMissedCuts: missed, totalFalseCuts: falseCuts })).toBe(expected);
  });

  it("normalizes invalid cut totals without losing the recovery destination", () => {
    expect(resultsRecoveryCue({
      outcome: "budget",
      totalMissedCuts: Number.NaN,
      totalFalseCuts: -2
    })).toContain("Review the Token Log to confirm the clean route");
  });
});
