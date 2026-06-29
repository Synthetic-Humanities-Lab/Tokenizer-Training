import { describe, expect, it } from "vitest";
import type { GameQaElement, GameQaRect } from "../src/game/systems/GameQaSystem";
import { tutorialCompleteCopy } from "../src/game/systems/TutorialCompleteContentSystem";
import { computeTutorialCompleteLayout } from "../src/game/systems/TutorialCompleteLayoutSystem";
import { tutorialCompleteQaSnapshot } from "../src/game/systems/TutorialCompleteQaSystem";

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

describe("tutorialCompleteQaSnapshot", () => {
  it("mirrors tutorial-complete copy and portrait layout for browser QA", () => {
    const layout = computeTutorialCompleteLayout(390, 844);
    const copy = tutorialCompleteCopy();
    const snapshot = tutorialCompleteQaSnapshot(390, 844, layout, copy);
    const panel = element(snapshot.elements, "panel").rect!;

    expect(snapshot.scene).toBe("TutorialCompleteScene");
    expect(snapshot.compact).toBe(true);
    expect(snapshot.viewport).toEqual({ width: 390, height: 844 });
    expect(element(snapshot.elements, "title").text).toBe(copy.title);
    expect(element(snapshot.elements, "summary").text).toBe(copy.summary);
    expect(element(snapshot.elements, "primaryButton").text).toBe("Start Endless Training");
    expect(element(snapshot.elements, "menuButton").text).toBe("Return to Menu");
    expect(contains(panel, element(snapshot.elements, "primaryButton").rect!)).toBe(true);
    expect(contains(panel, element(snapshot.elements, "menuButton").rect!)).toBe(true);
    for (const entry of snapshot.elements) {
      if (entry.rect) {
        expect(withinViewport(entry.rect, 390, 844), entry.id).toBe(true);
      }
    }
  });

  it("mirrors failed tutorial retry copy for browser QA", () => {
    const layout = computeTutorialCompleteLayout(390, 844);
    const copy = tutorialCompleteCopy({ accuracy: 0.4 });
    const snapshot = tutorialCompleteQaSnapshot(390, 844, layout, copy);

    expect(element(snapshot.elements, "title").text).toBe("Tutorial Failed");
    expect(element(snapshot.elements, "title").text).not.toContain("Filed");
    expect(element(snapshot.elements, "summary").text).not.toMatch(/\bfiled\b/i);
    expect(element(snapshot.elements, "primaryButton").text).toBe("Retry Tutorial");
    expect(element(snapshot.elements, "menuButton").text).toBe("Return to Menu");
  });

  it("mirrors desktop handoff dimensions for browser QA", () => {
    const layout = computeTutorialCompleteLayout(1280, 720);
    const snapshot = tutorialCompleteQaSnapshot(1280, 720, layout, tutorialCompleteCopy());

    expect(snapshot.compact).toBe(false);
    expect(element(snapshot.elements, "panel").rect?.width).toBe(680);
    expect(element(snapshot.elements, "primaryButton").rect?.width).toBe(340);
    expect(element(snapshot.elements, "title").fontSize).toBe(42);
    for (const entry of snapshot.elements) {
      if (entry.rect) {
        expect(withinViewport(entry.rect, 1280, 720), entry.id).toBe(true);
      }
    }
  });
});
