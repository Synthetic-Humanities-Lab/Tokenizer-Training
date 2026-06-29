import { describe, expect, it } from "vitest";
import fixturesJson from "../src/game/data/fixtures.json";
import { SwipeCutSystem } from "../src/game/systems/SwipeCutSystem";
import {
  compactTutorialPopupTitle,
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
  "simple_007",
  "punct_001",
  "punct_004",
  "dense_001",
  "punct_003",
  "simple_014"
];

describe("TutorialSystem", () => {
  it("defines ten interactive tutorial rounds using verified runtime fixtures", () => {
    const rounds = new TutorialSystem().all();

    expect(rounds).toHaveLength(10);
    expect(rounds.map((round) => round.fixtureId)).toEqual(expectedTutorialFixtureIds);
    for (const fixtureId of expectedTutorialFixtureIds) {
      expect(fixtures.some((fixture) => fixture.id === fixtureId)).toBe(true);
    }
  });

  it("gives each tutorial round explanation, example text source, and teaching point", () => {
    for (const round of new TutorialSystem().all()) {
      const fixture = fixtures.find((candidate) => candidate.id === round.fixtureId);
      expect(fixture?.text).toBe(round.exampleText);
      expect(round.fixtureId.length).toBeGreaterThan(0);
      expect(round.exampleText.length).toBeGreaterThan(3);
      expect(round.explanation.length).toBeGreaterThan(24);
      expect(round.popupBody).toContain("WIENER");
      expect(round.popupBody.length).toBeGreaterThan(80);
      expect(round.mechanicsPopupBody).toContain("WIENER");
      expect(round.mechanicsPopupBody.length).toBeGreaterThan(80);
      expect(round.mechanicsPopupBody.length).toBeLessThanOrEqual(190);
      expect(round.mechanicsPopupBody).toMatch(/\b(token|tokens|tokenizer|BPE|byte|chunk|chunks|merge)\b/i);
      expect(round.bytePopupBody).toContain("WIENER");
      expect(round.bytePopupBody.length).toBeGreaterThan(80);
      expect(round.bytePopupBody.length).toBeLessThanOrEqual(190);
      expect(round.bytePopupBody).toMatch(/\b(UTF-8|byte|bytes|BPE|merge|token|tokens|chunk|chunks)\b/i);
      expect(round.tokenIdPopupBody).toContain("WIENER");
      expect(round.tokenIdPopupBody.length).toBeGreaterThan(80);
      expect(round.tokenIdPopupBody.length).toBeLessThanOrEqual(190);
      expect(round.tokenIdPopupBody).toMatch(/\b(token ID|token IDs|ID|IDs|integer|integers|model|billable)\b/i);
      expect(round.rulePopupBody).toContain("WIENER");
      expect(round.rulePopupBody.length).toBeGreaterThan(80);
      expect(round.rulePopupBody.length).toBeLessThanOrEqual(180);
      expect(round.rulePopupBody).toMatch(/\b(token|tokens|tokenizer|BPE|byte|chunk|chunks|merge)\b/i);
      expect(round.followupPopupBody).toContain("WIENER");
      expect(round.followupPopupBody.length).toBeGreaterThan(80);
      expect(round.followupPopupBody.length).toBeLessThanOrEqual(180);
      expect(round.followupPopupBody).toMatch(/\b(token|tokens|tokenizer|BPE|byte|chunk|chunks)\b/i);
      expect(round.resolvePopupBody.length).toBeGreaterThan(60);
      expect(round.teachingPoint.length).toBeGreaterThan(12);
      expect(round.activeLine.length).toBeGreaterThan(24);
      expect(round.activeLine.length).toBeLessThanOrEqual(92);
      expect(round.mechanicsLine.length).toBeGreaterThan(24);
      expect(round.mechanicsLine.length).toBeLessThanOrEqual(92);
      expect(round.byteLine.length).toBeGreaterThan(24);
      expect(round.byteLine.length).toBeLessThanOrEqual(92);
      expect(round.tokenIdLine.length).toBeGreaterThan(24);
      expect(round.tokenIdLine.length).toBeLessThanOrEqual(92);
      expect(round.tokenIdLine).toMatch(/\b(ID|IDs|token|tokens|bill|billable|model)\b/i);
      expect(round.ruleLine.length).toBeGreaterThan(24);
      expect(round.ruleLine.length).toBeLessThanOrEqual(92);
      expect(round.followupLine.length).toBeGreaterThan(24);
      expect(round.followupLine.length).toBeLessThanOrEqual(92);
      expect(round.resolveLine.length).toBeGreaterThan(12);
      expect(round.resolveGoodLine.length).toBeGreaterThan(24);
      expect(round.resolveMixedLine.length).toBeGreaterThan(24);
      expect(round.resolveBadLine.length).toBeGreaterThan(24);
      expect(typeof round.showTargetHints).toBe("boolean");
      expect(round.instructionWindowMs).toBeGreaterThan(4000);
    }
  });

  it("keeps active tutorial prompts short enough for the overseer panel", () => {
    const tutorial = new TutorialSystem();

    tutorial.all().forEach((_, index) => {
      const prompt = tutorial.activePromptFor(index);
      const mechanics = tutorial.mechanicsPromptFor(index);
      const byte = tutorial.bytePromptFor(index);
      const tokenIds = tutorial.tokenIdPromptFor(index);
      const rule = tutorial.rulePromptFor(index);
      const followup = tutorial.followupPromptFor(index);

      expect(prompt).toContain(`TUTORIAL ${index + 1}/${tutorial.count()}`);
      expect(prompt.length).toBeLessThanOrEqual(110);
      expect(mechanics).toContain(`TUTORIAL ${index + 1}/${tutorial.count()}`);
      expect(mechanics.length).toBeLessThanOrEqual(110);
      expect(byte).toContain(`TUTORIAL ${index + 1}/${tutorial.count()}`);
      expect(byte.length).toBeLessThanOrEqual(110);
      expect(tokenIds).toContain(`TUTORIAL ${index + 1}/${tutorial.count()}`);
      expect(tokenIds.length).toBeLessThanOrEqual(110);
      expect(rule).toContain(`TUTORIAL ${index + 1}/${tutorial.count()}`);
      expect(rule.length).toBeLessThanOrEqual(110);
      expect(followup).toContain(`TUTORIAL ${index + 1}/${tutorial.count()}`);
      expect(followup.length).toBeLessThanOrEqual(110);
    });
  });

  it("builds concise intro prompts from the title, teaching point, and explanation", () => {
    const tutorial = new TutorialSystem();

    tutorial.all().forEach((round, index) => {
      const prompt = tutorial.introPromptFor(index);

      expect(prompt).toContain(round.title);
      expect(prompt).toContain(round.teachingPoint);
      expect(prompt).toContain(round.explanation);
      expect(prompt).toContain(`TUTORIAL ${index + 1}/${tutorial.count()}`);
      expect(prompt.length).toBeLessThanOrEqual(180);
    });
  });

  it("builds robot popup instructions for tutorial windows", () => {
    const tutorial = new TutorialSystem();

    tutorial.all().forEach((round, index) => {
      const intro = tutorial.introPopupFor(index);
      const mechanics = tutorial.mechanicsPopupFor(index);
      const byte = tutorial.bytePopupFor(index);
      const tokenIds = tutorial.tokenIdPopupFor(index);
      const rule = tutorial.rulePopupFor(index);
      const followup = tutorial.followupPopupFor(index);
      const review = tutorial.resolvePopupFor(index);

      expect(intro.title).toContain(`TUTORIAL ${index + 1}/${tutorial.count()}`);
      expect(intro.title).toContain(round.title);
      expect(intro.body).toBe(round.popupBody);
      expect(intro.body).toContain("WIENER");
      expect(mechanics.title).toContain(`MECHANICS ${index + 1}/${tutorial.count()}`);
      expect(mechanics.body).toBe(round.mechanicsPopupBody);
      expect(mechanics.body).toContain("WIENER");
      expect(byte.title).toContain(`BYTE ROUTE ${index + 1}/${tutorial.count()}`);
      expect(byte.body).toBe(round.bytePopupBody);
      expect(byte.body).toContain("WIENER");
      expect(tokenIds.title).toContain(`TOKEN IDS ${index + 1}/${tutorial.count()}`);
      expect(tokenIds.body).toBe(round.tokenIdPopupBody);
      expect(tokenIds.body).toContain("WIENER");
      expect(rule.title).toContain(`WORK RULE ${index + 1}/${tutorial.count()}`);
      expect(rule.body).toBe(round.rulePopupBody);
      expect(rule.body).toContain("WIENER");
      expect(followup.title).toContain(`TECH NOTE ${index + 1}/${tutorial.count()}`);
      expect(followup.body).toBe(round.followupPopupBody);
      expect(followup.body).toContain("WIENER");
      expect(review.title).toContain(`REVIEW ${index + 1}/${tutorial.count()}`);
      expect(review.body).toBe(round.resolvePopupBody);
    });
  });

  it("keeps tutorial review speech qualitative so Wiener does not duplicate the score HUD", () => {
    const tutorial = new TutorialSystem();

    const clean = tutorial.reviewSpeechFor(0, {
      correctCuts: 5,
      missedCuts: 0,
      falseCuts: 0
    });
    expect(clean).not.toMatch(/\b\d+\s+(found|missed|false)\b/i);
    expect(clean).toContain("Clean start");

    const missed = tutorial.reviewSpeechFor(0, {
      correctCuts: 1,
      missedCuts: 4,
      falseCuts: 0
    });
    expect(missed).not.toMatch(/\b\d+\s+(found|missed|false)\b/i);
    expect(missed).toContain("Familiar words are not protection");
    expect(missed.length).toBeLessThanOrEqual(154);

    const falseCut = tutorial.reviewSpeechFor(3, {
      correctCuts: 1,
      missedCuts: 0,
      falseCuts: 1
    });
    expect(falseCut).not.toMatch(/\b\d+\s+(found|missed|false)\b/i);
    expect(falseCut).toContain("leading-space chunk was mishandled");
    expect(falseCut.length).toBeLessThanOrEqual(154);

    const mixed = tutorial.reviewSpeechFor(9, {
      correctCuts: 2,
      missedCuts: 3,
      falseCuts: 2
    });
    expect(mixed).not.toMatch(/\b\d+\s+(found|missed|false)\b/i);
    expect(mixed).toContain("balance only respects boundary evidence");
    expect(mixed.length).toBeLessThanOrEqual(154);
  });

  it("keeps live tutorial speech aligned with visible UI language", () => {
    const tutorial = new TutorialSystem();
    const publicTutorialCopy = tutorial.all().flatMap((round, index) => [
      round.popupBody,
      round.mechanicsPopupBody,
      round.bytePopupBody,
      round.tokenIdPopupBody,
      round.rulePopupBody,
      round.followupPopupBody,
      round.resolvePopupBody,
      round.activeLine,
      round.mechanicsLine,
      round.byteLine,
      round.tokenIdLine,
      round.ruleLine,
      round.followupLine,
      round.resolveLine,
      tutorial.activePromptFor(index),
      tutorial.introPromptFor(index),
      tutorial.resolvePopupFor(index).body,
      tutorial.reviewSpeechFor(index, { correctCuts: 1, missedCuts: 2, falseCuts: 0 }),
      tutorial.reviewSpeechFor(index, { correctCuts: 1, missedCuts: 0, falseCuts: 2 }),
      tutorial.reviewSpeechFor(index, { correctCuts: 1, missedCuts: 1, falseCuts: 1 })
    ]);

    for (const copy of publicTutorialCopy) {
      expect(copy).not.toMatch(/\b(file|files|filed|filing)\b/i);
      expect(copy).not.toMatch(/\bblue\b/i);
      expect(copy).not.toMatch(/\bscore\b/i);
      expect(copy).not.toMatch(/\bair\b/i);
    }
  });

  it("uses short staged tutorial popups for tokenization mechanics", () => {
    const tutorial = new TutorialSystem();

    expect(TUTORIAL_ROUND_DURATION_MS).toBe(32000);
    expect(tutorial.introPopupWindowMs()).toBe(4300);
    expect(tutorial.mechanicsPopupWindowMs()).toBe(4600);
    expect(tutorial.bytePopupWindowMs()).toBe(4300);
    expect(tutorial.tokenIdPopupWindowMs()).toBe(4100);
    expect(tutorial.rulePopupWindowMs()).toBe(4300);
    expect(tutorial.followupPopupWindowMs()).toBe(4600);
    tutorial.all().forEach((round, index) => {
      const mechanics = tutorial.mechanicsPopupFor(index);
      const byte = tutorial.bytePopupFor(index);
      const tokenIds = tutorial.tokenIdPopupFor(index);
      const rule = tutorial.rulePopupFor(index);
      const popup = tutorial.followupPopupFor(index);

      expect(mechanics.title).toBe(`WIENER - MECHANICS ${index + 1}/${tutorial.count()}`);
      expect(mechanics.body).toBe(round.mechanicsPopupBody);
      expect(mechanics.body).toMatch(/\b(token|tokens|tokenizer|BPE|byte|chunk|chunks|merge)\b/i);
      expect(byte.title).toBe(`WIENER - BYTE ROUTE ${index + 1}/${tutorial.count()}`);
      expect(byte.body).toBe(round.bytePopupBody);
      expect(byte.body).toMatch(/\b(UTF-8|byte|bytes|BPE|merge|token|tokens|chunk|chunks)\b/i);
      expect(tokenIds.title).toBe(`WIENER - TOKEN IDS ${index + 1}/${tutorial.count()}`);
      expect(tokenIds.body).toBe(round.tokenIdPopupBody);
      expect(tokenIds.body).toMatch(/\b(token ID|token IDs|ID|IDs|integer|integers|model|billable)\b/i);
      expect(rule.title).toBe(`WIENER - WORK RULE ${index + 1}/${tutorial.count()}`);
      expect(rule.body).toBe(round.rulePopupBody);
      expect(rule.body).toMatch(/\b(token|tokens|tokenizer|BPE|byte|chunk|chunks|merge)\b/i);
      expect(popup.title).toBe(`WIENER - TECH NOTE ${index + 1}/${tutorial.count()}`);
      expect(popup.body).toBe(round.followupPopupBody);
      expect(popup.body).toMatch(/\b(token|tokens|tokenizer|BPE|byte|chunk|chunks)\b/i);
    });
  });

  it("keeps compact popup titles short without mutating full tutorial titles", () => {
    const tutorial = new TutorialSystem();
    const fullTitle = tutorial.introPopupFor(5).title;

    expect(fullTitle).toBe("WIENER - TUTORIAL 6/10: Contractions");
    expect(compactTutorialPopupTitle(fullTitle)).toBe("WIENER - TUTORIAL 6/10");
    expect(compactTutorialPopupTitle(tutorial.resolvePopupFor(5).title)).toBe(
      "WIENER - REVIEW 6/10"
    );
  });

  it("keeps tutorial review popups inside the review window", () => {
    const tutorial = new TutorialSystem();

    expect(tutorial.reviewPopupWindowMs(4200)).toBe(3750);
    expect(tutorial.reviewPopupWindowMs(7600)).toBe(5600);
    expect(tutorial.reviewPopupWindowMs(0)).toBe(0);
  });

  it("keeps later tutorial prompts actionable after target hints are removed", () => {
    const tutorial = new TutorialSystem();

    expect(tutorial.activePromptFor(4)).toContain("No orange answers");
    expect(tutorial.activePromptFor(4)).toContain("token strip");
    expect(tutorial.activePromptFor(5)).toContain("apostrophe");
    expect(tutorial.activePromptFor(5)).toContain("final period");
    expect(tutorial.activePromptFor(6)).toContain("Punctuation");
    expect(tutorial.activePromptFor(6)).toContain("question marks");
    expect(tutorial.activePromptFor(7)).toContain("URLs fragment");
    expect(tutorial.activePromptFor(7)).toContain("dots and slashes");
    expect(tutorial.activePromptFor(8)).toContain("Currency");
    expect(tutorial.activePromptFor(8)).toContain("decimals");
    expect(tutorial.activePromptFor(9)).toContain("correct cuts pay");
    expect(tutorial.activePromptFor(9)).toContain("create cost");
  });

  it("uses target hints only for worked early examples", () => {
    const rounds = new TutorialSystem().all();

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

  it("keeps worked target-hint rounds playable with wrong cuts still possible", () => {
    const swipe = new SwipeCutSystem();
    const rounds = new TutorialSystem().all().filter((round) => round.showTargetHints);

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

  it("completes after the tenth training example", () => {
    const tutorial = new TutorialSystem();

    expect(tutorial.isCompleteAfter(9)).toBe(false);
    expect(tutorial.isCompleteAfter(10)).toBe(true);
  });

  it("announces the final tutorial handoff into Endless Training", () => {
    const tutorial = new TutorialSystem();

    expect(tutorial.resolveLineFor(8)).not.toContain("Returning to menu");
    expect(tutorial.resolveLineFor(9)).toContain("Tutorial cleared");
    expect(tutorial.resolveLineFor(9)).toContain("Endless Training");
    expect(tutorial.resolveLineFor(9)).toContain("live cost exposure");
  });

  it("frames budget termination as an endless training rule, not a tutorial interruption", () => {
    const economyRound = new TutorialSystem().all().at(-1)!;

    expect(economyRound.explanation).toContain("Zero balance ends the shift");
    expect(economyRound.resolveLine).toContain("net changes balance");
  });
});
