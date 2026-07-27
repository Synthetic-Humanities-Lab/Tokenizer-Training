import { describe, expect, it } from "vitest";
import type { GameQaElement, GameQaRect } from "../src/game/systems/GameQaSystem";
import { computeResultsLayout } from "../src/game/systems/ResultsLayoutSystem";
import { resultsSceneQaSnapshot } from "../src/game/systems/ResultsSceneQaSystem";

const ledgerText = [
  "Run 20260606-172531z / 7r / handoff / touch",
  "Cuts: OK/M/F 5/3/2 (63%)",
  "Verified: +21 TC",
  "Rework: -49 TC",
  "Net Credits: -28 TC",
  "Credits Remaining: 12 TC",
  "Yield Efficiency: 0.43x",
  "Rank: Junior Boundary Clerk",
  "Best saved: 11 rounds / BPE Adjacent"
].join("\n");

const metricRows = [
  { id: "run", label: "RUN", value: "7 rounds" },
  { id: "cuts", label: "CUTS", value: "OK 5 / M 3 / F 2" },
  { id: "accuracy", label: "ACCURACY", value: "63%" },
  { id: "credits", label: "CREDITS", value: "12 TC" },
  { id: "rank", label: "RANK", value: "Junior Boundary Clerk" }
] as const;

const budgetMetricRows = [
  { id: "run", label: "RUN", value: "12 rounds" },
  { id: "cuts", label: "CUTS", value: "OK 5 / M 3 / F 2" },
  { id: "accuracy", label: "ACCURACY", value: "63%" },
  { id: "rank", label: "RANK", value: "BPE Adjacent" }
] as const;

const playtestSummaryText = [
  "Tokenizer Training playtest summary",
  "Run ID: mtt-20260606-172531z",
  "Outcome: quit",
  "Start: handoff screen",
  "Input: touch",
  "Input evidence: browser pointer reported touch; verify device metadata",
  "Rounds: 7",
  "Accuracy: 63%",
  "Cuts: OK 5 / Missed 3 / False 2",
  "Round trace:",
  "1. simple_001 / simple_prose / tier 1 / tokens 6 / OK 2 / Missed 1 / False 0",
  "2. dense_001 / url / tier 3 / tokens 4 / OK 3 / Missed 0 / False 2",
  "Input feel trace:",
  "Input feel fields: first-cut latency, resolve timing after first/last cut, cut batch ownership, release-sample/correction ownership, no-cut acknowledgements, touch-loupe clearance.",
  "1. samples 5 / responses 2 / first 32ms / resolve-first 420ms / resolve-last 180ms / commit 1 / batch 1 / release-latched 1 / last-source release / adjusted 0 / gesture-samples 5 / owned-cuts 2 / no-cut 0 / near 0 / off 0 / loupe 4 / ready 3 / low-clear 0 / min-clear 42px",
  "Verified: +21 TC",
  "Rework: -49 TC",
  "Net Credits: -28 TC",
  "Credits Remaining: 12 TC",
  "Yield Efficiency: 0.43x",
  "Rank: Junior Boundary Clerk",
  "Best saved: 11 rounds / BPE Adjacent"
].join("\n");

function element(elements: GameQaElement[], id: string): GameQaElement {
  const match = elements.find((candidate) => candidate.id === id);
  if (!match) {
    throw new Error(`Missing QA element ${id}.`);
  }

  return match;
}

function edges(rect: GameQaRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function withinViewport(rect: GameQaRect, width: number, height: number): boolean {
  const rectEdges = edges(rect);
  return (
    rectEdges.left >= 0 &&
    rectEdges.right <= width &&
    rectEdges.top >= 0 &&
    rectEdges.bottom <= height
  );
}

describe("resultsSceneQaSnapshot", () => {
  it("exposes portrait result evidence and button labels for browser QA", () => {
    const width = 390;
    const height = 844;
    const snapshot = resultsSceneQaSnapshot({
      width,
      height,
      layout: computeResultsLayout(width, height),
      outcome: "quit",
      rounds: 7,
      runId: "mtt-20260606-172531z",
      startSource: "handoff-screen",
      inputModality: "touch",
      rank: "Junior Boundary Clerk",
      titleText: "Training Suspended",
      summaryText: "Session closed by operator request. WienerWorks preserved the usable portion and most of the causes. Review the Token Log to learn which boundaries you missed before resuming.",
      ledgerText,
      metricRows: [...metricRows],
      playtestSummaryText,
      reviewButtonText: "Review Token Log"
    });

    expect(snapshot.scene).toBe("ResultsScene");
    expect(snapshot.compact).toBe(true);
    expect(snapshot.state).toMatchObject({
      outcome: "quit",
      rounds: 7,
      runId: "mtt-20260606-172531z",
      startSource: "handoff-screen",
      inputModality: "touch",
      rank: "Junior Boundary Clerk"
    });
    expect(element(snapshot.elements, "metric-run").text).toBe("RUN: 7 rounds");
    expect(element(snapshot.elements, "metric-cuts").text).toBe("CUTS: OK 5 / M 3 / F 2");
    expect(element(snapshot.elements, "metric-credits").text).toBe("CREDITS: 12 TC");
    expect(element(snapshot.elements, "playtestSummaryPayload").text).toContain("Run ID: mtt-20260606-172531z");
    expect(element(snapshot.elements, "playtestSummaryPayload").text).toContain("Start: handoff screen");
    expect(element(snapshot.elements, "playtestSummaryPayload").text).toContain("Input: touch");
    expect(element(snapshot.elements, "playtestSummaryPayload").text).toContain("Input evidence: browser pointer reported touch");
    expect(element(snapshot.elements, "playtestSummaryPayload").text).toContain("Cuts: OK 5 / Missed 3 / False 2");
    expect(element(snapshot.elements, "playtestSummaryPayload").text).toContain("Round trace:");
    expect(element(snapshot.elements, "playtestSummaryPayload").text).toContain("simple_001 / simple_prose / tier 1");
    expect(element(snapshot.elements, "playtestSummaryPayload").text).toContain("Input feel fields: first-cut latency");
    expect(element(snapshot.elements, "playtestSummaryPayload").text).toContain("Net Credits: -28 TC");
    expect(element(snapshot.elements, "reviewButton").text).toBe("Review Token Log");
    expect(element(snapshot.elements, "againButton").text).toBe("Run Training Again");
    for (const entry of snapshot.elements) {
      if (entry.rect) {
        expect(withinViewport(entry.rect, width, height), entry.id).toBe(true);
      }
    }
  });

  it("mirrors desktop result layout and copied-state button text", () => {
    const width = 1280;
    const height = 720;
    const snapshot = resultsSceneQaSnapshot({
      width,
      height,
      layout: computeResultsLayout(width, height, undefined, { metricCount: budgetMetricRows.length }),
      outcome: "budget",
      rounds: 12,
      rank: "BPE Adjacent",
      titleText: "Token Credits Depleted",
      summaryText: "Your account no longer contains enough Token Credits to correct your output. Training access revoked. Review the Token Log to learn from both error types before retraining.",
      ledgerText,
      metricRows: [...budgetMetricRows],
      playtestSummaryText,
      reviewButtonText: "Review Token Log"
    });

    expect(snapshot.compact).toBe(false);
    expect(snapshot.state).toMatchObject({
      outcome: "budget",
      rounds: 12,
      runId: null,
      startSource: null,
      inputModality: null
    });
    expect(element(snapshot.elements, "title").fontSize).toBe(42);
    expect(snapshot.elements.some((entry) => entry.id === "chromeText")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "metric-verified")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "metric-rework")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "metric-credits")).toBe(false);
    expect(element(snapshot.elements, "metric-rank").text).toBe("RANK: BPE Adjacent");
    expect(element(snapshot.elements, "reviewButton").text).toBe("Review Token Log");
    for (const entry of snapshot.elements) {
      if (entry.rect) {
        expect(withinViewport(entry.rect, width, height), entry.id).toBe(true);
      }
    }
  });
});
