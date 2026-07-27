import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

function createButtonMethod(path: string): string {
  return readRepoFile(path).match(/private createButton[\s\S]+?\n  \}/)?.[0] ?? "";
}

describe("non-play scene button feedback", () => {
  it.each([
    ["MenuScene", "src/game/scenes/MenuScene.ts"],
    ["ResultsScene", "src/game/scenes/ResultsScene.ts"],
    ["SettingsScene", "src/game/scenes/SettingsScene.ts"],
    ["TokenLogScene", "src/game/scenes/TokenLogScene.ts"],
    ["TutorialCompleteScene", "src/game/scenes/TutorialCompleteScene.ts"]
  ])("%s gives immediate pressed-state feedback before release actions", (_sceneName, path) => {
    const method = createButtonMethod(path);

    expect(method).toContain("buttonVisual.fill");
    expect(method).toContain("buttonVisual.hoverFill");
    expect(method).toContain("buttonVisual.pressAlpha");
    expect(method).toContain("buttonVisual.hoverAlpha");
    expect(method).toContain("bindCanvasButtonActivation({");
    expect(method).toContain("onRest:");
    expect(method).toContain("onHover:");
    expect(method).toContain("onPress:");
    expect(method).toContain("onActivate: action");
  });

  it.each([
    ["MenuScene", "src/game/scenes/MenuScene.ts"],
    ["ResultsScene", "src/game/scenes/ResultsScene.ts"],
    ["SettingsScene", "src/game/scenes/SettingsScene.ts"],
    ["TokenLogScene", "src/game/scenes/TokenLogScene.ts"],
    ["TutorialCompleteScene", "src/game/scenes/TutorialCompleteScene.ts"]
  ])("routes %s canvas actions through the shared pointer contract", (_sceneName, path) => {
    const method = createButtonMethod(path);

    expect(method).toContain("bindCanvasButtonActivation({");
    expect(method).toContain("input: this.input");
    expect(method).not.toContain('button.on("pointerup"');
    expect(method).not.toContain('button.on("pointerupoutside"');
  });
});
