import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export interface MobileEvidenceFreshnessOptions {
  groups?: MobileEvidenceFreshnessGroupSpec[];
  toleranceMs?: number;
}

export interface MobileEvidenceFreshnessGroupSpec {
  label: string;
  sourcePaths: string[];
  artifactPaths: string[];
}

export interface MobileEvidenceFreshnessEvaluation {
  ready: boolean;
  issues: string[];
  checkedFiles: string[];
  groups: MobileEvidenceFreshnessGroupEvaluation[];
}

export interface MobileEvidenceFreshnessGroupEvaluation {
  label: string;
  fresh: boolean;
  checkedSources: string[];
  checkedArtifacts: string[];
  newestSource?: FileStamp;
  oldestArtifact?: FileStamp;
  issues: string[];
}

export interface FileStamp {
  path: string;
  mtimeMs: number;
}

const defaultToleranceMs = 1_000;

const menuArtifacts = [
  ".qa/iab-surface-compare/latest/comparison.json",
  ".qa/iab-surface-compare/latest/browser-desktop-menu.png",
  ".qa/iab-surface-compare/latest/browser-compact-menu.png",
  ".qa/iab-surface-compare/latest/mobile-surface-menu.png",
  ".qa/iab-surface-compare/latest/mobile-surface-menu-tall.png"
];

const surfaceArtifacts = [
  ".qa/mobile-port-audit/latest/browser-desktop-tutorial-active-fresh.json",
  ".qa/mobile-port-audit/latest/browser-desktop-tutorial-active-fresh.png",
  ".qa/mobile-port-audit/latest/mobile-surface-tutorial-active-small-fresh.json",
  ".qa/mobile-port-audit/latest/mobile-surface-tutorial-active-small-fresh.png",
  ".qa/mobile-port-audit/latest/mobile-surface-tutorial-active-large-after.json",
  ".qa/mobile-port-audit/latest/mobile-surface-tutorial-active-large-after.png",
  ".qa/mobile-port-audit/latest/browser-desktop-endless-pinned-simple-001.json",
  ".qa/mobile-port-audit/latest/browser-desktop-endless-pinned-simple-001.png",
  ".qa/mobile-port-audit/latest/mobile-surface-endless-pinned-simple-001.json",
  ".qa/mobile-port-audit/latest/mobile-surface-endless-pinned-simple-001.png",
  ".qa/mobile-port-audit/latest/mobile-surface-results-small-after.json",
  ".qa/mobile-port-audit/latest/mobile-surface-results-small-after.png"
];

const runtimeArtifacts = [
  ".qa/mobile-runtime/latest/cua-flow-result.json",
  ".qa/mobile-runtime/latest/cua-flow-review.png",
  ".qa/mobile-runtime/latest/cua-flow-review.json",
  ".qa/mobile-runtime/latest/cua-endless-flow-clean-result.json",
  ".qa/mobile-runtime/latest/cua-endless-review-clean.png",
  ".qa/mobile-runtime/latest/cua-endless-review-clean.json",
  ".qa/mobile-runtime/latest/cua-endless-review-held-tight-result.json",
  ".qa/mobile-runtime/latest/cua-endless-review-held-tight.png",
  ".qa/mobile-runtime/latest/cua-endless-review-held-tight.json",
  ".qa/mobile-runtime/latest/cua-endless-auto-check-result.json",
  ".qa/mobile-runtime/latest/cua-endless-auto-check-next-round.png",
  ".qa/mobile-runtime/latest/cua-endless-auto-check-next-round.json",
  ".qa/mobile-runtime/latest/cua-feedback-card-readable-phone-result.json",
  ".qa/mobile-runtime/latest/cua-feedback-card-readable-phone.png",
  ".qa/mobile-runtime/latest/cua-feedback-card-readable-phone.json"
];

const simulatorArtifacts = [
  ".qa/ios-simulator/latest/manifest.json",
  ".qa/ios-simulator/latest/default-menu.jpg",
  ".qa/ios-simulator/latest/tutorial-active.jpg",
  ".qa/ios-simulator/latest/endless-active.jpg",
  ".qa/ios-simulator/latest/results.jpg",
  ".qa/ios-simulator/latest/settings.jpg",
  ".qa/ios-simulator/latest/settings-reset-confirm.jpg",
  ".qa/ios-simulator/latest/token-log.jpg",
  ".qa/ios-simulator/latest/tutorial-complete.jpg",
  ".qa/ios-simulator/latest/tutorial-failed.jpg",
  ".qa/ios-simulator/latest/semantic-menu.jpg",
  ".qa/ios-simulator/latest/semantic-results.jpg",
  ".qa/ios-simulator/latest/semantic-tutorial-complete.jpg",
  ".qa/ios-simulator/latest/semantic-tutorial-failed.jpg",
  ".qa/ios-simulator/latest/semantic-token-log.jpg",
  ".qa/ios-simulator/latest/semantic-settings.jpg",
  ".qa/ios-simulator/latest/semantic-settings-reset-confirm.jpg"
];

const menuSources = [
  "index.html",
  "src/styles/global.css",
  "src/game/scenes/MenuScene.ts",
  "src/game/systems/CanvasButtonActivationSystem.ts",
  "src/game/systems/PointerActivationGuard.ts",
  "src/game/systems/MenuContentSystem.ts",
  "src/game/systems/MenuLayoutSystem.ts",
  "src/game/systems/MenuSceneQaSystem.ts",
  "src/game/systems/SurfaceProfileSystem.ts",
  "src/game/ui/VisualTheme.ts",
  "src/game/ui/WienerSprite.ts"
];

const surfaceSources = [
  "index.html",
  "src/styles/global.css",
  "src/game/Game.ts",
  "src/game/scenes/BootScene.ts",
  "src/game/scenes/PlayScene.ts",
  "src/game/scenes/ResultsScene.ts",
  "src/game/scenes/TutorialCompleteScene.ts",
  "src/game/systems/CanvasButtonActivationSystem.ts",
  "src/game/systems/PointerActivationGuard.ts",
  "src/game/systems/FeedbackSystem.ts",
  "src/game/systems/PlayControlActivationSystem.ts",
  "src/game/systems/PlayInputRoutingSystem.ts",
  "src/game/systems/PlayLayoutSystem.ts",
  "src/game/systems/PlaySceneQaControlSystem.ts",
  "src/game/systems/ResultsCopySystem.ts",
  "src/game/systems/ResultsLayoutSystem.ts",
  "src/game/systems/ResultsSceneQaSystem.ts",
  "src/game/systems/SafeAreaSystem.ts",
  "src/game/systems/SessionFlowSystem.ts",
  "src/game/systems/SurfaceProfileSystem.ts",
  "src/game/systems/TutorialCompleteLayoutSystem.ts",
  "src/game/systems/WienerSpeechSystem.ts",
  "src/game/ui/FeedbackCard.ts",
  "src/game/ui/Hud.ts",
  "src/game/ui/VisualTheme.ts",
  "src/game/ui/WienerSprite.ts"
];

const runtimeSources = [
  "index.html",
  "src/styles/global.css",
  "src/game/Game.ts",
  "src/game/scenes/PlayScene.ts",
  "src/game/systems/ActiveCutFeedbackSystem.ts",
  "src/game/systems/CutInputSessionSystem.ts",
  "src/game/systems/FeedbackSystem.ts",
  "src/game/systems/GameQaPngSystem.ts",
  "src/game/systems/InputFeelMetricsSystem.ts",
  "src/game/systems/InputModalitySystem.ts",
  "src/game/systems/PlayControlActivationSystem.ts",
  "src/game/systems/PlayInputRoutingSystem.ts",
  "src/game/systems/PlayLayoutSystem.ts",
  "src/game/systems/PlaySceneQaControlSystem.ts",
  "src/game/systems/ResolutionFeedbackSystem.ts",
  "src/game/systems/SafeAreaSystem.ts",
  "src/game/systems/SurfaceProfileSystem.ts",
  "src/game/systems/SwipeCutSystem.ts",
  "src/game/systems/TouchAimLoupeSystem.ts",
  "src/game/systems/TokenDisplaySystem.ts",
  "src/game/systems/WienerSpeechSystem.ts",
  "src/game/ui/FeedbackCard.ts",
  "src/game/ui/Hud.ts",
  "src/game/ui/VisualTheme.ts",
  "src/game/ui/WienerSprite.ts"
];

const simulatorSources = [
  "index.html",
  "src/styles/global.css",
  "src/game/Game.ts",
  "src/game/scenes/BootScene.ts",
  "src/game/scenes/MenuScene.ts",
  "src/game/scenes/PlayScene.ts",
  "src/game/scenes/ResultsScene.ts",
  "src/game/scenes/SettingsScene.ts",
  "src/game/scenes/TokenLogScene.ts",
  "src/game/scenes/TutorialCompleteScene.ts",
  "src/game/semantic",
  "src/game/systems/AudioSystem.ts",
  "src/game/systems/CanvasButtonActivationSystem.ts",
  "src/game/systems/FeedbackSystem.ts",
  "src/game/systems/BestRankResetSystem.ts",
  "src/game/systems/HapticFeedbackSystem.ts",
  "src/game/systems/LaunchModeSystem.ts",
  "src/game/systems/MenuLayoutSystem.ts",
  "src/game/systems/MenuSemanticSystem.ts",
  "src/game/systems/PlayControlActivationSystem.ts",
  "src/game/systems/PlayInputRoutingSystem.ts",
  "src/game/systems/PlayLayoutSystem.ts",
  "src/game/systems/PointerActivationGuard.ts",
  "src/game/systems/RankSystem.ts",
  "src/game/systems/ResultsCopySystem.ts",
  "src/game/systems/ResultsLayoutSystem.ts",
  "src/game/systems/SafeAreaSystem.ts",
  "src/game/systems/SettingsLayoutSystem.ts",
  "src/game/systems/SettingsSemanticSystem.ts",
  "src/game/systems/HapticPreferenceSystem.ts",
  "src/game/systems/MotionPreferenceSystem.ts",
  "src/game/systems/SessionFlowSystem.ts",
  "src/game/systems/StorageSystem.ts",
  "src/game/systems/SurfaceProfileSystem.ts",
  "src/game/systems/TokenLogSystem.ts",
  "src/game/systems/TokenLogSemanticSystem.ts",
  "src/game/systems/TutorialCompleteContentSystem.ts",
  "src/game/systems/TutorialCompleteSemanticSystem.ts",
  "src/game/systems/TutorialCompleteLayoutSystem.ts",
  "src/game/systems/WienerSpeechSystem.ts",
  "src/game/ui/FeedbackCard.ts",
  "src/game/ui/Hud.ts",
  "src/game/ui/VisualTheme.ts",
  "src/game/ui/WienerSprite.ts",
  "ios/TokenizerTraining/App/WebGameView.swift",
  "ios/TokenizerTraining/App/TokenizerTrainingApp.swift",
  "ios/TokenizerTraining/Info.plist",
  "ios/TokenizerTraining/LaunchScreen.storyboard",
  "ios/TokenizerTraining.xcodeproj/project.pbxproj",
  "ios/TokenizerTraining.xcodeproj/xcshareddata/xcschemes/TokenizerTraining.xcscheme",
  "ios/TokenizerTraining/WebAssets"
];

const defaultGroups: MobileEvidenceFreshnessGroupSpec[] = [
  {
    label: "menu browser/mobile comparison",
    sourcePaths: menuSources,
    artifactPaths: menuArtifacts
  },
  {
    label: "active/results surface comparison",
    sourcePaths: surfaceSources,
    artifactPaths: surfaceArtifacts
  },
  {
    label: "tutorial/endless runtime comparison",
    sourcePaths: runtimeSources,
    artifactPaths: runtimeArtifacts
  },
  {
    label: "iOS simulator shell screenshots",
    sourcePaths: simulatorSources,
    artifactPaths: simulatorArtifacts
  }
];

export function evaluateMobileEvidenceFreshness(
  options: MobileEvidenceFreshnessOptions = {}
): MobileEvidenceFreshnessEvaluation {
  const toleranceMs = options.toleranceMs ?? defaultToleranceMs;
  const groups = (options.groups ?? defaultGroups).map((group) => evaluateGroup(group, toleranceMs));
  const issues = groups.flatMap((group) => group.issues.map((issue) => `${group.label}: ${issue}`));

  return {
    ready: issues.length === 0,
    issues,
    checkedFiles: Array.from(new Set(groups.flatMap((group) => [
      ...group.checkedSources,
      ...group.checkedArtifacts
    ]))).sort(),
    groups
  };
}

export function renderMobileEvidenceFreshnessEvaluation(evaluation: MobileEvidenceFreshnessEvaluation): string {
  const lines = [
    "Tokenizer Training mobile evidence freshness",
    `Decision: ${evaluation.ready ? "evidence is fresh" : "evidence is stale or incomplete"}`,
    `Checked files: ${evaluation.checkedFiles.length}`,
    "",
    "Groups:"
  ];

  for (const group of evaluation.groups) {
    lines.push(`- ${group.fresh ? "PASS" : "FAIL"} ${group.label}`);
    if (group.newestSource && group.oldestArtifact) {
      lines.push(
        `  newest source: ${group.newestSource.path} @ ${formatTimestamp(group.newestSource.mtimeMs)}`
      );
      lines.push(
        `  oldest artifact: ${group.oldestArtifact.path} @ ${formatTimestamp(group.oldestArtifact.mtimeMs)}`
      );
    }
  }

  if (evaluation.issues.length > 0) {
    lines.push("", "Issues:");
    for (const issue of evaluation.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

function evaluateGroup(
  group: MobileEvidenceFreshnessGroupSpec,
  toleranceMs: number
): MobileEvidenceFreshnessGroupEvaluation {
  const issues: string[] = [];
  const checkedSources = expandExistingFiles(group.sourcePaths, "source", issues);
  const checkedArtifacts = expandExistingFiles(group.artifactPaths, "artifact", issues);
  const sourceStamps = checkedSources.map(readStamp);
  const artifactStamps = checkedArtifacts.map(readStamp);
  const newestSource = newest(sourceStamps);
  const oldestArtifact = oldest(artifactStamps);

  if (!newestSource) {
    issues.push("expected at least one existing source file.");
  }
  if (!oldestArtifact) {
    issues.push("expected at least one existing artifact file.");
  }
  if (newestSource && oldestArtifact && oldestArtifact.mtimeMs + toleranceMs < newestSource.mtimeMs) {
    issues.push(
      `oldest artifact ${oldestArtifact.path} is older than newest source ${newestSource.path}; refresh this evidence before treating browser/mobile parity as current.`
    );
  }

  return {
    label: group.label,
    fresh: issues.length === 0,
    checkedSources,
    checkedArtifacts,
    newestSource,
    oldestArtifact,
    issues
  };
}

function expandExistingFiles(paths: string[], role: "source" | "artifact", issues: string[]): string[] {
  const files: string[] = [];
  for (const path of paths) {
    if (!existsSync(path)) {
      issues.push(`${role} path is missing: ${path}.`);
      continue;
    }
    files.push(...expandPath(path));
  }

  return Array.from(new Set(files)).sort();
}

function expandPath(path: string): string[] {
  const stats = statSync(path);
  if (!stats.isDirectory()) {
    return [path];
  }

  const files: string[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const childPath = join(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...expandPath(childPath));
    } else if (entry.isFile()) {
      files.push(childPath);
    }
  }

  return files;
}

function readStamp(path: string): FileStamp {
  return {
    path,
    mtimeMs: statSync(path).mtimeMs
  };
}

function newest(stamps: FileStamp[]): FileStamp | undefined {
  return stamps.reduce<FileStamp | undefined>((current, candidate) => {
    if (!current || candidate.mtimeMs > current.mtimeMs) {
      return candidate;
    }
    return current;
  }, undefined);
}

function oldest(stamps: FileStamp[]): FileStamp | undefined {
  return stamps.reduce<FileStamp | undefined>((current, candidate) => {
    if (!current || candidate.mtimeMs < current.mtimeMs) {
      return candidate;
    }
    return current;
  }, undefined);
}

function formatTimestamp(mtimeMs: number): string {
  return new Date(mtimeMs).toISOString();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evaluation = evaluateMobileEvidenceFreshness();
  console.log(renderMobileEvidenceFreshnessEvaluation(evaluation));
  process.exitCode = evaluation.ready ? 0 : 1;
}
