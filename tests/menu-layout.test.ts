import { describe, expect, it } from "vitest";
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

function estimatedTextRect(x: number, y: number, text: string, fontSize: number, wordWrapWidth: number): LayoutRect {
  return {
    x,
    y,
    width: wordWrapWidth,
    height: estimatedTextHeight(text, fontSize, wordWrapWidth)
  };
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
    expect(contains(layout.card, layout.trainingButton)).toBe(true);
    expect(contains(layout.card, layout.tokenLogButton)).toBe(true);
    expect(contains(layout.card, layout.settingsButton)).toBe(true);
    expect(layout.workOrder.visible).toBe(false);
    expect(layout.tutorialButton.x).toBe(layout.card.x);
    expect(layout.trainingButton.x).toBe(layout.card.x);
    expect(layout.tokenLogButton.x).toBe(layout.card.x);
    expect(overlaps(layout.tutorialButton, layout.trainingButton)).toBe(false);
    expect(overlaps(layout.trainingButton, layout.tokenLogButton)).toBe(false);
    expect(overlaps(layout.tokenLogButton, layout.settingsButton)).toBe(false);
  });

  it("keeps narrow portrait buttons inside the menu card", () => {
    const layout = computeMenuLayout(320, 568);

    expect(withinViewport(layout.card, 320, 568)).toBe(true);
    expect(contains(layout.card, layout.tutorialButton)).toBe(true);
    expect(contains(layout.card, layout.trainingButton)).toBe(true);
    expect(contains(layout.card, layout.tokenLogButton)).toBe(true);
    expect(contains(layout.card, layout.settingsButton)).toBe(true);
    expect(layout.workOrder.visible).toBe(false);
    expect(layout.tokenLogButton.width).toBeLessThan(layout.card.width);
    expect(layout.settingsButton.width).toBe(layout.tutorialButton.width);
    expect(layout.settingsButton.height).toBe(layout.tutorialButton.height);
    expect(edges(layout.settingsButton).bottom).toBeLessThanOrEqual(edges(layout.card).bottom);
    expect(overlaps(layout.tokenLogButton, layout.settingsButton)).toBe(false);
  });

  it("keeps auxiliary menu copy hidden on compact layouts", () => {
    const layout = computeMenuLayout(390, 844);

    expect(layout.moduleLabel.visible).toBe(false);
    expect(layout.premise.visible).toBe(false);
    expect(layout.workOrder.visible).toBe(false);
  });

  it("keeps safe-area portrait menu copy clear of stacked controls", () => {
    const width = 368;
    const height = 800;
    const layout = computeMenuLayout(width, height, { top: 59, right: 0, bottom: 34, left: 0 });
    const title = estimatedTextRect(
      layout.title.x,
      layout.title.y,
      "Tokenizer Training",
      layout.title.fontSize,
      layout.title.wordWrapWidth
    );
    const best = estimatedTextRect(
      layout.bestRecord.x,
      layout.bestRecord.y,
      "BEST RANK\nRegex Intern\n0 rounds",
      layout.bestRecord.fontSize,
      layout.bestRecord.wordWrapWidth
    );

    expect(withinViewport(layout.card, width, height)).toBe(true);
    expect(contains(layout.card, layout.tutorialButton)).toBe(true);
    expect(layout.title.fontSize).toBeLessThanOrEqual(24);
    expect(layout.moduleLabel.visible).toBe(false);
    expect(layout.premise.visible).toBe(false);
    expect(layout.bestRecord.visible).toBe(true);
    expect(overlaps(title, layout.tutorialButton)).toBe(false);
    expect(overlaps(best, layout.tutorialButton)).toBe(false);
    expect(edges(layout.tutorialButton).top - edges(best).bottom).toBeGreaterThanOrEqual(12);
  });

  it("uses a sparse touch-first menu with visible persistence status on the explicit mobile surface", () => {
    const width = 368;
    const height = 800;
    const layout = computeMenuLayout(width, height, { top: 59, right: 0, bottom: 34, left: 0 }, "mobile");
    const title = estimatedTextRect(
      layout.title.x,
      layout.title.y,
      "Tokenizer Training",
      layout.title.fontSize,
      layout.title.wordWrapWidth
    );
    const bestRecord = estimatedTextRect(
      layout.bestRecord.x,
      layout.bestRecord.y,
      "BEST RANK\nJunior Boundary Clerk\n7 rounds",
      layout.bestRecord.fontSize,
      layout.bestRecord.wordWrapWidth
    );

    expect(layout.compact).toBe(true);
    expect(layout.card.height).toBeGreaterThan(620);
    expect(layout.moduleLabel.visible).toBe(false);
    expect(layout.premise.visible).toBe(false);
    expect(layout.bestRecord.visible).toBe(true);
    expect(layout.tutorialButton.height).toBeGreaterThanOrEqual(54);
    expect(layout.trainingButton.height).toBe(layout.tutorialButton.height);
    expect(layout.tokenLogButton.height).toBe(layout.tutorialButton.height);
    expect(layout.settingsButton.height).toBe(layout.tutorialButton.height);
    expect(layout.settingsButton.width).toBe(layout.tutorialButton.width);
    expect(layout.tutorialButton.width).toBeGreaterThan(280);
    expect(layout.companyMark.displayText).toBe("Welcome to\nWienerWorks");
    expect(layout.title.displayText).toBe("Tokenizer\nTraining");
    expect(layout.companyMark.fontSize).toBeGreaterThanOrEqual(24);
    expect(layout.title.fontSize).toBeGreaterThanOrEqual(32);
    expect(layout.menuMascot.height).toBeGreaterThanOrEqual(58);
    expect(edges(bestRecord).top - edges(title).bottom).toBeGreaterThanOrEqual(12);
    expect(edges(layout.tutorialButton).top - edges(bestRecord).bottom).toBeGreaterThanOrEqual(8);
    expect(edges(layout.tutorialButton).top - edges(bestRecord).bottom).toBeLessThanOrEqual(28);
    expect(edges(layout.card).bottom - edges(layout.settingsButton).bottom).toBeGreaterThanOrEqual(74);
    expect(overlaps(bestRecord, layout.tutorialButton)).toBe(false);
    expect(contains(layout.card, layout.tutorialButton)).toBe(true);
    expect(contains(layout.card, layout.settingsButton)).toBe(true);
    expect(contains(layout.card, {
      x: bestRecord.x,
      y: bestRecord.y,
      width: bestRecord.width,
      height: bestRecord.height
    })).toBe(true);
    expect(contains(layout.card, layout.tokenLogButton)).toBe(true);
  });

  it("keeps the explicit mobile menu separated in a safe-area-bounded shell viewport", () => {
    const width = 368;
    const height = 552;
    const layout = computeMenuLayout(width, height, undefined, "mobile");
    const title = estimatedTextRect(
      layout.title.x,
      layout.title.y,
      "Tokenizer Training",
      layout.title.fontSize,
      layout.title.wordWrapWidth
    );
    const companyMark = estimatedTextRect(
      layout.companyMark.x,
      layout.companyMark.y,
      "Welcome to WienerWorks",
      layout.companyMark.fontSize,
      layout.companyMark.wordWrapWidth
    );
    const bestRecord = estimatedTextRect(
      layout.bestRecord.x,
      layout.bestRecord.y,
      "BEST RANK\nRegex Intern\n0 rounds",
      layout.bestRecord.fontSize,
      layout.bestRecord.wordWrapWidth
    );

    expect(layout.compact).toBe(true);
    expect(layout.moduleLabel.visible).toBe(false);
    expect(layout.premise.visible).toBe(false);
    expect(layout.bestRecord.visible).toBe(true);
    expect(layout.menuMascot.x).toBe(layout.card.x);
    expect(edges(companyMark).bottom).toBeLessThan(edges(layout.menuMascot).top);
    expect(edges(layout.menuMascot).bottom).toBeLessThan(edges(title).top);
    expect(layout.companyMark.displayText).toBe("Welcome to\nWienerWorks");
    expect(layout.title.displayText).toBe("Tokenizer\nTraining");
    expect(layout.title.fontSize).toBeGreaterThanOrEqual(26);
    expect(edges(bestRecord).top - edges(title).bottom).toBeGreaterThanOrEqual(6);
    expect(edges(layout.tutorialButton).top - edges(bestRecord).bottom).toBeGreaterThanOrEqual(12);
    expect(overlaps(title, layout.tutorialButton)).toBe(false);
    expect(overlaps(bestRecord, layout.tutorialButton)).toBe(false);
    expect(overlaps(layout.menuMascot, layout.tutorialButton)).toBe(false);
    expect(contains(layout.card, layout.tokenLogButton)).toBe(true);
    expect(contains(layout.card, layout.settingsButton)).toBe(true);
    expect(overlaps(layout.tokenLogButton, layout.settingsButton)).toBe(false);
  });

  it("keeps small-phone title, best rank, and four actions visually separated", () => {
    const layout = computeMenuLayout(320, 568);
    const titleBottom = layout.title.y + estimatedTextHeight("Tokenizer Training", layout.title.fontSize, layout.title.wordWrapWidth) / 2;
    const bestRecord = {
      x: layout.bestRecord.x,
      y: layout.bestRecord.y,
      width: layout.bestRecord.wordWrapWidth,
      height: estimatedTextHeight(
        "BEST RANK\nRegex Intern\n0 rounds",
        layout.bestRecord.fontSize,
        layout.bestRecord.wordWrapWidth
      )
    };
    const bestText = "BEST RANK\nRegex Intern\n0 rounds";

    expect(layout.moduleLabel.visible).toBe(false);
    expect(layout.premise.visible).toBe(false);
    expect(layout.bestRecord.y - estimatedTextHeight(bestText, layout.bestRecord.fontSize, layout.bestRecord.wordWrapWidth) / 2)
      .toBeGreaterThan(titleBottom + 8);
    expect(overlaps(bestRecord, layout.tutorialButton)).toBe(false);
    expect(overlaps(layout.tutorialButton, layout.trainingButton)).toBe(false);
    expect(overlaps(layout.trainingButton, layout.tokenLogButton)).toBe(false);
    expect(overlaps(layout.tokenLogButton, layout.settingsButton)).toBe(false);
    expect(contains(layout.card, layout.settingsButton)).toBe(true);
  });

  it("keeps the desktop menu card centered with separated copy and controls", () => {
    const layout = computeMenuLayout(1280, 720);

    expect(layout.compact).toBe(false);
    expect(layout.card.x).toBe(640);
    expect(withinViewport(layout.card, 1280, 720)).toBe(true);
    expect(contains(layout.card, layout.tutorialButton)).toBe(true);
    expect(contains(layout.card, layout.trainingButton)).toBe(true);
    expect(contains(layout.card, layout.tokenLogButton)).toBe(true);
    expect(contains(layout.card, layout.settingsButton)).toBe(true);
    expect(layout.logo.width).toBe(0);
    expect(layout.logo.height).toBe(0);
    expect(layout.workOrder.visible).toBe(false);
    expect(layout.card.width).toBe(780);
    expect(layout.card.height).toBe(470);
    expect(layout.tutorialButton.width).toBe(174);
    expect(layout.tutorialButton.y).toBe(layout.trainingButton.y);
    expect(layout.trainingButton.y).toBe(layout.tokenLogButton.y);
    expect(layout.tokenLogButton.y).toBe(layout.settingsButton.y);
    expect(layout.settingsButton.width).toBe(layout.tutorialButton.width);
    expect(layout.settingsButton.height).toBe(layout.tutorialButton.height);
    expect(layout.tutorialButton.x).toBeLessThan(layout.trainingButton.x);
    expect(layout.trainingButton.x).toBeLessThan(layout.tokenLogButton.x);
    expect(layout.tokenLogButton.x).toBeLessThan(layout.settingsButton.x);
    expect(layout.bestRecord.y).toBeLessThan(layout.tutorialButton.y);
    expect(layout.companyMark.x).toBe(layout.card.x);
    expect(layout.title.x).toBe(layout.companyMark.x);
    expect(layout.moduleLabel.visible).toBe(false);
    expect(layout.premise.visible).toBe(false);
    expect(layout.bestRecord.fontSize).toBe(15);
    expect(overlaps({
      x: layout.bestRecord.x,
      y: layout.bestRecord.y,
      width: layout.bestRecord.wordWrapWidth,
      height: layout.bestRecord.fontSize * 1.5
    }, layout.tutorialButton)).toBe(false);
  });
});
