import { existsSync, readFileSync } from "node:fs";
import { extname, isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";
import { imageEvidenceIssues } from "./image-evidence";

type JsonRecord = Record<string, unknown>;

interface RuntimeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MobileRuntimeEvidenceEvaluation {
  ready: boolean;
  directory: string;
  issues: string[];
  checkedFiles: string[];
}

const defaultEvidenceDirectory = ".qa/mobile-runtime/latest";
const expectedBoundaries = [3, 7, 11, 14, 18];
const expectedEvidenceTerms = ["RESOLVED TOKENS", "VERIFIED", "REWORK", "NET"];
const expectedReadableEvidenceTerms = ["RESOLVED TOKENS", "VERIFIED", "REWORK", "NET"];
const runtimeViewport = { width: 368, height: 552 };
const requiredControlIds = new Set(["resolveButton", "clearButton", "undoButton", "exitButton"]);
const retiredSidecarElementIds = new Set([
  "brandPanel",
  "assistantPanel",
  "footerPanel",
  "overseer",
  "tutorialPopup",
  "tokenStrip",
  "segmentationEvidence"
]);
const reviewControlClearancePx = 8;
const requiredScreenshots = [
  "cua-flow-review.png",
  "cua-endless-review-clean.png",
  "cua-endless-review-held-tight.png",
  "cua-endless-auto-check-next-round.png",
  "cua-feedback-card-readable-phone.png"
] as const;

export function evaluateMobileRuntimeEvidence(directory = defaultEvidenceDirectory): MobileRuntimeEvidenceEvaluation {
  const issues: string[] = [];
  const checkedFiles: string[] = [];

  if (!existsSync(directory)) {
    issues.push(`Evidence directory is missing: ${directory}.`);
  }

  for (const screenshot of requiredScreenshots) {
    requireRuntimeScreenshot(directory, screenshot, issues, checkedFiles);
  }

  const tutorial = readJsonEvidence(directory, "cua-flow-result.json", issues, checkedFiles);
  const endlessClean = readJsonEvidence(directory, "cua-endless-flow-clean-result.json", issues, checkedFiles);
  const endlessHeld = readJsonEvidence(directory, "cua-endless-review-held-tight-result.json", issues, checkedFiles);
  const endlessAuto = readJsonEvidence(directory, "cua-endless-auto-check-result.json", issues, checkedFiles);
  const readableFeedback = readJsonEvidence(directory, "cua-feedback-card-readable-phone-result.json", issues, checkedFiles);

  if (tutorial) {
    validateTutorialEvidence(tutorial, issues);
  }
  if (endlessClean) {
    validateEndlessCleanEvidence(directory, endlessClean, issues, checkedFiles);
  }
  if (endlessHeld) {
    validateEndlessHeldEvidence(directory, endlessHeld, issues, checkedFiles);
  }
  if (endlessAuto) {
    validateEndlessAutoEvidence(directory, endlessAuto, issues, checkedFiles);
  }
  if (readableFeedback) {
    validateReadableFeedbackEvidence(readableFeedback, issues);
  }

  return {
    ready: issues.length === 0,
    directory,
    issues,
    checkedFiles: Array.from(new Set(checkedFiles)).sort()
  };
}

export function renderMobileRuntimeEvidenceEvaluation(evaluation: MobileRuntimeEvidenceEvaluation): string {
  const lines = [
    "Tokenizer Training mobile runtime evidence",
    `Directory: ${evaluation.directory}`,
    `Decision: ${evaluation.ready ? "browser/mobile runtime evidence passed" : "browser/mobile runtime evidence incomplete"}`,
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

export function parseMobileRuntimeEvidenceArgs(args: string[]): string {
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

function validateTutorialEvidence(evidence: JsonRecord, issues: string[]): void {
  requireSlotTargets(evidence, "tutorial target slots", issues);
  requireTouchAssistPreview(at(evidence, ["loupePreview"]), "tutorial touch assist preview", issues);
  requireEqual(at(evidence, ["afterCuts", "cutCount"]), 5, "tutorial afterCuts cutCount", issues);
  requireTrue(at(evidence, ["afterCuts", "resolveReady"]), "tutorial afterCuts resolveReady", issues);
  requireEqual(at(evidence, ["afterResolve", "scene"]), "PlayScene", "tutorial review scene", issues);
  requireEqual(at(evidence, ["afterResolve", "phase"]), "review", "tutorial review phase", issues);
  requireEqual(at(evidence, ["afterResolve", "cutCount"]), 5, "tutorial review cutCount", issues);
  requireTrue(at(evidence, ["afterResolve", "feedbackVisible"]), "tutorial review feedbackVisible", issues);
  requireEvidenceText(at(evidence, ["afterResolve", "feedbackText"]), "tutorial feedback text", issues);
  requireTrue(
    at(evidence, ["afterResolve", "state", "allPlayControlTouchTargetsOk"]),
    "tutorial play control touch targets",
    issues
  );
  requireCompactFeedbackCard(at(evidence, ["afterResolve", "feedbackCard"]), "tutorial feedback card", issues);
}

function validateEndlessCleanEvidence(
  directory: string,
  evidence: JsonRecord,
  issues: string[],
  checkedFiles: string[]
): void {
  requireUrlTerms(
    at(evidence, ["url"]),
    ["surface=mobile", "mode=endless", "qaViewport=368x552", "qaFixtureId=simple_001"],
    "endless clean URL",
    issues
  );
  requireNumberArray(at(evidence, ["targetBoundaries"]), expectedBoundaries, "endless target boundaries", issues);
  requireEqual(at(evidence, ["initial", "mode"]), "endless", "endless initial mode", issues);
  requireEqual(at(evidence, ["initial", "phase"]), "active", "endless initial phase", issues);
  requireEqual(at(evidence, ["initial", "round"]), 1, "endless initial round", issues);
  requireEqual(at(evidence, ["initial", "fixtureId"]), "simple_001", "endless initial fixture", issues);
  requireEqual(at(evidence, ["initial", "viewport", "width"]), 368, "endless initial viewport width", issues);
  requireEqual(at(evidence, ["initial", "viewport", "height"]), 552, "endless initial viewport height", issues);
  requireTouchAssistPreview(at(evidence, ["loupePreview"]), "endless touch assist preview", issues);
  requireRoundCutState(evidence, "afterCuts", "endless afterCuts", issues);
  requireReviewState(evidence, "review", "endless clean review", issues);
  requireTrue(at(evidence, ["review", "rendererQaCapture"]), "endless clean renderer QA capture", issues);
  requireEqual(at(evidence, ["review", "rendererQaCaptureStatus"]), "ok", "endless clean renderer QA capture status", issues);
  requireCanvasCapture(at(evidence, ["review", "canvasCapture"]), "endless clean canvas capture", issues);
  requireAutoNextState(evidence, "autoNext", "endless clean auto-next", issues);
  requireArtifactList(directory, evidence, "endless clean artifacts", issues, checkedFiles);
}

function validateEndlessHeldEvidence(
  directory: string,
  evidence: JsonRecord,
  issues: string[],
  checkedFiles: string[]
): void {
  requireUrlTerms(
    at(evidence, ["url"]),
    ["surface=mobile", "mode=endless", "qaFixtureId=simple_001", "qaHoldReview=1"],
    "endless held URL",
    issues
  );
  requireRoundCutState(evidence, "afterCuts", "endless held afterCuts", issues);
  requireHeldReviewState(evidence, "review", "endless held review", issues);
  requireCompactFeedbackCard(at(evidence, ["review", "feedbackCard"]), "endless held feedback card", issues);
  requireTokenSplit(at(evidence, ["review", "feedbackTokenSplit"]), "endless held token split", issues);
  requireArtifactList(directory, evidence, "endless held artifacts", issues, checkedFiles);
}

function validateEndlessAutoEvidence(
  directory: string,
  evidence: JsonRecord,
  issues: string[],
  checkedFiles: string[]
): void {
  requireUrlTerms(
    at(evidence, ["url"]),
    ["surface=mobile", "mode=endless", "qaFixtureId=simple_001"],
    "endless auto URL",
    issues
  );
  requireRoundCutState(evidence, "afterCuts", "endless auto afterCuts", issues);
  requireEqual(at(evidence, ["reviewWindow", "scene"]), "PlayScene", "endless auto review scene", issues);
  requireEqual(at(evidence, ["reviewWindow", "phase"]), "review", "endless auto review phase", issues);
  requireTrue(at(evidence, ["reviewWindow", "feedbackVisible"]), "endless auto review feedbackVisible", issues);
  requireEvidenceText(at(evidence, ["reviewWindow", "feedbackText"]), "endless auto feedback text", issues);
  requireAutoNextState(evidence, "autoNext", "endless auto auto-next", issues);
  requireArtifactList(directory, evidence, "endless auto artifacts", issues, checkedFiles);
}

function validateReadableFeedbackEvidence(evidence: JsonRecord, issues: string[]): void {
  requireUrlTerms(
    at(evidence, ["url"]),
    ["surface=mobile", "qaViewport=368x552"],
    "readable feedback URL",
    issues
  );
  requireEqual(at(evidence, ["browserViewport", "width"]), 368, "readable feedback browser viewport width", issues);
  requireEqual(at(evidence, ["browserViewport", "height"]), 552, "readable feedback browser viewport height", issues);
  requireEqual(at(evidence, ["phase"]), "review", "readable feedback phase", issues);
  requireReadableFeedbackCard(at(evidence, ["feedbackCard"]), "readable feedback card", issues);
  requireReadableFeedbackText(at(evidence, ["feedbackText"]), "readable feedback text", issues);
  requireTokenSplit(at(evidence, ["feedbackTokenSplit"]), "readable feedback token split", issues);
  requireEqual(at(evidence, ["limitations", "partialCutRun"]), true, "readable feedback partial-cut limitation", issues);
}

function requireRoundCutState(evidence: JsonRecord, key: string, label: string, issues: string[]): void {
  requireEqual(at(evidence, [key, "mode"]), "endless", `${label} mode`, issues);
  requireEqual(at(evidence, [key, "phase"]), "active", `${label} phase`, issues);
  requireEqual(at(evidence, [key, "round"]), 1, `${label} round`, issues);
  requireEqual(at(evidence, [key, "fixtureId"]), "simple_001", `${label} fixture`, issues);
  requireEqual(at(evidence, [key, "cutCount"]), 5, `${label} cutCount`, issues);
  requireEqual(at(evidence, [key, "inputFeelCutCount"]), 5, `${label} inputFeelCutCount`, issues);
  requireTrue(at(evidence, [key, "resolveReady"]), `${label} resolveReady`, issues);
  requireTrue(at(evidence, [key, "allTouchTargetsOk"]), `${label} touch targets`, issues);
}

function requireReviewState(evidence: JsonRecord, key: string, label: string, issues: string[]): void {
  requireEqual(at(evidence, [key, "scene"]), "PlayScene", `${label} scene`, issues);
  requireEqual(at(evidence, [key, "mode"]), "endless", `${label} mode`, issues);
  requireEqual(at(evidence, [key, "phase"]), "review", `${label} phase`, issues);
  requireEqual(at(evidence, [key, "round"]), 1, `${label} round`, issues);
  requireEqual(at(evidence, [key, "fixtureId"]), "simple_001", `${label} fixture`, issues);
  requireEqual(at(evidence, [key, "cutCount"]), 5, `${label} cutCount`, issues);
  requireTrue(at(evidence, [key, "feedbackVisible"]), `${label} feedbackVisible`, issues);
  requireEvidenceText(at(evidence, [key, "feedbackText"]), `${label} feedback text`, issues);
  requireTrue(at(evidence, [key, "allTouchTargetsOk"]), `${label} touch targets`, issues);
  requireCompactFeedbackCard(at(evidence, [key, "feedbackCard"]), `${label} feedback card`, issues);
}

function requireHeldReviewState(evidence: JsonRecord, key: string, label: string, issues: string[]): void {
  requireEqual(at(evidence, [key, "scene"]), "PlayScene", `${label} scene`, issues);
  requireEqual(at(evidence, [key, "mode"]), "endless", `${label} mode`, issues);
  requireEqual(at(evidence, [key, "phase"]), "review", `${label} phase`, issues);
  requireEqual(at(evidence, [key, "round"]), 1, `${label} round`, issues);
  requireEqual(at(evidence, [key, "fixtureId"]), "simple_001", `${label} fixture`, issues);
  requireEqual(at(evidence, [key, "cutCount"]), 5, `${label} cutCount`, issues);
  requireTrue(at(evidence, [key, "feedbackVisible"]), `${label} feedbackVisible`, issues);
  requireEvidenceText(at(evidence, [key, "feedbackText"]), `${label} feedback text`, issues);
  requireTrue(at(evidence, [key, "allTouchTargetsOk"]), `${label} touch targets`, issues);
  requireCompactFeedbackCard(at(evidence, [key, "feedbackCard"]), `${label} feedback card`, issues);
}

function requireAutoNextState(evidence: JsonRecord, key: string, label: string, issues: string[]): void {
  requireEqual(at(evidence, [key, "scene"]), "PlayScene", `${label} scene`, issues);
  requireEqual(at(evidence, [key, "mode"]), "endless", `${label} mode`, issues);
  requireEqual(at(evidence, [key, "phase"]), "active", `${label} phase`, issues);
  requireEqual(at(evidence, [key, "round"]), 2, `${label} round`, issues);
  requireEqual(at(evidence, [key, "fixtureId"]), "simple_001", `${label} fixture`, issues);
  requireEqual(at(evidence, [key, "cutCount"]), 0, `${label} cutCount`, issues);
  requireFalse(at(evidence, [key, "feedbackVisible"]), `${label} feedbackVisible`, issues);
  requireTrue(at(evidence, [key, "allTouchTargetsOk"]), `${label} touch targets`, issues);
}

function requireSlotTargets(evidence: JsonRecord, label: string, issues: string[]): void {
  const targets = at(evidence, ["targetSlots"]);
  if (!Array.isArray(targets) || targets.length !== 5) {
    issues.push(`${label}: expected 5 staged target slots.`);
    return;
  }

  targets.forEach((target, index) => {
    const width = numberAt(target, ["width"]);
    const height = numberAt(target, ["height"]);
    if (width < 44 || height < 44) {
      issues.push(`${label} ${index + 1}: touch target must be at least 44px wide and high.`);
    }
  });
}

function requireTouchAssistPreview(value: unknown, label: string, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${label}: missing active touch assist preview evidence.`);
    return;
  }

  requireEqual(at(value, ["phase"]), "active", `${label} phase`, issues);
  requireEqual(at(value, ["touchAimLoupe", "visible"]), false, `${label} floating loupe hidden`, issues);
  requireEqual(at(value, ["touchAimLoupe", "occlusionSafe"]), false, `${label} floating loupe occlusion state hidden`, issues);
  requireEqual(at(value, ["touchAimLoupe", "snapReady"]), false, `${label} floating loupe snap state hidden`, issues);
  requireEqual(at(value, ["touchAimLoupe", "armedPreviewReady"]), true, `${label} armed preview ready`, issues);

  const boundary = numberAt(value, ["touchAimLoupe", "armedPreviewBoundary"]);
  if (!expectedBoundaries.includes(boundary)) {
    issues.push(`${label} armed preview boundary: expected one of [${expectedBoundaries.join(", ")}], got ${formatValue(boundary)}.`);
  }

  requireNoRuntimeRect(at(value, ["touchAimLoupe", "rect"]), `${label} floating loupe rect`, issues);
  requireRuntimeRect(at(value, ["touchAimLoupe", "armedPreviewRect"]), `${label} armed preview rect`, issues);
}

function requireCompactFeedbackCard(value: unknown, label: string, issues: string[]): void {
  const width = numberAt(value, ["width"]);
  const height = numberAt(value, ["height"]);
  if (width <= 0 || width > 368) {
    issues.push(`${label}: width must fit the 368px mobile QA viewport.`);
  }
  if (height <= 0 || height > 180) {
    issues.push(`${label}: height must stay compact enough for mobile review.`);
  }
}

function requireReadableFeedbackCard(value: unknown, label: string, issues: string[]): void {
  requireCompactFeedbackCard(value, label, issues);
  const height = numberAt(value, ["height"]);
  if (height < 132) {
    issues.push(`${label}: height must be at least 132px so mobile evidence copy is readable.`);
  }
}

function requireTokenSplit(value: unknown, label: string, issues: string[]): void {
  const width = numberAt(value, ["width"]);
  const height = numberAt(value, ["height"]);
  if (width <= 0 || width > 336 || height <= 0 || height > 64) {
    issues.push(`${label}: token split evidence must be present and fit inside the feedback card.`);
  }
}

function requireCanvasCapture(value: unknown, label: string, issues: string[]): void {
  const chunkCount = numberAt(value, ["chunkCount"]);
  const dataUrlLength = numberAt(value, ["dataUrlLength"]);
  const hash = stringAt(value, ["dataUrlHash"]);
  if (chunkCount < 1 || dataUrlLength < 10000 || hash.length < 4) {
    issues.push(`${label}: canvas capture must include non-trivial image data and a hash.`);
  }
}

function requireArtifactList(
  directory: string,
  evidence: JsonRecord,
  label: string,
  issues: string[],
  checkedFiles: string[]
): void {
  const artifacts = at(evidence, ["artifacts"]);
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    issues.push(`${label}: artifact list is missing.`);
    return;
  }

  for (const artifact of artifacts) {
    if (typeof artifact !== "string" || artifact.trim().length === 0) {
      issues.push(`${label}: artifact path is blank or not a string.`);
      continue;
    }
    const path = isAbsolute(artifact) ? artifact : join(directory, artifact);
    checkedFiles.push(path);
    if (!existsSync(path)) {
      issues.push(`${label}: artifact is missing: ${artifact}.`);
      continue;
    }

    requireArtifactEvidence(path, artifact, label, issues, checkedFiles);
  }
}

function requireArtifactEvidence(
  path: string,
  artifact: string,
  label: string,
  issues: string[],
  checkedFiles: string[]
): void {
  const extension = extname(path).toLowerCase();
  if (extension === ".png" || extension === ".jpg" || extension === ".jpeg") {
    issues.push(...imageEvidenceIssues(path, {
      label: `${label}: ${artifact}`,
      width: 368,
      height: 552,
      minBytes: 3_000,
      requireVisualContent: true
    }));
    requireSiblingQaJson(path, artifact, label, issues, checkedFiles);
    return;
  }

  if (extension === ".json") {
    requireJsonObjectArtifact(path, artifact, label, issues);
  }
}

function requireSiblingQaJson(
  imagePath: string,
  artifact: string,
  label: string,
  issues: string[],
  checkedFiles: string[]
): void {
  const jsonPath = imagePath.replace(/\.(png|jpe?g)$/i, ".json");
  if (jsonPath === imagePath) {
    return;
  }
  checkedFiles.push(jsonPath);
  const sidecar = requireJsonObjectArtifact(jsonPath, `${artifact} sidecar`, label, issues);
  if (!sidecar) {
    return;
  }

  const elements = at(sidecar, ["elements"]);
  if (!Array.isArray(elements) || elements.length === 0) {
    issues.push(`${label}: ${artifact} sidecar must include QA element geometry.`);
    return;
  }

  const elementsById = new Map<string, unknown>();
  for (const element of elements) {
    const id = stringAt(element, ["id"]);
    if (id.length > 0) {
      elementsById.set(id, element);
    }
  }
  rejectRetiredSidecarElementIds(elementsById, `${label}: ${artifact} sidecar`, issues);
  for (const id of requiredSidecarElementIds(artifact, sidecar)) {
    const element = elementsById.get(id);
    if (!element) {
      issues.push(`${label}: ${artifact} sidecar is missing ${id} geometry.`);
      continue;
    }
    requireSidecarElementRect(element, id, `${label}: ${artifact} sidecar`, issues);
    requireSidecarElementText(element, id, `${label}: ${artifact} sidecar`, issues);
  }

  if (isReviewOrFeedbackArtifact(artifact)) {
    requireFeedbackControlClearance(elementsById, `${label}: ${artifact} sidecar`, issues);
  }
}

function rejectRetiredSidecarElementIds(
  elementsById: Map<string, unknown>,
  label: string,
  issues: string[]
): void {
  for (const id of retiredSidecarElementIds) {
    if (elementsById.has(id)) {
      issues.push(`${label} includes retired element ID ${id}.`);
    }
  }
}

function requiredSidecarElementIds(artifact: string, sidecar: JsonRecord): string[] {
  const required = ["hud", "playfield", "textPanel", "text", "resolveButton", "clearButton", "undoButton", "exitButton"];
  if (isReviewOrFeedbackArtifact(artifact)) {
    required.push("feedbackCard", "feedbackTokenSplit", "petWiener");
  }
  if (expectsWienerReviewSpeech(sidecar)) {
    required.push("petSpeechBubble");
  }
  if (artifact.includes("auto-check-next-round")) {
    required.push("cutStatus");
  }
  return required;
}

function expectsWienerReviewSpeech(sidecar: JsonRecord): boolean {
  const mode = stringAt(sidecar, ["state", "mode"]);
  return stringAt(sidecar, ["scene"]) === "PlayScene"
    && (mode === "tutorial" || mode === "endless")
    && stringAt(sidecar, ["state", "phase"]) === "review";
}

function isReviewOrFeedbackArtifact(artifact: string): boolean {
  return artifact.includes("review") || artifact.includes("feedback-card");
}

function requireSidecarElementRect(element: unknown, id: string, label: string, issues: string[]): void {
  const x = numberAt(element, ["rect", "x"]);
  const y = numberAt(element, ["rect", "y"]);
  const width = numberAt(element, ["rect", "width"]);
  const height = numberAt(element, ["rect", "height"]);

  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    issues.push(`${label} ${id}: missing usable rect.`);
    return;
  }

  const left = x - width / 2;
  const right = x + width / 2;
  const top = y - height / 2;
  const bottom = y + height / 2;
  if (left < -0.5 || top < -0.5 || right > runtimeViewport.width + 0.5 || bottom > runtimeViewport.height + 0.5) {
    issues.push(`${label} ${id}: rect is outside ${runtimeViewport.width}x${runtimeViewport.height} viewport.`);
  }

  if (requiredControlIds.has(id) && (width < 44 || height < 44)) {
    issues.push(`${label} ${id}: touch target must be at least 44px wide and high.`);
  }

  if (id === "feedbackTokenSplit" && (width < 80 || height < 12 || width > 336 || height > 64)) {
    issues.push(`${label} ${id}: token split evidence must fit inside the feedback card.`);
  }
}

function requireSidecarElementText(element: unknown, id: string, label: string, issues: string[]): void {
  const text = stringAt(element, ["text"]).trim();

  if (id === "text") {
    requireSubstantiveText(text, `${label} ${id}`, issues);
    return;
  }

  if (requiredControlIds.has(id)) {
    if (text.length < 4) {
      issues.push(`${label} ${id}: missing visible control label.`);
    }
    return;
  }

  if (id === "cutStatus") {
    if (!/^NO CUTS$/.test(text) && !/^STAGED:\s*\d+$/.test(text)) {
      issues.push(`${label} ${id}: missing staged-cut status text.`);
    }
    return;
  }

  if (id === "feedbackCard") {
    requireReadableFeedbackText(text, `${label} ${id}`, issues);
    return;
  }

  if (id === "feedbackTokenSplit" && (!/RESOLVED TOKENS\s+\d+/.test(text) || !text.includes("│"))) {
    issues.push(`${label} ${id}: missing visible token split text.`);
  }

  if (id === "petSpeechBubble") {
    requireSubstantiveText(text, `${label} ${id}`, issues);
  }
}

function requireNoSidecarOverlap(
  a: unknown,
  b: unknown,
  aId: string,
  bId: string,
  label: string,
  issues: string[]
): void {
  const aRect = rectAt(a, ["rect"]);
  const bRect = rectAt(b, ["rect"]);
  if (!aRect || !bRect) {
    return;
  }

  if (rectsOverlap(aRect, bRect)) {
    issues.push(`${label}: ${aId} must not overlap ${bId}.`);
  }
}

function requireFeedbackControlClearance(elementsById: Map<string, unknown>, label: string, issues: string[]): void {
  const feedbackCard = rectAt(elementsById.get("feedbackCard"), ["rect"]);
  if (!feedbackCard) {
    return;
  }

  const controlTops = Array.from(requiredControlIds)
    .map((id) => rectAt(elementsById.get(id), ["rect"]))
    .filter((rect): rect is RuntimeRect => Boolean(rect))
    .map((rect) => rect.y - rect.height / 2);
  if (controlTops.length === 0) {
    return;
  }

  const controlTop = Math.min(...controlTops);
  const feedbackBottom = feedbackCard.y + feedbackCard.height / 2;
  const clearance = controlTop - feedbackBottom;
  if (clearance < reviewControlClearancePx) {
    issues.push(
      `${label}: feedbackCard must leave at least ${reviewControlClearancePx}px above bottom controls, got ${formatPx(clearance)}px.`
    );
  }
}

function rectAt(value: unknown, path: string[]): RuntimeRect | null {
  const x = numberAt(value, [...path, "x"]);
  const y = numberAt(value, [...path, "y"]);
  const width = numberAt(value, [...path, "width"]);
  const height = numberAt(value, [...path, "height"]);

  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    return null;
  }

  return { x, y, width, height };
}

function rectsOverlap(a: RuntimeRect, b: RuntimeRect): boolean {
  return (
    a.x - a.width / 2 < b.x + b.width / 2
    && a.x + a.width / 2 > b.x - b.width / 2
    && a.y - a.height / 2 < b.y + b.height / 2
    && a.y + a.height / 2 > b.y - b.height / 2
  );
}

function formatPx(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatValue(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "missing";
}

function requireRuntimeRect(value: unknown, label: string, issues: string[]): void {
  const rect = rectAt({ rect: value }, ["rect"]);
  if (!rect) {
    issues.push(`${label}: missing usable rect.`);
    return;
  }

  const left = rect.x - rect.width / 2;
  const right = rect.x + rect.width / 2;
  const top = rect.y - rect.height / 2;
  const bottom = rect.y + rect.height / 2;
  if (left < -0.5 || top < -0.5 || right > runtimeViewport.width + 0.5 || bottom > runtimeViewport.height + 0.5) {
    issues.push(`${label}: rect is outside ${runtimeViewport.width}x${runtimeViewport.height} viewport.`);
  }
}

function requireNoRuntimeRect(value: unknown, label: string, issues: string[]): void {
  const rect = rectAt({ rect: value }, ["rect"]);
  if (rect) {
    issues.push(`${label}: expected no detached rect, got ${formatValue(rect.width)}x${formatValue(rect.height)}.`);
  }
}

function requireJsonObjectArtifact(path: string, artifact: string, label: string, issues: string[]): JsonRecord | null {
  if (!existsSync(path)) {
    issues.push(`${label}: JSON artifact is missing: ${artifact}.`);
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (!isRecord(parsed)) {
      issues.push(`${label}: JSON artifact must contain an object: ${artifact}.`);
      return null;
    }
    return parsed;
  } catch (error) {
    issues.push(`${label}: JSON artifact is not readable: ${artifact} (${String(error)}).`);
  }
  return null;
}

function requireRuntimeScreenshot(
  directory: string,
  relativePath: string,
  issues: string[],
  checkedFiles: string[]
): void {
  const path = join(directory, relativePath);
  checkedFiles.push(path);
  issues.push(...imageEvidenceIssues(path, {
    label: `${relativePath} screenshot`,
    width: 368,
    height: 552,
    minBytes: 3_000,
    requireVisualContent: true
  }));
  requireSiblingQaJson(path, relativePath, `${relativePath} screenshot`, issues, checkedFiles);
}

function readJsonEvidence(
  directory: string,
  filename: string,
  issues: string[],
  checkedFiles: string[]
): JsonRecord | null {
  const path = join(directory, filename);
  checkedFiles.push(path);

  if (!existsSync(path)) {
    issues.push(`Evidence JSON is missing: ${path}.`);
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

function requireUrlTerms(value: unknown, terms: string[], label: string, issues: string[]): void {
  if (typeof value !== "string") {
    issues.push(`${label}: URL is missing.`);
    return;
  }

  for (const term of terms) {
    if (!value.includes(term)) {
      issues.push(`${label}: missing ${term}.`);
    }
  }
}

function requireEvidenceText(value: unknown, label: string, issues: string[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${label}: missing feedback evidence text.`);
    return;
  }

  for (const term of expectedEvidenceTerms) {
    if (!value.includes(term)) {
      issues.push(`${label}: missing ${term}.`);
    }
  }
  requireAuditEvidenceText(value, label, issues);
}

function requireReadableFeedbackText(value: unknown, label: string, issues: string[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${label}: missing feedback evidence text.`);
    return;
  }

  for (const term of expectedReadableEvidenceTerms) {
    if (!value.includes(term)) {
      issues.push(`${label}: missing ${term}.`);
    }
  }
  requireAuditEvidenceText(value, label, issues);
}

function requireAuditEvidenceText(value: string, label: string, issues: string[]): void {
  const hasFullAudit = /OK\s+\d+\s+MISS\s+\d+\s+FALSE\s+\d+/.test(value)
    && !/\b(?:TOK|BALANCE|BAL)\b/i.test(value);
  const hasCompactAudit = /OK\s+\d+\s+MISS\s+\d+\s+FALSE\s+\d+/.test(value);

  if (!hasFullAudit && !hasCompactAudit) {
    issues.push(`${label}: missing boundary audit evidence.`);
  }
}

function requireSubstantiveText(value: unknown, label: string, issues: string[]): void {
  if (typeof value !== "string" || value.trim().length < 12) {
    issues.push(`${label}: missing substantive text.`);
  }
}

function requireNumberArray(value: unknown, expected: number[], label: string, issues: string[]): void {
  if (!Array.isArray(value) || value.length !== expected.length) {
    issues.push(`${label}: expected [${expected.join(", ")}].`);
    return;
  }

  const actual = value.map((item) => (typeof item === "number" ? item : Number.NaN));
  if (actual.some((item, index) => item !== expected[index])) {
    issues.push(`${label}: expected [${expected.join(", ")}], got [${actual.join(", ")}].`);
  }
}

function requireEqual(value: unknown, expected: unknown, label: string, issues: string[]): void {
  if (value !== expected) {
    issues.push(`${label}: expected ${String(expected)}, got ${String(value)}.`);
  }
}

function requireTrue(value: unknown, label: string, issues: string[]): void {
  if (value !== true) {
    issues.push(`${label}: expected true, got ${String(value)}.`);
  }
}

function requireFalse(value: unknown, label: string, issues: string[]): void {
  if (value !== false) {
    issues.push(`${label}: expected false, got ${String(value)}.`);
  }
}

function at(value: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), value);
}

function numberAt(value: unknown, path: string[]): number {
  const target = at(value, path);
  return typeof target === "number" ? target : Number.NaN;
}

function stringAt(value: unknown, path: string[]): string {
  const target = at(value, path);
  return typeof target === "string" ? target : "";
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const directory = parseMobileRuntimeEvidenceArgs(process.argv.slice(2));
  const evaluation = evaluateMobileRuntimeEvidence(directory);
  console.log(renderMobileRuntimeEvidenceEvaluation(evaluation));
  process.exit(evaluation.ready ? 0 : 1);
}
