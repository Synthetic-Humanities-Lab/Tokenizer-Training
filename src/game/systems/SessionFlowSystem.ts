import { inputModalityEvidenceLine, inputModalitySummaryLine, type PlaytestInputModality } from "./InputModalitySystem";
import { playtestRunSummaryLine } from "./PlaytestRunSystem";
import {
  LEGACY_PLAYTEST_RUN_PREFIX,
  PLAYTEST_RUN_PREFIX,
  PRODUCT_SUMMARY_TITLE
} from "./ProductIdentitySystem";
import { WienerSpeechLineSystem } from "./WienerSpeechLineSystem";
import { sessionStartSummaryLine, type PlaySessionStartSource } from "./SessionStartSystem";

export type SessionOutcome = "budget" | "quit";

export interface CompletedRoundsInput {
  outcome: SessionOutcome;
  currentRound: number;
  resolving: boolean;
}

export interface ResultCopy {
  title: string;
  summary: string;
}

export interface ResultLedgerInput {
  runId?: string;
  rounds: number;
  balance: number;
  accuracy: number;
  totalCorrectCuts?: number;
  totalMissedCuts?: number;
  totalFalseCuts?: number;
  startSource?: PlaySessionStartSource;
  inputModality?: PlaytestInputModality;
  totalPay: number;
  totalCost: number;
  costEfficiency: number;
  rank: string;
  bestRounds: number;
  bestRank: string;
}

export interface SessionRoundTrace {
  round: number;
  fixtureId: string;
  category: string;
  tier: number;
  tokenCount: number;
  correctCuts: number;
  missedCuts: number;
  falseCuts: number;
  inputFeel?: SessionRoundInputFeelTrace;
}

export interface SessionRoundInputFeelTrace {
  sampleCount: number;
  cutCount: number;
  firstCutLatencyMs: number | null;
  resolveAfterFirstCutMs: number | null;
  resolveAfterLastCutMs: number | null;
  lastCutBatchCount: number;
  lastCutWasReleaseSample: boolean;
  lastCutWasCorrection: boolean;
  releaseSampleCutCount: number;
  correctionCutCount: number;
  lastGestureSampleCount: number;
  lastGestureCutCount: number;
  resolveCommitCount: number;
  noCutAcknowledgementCount: number;
  nearSlotNoCutAcknowledgementCount: number;
  noSlotAcknowledgementCount: number;
  touchAimLoupeSampleCount: number;
  touchAimLoupeSnapReadyCount: number;
  touchAimLoupeUnsafeClearanceCount: number;
  touchAimLoupeMinClearancePx: number | null;
}

export interface PlaytestSummaryInput extends ResultLedgerInput {
  outcome: SessionOutcome;
  runId?: string;
  startSource?: PlaySessionStartSource;
  inputModality?: PlaytestInputModality;
  roundTraces?: SessionRoundTrace[];
}

export interface ResultPersistenceInput {
  outcome: SessionOutcome;
  rounds: number;
}

export interface ResolutionTransitionInput {
  tutorialMode: boolean;
  completedRound: number;
  tutorialRoundCount: number;
  balance: number;
}

export interface ExitTransitionInput {
  tutorialMode: boolean;
  balance: number;
}

export type SessionTransition =
  | { type: "menu" }
  | { type: "nextRound" }
  | { type: "tutorialComplete" }
  | { type: "results"; outcome: SessionOutcome };

export class SessionFlowSystem {
  constructor(private readonly wienerSpeechLines = new WienerSpeechLineSystem()) {}

  activeTrainingLine(balance: number): string {
    return this.wienerSpeechLines.pickForRoundStart({ balance }, { seed: Math.floor(balance) });
  }

  shouldSaveResult(input: ResultPersistenceInput): boolean {
    const rounds = Math.max(0, Math.floor(input.rounds));
    return input.outcome === "budget" || rounds > 0;
  }

  completedRounds(input: CompletedRoundsInput): number {
    const currentRound = Math.max(0, Math.floor(input.currentRound));
    if (input.outcome === "quit" && !input.resolving) {
      return Math.max(0, currentRound - 1);
    }

    return currentRound;
  }

  afterResolution(input: ResolutionTransitionInput): SessionTransition {
    if (input.tutorialMode) {
      return input.completedRound >= input.tutorialRoundCount
        ? { type: "tutorialComplete" }
        : { type: "nextRound" };
    }

    if (input.balance <= 0) {
      return { type: "results", outcome: "budget" };
    }

    return { type: "nextRound" };
  }

  exitTransition(input: ExitTransitionInput): SessionTransition {
    if (input.tutorialMode) {
      return { type: "menu" };
    }

    if (input.balance <= 0) {
      return { type: "results", outcome: "budget" };
    }

    return { type: "results", outcome: "quit" };
  }

  resultCopy(outcome: SessionOutcome): ResultCopy {
    if (outcome === "quit") {
      return {
        title: "Training Suspended",
        summary: "Session closed by operator request. WienerWorks preserved the usable portion and most of the causes."
      };
    }

    return {
      title: "Budget Exhausted",
      summary:
        "Your balance reached zero. Finance has closed the segmentation window and archived the loss. Wiener thanks you for demonstrating why automation was once attractive."
    };
  }

  resultLedgerText(input: ResultLedgerInput): string {
    return [
      ledgerTraceLine(input),
      cutLedgerLine(input),
      `Pay Earned: ${money(input.totalPay)}`,
      `Company Cost: ${money(input.totalCost)}`,
      `Net: ${signedMoney(input.totalPay - input.totalCost)}`,
      `Balance Recorded: ${money(Math.max(0, input.balance))}`,
      `Efficiency: ${Math.max(0, input.costEfficiency).toFixed(2)}x`,
      `Rank: ${input.rank}`,
      `Best saved: ${Math.max(0, Math.floor(input.bestRounds))} rounds / ${input.bestRank}`
    ].join("\n");
  }

  compactResultLedgerText(input: ResultLedgerInput): string {
    return [
      compactLedgerTraceLine(input),
      cutLedgerLine(input).replace("Cuts: ", "Cuts "),
      `Pay ${money(input.totalPay)} / Cost ${money(input.totalCost)}`,
      `Net ${signedMoney(input.totalPay - input.totalCost)} / Bal ${money(Math.max(0, input.balance))}`,
      `Eff ${Math.max(0, input.costEfficiency).toFixed(2)}x`,
      `Rank ${input.rank}`,
      `Best ${Math.max(0, Math.floor(input.bestRounds))}r / ${input.bestRank}`
    ].join("\n");
  }

  playtestSummaryText(input: PlaytestSummaryInput): string {
    return [
      PRODUCT_SUMMARY_TITLE,
      playtestRunSummaryLine(input.runId),
      `Outcome: ${input.outcome}`,
      sessionStartSummaryLine(input.startSource),
      inputModalitySummaryLine(input.inputModality),
      inputModalityEvidenceLine(input.inputModality),
      `Rounds: ${Math.max(0, Math.floor(input.rounds))}`,
      `Accuracy: ${Math.round(Math.max(0, Math.min(1, input.accuracy)) * 100)}%`,
      cutSummaryLine(input),
      ...roundTraceLines(input.roundTraces),
      ...inputFeelTraceLines(input.roundTraces),
      `Pay: ${money(input.totalPay)}`,
      `Cost: ${money(input.totalCost)}`,
      `Net: ${signedMoney(input.totalPay - input.totalCost)}`,
      `Balance: ${money(Math.max(0, input.balance))}`,
      `Efficiency: ${Math.max(0, input.costEfficiency).toFixed(2)}x`,
      `Rank: ${input.rank}`,
      `Best saved: ${Math.max(0, Math.floor(input.bestRounds))} rounds / ${input.bestRank}`
    ].join("\n");
  }
}

function roundTraceLines(roundTraces: SessionRoundTrace[] | undefined): string[] {
  if (!roundTraces || roundTraces.length === 0) {
    return ["Round trace: not captured"];
  }

  return [
    "Round trace:",
    ...roundTraces.map((trace) => {
      const round = whole(trace.round);
      const fixtureId = compactTraceToken(trace.fixtureId, "unknown-fixture");
      const category = compactTraceToken(trace.category, "unknown-category");
      const tier = whole(trace.tier);
      const tokenCount = whole(trace.tokenCount);
      return [
        `${round}. ${fixtureId}`,
        category,
        `tier ${tier}`,
        `tokens ${tokenCount}`,
        `OK ${whole(trace.correctCuts)}`,
        `Missed ${whole(trace.missedCuts)}`,
        `False ${whole(trace.falseCuts)}`
      ].join(" / ");
    })
  ];
}

function inputFeelTraceLines(roundTraces: SessionRoundTrace[] | undefined): string[] {
  const traces = roundTraces?.filter((trace) => trace.inputFeel !== undefined) ?? [];
  if (traces.length === 0) {
    return [];
  }

  return [
    "Input feel trace:",
    ...traces.map((trace) => {
      const feel = trace.inputFeel!;
      return [
        `${whole(trace.round)}. samples ${whole(feel.sampleCount)}`,
        `responses ${whole(feel.cutCount)}`,
        `first ${msOrNa(feel.firstCutLatencyMs)}`,
        `resolve-first ${msOrNa(feel.resolveAfterFirstCutMs)}`,
        `resolve-last ${msOrNa(feel.resolveAfterLastCutMs)}`,
        `commit ${whole(feel.resolveCommitCount)}`,
        `batch ${whole(feel.lastCutBatchCount)}`,
        `release-latched ${whole(feel.releaseSampleCutCount)}`,
        `last-source ${lastCutOwnership(feel)}`,
        `adjusted ${whole(feel.correctionCutCount)}`,
        `gesture-samples ${whole(feel.lastGestureSampleCount)}`,
        `owned-cuts ${whole(feel.lastGestureCutCount)}`,
        `no-cut ${whole(feel.noCutAcknowledgementCount)}`,
        `near ${whole(feel.nearSlotNoCutAcknowledgementCount)}`,
        `off ${whole(feel.noSlotAcknowledgementCount)}`,
        `loupe ${whole(feel.touchAimLoupeSampleCount)}`,
        `ready ${whole(feel.touchAimLoupeSnapReadyCount)}`,
        `low-clear ${whole(feel.touchAimLoupeUnsafeClearanceCount)}`,
        `min-clear ${pxOrNa(feel.touchAimLoupeMinClearancePx)}`
      ].join(" / ");
    })
  ];
}

function lastCutOwnership(feel: SessionRoundInputFeelTrace): string {
  if (feel.lastCutWasCorrection) {
    return "adjust";
  }

  if (feel.lastCutWasReleaseSample) {
    return "release";
  }

  return feel.cutCount > 0 ? "direct" : "none";
}

function money(value: number): string {
  return `$${Math.max(0, value).toFixed(2)}`;
}

function signedMoney(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  const sign = amount >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

function ledgerTraceLine(input: ResultLedgerInput): string {
  const rounds = Math.max(0, Math.floor(input.rounds));
  if (!input.runId && !input.startSource && !input.inputModality) {
    return `Rounds: ${rounds}`;
  }

  return `Run ${shortRunId(input.runId)} / ${rounds}r / ${shortStartSource(input.startSource)} / ${shortInput(input.inputModality)}`;
}

function compactLedgerTraceLine(input: ResultLedgerInput): string {
  const rounds = Math.max(0, Math.floor(input.rounds));
  if (!input.runId && !input.startSource && !input.inputModality) {
    return `Rounds ${rounds}`;
  }

  return [
    `Run ${compactRunId(input.runId)}`,
    `${rounds}r`,
    shortStartSource(input.startSource),
    compactShortInput(input.inputModality)
  ].join(" / ");
}

function compactRunId(value: string | undefined): string {
  const compact = shortRunId(value)
    .replace(new RegExp(`^(${PLAYTEST_RUN_PREFIX}|${LEGACY_PLAYTEST_RUN_PREFIX})-`), "")
    .replace(/-qa$/i, "")
    .replace(/^202\d{4,}-/, "");

  return compact || "unknown";
}

function compactShortInput(value: PlaytestInputModality | undefined): string {
  const short = shortInput(value);
  return short === "no-input" ? "none" : short;
}

function cutLedgerLine(input: ResultLedgerInput): string {
  const accuracy = Math.round(Math.max(0, Math.min(1, input.accuracy)) * 100);
  if (!hasCutCounts(input)) {
    return `Accuracy: ${accuracy}%`;
  }

  return `Cuts: OK/M/F ${whole(input.totalCorrectCuts)}/${whole(input.totalMissedCuts)}/${whole(input.totalFalseCuts)} (${accuracy}%)`;
}

function cutSummaryLine(input: ResultLedgerInput): string {
  if (!hasCutCounts(input)) {
    return "Cuts: not captured";
  }

  return `Cuts: OK ${whole(input.totalCorrectCuts)} / Missed ${whole(input.totalMissedCuts)} / False ${whole(input.totalFalseCuts)}`;
}

function hasCutCounts(input: ResultLedgerInput): input is ResultLedgerInput & {
  totalCorrectCuts: number;
  totalMissedCuts: number;
  totalFalseCuts: number;
} {
  return (
    input.totalCorrectCuts !== undefined &&
    input.totalMissedCuts !== undefined &&
    input.totalFalseCuts !== undefined
  );
}

function whole(value: number): number {
  return Math.max(0, Math.floor(value));
}

function msOrNa(value: number | null | undefined): string {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  return `${whole(value ?? 0)}ms`;
}

function pxOrNa(value: number | null | undefined): string {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  return `${whole(value ?? 0)}px`;
}

function compactTraceToken(value: string, fallback: string): string {
  const compact = value.trim().replace(/\s+/g, "-");
  return compact.length > 0 ? compact : fallback;
}

function shortRunId(runId: string | undefined): string {
  const trimmed = runId?.trim();
  if (!trimmed) {
    return "no-id";
  }

  const generatedMatch = new RegExp(`^(?:${PLAYTEST_RUN_PREFIX}|${LEGACY_PLAYTEST_RUN_PREFIX})-(\\d{8}-\\d{6}z)$`).exec(trimmed);
  if (generatedMatch) {
    return generatedMatch[1];
  }

  return trimmed.length > 18 ? trimmed.slice(-18) : trimmed;
}

function shortStartSource(source: PlaySessionStartSource | undefined): string {
  if (source === "handoff-screen") {
    return "handoff";
  }
  if (source === "results-retry") {
    return "retry";
  }

  return source && source !== "unknown" ? source : "unknown";
}

function shortInput(modality: PlaytestInputModality | undefined): string {
  return modality && modality !== "none" ? modality : "no-input";
}
