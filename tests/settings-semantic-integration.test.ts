import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const settingsSource = readFileSync(
  fileURLToPath(new URL("../src/game/scenes/SettingsScene.ts", import.meta.url)),
  "utf8"
);
const menuSource = readFileSync(
  fileURLToPath(new URL("../src/game/scenes/MenuScene.ts", import.meta.url)),
  "utf8"
);

function methodSource(source: string, signature: string): string {
  const start = source.indexOf(signature);
  if (start < 0) {
    throw new Error(`Missing method signature: ${signature}`);
  }
  const next = source.indexOf("\n  private ", start + signature.length);
  return source.slice(start, next < 0 ? source.length : next);
}

describe("Settings semantic integration", () => {
  it("mounts one lease, publishes the canonical projection, and disposes it", () => {
    expect(settingsSource.match(/\.mount\("settings"/g)).toHaveLength(1);
    expect(settingsSource).toContain('readSemanticRuntime(this.registry)?.mount("settings", (actionId, checked) => {');
    expect(settingsSource).toContain("this.handleSemanticAction(actionId, checked);");
    expect(settingsSource).toContain("settingsSemanticSnapshot({");
    expect(settingsSource).toContain("this.semanticLease?.dispose();");
    expect(settingsSource).toContain("this.semanticLease = undefined;");
    expect(settingsSource).not.toContain("document.");
    expect(settingsSource).not.toContain("HTMLElement");

    const qaPublish = settingsSource.indexOf("this.writeQaSnapshot(layout);");
    const semanticPublish = settingsSource.indexOf(
      "this.semanticLease?.publish(settingsSemanticSnapshot({"
    );
    expect(qaPublish).toBeGreaterThan(-1);
    expect(semanticPublish).toBeGreaterThan(qaPublish);
  });

  it("requires the canonical registry haptics runtime without creating a scene fallback", () => {
    expect(settingsSource).toContain("const hapticPreferenceRuntime = readHapticPreferenceRuntime(this.registry);");
    expect(settingsSource).toContain("if (!hapticPreferenceRuntime)");
    expect(settingsSource).toContain('throw new Error("SettingsScene requires the shared haptic preference runtime.");');
    expect(settingsSource).toContain("this.hapticPreferenceRuntime = hapticPreferenceRuntime;");
    expect(settingsSource).not.toContain("createHapticPreferenceRuntime");
  });

  it("routes semantic controls through the same explicit-target scene commands", () => {
    const handler = methodSource(settingsSource, "  private handleSemanticAction(");
    const soundCommand = methodSource(settingsSource, "  private commandSetSoundMuted(");
    const motionCommand = methodSource(settingsSource, "  private commandSetReducedMotion(");
    const hapticsCommand = methodSource(settingsSource, "  private commandSetHapticsEnabled(");

    expect(handler).toContain('case "sound":');
    expect(handler).toContain('typeof requestedChecked === "boolean"');
    expect(handler).toContain("this.commandSetSoundMuted(!requestedChecked);");
    expect(handler).toContain('case "reduced-motion":');
    expect(handler).toContain("this.commandSetReducedMotion(requestedChecked);");
    expect(handler).toContain('case "haptics":');
    expect(handler).toContain(
      'if (this.hapticCapability.available && typeof requestedChecked === "boolean")'
    );
    expect(handler).toContain("this.commandSetHapticsEnabled(requestedChecked);");
    expect(soundCommand).toContain("this.audio.setMuted(targetMuted);");
    expect(soundCommand).toContain("this.storage.saveMuted(targetMuted);");
    expect(soundCommand).not.toContain("toggleMuted");
    expect(motionCommand).toContain("this.motionPreferenceRuntime.setReduced(targetReduced);");
    expect(hapticsCommand).toContain("setEnabled(targetEnabled)");
    expect(settingsSource).not.toContain("toggleMuted");
    expect(settingsSource).not.toMatch(/saveMuted\(\s*!/);
    expect(settingsSource).not.toMatch(/setEnabled\(\s*!/);
  });

  it("captures canvas targets from render state while semantic actions use requested switch state", () => {
    const render = methodSource(settingsSource, "  private render(");
    const handler = methodSource(settingsSource, "  private handleSemanticAction(");

    expect(render).toContain("const targetMuted = !this.audio.isMuted();");
    expect(render).toContain("this.commandSetSoundMuted(targetMuted);");
    expect(render).toContain("const targetReducedMotion = !this.motionPreference.reduced;");
    expect(render).toContain("this.commandSetReducedMotion(targetReducedMotion);");
    expect(render).toContain("const targetHapticsEnabled = !this.hapticPreference.enabled;");
    expect(render).toContain("this.commandSetHapticsEnabled(targetHapticsEnabled);");
    expect(handler).toContain("this.commandSetSoundMuted(!requestedChecked);");
    expect(handler).toContain("this.commandSetReducedMotion(requestedChecked);");
    expect(handler).toContain("this.commandSetHapticsEnabled(requestedChecked);");
  });

  it("shares reset commands while limiting focus changes to semantic activation", () => {
    const handler = methodSource(settingsSource, "  private handleSemanticAction(");
    const request = methodSource(settingsSource, "  private commandRequestBestRankReset(");
    const cancel = methodSource(settingsSource, "  private commandCancelBestRankReset(");
    const confirm = methodSource(settingsSource, "  private commandConfirmBestRankReset(");

    expect(handler).toContain("this.commandRequestBestRankReset(true);");
    expect(handler).toContain("this.commandCancelBestRankReset(true);");
    expect(handler).toContain("this.commandConfirmBestRankReset(true);");
    expect(request).toContain("this.bestRankReset.request();");
    expect(request).toContain('this.semanticLease?.focusAction("reset-cancel");');
    expect(cancel).toContain("this.bestRankReset.cancel();");
    expect(cancel).toContain('this.semanticLease?.focusAction("reset-best-rank");');
    expect(confirm).toContain("this.bestRankReset.confirm();");
    expect(confirm).toContain('this.semanticLease?.focusAction("reset-best-rank");');
    expect(settingsSource).toContain("this.commandRequestBestRankReset(false);");
    expect(settingsSource).toContain("this.commandCancelBestRankReset(false);");
    expect(settingsSource).toContain("this.commandConfirmBestRankReset(false);");
  });

  it("republishes effective motion changes with one queued polite announcement", () => {
    expect(settingsSource).toContain("snapshot.reduced === this.motionPreference.reduced");
    expect(settingsSource).toContain("snapshot.supported === this.motionPreference.supported");
    expect(settingsSource).toContain("if (this.semanticReady)");
    expect(settingsSource).toContain("politeness: \"polite\"");
    expect(settingsSource).toContain("announcement: this.pendingSemanticAnnouncement");
    expect(settingsSource).toContain("this.pendingSemanticAnnouncement = undefined;");
    expect(settingsSource).toContain("settingsResetAnnouncement(");
    expect(settingsSource).toContain("const resetSnapshot = this.bestRankReset.confirm();");
  });

  it("publishes aria-modal reset semantics only for semantic activation", () => {
    const request = methodSource(settingsSource, "  private commandRequestBestRankReset(");

    expect(settingsSource).toContain("dialogModal: this.semanticResetModal");
    expect(request).toContain("this.semanticResetModal = semanticSource;");
    expect(methodSource(settingsSource, "  private commandCancelBestRankReset(")).toContain(
      "this.semanticResetModal = false;"
    );
    expect(methodSource(settingsSource, "  private commandConfirmBestRankReset(")).toContain(
      "this.semanticResetModal = false;"
    );
  });

  it("guards Back and restores focus to Settings only for semantic navigation", () => {
    const back = methodSource(settingsSource, "  private commandBack(");

    expect(back).toContain("if (this.navigationStarted)");
    expect(back).toContain("this.navigationStarted = true;");
    expect(back).toContain('this.scene.start("MenuScene", { semanticFocusActionId: "settings" });');
    expect(back).toContain('this.scene.start("MenuScene");');
    expect(menuSource).toContain('this.scene.start("SettingsScene", { semanticEntry: true });');
    expect(menuSource).toContain('semanticFocusActionId?: "settings" | "token-log";');
  });

  it("keeps the public action IDs stable and ignores unavailable or unknown haptics actions", () => {
    const handler = methodSource(settingsSource, "  private handleSemanticAction(");
    const actionIds = [
      "sound",
      "reset-best-rank",
      "reduced-motion",
      "haptics",
      "back",
      "reset-cancel",
      "reset-confirm"
    ];

    for (const actionId of actionIds) {
      expect(handler).toContain(`case "${actionId}":`);
    }
    expect(handler).toContain(
      'case "haptics":\n        if (this.hapticCapability.available && typeof requestedChecked === "boolean") {'
    );
    expect(handler).not.toContain("default:");
    expect(methodSource(settingsSource, "  private commandSetHapticsEnabled(")).toContain(
      "if (!this.hapticCapability.available || this.hapticPreference.enabled === targetEnabled)"
    );
  });
});
