import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("PlayScene Clear recovery", () => {
  it("clears staged cuts without adding an extra Wiener comment before resolution", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");

    expect(source).not.toContain("clearCutRecoveryLine");
    expect(source).toContain("private clearPlayerCuts(): void");
    expect(source).toContain("this.currentCuts = [];");
    expect(source).not.toContain("this.setWienerSpeech(clearCutRecoveryLine");
  });
});
