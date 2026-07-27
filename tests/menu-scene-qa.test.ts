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
      muted: true,
      storageQaState: {
        storageAvailable: true,
        highScoreStorageKey: "tokenizer-training.high-score",
        mutedStorageKey: "tokenizer-training.muted",
        highScoreRaw: "{\"rounds\":6}",
        mutedRaw: "true",
        highScorePresent: true,
        mutedPresent: true,
        legacyHighScorePresent: false,
        legacyMutedPresent: false
      }
    });

    expect(snapshot.scene).toBe("MenuScene");
    expect(snapshot.compact).toBe(true);
    expect(snapshot.state).toMatchObject({
      highScoreRounds: 6,
      highScoreRank: "Regex Intern",
      muted: true,
      storageAvailable: true,
      highScoreStorageKey: "tokenizer-training.high-score",
      mutedStorageKey: "tokenizer-training.muted",
      highScoreRaw: "{\"rounds\":6}",
      mutedRaw: "true",
      highScorePresent: true,
      mutedPresent: true
    });
    expect(element(snapshot.elements, "companyMark").text).toBe("Welcome to WienerWorks");
    expect(element(snapshot.elements, "title").text).toBe("Tokenizer Training");
    expect(snapshot.elements.find((entry) => entry.id === "moduleLabel")).toBeUndefined();
    expect(snapshot.elements.find((entry) => entry.id === "premise")).toBeUndefined();
    expect(snapshot.elements.find((entry) => entry.id === "mobileStatus")).toBeUndefined();
    expect(element(snapshot.elements, "tutorialButton").text).toBe("Tutorial");
    expect(element(snapshot.elements, "trainingButton").text).toBe("Training");
    expect(element(snapshot.elements, "tokenLogButton").text).toBe("Token Log");
    expect(element(snapshot.elements, "settingsButton").text).toBe("Settings");
    expect(snapshot.elements.find((entry) => entry.id === "soundButton")).toBeUndefined();
    expect(element(snapshot.elements, "bestRecord").text).toBe(
      "BEST RANK\nRegex Intern\n6 rounds"
    );
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
      muted: false
    });

    expect(snapshot.compact).toBe(false);
    expect(snapshot.state).toMatchObject({
      highScoreRounds: 0,
      highScoreRank: "Regex Intern",
      muted: false
    });
    expect(element(snapshot.elements, "title").text).toBe("Tokenizer Training");
    expect(element(snapshot.elements, "companyMark").text).toBe("Welcome to WienerWorks");
    expect(snapshot.elements.find((entry) => entry.id === "moduleLabel")).toBeUndefined();
    expect(snapshot.elements.find((entry) => entry.id === "premise")).toBeUndefined();
    expect(snapshot.elements.find((entry) => entry.id === "chromeText")).toBeUndefined();
    expect(snapshot.elements.find((entry) => entry.id === "logo")).toBeUndefined();
    expect(snapshot.elements.find((entry) => entry.id === "workOrderPanel")).toBeUndefined();
    expect(element(snapshot.elements, "trainingButton").text).toBe("Training");
    expect(element(snapshot.elements, "tokenLogButton").text).toBe("Token Log");
    expect(element(snapshot.elements, "settingsButton").text).toBe("Settings");
    expect(snapshot.elements.find((entry) => entry.id === "soundButton")).toBeUndefined();
    for (const entry of snapshot.elements) {
      if (entry.rect) {
        expect(withinViewport(entry.rect, width, height), entry.id).toBe(true);
      }
    }
  });

  it("exposes the mobile best record line for browser/native cross-reference", () => {
    const width = 368;
    const height = 800;
    const snapshot = menuSceneQaSnapshot({
      width,
      height,
      layout: computeMenuLayout(width, height, { top: 59, right: 0, bottom: 34, left: 0 }, "mobile"),
      copy: menuCopy(),
      highScoreRounds: 7,
      highScoreRank: "Regex Intern",
      muted: false
    });
    const bestRecord = element(snapshot.elements, "bestRecord");

    expect(snapshot.compact).toBe(true);
    expect(snapshot.state).toMatchObject({
      highScoreRounds: 7,
      highScoreRank: "Regex Intern"
    });
    expect(bestRecord.visible).toBe(true);
    expect(bestRecord.text).toBe("BEST RANK\nRegex Intern\n7 rounds");
    expect(snapshot.elements.find((entry) => entry.id === "moduleLabel")).toBeUndefined();
    expect(snapshot.elements.find((entry) => entry.id === "premise")).toBeUndefined();
    expect(snapshot.elements.find((entry) => entry.id === "mobileStatus")).toBeUndefined();
    expect(element(snapshot.elements, "settingsButton").text).toBe("Settings");
    expect(withinViewport(bestRecord.rect!, width, height)).toBe(true);
  });
});
