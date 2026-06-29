import { describe, expect, it } from "vitest";
import type { GameQaElement, GameQaRect } from "../src/game/systems/GameQaSystem";
import { computeResultsLayout } from "../src/game/systems/ResultsLayoutSystem";
import { resultsSceneQaSnapshot } from "../src/game/systems/ResultsSceneQaSystem";

const ledgerText = [
  "Run 20260606-172531z / 7r / handoff / touch",
  "Cuts: OK/M/F 5/3/2 (63%)",
  "Pay Earned: $21.50",
  "Company Cost: $49.75",
  "Net: -$28.25",
  "Balance Recorded: $12.34",
  "Efficiency: 0.43x",
  "Rank: Junior Boundary Clerk",
  "Best saved: 11 rounds / BPE Adjacent"
].join("\n");

const metricRows = [
  { id: "run", label: "RUN", value: "7 rounds" },
  { id: "cuts", label: "CUTS", value: "OK 5 / M 3 / F 2" },
  { id: "accuracy", label: "ACCURACY", value: "63%" },
  { id: "pay", label: "PAY", value: "$21.50" },
  { id: "cost", label: "COST", value: "$49.75" },
  { id: "net", label: "NET", value: "-$28.25" },
  { id: "balance", label: "BALANCE", value: "$12.34" },
  { id: "efficiency", label: "EFFICIENCY", value: "0.43x" },
  { id: "rank", label: "RANK", value: "Junior Boundary Clerk" }
] as const;

const copySummaryText = [
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
  "Pay: $21.50",
  "Cost: $49.75",
  "Net: -$28.25",
  "Balance: $12.34",
  "Efficiency: 0.43x",
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
      summaryText: "Session closed by operator request. WienerWorks preserved the usable portion and most of the causes.",
      ledgerText,
      metricRows: [...metricRows],
      copySummaryText,
      copyButtonText: "Copy Summary"
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
    expect(element(snapshot.elements, "metric-net").text).toBe("NET: -$28.25");
    expect(element(snapshot.elements, "copySummaryPayload").text).toContain("Run ID: mtt-20260606-172531z");
    expect(element(snapshot.elements, "copySummaryPayload").text).toContain("Start: handoff screen");
    expect(element(snapshot.elements, "copySummaryPayload").text).toContain("Input: touch");
    expect(element(snapshot.elements, "copySummaryPayload").text).toContain("Input evidence: browser pointer reported touch");
    expect(element(snapshot.elements, "copySummaryPayload").text).toContain("Cuts: OK 5 / Missed 3 / False 2");
    expect(element(snapshot.elements, "copySummaryPayload").text).toContain("Round trace:");
    expect(element(snapshot.elements, "copySummaryPayload").text).toContain("simple_001 / simple_prose / tier 1");
    expect(element(snapshot.elements, "copySummaryPayload").text).toContain("Net: -$28.25");
    expect(element(snapshot.elements, "copyButton").text).toBe("Copy Summary");
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
      layout: computeResultsLayout(width, height),
      outcome: "budget",
      rounds: 12,
      rank: "BPE Adjacent",
      titleText: "Budget Exhausted",
      summaryText: "Your balance reached zero. Finance has closed the segmentation window and archived the loss.",
      ledgerText,
      metricRows: [...metricRows],
      copySummaryText,
      copyButtonText: "Summary Copied"
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
    expect(element(snapshot.elements, "metric-pay").text).toBe("PAY: $21.50");
    expect(element(snapshot.elements, "metric-rank").text).toBe("RANK: Junior Boundary Clerk");
    expect(element(snapshot.elements, "copyButton").text).toBe("Summary Copied");
    for (const entry of snapshot.elements) {
      if (entry.rect) {
        expect(withinViewport(entry.rect, width, height), entry.id).toBe(true);
      }
    }
  });
});
