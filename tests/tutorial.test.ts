import { describe, expect, it } from "vitest";
import fixturesJson from "../src/game/data/fixtures.json";
import { CutInputSessionSystem } from "../src/game/systems/CutInputSessionSystem";
import { splitGraphemes } from "../src/game/systems/GraphemeSystem";
import { SwipeCutSystem } from "../src/game/systems/SwipeCutSystem";
import {
  TUTORIAL_ROUND_DURATION_MS,
  TutorialSystem
} from "../src/game/systems/TutorialSystem";
import type { TokenFixture } from "../src/game/systems/TokenizerSystem";

const fixtures = fixturesJson as TokenFixture[];
const expectedTutorialFixtureIds = [
  "simple_001",
  "simple_002",
  "simple_010",
  "chaos_005",
  "punct_002",
  "punct_001",
  "punct_004",
  "dense_001",
  "punct_003",
  "simple_014"
];

function configuredRounds(tutorial: TutorialSystem) {
  return Array.from({ length: tutorial.count() }, (_, index) => tutorial.byIndex(index)!);
}

describe("TutorialSystem", () => {
  it("defines ten interactive tutorial rounds using verified runtime fixtures", () => {
    const tutorial = new TutorialSystem();
    const rounds = configuredRounds(tutorial);

    expect(rounds).toHaveLength(10);
    expect(rounds.map((round) => round.fixtureId)).toEqual(expectedTutorialFixtureIds);
    for (const fixtureId of expectedTutorialFixtureIds) {
      expect(fixtures.some((fixture) => fixture.id === fixtureId)).toBe(true);
    }
  });

  it("keeps every production-owned tutorial line populated and within the phone speech budget", () => {
    const tutorial = new TutorialSystem();
    for (const [index, round] of configuredRounds(tutorial).entries()) {
      expect(round.activeInstructionLine.length).toBeGreaterThan(24);
      expect(round.activeInstructionLine.length).toBeLessThanOrEqual(76);
      expect(round.firstCutFollowUpLine?.length).toBeGreaterThan(24);
      expect(round.firstCutFollowUpLine?.length).toBeLessThanOrEqual(76);
      for (const reaction of Object.values(round.reviewReactions)) {
        expect(reaction.length).toBeGreaterThan(24);
      }
      for (const outcome of [
        { correctCuts: 4, missedCuts: 0, falseCuts: 0 },
        { correctCuts: 2, missedCuts: 2, falseCuts: 0 },
        { correctCuts: 2, missedCuts: 0, falseCuts: 2 },
        { correctCuts: 1, missedCuts: 1, falseCuts: 1 }
      ]) {
        expect(tutorial.reviewSpeechFor(index, outcome).length).toBeLessThanOrEqual(118);
      }
      expect(typeof round.showSlotHints).toBe("boolean");
      expect(typeof round.showTargetHints).toBe("boolean");
      expect(typeof round.showSwipeCue).toBe("boolean");
    }
  });

  it("starts interactive play with action vocabulary already visible on screen", () => {
    const prompt = new TutorialSystem().activePromptFor(0);

    expect(prompt).toContain("Swipe up the dotted line");
    expect(prompt).toContain("every target");
    expect(prompt).toContain("Resolve submits");
    expect(prompt.length).toBeLessThanOrEqual(110);
  });

  it("provides one compact, deterministic first-cut follow-up per tutorial round", () => {
    const tutorial = new TutorialSystem();

    configuredRounds(tutorial).forEach((round, index) => {
      expect(tutorial.firstCutFollowUpFor(index)).toBe(round.firstCutFollowUpLine);
      expect(tutorial.firstCutFollowUpFor(index)).toBe(round.firstCutFollowUpLine);
    });
    expect(tutorial.firstCutFollowUpFor(99)).toBeUndefined();
  });

  it("teaches both correction controls before the worked examples end", () => {
    const tutorial = new TutorialSystem();
    const earlyCorrectionCopy = [
      tutorial.firstCutFollowUpFor(0),
      tutorial.activePromptFor(2),
      tutorial.firstCutFollowUpFor(2)
    ].join(" ");

    expect(earlyCorrectionCopy).toContain("Undo");
    expect(earlyCorrectionCopy).toContain("Clear");
  });

  it("distinguishes clean, missed-only, false-only, and mixed review outcomes", () => {
    const tutorial = new TutorialSystem();

    expect(tutorial.reviewSpeechFor(0, {
      correctCuts: 5,
      missedCuts: 0,
      falseCuts: 0
    })).toContain("OK marks a correct cut");
    expect(tutorial.reviewSpeechFor(0, {
      correctCuts: 1,
      missedCuts: 4,
      falseCuts: 0
    })).toContain("MISS joins two real tokens");
    expect(tutorial.reviewSpeechFor(0, {
      correctCuts: 1,
      missedCuts: 0,
      falseCuts: 1
    })).toContain("FALSE splits a real token");
    expect(tutorial.reviewSpeechFor(0, {
      correctCuts: 1,
      missedCuts: 2,
      falseCuts: 1
    })).toContain("MISS joins real tokens; FALSE splits another");
  });

  it("diagnoses space misses and false cuts without reversing their causes", () => {
    const tutorial = new TutorialSystem();
    const missed = tutorial.reviewSpeechFor(3, {
      correctCuts: 0,
      missedCuts: 1,
      falseCuts: 0
    });
    const falseCut = tutorial.reviewSpeechFor(3, {
      correctCuts: 1,
      missedCuts: 0,
      falseCuts: 1
    });

    expect(missed).toContain("needed a boundary before the visible gap");
    expect(missed).not.toContain("cut after the gap");
    expect(falseCut).toContain("cut after the gap");
    expect(falseCut).not.toContain("space as absence");
  });

  it("explains the ledger when its evidence first appears", () => {
    const tutorial = new TutorialSystem();
    const firstReviewLines = [
      tutorial.reviewSpeechFor(0, { correctCuts: 5, missedCuts: 0, falseCuts: 0 }),
      tutorial.reviewSpeechFor(0, { correctCuts: 3, missedCuts: 1, falseCuts: 0 }),
      tutorial.reviewSpeechFor(0, { correctCuts: 3, missedCuts: 0, falseCuts: 1 }),
      tutorial.reviewSpeechFor(0, { correctCuts: 2, missedCuts: 1, falseCuts: 1 })
    ];

    for (const line of firstReviewLines) {
      expect(line).toMatch(/ledger/i);
      expect(line).toMatch(/VERIFIED|REWORK|Token Credit/i);
    }
  });

  it("uses the second review pause to explain embodied token IDs without exposing the implementation name", () => {
    const tutorial = new TutorialSystem();
    const outcomes = [
      { correctCuts: 4, missedCuts: 0, falseCuts: 0 },
      { correctCuts: 2, missedCuts: 2, falseCuts: 0 },
      { correctCuts: 2, missedCuts: 0, falseCuts: 2 },
      { correctCuts: 1, missedCuts: 1, falseCuts: 2 }
    ];

    const reviewLine = tutorial.reviewSpeechFor(1, outcomes[0]);
    expect(reviewLine).toContain("Standard Protocol vocabulary IDs");
    expect(reviewLine).toContain("Falling numbers");
    expect(reviewLine).toContain("complete tokens");
    expect(reviewLine).toContain("not points");
    expect(reviewLine).not.toContain("cl100k_base");
    for (const outcome of outcomes) {
      expect(tutorial.reviewSpeechFor(1, outcome)).toBe(reviewLine);
    }
  });

  it("uses a genuine within-expression split for the first unguided token-not-word lesson", () => {
    const tutorial = new TutorialSystem();
    const round = tutorial.byIndex(4)!;
    const fixture = fixtures.find((candidate) => candidate.id === round.fixtureId);

    expect(round.fixtureId).toBe("punct_002");
    expect(round.showTargetHints).toBe(false);
    expect(round.activeInstructionLine).toContain("'re-enter'");
    expect(fixture?.text).toBe("re-enter the room");
    expect(fixture?.token_strings).toEqual(["re", "-enter", " the", " room"]);
  });

  it("keeps all visible tutorial speech aligned with current UI language", () => {
    const tutorial = new TutorialSystem();
    const visibleTutorialCopy = configuredRounds(tutorial).flatMap((_, index) => [
      tutorial.activePromptFor(index),
      tutorial.firstCutFollowUpFor(index) ?? "",
      tutorial.reviewSpeechFor(index, { correctCuts: 1, missedCuts: 0, falseCuts: 0 }),
      tutorial.reviewSpeechFor(index, { correctCuts: 1, missedCuts: 2, falseCuts: 0 }),
      tutorial.reviewSpeechFor(index, { correctCuts: 1, missedCuts: 0, falseCuts: 2 }),
      tutorial.reviewSpeechFor(index, { correctCuts: 1, missedCuts: 1, falseCuts: 1 })
    ]);

    for (const copy of visibleTutorialCopy) {
      expect(copy).not.toMatch(/\b(file|files|filed|filing)\b/i);
      expect(copy).not.toMatch(/\bblue\b/i);
      expect(copy).not.toMatch(/\bair\b/i);
      expect(copy).not.toMatch(/\bscore\b/i);
    }
  });

  it("keeps the round clock and later unaided prompts explicit", () => {
    const tutorial = new TutorialSystem();

    expect(TUTORIAL_ROUND_DURATION_MS).toBe(32000);
    expect(tutorial.activePromptFor(4)).toContain("Target guides are gone");
    expect(tutorial.activePromptFor(4)).toContain("'re-enter'");
    expect(tutorial.activePromptFor(5)).toContain("Apostrophes");
    expect(tutorial.activePromptFor(5)).toContain("contraction chunks");
    expect(tutorial.activePromptFor(6)).toContain("Punctuation");
    expect(tutorial.activePromptFor(6)).toContain("question mark");
    expect(tutorial.activePromptFor(7)).toContain("URLs reuse");
    expect(tutorial.activePromptFor(7)).toContain("dots, and slashes");
    expect(tutorial.activePromptFor(8)).toContain("Prices");
    expect(tutorial.activePromptFor(8)).toContain("decimal notation");
  });

  it("keeps the final round outcome-neutral until the aggregate audit runs", () => {
    const tutorial = new TutorialSystem();
    const finalCopy = [
      tutorial.activePromptFor(9),
      tutorial.firstCutFollowUpFor(9) ?? "",
      tutorial.reviewSpeechFor(9, { correctCuts: 4, missedCuts: 0, falseCuts: 0 }),
      tutorial.reviewSpeechFor(9, { correctCuts: 1, missedCuts: 2, falseCuts: 1 })
    ].join(" ");

    expect(finalCopy).toContain("Qualification");
    expect(finalCopy).toContain("full tutorial audit");
    expect(finalCopy).not.toMatch(/qualified|approved|denied|employment begins|can now replace/i);
  });

  it("uses target hints only for worked early examples", () => {
    const rounds = configuredRounds(new TutorialSystem());

    expect(rounds.map((round) => round.showTargetHints)).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false
    ]);
  });

  it("uses the animated swipe cue only for the first two worked examples", () => {
    const rounds = configuredRounds(new TutorialSystem());

    expect(rounds.map((round) => round.showSwipeCue)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    ]);
  });

  it("keeps worked target-hint rounds playable with wrong cuts still possible", () => {
    const swipe = new SwipeCutSystem();
    const rounds = configuredRounds(new TutorialSystem()).filter((round) => round.showTargetHints);

    expect(rounds.length).toBeGreaterThan(0);
    for (const round of rounds) {
      const fixture = fixtures.find((candidate) => candidate.id === round.fixtureId);
      expect(fixture).toBeDefined();

      const slots = swipe.buildPlayableSlots(
        { left: 0, top: 0, bottom: 40, width: fixture!.text.length * 30 },
        fixture!.text,
        true
      );
      const targetBoundaries = new Set(fixture!.boundary_positions);
      const falseSlotCount = slots.filter((slot) => !targetBoundaries.has(slot.index)).length;

      expect(slots.length).toBeGreaterThan(fixture!.boundary_positions.length);
      expect(falseSlotCount).toBeGreaterThan(0);
    }
  });

  it("lets the player stage every displayed tutorial slot without duplicating spaces", () => {
    const swipe = new SwipeCutSystem();
    const tutorial = new TutorialSystem();

    for (const round of configuredRounds(tutorial)) {
      const fixture = fixtures.find((candidate) => candidate.id === round.fixtureId)!;
      const graphemeCount = splitGraphemes(fixture.text).length;
      const bounds = { left: 0, top: 0, bottom: 40, width: graphemeCount * 30 };
      const slots = swipe.buildPlayableSlots(bounds, fixture.text, true);
      const graphemes = splitGraphemes(fixture.text);
      const displayedBoundaries = Array.from({ length: graphemeCount - 1 }, (_, index) => index + 1)
        .filter((index) => graphemes[index - 1] !== " ");
      const input = new CutInputSessionSystem(swipe);
      let cuts: number[] = [];

      expect(slots.map((slot) => slot.index)).toEqual(displayedBoundaries);
      for (const slot of slots) {
        input.endGesture();
        const result = input.applySample({
          bounds,
          currentCuts: cuts,
          point: { x: slot.x, y: 20 },
          text: fixture.text,
          viewportWidth: 390,
          spaceRunAssist: false,
          playableSlots: slots
        });
        expect(result.addedCuts, `${fixture.id} boundary ${slot.index}`).toContain(slot.index);
        cuts = result.cuts;
      }
      expect(cuts).toEqual(displayedBoundaries);
    }
  });

  it("completes after the tenth training example", () => {
    const tutorial = new TutorialSystem();

    expect(tutorial.isCompleteAfter(9)).toBe(false);
    expect(tutorial.isCompleteAfter(10)).toBe(true);
  });

  it("fails visibly when a tutorial record is missing", () => {
    const tutorial = new TutorialSystem();

    expect(tutorial.activePromptFor(99)).toContain("RECORD MISSING");
    expect(tutorial.reviewSpeechFor(99, { correctCuts: 0, missedCuts: 0, falseCuts: 0 }))
      .toContain("record unavailable");
  });
});
