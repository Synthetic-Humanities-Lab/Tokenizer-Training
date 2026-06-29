import type { GameQaElement, GameQaSnapshot } from "./GameQaSystem";
import type { ResultsLayout } from "./ResultsLayoutSystem";
import type { SessionOutcome } from "./SessionFlowSystem";

export interface ResultsMetricQaRow {
  id: string;
  label: string;
  value: string;
}

export interface ResultsSceneQaSnapshotInput {
  width: number;
  height: number;
  layout: ResultsLayout;
  outcome: SessionOutcome;
  rounds: number;
  runId?: string;
  startSource?: string;
  inputModality?: string;
  rank: string;
  titleText: string;
  summaryText: string;
  ledgerText: string;
  metricRows?: ResultsMetricQaRow[];
  copySummaryText: string;
  copyButtonText: string;
}

export function resultsSceneQaSnapshot(input: ResultsSceneQaSnapshotInput): GameQaSnapshot {
  const elements: GameQaElement[] = [
    { id: "panel", rect: input.layout.panel },
    { id: "chrome", rect: input.layout.chrome },
    {
      id: "chromeText",
      text: input.layout.chromeText.text,
      rect: {
        x: input.layout.chromeText.x + (input.layout.chrome.width - 14) / 2,
        y: input.layout.chromeText.y,
        width: input.layout.chrome.width - 14,
        height: 16
      }
    },
    {
      id: "title",
      text: input.titleText,
      fontSize: input.layout.title.fontSize,
      wordWrapWidth: input.layout.title.wordWrapWidth,
      rect: {
        x: input.layout.title.x,
        y: input.layout.title.y,
        width: input.layout.title.wordWrapWidth,
        height: input.layout.title.fontSize * 1.25
      }
    },
    {
      id: "summary",
      text: input.summaryText,
      fontSize: input.layout.summary.fontSize,
      wordWrapWidth: input.layout.summary.wordWrapWidth,
      rect: {
        x: input.layout.summary.x,
        y: input.layout.summary.y,
        width: input.layout.summary.wordWrapWidth,
        height: 64
      }
    },
    ...(input.metricRows ?? []).map((row, index): GameQaElement => ({
      id: `metric-${row.id}`,
      text: `${row.label}: ${row.value}`,
      rect: input.layout.metricCards[index]
    })),
    {
      id: "copySummaryPayload",
      text: input.copySummaryText
    },
    { id: "copyButton", text: input.copyButtonText, rect: input.layout.copyButton },
    { id: "againButton", text: "Run Training Again", rect: input.layout.againButton },
    { id: "menuButton", text: "Return to Menu", rect: input.layout.menuButton }
  ];

  return {
    scene: "ResultsScene",
    compact: input.layout.compact,
    viewport: {
      width: input.width,
      height: input.height
    },
    state: {
      outcome: input.outcome,
      rounds: Math.max(0, Math.floor(input.rounds)),
      runId: input.runId?.trim() || null,
      startSource: input.startSource?.trim() || null,
      inputModality: input.inputModality?.trim() || null,
      rank: input.rank
    },
    elements
  };
}
