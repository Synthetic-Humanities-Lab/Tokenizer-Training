import { describe, expect, it } from "vitest";
import { computeMenuLayout } from "../src/game/systems/MenuLayoutSystem";
import {
  computePlayLayout,
  MIN_TOUCH_TARGET_SIZE,
  type LayoutRect
} from "../src/game/systems/PlayLayoutSystem";
import { computeResultsLayout, RESULT_LEDGER_LINE_COUNT, resultLedgerRect } from "../src/game/systems/ResultsLayoutSystem";
import { computeTutorialCompleteLayout } from "../src/game/systems/TutorialCompleteLayoutSystem";
import { computeFeedbackCardLayout } from "../src/game/ui/FeedbackCard";

const firstUserViewports = [
  { label: "small phone", width: 320, height: 568 },
  { label: "intermediate phone", width: 390, height: 620 },
  { label: "compact phone", width: 360, height: 740 },
  { label: "portrait phone", width: 390, height: 844 },
  { label: "large phone", width: 414, height: 896 },
  { label: "tall phone", width: 430, height: 932 },
  { label: "tablet portrait", width: 768, height: 1024 }
] as const;

const shortLandscapeHarnessViewports = [
  { label: "short desktop harness", width: 960, height: 520 },
  { label: "short wide desktop", width: 1280, height: 620 }
] as const;

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

function contains(outer: LayoutRect, inner: LayoutRect): boolean {
  const oe = edges(outer);
  const ie = edges(inner);
  return ie.left >= oe.left && ie.right <= oe.right && ie.top >= oe.top && ie.bottom <= oe.bottom;
}

function withinViewport(rect: LayoutRect, width: number, height: number): boolean {
  const re = edges(rect);
  return re.left >= 0 && re.right <= width && re.top >= 0 && re.bottom <= height;
}

function hasTouchTarget(rect: LayoutRect): boolean {
  return rect.width >= MIN_TOUCH_TARGET_SIZE && rect.height >= MIN_TOUCH_TARGET_SIZE;
}

describe("first-user responsive surface sweep", () => {
  it.each(firstUserViewports)("keeps menu actions bounded on $label", ({ width, height }) => {
    const layout = computeMenuLayout(width, height);

    expect(withinViewport(layout.card, width, height)).toBe(true);
    expect(contains(layout.card, layout.tutorialButton)).toBe(true);
    expect(contains(layout.card, layout.trainingButton)).toBe(true);
    expect(contains(layout.card, layout.tokenLogButton)).toBe(true);
    expect(contains(layout.card, layout.settingsButton)).toBe(true);
    expect(overlaps(layout.tutorialButton, layout.trainingButton)).toBe(false);
    expect(overlaps(layout.trainingButton, layout.tokenLogButton)).toBe(false);
    expect(overlaps(layout.tokenLogButton, layout.settingsButton)).toBe(false);
    expect(hasTouchTarget(layout.tutorialButton)).toBe(true);
    expect(hasTouchTarget(layout.trainingButton)).toBe(true);
    expect(hasTouchTarget(layout.tokenLogButton)).toBe(true);
    expect(hasTouchTarget(layout.settingsButton)).toBe(true);
  });

  it.each(firstUserViewports)("keeps play controls and active/review text separated on $label", ({ width, height }) => {
    const layout = computePlayLayout({ width, height });
    const activeTextPanel = {
      ...layout.textPanel,
      y: layout.sentenceActiveY
    };
    const startingTextPanel = {
      ...layout.textPanel,
      y: layout.sentenceStartY
    };
    const reviewTextPanel = {
      ...layout.textPanel,
      y: layout.sentenceReviewY
    };
    for (const rect of [
      layout.playfield,
      layout.chrome,
      layout.resolveButton,
      layout.clearButton,
      layout.undoButton,
      layout.exitButton,
      activeTextPanel,
      reviewTextPanel
    ]) {
      expect(withinViewport(rect, width, height)).toBe(true);
    }

    expect(overlaps(layout.resolveButton, layout.clearButton)).toBe(false);
    expect(overlaps(layout.clearButton, layout.undoButton)).toBe(false);
    expect(overlaps(activeTextPanel, layout.resolveButton)).toBe(false);
    expect(overlaps(activeTextPanel, layout.clearButton)).toBe(false);
    expect(overlaps(activeTextPanel, layout.undoButton)).toBe(false);
    expect(overlaps(activeTextPanel, layout.petWienerSlot)).toBe(false);
    expect(overlaps(reviewTextPanel, layout.resolveButton)).toBe(false);
    expect(overlaps(startingTextPanel, layout.petWienerSlot)).toBe(false);
    expect(edges(layout.resolveButton).top).toBeGreaterThan(edges(layout.chrome).bottom);
    expect(hasTouchTarget(layout.resolveButton)).toBe(true);
    expect(hasTouchTarget(layout.clearButton)).toBe(true);
    expect(hasTouchTarget(layout.undoButton)).toBe(true);
    expect(hasTouchTarget(layout.exitButton)).toBe(true);
  });

  it.each(firstUserViewports)("keeps combined review feedback bounded below the prompt on $label", ({ width, height }) => {
    const layout = computePlayLayout({ width, height });
    const feedback = computeFeedbackCardLayout(width, height);
    const reviewTextPanel = {
      ...layout.textPanel,
      y: layout.sentenceReviewY
    };

    expect(withinViewport(feedback, width, height)).toBe(true);
    expect(overlaps(reviewTextPanel, feedback)).toBe(false);
    expect(overlaps(feedback, layout.resolveButton)).toBe(false);
    expect(overlaps(feedback, layout.clearButton)).toBe(false);
    expect(overlaps(feedback, layout.undoButton)).toBe(false);
    expect(overlaps(feedback, layout.exitButton)).toBe(false);
    expect(edges(feedback).top - edges(reviewTextPanel).bottom).toBeGreaterThanOrEqual(8);
    expect(edges(feedback).bottom).toBeLessThanOrEqual(height - 16);
  });

  it.each(firstUserViewports)("keeps tutorial handoff actions bounded on $label", ({ width, height }) => {
    const layout = computeTutorialCompleteLayout(width, height);

    expect(withinViewport(layout.panel, width, height)).toBe(true);
    expect(contains(layout.panel, layout.primaryButton)).toBe(true);
    expect(contains(layout.panel, layout.menuButton)).toBe(true);
    expect(overlaps(layout.primaryButton, layout.menuButton)).toBe(false);
    expect(hasTouchTarget(layout.primaryButton)).toBe(true);
    expect(hasTouchTarget(layout.menuButton)).toBe(true);
  });

  it.each(firstUserViewports)("keeps result ledger and actions bounded on $label", ({ width, height }) => {
    const layout = computeResultsLayout(width, height);
    const ledger = resultLedgerRect(layout, RESULT_LEDGER_LINE_COUNT);

    expect(withinViewport(layout.panel, width, height)).toBe(true);
    expect(contains(layout.panel, ledger)).toBe(true);
    expect(contains(layout.panel, layout.copyButton)).toBe(true);
    expect(contains(layout.panel, layout.againButton)).toBe(true);
    expect(contains(layout.panel, layout.menuButton)).toBe(true);
    expect(overlaps(ledger, layout.copyButton)).toBe(false);
    expect(overlaps(layout.copyButton, layout.againButton)).toBe(false);
    expect(overlaps(layout.againButton, layout.menuButton)).toBe(false);
    expect(hasTouchTarget(layout.copyButton)).toBe(true);
    expect(hasTouchTarget(layout.againButton)).toBe(true);
    expect(hasTouchTarget(layout.menuButton)).toBe(true);
  });

  it.each(shortLandscapeHarnessViewports)("keeps short-landscape combined review feedback clear of prompt and controls on $label", ({ width, height }) => {
    const layout = computePlayLayout({ width, height });
    const feedback = computeFeedbackCardLayout(width, height, layout.contentPanel);
    const reviewTextPanel = {
      ...layout.textPanel,
      y: layout.sentenceReviewY
    };

    expect(layout.compact).toBe(false);
    expect(feedback.shortLandscape).toBe(true);
    expect(withinViewport(feedback, width, height)).toBe(true);
    expect(overlaps(reviewTextPanel, feedback)).toBe(false);
    expect(overlaps(feedback, layout.resolveButton)).toBe(false);
    expect(overlaps(feedback, layout.clearButton)).toBe(false);
    expect(overlaps(feedback, layout.undoButton)).toBe(false);
    expect(overlaps(feedback, layout.exitButton)).toBe(false);
    expect(edges(feedback).bottom).toBeLessThanOrEqual(edges(layout.resolveButton).top - 12);
  });
});
