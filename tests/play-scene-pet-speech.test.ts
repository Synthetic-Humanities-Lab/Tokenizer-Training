import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("PlayScene pet speech cadence", () => {
  it("emits one prompt comment on round start and one reaction comment on resolve", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const setCommentCalls = source.match(/this\.setWienerSpeech\(/g) ?? [];

    expect(setCommentCalls).toHaveLength(2);
    expect(source).toContain("this.setWienerSpeech(activeLine, { sticky: true });");
    expect(source).toContain("this.setWienerSpeech(pending.resolutionLine, {");
    expect(source).toContain("sticky: this.tutorialMode");
  });

  it("does not emit extra speech for clear, overcut, or timer warning events", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const clearMethod = source.match(/private clearPlayerCuts\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const warningMethod = source.match(/private maybePlayTimeWarning\(time: number\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(clearMethod).not.toContain("setWienerSpeech");
    expect(warningMethod).not.toContain("setWienerSpeech");
    expect(source).not.toContain("maybeShowOvercutComment");
    expect(source).not.toContain("More cuts. Expensive");
  });
});
