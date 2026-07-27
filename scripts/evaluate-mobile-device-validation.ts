import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { imageEvidenceIssues } from "./image-evidence";

export interface MobileValidationEvaluation {
  ready: boolean;
  file: string;
  evidenceRoot: string;
  issues: string[];
}

export interface MobileValidationOptions {
  evidenceRoot?: string;
}

export interface MobileValidationIssueSummary {
  targetEvidence: string[];
  physicalChecks: string[];
  evidenceInventory: string[];
  missingArtifacts: string[];
  finalDecision: string[];
}

export const requiredMobileTargets = [
  "iPhone SE/small phone portrait",
  "Standard portrait phone",
  "Large phone portrait",
  "Desktop browser harness"
] as const;

export const requiredMobileChecks = [
  "Menu readable",
  "Safe areas clear",
  "Tutorial slicing works by touch",
  "Tutorial review feedback card readable",
  "Training observation sample covers at least five rounds",
  "Play-screen thumb reach acceptable",
  "Results thumb reach acceptable",
  "Finger occlusion acceptable",
  "Touch latency acceptable",
  "Input-feel metrics captured",
  "Best Rank persistence visible after relaunch",
  "Audio silent on boot and plays after user action",
  "Sound persistence visible in Settings after relaunch",
  "WienerWorks visual tone intentional",
  "Desktop browser harness still matches browser contract"
] as const;

export const requiredEvidenceInventory = [
  "Small-phone menu",
  "Small-phone active tutorial after at least one staged cut",
  "Small-phone review feedback card",
  "Standard-phone Training observation sample",
  "Large-phone menu",
  "Large-phone active play",
  "Native relaunch persisted Best Rank",
  "Native relaunch persisted Sound Off in Settings",
  "Observer note on thumb reach, finger occlusion, touch latency, and audio output",
  "Input-feel copied summary or trace",
  "Desktop browser pinned fixture"
] as const;

const blankMarkers = new Set(["", "todo", "tbd", "n/a", "na", "none yet", "placeholder"]);
const defaultEvidenceRoot = "docs/mobile_device_evidence";
const artifactPattern = /(?:^|[\s("'`])((?:\.{1,2}\/|[\w.-]+\/)*[\w.-]+\.(?:png|jpg|jpeg|mov|mp4|md))(?=$|[\s)"'`,.:;])/gi;
const imageArtifactPattern = /\.(?:png|jpe?g)$/i;
const videoArtifactPattern = /\.(?:mov|mp4)$/i;
const markdownArtifactPattern = /\.md$/i;
const inventoryItemsRequiringSavedArtifact = new Set<string>(
  requiredEvidenceInventory.filter(
    (label) => label !== "Observer note on thumb reach, finger occlusion, touch latency, and audio output"
  )
);
const observerEvidenceLabel = "Observer note on thumb reach, finger occlusion, touch latency, and audio output";
const inputFeelEvidenceLabel = "Input-feel copied summary or trace";
const desktopHarnessTargetLabel = "Desktop browser harness";
const desktopHarnessCheckLabel = "Desktop browser harness still matches browser contract";
const desktopHarnessInventoryLabel = "Desktop browser pinned fixture";
const menuReadableCheckLabel = "Menu readable";
const trainingObservationCheckLabel = "Training observation sample covers at least five rounds";
const trainingObservationInventoryLabel = "Standard-phone Training observation sample";
const playThumbReachCheckLabel = "Play-screen thumb reach acceptable";
const resultsThumbReachCheckLabel = "Results thumb reach acceptable";
const smallPhoneMenuInventoryLabel = "Small-phone menu";
const largePhoneMenuInventoryLabel = "Large-phone menu";
const bestRankPersistenceCheckLabel = "Best Rank persistence visible after relaunch";
const bestRankPersistenceInventoryLabel = "Native relaunch persisted Best Rank";
const soundPersistenceCheckLabel = "Sound persistence visible in Settings after relaunch";
const soundPersistenceInventoryLabel = "Native relaunch persisted Sound Off in Settings";
const desktopPinnedFixtureArtifactPattern = /\b(?:desktop-pinned-fixture|browser-desktop-endless-pinned-simple-001)\.(?:png|jpe?g)\b/i;
const currentMenuLabels = ["Best Rank", "Tutorial", "Training", "Token Log", "Settings"] as const;
const retiredMenuVisibleClaims = ["Best Record", "Begin Tutorial", "Endless Training"] as const;
const retiredTutorialHandoffClaim = "Start Endless Training";
const retiredTutorialHandoffPattern = /\bStart Endless Training\b/i;
const currentTutorialHandoffPattern = /\bStart Training\b/i;
const tutorialHandoffEvidencePattern = /\bTutorial\s+Cleared\b|\btutorial(?:[-\s]+complete(?:d)?)?\s+handoff\b|\btutorial[-\s]+complete(?:d)?\s+(?:screen|view|scene|route)\b/i;
const menuEvidenceSurfacePattern = /\bmenu\b/i;
const resultsEvidenceSurfacePattern = /\bresults?\b/i;
const evidenceClaimSplitPattern = /\r?\n|;\s*|[.!?]\s+(?=[A-Z])|\s+\b(?:but|however|whereas)\b\s+/i;
const visibleClaimStatePattern = /\b(?:(?:was|were|is|are|remains?|remained|appears?|appeared|seems?|seemed|could|can)\s+)?(?:(?:not|never)\s+)?(?:visible|shown|displayed|present|rendered|available|readable|reachable|seen|absent|missing|hidden|omitted|unavailable|invisible|unreadable|unreachable)\b/gi;
const visibleClaimActionPattern = /\b(?:(?:(?:did|does|do|could|can|would|will|was|were|is|are)\s+(?:not|never)\s+)(?:show|display|include|contain|render|present|list|reach|reveal)\w*|(?:fail(?:s|ed)?\s+to\s+(?:show|display|include|contain|render|present|list|reach|reveal)\w*)|(?:show(?:s|ed|ing)?|display(?:s|ed|ing)?|include(?:s|d|ing)?|contain(?:s|ed|ing)?|render(?:s|ed|ing)?|present(?:s|ed|ing)?|list(?:s|ed|ing)?|reach(?:es|ed|ing)?|reveal(?:s|ed|ing)?|lack(?:s|ed|ing)?|omit(?:s|ted|ting)?|without))\b/gi;
const negativeVisibleClaimPattern = /\b(?:not|never|absent|missing|hidden|omitted|unavailable|invisible|unreadable|unreachable|without|fail\w*|lack\w*|omit\w*)\b/i;
const fullRelaunchPattern = /\bfull(?:\s+app)?\s+relaunch(?:ed|ing)?\b|\b(?:app\s+)?(?:terminat(?:e|ed|es|ing|ion)|force[-\s]?quit(?:ting)?|kill(?:ed|ing)?)\b[\s\S]{0,160}\brelaunch(?:ed|ing)?\b/i;
const defaultMenuObservationPattern = /\b(?:default|main)\s+menu\b|\bmenu\s+(?:screen|view|page)\b/i;
const settingsSurfaceObservationPattern = /\b(?:in|inside|opened?|opening)\s+(?:the\s+)?Settings\b|\bSettings\s+(?:screen|view|panel|page|scene)\b|\bSettings\s+(?:shows?|showed|display(?:s|ed)?|with)\b|\bSettings\s*:\s*Sound\s*:\s*Off\b/i;
const qaMetadataPattern = /\b(?:QA|test|route|launch)\s+metadata\b|\bmetadata-only\b/i;
const soundOffBeforeTerminationPatterns = [
  /\bSound\s*:\s*Off\b[\s\S]{0,180}\bbefore\b[\s\S]{0,60}\b(?:app\s+)?(?:terminat(?:e|ed|es|ing|ion)|force[-\s]?quit(?:ting)?|kill(?:ed|ing)?)\b/i,
  /\bbefore\b[\s\S]{0,60}\b(?:app\s+)?(?:terminat(?:e|ed|es|ing|ion)|force[-\s]?quit(?:ting)?|kill(?:ed|ing)?)\b[\s\S]{0,180}\bSound\s*:\s*Off\b/i
] as const;
const soundOffAfterRelaunchPatterns = [
  /\bSound\s*:\s*Off\b[\s\S]{0,220}\bafter\b[\s\S]{0,60}\b(?:full\s+)?relaunch(?:ed|ing)?\b/i,
  /\bafter\b[\s\S]{0,60}\b(?:full\s+)?relaunch(?:ed|ing)?\b[\s\S]{0,180}\bSound\s*:\s*Off\b/i
] as const;

export function evaluateMobileDeviceValidation(
  markdown: string,
  file = "docs/mobile_device_validation_completed.md",
  options: MobileValidationOptions = {}
): MobileValidationEvaluation {
  const issues: string[] = [];
  const evidenceRoot = options.evidenceRoot ?? defaultEvidenceRoot;
  const targetRows = tableRowsAfterHeading(markdown, "## Target Evidence");
  const checkRows = tableRowsAfterHeading(markdown, "## Physical Checklist");

  appendUniqueIssues(issues, tutorialHandoffCopyIssues(markdown));
  validateTargetRows(targetRows, issues);
  validateCheckRows(checkRows, issues);
  validateEvidenceInventory(markdown, issues);
  validateReferencedArtifacts(targetRows, checkRows, markdown, evidenceRoot, issues);
  validateFinalDecision(markdown, issues);

  return {
    ready: issues.length === 0,
    file,
    evidenceRoot,
    issues
  };
}

export function renderMobileDeviceValidationEvaluation(evaluation: MobileValidationEvaluation): string {
  const lines = [
    "Tokenizer Training mobile device validation",
    `File: ${evaluation.file}`,
    `Evidence root: ${evaluation.evidenceRoot}`,
    `Decision: ${evaluation.ready ? "mobile device validation passed" : "mobile device validation incomplete"}`
  ];

  if (evaluation.issues.length > 0) {
    const summaryLines = renderIssueSummary(evaluation.issues);
    if (summaryLines.length > 0) {
      lines.push("", "Next evidence to complete:", ...summaryLines);
    }

    lines.push("", "Issues:");
    for (const issue of evaluation.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

export function summarizeMobileDeviceValidationIssues(issues: string[]): MobileValidationIssueSummary {
  const targetEvidence = new Set<string>();
  const physicalChecks = new Set<string>();
  const evidenceInventory = new Set<string>();
  const missingArtifacts = new Set<string>();
  const finalDecision = new Set<string>();

  for (const issue of issues) {
    const artifact = issue.match(/referenced evidence artifact is missing: ([^\s]+) /)?.[1];
    if (artifact) {
      missingArtifacts.add(artifact);
    }

    if (/^Final decision\b|^Required changes before completion\b/.test(issue)) {
      finalDecision.add(issue.replace(/\.$/, ""));
    }

    for (const target of requiredMobileTargets) {
      if (issue === `Missing target evidence row: ${target}.` || issue.startsWith(`${target}:`)) {
        targetEvidence.add(target);
      }
    }

    for (const check of requiredMobileChecks) {
      if (issue === `Missing physical checklist row: ${check}.` || issue.startsWith(`${check}:`)) {
        physicalChecks.add(check);
      }
    }

    const missingInventory = issue.match(/^Evidence inventory missing: (.+)\.$/)?.[1];
    if (missingInventory) {
      evidenceInventory.add(missingInventory);
    }

    for (const inventoryItem of requiredEvidenceInventory) {
      if (issue.startsWith(`${inventoryItem}: evidence inventory must reference a saved artifact file.`)) {
        evidenceInventory.add(inventoryItem);
      }
    }
  }

  return {
    targetEvidence: Array.from(targetEvidence),
    physicalChecks: Array.from(physicalChecks),
    evidenceInventory: Array.from(evidenceInventory),
    missingArtifacts: Array.from(missingArtifacts),
    finalDecision: Array.from(finalDecision)
  };
}

function renderIssueSummary(issues: string[]): string[] {
  const summary = summarizeMobileDeviceValidationIssues(issues);
  const lines: string[] = [];

  pushSummaryLine(lines, "Target evidence", summary.targetEvidence);
  pushSummaryLine(lines, "Physical checklist", summary.physicalChecks);
  pushSummaryLine(lines, "Evidence inventory", summary.evidenceInventory);
  pushSummaryLine(lines, "Missing artifact files", summary.missingArtifacts);

  if (summary.finalDecision.length > 0) {
    lines.push("- Final decision is still blocked until all target evidence, checklist rows, and inventory artifacts pass.");
  }

  return lines;
}

function pushSummaryLine(lines: string[], label: string, values: string[]): void {
  if (values.length === 0) {
    return;
  }

  lines.push(`- ${label}: ${values.join("; ")}.`);
}

function validateTargetRows(rows: string[][], issues: string[]): void {
  for (const target of requiredMobileTargets) {
    const row = rows.find((candidate) => normalized(candidate[0]) === normalized(target));
    if (!row) {
      issues.push(`Missing target evidence row: ${target}.`);
      continue;
    }

    const [, device, evidence, verdict] = row;
    if (!substantiveField(device)) {
      issues.push(`${target}: device/browser field is missing or generic.`);
    }
    if (!substantiveEvidence(evidence)) {
      issues.push(`${target}: evidence file or note is missing or generic.`);
    }
    if (target === desktopHarnessTargetLabel) {
      issues.push(...desktopPinnedFixtureIssues(target, `${device} ${evidence}`));
    }
    if (!positiveDecision(verdict)) {
      issues.push(`${target}: verdict must be pass/yes/met/supported.`);
    }
  }
}

function validateCheckRows(rows: string[][], issues: string[]): void {
  for (const check of requiredMobileChecks) {
    const row = rows.find((candidate) => normalized(candidate[0]) === normalized(check));
    if (!row) {
      issues.push(`Missing physical checklist row: ${check}.`);
      continue;
    }

    const [, evidence, verdict] = row;
    if (!substantiveEvidence(evidence)) {
      issues.push(`${check}: evidence is missing or generic.`);
    }
    if (check === menuReadableCheckLabel) {
      issues.push(...menuEvidenceIssues(check, evidence));
    }
    if (check === trainingObservationCheckLabel) {
      issues.push(...trainingObservationIssues(check, evidence));
    }
    if (check === playThumbReachCheckLabel) {
      issues.push(...playThumbReachIssues(check, evidence));
    }
    if (check === resultsThumbReachCheckLabel) {
      issues.push(...resultsThumbReachIssues(check, evidence));
    }
    if (check === bestRankPersistenceCheckLabel) {
      issues.push(...bestRankPersistenceIssues(check, evidence));
    }
    if (check === soundPersistenceCheckLabel) {
      issues.push(...soundPersistenceIssues(check, evidence));
    }
    if (check === desktopHarnessCheckLabel) {
      issues.push(...desktopPinnedFixtureIssues(check, evidence));
    }
    if (!positiveDecision(verdict)) {
      issues.push(`${check}: verdict must be pass/yes/met/supported.`);
    }
  }
}

function validateEvidenceInventory(markdown: string, issues: string[]): void {
  for (const label of requiredEvidenceInventory) {
    const value = bulletValue(markdown, label);
    if (!substantiveEvidence(value)) {
      issues.push(`Evidence inventory missing: ${label}.`);
      continue;
    }
    if (inventoryItemsRequiringSavedArtifact.has(label) && artifactReferences(value).length === 0) {
      issues.push(`${label}: evidence inventory must reference a saved artifact file.`);
    }
    if (label === desktopHarnessInventoryLabel) {
      issues.push(...desktopPinnedFixtureIssues(label, value));
    }
    if (label === smallPhoneMenuInventoryLabel || label === largePhoneMenuInventoryLabel) {
      issues.push(...menuEvidenceIssues(label, value));
    }
    if (label === trainingObservationInventoryLabel) {
      issues.push(...trainingObservationIssues(label, value));
    }
    if (label === bestRankPersistenceInventoryLabel) {
      issues.push(...bestRankPersistenceIssues(label, value));
    }
    if (label === soundPersistenceInventoryLabel) {
      issues.push(...soundPersistenceIssues(label, value));
    }
    if (label === observerEvidenceLabel) {
      issues.push(...physicalObservationIssues(label, value));
    }
    if (label === inputFeelEvidenceLabel) {
      issues.push(...inputFeelMetricIssues(label, value));
    }
  }
}

function validateReferencedArtifacts(targetRows: string[][], checkRows: string[][], markdown: string, evidenceRoot: string, issues: string[]): void {
  const references = new Map<string, string>();

  for (const row of targetRows) {
    const label = row[0] ?? "evidence row";
    const evidence = row[2] ?? "";
    for (const reference of artifactReferences(evidence)) {
      references.set(reference, label);
    }
  }

  for (const row of checkRows) {
    const label = row[0] ?? "check row";
    const evidence = row[1] ?? "";
    for (const reference of artifactReferences(evidence)) {
      references.set(reference, label);
    }
  }

  for (const label of requiredEvidenceInventory) {
    const value = bulletValue(markdown, label);
    for (const reference of artifactReferences(value)) {
      references.set(reference, label);
    }
  }

  for (const [reference, label] of references) {
    const path = resolveArtifact(reference, evidenceRoot);
    if (!existsSync(path)) {
      issues.push(`${label}: referenced evidence artifact is missing: ${reference} (looked in ${path}).`);
      continue;
    }
    validateArtifactShape(reference, label, path, issues);
  }
}

function validateArtifactShape(reference: string, label: string, path: string, issues: string[]): void {
  if (imageArtifactPattern.test(reference)) {
    issues.push(...imageEvidenceIssues(path, {
      label: `${label}: ${reference}`,
      minBytes: 1_000,
      requireVisualContent: true
    }));
    return;
  }

  if (videoArtifactPattern.test(reference)) {
    validateVideoArtifact(reference, label, path, issues);
    return;
  }

  if (markdownArtifactPattern.test(reference)) {
    validateMarkdownArtifact(reference, label, path, issues);
  }
}

function validateVideoArtifact(reference: string, label: string, path: string, issues: string[]): void {
  const bytes = readFileSync(path);
  if (bytes.length < 10_000) {
    issues.push(`${label}: video artifact is too small to be useful: ${reference} (${bytes.length} bytes).`);
  }

  if (bytes.length < 12 || bytes.subarray(4, 8).toString("ascii") !== "ftyp") {
    issues.push(`${label}: video artifact must look like an MP4/QuickTime recording: ${reference}.`);
  }
}

function validateMarkdownArtifact(reference: string, label: string, path: string, issues: string[]): void {
  const text = readFileSync(path, "utf8").trim();
  appendUniqueIssues(issues, tutorialHandoffCopyIssues(text));
  if (text.length < 60) {
    issues.push(`${label}: markdown evidence artifact is too short to be useful: ${reference}.`);
  }
  if (isObserverEvidence(label, reference)) {
    issues.push(...physicalObservationIssues(label, text, reference));
  }
  if (isInputFeelEvidence(label, reference)) {
    issues.push(...inputFeelMetricIssues(label, text, reference));
  }
}

function validateFinalDecision(markdown: string, issues: string[]): void {
  const passed = bulletValue(markdown, "Mobile device validation passed");
  const changes = bulletValue(markdown, "Required changes before completion");

  if (!positiveDecision(passed)) {
    issues.push("Final decision must mark Mobile device validation passed as yes/pass/met.");
  }

  if (!/^none\b|^no required changes\b/i.test(changes.trim())) {
    issues.push("Required changes before completion must be none before mobile completion.");
  }
}

function tableRowsAfterHeading(markdown: string, heading: string): string[][] {
  const section = sectionBody(markdown, heading);
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .filter((line) => !/^\|\s*-/.test(line))
    .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 3)
    .slice(1);
}

function sectionBody(markdown: string, heading: string): string {
  const start = markdown.indexOf(heading);
  if (start < 0) {
    return "";
  }

  const rest = markdown.slice(start + heading.length);
  const nextHeading = rest.search(/\n## /);
  return nextHeading >= 0 ? rest.slice(0, nextHeading) : rest;
}

function bulletValue(markdown: string, label: string): string {
  const pattern = new RegExp(`^-\\s+${escapeRegExp(label)}:[ \\t]*(.*)$`, "im");
  return markdown.match(pattern)?.[1]?.trim() ?? "";
}

function substantiveField(value: string | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  return !blankMarkers.has(trimmed.toLowerCase()) && trimmed.length >= 4;
}

function substantiveEvidence(value: string | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  if (!substantiveField(trimmed)) {
    return false;
  }

  if (/^(pass|yes|met|ok|works|looks good|good)$/i.test(trimmed)) {
    return false;
  }

  return /(?:\.png|\.jpg|\.jpeg|\.mov|\.mp4|screenshot|photo|screen recording|observer|note|device|round|audio|thumb|finger|latency|input-feel|loupe|clearance|resolve|Best Rank|Sound: Off|Settings|relaunch|fixture)/i.test(trimmed);
}

function retiredMenuVisibleClaimIssues(markdown: string): string[] {
  const issues: string[] = [];
  for (const claim of retiredMenuVisibleClaims) {
    if (hasAffirmativeVisibleClaim(markdown, new RegExp(`\\b${escapeRegExp(claim)}\\b`, "i"))) {
      issues.push(`Retired visible claim is not valid current evidence: ${claim}.`);
    }
  }
  return issues;
}

function tutorialHandoffCopyIssues(markdown: string): string[] {
  const issues: string[] = [];
  if (hasAffirmativeVisibleClaim(markdown, retiredTutorialHandoffPattern)) {
    issues.push(`Retired visible claim is not valid current evidence: ${retiredTutorialHandoffClaim}.`);
  }
  const handoffEvidence = evidenceClaimSegments(markdown).filter((segment) => tutorialHandoffEvidencePattern.test(segment));
  if (handoffEvidence.length > 0 && !handoffEvidence.some((segment) => hasAffirmativeVisibleClaim(segment, currentTutorialHandoffPattern))) {
    issues.push("Tutorial handoff evidence must mention Start Training as the visible primary action.");
  }
  return issues;
}

function appendUniqueIssues(issues: string[], additions: string[]): void {
  for (const issue of additions) {
    if (!issues.includes(issue)) {
      issues.push(issue);
    }
  }
}

function menuEvidenceIssues(label: string, text: string | undefined): string[] {
  const rawContent = text ?? "";
  const content = rawContent
    .replace(/\bTokenizer Training\b/gi, "")
    .replace(/\bBegin Tutorial\b/gi, "")
    .replace(/\bEndless Training\b/gi, "");
  return [
    ...retiredMenuVisibleClaimIssues(rawContent),
    ...currentMenuLabels
    .filter((menuLabel) => !hasAffirmativeVisibleClaim(
      content,
      new RegExp(`\\b${escapeRegExp(menuLabel)}\\b`, "i"),
      menuEvidenceSurfacePattern
    ))
    .map((menuLabel) => `${label}: menu evidence must mention ${menuLabel}.`)
  ];
}

function bestRankPersistenceIssues(label: string, text: string | undefined): string[] {
  const content = text ?? "";
  const issues: string[] = [];

  if (!/\bBest Rank\b/i.test(content)) {
    issues.push(`${label}: persistence evidence must mention Best Rank.`);
  }
  if (!fullRelaunchPattern.test(content)) {
    issues.push(`${label}: persistence evidence must mention a full relaunch.`);
  }
  if (!defaultMenuObservationPattern.test(content) || qaMetadataPattern.test(content)) {
    issues.push(`${label}: persistence evidence must show Best Rank on the visible default menu, not another surface or QA metadata.`);
  }

  return issues;
}

function trainingObservationIssues(label: string, text: string | undefined): string[] {
  const content = text ?? "";
  const issues: string[] = [];
  if (!/\bTraining\b/i.test(content)) {
    issues.push(`${label}: observation evidence must identify Training.`);
  }
  if (!/\b(?:five|5)\b/i.test(content)) {
    issues.push(`${label}: observation evidence must cover at least five rounds.`);
  }
  if (!/(?:\bcontinu(?:e|es|ed|ing|ation)\b|\badvance(?:s|d)?\b|\btransition\b)[\s\S]{0,120}\b(?:beyond|past|after)\s+round\s+(?:five|5)\b|\bround\s+(?:six|6)\b/i.test(content)) {
    issues.push(`${label}: observation evidence must show continuation beyond round five.`);
  }
  if (!/\btoken credits?\s+remain\b|\bcredits?\s+(?:remain|remains|are)\s+(?:above\s+zero|positive|available)\b/i.test(content)) {
    issues.push(`${label}: observation evidence must state that Token Credits remain at continuation.`);
  }
  return issues;
}

function playThumbReachIssues(label: string, text: string | undefined): string[] {
  return namedControlIssues(label, text, [
    ["Sound or Muted", /\bSound\b|\bMuted\b/i],
    ["Clear", /\bClear\b/i],
    ["Exit", /\bExit\b/i],
    ["Resolve", /\bResolve\b/i],
    ["Next", /\bNext\b/i],
    ["Continue", /\bContinue\b/i],
    ["Finish", /\bFinish\b/i]
  ]);
}

function resultsThumbReachIssues(label: string, text: string | undefined): string[] {
  return namedControlIssues(label, text, [
    ["Review Token Log", /\bReview\s+Token\s+Log\b/i],
    ["Run Training Again", /\bRun\s+Training\s+Again\b/i],
    ["Return to Menu", /\bReturn\s+to\s+Menu\b/i]
  ], resultsEvidenceSurfacePattern);
}

function namedControlIssues(
  label: string,
  text: string | undefined,
  controls: Array<[string, RegExp]>,
  requiredSurface?: RegExp
): string[] {
  const content = text ?? "";
  return controls
    .filter(([, pattern]) => !hasAffirmativeVisibleClaim(content, pattern, requiredSurface))
    .map(([control]) => `${label}: reach evidence must mention ${control}.`);
}

function hasAffirmativeVisibleClaim(text: string, claimPattern: RegExp, requiredSurface?: RegExp): boolean {
  for (const segment of evidenceClaimSegments(text)) {
    if (requiredSurface && !patternMatches(requiredSurface, segment)) {
      continue;
    }

    const matcher = globalPattern(claimPattern);
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(segment)) !== null) {
      if (!visibleClaimIsNegated(segment, match.index, match[0].length)) {
        return true;
      }
    }
  }

  return false;
}

function evidenceClaimSegments(text: string): string[] {
  return text
    .split(evidenceClaimSplitPattern)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function visibleClaimIsNegated(segment: string, claimStart: number, claimLength: number): boolean {
  const following = segment.slice(claimStart + claimLength, claimStart + claimLength + 160);
  const followingState = firstPatternMatch(visibleClaimStatePattern, following);
  if (followingState) {
    return negativeVisibleClaimPattern.test(followingState[0]);
  }

  const preceding = segment.slice(0, claimStart);
  if (/\b(?:no|neither)\s+(?:visible\s+)?$/i.test(preceding)) {
    return true;
  }

  const actions = allPatternMatches(visibleClaimActionPattern, preceding);
  const nearestAction = actions.at(-1);
  return nearestAction ? negativeVisibleClaimPattern.test(nearestAction[0]) : false;
}

function patternMatches(pattern: RegExp, text: string): boolean {
  return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, "")).test(text);
}

function firstPatternMatch(pattern: RegExp, text: string): RegExpExecArray | null {
  return globalPattern(pattern).exec(text);
}

function allPatternMatches(pattern: RegExp, text: string): RegExpExecArray[] {
  return Array.from(text.matchAll(globalPattern(pattern)));
}

function globalPattern(pattern: RegExp): RegExp {
  const flags = pattern.flags.replace(/y/g, "");
  return new RegExp(pattern.source, flags.includes("g") ? flags : `${flags}g`);
}

function soundPersistenceIssues(label: string, text: string | undefined): string[] {
  const content = text ?? "";
  const issues: string[] = [];

  if (!/\bSettings\b/i.test(content)) {
    issues.push(`${label}: sound persistence evidence must mention Settings.`);
  }
  if (!settingsSurfaceObservationPattern.test(content) || qaMetadataPattern.test(content)) {
    issues.push(`${label}: sound persistence evidence must show Sound: Off in the visible Settings view, not menu-only or QA metadata.`);
  }
  if (!soundOffBeforeTerminationPatterns.some((pattern) => pattern.test(content))) {
    issues.push(`${label}: sound persistence evidence must show Sound: Off before termination.`);
  }
  if (!soundOffAfterRelaunchPatterns.some((pattern) => pattern.test(content))) {
    issues.push(`${label}: sound persistence evidence must show Sound: Off after relaunch.`);
  }

  return issues;
}

function physicalObservationIssues(label: string, text: string | undefined, reference?: string): string[] {
  const content = text ?? "";
  const subject = reference ? `markdown evidence artifact ${reference}` : "observer evidence";
  const requirements: Array<[string, RegExp]> = [
    ["thumb reach", /\bthumb\b|\breach\b|one-handed/i],
    ["finger occlusion", /\bfinger\b|\bocclusion\b|\bhand\b/i],
    ["touch latency", /\blatency\b|\blag\b|\bdelay(?:ed)?\b|\bimmediate(?:ly)?\b|\btrust\b/i],
    ["audio or mute behavior", /\baudio\b|\bsound\b|\bboot\b|\bmute(?:d)?\b/i]
  ];

  return requirements
    .filter(([, pattern]) => !pattern.test(content))
    .map(([requirement]) => `${label}: ${subject} must mention ${requirement}.`);
}

function inputFeelMetricIssues(label: string, text: string | undefined, reference?: string): string[] {
  const content = text ?? "";
  const subject = reference ? `markdown evidence artifact ${reference}` : "input-feel evidence";
  const requirements: Array<[string, RegExp]> = [
    ["first-cut latency", /\bfirst[-\s]?cut\b.*\blatency\b|\blatency\b.*\bfirst[-\s]?cut\b|\binputFeelFirstCutLatencyMs\b/i],
    ["no-cut acknowledgement", /\bno[-\s]?cut\b|\bnear[-\s]?slot\b|\boff[-\s]?slot\b|\binputFeelNoCutAcknowledgementCount\b|\binputFeelNearSlotNoCutAcknowledgementCount\b/i],
    ["touch-loupe clearance", /\btouch[-\s]?loupe\b|\bloupe\b|\bclearance\b|\bfinger visibility\b|\binputFeelTouchAimLoupeMinClearancePx\b/i],
    ["cut batch or ownership", /\bbatch\b|\bowned\b|\bownership\b|\bbroad swipe\b|\brelease[-\s]?sample\b|\bcorrection\b|\binputFeelLastCutBatchCount\b/i],
    ["resolve timing", /\bresolve\b.*\b(timing|latency|delay|hesitation|after)\b|\bhesitation\b|\binputFeelResolveAfter(?:First|Last)CutMs\b/i]
  ];

  return requirements
    .filter(([, pattern]) => !pattern.test(content))
    .map(([requirement]) => `${label}: ${subject} must mention ${requirement}.`);
}

function desktopPinnedFixtureIssues(label: string, text: string | undefined): string[] {
  const content = text ?? "";
  const requirements: Array<[string, RegExp]> = [
    ["desktop 1280x720 browser harness", /\b1280x720\b|\bdesktop\b.*\bbrowser\b|\bbrowser\b.*\bdesktop\b/i],
    ["endless mode", /\bendless\b|\bmode=endless\b/i],
    ["simple_001 pinned fixture", /\bsimple_001\b|\bpinned-simple-001\b/i],
    ["desktop pinned fixture artifact", desktopPinnedFixtureArtifactPattern]
  ];

  return requirements
    .filter(([, pattern]) => !pattern.test(content))
    .map(([requirement]) => `${label}: desktop harness evidence must mention ${requirement}.`);
}

function isObserverEvidence(label: string, reference: string): boolean {
  return label === observerEvidenceLabel || /observer/i.test(label) || /observer-note\.md$/i.test(reference);
}

function isInputFeelEvidence(label: string, reference: string): boolean {
  return label === inputFeelEvidenceLabel || /input-feel/i.test(label) || /input-feel/i.test(reference);
}

function artifactReferences(value: string | undefined): string[] {
  const text = value ?? "";
  return Array.from(text.matchAll(artifactPattern), (match) => match[1]).filter(Boolean);
}

function resolveArtifact(reference: string, evidenceRoot: string): string {
  if (isAbsolute(reference)) {
    return reference;
  }

  if (reference.startsWith("./") || reference.startsWith("../") || reference.includes("/")) {
    return resolve(reference);
  }

  return resolve(evidenceRoot, reference);
}

function positiveDecision(value: string | undefined): boolean {
  return /^(yes|pass|passed|met|supported|clear)$/i.test(value?.trim() ?? "");
}

function normalized(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseMobileDeviceValidationArgs(args: string[]): { file: string; evidenceRoot: string } {
  let file = "docs/mobile_device_validation_completed.md";
  let evidenceRoot = defaultEvidenceRoot;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--file" && args[index + 1]) {
      file = args[index + 1];
      index += 1;
      continue;
    }
    if (value.startsWith("--file=")) {
      file = value.slice("--file=".length);
      continue;
    }
    if (value === "--evidence-root" && args[index + 1]) {
      evidenceRoot = args[index + 1];
      index += 1;
      continue;
    }
    if (value.startsWith("--evidence-root=")) {
      evidenceRoot = value.slice("--evidence-root=".length);
      continue;
    }
    if (!value.startsWith("-")) {
      file = value;
    }
  }

  return { file, evidenceRoot };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { file, evidenceRoot } = parseMobileDeviceValidationArgs(process.argv.slice(2));
  if (!existsSync(file)) {
    console.log([
      "Tokenizer Training mobile device validation",
      `File: ${file}`,
      `Evidence root: ${evidenceRoot}`,
      "Decision: mobile device validation incomplete",
      "",
      "Issues:",
      `- Completed evidence file is missing. Copy docs/mobile_device_validation_completed_template.md to ${file} after the physical-device pass and fill it with evidence.`
    ].join("\n"));
    process.exit(1);
  }

  const evaluation = evaluateMobileDeviceValidation(readFileSync(file, "utf8"), file, { evidenceRoot });
  console.log(renderMobileDeviceValidationEvaluation(evaluation));
  process.exit(evaluation.ready ? 0 : 1);
}
