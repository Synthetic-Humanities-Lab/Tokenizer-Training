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
    expect(pieces.every((piece) => !("tokenId" in piece))).toBe(true);
    expect(pieces.map((piece) => piece.y)).toEqual([240, 240, 240]);
    expect(pieces[0].x).toBeLessThan(pieces[1].x);
    expect(pieces[1].x).toBeLessThan(pieces[2].x);
  });

  it("assigns real token IDs only when submitted pieces exactly match token spans", () => {
    const pieces = buildSubmittedCutTextPieces("the cat sat", [3, 7], {
      left: 0,
      width: 330,
      centerY: 100
    }, {
      tokenStrings: ["the", " cat", " sat"],
      tokenIds: [1820, 8415, 7731]
    });

    expect(pieces.map(({ text, tokenId }) => ({ text, tokenId }))).toEqual([
      { text: "the", tokenId: 1820 },
      { text: " cat", tokenId: 8415 },
      { text: " sat", tokenId: 7731 }
    ]);
  });

  it("keeps false-cut fragments physical while withholding their token IDs", () => {
    const pieces = buildSubmittedCutTextPieces("the cat", [2, 3], {
      left: 0,
      width: 210,
      centerY: 100
    }, {
      tokenStrings: ["the", " cat"],
      tokenIds: [1820, 8415]
    });

    expect(pieces.map((piece) => piece.text)).toEqual(["th", "e", " cat"]);
    expect(pieces.map((piece) => piece.tokenId)).toEqual([undefined, undefined, 8415]);
  });

  it("withholds token IDs from pieces that span missed token boundaries", () => {
    const pieces = buildSubmittedCutTextPieces("the cat sat", [3], {
      left: 0,
      width: 330,
      centerY: 100
    }, {
      tokenStrings: ["the", " cat", " sat"],
      tokenIds: [1820, 8415, 7731]
    });

    expect(pieces.map((piece) => piece.text)).toEqual(["the", " cat sat"]);
    expect(pieces.map((piece) => piece.tokenId)).toEqual([1820, undefined]);
  });

  it("matches token spans by grapheme index for Unicode text", () => {
    const pieces = buildSubmittedCutTextPieces("A👩🏽‍💻B", [1, 2], {
      left: 0,
      width: 180,
      centerY: 100
    }, {
      tokenStrings: ["A", "👩🏽‍💻", "B"],
      tokenIds: [32, 999, 33]
    });

    expect(pieces.map(({ text, tokenId }) => ({ text, tokenId }))).toEqual([
      { text: "A", tokenId: 32 },
      { text: "👩🏽‍💻", tokenId: 999 },
      { text: "B", tokenId: 33 }
    ]);
  });

  it("withholds all token IDs when token input is mismatched or grapheme-unsafe", () => {
    const bounds = { left: 0, width: 210, centerY: 100 };
    const inputs = [
      { tokenStrings: ["the", " cat"], tokenIds: [1820] },
      { tokenStrings: ["the", "cat"], tokenIds: [1820, 8415] },
      { tokenStrings: ["e", "\u0301x"], tokenIds: [68, 54939] }
    ];

    expect(buildSubmittedCutTextPieces("the cat", [3], bounds, inputs[0]).map((piece) => piece.tokenId))
      .toEqual([undefined, undefined]);
    expect(buildSubmittedCutTextPieces("the cat", [3], bounds, inputs[1]).map((piece) => piece.tokenId))
      .toEqual([undefined, undefined]);
    expect(buildSubmittedCutTextPieces("e\u0301x", [1], bounds, inputs[2]).map((piece) => piece.tokenId))
      .toEqual([undefined, undefined]);
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
    expect(pieces.map((piece) => piece.delayMs)).toEqual([0, 20, 40]);
    expect(pieces.every((piece) => piece.durationMs >= 400)).toBe(true);
    expect(Math.max(...pieces.map((piece) => piece.delayMs + piece.durationMs))).toBeLessThanOrEqual(600);
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
      difficultyWeight: 1
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
      difficultyWeight: 1
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
