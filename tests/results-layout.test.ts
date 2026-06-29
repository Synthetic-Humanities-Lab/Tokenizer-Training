import { describe, expect, it } from "vitest";
import {
  computeResultsLayout,
  RESULT_LEDGER_LINE_COUNT,
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

describe("computeResultsLayout", () => {
  it("keeps portrait termination actions inside the results panel", () => {
    const layout = computeResultsLayout(390, 844);
    const metrics = metricBlock(layout);

    expect(layout.compact).toBe(true);
    expect(withinViewport(layout.panel, 390, 844)).toBe(true);
    expect(contains(layout.panel, layout.chrome)).toBe(true);
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
  });

  it("keeps narrow portrait metric cards comfortably inside the panel", () => {
    const layout = computeResultsLayout(320, 568);
    const metrics = metricBlock(layout);

    expect(withinViewport(layout.panel, 320, 568)).toBe(true);
    expect(contains(layout.panel, layout.copyButton)).toBe(true);
    expect(contains(layout.panel, layout.againButton)).toBe(true);
    expect(contains(layout.panel, layout.menuButton)).toBe(true);
    expect(layout.metricCards).toHaveLength(9);
    expect(contains(layout.panel, metrics)).toBe(true);
    expect(layout.againButton.width).toBeLessThanOrEqual(layout.panel.width - 48);
    expect(layout.copyButton.width).toBe(layout.againButton.width);
    expect(layout.menuButton.width).toBe(layout.againButton.width);
    expect(edges(layout.menuButton).bottom).toBeLessThanOrEqual(edges(layout.panel).bottom);
    expect(overlaps(metrics, layout.copyButton)).toBe(false);
    expect(edges(layout.copyButton).top).toBeGreaterThan(edges(metrics).bottom + 8);
  });

  it("keeps small-phone chrome, title, summary, and compact ledger text within the panel", () => {
    const width = 320;
    const height = 568;
    const layout = computeResultsLayout(width, height);
    const ledgerText = new SessionFlowSystem().compactResultLedgerText({
      runId: "mtt-protocol-qa",
      rounds: 7,
      balance: 12.34,
      accuracy: 0.625,
      totalCorrectCuts: 5,
      totalMissedCuts: 3,
      totalFalseCuts: 2,
      startSource: "handoff-screen",
      inputModality: "touch",
      totalPay: 21.5,
      totalCost: 49.75,
      costEfficiency: 0.43,
      rank: "Junior Boundary Clerk",
      bestRounds: 7,
      bestRank: "Junior Boundary Clerk"
    });
    const textAvailableWidth = resultLedgerRect(layout, ledgerText.split("\n").length).width - 28;

    expect(layout.chromeText.text).toBe("wienerworks://audit");
    expect(estimatedTextWidth(layout.chromeText.text, layout.chromeText.fontSize)).toBeLessThan(layout.chrome.width - 18);
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
      "Training Suspended",
      layout.title.fontSize,
      layout.title.wordWrapWidth
    );
    const summary = estimatedTextBlock(
      layout.summary.x,
      layout.summary.y,
      "Session closed by operator request. WienerWorks preserved the usable portion and most of the causes.",
      layout.summary.fontSize,
      layout.summary.wordWrapWidth
    );

    expect(overlaps(title, summary)).toBe(false);
    expect(edges(summary).top).toBeGreaterThan(edges(title).bottom + 6);
    expect(edges(summary).bottom).toBeLessThan(edges(ledgerBlock(layout)).top);
  });

  it("keeps desktop results chrome, metric cards, and choices aligned", () => {
    const layout = computeResultsLayout(1280, 720);
    const metrics = metricBlock(layout);

    expect(layout.compact).toBe(false);
    expect(layout.panel.width).toBe(680);
    expect(layout.againButton.width).toBe(280);
    expect(contains(layout.panel, layout.chrome)).toBe(true);
    expect(contains(layout.panel, layout.copyButton)).toBe(true);
    expect(contains(layout.panel, layout.againButton)).toBe(true);
    expect(contains(layout.panel, layout.menuButton)).toBe(true);
    expect(layout.metricCards).toHaveLength(9);
    expect(contains(layout.panel, metrics)).toBe(true);
    expect(layout.copyButton.x).toBe(layout.againButton.x);
    expect(layout.againButton.x).toBe(layout.menuButton.x);
    expect(layout.copyButton.y).toBeLessThan(layout.againButton.y);
    expect(layout.againButton.y).toBeLessThan(layout.menuButton.y);
    expect(overlaps(metrics, layout.copyButton)).toBe(false);
    expect(edges(layout.copyButton).top).toBeGreaterThan(edges(metrics).bottom + 8);
  });
});
