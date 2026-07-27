import { describe, expect, it } from "vitest";
import type { GameQaElement, GameQaRect } from "../src/game/systems/GameQaSystem";
import { tutorialCompleteCopy } from "../src/game/systems/TutorialCompleteContentSystem";
import { computeTutorialCompleteLayout } from "../src/game/systems/TutorialCompleteLayoutSystem";
import {
  centeredGameQaRectFromTopLeftBounds,
  tutorialCompleteQaSnapshot
} from "../src/game/systems/TutorialCompleteQaSystem";

function edges(rect: GameQaRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function contains(outer: GameQaRect, inner: GameQaRect): boolean {
  const outerEdges = edges(outer);
  const innerEdges = edges(inner);
  return (
    innerEdges.left >= outerEdges.left &&
    innerEdges.right <= outerEdges.right &&
    innerEdges.top >= outerEdges.top &&
    innerEdges.bottom <= outerEdges.bottom
  );
}

function overlaps(a: GameQaRect, b: GameQaRect): boolean {
  const aEdges = edges(a);
  const bEdges = edges(b);
  return (
    aEdges.left < bEdges.right &&
    aEdges.right > bEdges.left &&
    aEdges.top < bEdges.bottom &&
    aEdges.bottom > bEdges.top
  );
}

function withinViewport(rect: GameQaRect, width: number, height: number): boolean {
  const rectEdges = edges(rect);
  return (
    rectEdges.left >= 0 &&
    rectEdges.right <= width &&
    rectEdges.top >= 0 &&
    rectEdges.bottom <= height
  );
}

function element(snapshotElements: GameQaElement[], id: string): GameQaElement {
  const match = snapshotElements.find((candidate) => candidate.id === id);
  if (!match) {
    throw new Error(`Missing QA element ${id}.`);
  }

  return match;
}

const PHONE_SAFE_AREA = {
  top: 59,
  right: 0,
  bottom: 34,
  left: 0
};

const LONGEST_FAILURE_PERFORMANCE = {
  totalCorrectCuts: 6,
  totalMissedCuts: 2,
  totalFalseCuts: 2
};

interface TutorialCompleteQaGeometryCase {
  label: string;
  width: number;
  height: number;
  compact: boolean;
  safeArea?: typeof PHONE_SAFE_AREA;
  clearedSummaryRect: GameQaRect;
  failedSummaryRect: GameQaRect;
}

const QA_GEOMETRY_CASES: TutorialCompleteQaGeometryCase[] = [
  {
    label: "320x568",
    width: 320,
    height: 568,
    compact: true,
    clearedSummaryRect: { x: 160, y: 242, width: 204, height: 90 },
    failedSummaryRect: { x: 160, y: 242, width: 210, height: 90 }
  },
  {
    label: "safe-area 368x800",
    width: 368,
    height: 800,
    compact: true,
    safeArea: PHONE_SAFE_AREA,
    clearedSummaryRect: { x: 184, y: 370.5, width: 248, height: 72 },
    failedSummaryRect: { x: 184, y: 370.5, width: 258, height: 90 }
  },
  {
    label: "1280x720",
    width: 1280,
    height: 720,
    compact: false,
    clearedSummaryRect: { x: 640, y: 324, width: 548, height: 40 },
    failedSummaryRect: { x: 640, y: 324, width: 590, height: 60 }
  }
];

describe("tutorialCompleteQaSnapshot", () => {
  it.each(QA_GEOMETRY_CASES)(
    "preserves cleared and longest-failure rendered summary bounds at $label",
    ({ width, height, compact, safeArea, clearedSummaryRect, failedSummaryRect }) => {
      const layout = computeTutorialCompleteLayout(width, height, safeArea);
      const outcomes = [
        { copy: tutorialCompleteCopy(), summaryRect: clearedSummaryRect },
        {
          copy: tutorialCompleteCopy(LONGEST_FAILURE_PERFORMANCE),
          summaryRect: failedSummaryRect
        }
      ];

      for (const { copy, summaryRect } of outcomes) {
        const snapshot = tutorialCompleteQaSnapshot(width, height, layout, copy, summaryRect);
        const panel = element(snapshot.elements, "panel").rect!;
        const title = element(snapshot.elements, "title");
        const summary = element(snapshot.elements, "summary");
        const primaryButton = element(snapshot.elements, "primaryButton").rect!;
        const menuButton = element(snapshot.elements, "menuButton").rect!;

        expect(snapshot.scene).toBe("TutorialCompleteScene");
        expect(snapshot.compact).toBe(compact);
        expect(snapshot.viewport).toEqual({ width, height });
        expect(snapshot.elements).toHaveLength(5);
        expect(panel).toStrictEqual(layout.panel);
        expect(title.text).toBe(copy.title);
        expect(title.fontSize).toBe(layout.title.fontSize);
        expect(title.wordWrapWidth).toBe(layout.title.wordWrapWidth);
        expect(summary.text).toBe(copy.summary);
        expect(summary.fontSize).toBe(layout.summary.fontSize);
        expect(summary.wordWrapWidth).toBe(layout.summary.wordWrapWidth);
        expect(summary.rect).toStrictEqual(summaryRect);
        expect(summary.rect?.height).not.toBe(layout.summary.fontSize * 3.6);
        expect(contains(panel, summaryRect)).toBe(true);
        expect(withinViewport(summaryRect, width, height)).toBe(true);
        expect(overlaps(title.rect!, summaryRect)).toBe(false);
        expect(overlaps(summaryRect, primaryButton)).toBe(false);
        expect(element(snapshot.elements, "primaryButton").text).toBe(copy.primaryAction);
        expect(element(snapshot.elements, "menuButton").text).toBe(copy.secondaryAction);
        expect(primaryButton).toStrictEqual(layout.primaryButton);
        expect(menuButton).toStrictEqual(layout.menuButton);
        expect(contains(panel, primaryButton)).toBe(true);
        expect(contains(panel, menuButton)).toBe(true);

        for (const entry of snapshot.elements) {
          if (entry.rect) {
            expect(withinViewport(entry.rect, width, height), entry.id).toBe(true);
          }
        }

        if (safeArea) {
          const panelEdges = edges(panel);
          expect(panelEdges.top).toBeGreaterThanOrEqual(safeArea.top);
          expect(panelEdges.bottom).toBeLessThanOrEqual(height - safeArea.bottom);
        }
      }

      expect(clearedSummaryRect).not.toEqual(failedSummaryRect);
    }
  );

  it("converts Phaser-style top-left bounds to the QA center coordinate contract", () => {
    expect(centeredGameQaRectFromTopLeftBounds({
      x: 54,
      y: 188,
      width: 212,
      height: 90
    })).toEqual({
      x: 160,
      y: 233,
      width: 212,
      height: 90
    });
  });

  it("mirrors failed tutorial diagnostic copy exactly for browser QA", () => {
    const layout = computeTutorialCompleteLayout(390, 844);
    const copy = tutorialCompleteCopy(LONGEST_FAILURE_PERFORMANCE);
    const summaryRect = { x: 195, y: 380, width: 258, height: 90 };
    const snapshot = tutorialCompleteQaSnapshot(390, 844, layout, copy, summaryRect);

    expect({
      title: element(snapshot.elements, "title").text,
      summary: element(snapshot.elements, "summary").text,
      primaryAction: element(snapshot.elements, "primaryButton").text,
      secondaryAction: element(snapshot.elements, "menuButton").text
    }).toEqual({
      title: copy.title,
      summary: copy.summary,
      primaryAction: copy.primaryAction,
      secondaryAction: copy.secondaryAction
    });
    expect(copy).toEqual({
      status: "failed",
      chromePath: "wienerworks://tutorial-failed",
      title: "Tutorial Failed",
      summary:
        "Boundary accuracy: 60%. Readiness requires 70%. Focus: missed boundaries and false cuts. Qualification denied. Payroll remains unconvinced.",
      primaryAction: "Retry Tutorial",
      secondaryAction: "Return to Menu"
    });
    expect(element(snapshot.elements, "summary").rect).toStrictEqual(summaryRect);
  });
});
