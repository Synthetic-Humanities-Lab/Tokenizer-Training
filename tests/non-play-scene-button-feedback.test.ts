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
    ["TutorialCompleteScene", "src/game/scenes/TutorialCompleteScene.ts"]
  ])("%s gives immediate pressed-state feedback before release actions", (_sceneName, path) => {
    const method = createButtonMethod(path);

    expect(method).toContain("buttonVisual.fill");
    expect(method).toContain("buttonVisual.hoverFill");
    expect(method).toContain('button.on("pointerdown", () => button.setFillStyle(buttonVisual.pressFill, buttonVisual.pressAlpha));');
    expect(method).toContain("button.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha);");
    expect(method).toContain("action();");
    expect(method).not.toContain('button.on("pointerup", action);');
    expect(method.indexOf('button.on("pointerdown"')).toBeLessThan(method.indexOf('button.on("pointerup"'));
    expect(method.indexOf("button.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha);")).toBeLessThan(
      method.indexOf("action();")
    );
  });
});
