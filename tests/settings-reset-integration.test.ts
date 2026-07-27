import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sceneSource = readFileSync(resolve(process.cwd(), "src/game/scenes/SettingsScene.ts"), "utf8");
const bootSource = readFileSync(resolve(process.cwd(), "src/game/scenes/BootScene.ts"), "utf8");

describe("Settings reset integration", () => {
  it("routes request, cancel, and confirmation through the shared reset system", () => {
    expect(sceneSource).toContain("this.bestRankReset.request()");
    expect(sceneSource).toContain("this.bestRankReset.cancel()");
    expect(sceneSource).toContain("this.bestRankReset.confirm()");
    expect(sceneSource).not.toContain("this.storage.clearHighScore()");
  });

  it("blocks the underlying settings surface and exposes confirmation QA geometry", () => {
    expect(sceneSource).toContain("createResetConfirmation");
    expect(sceneSource).toContain("resetDialogBlocker");
    expect(sceneSource).toContain('id: "resetCancelButton"');
    expect(sceneSource).toContain('id: "resetConfirmButton"');
    expect(sceneSource).toContain("bestRankResetPhase");
    expect(sceneSource).toContain("bestRankResetOutcome");
  });

  it("requires press and release on the same Settings control before activation", () => {
    expect(sceneSource).toContain("bindCanvasButtonActivation({");
    expect(sceneSource).toContain("input: this.input");
    expect(sceneSource).not.toContain('button.on("pointerupoutside"');
  });

  it("accepts a confirmation-only scene seed for native visual evidence", () => {
    expect(sceneSource).toContain("resetConfirmationOnCreate");
    expect(sceneSource).toContain("data.resetConfirmation === true");
    expect(bootSource).toContain('launchMode === "settingsResetConfirm"');
    expect(bootSource).toContain('this.startInitialScene("SettingsScene", { resetConfirmation: true })');
  });
});
