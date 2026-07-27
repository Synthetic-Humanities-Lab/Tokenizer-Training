import { describe, expect, it } from "vitest";
import {
  computeResultMetricTypography,
  computeResultsLayout,
  RESULT_LEDGER_LINE_COUNT,
  RESULT_METRIC_LABEL_FONT_SIZE,
  resultLedgerRect,
  resultLedgerRowHeight,
  type ResultsLayout
} from "../src/game/systems/ResultsLayoutSystem";
import { SessionFlowSystem } from "../src/game/systems/SessionFlowSystem";
import type { LayoutRect } from "../src/game/systems/PlayLayoutSystem";

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

function ledgerBlock(layout: ResultsLayout): LayoutRect {
  return resultLedgerRect(layout, RESULT_LEDGER_LINE_COUNT);
}

function metricBlock(layout: ResultsLayout): LayoutRect {
  const left = Math.min(...layout.metricCards.map((card) => edges(card).left));
  const right = Math.max(...layout.metricCards.map((card) => edges(card).right));
  const top = Math.min(...layout.metricCards.map((card) => edges(card).top));
  const bottom = Math.max(...layout.metricCards.map((card) => edges(card).bottom));

  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2,
    width: right - left,
    height: bottom - top
  };
}

function estimatedTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.55;
}

function estimatedWrappedLineCount(text: string, fontSize: number, wordWrapWidth: number): number {
  const maxCharsPerLine = Math.max(1, Math.floor(wordWrapWidth / (fontSize * 0.55)));
  const words = text.split(/\s+/).filter(Boolean);
  let lineCount = 1;
  let currentLineLength = 0;

  for (const word of words) {
    const nextLength = currentLineLength === 0 ? word.length : currentLineLength + 1 + word.length;
    if (nextLength <= maxCharsPerLine) {
      currentLineLength = nextLength;
      continue;
    }

    lineCount += 1;
    currentLineLength = word.length;
  }

  return lineCount;
}

function estimatedTextBlock(x: number, y: number, text: string, fontSize: number, wordWrapWidth: number): LayoutRect {
  const lineCount = estimatedWrappedLineCount(text, fontSize, wordWrapWidth);
  return {
    x,
    y,
    width: wordWrapWidth,
    height: lineCount * fontSize * 1.25
  };
}

const LONGEST_RANK = "Temporary Sequence Specialist";

function expectRankTypographyFits(layout: ResultsLayout): void {
  const rankCard = layout.metricCards.at(-1);
  expect(rankCard).toBeDefined();
  if (!rankCard) {
    return;
  }

  const typography = computeResultMetricTypography(layout, rankCard, LONGEST_RANK, { maxValueLines: 2 });
  const estimatedValueHeight = typography.estimatedValueLineCount * typography.valueFontSize * 1.15;

  expect(typography.labelFontSize).toBeGreaterThanOrEqual(11);
  expect(typography.labelFontSize).toBe(RESULT_METRIC_LABEL_FONT_SIZE);
  expect(typography.estimatedValueLineCount).toBeLessThanOrEqual(2);
  expect(typography.valueTopOffset + estimatedValueHeight).toBeLessThanOrEqual(rankCard.height - 2);
}

describe("computeResultsLayout", () => {
  it("keeps portrait termination actions inside the results panel", () => {
    const layout = computeResultsLayout(390, 844);
    const metrics = metricBlock(layout);

    expect(layout.compact).toBe(true);
    expect(withinViewport(layout.panel, 390, 844)).toBe(true);
    expect(contains(layout.panel, layout.copyButton)).toBe(true);
    expect(contains(layout.panel, layout.againButton)).toBe(true);
    expect(contains(layout.panel, layout.menuButton)).toBe(true);
    expect(layout.copyButton.x).toBe(layout.panel.x);
    expect(layout.againButton.x).toBe(layout.panel.x);
    expect(layout.menuButton.x).toBe(layout.panel.x);
    expect(overlaps(layout.copyButton, layout.againButton)).toBe(false);
    expect(overlaps(layout.againButton, layout.menuButton)).toBe(false);
    expect(overlaps(metrics, layout.copyButton)).toBe(false);
    expect(edges(layout.copyButton).top).toBeGreaterThan(edges(metrics).bottom + 8);
    expect(layout.metricCards).toHaveLength(5);
    expect(layout.metricCards[4]?.width).toBeGreaterThan(layout.metricCards[0]?.width ?? 0);
    expect(layout.metricCards[4]?.x).toBe(layout.panel.x);
  });

  it("keeps narrow portrait metric cards comfortably inside the panel", () => {
    const layout = computeResultsLayout(320, 568);
    const metrics = metricBlock(layout);

    expect(withinViewport(layout.panel, 320, 568)).toBe(true);
    expect(contains(layout.panel, layout.copyButton)).toBe(true);
    expect(contains(layout.panel, layout.againButton)).toBe(true);
    expect(contains(layout.panel, layout.menuButton)).toBe(true);
    expect(layout.metricCards).toHaveLength(5);
    expect(contains(layout.panel, metrics)).toBe(true);
    expect(layout.metricCards[4]?.width).toBeGreaterThanOrEqual(layout.panel.width - 48);
    expect(layout.metricCards[4]?.x).toBe(layout.panel.x);
    expect(layout.againButton.width).toBeLessThanOrEqual(layout.panel.width - 48);
    expect(layout.copyButton.width).toBe(layout.againButton.width);
    expect(layout.menuButton.width).toBe(layout.againButton.width);
    expect(edges(layout.menuButton).bottom).toBeLessThanOrEqual(edges(layout.panel).bottom);
    expect(overlaps(metrics, layout.copyButton)).toBe(false);
    expect(edges(layout.copyButton).top).toBeGreaterThan(edges(metrics).bottom + 8);
  });

  it("uses a larger two-by-two compact grid when budget results expose four metrics", () => {
    const defaultLayout = computeResultsLayout(320, 568);
    const layout = computeResultsLayout(320, 568, undefined, { metricCount: 4 });
    const metrics = metricBlock(layout);

    expect(layout.metricCards).toHaveLength(4);
    expect(contains(layout.panel, metrics)).toBe(true);
    expect(layout.metricCards[0]?.height).toBeGreaterThan(defaultLayout.metricCards[0]?.height ?? 0);
    expect(layout.metricCards[3]?.width).toBe(layout.metricCards[0]?.width);
    expect(layout.metricCards[3]?.x).toBeGreaterThan(layout.panel.x);
    expect(layout.metricCards[0]?.y).toBe(layout.metricCards[1]?.y);
    expect(layout.metricCards[2]?.y).toBe(layout.metricCards[3]?.y);
    expectRankTypographyFits(layout);
    expect(overlaps(metrics, layout.copyButton)).toBe(false);
    expect(edges(layout.copyButton).top).toBeGreaterThan(edges(metrics).bottom + 8);
  });

  it.each([
    { label: "small phone", width: 320, height: 568 },
    { label: "short standard phone", width: 368, height: 552 }
  ])("keeps accessible five-card metrics clear on $label", ({ width, height }) => {
    const layout = computeResultsLayout(width, height, undefined, { metricCount: 5 });
    const metrics = metricBlock(layout);

    expect(layout.metricCards).toHaveLength(5);
    expect(layout.metricCards.every((card) => card.height >= 34)).toBe(true);
    expect(contains(layout.panel, metrics)).toBe(true);
    expect(edges(layout.copyButton).top).toBeGreaterThan(edges(metrics).bottom + 8);
    expectRankTypographyFits(layout);
  });

  it("keeps both result variants inside a 390x844 safe area", () => {
    const width = 390;
    const height = 844;
    const safeArea = { top: 59, right: 0, bottom: 34, left: 0 };

    for (const metricCount of [4, 5]) {
      const layout = computeResultsLayout(width, height, safeArea, { metricCount });
      const panelEdges = edges(layout.panel);
      const metrics = metricBlock(layout);

      expect(panelEdges.top).toBeGreaterThanOrEqual(safeArea.top);
      expect(panelEdges.bottom).toBeLessThanOrEqual(height - safeArea.bottom);
      expect(contains(layout.panel, metrics)).toBe(true);
      expect(contains(layout.panel, layout.copyButton)).toBe(true);
      expect(contains(layout.panel, layout.againButton)).toBe(true);
      expect(contains(layout.panel, layout.menuButton)).toBe(true);
      expect(edges(layout.copyButton).top).toBeGreaterThan(edges(metrics).bottom + 8);
      expectRankTypographyFits(layout);
    }
  });

  it("keeps small-phone title, summary, and compact ledger text within the panel", () => {
    const width = 320;
    const height = 568;
    const layout = computeResultsLayout(width, height);
    const ledgerText = new SessionFlowSystem().compactResultLedgerText({
      runId: "mtt-protocol-qa",
      rounds: 7,
      creditBalance: 12,
      accuracy: 0.625,
      totalCorrectCuts: 5,
      totalMissedCuts: 3,
      totalFalseCuts: 2,
      startSource: "handoff-screen",
      inputModality: "touch",
      totalVerifiedCredits: 21,
      totalReworkCredits: 49,
      creditEfficiency: 0.43,
      rank: "Junior Boundary Clerk",
      bestRounds: 7,
      bestRank: "Junior Boundary Clerk"
    });
    const textAvailableWidth = resultLedgerRect(layout, ledgerText.split("\n").length).width - 28;

    expect(layout.title.fontSize).toBeLessThanOrEqual(24);
    expect(layout.summary.fontSize).toBeLessThan(17);
    expect(ledgerText.split("\n")).toHaveLength(7);
    expect(resultLedgerRowHeight(layout)).toBeGreaterThan(layout.ledger.fontSize * 1.3);
    for (const line of ledgerText.split("\n")) {
      expect(estimatedTextWidth(line, layout.ledger.fontSize), line).toBeLessThanOrEqual(textAvailableWidth);
    }
  });

  it("keeps compact ledger row rules clear of the text block and result actions", () => {
    const layout = computeResultsLayout(320, 568);
    const lineCount = 7;
    const ledger = resultLedgerRect(layout, lineCount);
    const estimatedTextHeight = lineCount * layout.ledger.fontSize * 1.25 + (lineCount - 1) * layout.ledger.lineSpacing;

    expect(ledger.height).toBeGreaterThan(estimatedTextHeight);
    expect(edges(layout.copyButton).top).toBeGreaterThan(edges(ledger).bottom + 8);
  });

  it("keeps the small-phone result title and summary from colliding when the title wraps", () => {
    const layout = computeResultsLayout(320, 568);
    const title = estimatedTextBlock(
      layout.title.x,
      layout.title.y,
      "Token Credits Depleted",
      layout.title.fontSize,
      layout.title.wordWrapWidth
    );
    const summary = estimatedTextBlock(
      layout.summary.x,
      layout.summary.y,
      "Your account no longer contains enough Token Credits to correct your output. Training access revoked.",
      layout.summary.fontSize,
      layout.summary.wordWrapWidth
    );

    expect(overlaps(title, summary)).toBe(false);
    expect(edges(summary).top).toBeGreaterThan(edges(title).bottom + 6);
    expect(edges(summary).bottom).toBeLessThan(edges(metricBlock(layout)).top);
  });

  it.each([
    { width: 320, height: 568 },
    { width: 368, height: 552 }
  ])("keeps compact result copy in one deliberate vertical group at $width x $height", ({ width, height }) => {
    const variants = [
      {
        title: "Training Suspended",
        summary:
          "Session closed by operator request. WienerWorks preserved the usable portion and most of the causes. Review the Token Log to learn which boundaries you missed before resuming."
      },
      {
        title: "Token Credits Depleted",
        summary:
          "Your account no longer contains enough Token Credits to correct your output. Training access revoked. Review the Token Log to learn which boundaries you missed before retraining."
      }
    ];

    for (const variant of variants) {
      const metricCount = variant.title === "Token Credits Depleted" ? 4 : 5;
      const layout = computeResultsLayout(width, height, undefined, { metricCount });
      const title = estimatedTextBlock(
        layout.title.x,
        layout.title.y,
        variant.title,
        layout.title.fontSize,
        layout.title.wordWrapWidth
      );
      const summary = estimatedTextBlock(
        layout.summary.x,
        layout.summary.y,
        variant.summary,
        layout.summary.fontSize,
        layout.summary.wordWrapWidth
      );
      const titleToSummaryGap = edges(summary).top - edges(title).bottom;
      const summaryToMetricsGap = edges(metricBlock(layout)).top - edges(summary).bottom;

      expect(titleToSummaryGap).toBeGreaterThan(6);
      expect(titleToSummaryGap).toBeLessThan(40);
      expect(summaryToMetricsGap).toBeGreaterThan(8);
    }
  });

  it("keeps desktop results chrome, metric cards, and choices aligned", () => {
    const layout = computeResultsLayout(1280, 720);
    const metrics = metricBlock(layout);

    expect(layout.compact).toBe(false);
    expect(layout.panel.width).toBe(680);
    expect(layout.againButton.width).toBe(280);
    expect(contains(layout.panel, layout.copyButton)).toBe(true);
    expect(contains(layout.panel, layout.againButton)).toBe(true);
    expect(contains(layout.panel, layout.menuButton)).toBe(true);
    expect(layout.metricCards).toHaveLength(5);
    expect(contains(layout.panel, metrics)).toBe(true);
    expect(layout.copyButton.x).toBe(layout.againButton.x);
    expect(layout.againButton.x).toBe(layout.menuButton.x);
    expect(layout.copyButton.y).toBeLessThan(layout.againButton.y);
    expect(layout.againButton.y).toBeLessThan(layout.menuButton.y);
    expect(overlaps(metrics, layout.copyButton)).toBe(false);
    expect(edges(layout.copyButton).top).toBeGreaterThan(edges(metrics).bottom + 8);
    expectRankTypographyFits(layout);
  });

  it("keeps the four-card desktop budget treatment and longest rank bounded", () => {
    const layout = computeResultsLayout(1280, 720, undefined, { metricCount: 4 });
    const metrics = metricBlock(layout);

    expect(layout.compact).toBe(false);
    expect(layout.metricCards).toHaveLength(4);
    expect(contains(layout.panel, metrics)).toBe(true);
    expect(overlaps(metrics, layout.copyButton)).toBe(false);
    expectRankTypographyFits(layout);
  });
});
