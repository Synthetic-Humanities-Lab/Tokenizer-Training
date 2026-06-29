import { describe, expect, it } from "vitest";
import linesJson from "../src/game/data/overseer_lines.json";
import { FeedbackSystem } from "../src/game/systems/FeedbackSystem";
import type { RoundScoreResult } from "../src/game/systems/ScoringSystem";
import type { TokenFixture } from "../src/game/systems/TokenizerSystem";
import { feedbackEconomyColor } from "../src/game/ui/FeedbackCard";
import { uiPalette } from "../src/game/ui/VisualTheme";

const fixture: TokenFixture = {
  id: "test_001",
  text: "I can't believe it.",
  category: "contraction",
  tier: 2,
  token_count: 6,
  token_ids: [40, 649, 956, 4510, 433, 13],
  token_strings: ["I", " can", "'t", " believe", " it", "."],
  token_byte_spans: [[0, 1], [1, 5], [5, 7], [7, 15], [15, 18], [18, 19]],
  graphemes: ["I", " ", "c", "a", "n", "'", "t", " ", "b", "e", "l", "i", "e", "v", "e", " ", "i", "t", "."],
  grapheme_byte_spans: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19]],
  boundary_positions: [1, 5, 7, 15, 18],
  boundary_byte_positions: [1, 5, 7, 15, 18],
  difficulty_weight: 1,
  notes: "test fixture",
  tokenizer: "cl100k_base"
};

function fixtureWith(overrides: Partial<TokenFixture>): TokenFixture {
  return {
    ...fixture,
    ...overrides
  };
}

function scoreWith(overrides: Partial<RoundScoreResult> = {}): RoundScoreResult {
  return {
    correctCuts: [1],
    missedCuts: [7],
    falseCuts: [],
    accuracy: 0.25,
    pay: 2,
    companyCost: 4,
    net: -2,
    tokenCount: 5,
    ...overrides
  };
}

describe("FeedbackSystem", () => {
  it("explains score arithmetic as pay minus cost equals net", () => {
    const score: RoundScoreResult = {
      correctCuts: [1, 15],
      missedCuts: [7, 18],
      falseCuts: [5],
      accuracy: 0.5,
      pay: 3.24,
      companyCost: 5.12,
      net: -1.88,
      tokenCount: 5
    };

    const summary = new FeedbackSystem().summarize(fixture, score);

    expect(summary.economy).toBe("Pay $3.24 - Cost $5.12 = Net -$1.88");
    expect(summary.economyTone).toBe("loss");
  });

  it("includes the token split in the feedback card copy without the old actual-tokenization label", () => {
    const summary = new FeedbackSystem().summarize(fixture, scoreWith());

    expect(summary.tokenSplit).toBe("Tokens 6: <I> < can> <'t> < believe> < it> <.>");
    expect(summary.tokenSplit).not.toMatch(/actual tokenization/i);
  });

  it("marks economic gain, loss, and neutral rounds for feedback coloring", () => {
    const feedback = new FeedbackSystem();

    expect(feedback.summarize(fixture, scoreWith({ net: 1.25 })).economyTone).toBe("gain");
    expect(feedback.summarize(fixture, scoreWith({ net: -0.01 })).economyTone).toBe("loss");
    expect(feedback.summarize(fixture, scoreWith({ net: 0 })).economyTone).toBe("neutral");
  });

  it("maps economy tone to warm interface colors", () => {
    expect(feedbackEconomyColor("gain")).toBe("#3f7358");
    expect(feedbackEconomyColor("loss")).toBe("#b6534a");
    expect(feedbackEconomyColor("neutral")).toBe(uiPalette.text);
  });

  it("names the boundary audit counts behind the score", () => {
    const score: RoundScoreResult = {
      correctCuts: [1, 15],
      missedCuts: [7],
      falseCuts: [5, 10],
      accuracy: 0.5,
      pay: 3.24,
      companyCost: 5.12,
      net: -1.88,
      tokenCount: 5
    };

    const summary = new FeedbackSystem().summarize(fixture, score);

    expect(summary.audit).toBe("Boundary audit: OK 2 / Missed 1 / False 2 / Tokens 5 / Cost drivers: missed, false");
  });

  it("connects the round audit to the recorded balance when review context is available", () => {
    const score: RoundScoreResult = {
      correctCuts: [1, 15],
      missedCuts: [7],
      falseCuts: [5],
      accuracy: 0.5,
      pay: 3.24,
      companyCost: 5.12,
      net: -1.88,
      tokenCount: 5
    };

    const summary = new FeedbackSystem().summarize(fixture, score, { balanceAfter: 38.12 });

    expect(summary.audit).toBe(
      "Boundary audit: OK 2 / Missed 1 / False 1 / Tokens 5 / Balance $38.12 / Cost drivers: missed, false"
    );
  });

  it("clamps exhausted recorded balance in review feedback", () => {
    const summary = new FeedbackSystem().summarize(fixture, scoreWith({ net: -12 }), { balanceAfter: -3.25 });

    expect(summary.audit).toContain("Balance $0.00 closed");
  });

  it("marks low recorded balance during review without using the exhausted-copy state", () => {
    const summary = new FeedbackSystem().summarize(fixture, scoreWith({ net: -4 }), { balanceAfter: 8.75 });

    expect(summary.audit).toContain("Balance $8.75 low");
    expect(summary.audit).not.toContain("closed");
  });

  it("calls out token-load surcharge on high-token rounds", () => {
    const summary = new FeedbackSystem().summarize(
      fixtureWith({ category: "url", token_count: 8 }),
      scoreWith({ correctCuts: [1, 7], missedCuts: [15], falseCuts: [5], tokenCount: 8 })
    );

    expect(summary.audit).toBe("Boundary audit: OK 2 / Missed 1 / False 1 / Tokens 8 / Cost drivers: missed, false, token load");
  });

  it("keeps clean audit copy from inventing cost drivers", () => {
    const summary = new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1, 7, 15, 18], missedCuts: [], falseCuts: [], tokenCount: 5 })
    );

    expect(summary.audit).toBe("Boundary audit: OK 4 / Missed 0 / False 0 / Tokens 5 / Cost drivers: none");
  });

  it("keeps clean rounds from being overdiagnosed by category", () => {
    const summary = new FeedbackSystem().summarize(
      fixtureWith({ category: "filename", text: "hello_world_v2.py" }),
      scoreWith({ missedCuts: [], falseCuts: [], correctCuts: [5], accuracy: 1 })
    );

    expect(summary.technical).toBe("Clean segmentation.");
  });

  it("uses v2 overseer categories for resolve reactions", () => {
    expect(new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1, 7], missedCuts: [], falseCuts: [] })
    ).overseer).toBe(linesJson.categories["play.resolve.perfect"].lines[2]);

    expect(new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1], missedCuts: [7], falseCuts: [] })
    ).overseer).toBe(linesJson.categories["play.resolve.missed"].lines[2]);

    expect(new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1], missedCuts: [], falseCuts: [7] })
    ).overseer).toBe(linesJson.categories["play.resolve.false_cut"].lines[2]);

    expect(new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1], missedCuts: [7], falseCuts: [2, 3, 4] })
    ).overseer).toBe(linesJson.categories["play.resolve.overcut"].lines[5]);

    expect(new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1], missedCuts: [7], falseCuts: [2] })
    ).overseer).toBe(linesJson.categories["play.resolve.mixed"].lines[3]);
  });

  it("names dense string fragmentation across URL, filename, code, hashtag, and tokenizer strings", () => {
    const feedback = new FeedbackSystem();

    for (const category of ["url", "filename", "code", "hashtag", "tokenizer_string"]) {
      const summary = feedback.summarize(
        fixtureWith({ category, text: category === "hashtag" ? "#GameDev2026" : "model_name=cl100k_base" }),
        scoreWith()
      );

      expect(summary.technical).toBe("Dense string fragmentation mishandled.");
    }
  });

  it("names common irregular punctuation and symbol cases before generic miss/false feedback", () => {
    const feedback = new FeedbackSystem();

    expect(feedback.summarize(fixtureWith({ category: "contraction" }), scoreWith()).technical)
      .toBe("Contraction boundary mishandled.");
    expect(feedback.summarize(fixtureWith({ category: "hyphenation", text: "re-enter the room" }), scoreWith()).technical)
      .toBe("Hyphenated token boundary mishandled.");
    expect(feedback.summarize(fixtureWith({ category: "numbers_symbols", text: "it costs $19.99" }), scoreWith()).technical)
      .toBe("Number or symbol boundary mishandled.");
    expect(feedback.summarize(fixtureWith({ category: "punctuation", text: "wait... what?" }), scoreWith()).technical)
      .toBe("Punctuation cluster mishandled.");
  });

  it("names spacing, multilingual, symbolic, and mixed-label cases before generic miss feedback", () => {
    const feedback = new FeedbackSystem();

    expect(feedback.summarize(fixtureWith({ category: "leading_space", text: " leading space" }), scoreWith()).technical)
      .toBe("Leading-space boundary mishandled.");
    expect(feedback.summarize(fixtureWith({ category: "spacing", text: "spaces matter" }), scoreWith()).technical)
      .toBe("Space-bearing token boundary mishandled.");
    expect(feedback.summarize(fixtureWith({ category: "multilingual", text: "naïve façade" }), scoreWith()).technical)
      .toBe("Accent-bearing boundary mishandled.");
    expect(feedback.summarize(fixtureWith({ category: "symbolic", text: "queue→worker" }), scoreWith()).technical)
      .toBe("Symbol or operator boundary mishandled.");
    expect(feedback.summarize(fixtureWith({ category: "code_symbols", text: "cost_per_token++" }), scoreWith()).technical)
      .toBe("Symbol or operator boundary mishandled.");
    expect(feedback.summarize(fixtureWith({ category: "proper_noun", text: "Model A-12" }), scoreWith()).technical)
      .toBe("Mixed label boundary mishandled.");
  });
});
