import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

function methodSource(source: string, signature: string): string {
  const start = source.indexOf(signature);
  if (start < 0) {
    throw new Error(`Missing method signature: ${signature}`);
  }

  const endCandidates = [source.indexOf("\n  private ", start + signature.length), source.indexOf("\n  update(", start + signature.length)]
    .filter((index) => index >= 0);
  const end = endCandidates.length > 0 ? Math.min(...endCandidates) : source.length;
  return source.slice(start, end);
}

const AUDIO_SCENES = [
  "src/game/scenes/MenuScene.ts",
  "src/game/scenes/SettingsScene.ts",
  "src/game/scenes/TokenLogScene.ts",
  "src/game/scenes/PlayScene.ts",
  "src/game/scenes/TutorialCompleteScene.ts",
  "src/game/scenes/ResultsScene.ts"
];

describe("haptic capability integration", () => {
  it("replaces implementation-status copy with runtime capability truth", () => {
    const source = readRepoFile("src/game/scenes/SettingsScene.ts");

    expect(source).not.toContain("Native shell pending");
    expect(source).toContain("hapticFeedbackCapabilityLabel(this.hapticCapability)");
    expect(source).toContain('id: "haptics"');
    expect(source).toContain("hapticFeedbackAvailable: this.hapticCapability.available");
    expect(source).toContain("hapticFeedbackRoute: this.hapticCapability.route");
  });

  it("registers one shared haptic preference runtime before scenes boot", () => {
    const source = readRepoFile("src/game/Game.ts");

    expect(source).toContain("const hapticPreferenceRuntime = createHapticPreferenceRuntime();");
    expect(source).toContain(
      "game.registry.set(HAPTIC_PREFERENCE_REGISTRY_KEY, hapticPreferenceRuntime);"
    );
    expect(source.match(/createHapticPreferenceRuntime\(\)/g)).toHaveLength(1);
    expect(source.match(/registry\.set\(HAPTIC_PREFERENCE_REGISTRY_KEY/g)).toHaveLength(1);
  });

  it("keeps Sound and Haptics as independent Settings controls", () => {
    const source = readRepoFile("src/game/scenes/SettingsScene.ts");
    const soundControl = source.slice(
      source.indexOf("this.createButton(layout.soundButton"),
      source.indexOf("this.createButton(layout.resetButton")
    );
    const hapticsControl = source.slice(
      source.indexOf("if (this.hapticCapability.available)"),
      source.indexOf("} else {", source.indexOf("if (this.hapticCapability.available)"))
    );
    const soundCommand = methodSource(source, "  private commandSetSoundMuted(");
    const hapticsCommand = methodSource(source, "  private commandSetHapticsEnabled(");

    expect(soundControl).toContain("this.commandSetSoundMuted(targetMuted);");
    expect(soundControl).not.toContain("setEnabled");
    expect(soundCommand).toContain("this.storage.saveMuted(targetMuted);");
    expect(soundCommand).not.toContain("setEnabled");
    expect(hapticsControl).toContain("this.commandSetHapticsEnabled(targetHapticsEnabled);");
    expect(hapticsControl).not.toContain("saveMuted");
    expect(hapticsCommand).toContain("this.hapticPreferenceRuntime.setEnabled(targetEnabled)");
    expect(hapticsCommand).toContain("this.haptics.setMuted(!this.hapticPreference.enabled)");
    expect(hapticsCommand).toContain('this.haptics.play("confirm", "touch")');
    expect(hapticsCommand).not.toContain("saveMuted");
  });

  it("requires Settings to use the game-owned haptic runtime", () => {
    const source = readRepoFile("src/game/scenes/SettingsScene.ts");

    expect(source).toContain("const hapticPreferenceRuntime = readHapticPreferenceRuntime(this.registry);");
    expect(source).toContain("SettingsScene requires the shared haptic preference runtime.");
    expect(source).not.toContain("createHapticPreferenceRuntime");
  });

  it("drives PlayScene haptics from the haptic preference rather than Sound", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const create = methodSource(source, "  create(");
    const toggleMute = methodSource(source, "  private toggleMute(");

    expect(source).toContain("private readonly haptics = new HapticFeedbackSystem();");
    expect(source).not.toContain("new HapticFeedbackSystem(this.audio.isMuted())");
    expect(create).toContain("readHapticPreferenceRuntime(this.registry)");
    expect(create).toContain(
      "this.haptics.setMuted(!hapticPreference.snapshot(hapticCapability.available).enabled);"
    );
    expect(toggleMute).toContain("this.storage.saveMuted(muted);");
    expect(toggleMute).not.toContain("this.haptics");
  });

  it.each(AUDIO_SCENES)("refreshes scene-local audio from storage on every create in %s", (path) => {
    const create = methodSource(readRepoFile(path), "  create(");

    expect(create).toContain("this.audio.setMuted(this.storage.loadMuted());");
  });
});
