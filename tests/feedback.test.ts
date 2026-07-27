import { describe, expect, it } from "vitest";
import linesJson from "../src/game/data/wiener_speech_lines.json";
import { FeedbackSystem } from "../src/game/systems/FeedbackSystem";
import type { RoundScoreResult } from "../src/game/systems/ScoringSystem";
import type { TokenFixture } from "../src/game/systems/TokenizerSystem";
import { feedbackCreditColor } from "../src/game/ui/FeedbackCard";
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
    verifiedTokenIndexes: [0, 1],
    reworkTokenIndexes: [2, 3, 4, 5],
    verifiedCredits: 2,
    reworkCredits: 4,
    creditDelta: -2,
    tokenCount: 6,
    ...overrides
  };
}

describe("FeedbackSystem", () => {
  it("labels verified credits, rework, and net without conflating credits with token IDs", () => {
    const score: RoundScoreResult = {
      correctCuts: [1, 15],
      missedCuts: [7, 18],
      falseCuts: [5],
      accuracy: 0.5,
      verifiedTokenIndexes: [0, 3, 4],
      reworkTokenIndexes: [1, 2, 5],
      verifiedCredits: 3,
      reworkCredits: 5,
      creditDelta: -2,
      tokenCount: 6
    };

    const summary = new FeedbackSystem().summarize(fixture, score);

    expect(summary.creditLedger).toBe("VERIFIED +3 TC   REWORK -5 TC   NET -2 TC");
    expect(summary.creditBreakdown).toBe("VERIFIED +3 TC   REWORK -5 TC");
    expect(summary.creditDelta).toBe("NET -2 TC");
    expect(summary.creditTone).toBe("loss");
  });

  it("keeps the feedback card focused on token boundaries without duplicating token IDs", () => {
    const summary = new FeedbackSystem().summarize(fixture, scoreWith());

    expect(summary.tokenCount).toBe(6);
    expect(summary.tokenSplit).toBe("I │ ␠can │ 't │ ␠believe │ ␠it │ .");
    expect(summary.tokenSplit).not.toMatch(/actual tokenization/i);
    expect(summary.tokenSplit).not.toMatch(/cl100k_base|->|649/);
  });

  it("marks credit gain, loss, and neutral rounds for feedback coloring", () => {
    const feedback = new FeedbackSystem();

    expect(feedback.summarize(fixture, scoreWith({ creditDelta: 1 })).creditTone).toBe("gain");
    expect(feedback.summarize(fixture, scoreWith({ creditDelta: -1 })).creditTone).toBe("loss");
    expect(feedback.summarize(fixture, scoreWith({ creditDelta: 0 })).creditTone).toBe("neutral");
  });

  it("maps credit tone to warm interface colors", () => {
    expect(feedbackCreditColor("gain")).toBe("#3f7358");
    expect(feedbackCreditColor("loss")).toBe("#b6534a");
    expect(feedbackCreditColor("neutral")).toBe(uiPalette.text);
  });

  it("names the boundary audit counts behind the score", () => {
    const score: RoundScoreResult = {
      correctCuts: [1, 15],
      missedCuts: [7],
      falseCuts: [5, 10],
      accuracy: 0.5,
      verifiedTokenIndexes: [0, 3],
      reworkTokenIndexes: [1, 2, 4, 5],
      verifiedCredits: 2,
      reworkCredits: 6,
      creditDelta: -4,
      tokenCount: 6
    };

    const summary = new FeedbackSystem().summarize(fixture, score);

    expect(summary.audit).toBe("OK 2          MISS 1          FALSE 2");
    expect(summary.auditCompact).toBe(summary.audit);
  });

  it("does not duplicate the HUD credit balance or token count in the cut audit", () => {
    const score: RoundScoreResult = {
      correctCuts: [1, 15],
      missedCuts: [7],
      falseCuts: [5],
      accuracy: 0.5,
      verifiedTokenIndexes: [0, 3],
      reworkTokenIndexes: [1, 2, 4, 5],
      verifiedCredits: 2,
      reworkCredits: 5,
      creditDelta: -3,
      tokenCount: 6
    };

    const summary = new FeedbackSystem().summarize(fixture, score);

    expect(summary.audit).toBe("OK 2          MISS 1          FALSE 1");
    expect(summary.audit).not.toMatch(/token|bal|38\.12/i);
  });

  it("keeps high-token round audits focused on cut counts", () => {
    const summary = new FeedbackSystem().summarize(
      fixtureWith({ category: "url", token_count: 8 }),
      scoreWith({ correctCuts: [1, 7], missedCuts: [15], falseCuts: [5], tokenCount: 8 })
    );

    expect(summary.audit).toBe("OK 2          MISS 1          FALSE 1");
    expect(summary.auditCompact).toBe(summary.audit);
  });

  it("keeps clean audit copy from inventing cost drivers", () => {
    const summary = new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1, 7, 15, 18], missedCuts: [], falseCuts: [], tokenCount: 5 })
    );

    expect(summary.audit).toBe("OK 4          MISS 0          FALSE 0");
    expect(summary.auditCompact).toBe(summary.audit);
  });

  it("keeps clean rounds from being overdiagnosed by category", () => {
    const summary = new FeedbackSystem().summarize(
      fixtureWith({ category: "filename", text: "hello_world_v2.py" }),
      scoreWith({ missedCuts: [], falseCuts: [], correctCuts: [5], accuracy: 1 })
    );

    expect(summary.technical).toBe("Clean segmentation.");
  });

  it("adds one compact next-prediction cue from resolved score evidence", () => {
    const feedback = new FeedbackSystem();

    expect(feedback.summarize(
      fixture,
      scoreWith({ missedCuts: [], falseCuts: [] })
    ).nextPredictionCue).toBe("Next: carry the confirmed route into the next prediction.");
    expect(feedback.summarize(
      fixture,
      scoreWith({ missedCuts: [7], falseCuts: [5] })
    ).nextPredictionCue).toBe("Next: compare MISS and FALSE before the next prediction.");
    expect(feedback.summarize(
      fixture,
      scoreWith({ missedCuts: [7], falseCuts: [] })
    ).nextPredictionCue).toBe("Next: inspect each MISS before the next prediction.");
    expect(feedback.summarize(
      fixture,
      scoreWith({ missedCuts: [], falseCuts: [5] })
    ).nextPredictionCue).toBe("Next: remove unconfirmed cuts before the next prediction.");
  });

  it("keeps next-prediction cues separate from token mappings", () => {
    const summary = new FeedbackSystem().summarize(fixture, scoreWith({ missedCuts: [7], falseCuts: [5] }));

    expect(summary.nextPredictionCue.length).toBeLessThanOrEqual(58);
    expect(summary.nextPredictionCue).not.toContain("->");
    expect(summary.nextPredictionCue).not.toContain("<");
    expect(summary.nextPredictionCue).not.toMatch(/cl100k_base|649|\u2420can/);
    expect(summary.nextPredictionCue).not.toBe(summary.tokenSplit);
  });

  it("uses v2 overseer categories for resolve reactions", () => {
    expect(new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1, 7], missedCuts: [], falseCuts: [] })
    ).wienerSpeech).toBe(linesJson.categories["play.resolve.perfect"].lines[2]);

    expect(new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1], missedCuts: [7], falseCuts: [] })
    ).wienerSpeech).toBe(linesJson.categories["play.resolve.missed"].lines[2]);

    expect(new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1], missedCuts: [], falseCuts: [7] })
    ).wienerSpeech).toBe(linesJson.categories["play.resolve.false_cut"].lines[2]);

    expect(new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1], missedCuts: [7], falseCuts: [2, 3, 4] })
    ).wienerSpeech).toBe(linesJson.categories["play.resolve.overcut"].lines[5]);

    expect(new FeedbackSystem().summarize(
      fixture,
      scoreWith({ correctCuts: [1], missedCuts: [7], falseCuts: [2] })
    ).wienerSpeech).toBe(linesJson.categories["play.resolve.mixed"].lines[3]);
  });

  it("names dense string fragmentation across URL, filename, code, hashtag, and tokenizer strings", () => {
    const feedback = new FeedbackSystem();

    for (const category of ["url", "filename", "code", "hashtag", "tokenizer_string"]) {
      const summary = feedback.summarize(
        fixtureWith({ category, text: category === "hashtag" ? "#GameDev2026" : "model_name=bun40_base" }),
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
    const spacingSummary = feedback.summarize(fixtureWith({ category: "spacing", text: "spaces matter" }), scoreWith());
    expect(spacingSummary.technical).toBe("Space-bearing token boundary mishandled.");
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
