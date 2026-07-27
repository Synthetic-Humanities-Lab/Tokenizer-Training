import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  PLAYTEST_RUN_PREFIX,
  PRODUCT_SUMMARY_TITLE
} from "../src/game/systems/ProductIdentitySystem";

export type PassState = "pass" | "fail" | "missing" | "ambiguous";

export type PlaytestCriterionId =
  | "firstAction"
  | "nonWordBehavior"
  | "handoff"
  | "netExplanation"
  | "snapTrust"
  | "mobileReadability"
  | "laborFrame"
  | "engagementAesthetic"
  | "copiedSummary";

export interface PlaytestCriterion {
  id: PlaytestCriterionId;
  label: string;
  threshold: string;
  minPasses?: number;
  scope: "all-sessions" | "at-least" | "mobile-sessions";
}

export interface PlaytestMetadata {
  testerId?: string;
  date?: string;
  runId?: string;
  input?: string;
  deviceBrowser?: string;
  network?: string;
  launchUrl?: string;
  facilitator?: string;
  resetUsed?: string;
  visualEvidence?: string;
}

export interface PlaytestMetadataValidation {
  complete: boolean;
  missingFields: string[];
  invalidFields: string[];
}

export interface CopiedSummaryValidation {
  complete: boolean;
  missingFields: string[];
  invalidFields: string[];
}

export interface PlaytestDebriefValidation {
  complete: boolean;
  missingAnswers: string[];
  invalidAnswers: string[];
}

export interface PlaytestObservationNote {
  evidence: string;
  result: PassState;
}

export interface PlaytestObservationValidation {
  complete: boolean;
  missingRows: string[];
  invalidRows: string[];
}

export interface PlaytestPrincipleEvidenceValidation {
  complete: boolean;
  missingFields: string[];
  invalidFields: string[];
}

export interface PlaytestSessionNote {
  file: string;
  h1?: string;
  metadata: PlaytestMetadata;
  metadataValidation: PlaytestMetadataValidation;
  copiedSummary: string;
  summaryValidation: CopiedSummaryValidation;
  observationNotes: Record<PlaytestObservationLabel, PlaytestObservationNote>;
  observationValidation: PlaytestObservationValidation;
  debriefAnswers: string[];
  debriefValidation: PlaytestDebriefValidation;
  principleEvidence: Record<PlaytestPrincipleEvidenceLabel, string>;
  principleEvidenceValidation: PlaytestPrincipleEvidenceValidation;
  criteria: Record<PlaytestCriterionId, PassState>;
  criterionEvidence: Record<PlaytestCriterionId, string>;
  isMobileSession: boolean;
}

export interface CriterionTally {
  criterion: PlaytestCriterion;
  passed: number;
  failed: number;
  missing: number;
  ambiguous: number;
  evaluatedSessions: number;
  met: boolean;
  issues: string[];
}

export interface PlaytestGateEvaluation {
  ready: boolean;
  sessions: PlaytestSessionNote[];
  tallies: CriterionTally[];
  issues: string[];
}

const REQUIRED_SESSION_COUNT = 5;
const PLAYTEST_SESSION_H1 = "# Tokenizer Training Playtest Notes";

export const playtestDebriefQuestions = [
  "What were you trying to do when you swiped?",
  "What is a token boundary, based on the game?",
  "Name one way tokenization differs from ordinary word reading.",
  "What made Token Credits increase or rework increase?",
  "Did any result feel unfair or caused by input imprecision?",
  "What did the AI/browser fiction make you think was happening?",
  "Which screen or moment was hardest to read?",
  "What made you want to keep playing or stop?"
] as const;

export const playtestObservationLabels = [
  "First tutorial action without outside instruction",
  "Pale guides understood as legal slots, not answers",
  "Spaces not systematically over-cut",
  "Clear Cuts discovered or understood",
  "Snap positions trusted",
  "Missed/false review markers understood",
  "Verified credits, rework, net credits, remaining credits, and rank understood",
  "Tutorial-complete handoff: Start Training selected without prompting",
  "Dense strings read as higher-risk tokenization",
  "Degraded AI labor frame noticed through play",
  "Degraded visual style felt intentional and play invited another round",
  "Errors felt earned and recoverable, not arbitrary",
  "Prompt, action, evidence, consequence, and next step formed a legible loop",
  "Copy Summary worked and includes run/start/input, round trace, OK/missed/false counts, net, and best record",
  "Mobile HUD/text/review/feedback/Wiener speech readable"
] as const;

export type PlaytestObservationLabel = (typeof playtestObservationLabels)[number];

export const playtestPrincipleEvidenceLabels = [
  "Top game design loop evidence",
  "Critical/conceptual play evidence",
  "Emotional design evidence",
  "Game feel evidence",
  "Optimal visual display evidence"
] as const;

export type PlaytestPrincipleEvidenceLabel = (typeof playtestPrincipleEvidenceLabels)[number];

export const playtestCriteria: PlaytestCriterion[] = [
  {
    id: "firstAction",
    label: "First action completed without outside instruction",
    threshold: "at least 4 of 5",
    minPasses: 4,
    scope: "at-least"
  },
  {
    id: "nonWordBehavior",
    label: "Explains one non-word tokenization behavior",
    threshold: "at least 4 of 5",
    minPasses: 4,
    scope: "at-least"
  },
  {
    id: "handoff",
    label: "Selects Start Training from tutorial-complete handoff",
    threshold: "at least 4 of 5",
    minPasses: 4,
    scope: "at-least"
  },
  {
    id: "netExplanation",
    label: "Explains verified credits minus rework equals net credits",
    threshold: "at least 4 of 5",
    minPasses: 4,
    scope: "at-least"
  },
  {
    id: "snapTrust",
    label: "No systematic swipe/snap mistrust",
    threshold: "5 of 5, no systematic complaint",
    scope: "all-sessions"
  },
  {
    id: "mobileReadability",
    label: "Mobile readability holds on real device",
    threshold: "all mobile sessions; at least one real phone/tablet touch session required",
    scope: "mobile-sessions"
  },
  {
    id: "laborFrame",
    label: "Labor frame noticed without being told",
    threshold: "at least 3 of 5",
    minPasses: 3,
    scope: "at-least"
  },
  {
    id: "engagementAesthetic",
    label: "Engagement and degraded visual intent observed",
    threshold: "at least 3 of 5",
    minPasses: 3,
    scope: "at-least"
  },
  {
    id: "copiedSummary",
    label:
      "Copied summary returned with run ID, start source, input modality, round trace, cut-error counts, total net, and best-saved record",
    threshold: "at least 4 of 5",
    minPasses: 4,
    scope: "at-least"
  }
];

const criterionByLabel = new Map(playtestCriteria.map((criterion) => [criterion.label, criterion]));
const observationLabelSet = new Set<string>(playtestObservationLabels);
const criterionObservationConsistency: Partial<Record<PlaytestCriterionId, PlaytestObservationLabel>> = {
  firstAction: "First tutorial action without outside instruction",
  handoff: "Tutorial-complete handoff: Start Training selected without prompting",
  netExplanation: "Verified credits, rework, net credits, remaining credits, and rank understood",
  snapTrust: "Snap positions trusted",
  mobileReadability: "Mobile HUD/text/review/feedback/Wiener speech readable",
  laborFrame: "Degraded AI labor frame noticed through play",
  engagementAesthetic: "Degraded visual style felt intentional and play invited another round",
  copiedSummary: "Copy Summary worked and includes run/start/input, round trace, OK/missed/false counts, net, and best record"
};

export function parsePlaytestSessionNote(markdown: string, file = "session.md"): PlaytestSessionNote {
  const metadata = parseMetadata(markdown);
  const copiedSummary = extractCopiedSummary(markdown);
  const observationNotes = parseObservationNotes(markdown);
  const principleEvidence = parsePrincipleEvidenceNotes(markdown);
  const debriefAnswers = parseDebriefAnswers(markdown);
  const { criteria, evidence } = parseCriteria(markdown, copiedSummary);

  return {
    file,
    h1: firstNonblankLine(markdown),
    metadata,
    metadataValidation: validateSessionMetadata(metadata),
    copiedSummary,
    summaryValidation: validateCopiedSummary(copiedSummary, metadata),
    observationNotes,
    observationValidation: validateObservationNotes(observationNotes),
    debriefAnswers,
    debriefValidation: validateDebriefAnswers(debriefAnswers),
    principleEvidence,
    principleEvidenceValidation: validatePrincipleEvidence(principleEvidence),
    criteria,
    criterionEvidence: evidence,
    isMobileSession: mobileSessionFromMetadata(metadata)
  };
}

export function validateObservationNotes(
  notes: Record<PlaytestObservationLabel, PlaytestObservationNote>
): PlaytestObservationValidation {
  const missingRows: string[] = [];
  const invalidRows: string[] = [];

  for (const label of playtestObservationLabels) {
    const note = notes[label];
    if (!note) {
      missingRows.push(label);
      continue;
    }

    if (note.result === "missing") {
      missingRows.push(`${label} pass state`);
    }

    if (!note.evidence.trim()) {
      missingRows.push(`${label} evidence`);
      continue;
    }

    if (!substantiveEvidence(note.evidence)) {
      invalidRows.push(`${label} evidence lacks substantive observation`);
    }

    if (
      label === "Mobile HUD/text/review/feedback/Wiener speech readable" &&
      !mobileObservationEvidenceIsConcrete(note.evidence)
    ) {
      invalidRows.push(`${label} evidence must name mobile or non-mobile context plus a readable surface or failure mode`);
    }

    if (
      label === "Tutorial-complete handoff: Start Training selected without prompting" &&
      note.result === "pass" &&
      !trainingHandoffEvidenceIsConcrete(note.evidence)
    ) {
      invalidRows.push(
        `${label} pass evidence must name the tutorial-complete handoff, an affirmative started Training or clicked Training action, and no-prompt/coaching/timing evidence`
      );
    }
  }

  return {
    complete: missingRows.length === 0 && invalidRows.length === 0,
    missingRows,
    invalidRows
  };
}

export function validatePrincipleEvidence(
  evidence: Record<PlaytestPrincipleEvidenceLabel, string>
): PlaytestPrincipleEvidenceValidation {
  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  for (const label of playtestPrincipleEvidenceLabels) {
    const value = evidence[label]?.trim() ?? "";
    if (!value) {
      missingFields.push(label);
      continue;
    }

    if (!substantiveEvidence(value)) {
      invalidFields.push(`${label} lacks substantive evidence`);
      continue;
    }

    if (!principleEvidenceIsConcrete(label, value)) {
      invalidFields.push(`${label} must name concrete playtest behavior for that principle area`);
    }
  }

  return {
    complete: missingFields.length === 0 && invalidFields.length === 0,
    missingFields,
    invalidFields
  };
}

export function validateDebriefAnswers(answers: string[]): PlaytestDebriefValidation {
  const missingAnswers: string[] = [];
  const invalidAnswers: string[] = [];

  playtestDebriefQuestions.forEach((_, index) => {
    const label = `question ${index + 1}`;
    const answer = answers[index]?.trim() ?? "";

    if (!answer) {
      missingAnswers.push(label);
      return;
    }

    if (!substantiveEvidence(answer)) {
      invalidAnswers.push(`${label} answer lacks substantive evidence`);
      return;
    }

    if (!debriefAnswerAddressesQuestion(index, answer)) {
      invalidAnswers.push(`${label} answer does not address the debrief question`);
    }
  });

  return {
    complete: missingAnswers.length === 0 && invalidAnswers.length === 0,
    missingAnswers,
    invalidAnswers
  };
}

export function validateSessionMetadata(metadata: PlaytestMetadata): PlaytestMetadataValidation {
  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  const requiredFields: Array<[keyof PlaytestMetadata, string]> = [
    ["testerId", "tester ID"],
    ["date", "date"],
    ["runId", "run ID"],
    ["deviceBrowser", "device/browser"],
    ["input", "input"],
    ["network", "network"],
    ["launchUrl", "launch URL"],
    ["facilitator", "facilitator"],
    ["resetUsed", "reset used"],
    ["visualEvidence", "visual evidence"]
  ];

  for (const [key, label] of requiredFields) {
    if (!metadata[key]?.trim()) {
      missingFields.push(label);
    }
  }

  const input = metadata.input?.trim().toLowerCase();
  if (input && !["mouse", "touch", "pen", "trackpad", "mixed"].includes(input)) {
    invalidFields.push("input must be one of mouse, touch, pen, trackpad, or mixed");
  }

  const runId = metadata.runId?.trim();
  if (runId && !validGameRunId(runId)) {
    invalidFields.push("run ID must use the game-generated tt-* format");
  }

  const network = metadata.network?.trim().toLowerCase();
  if (network && !["same-machine", "lan"].includes(network)) {
    invalidFields.push("network must be same-machine or LAN");
  }

  const resetUsed = metadata.resetUsed?.trim().toLowerCase();
  if (resetUsed && !["yes", "no"].includes(resetUsed)) {
    invalidFields.push("reset used must be yes or no");
  }

  const visualEvidence = metadata.visualEvidence?.trim().toLowerCase();
  if (
    visualEvidence &&
    !["screenshot", "photo", "screen recording", "observer notes", "none"].includes(visualEvidence)
  ) {
    invalidFields.push(
      "visual evidence must be screenshot, photo, screen recording, observer notes, or none"
    );
  }

  if (mobileDeviceTouchFromMetadata(metadata) && network !== "lan") {
    invalidFields.push("mobile sessions require Network: LAN");
  }

  if (mobileDeviceTouchFromMetadata(metadata) && visualEvidence === "none") {
    invalidFields.push("mobile sessions require screenshot, photo, screen recording, or observer notes");
  }

  if (metadata.launchUrl && !launchUrlHasPlaytestReset(metadata.launchUrl)) {
    invalidFields.push("launch URL must include playtestReset=1");
  }

  if (mobileDeviceTouchFromMetadata(metadata) && metadata.launchUrl && !launchUrlUsesLanHost(metadata.launchUrl)) {
    invalidFields.push("mobile session launch URL must use a LAN host, not localhost");
  }

  return {
    complete: missingFields.length === 0 && invalidFields.length === 0,
    missingFields,
    invalidFields
  };
}

export function validateCopiedSummary(
  summary: string,
  metadata: Pick<PlaytestMetadata, "runId"> = {}
): CopiedSummaryValidation {
  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  const summaryHeader = firstNonblankLine(summary);
  if (!summaryHeader) {
    missingFields.push("summary header");
  } else if (summaryHeader !== PRODUCT_SUMMARY_TITLE) {
    invalidFields.push(`summary first nonblank line must exactly equal "${PRODUCT_SUMMARY_TITLE}"`);
  }

  const runId = capturedLine(summary, /^Run ID:\s*(.+)$/im);
  if (!runId) {
    missingFields.push("run ID");
  } else if (!validGameRunId(runId)) {
    invalidFields.push("run ID must use the game-generated tt-* format");
  }

  const expectedRunId = metadata.runId?.trim().toLowerCase();
  if (runId && expectedRunId && runId !== expectedRunId) {
    invalidFields.push("run ID does not match session metadata");
  }

  const startSource = capturedLine(summary, /^Start:\s*(.+)$/im);
  if (!startSource) {
    missingFields.push("start source");
  } else if (startSource !== "handoff screen") {
    invalidFields.push("start source must be handoff screen for the first-user protocol");
  }

  if (!capturedLine(summary, /^Input:\s*(.+)$/im)) {
    missingFields.push("input modality");
  }

  if (!capturedLine(summary, /^Input evidence:\s*(.+)$/im)) {
    missingFields.push("input evidence");
  }

  if (!/^Cuts:\s+OK\s+\d+\s+\/\s+Missed\s+\d+\s+\/\s+False\s+\d+$/im.test(summary)) {
    missingFields.push("cut-error counts");
  }

  if (!hasCapturedRoundTrace(summary)) {
    missingFields.push("round trace");
  }

  if (!hasCapturedInputFeelTrace(summary)) {
    missingFields.push("input feel trace");
  }

  if (!/^Net:\s+[+-]\$\d+\.\d{2}$/im.test(summary)) {
    missingFields.push("total net");
  }

  if (!/^Best saved:\s+\d+\s+rounds\s+\/\s+.+$/im.test(summary)) {
    missingFields.push("best-saved record");
  }

  return {
    complete: missingFields.length === 0 && invalidFields.length === 0,
    missingFields,
    invalidFields
  };
}

export function evaluatePlaytestSessions(sessions: PlaytestSessionNote[]): PlaytestGateEvaluation {
  const issues: string[] = [];

  if (sessions.length !== REQUIRED_SESSION_COUNT) {
    issues.push(`Expected ${REQUIRED_SESSION_COUNT} completed tester sessions; found ${sessions.length}.`);
  }

  const tallies = playtestCriteria.map((criterion) => tallyCriterion(criterion, sessions));
  for (const session of sessions) {
    issues.push(...playtestSessionEvidenceIssues(session));
  }

  for (const tally of tallies) {
    issues.push(...tally.issues);
  }

  return {
    ready: issues.length === 0 && tallies.every((tally) => tally.met),
    sessions,
    tallies,
    issues
  };
}

export function playtestSessionEvidenceIssues(session: PlaytestSessionNote): string[] {
  const issues: string[] = [];

  if (session.h1 !== PLAYTEST_SESSION_H1) {
    issues.push(`${session.file}: H1 must exactly be "${PLAYTEST_SESSION_H1}".`);
  }

  if (!session.metadataValidation.complete) {
    const metadataIssues = [
      ...session.metadataValidation.missingFields.map((field) => `missing ${field}`),
      ...session.metadataValidation.invalidFields
    ];
    issues.push(`${session.file}: session metadata is invalid (${metadataIssues.join("; ")}).`);
  }

  if (!session.summaryValidation.complete) {
    const summaryIssues = [
      ...session.summaryValidation.missingFields.map((field) => `missing ${field}`),
      ...session.summaryValidation.invalidFields
    ];
    issues.push(`${session.file}: copied summary is invalid (${summaryIssues.join("; ")}).`);
  }

  if (!session.observationValidation.complete) {
    const observationIssues = [
      ...session.observationValidation.missingRows.map((row) => `missing ${row}`),
      ...session.observationValidation.invalidRows
    ];
    issues.push(`${session.file}: observation notes are incomplete (${observationIssues.join("; ")}).`);
  }

  if (!session.debriefValidation.complete) {
    const debriefIssues = [
      ...session.debriefValidation.missingAnswers.map((answer) => `missing ${answer}`),
      ...session.debriefValidation.invalidAnswers
    ];
    issues.push(`${session.file}: debrief answers are incomplete (${debriefIssues.join("; ")}).`);
  }

  if (!session.principleEvidenceValidation.complete) {
    const principleIssues = [
      ...session.principleEvidenceValidation.missingFields.map((field) => `missing ${field}`),
      ...session.principleEvidenceValidation.invalidFields
    ];
    issues.push(`${session.file}: principle evidence notes are incomplete (${principleIssues.join("; ")}).`);
  }

  issues.push(...sessionObservationCriterionConsistencyIssues(session));

  for (const criterion of playtestCriteria) {
    const state = session.criteria[criterion.id];
    if (state !== "missing" && !substantiveEvidence(session.criterionEvidence[criterion.id])) {
      issues.push(`${session.file}: ${criterion.label} is marked ${state} without supporting evidence.`);
    }

    if (
      state === "pass" &&
      substantiveEvidence(session.criterionEvidence[criterion.id]) &&
      !criterionPassEvidenceIsConcrete(criterion.id, session.criterionEvidence[criterion.id])
    ) {
      issues.push(`${session.file}: ${criterion.label} pass needs criterion-specific observed evidence.`);
    }

    if (
      criterion.id === "mobileReadability" &&
      state === "pass" &&
      session.isMobileSession &&
      !mobileReadabilityEvidenceIsConcrete(session.criterionEvidence.mobileReadability)
    ) {
      issues.push(
        `${session.file}: ${criterion.label} needs concrete mobile visual evidence naming a screen artifact or readability surface.`
      );
    }
  }

  return issues;
}

export function renderPlaytestGateEvaluation(evaluation: PlaytestGateEvaluation): string {
  const completedSessions = evaluation.sessions.filter((session) => playtestSessionEvidenceIssues(session).length === 0);
  const lines = [
    "Tokenizer Training playtest gate",
    `Session files: ${evaluation.sessions.length}/${REQUIRED_SESSION_COUNT}`,
    `Completed notes: ${completedSessions.length}/${REQUIRED_SESSION_COUNT}`,
    `Completed real mobile/touch notes: ${completedSessions.filter((session) => session.isMobileSession).length}`,
    `Decision: ${evaluation.ready ? "broader playtest ready" : "iterate before broader playtest"}`,
    "",
    "Criterion tally:"
  ];

  for (const tally of evaluation.tallies) {
    const status = tally.met ? "PASS" : "FAIL";
    lines.push(
      `- ${status} ${tally.criterion.label}: ${tally.passed}/${tally.evaluatedSessions} pass (${tally.criterion.threshold})`
    );
  }

  if (evaluation.issues.length > 0) {
    lines.push("", "Issues:");
    for (const issue of evaluation.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

function parseMetadata(markdown: string): PlaytestMetadata {
  return {
    testerId: metadataValue(markdown, "Tester ID"),
    date: metadataValue(markdown, "Date"),
    runId: metadataValue(markdown, "Run ID"),
    input: metadataValue(markdown, "Input"),
    deviceBrowser: metadataValue(markdown, "Device/browser"),
    network: metadataValue(markdown, "Network"),
    launchUrl: metadataValue(markdown, "Launch URL"),
    facilitator: metadataValue(markdown, "Facilitator"),
    resetUsed: metadataValue(markdown, "Reset used"),
    visualEvidence: metadataValue(markdown, "Visual evidence")
  };
}

function metadataValue(markdown: string, label: string): string | undefined {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^-\\s*${escapedLabel}:[ \\t]*(.*?)[ \\t]*$`, "im").exec(markdown);
  return match?.[1]?.trim() || undefined;
}

function extractCopiedSummary(markdown: string): string {
  const section = sectionText(markdown, "Copied Result Summary");
  const match = /```(?:text)?\s*\n([\s\S]*?)\n```/i.exec(section);
  return match?.[1]?.trim() ?? "";
}

function parseDebriefAnswers(markdown: string): string[] {
  const section = sectionText(markdown, "Debrief Answers");
  const answers = Array.from({ length: playtestDebriefQuestions.length }, () => "");
  let currentIndex = -1;
  let buffer: string[] = [];

  const flush = () => {
    if (currentIndex >= 0 && currentIndex < answers.length) {
      answers[currentIndex] = buffer.join("\n").trim();
    }
  };

  for (const line of section.split(/\r?\n/)) {
    const match = /^\s*(\d+)\.\s*(.*)$/.exec(line);
    if (match) {
      flush();
      currentIndex = Number.parseInt(match[1], 10) - 1;
      buffer = [];

      const question = playtestDebriefQuestions[currentIndex];
      const inlineText = match[2]?.trim() ?? "";
      const inlineAnswer = question && inlineText.startsWith(question)
        ? inlineText.slice(question.length).replace(/^[:\-\s]+/, "").trim()
        : inlineText;
      if (inlineAnswer) {
        buffer.push(inlineAnswer);
      }
      continue;
    }

    if (currentIndex >= 0 && currentIndex < answers.length) {
      buffer.push(line);
    }
  }

  flush();

  return answers;
}

function parseObservationNotes(markdown: string): Record<PlaytestObservationLabel, PlaytestObservationNote> {
  const notes = Object.fromEntries(
    playtestObservationLabels.map((label) => [label, { evidence: "", result: "missing" }])
  ) as Record<PlaytestObservationLabel, PlaytestObservationNote>;
  const section = sectionText(markdown, "Observation Notes");

  for (const line of section.split(/\r?\n/)) {
    const cells = markdownTableCells(line);
    if (cells.length < 2 || cells[0] === "Observation" || /^-+$/.test(cells[0])) {
      continue;
    }

    if (!observationLabelSet.has(cells[0])) {
      continue;
    }

    const label = cells[0] as PlaytestObservationLabel;
    notes[label] = {
      evidence: cells[1] ?? "",
      result: normalizePassState(cells[2] ?? "")
    };
  }

  return notes;
}

function parsePrincipleEvidenceNotes(markdown: string): Record<PlaytestPrincipleEvidenceLabel, string> {
  const evidence = Object.fromEntries(
    playtestPrincipleEvidenceLabels.map((label) => [label, ""])
  ) as Record<PlaytestPrincipleEvidenceLabel, string>;
  const section = sectionText(markdown, "Principle Evidence Notes");

  for (const line of section.split(/\r?\n/)) {
    for (const label of playtestPrincipleEvidenceLabels) {
      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = new RegExp(`^\\s*-\\s*${escapedLabel}:\\s*(.*)$`, "i").exec(line);
      if (match) {
        evidence[label] = match[1]?.trim() ?? "";
      }
    }
  }

  return evidence;
}

function parseCriteria(
  markdown: string,
  copiedSummary: string
): {
  criteria: Record<PlaytestCriterionId, PassState>;
  evidence: Record<PlaytestCriterionId, string>;
} {
  const criteria = Object.fromEntries(playtestCriteria.map((criterion) => [criterion.id, "missing"])) as Record<
    PlaytestCriterionId,
    PassState
  >;
  const evidence = Object.fromEntries(playtestCriteria.map((criterion) => [criterion.id, ""])) as Record<
    PlaytestCriterionId,
    string
  >;
  const section = sectionText(markdown, "Pass-Criteria Rollup");

  for (const line of section.split(/\r?\n/)) {
    const cells = markdownTableCells(line);
    if (cells.length < 2 || cells[0] === "Criterion" || /^-+$/.test(cells[0])) {
      continue;
    }

    const criterion = criterionByLabel.get(cells[0]);
    if (!criterion) {
      continue;
    }

    criteria[criterion.id] = normalizePassState(cells[1]);
    evidence[criterion.id] = cells[2] ?? "";
  }

  if (criteria.copiedSummary === "pass" && !validateCopiedSummary(copiedSummary).complete) {
    criteria.copiedSummary = "fail";
  }

  return { criteria, evidence };
}

function sectionText(markdown: string, heading: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^##\\s+${escapedHeading}\\s*$`, "im").exec(markdown);
  if (!match) {
    return "";
  }

  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const nextHeading = /^##\s+/m.exec(rest);
  return nextHeading ? rest.slice(0, nextHeading.index) : rest;
}

function markdownTableCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) {
    return [];
  }

  return trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function normalizePassState(value: string): PassState {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "-" || normalized === "missing" || normalized === "not recorded") {
    return "missing";
  }
  if (["yes", "y", "pass", "passed", "true", "ok"].includes(normalized)) {
    return "pass";
  }
  if (["no", "n", "fail", "failed", "false"].includes(normalized)) {
    return "fail";
  }

  return "ambiguous";
}

function substantiveEvidence(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return ![
    "-",
    "n/a",
    "none",
    "todo",
    "tbd",
    "unknown",
    "not recorded",
    "pass",
    "passed",
    "yes",
    "y",
    "ok",
    "fail",
    "failed",
    "no",
    "n",
    "ambiguous"
  ].includes(normalized);
}

function mobileReadabilityEvidenceIsConcrete(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  const artifactOrObservation =
    /\b(screenshot|screen shot|photo|screen recording|recording|observer note|observer notes|observed|captured)\b/.test(
      normalized
    );
  const readabilitySurface =
    /\b(hud|text|token strip|review|marker|markers|feedback|wiener|speech|toast|overseer|panel|button|buttons|clipping|clipped|overlap|occlusion|finger|readable|unreadable)\b/.test(
      normalized
    );

  return substantiveEvidence(value) && artifactOrObservation && readabilitySurface;
}

function mobileObservationEvidenceIsConcrete(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  const context = /\b(phone|mobile|tablet|ipad|iphone|android|touch|pen|desktop|not mobile|non-mobile)\b/.test(normalized);
  const readabilitySurface =
    /\b(hud|text|token strip|review|marker|markers|feedback|wiener|speech|toast|overseer|panel|button|buttons|clipping|clipped|overlap|occlusion|finger|readable|unreadable)\b/.test(
      normalized
    );

  return substantiveEvidence(value) && context && readabilitySurface;
}

function principleEvidenceIsConcrete(label: PlaytestPrincipleEvidenceLabel, value: string): boolean {
  const normalized = value.trim().toLowerCase();

  switch (label) {
    case "Top game design loop evidence":
      return /\b(prompt|instruction|action|swipe|cut|review|feedback|consequence|net|next|loop|handoff|training|endless)\b/.test(
        normalized
      );
    case "Critical/conceptual play evidence":
      return /\b(ai|browser|supervisor|labor|payroll|audit|cost|rank|work|job|inference|company)\b/.test(
        normalized
      );
    case "Emotional design evidence":
      return /\b(fair|unfair|earned|recoverable|pressure|stress|agency|mistake|confidence|frustration|relief)\b/.test(
        normalized
      );
    case "Game feel evidence":
      return /\b(swipe|snap|gesture|cut|motion|timer|trail|preview|feedback|sound|responsive|input)\b/.test(
        normalized
      );
    case "Optimal visual display evidence":
      return /\b(hud|text|readable|mobile|desktop|review|marker|feedback|wiener|speech|overseer|popup|toast|contrast|clipping|overlap|occlusion|layout)\b/.test(
        normalized
      );
  }
}

function criterionPassEvidenceIsConcrete(criterionId: PlaytestCriterionId, value: string): boolean {
  const normalized = value.trim().toLowerCase();

  switch (criterionId) {
    case "firstAction":
      return /\b(swiped?|cut|first action|first tutorial action)\b/.test(normalized) &&
        /\b(no prompt|unprompted|without (outside )?instruction|no coaching|no intervention)\b/.test(normalized);
    case "nonWordBehavior":
      return /\b(space|leading space|punctuation|apostrophe|period|url|slash|dot|dense string|not a word|subword|byte-pattern|tokenization differs)\b/.test(
        normalized
      );
    case "handoff":
      return trainingHandoffEvidenceIsConcrete(value);
    case "netExplanation":
      return (
        /\bverified\b/.test(normalized) &&
        /\brework\b/.test(normalized) &&
        /\b(?:net|credits?)\b/.test(normalized)
      ) || (
        /\bpay\b/.test(normalized) &&
        /\bcost\b/.test(normalized) &&
        /\bnet\b/.test(normalized)
      );
    case "snapTrust":
      return /\b(swipe|snap|gesture|input|cut)\b/.test(normalized) &&
        /\b(trusted|precise|fair|no complaint|no mistrust|did not blame|not input imprecision)\b/.test(normalized);
    case "mobileReadability":
      return mobileReadabilityEvidenceIsConcrete(value);
    case "laborFrame":
      return /\b(ai|browser|supervisor|labor|payroll|audit|cost|rank|work|job)\b/.test(normalized);
    case "engagementAesthetic":
      return /\b(another round|keep playing|kept playing|continued|continue|wanted|curious|engaged|fun|entertaining|compelling|pulled|stayed)\b/.test(
        normalized
      ) &&
        /\b(visual|style|aesthetic|degraded|browser|assistant|robot|intentional|not broken|interface|looked|felt)\b/.test(
          normalized
        );
    case "copiedSummary":
      return /\b(copy summary|copied summary|pasted|ledger|run id|start source|ok\/missed\/false|verified|rework|net|best saved)\b/.test(
        normalized
      );
  }
}

function trainingHandoffEvidenceIsConcrete(value: string): boolean {
  const clauses = value
    .trim()
    .toLowerCase()
    .split(/[.!?;\n]+/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  return clauses.some((clause) => {
    const handoffContext =
      /\bhandoff(?:\s+(?:screen|surface|state))?\b/.test(clause) ||
      /\btutorial[- ]complet(?:e|ed|ion)\s+(?:screen|surface|state)\b/.test(clause);
    const startedTraining = /\bstart(?:ed|s)\s+(?:the\s+)?[`"']?training\b[`"']?/.test(clause);
    const clickedTraining = /\bclick(?:ed|s)\s+(?:on\s+)?(?:the\s+)?[`"']?(?:start\s+)?training\b[`"']?(?:\s+(?:button|action|control))?/.test(
      clause
    );
    const withoutOutsideInstruction = /\b(no prompts?|no prompting|unprompted|without (?:outside |facilitator )?(?:instructions?|prompts?|prompting|coaching)|no coaching|no intervention|within \d+ seconds?)\b/.test(
      clause
    );
    const negatedOrFailedAction =
      /\b(?:(?:no|zero)\s+(?:testers?|players?|participants?|users?|sessions?|one)|none\s+of\s+(?:the\s+)?(?:testers?|players?|participants?|users?|sessions?)|not\s+one\s+(?:tester|player|participant|user|session))\s+(?:ever\s+)?(?:successfully\s+)?(?:clicked|clicks|started|starts)\b/.test(
        clause
      ) ||
      /\b(?:did|does|do|could|can|was|were)\s+not\s+(?:successfully\s+)?(?:click|start)\b/.test(clause) ||
      /\b(?:didn't|doesn't|don't|couldn't|can't|cannot)\s+(?:successfully\s+)?(?:click|start)\b/.test(clause) ||
      /\bnever\s+(?:clicked|clicks|started|starts)\b/.test(clause) ||
      /\b(?:failed|fails)\s+to\s+(?:click|start)\b/.test(clause) ||
      /\b(?:was|were|is|are)\s+unable\s+to\s+(?:click|start)\b/.test(clause);
    const mainMenuAction = /\bmain[- ]menu\b/.test(clause);

    return (
      handoffContext &&
      (startedTraining || clickedTraining) &&
      withoutOutsideInstruction &&
      !negatedOrFailedAction &&
      !mainMenuAction
    );
  });
}

function sessionObservationCriterionConsistencyIssues(session: PlaytestSessionNote): string[] {
  const issues: string[] = [];

  for (const criterion of playtestCriteria) {
    const observationLabel = criterionObservationConsistency[criterion.id];
    if (!observationLabel) {
      continue;
    }

    const criterionState = session.criteria[criterion.id];
    const observationState = session.observationNotes[observationLabel]?.result;
    if (criterionState === "missing" || observationState === undefined || observationState === "missing") {
      continue;
    }

    if (criterionState === "pass" && observationState !== "pass") {
      issues.push(
        `${session.file}: ${criterion.label} is marked pass but observation "${observationLabel}" is ${observationState}.`
      );
    } else if (criterionState === "fail" && observationState === "pass") {
      issues.push(
        `${session.file}: ${criterion.label} is marked fail but observation "${observationLabel}" is pass.`
      );
    }
  }

  return issues;
}

function debriefAnswerAddressesQuestion(index: number, value: string): boolean {
  const normalized = value.trim().toLowerCase();

  switch (index) {
    case 0:
      return /\b(swipe|cut|place|placed|placing|put|mark)\b/.test(normalized) &&
        /\b(token|boundary|split|between|slot)\b/.test(normalized);
    case 1:
      return /\b(token)\b/.test(normalized) && /\b(boundary|split|divide|break|between|chunk)\b/.test(normalized);
    case 2:
      return /\b(space|leading space|punctuation|apostrophe|period|url|slash|dot|dense string|not a word|subword|word reading)\b/.test(
        normalized
      );
    case 3:
      return (
        /\b(?:verified|token credits?)\b/.test(normalized) &&
        /\b(?:rework|net|missed|false|exact)\b/.test(normalized)
      ) || (
        /\bpay\b/.test(normalized) &&
        /\b(cost|net|missed|false|correct)\b/.test(normalized)
      );
    case 4:
      return /\b(fair|unfair|snap|swipe|gesture|input|precise|imprecision|mistrust|trusted|blame)\b/.test(
        normalized
      );
    case 5:
      return /\b(ai|browser|supervisor|labor|payroll|audit|cost|rank|work|job|training)\b/.test(normalized);
    case 6:
      return /\b(screen|read|hard|hardest|hud|text|review|marker|feedback|wiener|speech|overseer|mobile|result|url|dense|copy)\b/.test(
        normalized
      );
    case 7:
      return /\b(keep|kept|continue|continued|another|round|stop|stopped|quit|play|playing|curious|engaged|fun|frustrat|bored|wanted)\b/.test(
        normalized
      );
    default:
      return true;
  }
}

function capturedLine(summary: string, pattern: RegExp): string | undefined {
  for (const line of summary.split(/\r?\n/)) {
    const value = pattern.exec(line)?.[1]?.trim().toLowerCase();
    if (value && value !== "not captured") {
      return value;
    }
  }

  return undefined;
}

function firstNonblankLine(markdown: string): string | undefined {
  return markdown.split(/\r?\n/).find((line) => line.trim().length > 0);
}

function hasCapturedRoundTrace(summary: string): boolean {
  const lines = summary.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => /^Round trace:\s*$/i.test(line));
  if (headerIndex < 0) {
    return false;
  }

  return lines.slice(headerIndex + 1).some((line) =>
    /^\d+\.\s+\S+\s+\/\s+\S+\s+\/\s+tier\s+\d+\s+\/\s+tokens\s+\d+\s+\/\s+OK\s+\d+\s+\/\s+Missed\s+\d+\s+\/\s+False\s+\d+$/i.test(
      line
    )
  );
}

function hasCapturedInputFeelTrace(summary: string): boolean {
  const lines = summary.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => /^Input feel trace:\s*$/i.test(line));
  if (headerIndex < 0) {
    return false;
  }

  const traceLines = lines.slice(headerIndex + 1);
  const hasFieldLegend = traceLines.some((line) =>
    /\bfirst[-\s]?cut\b.*\blatency\b/i.test(line) &&
    /\bresolve\b.*\btiming\b/i.test(line) &&
    /\bbatch\b.*\bownership\b/i.test(line) &&
    /\bno[-\s]?cut\b.*\backnowledgement/i.test(line) &&
    /\btouch[-\s]?loupe\b.*\bclearance\b/i.test(line)
  );
  const hasMetricLine = traceLines.some((line) =>
    /^\d+\.\s+samples\s+\d+\s+\/\s+responses\s+\d+\s+\/\s+first\s+(?:\d+ms|n\/a)\s+\/\s+resolve-first\s+(?:\d+ms|n\/a)\s+\/\s+resolve-last\s+(?:\d+ms|n\/a)\s+\/\s+commit\s+\d+\s+\/\s+batch\s+\d+\s+\/\s+release-latched\s+\d+\s+\/\s+last-source\s+(?:direct|release|adjust|none)\s+\/\s+adjusted\s+\d+\s+\/\s+gesture-samples\s+\d+\s+\/\s+owned-cuts\s+\d+\s+\/\s+no-cut\s+\d+\s+\/\s+near\s+\d+\s+\/\s+off\s+\d+\s+\/\s+loupe\s+\d+\s+\/\s+ready\s+\d+\s+\/\s+low-clear\s+\d+\s+\/\s+min-clear\s+(?:\d+px|n\/a)$/i.test(
      line
    )
  );

  return hasFieldLegend && hasMetricLine;
}

function validGameRunId(value: string): boolean {
  return new RegExp(`^${PLAYTEST_RUN_PREFIX}-[a-z0-9-]+$`, "i").test(value.trim());
}

function mobileSessionFromMetadata(metadata: PlaytestMetadata): boolean {
  return (
    mobileDeviceTouchFromMetadata(metadata) &&
    metadata.network?.trim().toLowerCase() === "lan" &&
    !!metadata.launchUrl &&
    launchUrlUsesLanHost(metadata.launchUrl)
  );
}

function mobileDeviceTouchFromMetadata(metadata: PlaytestMetadata): boolean {
  const input = metadata.input?.trim().toLowerCase() ?? "";
  const device = metadata.deviceBrowser?.toLowerCase() ?? "";

  return (
    ["touch", "mixed", "pen"].includes(input) &&
    /\b(phone|mobile|tablet|ipad|iphone|android)\b/.test(device)
  );
}

function launchUrlHasPlaytestReset(value: string): boolean {
  try {
    const url = new URL(value, "http://127.0.0.1:5173");
    return url.searchParams.get("playtestReset") === "1";
  } catch {
    return false;
  }
}

function launchUrlUsesLanHost(value: string): boolean {
  try {
    const url = new URL(value, "http://127.0.0.1:5173");
    const host = url.hostname.toLowerCase();
    return host !== "127.0.0.1" && host !== "localhost" && host !== "::1" && host !== "[::1]";
  } catch {
    return false;
  }
}

function tallyCriterion(criterion: PlaytestCriterion, sessions: PlaytestSessionNote[]): CriterionTally {
  const scopedSessions =
    criterion.scope === "mobile-sessions" ? sessions.filter((session) => session.isMobileSession) : sessions;
  const states = scopedSessions.map((session) => session.criteria[criterion.id]);
  const passed = states.filter((state) => state === "pass").length;
  const failed = states.filter((state) => state === "fail").length;
  const missing = states.filter((state) => state === "missing").length;
  const ambiguous = states.filter((state) => state === "ambiguous").length;
  const issues: string[] = [];

  if (criterion.scope === "mobile-sessions" && scopedSessions.length === 0) {
    issues.push(
      `${criterion.label}: no real phone/tablet session with touch, pen, or mixed input, Network: LAN, and a non-localhost launch URL was found.`
    );
  }

  if (missing > 0) {
    issues.push(`${criterion.label}: ${missing} scoped session(s) have missing evidence.`);
  }

  if (ambiguous > 0) {
    issues.push(`${criterion.label}: ${ambiguous} scoped session(s) have ambiguous evidence.`);
  }

  const minPasses = criterion.scope === "all-sessions" ? sessions.length : criterion.minPasses ?? scopedSessions.length;
  const met =
    scopedSessions.length > 0 &&
    passed >= minPasses &&
    missing === 0 &&
    ambiguous === 0 &&
    (criterion.scope !== "all-sessions" || failed === 0) &&
    (criterion.scope !== "mobile-sessions" || failed === 0);

  if (!met && passed < minPasses) {
    issues.push(`${criterion.label}: ${passed}/${scopedSessions.length} pass, below ${criterion.threshold}.`);
  }

  return {
    criterion,
    passed,
    failed,
    missing,
    ambiguous,
    evaluatedSessions: scopedSessions.length,
    met,
    issues
  };
}

function playtestFilesFromArgs(args: string[]): string[] {
  return args.filter((arg) => arg !== "--help" && arg !== "-h");
}

function usage(): string {
  return [
    "Usage:",
    "  npm run playtest:evaluate -- <session-note.md> ...",
    "",
    "Provide five completed session notes created from docs/playtest_session_notes_template.md."
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const helpRequested = process.argv.includes("--help") || process.argv.includes("-h");
  const files = playtestFilesFromArgs(process.argv.slice(2));
  if (files.length === 0 || helpRequested) {
    console.log(usage());
    process.exitCode = helpRequested ? 0 : 1;
  } else {
    const sessions = files.map((file) => parsePlaytestSessionNote(readFileSync(file, "utf8"), file));
    const evaluation = evaluatePlaytestSessions(sessions);
    console.log(renderPlaytestGateEvaluation(evaluation));
    process.exitCode = evaluation.ready ? 0 : 1;
  }
}
