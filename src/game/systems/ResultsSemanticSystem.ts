import type { SemanticSnapshot } from "../semantic/SemanticRuntime";

export const RESULTS_TOKEN_LOG_ACTION_LABEL = "Review Token Log";

export interface ResultsSemanticMetricRow {
  label: string;
  value: string;
}

export interface ResultsSemanticSnapshotInput {
  title: string;
  summary: string;
  metricRows: readonly ResultsSemanticMetricRow[];
  outcomeAnnouncementId?: string;
}

export function resultsSemanticSnapshot(input: ResultsSemanticSnapshotInput): SemanticSnapshot {
  return {
    scene: "results",
    heading: input.title,
    summary: input.summary,
    details: input.metricRows.map((row) => `${row.label}: ${row.value}`),
    actions: [
      { id: "token-log", label: RESULTS_TOKEN_LOG_ACTION_LABEL },
      { id: "retry", label: "Run Training Again" },
      { id: "menu", label: "Return to Menu" }
    ],
    ...(input.outcomeAnnouncementId
      ? {
          announcement: {
            id: input.outcomeAnnouncementId,
            text: `${input.title}\n${input.summary}`,
            politeness: "assertive" as const
          }
        }
      : {})
  };
}
