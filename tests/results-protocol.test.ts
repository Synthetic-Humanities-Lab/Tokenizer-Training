import { describe, expect, it } from "vitest";
import {
  createResultsProtocolSeed,
  RESULTS_PROTOCOL_STARTING_CREDITS
} from "../src/game/systems/ResultsProtocolSystem";
import { cutAuditAccuracy } from "../src/game/systems/ScoringSystem";

describe("createResultsProtocolSeed", () => {
  it("creates a mathematically coherent depleted-credit result", () => {
    const seed = createResultsProtocolSeed();
    const traceTotals = seed.roundTraces.reduce(
      (totals, trace) => ({
        correct: totals.correct + trace.correctCuts,
        missed: totals.missed + trace.missedCuts,
        falseCuts: totals.falseCuts + trace.falseCuts
      }),
      { correct: 0, missed: 0, falseCuts: 0 }
    );

    expect(seed).toMatchObject({
      runId: "tt-protocol-qa",
      rounds: 7,
      creditBalance: 0,
      accuracy: 0.5,
      totalCorrectCuts: 5,
      totalMissedCuts: 3,
      totalFalseCuts: 2,
      startSource: "handoff-screen",
      inputModality: "touch",
      totalVerifiedCredits: 18,
      totalReworkCredits: 58,
      outcome: "budget"
    });
    expect(traceTotals).toEqual({ correct: 5, missed: 3, falseCuts: 2 });
    expect(seed.accuracy).toBe(cutAuditAccuracy(
      traceTotals.correct,
      traceTotals.missed,
      traceTotals.falseCuts
    ));
    expect(seed.creditBalance).toBe(
      RESULTS_PROTOCOL_STARTING_CREDITS +
      seed.totalVerifiedCredits -
      seed.totalReworkCredits
    );
  });

  it("preserves the touch-input trace used by protocol QA", () => {
    const seed = createResultsProtocolSeed();

    expect(seed.roundTraces).toHaveLength(3);
    expect(seed.roundTraces[0]?.inputFeel).toMatchObject({
      sampleCount: 5,
      cutCount: 2,
      firstCutLatencyMs: 32,
      touchAimLoupeSampleCount: 4,
      touchAimLoupeSnapReadyCount: 3,
      touchAimLoupeMinClearancePx: 42
    });
  });
});
