import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { imageEvidenceIssues } from "./image-evidence";

type JsonRecord = Record<string, unknown>;

export interface IosSimulatorEvidenceEvaluation {
  ready: boolean;
  directory: string;
  issues: string[];
  checkedFiles: string[];
}

const defaultEvidenceDirectory = ".qa/ios-simulator/latest";
const expectedRoutes = {
  "default-menu": "default-menu.jpg",
  "tutorial-active": "tutorial-active.jpg",
  "endless-active": "endless-active.jpg",
  results: "results.jpg",
  settings: "settings.jpg",
  "settings-reset-confirm": "settings-reset-confirm.jpg",
  "token-log": "token-log.jpg",
  "tutorial-complete": "tutorial-complete.jpg",
  "tutorial-failed": "tutorial-failed.jpg",
  "semantic-menu": "semantic-menu.jpg",
  "semantic-results": "semantic-results.jpg",
  "semantic-tutorial-complete": "semantic-tutorial-complete.jpg",
  "semantic-tutorial-failed": "semantic-tutorial-failed.jpg",
  "semantic-token-log": "semantic-token-log.jpg",
  "semantic-settings": "semantic-settings.jpg",
  "semantic-settings-reset-confirm": "semantic-settings-reset-confirm.jpg"
} as const;
type ExpectedRouteId = keyof typeof expectedRoutes;

const expectedRouteIds = Object.keys(expectedRoutes) as ExpectedRouteId[];
const expectedScreenshots = Object.values(expectedRoutes);
const semanticRouteIds = new Set<ExpectedRouteId>([
  "semantic-menu",
  "semantic-results",
  "semantic-tutorial-complete",
  "semantic-tutorial-failed",
  "semantic-token-log",
  "semantic-settings",
  "semantic-settings-reset-confirm"
]);
const forbiddenNativeQaParameterNames = [
  "qaFixtureId",
  "qaFreezeElapsedMs",
  "qaHoldReview",
  "qaCanvasCapture",
  "qaViewport"
] as const;

export function evaluateIosSimulatorEvidence(directory = defaultEvidenceDirectory): IosSimulatorEvidenceEvaluation {
  const issues: string[] = [];
  const checkedFiles: string[] = [];

  if (!existsSync(directory)) {
    issues.push(`iOS simulator evidence directory is missing: ${directory}.`);
  }

  for (const screenshot of expectedScreenshots) {
    requireScreenshot(directory, screenshot, issues, checkedFiles);
  }
  requireDistinctScreenshotFiles(directory, expectedScreenshots, issues);

  const manifest = readManifest(directory, issues, checkedFiles);
  if (manifest) {
    validateManifest(manifest, directory, issues, checkedFiles);
  }

  return {
    ready: issues.length === 0,
    directory,
    issues,
    checkedFiles: Array.from(new Set(checkedFiles)).sort()
  };
}

export function renderIosSimulatorEvidenceEvaluation(evaluation: IosSimulatorEvidenceEvaluation): string {
  const lines = [
    "Tokenizer Training iOS simulator evidence",
    `Directory: ${evaluation.directory}`,
    `Decision: ${evaluation.ready ? "iOS simulator evidence passed" : "iOS simulator evidence incomplete"}`,
    `Checked files: ${evaluation.checkedFiles.length}`
  ];

  if (evaluation.issues.length > 0) {
    lines.push("", "Issues:");
    for (const issue of evaluation.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

export function parseIosSimulatorEvidenceArgs(args: string[]): string {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dir") {
      return args[index + 1] ?? defaultEvidenceDirectory;
    }
    if (arg.startsWith("--dir=")) {
      return arg.slice("--dir=".length);
    }
    if (!arg.startsWith("-")) {
      return arg;
    }
  }

  return defaultEvidenceDirectory;
}

function readManifest(directory: string, issues: string[], checkedFiles: string[]): JsonRecord | undefined {
  const path = join(directory, "manifest.json");
  checkedFiles.push(path);
  if (!existsSync(path)) {
    issues.push(`iOS simulator manifest is missing: ${path}.`);
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (!isRecord(parsed)) {
      issues.push(`iOS simulator manifest must be a JSON object: ${path}.`);
      return undefined;
    }
    return parsed;
  } catch (error) {
    issues.push(`iOS simulator manifest could not be parsed: ${error instanceof Error ? error.message : String(error)}.`);
    return undefined;
  }
}

function validateManifest(
  manifest: JsonRecord,
  directory: string,
  issues: string[],
  checkedFiles: string[]
): void {
  requireEqual(stringAt(manifest, ["build", "status"]), "SUCCEEDED", "build status", issues);
  requireEqual(stringAt(manifest, ["app", "projectPath"]), "ios/TokenizerTraining.xcodeproj", "project path", issues);
  requireEqual(stringAt(manifest, ["app", "scheme"]), "TokenizerTraining", "scheme", issues);
  requireEqual(stringAt(manifest, ["app", "bundleId"]), "com.wienerworks.TokenizerTraining", "bundle id", issues);
  requireEqual(stringAt(manifest, ["simulator", "name"]), "iPhone 17", "simulator name", issues);
  const screen = {
    width: numberAt(manifest, ["simulator", "screen", "width"]),
    height: numberAt(manifest, ["simulator", "screen", "height"])
  };
  requireNumberAtLeast(screen.width, 320, "simulator screen width", issues);
  requireNumberAtLeast(screen.height, 700, "simulator screen height", issues);

  const routes = at(manifest, ["routes"]);
  if (!Array.isArray(routes)) {
    issues.push("routes: expected a route evidence array.");
    return;
  }

  const byId = new Map(routes.filter(isRecord).map((route) => [stringAt(route, ["id"]), route]));
  for (const id of expectedRouteIds) {
    const route = byId.get(id);
    if (!route) {
      issues.push(`routes: missing ${id}.`);
      continue;
    }
    validateRoute(route, id, directory, screen, issues, checkedFiles);
  }

  if (booleanAt(manifest, ["limitations", "physicalTouchProven"]) !== false) {
    issues.push("limitations.physicalTouchProven: simulator evidence must explicitly remain false.");
  }
  if (booleanAt(manifest, ["limitations", "physicalAudioProven"]) !== false) {
    issues.push("limitations.physicalAudioProven: simulator evidence must explicitly remain false.");
  }
  if (booleanAt(manifest, ["limitations", "voiceOverActivationProven"]) !== false) {
    issues.push("limitations.voiceOverActivationProven: simulator evidence must explicitly remain false.");
  }
  if (booleanAt(manifest, ["limitations", "resetPointerActivationProven"]) !== false) {
    issues.push("limitations.resetPointerActivationProven: direct-route layout evidence must explicitly remain false.");
  }
  if (booleanAt(manifest, ["limitations", "resetCancelPointerActivationProven"]) !== false) {
    issues.push("limitations.resetCancelPointerActivationProven: direct-route layout evidence must explicitly remain false.");
  }
  if (booleanAt(manifest, ["limitations", "resetConfirmedDeletionPointerActivationProven"]) !== false) {
    issues.push("limitations.resetConfirmedDeletionPointerActivationProven: direct-route layout evidence must explicitly remain false.");
  }
  if (booleanAt(manifest, ["limitations", "resetFailureStateVisuallyObserved"]) !== false) {
    issues.push("limitations.resetFailureStateVisuallyObserved: direct-route layout evidence must explicitly remain false.");
  }
  if (booleanAt(manifest, ["limitations", "settingsSemanticVisualContentAutomaticallyProven"]) !== false) {
    issues.push("limitations.settingsSemanticVisualContentAutomaticallyProven: image structure cannot prove route-specific content.");
  }
  if (booleanAt(manifest, ["limitations", "settingsSemanticKeyboardActivationProven"]) !== false) {
    issues.push("limitations.settingsSemanticKeyboardActivationProven: screenshot evidence must explicitly remain false.");
  }
  if (booleanAt(manifest, ["limitations", "settingsSemanticVoiceOverActivationProven"]) !== false) {
    issues.push("limitations.settingsSemanticVoiceOverActivationProven: screenshot evidence must explicitly remain false.");
  }
}

function validateRoute(
  route: JsonRecord,
  id: ExpectedRouteId,
  directory: string,
  screen: { width: number; height: number },
  issues: string[],
  checkedFiles: string[]
): void {
  const screenshot = stringAt(route, ["screenshot"]);
  const expectedScreenshot = expectedRoutes[id];
  if (screenshot !== expectedScreenshot) {
    issues.push(`${id} screenshot: expected ${expectedScreenshot}, got ${screenshot || "missing"}.`);
  } else {
    requireScreenshot(directory, screenshot, issues, checkedFiles, screen);
  }

  const launchArgs = at(route, ["launchArgs"]);
  if (!Array.isArray(launchArgs) || !launchArgs.every((arg) => typeof arg === "string")) {
    issues.push(`${id} launchArgs: expected an array of strings.`);
    return;
  }

  const launchParameters = launchMetadataParameters(launchArgs);
  for (const name of forbiddenNativeQaParameterNames) {
    if (launchParameters.has(name)) {
      issues.push(`${id} launchArgs: browser-only QA parameter ${name} is forbidden in native simulator evidence.`);
    }
  }

  if (semanticRouteIds.has(id) && !hasExactLaunchParameter(launchParameters, "semanticUi", "visible")) {
    issues.push(`${id} launchArgs: expected semanticUi=visible.`);
  }

  if (id === "default-menu" && launchArgs.length !== 0) {
    issues.push("default-menu launchArgs: expected an empty default launch.");
  }
  if (id === "tutorial-active" && !hasExactLaunchParameter(launchParameters, "mode", "tutorial")) {
    issues.push("tutorial-active launchArgs: expected mode=tutorial.");
  }
  if (id === "endless-active" && !hasExactLaunchParameter(launchParameters, "mode", "endless")) {
    issues.push("endless-active launchArgs: expected mode=endless.");
  }
  if (id === "results" && !hasExactLaunchParameter(launchParameters, "mode", "protocol-results")) {
    issues.push("results launchArgs: expected mode=protocol-results.");
  }
  if (id === "settings" && !hasExactLaunchParameter(launchParameters, "mode", "settings")) {
    issues.push("settings launchArgs: expected mode=settings.");
  }
  if (
    id === "settings-reset-confirm" &&
    !hasExactLaunchParameter(launchParameters, "mode", "settings-reset-confirm")
  ) {
    issues.push("settings-reset-confirm launchArgs: expected mode=settings-reset-confirm.");
  }
  if (id === "token-log" && !hasExactLaunchParameter(launchParameters, "mode", "token-log")) {
    issues.push("token-log launchArgs: expected mode=token-log.");
  }
  if (id === "tutorial-complete" && !hasExactLaunchParameter(launchParameters, "mode", "tutorial-complete")) {
    issues.push("tutorial-complete launchArgs: expected mode=tutorial-complete.");
  }
  if (id === "tutorial-failed" && !hasExactLaunchParameter(launchParameters, "mode", "tutorial-failed")) {
    issues.push("tutorial-failed launchArgs: expected mode=tutorial-failed.");
  }
  if (id === "semantic-menu" && launchParameters.has("mode")) {
    issues.push("semantic-menu launchArgs: expected the default menu route without mode.");
  }
  if (id === "semantic-results" && !hasExactLaunchParameter(launchParameters, "mode", "protocol-results")) {
    issues.push("semantic-results launchArgs: expected mode=protocol-results.");
  }
  if (
    id === "semantic-tutorial-complete" &&
    !hasExactLaunchParameter(launchParameters, "mode", "tutorial-complete")
  ) {
    issues.push("semantic-tutorial-complete launchArgs: expected mode=tutorial-complete.");
  }
  if (
    id === "semantic-tutorial-failed" &&
    !hasExactLaunchParameter(launchParameters, "mode", "tutorial-failed")
  ) {
    issues.push("semantic-tutorial-failed launchArgs: expected mode=tutorial-failed.");
  }
  if (id === "semantic-token-log" && !hasExactLaunchParameter(launchParameters, "mode", "token-log")) {
    issues.push("semantic-token-log launchArgs: expected mode=token-log.");
  }
  if (id === "semantic-settings" && !hasExactLaunchParameter(launchParameters, "mode", "settings")) {
    issues.push("semantic-settings launchArgs: expected mode=settings.");
  }
  if (
    id === "semantic-settings-reset-confirm" &&
    !hasExactLaunchParameter(launchParameters, "mode", "settings-reset-confirm")
  ) {
    issues.push("semantic-settings-reset-confirm launchArgs: expected mode=settings-reset-confirm.");
  }
}

function launchMetadataParameters(launchArgs: string[]): Map<string, string[]> {
  const parameters = new Map<string, string[]>();

  for (let index = 0; index < launchArgs.length; index += 1) {
    const argument = launchArgs[index] ?? "";
    const queryCandidates: string[] = [];
    if (argument === "--tt-query") {
      queryCandidates.push(launchArgs[index + 1] ?? "");
      index += 1;
    } else if (argument.startsWith("--tt-query=")) {
      queryCandidates.push(argument.slice("--tt-query=".length));
    } else {
      const cliParameter = argument.match(/^--([^=]+)(?:=(.*))?$/);
      if (cliParameter) {
        addLaunchParameter(parameters, cliParameter[1] ?? "", cliParameter[2] ?? "");
      }
    }

    for (const candidate of queryCandidates) {
      for (const segment of candidate.split(/[?#]/)) {
        for (const [name, value] of new URLSearchParams(segment.replace(/^[&]+/, ""))) {
          addLaunchParameter(parameters, name, value);
        }
      }
    }
  }

  return parameters;
}

function addLaunchParameter(parameters: Map<string, string[]>, name: string, value: string): void {
  if (!name) {
    return;
  }

  const values = parameters.get(name) ?? [];
  values.push(value);
  parameters.set(name, values);
}

function hasExactLaunchParameter(parameters: Map<string, string[]>, name: string, value: string): boolean {
  const values = parameters.get(name);
  return values?.length === 1 && values[0] === value;
}

function requireScreenshot(
  directory: string,
  file: string,
  issues: string[],
  checkedFiles: string[],
  expectedSize?: { width: number; height: number }
): void {
  const path = join(directory, file);
  checkedFiles.push(path);
  issues.push(
    ...imageEvidenceIssues(path, {
      label: "iOS simulator screenshot",
      width: expectedSize?.width,
      height: expectedSize?.height,
      minBytes: 10_000,
      requireVisualContent: true
    })
  );
}

function requireDistinctScreenshotFiles(
  directory: string,
  files: readonly string[],
  issues: string[]
): void {
  const filesByDigest = new Map<string, string[]>();
  for (const file of files) {
    const path = join(directory, file);
    if (!existsSync(path)) {
      continue;
    }
    const digest = createHash("sha256").update(readFileSync(path)).digest("hex");
    const matchingFiles = filesByDigest.get(digest) ?? [];
    matchingFiles.push(file);
    filesByDigest.set(digest, matchingFiles);
  }

  for (const matchingFiles of filesByDigest.values()) {
    if (matchingFiles.length > 1) {
      issues.push(
        `iOS simulator route screenshots reuse identical encoded image bytes: ${matchingFiles.join(", ")}.`
      );
    }
  }
}

function requireEqual(actual: unknown, expected: unknown, label: string, issues: string[]): void {
  if (actual !== expected) {
    issues.push(`${label}: expected ${String(expected)}, got ${String(actual)}.`);
  }
}

function requireNumberAtLeast(actual: number, expected: number, label: string, issues: string[]): void {
  if (actual < expected) {
    issues.push(`${label}: expected at least ${expected}, got ${actual}.`);
  }
}

function at(value: unknown, path: string[]): unknown {
  let current = value;
  for (const part of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

function stringAt(value: unknown, path: string[]): string {
  const result = at(value, path);
  return typeof result === "string" ? result : "";
}

function numberAt(value: unknown, path: string[]): number {
  const result = at(value, path);
  return typeof result === "number" && Number.isFinite(result) ? result : 0;
}

function booleanAt(value: unknown, path: string[]): boolean | undefined {
  const result = at(value, path);
  return typeof result === "boolean" ? result : undefined;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evaluation = evaluateIosSimulatorEvidence(parseIosSimulatorEvidenceArgs(process.argv.slice(2)));
  console.log(renderIosSimulatorEvidenceEvaluation(evaluation));
  process.exitCode = evaluation.ready ? 0 : 1;
}
