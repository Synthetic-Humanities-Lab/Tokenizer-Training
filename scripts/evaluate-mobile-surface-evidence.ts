import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { computeMenuLayout } from "../src/game/systems/MenuLayoutSystem";
import { menuSceneQaSnapshot } from "../src/game/systems/MenuSceneQaSystem";
import { menuCopy } from "../src/game/systems/MenuContentSystem";
import { imageEvidenceIssues } from "./image-evidence";

type JsonRecord = Record<string, unknown>;

export interface MobileSurfaceEvidenceEvaluation {
  ready: boolean;
  directory: string;
  issues: string[];
  checkedFiles: string[];
}

const defaultEvidenceDirectory = ".qa/mobile-port-audit/latest";

const requiredArtifactFiles = [
  "browser-desktop-tutorial-active-fresh.json",
  "browser-desktop-tutorial-active-fresh.png",
  "mobile-surface-tutorial-active-small-fresh.json",
  "mobile-surface-tutorial-active-small-fresh.png",
  "mobile-surface-tutorial-active-large-after.json",
  "mobile-surface-tutorial-active-large-after.png",
  "browser-desktop-endless-pinned-simple-001.json",
  "browser-desktop-endless-pinned-simple-001.png",
  "mobile-surface-endless-pinned-simple-001.json",
  "mobile-surface-endless-pinned-simple-001.png",
  "mobile-surface-results-small-after.json",
  "mobile-surface-results-small-after.png"
] as const;

const requiredScreenshotArtifacts = [
  { file: "browser-desktop-tutorial-active-fresh.png", width: 1280, height: 720 },
  { file: "mobile-surface-tutorial-active-small-fresh.png", width: 368, height: 552 },
  { file: "mobile-surface-tutorial-active-large-after.png", width: 390, height: 844 },
  { file: "browser-desktop-endless-pinned-simple-001.png", width: 1280, height: 720 },
  { file: "mobile-surface-endless-pinned-simple-001.png", width: 368, height: 552 },
  { file: "mobile-surface-results-small-after.png", width: 368, height: 552 }
] as const;

const requiredPlayElementIds = [
  "hud",
  "brandMark",
  "logoWiener",
  "playfield",
  "petWiener",
  "petSpeechBubble",
  "timer",
  "textPanel",
  "text",
  "cutStatus",
  "resolveButton",
  "clearButton",
  "undoButton",
  "exitButton"
] as const;

const requiredResultsElementIds = [
  "panel",
  "title",
  "summary",
  "metric-run",
  "metric-cuts",
  "metric-accuracy",
  "metric-rank",
  "copySummaryPayload",
  "copyButton",
  "againButton",
  "menuButton"
] as const;

const budgetMetricIds = ["run", "cuts", "accuracy", "rank"] as const;
const forbiddenBudgetMetricIds = [
  "credits",
  "balance",
  "verified",
  "rework",
  "pay",
  "cost",
  "net",
  "efficiency",
  "yield"
] as const;
const retiredQaElementIds = [
  "brandPanel",
  "assistantPanel",
  "footerPanel",
  "overseer",
  "tutorialPopup",
  "tokenStrip",
  "segmentationEvidence"
] as const;

export function evaluateMobileSurfaceEvidence(directory = defaultEvidenceDirectory): MobileSurfaceEvidenceEvaluation {
  const issues: string[] = [];
  const checkedFiles: string[] = [];

  validateMenuSourceContract(issues);

  if (!existsSync(directory)) {
    issues.push(`Evidence directory is missing: ${directory}.`);
  }

  for (const file of requiredArtifactFiles) {
    requireFile(directory, file, issues, checkedFiles);
  }

  for (const artifact of requiredScreenshotArtifacts) {
    const path = join(directory, artifact.file);
    if (!existsSync(path)) {
      continue;
    }
    issues.push(...imageEvidenceIssues(path, {
      label: `${artifact.file} screenshot`,
      width: artifact.width,
      height: artifact.height,
      minBytes: 1_000,
      requireVisualContent: true
    }));
  }

  const desktopTutorial = readJsonEvidence(directory, "browser-desktop-tutorial-active-fresh.json", issues, checkedFiles);
  const mobileTutorialSmall = readJsonEvidence(directory, "mobile-surface-tutorial-active-small-fresh.json", issues, checkedFiles);
  const mobileTutorialLarge = readJsonEvidence(directory, "mobile-surface-tutorial-active-large-after.json", issues, checkedFiles);
  const desktopEndless = readJsonEvidence(directory, "browser-desktop-endless-pinned-simple-001.json", issues, checkedFiles);
  const mobileEndless = readJsonEvidence(directory, "mobile-surface-endless-pinned-simple-001.json", issues, checkedFiles);
  const mobileResults = readJsonEvidence(directory, "mobile-surface-results-small-after.json", issues, checkedFiles);

  for (const [file, evidence] of [
    ["browser-desktop-tutorial-active-fresh.json", desktopTutorial],
    ["mobile-surface-tutorial-active-small-fresh.json", mobileTutorialSmall],
    ["mobile-surface-tutorial-active-large-after.json", mobileTutorialLarge],
    ["browser-desktop-endless-pinned-simple-001.json", desktopEndless],
    ["mobile-surface-endless-pinned-simple-001.json", mobileEndless],
    ["mobile-surface-results-small-after.json", mobileResults]
  ] as const) {
    if (evidence) {
      requireRetiredQaElementsAbsent(evidence, file, issues);
    }
  }

  if (desktopTutorial && mobileTutorialSmall) {
    validatePlaySurfacePair(desktopTutorial, mobileTutorialSmall, {
      label: "tutorial active desktop/mobile",
      mode: "tutorial",
      desktopViewport: { width: 1280, height: 720 },
      mobileViewport: { width: 368, height: 552 },
      hudLabel: "TUTORIAL",
      hudCurrent: 1,
      hudTarget: 10
    }, issues);
  }

  if (mobileTutorialLarge) {
    validateSinglePlaySurface(mobileTutorialLarge, {
      label: "tutorial active large mobile",
      compact: true,
      viewport: { width: 390, height: 844 },
      mode: "tutorial",
      fixtureId: "simple_001",
      phase: "active"
    }, issues);
  }

  if (desktopEndless && mobileEndless) {
    validatePlaySurfacePair(desktopEndless, mobileEndless, {
      label: "endless pinned desktop/mobile",
      mode: "endless",
      desktopViewport: { width: 1280, height: 720 },
      mobileViewport: { width: 368, height: 552 },
      hudLabel: "SAMPLES",
      hudCurrent: 0,
      hudTarget: 200
    }, issues);
  }

  if (mobileResults) {
    validateMobileResultsSurface(mobileResults, issues);
  }

  return {
    ready: issues.length === 0,
    directory,
    issues,
    checkedFiles: Array.from(new Set(checkedFiles)).sort()
  };
}

export function renderMobileSurfaceEvidenceEvaluation(evaluation: MobileSurfaceEvidenceEvaluation): string {
  const lines = [
    "Tokenizer Training mobile surface evidence",
    `Directory: ${evaluation.directory}`,
    `Decision: ${evaluation.ready ? "browser/mobile surface evidence passed" : "browser/mobile surface evidence incomplete"}`,
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

export function parseMobileSurfaceEvidenceArgs(args: string[]): string {
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

function validateMenuSourceContract(issues: string[]): void {
  const copy = menuCopy();
  const desktop = menuSceneQaSnapshot({
    width: 1280,
    height: 720,
    layout: computeMenuLayout(1280, 720),
    copy,
    highScoreRounds: 0,
    highScoreRank: "Regex Intern",
    muted: false
  });
  const mobile = menuSceneQaSnapshot({
    width: 368,
    height: 552,
    layout: computeMenuLayout(368, 552, undefined, "mobile"),
    copy,
    highScoreRounds: 7,
    highScoreRank: "Regex Intern",
    muted: false
  });

  requireEqual(desktop.scene, "MenuScene", "desktop menu scene", issues);
  requireEqual(desktop.compact, false, "desktop menu compact", issues);
  requireElementText(desktop.elements, "companyMark", "Welcome to WienerWorks", "desktop menu company", issues);
  requireElementText(desktop.elements, "title", "Tokenizer Training", "desktop menu title", issues);
  requireAbsent(desktop.elements, "moduleLabel", "desktop menu module label", issues);
  requireAbsent(desktop.elements, "premise", "desktop menu premise", issues);
  requireVisible(desktop.elements, "bestRecord", true, "desktop menu best record", issues);
  requireElementText(desktop.elements, "tutorialButton", "Tutorial", "desktop menu tutorial button", issues);
  requireElementText(desktop.elements, "trainingButton", "Training", "desktop menu training button", issues);
  requireElementText(desktop.elements, "tokenLogButton", "Token Log", "desktop menu token log button", issues);
  requireElementText(desktop.elements, "settingsButton", "Settings", "desktop menu settings button", issues);

  requireEqual(mobile.scene, "MenuScene", "mobile menu scene", issues);
  requireEqual(mobile.compact, true, "mobile menu compact", issues);
  requireElementText(mobile.elements, "companyMark", "Welcome to WienerWorks", "mobile menu company", issues);
  requireElementText(mobile.elements, "title", "Tokenizer Training", "mobile menu title", issues);
  requireAbsent(mobile.elements, "moduleLabel", "mobile menu module label", issues);
  requireAbsent(mobile.elements, "premise", "mobile menu premise", issues);
  requireVisible(mobile.elements, "bestRecord", true, "mobile menu best record", issues);
  requireElementText(
    mobile.elements,
    "bestRecord",
    "BEST RANK\nRegex Intern\n7 rounds",
    "mobile menu best record",
    issues
  );
  requireElementText(mobile.elements, "tutorialButton", "Tutorial", "mobile menu tutorial button", issues);
  requireElementText(mobile.elements, "trainingButton", "Training", "mobile menu training button", issues);
  requireElementText(mobile.elements, "tokenLogButton", "Token Log", "mobile menu token log button", issues);
  requireElementText(mobile.elements, "settingsButton", "Settings", "mobile menu settings button", issues);
  for (const id of ["tutorialButton", "trainingButton", "tokenLogButton", "settingsButton"]) {
    requireTouchRect(element(mobile.elements, id)?.rect, `mobile menu ${id}`, issues);
  }
}

function validatePlaySurfacePair(
  desktop: JsonRecord,
  mobile: JsonRecord,
  expected: {
    label: string;
    mode: "tutorial" | "endless";
    desktopViewport: { width: number; height: number };
    mobileViewport: { width: number; height: number };
    hudLabel: string;
    hudCurrent: number;
    hudTarget: number;
  },
  issues: string[]
): void {
  validateSinglePlaySurface(desktop, {
    label: `${expected.label} desktop`,
    compact: false,
    viewport: expected.desktopViewport,
    mode: expected.mode,
    fixtureId: "simple_001",
    phase: "active"
  }, issues);
  validateSinglePlaySurface(mobile, {
    label: `${expected.label} mobile`,
    compact: true,
    viewport: expected.mobileViewport,
    mode: expected.mode,
    fixtureId: "simple_001",
    phase: "active"
  }, issues);

  const desktopSummary = summaryOf(desktop);
  const mobileSummary = summaryOf(mobile);
  const desktopSnapshot = snapshotOf(desktop);
  const mobileSnapshot = snapshotOf(mobile);
  const desktopText = element(desktopSnapshot.elements, "text");
  const mobileText = element(mobileSnapshot.elements, "text");

  requireEqual(at(desktopSummary, ["state", "hudProgressLabel"]), expected.hudLabel, `${expected.label} desktop HUD label`, issues);
  requireEqual(at(mobileSummary, ["state", "hudProgressLabel"]), expected.hudLabel, `${expected.label} mobile HUD label`, issues);
  requireEqual(at(desktopSummary, ["state", "hudProgressCurrent"]), expected.hudCurrent, `${expected.label} desktop HUD current`, issues);
  requireEqual(at(mobileSummary, ["state", "hudProgressCurrent"]), expected.hudCurrent, `${expected.label} mobile HUD current`, issues);
  requireEqual(at(desktopSummary, ["state", "hudProgressTarget"]), expected.hudTarget, `${expected.label} desktop HUD target`, issues);
  requireEqual(at(mobileSummary, ["state", "hudProgressTarget"]), expected.hudTarget, `${expected.label} mobile HUD target`, issues);
  requireEqual(desktopText?.text, mobileText?.text, `${expected.label} prompt text parity`, issues);

  const desktopFont = numberValue(desktopText?.fontSize);
  const mobileFont = numberValue(mobileText?.fontSize);
  if (!(desktopFont > mobileFont)) {
    issues.push(`${expected.label}: mobile prompt font should be smaller than desktop while preserving text.`);
  }

  const desktopHud = element(desktopSnapshot.elements, "hud")?.rect;
  const mobileHud = element(mobileSnapshot.elements, "hud")?.rect;
  if (!(numberValue(at(desktopHud, ["width"])) > numberValue(at(mobileHud, ["width"])))) {
    issues.push(`${expected.label}: desktop HUD should remain wider than mobile HUD.`);
  }
}

function validateSinglePlaySurface(
  evidence: JsonRecord,
  expected: {
    label: string;
    compact: boolean;
    viewport: { width: number; height: number };
    mode: "tutorial" | "endless";
    fixtureId: string;
    phase: "active";
  },
  issues: string[]
): void {
  const summary = summaryOf(evidence);
  const snapshot = snapshotOf(evidence);
  const viewport = at(summary, ["viewport"]);

  requireEqual(at(summary, ["scene"]), "PlayScene", `${expected.label} scene`, issues);
  requireEqual(at(summary, ["compact"]), expected.compact, `${expected.label} compact`, issues);
  requireEqual(at(viewport, ["width"]), expected.viewport.width, `${expected.label} viewport width`, issues);
  requireEqual(at(viewport, ["height"]), expected.viewport.height, `${expected.label} viewport height`, issues);
  requireEqual(at(summary, ["state", "mode"]), expected.mode, `${expected.label} mode`, issues);
  requireEqual(at(summary, ["state", "phase"]), expected.phase, `${expected.label} phase`, issues);
  requireEqual(at(summary, ["state", "fixtureId"]), expected.fixtureId, `${expected.label} fixture`, issues);
  requireEqual(at(summary, ["state", "round"]), 1, `${expected.label} round`, issues);
  requireEqual(at(summary, ["state", "cutCount"]), 0, `${expected.label} cut count`, issues);
  requireEqual(at(summary, ["state", "legalSlotCount"]), 16, `${expected.label} legal slots`, issues);
  requireTrue(at(summary, ["state", "allPlayControlTouchTargetsOk"]), `${expected.label} touch target aggregate`, issues);
  requireEqual(at(summary, ["state", "feedbackVisible"]), false, `${expected.label} feedback visibility`, issues);

  for (const id of requiredPlayElementIds) {
    const candidate = element(snapshot.elements, id);
    if (!candidate) {
      issues.push(`${expected.label}: missing ${id} QA element.`);
      continue;
    }
    if (candidate.rect) {
      requireWithinViewport(candidate.rect, expected.viewport, `${expected.label} ${id}`, issues);
    }
  }

  for (const id of ["resolveButton", "clearButton", "undoButton", "exitButton"]) {
    requireTouchRect(element(snapshot.elements, id)?.rect, `${expected.label} ${id}`, issues);
  }

  requireElementText(snapshot.elements, "resolveButton", "Resolve", `${expected.label} resolve button`, issues);
  requireElementText(snapshot.elements, "clearButton", expected.compact ? "Clear" : "Clear Cuts", `${expected.label} clear button`, issues);
  requireElementText(snapshot.elements, "undoButton", "Undo", `${expected.label} undo button`, issues);
  requireElementText(snapshot.elements, "exitButton", expectedExitButtonText(expected.compact, expected.mode), `${expected.label} exit button`, issues);
  requireSubstantiveText(snapshot.elements, "petSpeechBubble", `${expected.label} Wiener speech`, issues);

  if (expected.compact) {
    requireNoRectOverlap(snapshot.elements, "petSpeechBubble", "hud", `${expected.label}: petSpeechBubble must not overlap hud.`, issues);
    requireNoRectOverlap(snapshot.elements, "petSpeechBubble", "petWiener", `${expected.label}: petSpeechBubble must not overlap petWiener.`, issues);
    requireNoRectOverlap(snapshot.elements, "petSpeechBubble", "timer", `${expected.label}: petSpeechBubble must not overlap timer.`, issues);
    requireNoRectOverlap(snapshot.elements, "petSpeechBubble", "textPanel", `${expected.label}: petSpeechBubble must not overlap textPanel.`, issues);
  }
}

function expectedExitButtonText(compact: boolean, mode: "tutorial" | "endless"): string {
  if (compact) {
    return "Exit";
  }

  return mode === "tutorial" ? "Exit Tutorial" : "Exit Training";
}

function validateMobileResultsSurface(evidence: JsonRecord, issues: string[]): void {
  const summary = summaryOf(evidence);
  const snapshot = snapshotOf(evidence);
  const viewport = { width: 368, height: 552 };

  requireEqual(at(summary, ["scene"]), "ResultsScene", "mobile results scene", issues);
  requireEqual(at(summary, ["compact"]), true, "mobile results compact", issues);
  requireEqual(at(summary, ["viewport", "width"]), viewport.width, "mobile results viewport width", issues);
  requireEqual(at(summary, ["viewport", "height"]), viewport.height, "mobile results viewport height", issues);
  requireEqual(at(summary, ["state", "outcome"]), "budget", "mobile results outcome", issues);
  requireEqual(at(summary, ["state", "rank"]), "Regex Intern", "mobile results seeded rank", issues);
  requireEqual(at(summary, ["state", "rounds"]), 7, "mobile results seeded rounds", issues);

  for (const id of requiredResultsElementIds) {
    const candidate = element(snapshot.elements, id);
    if (!candidate) {
      issues.push(`mobile results: missing ${id} QA element.`);
      continue;
    }
    if (candidate.rect) {
      requireWithinViewport(candidate.rect, viewport, `mobile results ${id}`, issues);
    }
  }

  requireElementText(snapshot.elements, "title", "Token Credits Depleted", "mobile results title", issues);
  requireCreditClosureSummary(snapshot.elements, issues);
  requireTextIncludes(snapshot.elements, "copySummaryPayload", "Tokenizer Training playtest summary", "mobile results copied summary", issues);
  requireTextIncludes(snapshot.elements, "copySummaryPayload", "Input feel trace:", "mobile results copied summary", issues);
  requireTextIncludes(snapshot.elements, "copySummaryPayload", "Input feel fields: first-cut latency", "mobile results copied summary", issues);
  requireTextIncludes(snapshot.elements, "copySummaryPayload", "touch-loupe clearance", "mobile results copied summary", issues);
  requireTextIncludes(snapshot.elements, "copySummaryPayload", "Best saved: 7 rounds / Regex Intern", "mobile results copied summary", issues);
  requireExactMetricIds(snapshot.elements, budgetMetricIds, issues);
  for (const id of forbiddenBudgetMetricIds) {
    requireAbsent(snapshot.elements, `metric-${id}`, "mobile budget results", issues);
  }
  const stateRank = at(summary, ["state", "rank"]);
  if (typeof stateRank === "string" && stateRank.trim().length > 0) {
    requireElementText(snapshot.elements, "metric-rank", `RANK: ${stateRank}`, "mobile results rank card", issues);
  }
  for (const id of budgetMetricIds) {
    const elementId = `metric-${id}`;
    requireRectHeightAtLeast(element(snapshot.elements, elementId)?.rect, 40, `mobile results ${elementId}`, issues);
  }
  for (const id of ["copyButton", "againButton", "menuButton"]) {
    requireTouchRect(element(snapshot.elements, id)?.rect, `mobile results ${id}`, issues);
  }
}

function requireCreditClosureSummary(elements: unknown, issues: string[]): void {
  const candidate = element(elements, "summary");
  const summaryText = typeof candidate?.text === "string" ? candidate.text.trim().toLowerCase() : "";
  const communicatesCreditDepletion =
    /\btoken credits?\b/.test(summaryText) &&
    /\b(?:depleted|empty|zero|no longer|not enough|insufficient)\b/.test(summaryText);
  const communicatesClosure = /\b(?:closed|closure|depleted|ended|terminated|revoked)\b/.test(summaryText);

  if (!communicatesCreditDepletion || !communicatesClosure) {
    issues.push("mobile results summary: expected summary text to communicate Token Credit depletion and training closure.");
  }
}

function requireExactMetricIds(elements: unknown, expected: readonly string[], issues: string[]): void {
  const actual = Array.isArray(elements)
    ? elements.flatMap((candidate) => {
        if (!isRecord(candidate) || typeof candidate.id !== "string" || !candidate.id.startsWith("metric-")) {
          return [];
        }
        return [candidate.id.slice("metric-".length)];
      })
    : [];
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();

  if (
    actualSorted.length !== expectedSorted.length ||
    actualSorted.some((id, index) => id !== expectedSorted[index])
  ) {
    issues.push(
      `mobile budget results: expected metric IDs ${expected.join(", ")}, got ${actual.length > 0 ? actual.join(", ") : "none"}.`
    );
  }
}

function requireFile(directory: string, file: string, issues: string[], checkedFiles: string[]): void {
  const path = join(directory, file);
  checkedFiles.push(path);
  if (!existsSync(path)) {
    issues.push(`Evidence file is missing: ${path}.`);
  }
}

function readJsonEvidence(
  directory: string,
  file: string,
  issues: string[],
  checkedFiles: string[]
): JsonRecord | null {
  const path = join(directory, file);
  checkedFiles.push(path);
  if (!existsSync(path)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (!isRecord(parsed)) {
      issues.push(`Evidence JSON must contain an object: ${path}.`);
      return null;
    }
    return parsed;
  } catch (error) {
    issues.push(`Evidence JSON is not readable: ${path} (${String(error)}).`);
    return null;
  }
}

function summaryOf(evidence: JsonRecord): JsonRecord {
  const summary = evidence.summary;
  return isRecord(summary) ? summary : evidence;
}

function snapshotOf(evidence: JsonRecord): { elements: JsonRecord[] } {
  const pageSnapshot = at(evidence, ["pageCapture", "snapshot"]);
  const rootSnapshot = evidence.snapshot;
  const snapshot = isRecord(pageSnapshot) ? pageSnapshot : isRecord(rootSnapshot) ? rootSnapshot : evidence;
  const elements = Array.isArray(snapshot.elements) ? snapshot.elements.filter(isRecord) : [];
  return { elements };
}

function element(elements: unknown, id: string): JsonRecord | undefined {
  if (!Array.isArray(elements)) {
    return undefined;
  }
  return elements.find((candidate) => isRecord(candidate) && candidate.id === id) as JsonRecord | undefined;
}

function requireElementText(
  elements: unknown,
  id: string,
  expected: string,
  label: string,
  issues: string[]
): void {
  const candidate = element(elements, id);
  if (!candidate) {
    issues.push(`${label}: missing ${id}.`);
    return;
  }
  requireEqual(candidate.text, expected, label, issues);
}

function requireTextIncludes(elements: unknown, id: string, expected: string, label: string, issues: string[]): void {
  const candidate = element(elements, id);
  if (!candidate || typeof candidate.text !== "string" || !candidate.text.includes(expected)) {
    issues.push(`${label}: expected ${id} text to include ${expected}.`);
  }
}

function requireSubstantiveText(elements: unknown, id: string, label: string, issues: string[]): void {
  const candidate = element(elements, id);
  if (!candidate || typeof candidate.text !== "string" || candidate.text.trim().length < 8) {
    issues.push(`${label}: missing substantive ${id} text.`);
  }
}

function requireVisible(elements: unknown, id: string, visible: boolean, label: string, issues: string[]): void {
  const candidate = element(elements, id);
  if (!candidate) {
    issues.push(`${label}: missing ${id}.`);
    return;
  }
  requireEqual(candidate.visible ?? true, visible, label, issues);
}

function requireAbsent(elements: unknown, id: string, label: string, issues: string[]): void {
  const candidate = element(elements, id);
  if (candidate) {
    issues.push(`${label}: expected ${id} to be absent.`);
  }
}

function requireRetiredQaElementsAbsent(evidence: JsonRecord, label: string, issues: string[]): void {
  const elements = snapshotOf(evidence).elements;
  for (const id of retiredQaElementIds) {
    if (element(elements, id)) {
      issues.push(`${label}: retired QA element ${id} must be absent.`);
    }
  }
}

function requireTouchRect(value: unknown, label: string, issues: string[]): void {
  const rect = isRecord(value) ? value : undefined;
  if (!rect) {
    issues.push(`${label}: missing touch target rect.`);
    return;
  }
  if (numberValue(rect.width) < 44 || numberValue(rect.height) < 44) {
    issues.push(`${label}: touch target must be at least 44px wide and high.`);
  }
}

function requireRectHeightAtLeast(value: unknown, minHeight: number, label: string, issues: string[]): void {
  const rect = isRecord(value) ? value : undefined;
  if (!rect) {
    issues.push(`${label}: missing rect.`);
    return;
  }
  if (numberValue(rect.height) < minHeight) {
    issues.push(`${label}: expected height at least ${minHeight}px, got ${round(numberValue(rect.height))}px.`);
  }
}

function requireWithinViewport(
  value: unknown,
  viewport: { width: number; height: number },
  label: string,
  issues: string[]
): void {
  if (!isRecord(value)) {
    issues.push(`${label}: missing rect.`);
    return;
  }
  const x = numberValue(value.x);
  const y = numberValue(value.y);
  const width = numberValue(value.width);
  const height = numberValue(value.height);
  if (x - width / 2 < 0 || x + width / 2 > viewport.width || y - height / 2 < 0 || y + height / 2 > viewport.height) {
    issues.push(`${label}: rect is outside ${viewport.width}x${viewport.height} viewport.`);
  }
}

function requireNoRectOverlap(elements: unknown, firstId: string, secondId: string, message: string, issues: string[]): void {
  const firstRect = element(elements, firstId)?.rect;
  const secondRect = element(elements, secondId)?.rect;
  if (rectsOverlap(firstRect, secondRect)) {
    issues.push(message);
  }
}

function requireEqual(actual: unknown, expected: unknown, label: string, issues: string[]): void {
  if (actual !== expected) {
    issues.push(`${label}: expected ${String(expected)}, got ${String(actual)}.`);
  }
}

function requireTrue(actual: unknown, label: string, issues: string[]): void {
  if (actual !== true) {
    issues.push(`${label}: expected true, got ${String(actual)}.`);
  }
}

function at(value: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), value);
}

function numberValue(value: unknown): number {
  return typeof value === "number" ? value : Number.NaN;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function rectsOverlap(first: unknown, second: unknown): boolean {
  const firstEdges = rectEdges(first);
  const secondEdges = rectEdges(second);
  if (!firstEdges || !secondEdges) {
    return false;
  }

  return (
    firstEdges.left < secondEdges.right &&
    firstEdges.right > secondEdges.left &&
    firstEdges.top < secondEdges.bottom &&
    firstEdges.bottom > secondEdges.top
  );
}

function rectEdges(value: unknown): { left: number; right: number; top: number; bottom: number } | null {
  if (!isRecord(value)) {
    return null;
  }
  const x = numberValue(value.x);
  const y = numberValue(value.y);
  const width = numberValue(value.width);
  const height = numberValue(value.height);
  if (![x, y, width, height].every(Number.isFinite)) {
    return null;
  }

  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2
  };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const directory = parseMobileSurfaceEvidenceArgs(process.argv.slice(2));
  const evaluation = evaluateMobileSurfaceEvidence(directory);
  console.log(renderMobileSurfaceEvidenceEvaluation(evaluation));
  process.exit(evaluation.ready ? 0 : 1);
}
