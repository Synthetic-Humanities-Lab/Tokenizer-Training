export type PlaySessionStartSource = "menu" | "direct" | "handoff-screen" | "results-retry" | "unknown";

export function sessionStartSummaryLine(source: PlaySessionStartSource | undefined): string {
  if (!source || source === "unknown") {
    return "Start: not captured";
  }
  if (source === "handoff-screen") {
    return "Start: handoff screen";
  }
  if (source === "results-retry") {
    return "Start: results retry";
  }

  return `Start: ${source}`;
}
