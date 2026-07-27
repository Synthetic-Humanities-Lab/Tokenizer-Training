import { mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  evaluateMobileEvidenceFreshness,
  renderMobileEvidenceFreshnessEvaluation,
  type MobileEvidenceFreshnessGroupSpec
} from "../scripts/evaluate-mobile-evidence-freshness";

const tempDirs: string[] = [];

describe("mobile evidence freshness evaluator", () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("passes when artifacts are newer than their source files", () => {
    const dir = makeTempDir();
    const source = writeTimedFile(dir, "src.ts", 1_700_000_000);
    const artifact = writeTimedFile(dir, "capture.png", 1_700_000_100);

    const evaluation = evaluateMobileEvidenceFreshness({
      groups: [group(source, artifact)],
      toleranceMs: 0
    });

    expect(evaluation.ready).toBe(true);
    expect(evaluation.issues).toEqual([]);
    expect(evaluation.groups[0]?.fresh).toBe(true);
  });

  it("fails when a source file is newer than the evidence artifact", () => {
    const dir = makeTempDir();
    const source = writeTimedFile(dir, "src.ts", 1_700_000_100);
    const artifact = writeTimedFile(dir, "capture.png", 1_700_000_000);

    const evaluation = evaluateMobileEvidenceFreshness({
      groups: [group(source, artifact)],
      toleranceMs: 0
    });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues.join("\n")).toContain("oldest artifact");
    expect(evaluation.issues.join("\n")).toContain("newest source");
  });

  it("reports missing source and artifact paths", () => {
    const dir = makeTempDir();
    const evaluation = evaluateMobileEvidenceFreshness({
      groups: [group(join(dir, "missing-source.ts"), join(dir, "missing-artifact.png"))]
    });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `test group: source path is missing: ${join(dir, "missing-source.ts")}.`
    );
    expect(evaluation.issues).toContain(
      `test group: artifact path is missing: ${join(dir, "missing-artifact.png")}.`
    );
  });

  it("renders a concise command-line report", () => {
    const dir = makeTempDir();
    const source = writeTimedFile(dir, "src.ts", 1_700_000_100);
    const artifact = writeTimedFile(dir, "capture.png", 1_700_000_000);
    const output = renderMobileEvidenceFreshnessEvaluation(
      evaluateMobileEvidenceFreshness({
        groups: [group(source, artifact)],
        toleranceMs: 0
      })
    );

    expect(output).toContain("Tokenizer Training mobile evidence freshness");
    expect(output).toContain("Decision: evidence is stale or incomplete");
    expect(output).toContain("- FAIL test group");
    expect(output).toContain("Issues:");
  });

  it("tracks the copied-summary source as active/results and simulator evidence provenance", () => {
    const source = readFileSync("scripts/evaluate-mobile-evidence-freshness.ts", "utf8");

    expect(source).toMatch(/surfaceSources[\s\S]*src\/game\/systems\/SessionFlowSystem\.ts/);
    expect(source).toMatch(/simulatorSources[\s\S]*src\/game\/systems\/SessionFlowSystem\.ts/);
    expect(source).toMatch(/surfaceSources[\s\S]*src\/game\/scenes\/BootScene\.ts/);
    expect(source).toMatch(/simulatorSources[\s\S]*src\/game\/scenes\/BootScene\.ts/);
    expect(source).toMatch(/surfaceSources[\s\S]*src\/game\/systems\/WienerSpeechSystem\.ts/);
    expect(source).toMatch(/simulatorSources[\s\S]*src\/game\/systems\/WienerSpeechSystem\.ts/);
  });

  it("tracks exactly one same-basename QA sidecar for each runtime screenshot", () => {
    const source = readFileSync("scripts/evaluate-mobile-evidence-freshness.ts", "utf8");
    const runtimeArtifactsBlock = source.match(/const runtimeArtifacts = \[([\s\S]*?)\];/)?.[1] ?? "";
    const runtimeArtifacts = Array.from(runtimeArtifactsBlock.matchAll(/"([^"]+)"/g), (match) => match[1]);
    const screenshotBasenames = new Set(
      runtimeArtifacts
        .filter((path) => path.endsWith(".png"))
        .map((path) => path.slice(0, -".png".length))
    );
    const sameBasenameSidecars = runtimeArtifacts.filter((path) => (
      path.endsWith(".json") && screenshotBasenames.has(path.slice(0, -".json".length))
    ));

    expect([...sameBasenameSidecars].sort()).toEqual([
      ".qa/mobile-runtime/latest/cua-flow-review.json",
      ".qa/mobile-runtime/latest/cua-endless-review-clean.json",
      ".qa/mobile-runtime/latest/cua-endless-auto-check-next-round.json",
      ".qa/mobile-runtime/latest/cua-endless-review-held-tight.json",
      ".qa/mobile-runtime/latest/cua-feedback-card-readable-phone.json"
    ].sort());
    expect(sameBasenameSidecars).toHaveLength(screenshotBasenames.size);
  });

  it("tracks Token Log and Settings reset changes as simulator evidence provenance", () => {
    const source = readFileSync("scripts/evaluate-mobile-evidence-freshness.ts", "utf8");
    const simulatorSources = source.match(/const simulatorSources = \[([\s\S]*?)\];/)?.[1] ?? "";

    expect(simulatorSources).toContain('"src/game/scenes/TokenLogScene.ts"');
    expect(simulatorSources).toContain('"src/game/scenes/SettingsScene.ts"');
    expect(simulatorSources).toContain('"src/game/systems/TokenLogSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/TokenLogSemanticSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/StorageSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/BestRankResetSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/SettingsLayoutSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/SettingsSemanticSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/AudioSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/HapticPreferenceSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/HapticFeedbackSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/MotionPreferenceSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/RankSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/CanvasButtonActivationSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/PointerActivationGuard.ts"');
    expect(simulatorSources).toContain('"src/game/systems/ResultsCopySystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/PlayControlActivationSystem.ts"');
    expect(simulatorSources).toContain('"src/game/systems/PlayInputRoutingSystem.ts"');
    expect(simulatorSources).toContain('"src/game/semantic"');
  });

  it("tracks shared non-play pointer behavior in browser comparison provenance", () => {
    const source = readFileSync("scripts/evaluate-mobile-evidence-freshness.ts", "utf8");
    const menuSources = source.match(/const menuSources = \[([\s\S]*?)\];/)?.[1] ?? "";
    const surfaceSources = source.match(/const surfaceSources = \[([\s\S]*?)\];/)?.[1] ?? "";

    for (const sources of [menuSources, surfaceSources]) {
      expect(sources).toContain('"src/game/systems/CanvasButtonActivationSystem.ts"');
      expect(sources).toContain('"src/game/systems/PointerActivationGuard.ts"');
    }
    expect(surfaceSources).toContain('"src/game/systems/ResultsCopySystem.ts"');
  });

  it("tracks PlayScene control routing in active, runtime, and simulator provenance", () => {
    const source = readFileSync("scripts/evaluate-mobile-evidence-freshness.ts", "utf8");
    const surfaceSources = source.match(/const surfaceSources = \[([\s\S]*?)\];/)?.[1] ?? "";
    const runtimeSources = source.match(/const runtimeSources = \[([\s\S]*?)\];/)?.[1] ?? "";
    const simulatorSources = source.match(/const simulatorSources = \[([\s\S]*?)\];/)?.[1] ?? "";

    for (const sources of [surfaceSources, runtimeSources, simulatorSources]) {
      expect(sources).toContain('"src/game/systems/PlayControlActivationSystem.ts"');
      expect(sources).toContain('"src/game/systems/PlayInputRoutingSystem.ts"');
    }
  });

  it("tracks tutorial-complete visible copy as simulator evidence provenance", () => {
    const source = readFileSync("scripts/evaluate-mobile-evidence-freshness.ts", "utf8");
    const simulatorSources = source.match(/const simulatorSources = \[([\s\S]*?)\];/)?.[1] ?? "";

    expect(simulatorSources).toContain('"src/game/systems/TutorialCompleteContentSystem.ts"');
  });

  it("keeps menu-only layout provenance out of active/results surface artifacts", () => {
    const source = readFileSync("scripts/evaluate-mobile-evidence-freshness.ts", "utf8");
    const surfaceSources = source.match(/const surfaceSources = \[([\s\S]*?)\];/)?.[1] ?? "";

    expect(source).toMatch(/menuSources[\s\S]*src\/game\/systems\/MenuLayoutSystem\.ts/);
    expect(source).toMatch(/simulatorSources[\s\S]*src\/game\/systems\/MenuLayoutSystem\.ts/);
    expect(surfaceSources).not.toContain("src/game/systems/MenuLayoutSystem.ts");
    expect(surfaceSources).not.toContain("src/game/systems/MenuSceneQaSystem.ts");
  });
});

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "tokenizer-training-freshness-"));
  tempDirs.push(dir);
  return dir;
}

function writeTimedFile(dir: string, name: string, seconds: number): string {
  const path = join(dir, name);
  writeFileSync(path, name);
  utimesSync(path, seconds, seconds);
  return path;
}

function group(source: string, artifact: string): MobileEvidenceFreshnessGroupSpec {
  return {
    label: "test group",
    sourcePaths: [source],
    artifactPaths: [artifact]
  };
}
