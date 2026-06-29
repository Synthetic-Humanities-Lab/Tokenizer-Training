import { describe, expect, it } from "vitest";
import {
  computePlayLayout,
  shortLandscapeReviewColumns,
  type LayoutRect
} from "../src/game/systems/PlayLayoutSystem";
import {
  computeFeedbackCardLayout,
  computeFeedbackCardTextLayout,
  FEEDBACK_CARD_CONTROL_CLEARANCE
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
  const maxChars = Math.max(1, Math.floor(wordWrapWidth / (fontSize * 0.55)));
  const words = text.split(/\s+/);
  let lines = 1;
  let lineLength = 0;

  for (const word of words) {
    const nextLength = lineLength === 0 ? word.length : lineLength + 1 + word.length;
    if (nextLength <= maxChars) {
      lineLength = nextLength;
      continue;
    }

    lines += 1;
    lineLength = word.length;
  }

  return lines * fontSize * 1.25;
}

describe("computeFeedbackCardTextLayout", () => {
  it("keeps dense compact feedback copy inside a short-phone card", () => {
    const card = computeFeedbackCardLayout(320, 568);
    const text = computeFeedbackCardTextLayout(card);
    const cardBottom = card.y + card.height / 2;
    const technical = "Expected boundary missed.";
    const tokenSplit = "Tokens 6: <I> < can> <'t> < believe> < it> <.>";
    const economy = "Pay $0.00 - Cost $12.48 = Net -$12.48";
    const audit = "Boundary audit: OK 0 / Missed 5 / False 0 / Tokens 6 / Balance $27.52 / Cost drivers: missed, token load";
    const tokenBottom = text.tokenSplit.y + estimatedHeight(tokenSplit, text.tokenSplit.fontSize, text.tokenSplit.wordWrapWidth);
    const auditBottom = text.cuts.y + estimatedHeight(audit, text.cuts.fontSize, text.cuts.wordWrapWidth);

    expect(card.compact).toBe(true);
    expect(text.technical.fontSize).toBeLessThan(18);
    expect(text.tokenSplit.fontSize).toBeGreaterThanOrEqual(13);
    expect(text.economy.fontSize).toBeGreaterThanOrEqual(12);
    expect(text.cuts.fontSize).toBeGreaterThanOrEqual(9);
    expect(text.economy.x).toBe(card.x);
    expect(text.economy.originX).toBe(0.5);
    expect(text.economy.align).toBe("center");
    expect(text.cuts.x).toBe(card.x);
    expect(text.cuts.originX).toBe(0.5);
    expect(text.cuts.align).toBe("center");
    expect(text.technical.y + estimatedHeight(technical, text.technical.fontSize, text.technical.wordWrapWidth))
      .toBeLessThan(text.tokenSplit.y);
    expect(tokenBottom).toBeLessThanOrEqual(text.economy.y);
    expect(text.economy.y + estimatedHeight(economy, text.economy.fontSize, text.economy.wordWrapWidth))
      .toBeLessThan(text.cuts.y);
    expect(auditBottom).toBeLessThanOrEqual(cardBottom - 4);
  });

  it("uses larger desktop feedback typography for the combined review card", () => {
    const card = computeFeedbackCardLayout(1280, 720, undefined, {
      technical: "Expected boundary missed.",
      tokenSplit: "Tokens 6: <the> < cat> < sat> < on> < the> < mat>",
      economy: "Pay $0.00 - Cost $13.71 = Net -$13.71",
      economyTone: "loss",
      audit: "Boundary audit: OK 0 / Missed 5 / False 1 / Tokens 6 / Balance $26.29 / Cost drivers: missed, false, token load",
      overseer: "Review queued."
    });
    const text = computeFeedbackCardTextLayout(card);

    expect(card.compact).toBe(false);
    expect(card.width).toBeGreaterThanOrEqual(640);
    expect(card.width).toBeLessThanOrEqual(660);
    expect(card.height).toBe(160);
    expect(text.technical.fontSize).toBe(20);
    expect(text.tokenSplit.fontSize).toBe(20);
    expect(text.economy.fontSize).toBe(15);
    expect(text.cuts.fontSize).toBe(13);
    expect(text.technical.x).toBe(card.x);
    expect(text.technical.originX).toBe(0.5);
    expect(text.technical.align).toBe("center");
    expect(text.tokenSplit.x).toBe(card.x);
    expect(text.tokenSplit.originX).toBe(0.5);
    expect(text.tokenSplit.align).toBe("center");
    expect(text.economy.x).toBe(card.x);
    expect(text.economy.originX).toBe(0.5);
    expect(text.economy.align).toBe("center");
    expect(text.cuts.x).toBe(card.x);
    expect(text.cuts.originX).toBe(0.5);
    expect(text.cuts.align).toBe("center");
    expect(text.economy.y - text.tokenSplit.y).toBeLessThan(56);
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
    expect(text.technical.fontSize).toBeGreaterThanOrEqual(14);
    expect(text.tokenSplit.fontSize).toBeGreaterThanOrEqual(13);
    expect(edges(card).left).toBeGreaterThan(width / 2);
    expect(edges(card).top).toBeGreaterThanOrEqual(edges(reviewTextPanel).bottom + 8);
    expect(controlTop - edges(card).bottom).toBeGreaterThanOrEqual(FEEDBACK_CARD_CONTROL_CLEARANCE);
  });
});
