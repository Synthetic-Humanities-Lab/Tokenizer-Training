import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  evaluatePlaytestSessions,
  parsePlaytestSessionNote,
  renderPlaytestGateEvaluation,
  type PlaytestGateEvaluation
} from "./evaluate-playtest-notes";
import {
  evaluatePlaytestRollup,
  renderPlaytestRollupEvaluation,
  type PlaytestRollupEvaluation
} from "./evaluate-playtest-rollup";

export interface ReadinessFileRequirement {
  path: string;
  minBytes?: number;
  pngDimensions?: {
    width: number;
    height: number;
  };
}

export interface ReadinessFileResult extends ReadinessFileRequirement {
  ok: boolean;
  issue?: string;
}

export interface PngValidationResult {
  ok: boolean;
  issue?: string;
  width?: number;
  height?: number;
}

export interface PlaytestReadinessAudit {
  ready: boolean;
  localFiles: ReadinessFileResult[];
  sessionEvaluation?: PlaytestGateEvaluation;
  rollupEvaluation?: PlaytestRollupEvaluation;
  issues: string[];
  sessionFiles: string[];
  rollupFile: string;
}

export interface PlaytestReadinessOptions {
  rootDir?: string;
  sessionFiles?: string[];
  rollupFile?: string;
}

export interface LocalEvidenceAudit {
  ready: boolean;
  localFiles: ReadinessFileResult[];
  issues: string[];
}

const defaultSessionFiles = [
  "docs/playtests/session-1.md",
  "docs/playtests/session-2.md",
  "docs/playtests/session-3.md",
  "docs/playtests/session-4.md",
  "docs/playtests/session-5.md"
];

const defaultRollupFile = "docs/playtest_rollup_completed.md";

const requiredLocalFiles: ReadinessFileRequirement[] = [
  { path: "docs/game_design_reading_notes/README.md" },
  { path: "docs/game_design_reading_notes/chapter_note_manifest.md" },
  { path: "docs/game_design_reading_notes/zubek_elements_of_game_design.md" },
  { path: "docs/game_design_reading_notes/swink_game_feel.md" },
  { path: "docs/game_design_reading_notes/tufte_visual_display.md" },
  { path: "docs/game_design_reading_notes/flanagan_critical_play.md" },
  { path: "docs/game_design_reading_notes/isbister_how_games_move_us.md" },
  { path: "docs/game_design_concepts/README.md" },
  { path: "docs/game_design_concepts/01_loop_as_argument.md" },
  { path: "docs/game_design_concepts/02_text_cutting_game_feel.md" },
  { path: "docs/game_design_concepts/03_teaching_tokenization.md" },
  { path: "docs/game_design_concepts/04_economy_and_critical_play.md" },
  { path: "docs/game_design_concepts/05_emotional_design.md" },
  { path: "docs/game_design_concepts/06_visual_display.md" },
  { path: "docs/game_design_concepts/07_playtest_gates.md" },
  { path: "docs/game_design_principles.md" },
  { path: "docs/design_verification_matrix.md" },
  { path: "docs/economy_tuning_audit.md" },
  { path: "docs/objective_completion_audit.md" },
  { path: "docs/user_playtest_protocol.md" },
  { path: "docs/playtest_facilitator_card.md" },
  { path: "docs/playtest_day_checklist.md" },
  { path: "docs/playtest_session_notes_template.md" },
  { path: "docs/playtest_rollup_template.md" },
  { path: "docs/browser_qa_2026-06-06.md" },
  { path: "docs/browser_qa_2026-06-07.md" },
  qaPng("docs/browser_qa/2026-06-06-canvas-desktop-menu.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-06-canvas-desktop-tutorial-active.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-06-canvas-desktop-tutorial-review.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-06-canvas-desktop-handoff.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-06-canvas-desktop-protocol-results.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-06-canvas-portrait-tutorial-active.png", 390, 844),
  qaPng("docs/browser_qa/2026-06-06-canvas-portrait-tutorial-review.png", 390, 844),
  qaPng("docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-active.png", 320, 568),
  qaPng("docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-review-popup.png", 320, 568),
  qaPng("docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-review-feedback.png", 320, 568),
  qaPng("docs/browser_qa/2026-06-06-canvas-small-phone-menu.png", 320, 568),
  qaPng("docs/browser_qa/2026-06-06-canvas-small-phone-handoff.png", 320, 568),
  qaPng("docs/browser_qa/2026-06-06-canvas-small-phone-results.png", 320, 568),
  qaPng("docs/browser_qa/2026-06-06-canvas-small-phone-protocol-results.png", 320, 568),
  qaPng("docs/browser_qa/2026-06-07-browser-canvas-desktop-menu.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-browser-canvas-desktop-tutorial-review.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-browser-canvas-desktop-handoff.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-browser-canvas-desktop-protocol-results.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-browser-canvas-portrait-tutorial-active.png", 390, 844),
  qaPng("docs/browser_qa/2026-06-07-browser-canvas-portrait-protocol-results.png", 390, 844),
  qaPng("docs/browser_qa/2026-06-07-frozen-canvas-desktop-tutorial-active.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-frozen-canvas-portrait-tutorial-active.png", 390, 844),
  qaPng("docs/browser_qa/2026-06-07-frozen-canvas-small-phone-tutorial-active.png", 320, 568),
  qaPng("docs/browser_qa/2026-06-07-qa-links-desktop-handoff.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-qa-links-portrait-protocol-results.png", 390, 844),
  qaPng("docs/browser_qa/2026-06-07-qa-links-small-phone-protocol-results.png", 320, 568),
  qaPng("docs/browser_qa/2026-06-07-latest-canvas-desktop-menu.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-latest-canvas-desktop-tutorial-active.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-latest-canvas-desktop-tutorial-review.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-latest-canvas-portrait-tutorial-active.png", 390, 844),
  qaPng("docs/browser_qa/2026-06-07-latest-canvas-small-phone-tutorial-active.png", 320, 568),
  qaPng("docs/browser_qa/2026-06-07-chunked-canvas-desktop-menu.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-tight-toast-small-phone-tutorial-active.png", 320, 568),
  qaPng("docs/browser_qa/2026-06-07-review-no-ui-trail-balance.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-continuation-canvas-menu.png", 1280, 720),
  qaPng("docs/browser_qa/2026-06-07-post-ui-byte-route-portrait.png", 390, 844)
];

function qaPng(path: string, width: number, height: number): ReadinessFileRequirement {
  return {
    path,
    minBytes: 50_000,
    pngDimensions: { width, height }
  };
}

export function auditLocalEvidencePackage(rootDir = process.cwd()): LocalEvidenceAudit {
  const issues: string[] = [];
  const localFiles = requiredLocalFiles.map((requirement) => checkReadinessFileRequirement(rootDir, requirement));

  for (const file of localFiles) {
    if (!file.ok && file.issue) {
      issues.push(file.issue);
    }
  }

  return {
    ready: localFiles.every((file) => file.ok) && issues.length === 0,
    localFiles,
    issues
  };
}

export function auditPlaytestReadiness(options: PlaytestReadinessOptions = {}): PlaytestReadinessAudit {
  const rootDir = options.rootDir ?? process.cwd();
  const sessionFiles = options.sessionFiles ?? defaultSessionFiles;
  const rollupFile = options.rollupFile ?? defaultRollupFile;
  const localAudit = auditLocalEvidencePackage(rootDir);
  const issues = [...localAudit.issues];
  const localFiles = localAudit.localFiles;

  const sessionEvaluation = evaluateSessionFiles(rootDir, sessionFiles, issues);
  const rollupEvaluation = evaluateRollupFile(rootDir, rollupFile, issues);
  if (sessionEvaluation && rollupEvaluation) {
    issues.push(...rollupSessionConsistencyIssues(sessionEvaluation, rollupEvaluation));
  }

  return {
    ready:
      localAudit.ready &&
      (sessionEvaluation?.ready ?? false) &&
      (rollupEvaluation?.ready ?? false) &&
      issues.length === 0,
    localFiles,
    sessionEvaluation,
    rollupEvaluation,
    issues,
    sessionFiles,
    rollupFile
  };
}

export function rollupSessionConsistencyIssues(
  sessionEvaluation: Pick<PlaytestGateEvaluation, "sessions" | "tallies">,
  rollupEvaluation: Pick<PlaytestRollupEvaluation, "rollup">
): string[] {
  const issues: string[] = [];
  const sessionsByFile = new Map(sessionEvaluation.sessions.map((session) => [session.file, session]));

  rollupEvaluation.rollup.sessionIndexRows.forEach((row, index) => {
    const [, runId, input, startSource, , notesFile] = row;
    const label = `rollup session row ${index + 1}`;
    const session = sessionsByFile.get(notesFile ?? "");
    if (!session) {
      issues.push(`${label}: notes file ${notesFile || "missing"} does not match an evaluated session note.`);
      return;
    }

    if (runId?.trim() && session.metadata.runId?.trim() && runId.trim() !== session.metadata.runId.trim()) {
      issues.push(`${label}: run ID ${runId.trim()} does not match ${session.file} run ID ${session.metadata.runId.trim()}.`);
    }

    const sessionInput = session.metadata.input?.trim().toLowerCase();
    if (input?.trim() && sessionInput && input.trim().toLowerCase() !== sessionInput) {
      issues.push(`${label}: input ${input.trim()} does not match ${session.file} input ${session.metadata.input?.trim()}.`);
    }

    const summaryStart = copiedSummaryLine(session.copiedSummary, "Start");
    if (
      startSource?.trim() &&
      summaryStart &&
      startSource.trim().toLowerCase() !== summaryStart.trim().toLowerCase()
    ) {
      issues.push(`${label}: start source ${startSource.trim()} does not match ${session.file} copied summary start ${summaryStart.trim()}.`);
    }
  });

  for (const row of rollupEvaluation.rollup.criterionRows) {
    const tally = sessionEvaluation.tallies.find((candidate) => candidate.criterion.id === row.criterion.id);
    const count = parsedRollupCount(row.passedSessions);
    if (!tally || !count) {
      continue;
    }

    if (count.passed !== tally.passed || count.total !== tally.evaluatedSessions) {
      issues.push(
        `${row.criterion.label}: rollup count ${count.passed}/${count.total} does not match evaluated session tally ${tally.passed}/${tally.evaluatedSessions}.`
      );
    }
  }

  return issues;
}

export function renderPlaytestReadinessAudit(audit: PlaytestReadinessAudit): string {
  const localReady = audit.localFiles.every((file) => file.ok);
  const lines = [
    "Tokenization Training playtest readiness audit",
    `Decision: ${audit.ready ? "broader playtest ready" : "collect user evidence before broader playtest"}`,
    "",
    `Local evidence package: ${localReady ? "PASS" : "FAIL"}`,
    `Session evidence gate: ${audit.sessionEvaluation?.ready ? "PASS" : "FAIL"}`,
    `Rollup evidence gate: ${audit.rollupEvaluation?.ready ? "PASS" : "FAIL"}`,
    ""
  ];

  lines.push("Local package checks:");
  for (const file of audit.localFiles) {
    lines.push(`- ${file.ok ? "PASS" : "FAIL"} ${file.path}${file.issue ? ` (${file.issue})` : ""}`);
  }

  if (audit.sessionEvaluation) {
    lines.push("", renderPlaytestGateEvaluation(audit.sessionEvaluation));
  } else {
    lines.push(
      "",
      "Tokenization Training playtest gate",
      "Session files: 0/5",
      "Completed notes: 0/5",
      "Completed real mobile/touch notes: 0",
      "Decision: missing session files"
    );
  }

  if (audit.rollupEvaluation) {
    lines.push("", renderPlaytestRollupEvaluation(audit.rollupEvaluation));
  } else {
    lines.push(
      "",
      "Tokenization Training playtest rollup",
      `File: ${audit.rollupFile}`,
      "Decision: missing completed rollup"
    );
  }

  if (!audit.ready) {
    lines.push(
      "",
      "Next required actions:",
      "- Run `npm run playtest:preflight` before any tester session.",
      "- Confirm the pre-session local package gate passes with `npm run playtest:audit:local`.",
      "- Run five sessions using `docs/user_playtest_protocol.md` and `docs/playtest_facilitator_card.md`.",
      "- Include at least one real phone/tablet touch session with Network: LAN, a non-localhost Launch URL, and concrete readability evidence.",
      `- Fill and evaluate: npm run playtest:evaluate -- ${audit.sessionFiles.join(" ")}`,
      "- Create the completed rollup with `npm run playtest:rollup`, fill it, then run `npm run playtest:evaluate-rollup -- docs/playtest_rollup_completed.md`.",
      "- Rerun this audit after the session and rollup evaluators pass."
    );
  }

  if (audit.issues.length > 0) {
    lines.push("", "Audit issues:");
    for (const issue of audit.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

export function renderLocalEvidenceAudit(audit: LocalEvidenceAudit): string {
  const lines = [
    "Tokenization Training local evidence audit",
    `Decision: ${audit.ready ? "local package ready for user-session preflight" : "fix local package before user sessions"}`,
    "",
    `Local evidence package: ${audit.ready ? "PASS" : "FAIL"}`,
    "",
    "Local package checks:"
  ];

  for (const file of audit.localFiles) {
    lines.push(`- ${file.ok ? "PASS" : "FAIL"} ${file.path}${file.issue ? ` (${file.issue})` : ""}`);
  }

  if (audit.issues.length > 0) {
    lines.push("", "Local audit issues:");
    for (const issue of audit.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join("\n");
}

export function checkReadinessFileRequirement(
  rootDir: string,
  requirement: ReadinessFileRequirement
): ReadinessFileResult {
  const absolutePath = resolve(rootDir, requirement.path);
  if (!existsSync(absolutePath)) {
    return {
      ...requirement,
      ok: false,
      issue: `missing required readiness artifact: ${requirement.path}`
    };
  }

  if (requirement.minBytes !== undefined) {
    const size = statSync(absolutePath).size;
    if (size < requirement.minBytes) {
      return {
        ...requirement,
        ok: false,
        issue: `${requirement.path} is ${size} bytes, below required ${requirement.minBytes}`
      };
    }
  }

  if (requirement.path.toLowerCase().endsWith(".png")) {
    const validation = validatePngBuffer(readFileSync(absolutePath));
    if (!validation.ok) {
      return {
        ...requirement,
        ok: false,
        issue: `${requirement.path} is not a complete readable PNG: ${validation.issue ?? "invalid PNG"}`
      };
    }

    if (
      requirement.pngDimensions &&
      (validation.width !== requirement.pngDimensions.width || validation.height !== requirement.pngDimensions.height)
    ) {
      return {
        ...requirement,
        ok: false,
        issue: `${requirement.path} is ${validation.width}x${validation.height}, expected ${requirement.pngDimensions.width}x${requirement.pngDimensions.height}`
      };
    }
  }

  return {
    ...requirement,
    ok: true
  };
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CRC32_POLYNOMIAL = 0xedb88320;
const CRC32_TABLE = buildCrc32Table();

export function validatePngBuffer(buffer: Buffer): PngValidationResult {
  if (buffer.length < PNG_SIGNATURE.length) {
    return { ok: false, issue: "file is shorter than the PNG signature" };
  }

  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return { ok: false, issue: "missing PNG signature" };
  }

  let offset = PNG_SIGNATURE.length;
  let seenIhdr = false;
  let seenIend = false;
  let width = 0;
  let height = 0;

  while (offset < buffer.length) {
    if (buffer.length - offset < 8) {
      return { ok: false, issue: `truncated chunk header at byte ${offset}` };
    }

    const chunkLength = buffer.readUInt32BE(offset);
    const chunkType = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    if (chunkLength > buffer.length - dataStart) {
      return { ok: false, issue: `${chunkType} chunk data is truncated` };
    }

    const dataEnd = dataStart + chunkLength;
    if (buffer.length - dataEnd < 4) {
      return { ok: false, issue: `${chunkType} chunk CRC is truncated` };
    }

    const chunkEnd = dataEnd + 4;
    const expectedCrc = buffer.readUInt32BE(dataEnd);
    const actualCrc = crc32(buffer.subarray(offset + 4, dataEnd));
    if (actualCrc !== expectedCrc) {
      return { ok: false, issue: `${chunkType} chunk CRC mismatch` };
    }

    if (!seenIhdr && chunkType !== "IHDR") {
      return { ok: false, issue: `first chunk is ${chunkType}, expected IHDR` };
    }

    if (chunkType === "IHDR") {
      if (seenIhdr) {
        return { ok: false, issue: "duplicate IHDR chunk" };
      }
      if (chunkLength !== 13) {
        return { ok: false, issue: `IHDR chunk is ${chunkLength} bytes, expected 13` };
      }
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      if (width <= 0 || height <= 0) {
        return { ok: false, issue: `invalid PNG dimensions ${width}x${height}` };
      }
      seenIhdr = true;
    }

    if (chunkType === "IEND") {
      if (chunkLength !== 0) {
        return { ok: false, issue: `IEND chunk is ${chunkLength} bytes, expected 0` };
      }
      seenIend = true;
      break;
    }

    offset = chunkEnd;
  }

  if (!seenIhdr) {
    return { ok: false, issue: "missing IHDR chunk" };
  }
  if (!seenIend) {
    return { ok: false, issue: "missing IEND chunk" };
  }

  return { ok: true, width, height };
}

function buildCrc32Table(): number[] {
  const table: number[] = [];
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? (CRC32_POLYNOMIAL ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function evaluateSessionFiles(
  rootDir: string,
  sessionFiles: string[],
  issues: string[]
): PlaytestGateEvaluation | undefined {
  const missing = sessionFiles.filter((file) => !existsSync(resolve(rootDir, file)));
  if (missing.length > 0) {
    for (const file of missing) {
      issues.push(`missing completed session note: ${file}`);
    }
    return undefined;
  }

  const sessions = sessionFiles.map((file) =>
    parsePlaytestSessionNote(readFileSync(resolve(rootDir, file), "utf8"), file)
  );
  const evaluation = evaluatePlaytestSessions(sessions);
  if (!evaluation.ready) {
    issues.push("session evidence gate failed; run `npm run playtest:evaluate -- <five completed notes>` for details");
  }

  return evaluation;
}

function evaluateRollupFile(
  rootDir: string,
  rollupFile: string,
  issues: string[]
): PlaytestRollupEvaluation | undefined {
  const absolutePath = resolve(rootDir, rollupFile);
  if (!existsSync(absolutePath)) {
    issues.push(`missing completed playtest rollup: ${rollupFile}`);
    return undefined;
  }

  const evaluation = evaluatePlaytestRollup(readFileSync(absolutePath, "utf8"), rollupFile);
  if (!evaluation.ready) {
    issues.push("rollup evidence gate failed; run `npm run playtest:evaluate-rollup -- <completed rollup>` for details");
  }

  return evaluation;
}

function copiedSummaryLine(summary: string, label: string): string | undefined {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapedLabel}:\\s*(.+)$`, "im").exec(summary)?.[1]?.trim();
}

function parsedRollupCount(value: string): { passed: number; total: number } | undefined {
  const match = /(\d+)\s*(?:\/|of)\s*(\d+)/i.exec(value);
  if (!match) {
    return undefined;
  }

  return {
    passed: Number.parseInt(match[1], 10),
    total: Number.parseInt(match[2], 10)
  };
}

function parseAuditArgs(args: string[]): PlaytestReadinessOptions & { help: boolean; localOnly: boolean } {
  const sessionFiles: string[] = [];
  let rollupFile = defaultRollupFile;
  let help = false;
  let localOnly = false;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--help" || value === "-h") {
      help = true;
      continue;
    }

    if (value === "--local") {
      localOnly = true;
      continue;
    }

    if (value === "--rollup" && args[index + 1]) {
      rollupFile = args[index + 1];
      index += 1;
      continue;
    }

    if (value.startsWith("--rollup=")) {
      rollupFile = value.slice("--rollup=".length);
      continue;
    }

    if (value === "--sessions") {
      continue;
    }

    sessionFiles.push(value);
  }

  return {
    help,
    localOnly,
    rollupFile,
    sessionFiles: sessionFiles.length > 0 ? sessionFiles : defaultSessionFiles
  };
}

function usage(): string {
  return [
    "Usage:",
    "  npm run playtest:audit",
    "  npm run playtest:audit:local",
    "  npm run playtest:audit -- --local",
    "  npm run playtest:audit -- docs/playtests/session-1.md ... docs/playtests/session-5.md --rollup docs/playtest_rollup_completed.md",
    "",
    "`--local` checks only the local reading, principle, protocol, and browser-QA package for pre-session use.",
    "The full audit passes only when local artifacts exist, five completed session notes pass, and the completed rollup passes."
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseAuditArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    process.exitCode = 0;
  } else if (options.localOnly) {
    const audit = auditLocalEvidencePackage(options.rootDir);
    console.log(renderLocalEvidenceAudit(audit));
    process.exitCode = audit.ready ? 0 : 1;
  } else {
    const audit = auditPlaytestReadiness(options);
    console.log(renderPlaytestReadinessAudit(audit));
    process.exitCode = audit.ready ? 0 : 1;
  }
}
