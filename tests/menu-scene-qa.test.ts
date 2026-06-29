import { describe, expect, it } from "vitest";
import type { GameQaElement, GameQaRect } from "../src/game/systems/GameQaSystem";
import { menuCopy } from "../src/game/systems/MenuContentSystem";
import { computeMenuLayout } from "../src/game/systems/MenuLayoutSystem";
import { menuSceneQaSnapshot } from "../src/game/systems/MenuSceneQaSystem";

function element(elements: GameQaElement[], id: string): GameQaElement {
  const match = elements.find((candidate) => candidate.id === id);
  if (!match) {
    throw new Error(`Missing QA element ${id}.`);
  }

  return match;
}

function edges(rect: GameQaRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
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

describe("menuSceneQaSnapshot", () => {
  it("exposes portrait first-action copy and controls for browser QA", () => {
    const width = 390;
    const height = 844;
    const snapshot = menuSceneQaSnapshot({
      width,
      height,
      layout: computeMenuLayout(width, height),
      copy: menuCopy(),
      highScoreRounds: 6,
      highScoreRank: "BPE Adjacent",
      soundButtonText: "Sound: Off"
    });

    expect(snapshot.scene).toBe("MenuScene");
    expect(snapshot.compact).toBe(true);
    expect(snapshot.state).toMatchObject({
      highScoreRounds: 6,
      highScoreRank: "BPE Adjacent",
      muted: true
    });
    expect(element(snapshot.elements, "companyMark").text).toBe("Welcome to WienerWorks");
    expect(element(snapshot.elements, "title").text).toBe("Manual Tokenization Training");
    expect(element(snapshot.elements, "premise").text).toContain("Predict token boundaries");
    expect(element(snapshot.elements, "tutorialButton").text).toBe("Begin Tutorial");
    expect(element(snapshot.elements, "endlessButton").text).toBe("Endless Training");
    expect(element(snapshot.elements, "soundButton").text).toBe("Sound: Off");
    expect(element(snapshot.elements, "bestRecord").text).toContain("BPE Adjacent / 6 rounds");
    expect(snapshot.elements.find((entry) => entry.id === "logo")).toBeUndefined();
    expect(snapshot.elements.find((entry) => entry.id === "workOrderPanel")).toBeUndefined();
    for (const entry of snapshot.elements) {
      if (entry.rect) {
        expect(withinViewport(entry.rect, width, height), entry.id).toBe(true);
      }
    }
  });

  it("mirrors desktop menu entry state and unmuted sound state", () => {
    const width = 1280;
    const height = 720;
    const snapshot = menuSceneQaSnapshot({
      width,
      height,
      layout: computeMenuLayout(width, height),
      copy: menuCopy(),
      highScoreRounds: 0,
      highScoreRank: "Regex Intern",
      soundButtonText: "Sound: On"
    });

    expect(snapshot.compact).toBe(false);
    expect(snapshot.state).toMatchObject({
      highScoreRounds: 0,
      highScoreRank: "Regex Intern",
      muted: false
    });
    expect(element(snapshot.elements, "title").text).toBe("Manual Tokenization Training");
    expect(element(snapshot.elements, "companyMark").text).toBe("Welcome to WienerWorks");
    expect(element(snapshot.elements, "moduleLabel").text).toContain("Human Segmentation Division");
    expect(snapshot.elements.find((entry) => entry.id === "chromeText")).toBeUndefined();
    expect(snapshot.elements.find((entry) => entry.id === "logo")).toBeUndefined();
    expect(snapshot.elements.find((entry) => entry.id === "workOrderPanel")).toBeUndefined();
    expect(element(snapshot.elements, "soundButton").text).toBe("Sound: On");
    for (const entry of snapshot.elements) {
      if (entry.rect) {
        expect(withinViewport(entry.rect, width, height), entry.id).toBe(true);
      }
    }
  });
});
