import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  parsePlaytestSessionNote,
  playtestSessionEvidenceIssues,
  playtestCriteria,
  type PlaytestSessionNote
} from "./evaluate-playtest-notes";

export interface PlaytestSessionStatus {
  file: string;
  exists: boolean;
  testerId?: string;
  runId?: string;
  mobile: boolean;
  metadataComplete: boolean;
  summaryComplete: boolean;
  observationsComplete: boolean;
  debriefComplete: boolean;
  criteriaEntered: boolean;
  criteriaEvidenceValid: boolean;
  principleEvidenceComplete: boolean;
  readyForRollup: boolean;
  missing: string[];
  criterionIssues: string[];
}

export interface PlaytestStatusReport {
  files: string[];
  statuses: PlaytestSessionStatus[];
  completeCount: number;
  mobileMetadataCount: number;
  mobileCount: number;
  mobileGateSatisfied: boolean;
  nextSessionFile?: string;
  nextSessionShouldBeMobile: boolean;
  readyForRollup: boolean;
}

const defaultSessionFiles = [
  "docs/playtests/session-1.md",
  "docs/playtests/session-2.md",
  "docs/playtests/session-3.md",
  "docs/playtests/session-4.md",
  "docs/playtests/session-5.md"
];

export function buildPlaytestStatusReport(files = defaultSessionFiles): PlaytestStatusReport {
  const statuses = files.map((file) => playtestSessionStatus(file));
  const completeCount = statuses.filter((status) => status.readyForRollup).length;
  const mobileMetadataCount = statuses.filter((status) => status.mobile).length;
  const mobileCount = statuses.filter((status) => status.readyForRollup && status.mobile).length;
  const mobileGateSatisfied = mobileCount > 0;
  const nextSessionFile = statuses.find((status) => !status.readyForRollup)?.file;

  return {
    files,
    statuses,
    completeCount,
    mobileMetadataCount,
    mobileCount,
    mobileGateSatisfied,
    nextSessionFile,
    nextSessionShouldBeMobile: !mobileGateSatisfied && nextSessionFile !== undefined,
    readyForRollup: statuses.length === 5 && statuses.every((status) => status.readyForRollup) && mobileGateSatisfied
  };
}

export function renderPlaytestStatusReport(report: PlaytestStatusReport): string {
  const nextSessionLine = nextSessionStatusLine(report);
  const nextCommands = nextPlaytestStatusCommandLines(report);
  const lines = [
    "Tokenizer Training playtest session status",
    `Completed notes: ${report.completeCount}/${report.statuses.length}`,
    `Completed real mobile/touch notes: ${report.mobileCount}`,
    `Mobile metadata notes: ${report.mobileMetadataCount}`,
    `Ready for rollup evaluator: ${report.readyForRollup ? "yes" : "no"}`,
    "",
    "Session files:"
  ];

  for (const status of report.statuses) {
    const label = status.readyForRollup ? "READY" : "INCOMPLETE";
    const tester = status.testerId ? ` tester ${status.testerId}` : "";
    const run = status.runId ? ` run ${status.runId}` : "";
    lines.push(`- ${label} ${status.file}${tester}${run}`);
    if (!status.readyForRollup) {
      lines.push(`  missing: ${status.missing.join(", ") || "unknown"}`);
      for (const issue of status.criterionIssues) {
        lines.push(`  criterion issue: ${issue}`);
      }
    }
  }

  if (!report.readyForRollup) {
    lines.push(
      "",
      "Next:",
      ...(nextSessionLine ? [nextSessionLine] : []),
      ...(!report.mobileGateSatisfied && !report.nextSessionFile
        ? ["- No incomplete note remains; rerun or replace one completed note with a real phone/tablet touch session."]
        : []),
      ...(report.statuses.some((status) => !status.readyForRollup)
        ? ["- Fill incomplete session notes before `npm run playtest:evaluate`."]
        : []),
      ...(!report.mobileGateSatisfied && report.mobileMetadataCount > 0
        ? ["- A mobile-looking note is present but incomplete; it does not satisfy the mobile gate until every required section is complete."]
        : []),
      ...(!report.mobileGateSatisfied
        ? [
            "- At least one note must be a real phone/tablet session with touch, pen, or mixed input, Network: LAN, and a non-localhost Launch URL."
          ]
        : []),
      ...mobileGateValidityLines(report),
      "- Preserve contradictions instead of converting ambiguous evidence into a pass."
    );
  }

  lines.push(
    "",
    "Immediate next commands:",
    ...nextCommands.map((command) => `- ${command}`)
  );

  return lines.join("\n");
}

function mobileGateValidityLines(report: PlaytestStatusReport): string[] {
  if (report.mobileGateSatisfied) {
    return [];
  }

  const noteLine = report.nextSessionFile
    ? `- Mobile note target: ${report.nextSessionFile}${report.nextSessionShouldBeMobile ? " must remain the required real-device note." : "."}`
    : "- Mobile note target: replace or rerun one completed note as the required real-device note.";

  return [
    noteLine,
    "- Mobile note validity: use a real phone/tablet/mobile browser with touch, pen, or mixed input; desktop emulation, trackpads, and desktop touchscreens do not count.",
    "- Mobile launch validity: copy Network: LAN and the non-localhost Launch URL only after explicit `--host <network-host>` launch-check passes and the actual device reaches the menu.",
    "- Mobile visual evidence: name HUD, static prompt text, review markers, feedback, Wiener speech, clipping, overlap, or finger occlusion."
  ];
}

export function nextPlaytestStatusCommandLines(report: PlaytestStatusReport): string[] {
  if (report.readyForRollup) {
    return [
      `npm run playtest:evaluate -- ${report.files.join(" ")}`,
      "npm run playtest:rollup",
      "Fill docs/playtest_rollup_completed.md with concrete five-session evidence.",
      "npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md",
      "npm run playtest:audit"
    ];
  }

  if (!report.mobileGateSatisfied && !report.nextSessionFile) {
    return [
      "Replace or rerun one completed note as a real phone/tablet touch session.",
      "npm run playtest:brief -- --host <network-host> --port <chosen-port>",
      "npm run playtest:launch-check -- --host <network-host> --port <chosen-port>",
      "After the session: npm run playtest:status"
    ];
  }

  if (report.nextSessionShouldBeMobile) {
    return [
      "npm run playtest:preflight",
      "npm run playtest:doctor",
      "Start the LAN server on the doctor-selected port: npm run playtest:serve:lan (or npm run playtest:serve:lan -- --port <chosen-port> for a non-default port)",
      "After Vite prints the Network URL, rerun the brief for that exact host: npm run playtest:brief -- --host <network-host> --port <chosen-port>",
      "Verify the physical-device URL in a second terminal: npm run playtest:launch-check -- --host <network-host> --port <chosen-port>",
      "Open the Recommended tester launch on the actual phone/tablet and copy Network: LAN plus the non-localhost Launch URL into the note.",
      "After the session: npm run playtest:status"
    ];
  }

  if (report.nextSessionFile) {
    return [
      "npm run playtest:preflight",
      "npm run playtest:brief",
      "Start the printed strict server command, then use the Recommended tester launch URL.",
      "After the session: npm run playtest:status"
    ];
  }

  return [
    "Rerun npm run playtest:status with the expected session-note files."
  ];
}

function nextSessionStatusLine(report: PlaytestStatusReport): string | undefined {
  if (!report.nextSessionFile) {
    return undefined;
  }

  const mobileSuffix = report.nextSessionShouldBeMobile
    ? " as the required real phone/tablet touch session"
    : "";

  return `- Next session note: ${report.nextSessionFile}${mobileSuffix}.`;
}

function playtestSessionStatus(file: string): PlaytestSessionStatus {
  if (!existsSync(file)) {
    return {
      file,
      exists: false,
      mobile: false,
      metadataComplete: false,
      summaryComplete: false,
      observationsComplete: false,
      debriefComplete: false,
      criteriaEntered: false,
      criteriaEvidenceValid: false,
      principleEvidenceComplete: false,
      readyForRollup: false,
      missing: ["file"],
      criterionIssues: []
    };
  }

  const session = parsePlaytestSessionNote(readFileSync(file, "utf8"), file);
  const criteriaEntered = playtestCriteria.every((criterion) =>
    session.criteria[criterion.id] !== "missing" && (session.criterionEvidence[criterion.id]?.trim() ?? "").length > 0
  );
  const criterionIssues = sessionCriterionIssues(session);
  const criteriaEvidenceValid = criterionIssues.length === 0;
  const missing = missingStatusParts(session, criteriaEntered, criteriaEvidenceValid);

  return {
    file,
    exists: true,
    testerId: session.metadata.testerId,
    runId: session.metadata.runId,
    mobile: session.isMobileSession,
    metadataComplete: session.metadataValidation.complete,
    summaryComplete: session.summaryValidation.complete,
    observationsComplete: session.observationValidation.complete,
    debriefComplete: session.debriefValidation.complete,
    criteriaEntered,
    criteriaEvidenceValid,
    principleEvidenceComplete: session.principleEvidenceValidation.complete,
    readyForRollup: missing.length === 0,
    missing,
    criterionIssues
  };
}

function missingStatusParts(
  session: PlaytestSessionNote,
  criteriaEntered: boolean,
  criteriaEvidenceValid: boolean
): string[] {
  const missing: string[] = [];

  if (!session.metadataValidation.complete) missing.push("metadata");
  if (!session.summaryValidation.complete) missing.push("copied summary");
  if (!session.observationValidation.complete) missing.push("observation rows");
  if (!session.debriefValidation.complete) missing.push("debrief answers");
  if (!criteriaEntered) missing.push("pass-criteria rows");
  if (criteriaEntered && !criteriaEvidenceValid) missing.push("pass-criteria evidence");
  if (!session.principleEvidenceValidation.complete) missing.push("principle evidence");

  return missing;
}

function sessionCriterionIssues(session: PlaytestSessionNote): string[] {
  return playtestSessionEvidenceIssues(session).filter((issue) =>
    issue.startsWith(`${session.file}:`) &&
    (
      issue.includes("without supporting evidence") ||
      issue.includes("pass needs criterion-specific observed evidence") ||
      issue.includes("needs concrete mobile visual evidence") ||
      issue.includes("marked pass but observation") ||
      issue.includes("marked fail but observation")
    )
  );
}

function parseStatusArgs(args: string[]): { files: string[]; help: boolean } {
  const help = args.includes("--help") || args.includes("-h");
  const files = args.filter((arg) => arg !== "--help" && arg !== "-h");

  return {
    help,
    files: files.length > 0 ? files : defaultSessionFiles
  };
}

function usage(): string {
  return [
    "Usage:",
    "  npm run playtest:status",
    "  npm run playtest:status -- docs/playtests/session-1.md docs/playtests/session-2.md",
    "",
    "Reports per-session note completion before running the stricter playtest evaluators."
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseStatusArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
  } else {
    console.log(renderPlaytestStatusReport(buildPlaytestStatusReport(args.files)));
  }
}
