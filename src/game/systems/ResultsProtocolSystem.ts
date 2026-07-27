import type { PlaytestInputModality } from "./InputModalitySystem";
import { cutAuditAccuracy, STARTING_TOKEN_CREDITS } from "./ScoringSystem";
import type { SessionOutcome, SessionRoundTrace } from "./SessionFlowSystem";
import type { PlaySessionStartSource } from "./SessionStartSystem";

export const RESULTS_PROTOCOL_STARTING_CREDITS = STARTING_TOKEN_CREDITS;

export interface ResultsProtocolSeed {
  runId: string;
  rounds: number;
  creditBalance: number;
  accuracy: number;
  totalCorrectCuts: number;
  totalMissedCuts: number;
  totalFalseCuts: number;
  roundTraces: SessionRoundTrace[];
  startSource: PlaySessionStartSource;
  inputModality: PlaytestInputModality;
  totalVerifiedCredits: number;
  totalReworkCredits: number;
  outcome: SessionOutcome;
}

export function createResultsProtocolSeed(): ResultsProtocolSeed {
  const roundTraces = protocolRoundTraces();
  const totals = roundTraces.reduce(
    (aggregate, trace) => ({
      correct: aggregate.correct + trace.correctCuts,
      missed: aggregate.missed + trace.missedCuts,
      falseCuts: aggregate.falseCuts + trace.falseCuts
    }),
    { correct: 0, missed: 0, falseCuts: 0 }
  );
  const totalVerifiedCredits = 18;
  const totalReworkCredits = 58;

  return {
    runId: "tt-protocol-qa",
    rounds: 7,
    creditBalance:
      RESULTS_PROTOCOL_STARTING_CREDITS + totalVerifiedCredits - totalReworkCredits,
    accuracy: cutAuditAccuracy(totals.correct, totals.missed, totals.falseCuts),
    totalCorrectCuts: totals.correct,
    totalMissedCuts: totals.missed,
    totalFalseCuts: totals.falseCuts,
    roundTraces,
    startSource: "handoff-screen",
    inputModality: "touch",
    totalVerifiedCredits,
    totalReworkCredits,
    outcome: "budget"
  };
}

function protocolRoundTraces(): SessionRoundTrace[] {
  return [
    {
      round: 1,
      fixtureId: "simple_001",
      category: "simple_prose",
      tier: 1,
      tokenCount: 6,
      correctCuts: 2,
      missedCuts: 1,
      falseCuts: 0,
      inputFeel: {
        sampleCount: 5,
        cutCount: 2,
        firstCutLatencyMs: 32,
        resolveAfterFirstCutMs: 420,
        resolveAfterLastCutMs: 180,
        lastCutBatchCount: 1,
        lastCutWasReleaseSample: true,
        lastCutWasCorrection: false,
        releaseSampleCutCount: 1,
        correctionCutCount: 0,
        lastGestureSampleCount: 5,
        lastGestureCutCount: 2,
        resolveCommitCount: 1,
        noCutAcknowledgementCount: 0,
        nearSlotNoCutAcknowledgementCount: 0,
        noSlotAcknowledgementCount: 0,
        touchAimLoupeSampleCount: 4,
        touchAimLoupeSnapReadyCount: 3,
        touchAimLoupeUnsafeClearanceCount: 0,
        touchAimLoupeMinClearancePx: 42
      }
    },
    {
      round: 2,
      fixtureId: "punct_001",
      category: "contraction",
      tier: 2,
      tokenCount: 5,
      correctCuts: 2,
      missedCuts: 1,
      falseCuts: 1
    },
    {
      round: 3,
      fixtureId: "dense_001",
      category: "url",
      tier: 3,
      tokenCount: 4,
      correctCuts: 1,
      missedCuts: 1,
      falseCuts: 1
    }
  ];
}
