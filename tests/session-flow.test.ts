import { describe, expect, it } from "vitest";
import linesJson from "../src/game/data/overseer_lines.json";
import { SessionFlowSystem } from "../src/game/systems/SessionFlowSystem";
import { TutorialSystem } from "../src/game/systems/TutorialSystem";

describe("SessionFlowSystem", () => {
  it("does not count an abandoned active round as completed", () => {
    const system = new SessionFlowSystem();

    expect(system.completedRounds({
      outcome: "quit",
      currentRound: 4,
      resolving: false
    })).toBe(3);
  });

  it("counts a resolving round because it has already produced feedback", () => {
    const system = new SessionFlowSystem();

    expect(system.completedRounds({
      outcome: "quit",
      currentRound: 4,
      resolving: true
    })).toBe(4);
  });

  it("keeps budget failure distinct from voluntary quit", () => {
    const system = new SessionFlowSystem();

    expect(system.resultCopy("budget").title).toBe("Budget Exhausted");
    expect(system.resultCopy("quit").title).toBe("Training Suspended");
    expect(system.resultCopy("quit").summary).toBe(
      "Session closed by operator request. WienerWorks preserved the usable portion and most of the causes."
    );
    expect(system.resultCopy("budget").summary).toBe(
      "Your balance reached zero. Finance has closed the segmentation window and archived the loss. Wiener thanks you for demonstrating why automation was once attractive."
    );
  });

  it("does not save an immediate voluntary quit as a best run", () => {
    const system = new SessionFlowSystem();

    expect(system.shouldSaveResult({ outcome: "quit", rounds: 0 })).toBe(false);
    expect(system.shouldSaveResult({ outcome: "quit", rounds: 1 })).toBe(true);
    expect(system.shouldSaveResult({ outcome: "budget", rounds: 0 })).toBe(true);
  });

  it("warns during active endless rounds when balance is low but not exhausted", () => {
    const system = new SessionFlowSystem();

    expect(system.activeTrainingLine(40)).toBe(linesJson.categories["play.round_start.neutral"].lines[18]);
    expect(system.activeTrainingLine(10)).toBe(linesJson.categories["play.round_start.low_balance"].lines[10]);
    expect(system.activeTrainingLine(10)).not.toContain("Budget Exhausted");
  });

  it("formats termination accounting with pay, cost, balance, rank, and best record", () => {
    const text = new SessionFlowSystem().resultLedgerText({
      rounds: 7,
      balance: 12.34,
      accuracy: 0.625,
      totalCorrectCuts: 5,
      totalMissedCuts: 3,
      totalFalseCuts: 2,
      totalPay: 21.5,
      totalCost: 49.75,
      costEfficiency: 0.432,
      rank: "Junior Boundary Clerk",
      bestRounds: 11,
      bestRank: "BPE Adjacent"
    });

    expect(text).toContain("Rounds: 7");
    expect(text).toContain("Cuts: OK/M/F 5/3/2 (63%)");
    expect(text).toContain("Pay Earned: $21.50");
    expect(text).toContain("Company Cost: $49.75");
    expect(text).toContain("Net: -$28.25");
    expect(text).toContain("Balance Recorded: $12.34");
    expect(text).toContain("Efficiency: 0.43x");
    expect(text).toContain("Rank: Junior Boundary Clerk");
    expect(text).toContain("Best saved: 11 rounds / BPE Adjacent");
  });

  it("formats compact trace metadata for visible ledger fallback", () => {
    const text = new SessionFlowSystem().resultLedgerText({
      runId: "mtt-20260606-172531z",
      startSource: "handoff-screen",
      inputModality: "touch",
      rounds: 7,
      balance: 12.34,
      accuracy: 0.625,
      totalCorrectCuts: 5,
      totalMissedCuts: 3,
      totalFalseCuts: 2,
      totalPay: 21.5,
      totalCost: 49.75,
      costEfficiency: 0.432,
      rank: "Junior Boundary Clerk",
      bestRounds: 11,
      bestRank: "BPE Adjacent"
    });

    expect(text.split("\n")[0]).toBe("Run 20260606-172531z / 7r / handoff / touch");
    expect(text.split("\n")[0].length).toBeLessThanOrEqual(48);
  });

  it("formats a compact playtest summary for reporting results", () => {
    const text = new SessionFlowSystem().playtestSummaryText({
      outcome: "quit",
      runId: "mtt-20260606-172531z",
      startSource: "handoff-screen",
      inputModality: "touch",
      rounds: 7,
      balance: 12.34,
      accuracy: 0.625,
      totalCorrectCuts: 5,
      totalMissedCuts: 3,
      totalFalseCuts: 2,
      totalPay: 21.5,
      totalCost: 49.75,
      costEfficiency: 0.432,
      rank: "Junior Boundary Clerk",
      bestRounds: 11,
      bestRank: "BPE Adjacent",
      roundTraces: [
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
          fixtureId: "dense_001",
          category: "url",
          tier: 3,
          tokenCount: 4,
          correctCuts: 3,
          missedCuts: 0,
          falseCuts: 2,
          inputFeel: {
            sampleCount: 8,
            cutCount: 5,
            firstCutLatencyMs: 44,
            resolveAfterFirstCutMs: 760,
            resolveAfterLastCutMs: 260,
            lastCutBatchCount: 3,
            lastCutWasReleaseSample: false,
            lastCutWasCorrection: true,
            releaseSampleCutCount: 0,
            correctionCutCount: 1,
            lastGestureSampleCount: 8,
            lastGestureCutCount: 5,
            resolveCommitCount: 1,
            noCutAcknowledgementCount: 2,
            nearSlotNoCutAcknowledgementCount: 1,
            noSlotAcknowledgementCount: 1,
            touchAimLoupeSampleCount: 5,
            touchAimLoupeSnapReadyCount: 2,
            touchAimLoupeUnsafeClearanceCount: 1,
            touchAimLoupeMinClearancePx: 27
          }
        }
      ]
    });

    expect(text).toContain("Tokenizer Training playtest summary");
    expect(text).toContain("Run ID: mtt-20260606-172531z");
    expect(text).toContain("Outcome: quit");
    expect(text).toContain("Start: handoff screen");
    expect(text).toContain("Input: touch");
    expect(text).toContain("Input evidence: browser pointer reported touch; verify device metadata");
    expect(text).toContain("Rounds: 7");
    expect(text).toContain("Accuracy: 63%");
    expect(text).toContain("Cuts: OK 5 / Missed 3 / False 2");
    expect(text).toContain("Round trace:");
    expect(text).toContain("1. simple_001 / simple_prose / tier 1 / tokens 6 / OK 2 / Missed 1 / False 0");
    expect(text).toContain("2. dense_001 / url / tier 3 / tokens 4 / OK 3 / Missed 0 / False 2");
    expect(text).toContain("Input feel trace:");
    expect(text).toContain("1. samples 5 / responses 2 / first 32ms / resolve-first 420ms / resolve-last 180ms / commit 1 / batch 1 / release-latched 1 / last-source release / adjusted 0 / gesture-samples 5 / owned-cuts 2 / no-cut 0 / near 0 / off 0 / loupe 4 / ready 3 / low-clear 0 / min-clear 42px");
    expect(text).toContain("2. samples 8 / responses 5 / first 44ms / resolve-first 760ms / resolve-last 260ms / commit 1 / batch 3 / release-latched 0 / last-source adjust / adjusted 1 / gesture-samples 8 / owned-cuts 5 / no-cut 2 / near 1 / off 1 / loupe 5 / ready 2 / low-clear 1 / min-clear 27px");
    expect(text).toContain("Pay: $21.50");
    expect(text).toContain("Cost: $49.75");
    expect(text).toContain("Net: -$28.25");
    expect(text).toContain("Balance: $12.34");
    expect(text).toContain("Efficiency: 0.43x");
    expect(text).toContain("Rank: Junior Boundary Clerk");
    expect(text).toContain("Best saved: 11 rounds / BPE Adjacent");
  });

  it("formats positive total net with an explicit plus sign", () => {
    const text = new SessionFlowSystem().playtestSummaryText({
      outcome: "budget",
      rounds: 3,
      balance: 46.25,
      accuracy: 1,
      totalCorrectCuts: 9,
      totalMissedCuts: 0,
      totalFalseCuts: 0,
      totalPay: 14.5,
      totalCost: 8.25,
      costEfficiency: 1.76,
      rank: "Temporary Sequence Specialist",
      bestRounds: 3,
      bestRank: "Temporary Sequence Specialist"
    });

    expect(text).toContain("Pay: $14.50");
    expect(text).toContain("Cost: $8.25");
    expect(text).toContain("Net: +$6.25");
  });

  it("does not invent cut-count evidence when a caller omits it", () => {
    const system = new SessionFlowSystem();
    const ledger = system.resultLedgerText({
      rounds: 2,
      balance: 4,
      accuracy: 0.5,
      totalPay: 6,
      totalCost: 8,
      costEfficiency: 0.75,
      rank: "Regex Intern",
      bestRounds: 0,
      bestRank: "Regex Intern"
    });
    const summary = system.playtestSummaryText({
      outcome: "quit",
      rounds: 2,
      balance: 4,
      accuracy: 0.5,
      totalPay: 6,
      totalCost: 8,
      costEfficiency: 0.75,
      rank: "Regex Intern",
      bestRounds: 0,
      bestRank: "Regex Intern"
    });

    expect(summary).toContain("Run ID: not captured");
    expect(summary).toContain("Input: not captured");
    expect(summary).toContain("Input evidence: no in-game pointer event captured");
    expect(summary).toContain("Start: not captured");
    expect(ledger).toContain("Accuracy: 50%");
    expect(ledger).not.toContain("OK/M/F 0/0/0");
    expect(summary).toContain("Cuts: not captured");
    expect(summary).toContain("Round trace: not captured");
    expect(summary).not.toContain("Input feel trace:");
  });

  it("shows an endless-training handoff after the final tutorial resolution", () => {
    const system = new SessionFlowSystem();
    const tutorialRoundCount = new TutorialSystem().count();

    expect(system.afterResolution({
      tutorialMode: true,
      completedRound: tutorialRoundCount - 1,
      tutorialRoundCount,
      balance: 20
    })).toEqual({ type: "nextRound" });
    expect(system.afterResolution({
      tutorialMode: true,
      completedRound: tutorialRoundCount,
      tutorialRoundCount,
      balance: 20
    })).toEqual({ type: "tutorialComplete" });
  });

  it("does not budget-fail the tutorial before all examples are shown", () => {
    const system = new SessionFlowSystem();
    const tutorialRoundCount = new TutorialSystem().count();

    expect(system.afterResolution({
      tutorialMode: true,
      completedRound: tutorialRoundCount - 1,
      tutorialRoundCount,
      balance: -8.63
    })).toEqual({ type: "nextRound" });
    expect(system.afterResolution({
      tutorialMode: true,
      completedRound: tutorialRoundCount,
      tutorialRoundCount,
      balance: -13.86
    })).toEqual({ type: "tutorialComplete" });
  });

  it("sends endless budget exhaustion to results without using quit copy", () => {
    const system = new SessionFlowSystem();

    expect(system.afterResolution({
      tutorialMode: false,
      completedRound: 7,
      tutorialRoundCount: new TutorialSystem().count(),
      balance: 0
    })).toEqual({ type: "results", outcome: "budget" });
  });

  it("keeps tutorial exit and endless exit semantically distinct", () => {
    const system = new SessionFlowSystem();

    expect(system.exitTransition({
      tutorialMode: true,
      balance: -20
    })).toEqual({ type: "menu" });
    expect(system.exitTransition({
      tutorialMode: false,
      balance: 12
    })).toEqual({ type: "results", outcome: "quit" });
  });

  it("does not let exit relabel an already exhausted endless round as voluntary quit", () => {
    const system = new SessionFlowSystem();

    expect(system.exitTransition({
      tutorialMode: false,
      balance: 0
    })).toEqual({ type: "results", outcome: "budget" });
  });

  it("preserves the new-player agency path from tutorial completion to voluntary endless quit", () => {
    const system = new SessionFlowSystem();
    const tutorialRoundCount = new TutorialSystem().count();

    for (let completedRound = 1; completedRound < tutorialRoundCount; completedRound += 1) {
      expect(system.afterResolution({
        tutorialMode: true,
        completedRound,
        tutorialRoundCount,
        balance: 40
      })).toEqual({ type: "nextRound" });
    }

    expect(system.afterResolution({
      tutorialMode: true,
      completedRound: tutorialRoundCount,
      tutorialRoundCount,
      balance: 40
    })).toEqual({ type: "tutorialComplete" });
    expect(system.exitTransition({
      tutorialMode: false,
      balance: 18
    })).toEqual({ type: "results", outcome: "quit" });
    expect(system.completedRounds({
      outcome: "quit",
      currentRound: 1,
      resolving: false
    })).toBe(0);
    expect(system.resultCopy("quit").title).toBe("Training Suspended");
  });
});
