import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  LEGACY_PLAYTEST_RUN_PREFIX,
  PLAYTEST_RUN_PREFIX
} from "../src/game/systems/ProductIdentitySystem";

export interface RollupCriterion {
  id: string;
  label: string;
  minPasses?: number;
  requireAll?: boolean;
  requireAny?: boolean;
}

export interface RollupCriterionRow {
  criterion: RollupCriterion;
  passedSessions: string;
  evidence: string;
  decision: string;
}

export interface PrincipleAuditRow {
  area: string;
  evidence: string;
  decision: string;
}

export interface PlaytestRollup {
  file: string;
  sessionIndexRows: string[][];
  criterionRows: RollupCriterionRow[];
  aggregateSignals: Record<string, string>;
  principleRows: PrincipleAuditRow[];
  principleVerdict: {
    embodied: string;
    notYetEmbodied: string;
  };
  finalDecision: {
    broaderPlaytestReady: string;
    iterateBeforeBroaderPlaytest: string;
  };
}

export interface PlaytestRollupEvaluation {
  ready: boolean;
  rollup: PlaytestRollup;
  issues: string[];
}

export const rollupCriteria: RollupCriterion[] = [
  {
    id: "firstAction",
    label: "First tutorial action without outside instruction",
    minPasses: 4
  },
  {
    id: "nonWordBehavior",
    label: "Explains one non-word tokenization behavior after tutorial",
    minPasses: 4
  },
  {
    id: "handoff",
    label: "Starts Endless from tutorial-complete handoff without outside instruction",
    minPasses: 4
  },
  {
    id: "netExplanation",
    label: "Explains pay minus cost equals net after a review state",
    minPasses: 4
  },
  {
    id: "snapTrust",
    label: "No systematic swipe/snap mistrust",
    requireAll: true
  },
  {
    id: "mobileReadability",
    label: "Mobile readability holds on real device",
    requireAll: true,
    requireAny: true
  },
  {
    id: "laborFrame",
    label: "Degraded AI labor frame noticed without being told",
    minPasses: 3
  },
  {
    id: "engagementAesthetic",
    label: "Engagement and degraded visual intent observed",
    minPasses: 3
  },
  {
    id: "copiedSummary",
    label: "Copied summary returned with run ID, start source, input modality, round trace, cut-error counts, total net, and best-saved record",
    minPasses: 4
  }
];

const principleAreas = [
  "Top game design",
  "Critical/conceptual play",
  "Emotional design",
  "Game feel",
  "Optimal visual display"
] as const;

const aggregateSignalLabels = [
  "Median rounds completed",
  "Lowest accuracy",
  "Highest false-cut count",
  "Repeated missed-boundary pattern",
  "Repeated false-cut pattern",
  "Reported input mistrust",
  "Mobile readability issue",
  "Strongest evidence that tokenization was learned",
  "Strongest evidence that the labor/cost frame landed",
  "Strongest evidence that play stayed engaging and the visual style landed"
] as const;

export function parsePlaytestRollup(markdown: string, file = "rollup.md"): PlaytestRollup {
  return {
    file,
    sessionIndexRows: parseSessionIndex(markdown),
    criterionRows: parseCriterionRows(markdown),
    aggregateSignals: parseAggregateSignals(markdown),
    principleRows: parsePrincipleRows(markdown),
    principleVerdict: {
      embodied: bulletValue(markdown, "Major principles embodied"),
      notYetEmbodied: bulletValue(markdown, "Major principles not yet embodied")
    },
    finalDecision: {
      broaderPlaytestReady: bulletValue(markdown, "Broader playtest ready"),
      iterateBeforeBroaderPlaytest: bulletValue(markdown, "Iterate before broader playtest")
    }
  };
}

export function evaluatePlaytestRollup(markdown: string, file = "rollup.md"): PlaytestRollupEvaluation {
  const rollup = parsePlaytestRollup(markdown, file);
  const issues: string[] = [];

  validateSessionIndex(rollup, issues);
  validateCriterionRows(rollup, issues);
  validateAggregateSignals(rollup, issues);
  validatePrincipleAudit(rollup, issues);
  validateFinalDecision(rollup, issues);

  return {
    ready: issues.length === 0,
    rollup,
    issues
  };
}

export function renderPlaytestRollupEvaluation(evaluation: PlaytestRollupEvaluation): string {
  const lines = [
    "Tokenizer Training playtest rollup",
    `File: ${evaluation.rollup.file}`,
    `Decision: ${evaluation.ready ? "broader playtest ready" : "iterate before broader playtest"}`,
    "",
    "Criterion decisions:"
  ];

  for (const row of evaluation.rollup.criterionRows) {
    lines.push(`- ${positiveDecision(row.decision) ? "PASS" : "FAIL"} ${row.criterion.label}: ${row.passedSessions || "missing"}`);
  }

  lines.push("", "Principle decisions:");
  for (const row of evaluation.rollup.principleRows) {
    lines.push(`- ${positiveDecision(row.decision) ? "PASS" : "FAIL"} ${row.area}`);
  }

  if (evaluation.issues.length > 0) {
    lines.push("", "Issues:");
    for (const issue of evaluation.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

function validateSessionIndex(rollup: PlaytestRollup, issues: string[]): void {
  if (rollup.sessionIndexRows.length !== 5) {
    issues.push(`Session index must contain five tester rows; found ${rollup.sessionIndexRows.length}.`);
  }

  rollup.sessionIndexRows.forEach((row, index) => {
    const [tester, runId, input, startSource, captured, notesFile] = row;
    const label = `session ${index + 1}`;

    if (!tester?.trim()) issues.push(`${label}: missing tester index.`);
    if (!validGameRunId(runId ?? "")) issues.push(`${label}: missing or invalid run ID.`);
    if (!/^(mouse|touch|pen|trackpad|mixed)$/i.test(input ?? "")) issues.push(`${label}: input must be mouse, touch, pen, trackpad, or mixed.`);
    if (!substantiveField(startSource)) issues.push(`${label}: missing start source.`);
    if (!positiveDecision(captured)) issues.push(`${label}: result summary captured must be yes/pass/captured.`);
    if (!/\.md$/i.test(notesFile ?? "")) issues.push(`${label}: notes file must name a markdown file.`);
  });
}

function validGameRunId(value: string): boolean {
  return new RegExp(`^(?:${PLAYTEST_RUN_PREFIX}|${LEGACY_PLAYTEST_RUN_PREFIX})-[a-z0-9-]+$`, "i").test(value.trim());
}

function validateCriterionRows(rollup: PlaytestRollup, issues: string[]): void {
  for (const criterion of rollupCriteria) {
    const row = rollup.criterionRows.find((candidate) => candidate.criterion.id === criterion.id);
    if (!row) {
      issues.push(`Missing pass-criteria row: ${criterion.label}.`);
      continue;
    }

    const count = parsedPassCount(row.passedSessions);
    if (!count) {
      issues.push(`${criterion.label}: passed sessions must use a count such as 4/5 or 4 of 5.`);
    } else if (criterion.requireAll && count.passed !== count.total) {
      issues.push(`${criterion.label}: must pass every scoped session; found ${count.passed}/${count.total}.`);
    } else if (criterion.requireAny && count.total < 1) {
      issues.push(`${criterion.label}: must include at least one scoped real phone/tablet session.`);
    } else if (criterion.minPasses !== undefined && count.passed < criterion.minPasses) {
      issues.push(`${criterion.label}: ${count.passed}/${count.total} pass, below required ${criterion.minPasses}.`);
    }

    if (!substantiveEvidence(row.evidence)) {
      issues.push(`${criterion.label}: evidence/contradictions field is missing or generic.`);
    }

    if (!positiveDecision(row.decision)) {
      issues.push(`${criterion.label}: decision must be pass/met/supported for broader readiness.`);
    }
  }
}

function validateAggregateSignals(rollup: PlaytestRollup, issues: string[]): void {
  for (const label of aggregateSignalLabels) {
    const value = rollup.aggregateSignals[label];
    if (!substantiveEvidence(value)) {
      issues.push(`Aggregate signal missing: ${label}.`);
    } else if (!aggregateSignalSupportsLabel(label, value)) {
      issues.push(`${label}: aggregate signal must include ${aggregateSignalRequirement(label)}.`);
    }
  }
}

function validatePrincipleAudit(rollup: PlaytestRollup, issues: string[]): void {
  for (const area of principleAreas) {
    const row = rollup.principleRows.find((candidate) => candidate.area === area);
    if (!row) {
      issues.push(`Missing principle audit row: ${area}.`);
      continue;
    }

    if (!substantiveEvidence(row.evidence)) {
      issues.push(`${area}: principle evidence is missing or generic.`);
    } else if (!principleEvidenceSupportsArea(area, row.evidence)) {
      issues.push(`${area}: principle evidence must name concrete behavior for that principle area.`);
    }

    if (!positiveDecision(row.decision)) {
      issues.push(`${area}: principle decision must be embodied/supported/met for broader readiness.`);
    }
  }

  if (!substantiveEvidence(rollup.principleVerdict.embodied)) {
    issues.push("Principle verdict missing: Major principles embodied.");
  }

  if (!noneValue(rollup.principleVerdict.notYetEmbodied)) {
    issues.push("Principle verdict must record no unresolved major principle gaps for broader readiness.");
  }
}

function validateFinalDecision(rollup: PlaytestRollup, issues: string[]): void {
  if (!positiveDecision(rollup.finalDecision.broaderPlaytestReady)) {
    issues.push("Final decision must mark Broader playtest ready as yes/pass/ready.");
  }

  if (!negativeDecision(rollup.finalDecision.iterateBeforeBroaderPlaytest)) {
    issues.push("Final decision must mark Iterate before broader playtest as no/none.");
  }
}

function parseSessionIndex(markdown: string): string[][] {
  return parseTableRows(sectionText(markdown, "Session Index"))
    .filter((cells) => cells.length >= 6 && /^\d+$/.test(cells[0]))
    .map((cells) => cells.slice(0, 6));
}

function parseCriterionRows(markdown: string): RollupCriterionRow[] {
  const rows: RollupCriterionRow[] = [];
  for (const cells of parseTableRows(sectionText(markdown, "Pass-Criteria Tally"))) {
    if (cells.length < 5 || cells[0] === "Criterion" || /^-+$/.test(cells[0])) {
      continue;
    }

    const criterion = rollupCriteria.find((candidate) => candidate.label === cells[0]);
    if (!criterion) {
      continue;
    }

    rows.push({
      criterion,
      passedSessions: cells[2],
      evidence: cells[3],
      decision: cells[4]
    });
  }

  return rows;
}

function parsePrincipleRows(markdown: string): PrincipleAuditRow[] {
  const rows: PrincipleAuditRow[] = [];
  for (const cells of parseTableRows(sectionText(markdown, "Principle Embodiment Audit"))) {
    if (cells.length < 4 || cells[0] === "Principle Area" || /^-+$/.test(cells[0])) {
      continue;
    }

    if (!principleAreas.includes(cells[0] as (typeof principleAreas)[number])) {
      continue;
    }

    rows.push({
      area: cells[0],
      evidence: cells[2],
      decision: cells[3]
    });
  }

  return rows;
}

function parseAggregateSignals(markdown: string): Record<string, string> {
  const section = sectionText(markdown, "Aggregate Signals");
  return Object.fromEntries(
    aggregateSignalLabels.map((label) => [label, bulletValue(section, label)])
  );
}

function parseTableRows(section: string): string[][] {
  return section
    .split(/\r?\n/)
    .map(markdownTableCells)
    .filter((cells) => cells.length > 0);
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

function bulletValue(markdown: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^-\\s*${escapedLabel}:[ \\t]*(.*?)[ \\t]*$`, "im").exec(markdown);
  return match?.[1]?.trim() ?? "";
}

function parsedPassCount(value: string): { passed: number; total: number } | undefined {
  const match = /(\d+)\s*(?:\/|of)\s*(\d+)/i.exec(value);
  if (!match) {
    return undefined;
  }

  return {
    passed: Number.parseInt(match[1], 10),
    total: Number.parseInt(match[2], 10)
  };
}

function substantiveField(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0 && value.trim() !== "-";
}

function substantiveEvidence(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return false;
  }

  return ![
    "-",
    "n/a",
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

function principleEvidenceSupportsArea(area: string, value: string): boolean {
  const normalized = value.toLowerCase();

  switch (area) {
    case "Top game design":
      return /\b(prompt|action|swipe|cut|review|evidence|consequence|handoff|endless|loop|continuation|coaching)\b/.test(
        normalized
      );
    case "Critical/conceptual play":
      return /\b(ai|browser|labor|payroll|audit|supervisor|overseer|rank|cost|company|training)\b/.test(
        normalized
      );
    case "Emotional design":
      return /\b(error|errors|mistake|mistakes|earned|recoverable|clear cuts|fair|pressure|frustration|arbitrary|hostile)\b/.test(
        normalized
      );
    case "Game feel":
      return /\b(swipe|snap|touch|pointer|input|precision|trail|feedback|marker|markers|clear cuts|gesture|mistrust)\b/.test(
        normalized
      );
    case "Optimal visual display":
      return /\b(hud|text|readable|review|marker|markers|feedback|wiener|speech|overseer|results|screenshot|photo|mobile|overlap|clipping|occlusion|layout)\b/.test(
        normalized
      );
    default:
      return false;
  }
}

function aggregateSignalSupportsLabel(label: string, value: string): boolean {
  const normalized = value.toLowerCase();

  switch (label) {
    case "Median rounds completed":
      return /\b\d+(?:\.\d+)?\b/.test(normalized);
    case "Lowest accuracy":
      return /\b\d+(?:\.\d+)?\s*%?\b/.test(normalized);
    case "Highest false-cut count":
      return /\b\d+\b/.test(normalized);
    case "Repeated missed-boundary pattern":
      return /\b(miss|missed|boundary|token|space|punctuation|url|dense|slash|dot|none observed|none reported|no repeated)\b/.test(
        normalized
      );
    case "Repeated false-cut pattern":
      return /\b(false|cut|cuts|overcut|over-cut|space|spaces|punctuation|boundary|boundaries|token|tokens|none observed|none reported|no repeated)\b/.test(
        normalized
      );
    case "Reported input mistrust":
      return /\b(input|mistrust|snap|gesture|touch|mouse|finger|occlusion|precision|tracking|none reported|no tester|none)\b/.test(
        normalized
      );
    case "Mobile readability issue":
      return /\b(mobile|phone|tablet|hud|text|review|marker|feedback|wiener|speech|overseer|screenshot|photo|screen|clipping|overlap|occlusion|none)\b/.test(
        normalized
      );
    case "Strongest evidence that tokenization was learned":
      return /\b(token|tokenization|boundary|space|punctuation|url|dense|fragment|cut|miss|explain|explained)\b/.test(
        normalized
      );
    case "Strongest evidence that the labor/cost frame landed":
      return /\b(labor|cost|payroll|audit|browser|overseer|supervisor|rank|company|training|ai)\b/.test(
        normalized
      );
    case "Strongest evidence that play stayed engaging and the visual style landed":
      return /\b(another round|keep playing|kept playing|continued|continue|wanted|curious|engaged|fun|entertaining|compelling|stayed)\b/.test(
        normalized
      ) &&
        /\b(visual|style|aesthetic|degraded|browser|assistant|robot|intentional|not broken|interface|looked|felt)\b/.test(
          normalized
        );
    default:
      return false;
  }
}

function aggregateSignalRequirement(label: string): string {
  switch (label) {
    case "Median rounds completed":
      return "a numeric median round count";
    case "Lowest accuracy":
      return "a numeric accuracy value";
    case "Highest false-cut count":
      return "a numeric false-cut count";
    case "Repeated missed-boundary pattern":
      return "a concrete missed-boundary pattern or explicit no-repeated-pattern note";
    case "Repeated false-cut pattern":
      return "a concrete false-cut pattern or explicit no-repeated-pattern note";
    case "Reported input mistrust":
      return "a concrete input-trust observation or explicit no-mistrust note";
    case "Mobile readability issue":
      return "a concrete mobile readability issue or explicit no-issue note";
    case "Strongest evidence that tokenization was learned":
      return "a concrete tokenization-learning observation";
    case "Strongest evidence that the labor/cost frame landed":
      return "a concrete labor, browser, audit, rank, or cost-frame observation";
    case "Strongest evidence that play stayed engaging and the visual style landed":
      return "a concrete engagement observation plus a visual-style or intentional-aesthetic observation";
    default:
      return "concrete evidence";
  }
}

function positiveDecision(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase() ?? "";
  return [
    "yes",
    "pass",
    "passed",
    "met",
    "ready",
    "supported",
    "embodied",
    "all supported"
  ].includes(normalized);
}

function negativeDecision(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase() ?? "";
  return ["no", "none", "n/a", "not needed", "not required"].includes(normalized);
}

function noneValue(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase() ?? "";
  return ["none", "no unresolved gaps", "no major gaps", "not applicable", "n/a"].includes(normalized);
}

function usage(): string {
  return [
    "Usage:",
    "  npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md",
    "",
    "Provide one completed rollup created from docs/playtest_rollup_template.md."
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const helpRequested = process.argv.includes("--help") || process.argv.includes("-h");
  const files = process.argv.slice(2).filter((arg) => arg !== "--help" && arg !== "-h");
  if (files.length !== 1 || helpRequested) {
    console.log(usage());
    process.exitCode = helpRequested ? 0 : 1;
  } else {
    const file = files[0];
    const evaluation = evaluatePlaytestRollup(readFileSync(file, "utf8"), file);
    console.log(renderPlaytestRollupEvaluation(evaluation));
    process.exitCode = evaluation.ready ? 0 : 1;
  }
}
