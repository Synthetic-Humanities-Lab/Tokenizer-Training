import { describe, expect, it } from "vitest";
import fixturesJson from "../src/game/data/fixtures.json";
import { FeedbackSystem } from "../src/game/systems/FeedbackSystem";
import {
  computePlayLayout,
  shortLandscapeReviewColumns,
  type LayoutRect
} from "../src/game/systems/PlayLayoutSystem";
import type { RoundScoreResult } from "../src/game/systems/ScoringSystem";
import { displayTokenSegment } from "../src/game/systems/TokenDisplaySystem";
import type { TokenFixture } from "../src/game/systems/TokenizerSystem";
import {
  computeFeedbackCardLayout,
  computeFeedbackCardTextLayout,
  FEEDBACK_CARD_CONTROL_CLEARANCE,
  feedbackAuditTextForLayout
} from "../src/game/ui/FeedbackCard";

function edges(rect: LayoutRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function overlaps(a: LayoutRect, b: LayoutRect): boolean {
  const ae = edges(a);
  const be = edges(b);
  return ae.left < be.right && ae.right > be.left && ae.top < be.bottom && ae.bottom > be.top;
}

function estimatedHeight(text: string, fontSize: number, wordWrapWidth: number): number {
  return estimatedWrappedLineCount(text, fontSize, wordWrapWidth) * fontSize * 1.25;
}

function estimatedWrappedLineCount(text: string, fontSize: number, wordWrapWidth: number): number {
  const maxChars = Math.max(1, Math.floor(wordWrapWidth / (fontSize * 0.55)));
  let lines = 0;

  for (const explicitLine of text.split("\n")) {
    const words = explicitLine.split(/\s+/);
    let wrappedLines = 1;
    let lineLength = 0;

    for (const word of words) {
      const nextLength = lineLength === 0 ? word.length : lineLength + 1 + word.length;
      if (nextLength <= maxChars) {
        lineLength = nextLength;
        continue;
      }

      wrappedLines += 1;
      lineLength = word.length;
    }

    lines += wrappedLines;
  }

  return lines;
}

function estimatedMaxCharsPerLine(fontSize: number, wordWrapWidth: number): number {
  return Math.max(1, Math.floor(wordWrapWidth / (fontSize * 0.55)));
}

function tokenEvidenceSegment(token: string): string {
  return displayTokenSegment(token);
}

function assertTextStackFitsCard(
  card: LayoutRect,
  text: ReturnType<typeof computeFeedbackCardTextLayout>,
  content: { tokenSplit: string; economy: string; audit: string }
): void {
  const cardBottom = edges(card).bottom;

  expect(text.tokenHeader.y).toBeLessThan(text.tokenSplit.y);
  expect(text.tokenSplit.y + estimatedHeight(content.tokenSplit, text.tokenSplit.fontSize, text.tokenSplit.wordWrapWidth))
    .toBeLessThanOrEqual(text.ledgerHeader.y);
  expect(text.ledgerHeader.y).toBeLessThan(text.economy.y);
  expect(text.economy.y + estimatedHeight(content.economy, text.economy.fontSize, text.economy.wordWrapWidth))
    .toBeLessThanOrEqual(text.cuts.y);
  expect(text.cuts.y + estimatedHeight(content.audit, text.cuts.fontSize, text.cuts.wordWrapWidth))
    .toBeLessThanOrEqual(cardBottom - 2);
}

function worstCaseReviewScore(fixture: TokenFixture): RoundScoreResult {
  return {
    correctCuts: [],
    missedCuts: fixture.boundary_positions,
    falseCuts: [2, 4, 6].filter((cut) => !fixture.boundary_positions.includes(cut)),
    accuracy: 0,
    verifiedTokenIndexes: [],
    reworkTokenIndexes: Array.from({ length: fixture.token_count }, (_, index) => index),
    verifiedCredits: 0,
    reworkCredits: fixture.token_count + 3,
    creditDelta: -(fixture.token_count + 3),
    tokenCount: fixture.token_count
  };
}

describe("computeFeedbackCardTextLayout", () => {
  it("keeps dense compact feedback copy inside a short-phone card", () => {
    const card = computeFeedbackCardLayout(320, 568);
    const text = computeFeedbackCardTextLayout(card);
    const cardBottom = card.y + card.height / 2;
    const tokenSplit = "I │ ␠can │ 't │ ␠believe │ ␠it │ .";
    const economy = "VERIFIED +0 TC   REWORK -12 TC";
    const audit = "OK 0          MISS 5          FALSE 0";
    const tokenBottom = text.tokenSplit.y + estimatedHeight(tokenSplit, text.tokenSplit.fontSize, text.tokenSplit.wordWrapWidth);
    const auditBottom = text.cuts.y + estimatedHeight(audit, text.cuts.fontSize, text.cuts.wordWrapWidth);

    expect(card.compact).toBe(true);
    expect(text.tokenHeader.fontSize).toBeGreaterThanOrEqual(9);
    expect(text.tokenSplit.fontSize).toBeGreaterThanOrEqual(11);
    expect(text.economy.fontSize).toBeGreaterThanOrEqual(9);
    expect(text.cuts.fontSize).toBeGreaterThanOrEqual(10);
    expect(text.economy.align).toBe("left");
    expect(text.net.align).toBe("right");
    expect(text.cuts.x).toBe(card.x);
    expect(text.cuts.originX).toBe(0.5);
    expect(text.cuts.align).toBe("center");
    expect(tokenBottom).toBeLessThanOrEqual(text.economy.y);
    expect(auditBottom).toBeLessThanOrEqual(cardBottom - 4);
    assertTextStackFitsCard(card, text, { tokenSplit, economy, audit });
  });

  it("uses larger desktop feedback typography for the combined review card", () => {
    const card = computeFeedbackCardLayout(1280, 720, undefined, {
      technical: "Expected boundary missed.",
      nextPredictionCue: "Next: inspect each MISS before the next prediction.",
      tokenCount: 6,
      tokenSplit: "the │ ␠cat │ ␠sat │ ␠on │ ␠the │ ␠mat",
      creditLedger: "VERIFIED +0 TC   REWORK -14 TC   NET -14 TC",
      creditBreakdown: "VERIFIED +0 TC   REWORK -14 TC",
      creditDelta: "NET -14 TC",
      creditTone: "loss",
      audit: "OK 0          MISS 5          FALSE 1",
      auditCompact: "OK 0          MISS 5          FALSE 1",
      wienerSpeech: "Review queued."
    });
    const text = computeFeedbackCardTextLayout(card);

    expect(card.compact).toBe(false);
    expect(card.width).toBeGreaterThanOrEqual(560);
    expect(card.width).toBeLessThanOrEqual(660);
    expect(card.height).toBe(160);
    expect(text.tokenHeader.fontSize).toBe(11);
    expect(text.tokenSplit.fontSize).toBe(18);
    expect(text.economy.fontSize).toBe(13);
    expect(text.cuts.fontSize).toBe(13);
    expect(text.tokenHeader.align).toBe("left");
    expect(text.tokenCount.align).toBe("right");
    expect(text.tokenSplit.x).toBe(card.x);
    expect(text.tokenSplit.originX).toBe(0.5);
    expect(text.tokenSplit.align).toBe("center");
    expect(text.economy.align).toBe("left");
    expect(text.net.align).toBe("right");
    expect(text.cuts.x).toBe(card.x);
    expect(text.cuts.originX).toBe(0.5);
    expect(text.cuts.align).toBe("center");
    expect(text.tokenSplit.y).toBeLessThan(text.economy.y);
    expect(text.ledgerHeader.y - text.tokenSplit.y).toBeGreaterThanOrEqual(50);
  });

  it("uses compact audit copy only for compact mobile-surface feedback", () => {
    const summary = {
      technical: "Expected boundary missed.",
      nextPredictionCue: "Next: inspect each MISS before the next prediction.",
      tokenCount: 6,
      tokenSplit: "the │ ␠cat │ ␠sat │ ␠on │ ␠the │ ␠mat",
      creditLedger: "VERIFIED +0 TC   REWORK -14 TC   NET -14 TC",
      creditBreakdown: "VERIFIED +0 TC   REWORK -14 TC",
      creditDelta: "NET -14 TC",
      creditTone: "loss" as const,
      audit: "OK 0          MISS 5          FALSE 1",
      auditCompact: "OK 0          MISS 5          FALSE 1",
      wienerSpeech: "Review queued."
    };

    expect(feedbackAuditTextForLayout(summary, { compact: true }, "mobile")).toBe(summary.auditCompact);
    expect(feedbackAuditTextForLayout(summary, { compact: true }, "browser")).toBe(summary.audit);
    expect(feedbackAuditTextForLayout(summary, { compact: false }, "mobile")).toBe(summary.audit);
  });

  it("keeps hidden/default desktop feedback narrower than a full-width panel", () => {
    const card = computeFeedbackCardLayout(1280, 720);

    expect(card.compact).toBe(false);
    expect(card.width).toBe(640);
  });

  it("keeps desktop review feedback visually clear of the bottom control row", () => {
    const layout = computePlayLayout({ width: 960, height: 720 });
    const card = computeFeedbackCardLayout(960, 720, layout.contentPanel);
    const controlTop = Math.min(
      edges(layout.resolveButton).top,
      edges(layout.clearButton).top,
      edges(layout.muteButton).top,
      edges(layout.exitButton).top
    );

    expect(card.compact).toBe(false);
    expect(controlTop - edges(card).bottom).toBeGreaterThanOrEqual(FEEDBACK_CARD_CONTROL_CLEARANCE);
  });

  it.each([
    { label: "intermediate top-control phone", width: 390, height: 620 },
    { label: "compact bottom-control phone", width: 390, height: 720 }
  ])("keeps compact combined review feedback below the prompt and clear of controls on $label", ({ width, height }) => {
    const play = computePlayLayout({ width, height });
    const reviewTextPanel = {
      ...play.textPanel,
      y: play.sentenceReviewY
    };
    const card = computeFeedbackCardLayout(width, height);
    const controlTop = Math.min(
      edges(play.resolveButton).top,
      edges(play.clearButton).top,
      edges(play.muteButton).top,
      edges(play.exitButton).top
    );

    expect(card.compact).toBe(true);
    expect(edges(card).top - edges(reviewTextPanel).bottom).toBeGreaterThanOrEqual(12);
    if (controlTop > edges(reviewTextPanel).bottom) {
      expect(controlTop - edges(card).bottom).toBeGreaterThanOrEqual(FEEDBACK_CARD_CONTROL_CLEARANCE);
    } else {
      expect(edges(card).bottom).toBeLessThanOrEqual(height - 16);
    }
  });

  it("keeps mobile-surface short-phone review feedback between the prompt and bottom controls", () => {
    const width = 368;
    const height = 552;
    const play = computePlayLayout({ width, height, surfaceProfile: "mobile" });
    const reviewTextPanel = {
      ...play.textPanel,
      y: play.sentenceReviewY
    };
    const card = computeFeedbackCardLayout(width, height, play.contentPanel, undefined, undefined, "mobile");
    const controlTop = Math.min(
      edges(play.resolveButton).top,
      edges(play.clearButton).top,
      edges(play.muteButton).top,
      edges(play.exitButton).top
    );

    expect(card.compact).toBe(true);
    expect(edges(card).top - edges(reviewTextPanel).bottom).toBeGreaterThanOrEqual(16);
    expect(controlTop - edges(card).bottom).toBeGreaterThanOrEqual(FEEDBACK_CARD_CONTROL_CLEARANCE);
    expect(overlaps(card, play.resolveButton)).toBe(false);
  });

  it("keeps short-phone mobile feedback evidence readable inside the review card", () => {
    const width = 368;
    const height = 552;
    const play = computePlayLayout({ width, height, surfaceProfile: "mobile" });
    const card = computeFeedbackCardLayout(width, height, play.contentPanel, undefined, undefined, "mobile");
    const text = computeFeedbackCardTextLayout(card);
    const cardBottom = edges(card).bottom;
    const tokenSplit = "the │ ␠cat │ ␠sat │ ␠on │ ␠the │ ␠mat";
    const economy = "VERIFIED +6 TC   REWORK -0 TC";
    const audit = "OK 5          MISS 0          FALSE 0";

    expect(play.sentenceReviewY).toBeLessThan(play.sentenceActiveY);
    expect(play.sentenceActiveY - play.sentenceReviewY).toBeGreaterThanOrEqual(32);
    expect(card.height).toBe(148);
    expect(text.tokenHeader.fontSize).toBe(11);
    expect(text.tokenSplit.fontSize).toBe(13);
    expect(text.economy.fontSize).toBe(11);
    expect(text.cuts.fontSize).toBe(11);
    assertTextStackFitsCard(card, text, { tokenSplit, economy, audit });
  });

  it("keeps two-line compact mobile feedback headlines clear of token evidence", () => {
    const width = 368;
    const height = 800;
    const play = computePlayLayout({ width, height, surfaceProfile: "mobile" });
    const card = computeFeedbackCardLayout(width, height, play.contentPanel, undefined, undefined, "mobile");
    const text = computeFeedbackCardTextLayout(card);
    const tokenSplit = "the │ ␠cat │ ␠sat │ ␠on │ ␠the │ ␠mat";
    const economy = "VERIFIED +3 TC   REWORK -10 TC";
    const audit = "OK 3          MISS 2          FALSE 4";

    expect(card.height).toBeGreaterThanOrEqual(164);
    assertTextStackFitsCard(card, text, { tokenSplit, economy, audit });
  });

  it("keeps every generated fixture's compact mobile review evidence inside the short-phone card", () => {
    const width = 368;
    const height = 552;
    const play = computePlayLayout({ width, height, surfaceProfile: "mobile" });
    const card = computeFeedbackCardLayout(width, height, play.contentPanel, undefined, undefined, "mobile");
    const text = computeFeedbackCardTextLayout(card);
    const feedback = new FeedbackSystem();

    for (const fixture of fixturesJson as TokenFixture[]) {
      const summary = feedback.summarize(fixture, worstCaseReviewScore(fixture));

      assertTextStackFitsCard(card, text, {
        tokenSplit: summary.tokenSplit,
        economy: summary.creditBreakdown,
        audit: feedbackAuditTextForLayout(summary, card, "mobile")
      });
    }
  });

  it("keeps generated fixture token-split evidence within the compact mobile growth envelope", () => {
    const width = 368;
    const height = 552;
    const play = computePlayLayout({ width, height, surfaceProfile: "mobile" });
    const card = computeFeedbackCardLayout(width, height, play.contentPanel, undefined, undefined, "mobile");
    const text = computeFeedbackCardTextLayout(card);
    const feedback = new FeedbackSystem();
    const maxTokenSplitLines = 3;
    const maxSegmentChars = estimatedMaxCharsPerLine(text.tokenSplit.fontSize, text.tokenSplit.wordWrapWidth);

    for (const fixture of fixturesJson as TokenFixture[]) {
      const summary = feedback.summarize(fixture, worstCaseReviewScore(fixture));
      const lineCount = estimatedWrappedLineCount(
        summary.tokenSplit,
        text.tokenSplit.fontSize,
        text.tokenSplit.wordWrapWidth
      );
      const overlongSegments = fixture.token_strings
        .map(tokenEvidenceSegment)
        .filter((segment) => segment.length > maxSegmentChars);

      expect(lineCount, `${fixture.id} token split line count`).toBeLessThanOrEqual(maxTokenSplitLines);
      expect(overlongSegments, `${fixture.id} overlong token evidence segments`).toEqual([]);
    }
  });

  it("uses a dense right review column on short landscape desktop viewports", () => {
    const width = 960;
    const height = 520;
    const play = computePlayLayout({ width, height });
    const reviewTextPanel = {
      ...play.textPanel,
      y: play.sentenceReviewY
    };
    const card = computeFeedbackCardLayout(width, height, play.contentPanel);
    const text = computeFeedbackCardTextLayout(card);
    const columns = shortLandscapeReviewColumns({ width, height });
    const controlTop = Math.min(
      edges(play.resolveButton).top,
      edges(play.clearButton).top,
      edges(play.muteButton).top,
      edges(play.exitButton).top
    );

    expect(card.compact).toBe(false);
    expect(card.shortLandscape).toBe(true);
    expect(card.x).toBe(columns.feedback.x);
    expect(card.width).toBe(columns.feedback.width);
    expect(text.tokenHeader.fontSize).toBeGreaterThanOrEqual(9);
    expect(text.tokenSplit.fontSize).toBeGreaterThanOrEqual(12);
    expect(edges(card).left).toBeGreaterThan(width / 2);
    expect(edges(card).top).toBeGreaterThanOrEqual(edges(reviewTextPanel).bottom + 8);
    expect(controlTop - edges(card).bottom).toBeGreaterThanOrEqual(FEEDBACK_CARD_CONTROL_CLEARANCE);
  });
});
