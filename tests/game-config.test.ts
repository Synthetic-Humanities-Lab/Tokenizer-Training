import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("createGameConfig", () => {
  it("preserves the drawing buffer only for dev visual QA captures", () => {
    const source = readRepoFile("src/game/Game.ts");

    expect(source).toContain("createGameConfig(parent: string, dev = import.meta.env.DEV)");
    expect(source).toContain("preserveDrawingBuffer: dev");
    expect(source).toContain("dev ? qaViewportFromUrl(globalThis.location?.href) : undefined");
    expect(source).toContain("qaViewport ? Phaser.Scale.NONE : Phaser.Scale.RESIZE");
    expect(source).toContain("autoCenter: qaViewport ? Phaser.Scale.NO_CENTER : Phaser.Scale.CENTER_BOTH");
    expect(source).toContain("width: qaViewport?.width ?? 960");
    expect(source).toContain("height: qaViewport?.height ?? 640");
  });

  it("keeps the Phaser scene order and input model intact", () => {
    const source = readRepoFile("src/game/Game.ts");

    expect(source).toContain("activePointers: 3");
    expect(source).toContain("scene: [BootScene, MenuScene, SettingsScene, TokenLogScene, TutorialScene, PlayScene, TutorialCompleteScene, ResultsScene]");
  });
});
