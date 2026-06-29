import { describe, expect, it } from "vitest";
import { ScoringSystem } from "../src/game/systems/ScoringSystem";

describe("ScoringSystem", () => {
  it("pays clean segmentation without company cost", () => {
    const score = new ScoringSystem().scoreRound({
      truth: [3, 7, 11],
      guesses: [3, 7, 11],
      tier: 1,
      difficultyWeight: 1,
      tokenCount: 4,
      timeRemainingRatio: 0.5
    });

    expect(score.correctCuts).toEqual([3, 7, 11]);
    expect(score.missedCuts).toEqual([]);
    expect(score.falseCuts).toEqual([]);
    expect(score.accuracy).toBe(1);
    expect(score.pay).toBeGreaterThan(0);
    expect(score.companyCost).toBe(0);
    expect(score.net).toBe(score.pay);
  });

  it("charges missed and false cuts separately", () => {
    const score = new ScoringSystem().scoreRound({
      truth: [2, 4, 6],
      guesses: [2, 5],
      tier: 3,
      difficultyWeight: 1.4,
      tokenCount: 8
    });

    expect(score.correctCuts).toEqual([2]);
    expect(score.missedCuts).toEqual([4, 6]);
    expect(score.falseCuts).toEqual([5]);
    expect(score.companyCost).toBeGreaterThan(score.pay / 2);
    expect(score.net).toBeCloseTo(score.pay - score.companyCost, 2);
  });

  it("does not pay when every required boundary is missed", () => {
    const score = new ScoringSystem().scoreRound({
      truth: [2, 4, 6],
      guesses: [],
      tier: 2,
      difficultyWeight: 1.2,
      tokenCount: 6
    });

    expect(score.correctCuts).toEqual([]);
    expect(score.missedCuts).toEqual([2, 4, 6]);
    expect(score.pay).toBe(0);
    expect(score.companyCost).toBeGreaterThan(0);
    expect(score.net).toBeLessThan(0);
  });

  it("deduplicates repeated guesses before scoring", () => {
    const score = new ScoringSystem().scoreRound({
      truth: [1, 3],
      guesses: [3, 3, 1, 1],
      tier: 1,
      difficultyWeight: 1,
      tokenCount: 3
    });

    expect(score.correctCuts).toEqual([1, 3]);
    expect(score.falseCuts).toEqual([]);
  });
});
