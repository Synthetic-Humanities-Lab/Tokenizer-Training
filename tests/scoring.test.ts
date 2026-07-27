import { describe, expect, it } from "vitest";
import {
  exactTokenIndexes,
  ScoringSystem,
  STARTING_TOKEN_CREDITS
} from "../src/game/systems/ScoringSystem";

describe("ScoringSystem", () => {
  it("awards one Token Credit for every intact tokenizer token", () => {
    const score = new ScoringSystem().scoreRound({
      truth: [3, 7, 11],
      guesses: [3, 7, 11],
      difficultyWeight: 1
    });

    expect(score.correctCuts).toEqual([3, 7, 11]);
    expect(score.missedCuts).toEqual([]);
    expect(score.falseCuts).toEqual([]);
    expect(score.accuracy).toBe(1);
    expect(score.verifiedTokenIndexes).toEqual([0, 1, 2, 3]);
    expect(score.reworkTokenIndexes).toEqual([]);
    expect(score.verifiedCredits).toBe(4);
    expect(score.reworkCredits).toBe(0);
    expect(score.creditDelta).toBe(4);
  });

  it("charges rework for damaged tokens and invented fragments", () => {
    const score = new ScoringSystem().scoreRound({
      truth: [2, 4, 6],
      guesses: [2, 5],
      difficultyWeight: 1.4
    });

    expect(score.correctCuts).toEqual([2]);
    expect(score.missedCuts).toEqual([4, 6]);
    expect(score.falseCuts).toEqual([5]);
    expect(score.verifiedTokenIndexes).toEqual([0]);
    expect(score.reworkTokenIndexes).toEqual([1, 2, 3]);
    expect(score.verifiedCredits).toBe(1);
    expect(score.reworkCredits).toBe(6);
    expect(score.creditDelta).toBe(-5);
  });

  it("counts false cuts against boundary accuracy", () => {
    const score = new ScoringSystem().scoreRound({
      truth: [2, 4, 6, 8, 10],
      guesses: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      difficultyWeight: 1
    });

    expect(score.correctCuts).toHaveLength(5);
    expect(score.missedCuts).toHaveLength(0);
    expect(score.falseCuts).toHaveLength(11);
    expect(score.accuracy).toBeCloseTo(5 / 16, 6);
    expect(score.creditDelta).toBeLessThan(0);
  });

  it("awards no credits when every required boundary is missed", () => {
    const score = new ScoringSystem().scoreRound({
      truth: [2, 4, 6],
      guesses: [],
      difficultyWeight: 1.2
    });

    expect(score.verifiedCredits).toBe(0);
    expect(score.reworkTokenIndexes).toEqual([0, 1, 2, 3]);
    expect(score.reworkCredits).toBe(5);
    expect(score.creditDelta).toBe(-5);
  });

  it("deduplicates repeated guesses before scoring", () => {
    const score = new ScoringSystem().scoreRound({
      truth: [1, 3],
      guesses: [3, 3, 1, 1],
      difficultyWeight: 1
    });

    expect(score.correctCuts).toEqual([1, 3]);
    expect(score.falseCuts).toEqual([]);
    expect(score.verifiedCredits).toBe(3);
  });

  it("invalidates both tokens joined by a missed boundary", () => {
    expect(exactTokenIndexes([2, 4, 6, 8, 10], [2, 4, 6, 8])).toEqual([0, 1, 2, 3]);
  });

  it("invalidates the token split by a false cut", () => {
    expect(exactTokenIndexes([2, 6], [2, 4, 6])).toEqual([0, 2]);
  });

  it("escalates rework liability without inflating verified credits", () => {
    const scoring = new ScoringSystem();
    const base = scoring.scoreRound({
      truth: [2, 4, 6],
      guesses: [2, 4],
      difficultyWeight: 1.3,
      penaltyScale: 1
    });
    const escalated = scoring.scoreRound({
      truth: [2, 4, 6],
      guesses: [2, 4],
      difficultyWeight: 1.3,
      penaltyScale: 3
    });

    expect(escalated.verifiedCredits).toBe(base.verifiedCredits);
    expect(escalated.reworkCredits).toBeGreaterThan(base.reworkCredits);
    expect(escalated.creditDelta).toBeLessThan(base.creditDelta);
  });

  it("starts a production run with a visible forty-credit buffer", () => {
    expect(STARTING_TOKEN_CREDITS).toBe(40);
  });
});
