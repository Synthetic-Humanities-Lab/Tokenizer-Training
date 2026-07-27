import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  evaluateMobileRuntimeEvidence,
  type MobileRuntimeEvidenceEvaluation
} from "./evaluate-mobile-runtime-evidence";
import {
  evaluateMobileSurfaceEvidence,
  type MobileSurfaceEvidenceEvaluation
} from "./evaluate-mobile-surface-evidence";
import { imageEvidenceIssues } from "./image-evidence";

type JsonRecord = Record<string, unknown>;

export interface MobileMenuComparisonEvaluation {
  ready: boolean;
  directory: string;
  issues: string[];
  checkedFiles: string[];
}

export interface MobileCrossReferenceEvaluation {
  ready: boolean;
  menu: MobileMenuComparisonEvaluation;
  surface: MobileSurfaceEvidenceEvaluation;
  runtime: MobileRuntimeEvidenceEvaluation;
}

export interface MobileCrossReferenceOptions {
  menuDirectory: string;
  surfaceDirectory: string;
  runtimeDirectory: string;
}

const defaultOptions: MobileCrossReferenceOptions = {
  menuDirectory: ".qa/iab-surface-compare/latest",
  surfaceDirectory: ".qa/mobile-port-audit/latest",
  runtimeDirectory: ".qa/mobile-runtime/latest"
};

const menuImageArtifacts = [
  { file: "browser-desktop-menu.png", label: "desktop browser menu", width: 1280, height: 720 },
  { file: "browser-compact-menu.png", label: "compact browser menu", width: 368, height: 552 },
  { file: "mobile-surface-menu.png", label: "mobile surface menu", width: 368, height: 552 },
  { file: "mobile-surface-menu-tall.png", label: "tall mobile surface menu", width: 368, height: 800 }
] as const;

const menuEntryIds = [
  "browser-desktop-menu",
  "browser-compact-menu",
  "mobile-surface-menu",
  "mobile-surface-menu-tall"
] as const;

export function evaluateMobileCrossReference(
  options: Partial<MobileCrossReferenceOptions> = {}
): MobileCrossReferenceEvaluation {
  const resolved = { ...defaultOptions, ...options };
  const menu = evaluateMobileMenuComparison(resolved.menuDirectory);
  const surface = evaluateMobileSurfaceEvidence(resolved.surfaceDirectory);
  const runtime = evaluateMobileRuntimeEvidence(resolved.runtimeDirectory);

  return {
    ready: menu.ready && surface.ready && runtime.ready,
    menu,
    surface,
    runtime
  };
}

export function evaluateMobileMenuComparison(directory = defaultOptions.menuDirectory): MobileMenuComparisonEvaluation {
  const issues: string[] = [];
  const checkedFiles: string[] = [];

  if (!existsSync(directory)) {
    issues.push(`Menu comparison directory is missing: ${directory}.`);
  }

  requireFile(directory, "comparison.json", issues, checkedFiles);
  for (const artifact of menuImageArtifacts) {
    requireImageFile(directory, artifact, issues, checkedFiles);
  }

  const entries = readComparisonEntries(directory, issues, checkedFiles);
  const byId = new Map(entries.map((entry) => [stringAt(entry, ["id"]), entry]));
  for (const id of menuEntryIds) {
    if (!byId.has(id)) {
      issues.push(`Menu comparison is missing entry: ${id}.`);
    }
  }

  const desktop = byId.get("browser-desktop-menu");
  const compact = byId.get("browser-compact-menu");
  const mobile = byId.get("mobile-surface-menu");
  const mobileTall = byId.get("mobile-surface-menu-tall");

  if (desktop) {
    validateMenuEntry(desktop, {
      label: "desktop browser menu",
      id: "browser-desktop-menu",
      viewport: { width: 1280, height: 720 },
      compact: false,
      mobileSurface: false,
      secondaryCopyVisible: false,
      bestRecordVisible: true,
      minButtonWidth: 138,
      minButtonHeight: 44
    }, issues);
  }

  if (compact) {
    validateMenuEntry(compact, {
      label: "compact browser menu",
      id: "browser-compact-menu",
      viewport: { width: 368, height: 552 },
      compact: true,
      mobileSurface: false,
      secondaryCopyVisible: false,
      bestRecordVisible: true,
      minButtonWidth: 240,
      minButtonHeight: 44
    }, issues);
  }

  if (mobile) {
    validateMenuEntry(mobile, {
      label: "mobile surface menu",
      id: "mobile-surface-menu",
      viewport: { width: 368, height: 552 },
      compact: true,
      mobileSurface: true,
      secondaryCopyVisible: false,
      bestRecordVisible: true,
      minButtonWidth: 300,
      minButtonHeight: 52
    }, issues);
  }

  if (mobileTall) {
    validateMenuEntry(mobileTall, {
      label: "tall mobile surface menu",
      id: "mobile-surface-menu-tall",
      viewport: { width: 368, height: 800 },
      compact: true,
      mobileSurface: true,
      secondaryCopyVisible: false,
      bestRecordVisible: true,
      minButtonWidth: 300,
      minButtonHeight: 52
    }, issues);
    validateTallMobileMenuRhythm(mobileTall, issues);
  }

  if (desktop && compact && mobile) {
    validateSharedMenuIdentity(desktop, compact, mobile, issues);
    validateMobileMenuAdaptation(compact, mobile, issues);
  }

  return {
    ready: issues.length === 0,
    directory,
    issues,
    checkedFiles: Array.from(new Set(checkedFiles)).sort()
  };
}

export function renderMobileCrossReferenceEvaluation(evaluation: MobileCrossReferenceEvaluation): string {
  const lines = [
    "Tokenizer Training browser/mobile cross-reference",
    `Decision: ${evaluation.ready ? "cross-reference evidence passed" : "cross-reference evidence incomplete"}`,
    "",
    `Menu comparison: ${evaluation.menu.ready ? "passed" : "incomplete"} (${evaluation.menu.directory})`,
    `Surface evidence: ${evaluation.surface.ready ? "passed" : "incomplete"} (${evaluation.surface.directory})`,
    `Runtime evidence: ${evaluation.runtime.ready ? "passed" : "incomplete"} (${evaluation.runtime.directory})`
  ];

  appendIssues(lines, "Menu comparison issues", evaluation.menu.issues);
  appendIssues(lines, "Surface evidence issues", evaluation.surface.issues);
  appendIssues(lines, "Runtime evidence issues", evaluation.runtime.issues);

  return lines.join("\n");
}

export function parseMobileCrossReferenceArgs(args: string[]): MobileCrossReferenceOptions {
  return {
    menuDirectory: valueForFlag(args, "--menu-dir") ?? defaultOptions.menuDirectory,
    surfaceDirectory: valueForFlag(args, "--surface-dir") ?? defaultOptions.surfaceDirectory,
    runtimeDirectory: valueForFlag(args, "--runtime-dir") ?? defaultOptions.runtimeDirectory
  };
}

function validateMenuEntry(
  entry: JsonRecord,
  expected: {
    label: string;
    id: string;
    viewport: { width: number; height: number };
    compact: boolean;
    mobileSurface: boolean;
    secondaryCopyVisible: boolean;
    bestRecordVisible: boolean;
    minButtonWidth: number;
    minButtonHeight: number;
  },
  issues: string[]
): void {
  requireEqual(stringAt(entry, ["id"]), expected.id, `${expected.label} id`, issues);
  requireUrlSurface(stringAt(entry, ["url"]), expected.mobileSurface, expected.label, issues);
  requireEqual(numberAt(entry, ["viewport", "width"]), expected.viewport.width, `${expected.label} viewport width`, issues);
  requireEqual(numberAt(entry, ["viewport", "height"]), expected.viewport.height, `${expected.label} viewport height`, issues);
  requireEqual(booleanAt(entry, ["snapshot", "compact"]), expected.compact, `${expected.label} compact flag`, issues);

  const elements = elementList(entry);
  requireElementText(elements, "companyMark", "Welcome to WienerWorks", `${expected.label} company`, issues);
  requireElementText(elements, "title", "Tokenizer Training", `${expected.label} title`, issues);
  requireElementText(elements, "tutorialButton", "Tutorial", `${expected.label} tutorial button`, issues);
  requireElementText(elements, "trainingButton", "Training", `${expected.label} training button`, issues);
  requireElementText(elements, "tokenLogButton", "Token Log", `${expected.label} token log button`, issues);
  requireElementText(elements, "settingsButton", "Settings", `${expected.label} settings button`, issues);
  if (expected.secondaryCopyVisible) {
    requireVisible(elements, "moduleLabel", true, `${expected.label} module label`, issues);
    requireVisible(elements, "premise", true, `${expected.label} premise`, issues);
  } else {
    requireAbsentOrHidden(elements, "moduleLabel", `${expected.label} module label`, issues);
    requireAbsentOrHidden(elements, "premise", `${expected.label} premise`, issues);
  }
  requireVisible(elements, "bestRecord", expected.bestRecordVisible, `${expected.label} best record`, issues);

  const bestRecord = element(elements, "bestRecord");
  const bestRecordText = typeof bestRecord?.text === "string" ? bestRecord.text : "";
  if (
    expected.bestRecordVisible
    && !/^BEST RANK\n.+\n\d+ rounds$/.test(bestRecordText)
  ) {
    issues.push(`${expected.label} best record: expected stacked Best Rank copy, got ${bestRecordText || "missing text"}.`);
  }

  for (const id of ["tutorialButton", "trainingButton", "tokenLogButton", "settingsButton"]) {
    requireRectAtLeast(
      element(elements, id)?.rect,
      expected.minButtonWidth,
      expected.minButtonHeight,
      `${expected.label} ${id}`,
      issues
    );
  }

  for (const candidate of elements) {
    const text = typeof candidate.text === "string" ? candidate.text : "";
    if (text.includes("Manual Tokenization Training")) {
      issues.push(`${expected.label}: old public name is visible in ${String(candidate.id)}.`);
    }
  }
}

function validateTallMobileMenuRhythm(entry: JsonRecord, issues: string[]): void {
  const elements = elementList(entry);
  requireVerticalGapBetween(
    elements,
    "bestRecord",
    "tutorialButton",
    12,
    28,
    "tall mobile menu best record to tutorial button gap",
    issues
  );
}

function validateSharedMenuIdentity(
  desktop: JsonRecord,
  compact: JsonRecord,
  mobile: JsonRecord,
  issues: string[]
): void {
  for (const id of ["companyMark", "title", "tutorialButton", "trainingButton", "tokenLogButton", "settingsButton"]) {
    const desktopText = textOf(desktop, id);
    const compactText = textOf(compact, id);
    const mobileText = textOf(mobile, id);
    if (desktopText !== compactText || desktopText !== mobileText) {
      issues.push(`shared menu identity ${id}: expected all surfaces to match, got desktop=${desktopText}, compact=${compactText}, mobile=${mobileText}.`);
    }
  }
}

function validateMobileMenuAdaptation(compact: JsonRecord, mobile: JsonRecord, issues: string[]): void {
  const compactButton = element(elementList(compact), "tutorialButton");
  const mobileButton = element(elementList(mobile), "tutorialButton");
  const compactRect = rectOf(compactButton?.rect);
  const mobileRect = rectOf(mobileButton?.rect);

  if (mobileRect.width < compactRect.width) {
    issues.push(`mobile menu tutorialButton width: expected at least compact browser width ${compactRect.width}, got ${mobileRect.width}.`);
  }
  if (mobileRect.height < compactRect.height) {
    issues.push(`mobile menu tutorialButton height: expected at least compact browser height ${compactRect.height}, got ${mobileRect.height}.`);
  }

  const compactBestRecord = element(elementList(compact), "bestRecord");
  const mobileBestRecord = element(elementList(mobile), "bestRecord");
  if (visibleOf(compactBestRecord) === true && visibleOf(mobileBestRecord) !== true) {
    issues.push("mobile menu best record: mobile must not drop a record line visible in compact browser.");
  }
  if (visibleOf(compactBestRecord) !== true && visibleOf(mobileBestRecord) !== true) {
    issues.push("mobile menu best record: expected mobile to restore compact record evidence for native launch parity.");
  }
}

function readComparisonEntries(directory: string, issues: string[], checkedFiles: string[]): JsonRecord[] {
  const path = join(directory, "comparison.json");
  checkedFiles.push(path);
  if (!existsSync(path)) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (!Array.isArray(parsed)) {
      issues.push(`Menu comparison JSON must be an array: ${path}.`);
      return [];
    }
    return parsed.filter(isRecord);
  } catch (error) {
    issues.push(`Menu comparison JSON could not be parsed: ${error instanceof Error ? error.message : String(error)}.`);
    return [];
  }
}

function requireVerticalGapBetween(
  elements: JsonRecord[],
  upperId: string,
  lowerId: string,
  minGap: number,
  maxGap: number,
  label: string,
  issues: string[]
): void {
  const upper = rectWithHeight(element(elements, upperId)?.rect);
  const lower = rectWithHeight(element(elements, lowerId)?.rect);
  if (!upper || !lower) {
    issues.push(`${label}: expected ${upperId} and ${lowerId} rectangles.`);
    return;
  }

  const gap = lower.y - lower.height / 2 - (upper.y + upper.height / 2);
  if (gap < minGap || gap > maxGap) {
    issues.push(`${label}: expected ${minGap}-${maxGap}px, got ${round(gap)}px.`);
  }
}

function requireFile(directory: string, file: string, issues: string[], checkedFiles: string[]): void {
  const path = join(directory, file);
  checkedFiles.push(path);
  if (!existsSync(path)) {
    issues.push(`Menu comparison file is missing: ${path}.`);
  }
}

function requireImageFile(
  directory: string,
  artifact: typeof menuImageArtifacts[number],
  issues: string[],
  checkedFiles: string[]
): void {
  const path = join(directory, artifact.file);
  checkedFiles.push(path);
  issues.push(
    ...imageEvidenceIssues(path, {
      label: artifact.label,
      width: artifact.width,
      height: artifact.height,
      minBytes: 1_000,
      requireVisualContent: true
    })
  );
}

function rectWithHeight(value: unknown): { y: number; height: number } | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const y = numberAt(value, ["y"]);
  const height = numberAt(value, ["height"]);
  if (height <= 0) {
    return undefined;
  }
  return { y, height };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function requireUrlSurface(url: string, mobileSurface: boolean, label: string, issues: string[]): void {
  if (url.length === 0) {
    issues.push(`${label} url: expected a captured route URL.`);
    return;
  }

  const hasMobileSurface = url.includes("surface=mobile");
  if (mobileSurface && !hasMobileSurface) {
    issues.push(`${label} url: expected surface=mobile.`);
  }
  if (!mobileSurface && hasMobileSurface) {
    issues.push(`${label} url: browser route must not use surface=mobile.`);
  }
}

function requireElementText(
  elements: JsonRecord[],
  id: string,
  expected: string,
  label: string,
  issues: string[]
): void {
  const candidate = element(elements, id);
  const text = typeof candidate?.text === "string" ? candidate.text : "";
  if (text !== expected) {
    issues.push(`${label}: expected ${expected}, got ${text || "missing"}.`);
  }
}

function requireVisible(
  elements: JsonRecord[],
  id: string,
  expected: boolean,
  label: string,
  issues: string[]
): void {
  const actual = visibleOf(element(elements, id));
  if (actual !== expected) {
    issues.push(`${label}: expected visible=${expected}, got ${actual}.`);
  }
}

function requireAbsentOrHidden(
  elements: JsonRecord[],
  id: string,
  label: string,
  issues: string[]
): void {
  const candidate = element(elements, id);
  if (candidate && visibleOf(candidate) !== false) {
    issues.push(`${label}: expected ${id} to be absent or hidden.`);
  }
}

function requireRectAtLeast(
  value: unknown,
  minWidth: number,
  minHeight: number,
  label: string,
  issues: string[]
): void {
  const rect = rectOf(value);
  if (rect.width < minWidth || rect.height < minHeight) {
    issues.push(`${label}: expected at least ${minWidth}x${minHeight}, got ${rect.width}x${rect.height}.`);
  }
}

function requireEqual(actual: unknown, expected: unknown, label: string, issues: string[]): void {
  if (actual !== expected) {
    issues.push(`${label}: expected ${String(expected)}, got ${String(actual)}.`);
  }
}

function appendIssues(lines: string[], heading: string, issues: string[]): void {
  if (issues.length === 0) {
    return;
  }

  lines.push("", `${heading}:`);
  for (const issue of issues) {
    lines.push(`- ${issue}`);
  }
}

function valueForFlag(args: string[], flag: string): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === flag) {
      return args[index + 1];
    }
    if (arg.startsWith(`${flag}=`)) {
      return arg.slice(flag.length + 1);
    }
  }

  return undefined;
}

function textOf(entry: JsonRecord, id: string): string {
  const candidate = element(elementList(entry), id);
  return typeof candidate?.text === "string" ? candidate.text : "";
}

function elementList(entry: JsonRecord): JsonRecord[] {
  const elements = at(entry, ["snapshot", "elements"]);
  return Array.isArray(elements) ? elements.filter(isRecord) : [];
}

function element(elements: JsonRecord[], id: string): JsonRecord | undefined {
  return elements.find((entry) => entry.id === id);
}

function visibleOf(entry: JsonRecord | undefined): boolean | undefined {
  return typeof entry?.visible === "boolean" ? entry.visible : undefined;
}

function rectOf(value: unknown): { width: number; height: number } {
  return {
    width: numberAt(value, ["width"]),
    height: numberAt(value, ["height"])
  };
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
  const evaluation = evaluateMobileCrossReference(parseMobileCrossReferenceArgs(process.argv.slice(2)));
  console.log(renderMobileCrossReferenceEvaluation(evaluation));
  process.exitCode = evaluation.ready ? 0 : 1;
}
