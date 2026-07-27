import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("reduced-motion integration", () => {
  it("owns one shared runtime for the game lifecycle", () => {
    const source = readRepoFile("src/game/Game.ts");

    expect(source).toContain("const motionPreferenceRuntime = createMotionPreferenceRuntime();");
    expect(source).toContain("game.registry.set(MOTION_PREFERENCE_REGISTRY_KEY, motionPreferenceRuntime);");
    expect(source.match(/motionPreferenceRuntime\.destroy\(\);/g)).toHaveLength(2);
  });

  it("reports the effective preference in Settings and QA", () => {
    const source = readRepoFile("src/game/scenes/SettingsScene.ts");

    expect(source).not.toContain('"Reduced Motion: System"');
    expect(source).toContain("motionPreferenceLabel(this.motionPreference)");
    expect(source).toContain("reducedMotion: this.motionPreference.reduced");
    expect(source).toContain("motionPreferenceSupported: this.motionPreference.supported");
    expect(source).toContain("this.unsubscribeMotionPreference?.();");
  });

  it("adapts ornament while preserving gameplay and instructional clocks", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");

    expect(source).toContain('treatment.resolvedText === "fade"');
    expect(source).toContain('treatment.cutImpact === "fade" ? 120 : style.durationMs');
    expect(source).toContain('motionTreatment(this.motionPreference).petReaction === "still"');
    expect(source).toContain('motionTreatment(this.motionPreference).petIdle === "still"');
    expect(source).toContain("this.unsubscribeMotionPreference?.();");

    expect(source).toContain("this.motion.isComplete(this.sentenceMotion, now)");
    expect(source).toContain("this.time.delayedCall(reviewSequence.reviewDelayMs");
    expect(source).toContain("this.time.delayedCall(durationMs, () => this.hideWienerSpeech())");
  });
});
