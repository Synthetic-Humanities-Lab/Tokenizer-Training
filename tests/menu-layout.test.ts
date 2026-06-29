import { describe, expect, it } from "vitest";
import { menuCopy } from "../src/game/systems/MenuContentSystem";
import { computeMenuLayout } from "../src/game/systems/MenuLayoutSystem";
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

function estimatedTextHeight(text: string, fontSize: number, wordWrapWidth: number): number {
  const maxChars = Math.max(1, Math.floor(wordWrapWidth / (fontSize * 0.55)));
  const lines = text.split("\n").reduce((lineCount, paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let paragraphLines = 1;
    let lineLength = 0;
    for (const word of words) {
      const nextLength = lineLength === 0 ? word.length : lineLength + 1 + word.length;
      if (nextLength <= maxChars) {
        lineLength = nextLength;
        continue;
      }

      paragraphLines += 1;
      lineLength = word.length;
    }

    return lineCount + paragraphLines;
  }, 0);

  return lines * fontSize * 1.25;
}

describe("computeMenuLayout", () => {
  it("keeps portrait menu card and mode controls aligned inside the viewport", () => {
    const layout = computeMenuLayout(390, 844);

    expect(layout.compact).toBe(true);
    expect(withinViewport(layout.card, 390, 844)).toBe(true);
    expect(contains(layout.card, layout.tutorialButton)).toBe(true);
    expect(contains(layout.card, layout.endlessButton)).toBe(true);
    expect(contains(layout.card, layout.soundButton)).toBe(true);
    expect(layout.workOrder.visible).toBe(false);
    expect(layout.tutorialButton.x).toBe(layout.card.x);
    expect(layout.endlessButton.x).toBe(layout.card.x);
    expect(layout.soundButton.x).toBe(layout.card.x);
    expect(overlaps(layout.tutorialButton, layout.endlessButton)).toBe(false);
    expect(overlaps(layout.endlessButton, layout.soundButton)).toBe(false);
  });

  it("keeps narrow portrait buttons inside the menu card", () => {
    const layout = computeMenuLayout(320, 568);

    expect(withinViewport(layout.card, 320, 568)).toBe(true);
    expect(contains(layout.card, layout.tutorialButton)).toBe(true);
    expect(contains(layout.card, layout.endlessButton)).toBe(true);
    expect(contains(layout.card, layout.soundButton)).toBe(true);
    expect(layout.workOrder.visible).toBe(false);
    expect(layout.soundButton.width).toBeLessThan(layout.card.width);
    expect(edges(layout.soundButton).bottom).toBeLessThanOrEqual(edges(layout.card).bottom);
  });

  it("keeps compact module copy bounded inside the menu card", () => {
    const layout = computeMenuLayout(390, 844);

    expect(layout.moduleLabel.text).toBe("HUMAN SEGMENTATION DIVISION");
    expect(layout.moduleLabel.wordWrapWidth).toBeLessThan(layout.card.width);
    expect(layout.moduleLabel.fontSize).toBeLessThanOrEqual(11);
  });

  it("keeps small-phone title, module label, premise, and best record visually separated", () => {
    const layout = computeMenuLayout(320, 568);
    const titleBottom = layout.title.y + estimatedTextHeight("Tokenizer Training", layout.title.fontSize, layout.title.wordWrapWidth) / 2;
    const moduleTop = layout.moduleLabel.y - estimatedTextHeight(layout.moduleLabel.text, layout.moduleLabel.fontSize, layout.moduleLabel.wordWrapWidth) / 2;
    const moduleBottom = layout.moduleLabel.y + estimatedTextHeight(layout.moduleLabel.text, layout.moduleLabel.fontSize, layout.moduleLabel.wordWrapWidth) / 2;
    const premiseTop = layout.premise.y - estimatedTextHeight(menuCopy().premise, layout.premise.fontSize, layout.premise.wordWrapWidth) / 2;
    const premiseBottom = layout.premise.y + estimatedTextHeight(menuCopy().premise, layout.premise.fontSize, layout.premise.wordWrapWidth) / 2;
    const bestRecord = {
      x: layout.bestRecord.x,
      y: layout.bestRecord.y,
      width: layout.bestRecord.wordWrapWidth,
      height: layout.bestRecord.fontSize * 1.5
    };
    const bestText = "BEST: Regex Intern / 0 rounds";

    expect(layout.premise.fontSize).toBe(14);
    expect(layout.premise.wordWrapWidth).toBeGreaterThan(240);
    expect(moduleTop).toBeGreaterThan(titleBottom + 6);
    expect(premiseTop).toBeGreaterThan(moduleBottom + 6);
    expect(layout.bestRecord.y - estimatedTextHeight(bestText, layout.bestRecord.fontSize, layout.bestRecord.wordWrapWidth) / 2)
      .toBeGreaterThan(premiseBottom + 8);
    expect(overlaps(bestRecord, layout.tutorialButton)).toBe(false);
  });

  it("keeps the desktop menu card centered with separated copy and controls", () => {
    const layout = computeMenuLayout(1280, 720);

    expect(layout.compact).toBe(false);
    expect(layout.card.x).toBe(640);
    expect(withinViewport(layout.card, 1280, 720)).toBe(true);
    expect(contains(layout.card, layout.tutorialButton)).toBe(true);
    expect(contains(layout.card, layout.endlessButton)).toBe(true);
    expect(contains(layout.card, layout.soundButton)).toBe(true);
    expect(layout.logo.width).toBe(0);
    expect(layout.logo.height).toBe(0);
    expect(layout.workOrder.visible).toBe(false);
    expect(layout.card.width).toBe(780);
    expect(layout.card.height).toBe(470);
    expect(layout.tutorialButton.width).toBe(174);
    expect(layout.tutorialButton.y).toBe(layout.endlessButton.y);
    expect(layout.endlessButton.y).toBe(layout.soundButton.y);
    expect(layout.tutorialButton.x).toBeLessThan(layout.endlessButton.x);
    expect(layout.endlessButton.x).toBeLessThan(layout.soundButton.x);
    expect(layout.bestRecord.y).toBeLessThan(layout.tutorialButton.y);
    expect(layout.companyMark.x).toBe(layout.card.x);
    expect(layout.title.x).toBe(layout.companyMark.x);
    expect(layout.moduleLabel.x).toBe(layout.card.x);
    expect(layout.premise.x).toBe(layout.card.x);
    expect(layout.bestRecord.fontSize).toBe(15);
    expect(overlaps({
      x: layout.bestRecord.x,
      y: layout.bestRecord.y,
      width: layout.bestRecord.wordWrapWidth,
      height: layout.bestRecord.fontSize * 1.5
    }, layout.tutorialButton)).toBe(false);
  });
});
