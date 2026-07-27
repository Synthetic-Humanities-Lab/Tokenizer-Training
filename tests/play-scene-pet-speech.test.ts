import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("PlayScene pet speech cadence", () => {
  it("emits prompt speech on round start and restores Wiener speech during review feedback", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const setCommentCalls = source.match(/this\.setWienerSpeech\(/g) ?? [];

    expect(setCommentCalls).toHaveLength(3);
    expect(source).toContain("this.setWienerSpeech(activeLine, { sticky: true });");
    expect(source).toContain("this.setWienerSpeech(followUp, { sticky: true });");
    expect(source).toContain("wienerSpeechMaxLength(this.compactLayout, this.wienerSpeechSticky)");
    expect(source).toContain("this.hideWienerSpeech();");
    expect(source).toContain("this.setWienerSpeech(pending.resolutionLine");
  });

  it("keeps Training review speech focused on Wiener's complete selected line", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const resolutionLine = source.slice(
      source.indexOf("const resolutionLine = this.tutorialMode"),
      source.indexOf("this.writePlayQaSnapshot();", source.indexOf("const resolutionLine = this.tutorialMode"))
    );

    expect(resolutionLine).toContain(": summary.wienerSpeech;");
    expect(resolutionLine).not.toContain("summary.nextPredictionCue");
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

  it("keeps the active Training line visible after the first staged cut", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = source.match(/private applyPointerCutSample\([\s\S]+?\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(sampleMethod).toContain("if (this.tutorialMode)");
    expect(sampleMethod).not.toContain("this.hideWienerSpeech();");
  });

  it("reserves timer clearance only for active speech", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");

    expect(source).toContain(
      "activeTimerRect: this.resolving ? undefined : this.qaRectFromBounds(this.timerTrack.getBounds())"
    );
  });
});
