import { describe, expect, it } from "vitest";
import { ScoringSystem } from "../src/game/systems/ScoringSystem";
import { buildSubmittedCutTextPieces } from "../src/game/systems/TextSplitAnimationSystem";

describe("TextSplitAnimationSystem", () => {
  it("does not create falling prompt pieces when the player submitted no physical cuts", () => {
    const pieces = buildSubmittedCutTextPieces("openai.com", [], {
      left: 100,
      width: 300,
      centerY: 240
    });

    expect(pieces).toEqual([]);
  });

  it("splits falling text pieces only at submitted player cuts, including false cuts", () => {
    const pieces = buildSubmittedCutTextPieces("openai.com", [4, 6], {
      left: 100,
      width: 300,
      centerY: 240
    });

    expect(pieces.map((piece) => piece.text)).toEqual(["open", "ai", ".com"]);
    expect(pieces.map((piece) => piece.y)).toEqual([240, 240, 240]);
    expect(pieces[0].x).toBeLessThan(pieces[1].x);
    expect(pieces[1].x).toBeLessThan(pieces[2].x);
  });

  it("plans falling pieces as a physical split that drifts away from the submitted cuts", () => {
    const pieces = buildSubmittedCutTextPieces("openai.com", [4, 6], {
      left: 100,
      width: 300,
      centerY: 240
    });

    expect(pieces).toHaveLength(3);
    expect(pieces[0].fallXOffset).toBeLessThan(0);
    expect(pieces[2].fallXOffset).toBeGreaterThan(0);
    expect(Math.abs(pieces[0].fallXOffset)).toBeGreaterThan(Math.abs(pieces[1].fallXOffset));
    expect(Math.abs(pieces[2].fallXOffset)).toBeGreaterThan(Math.abs(pieces[1].fallXOffset));
    expect(pieces[0].rotationDeg).toBeLessThan(0);
    expect(pieces[2].rotationDeg).toBeGreaterThan(0);
    expect(pieces[1].rotationDeg).not.toBe(0);
    expect(pieces.map((piece) => piece.delayMs)).toEqual([0, 34, 68]);
    expect(pieces.every((piece) => piece.durationMs >= 700)).toBe(true);
  });

  it("ignores missed truth boundaries because the player did not physically slice them", () => {
    const pieces = buildSubmittedCutTextPieces("the cat", [3], {
      left: 0,
      width: 210,
      centerY: 100
    });
    const score = new ScoringSystem().scoreRound({
      truth: [3, 5],
      guesses: [3],
      tier: 1,
      difficultyWeight: 1,
      tokenCount: 3
    });

    expect(pieces.map((piece) => piece.text)).toEqual(["the", " cat"]);
    expect(score.missedCuts).toEqual([5]);
    expect(score.correctCuts).toEqual([3]);
  });

  it("deduplicates invalid submitted cuts without changing scoring inputs", () => {
    const submittedCuts = [0, 3, 3, 999];
    const pieces = buildSubmittedCutTextPieces("the cat", submittedCuts, {
      left: 0,
      width: 210,
      centerY: 100
    });
    const score = new ScoringSystem().scoreRound({
      truth: [3],
      guesses: submittedCuts,
      tier: 1,
      difficultyWeight: 1,
      tokenCount: 2
    });

    expect(pieces.map((piece) => piece.text)).toEqual(["the", " cat"]);
    expect(score.falseCuts).toEqual([0, 999]);
    expect(submittedCuts).toEqual([0, 3, 3, 999]);
  });

  it("does not turn invalid submitted cuts into falling visual pieces", () => {
    const pieces = buildSubmittedCutTextPieces("the cat", [0, 999], {
      left: 0,
      width: 210,
      centerY: 100
    });

    expect(pieces).toEqual([]);
  });
});
