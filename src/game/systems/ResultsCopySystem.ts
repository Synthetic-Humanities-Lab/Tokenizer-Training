export type ResultsCopyState = "idle" | "copied" | "download" | "saved" | "unavailable";

export function copySummaryButtonLabel(state: ResultsCopyState): string {
  if (state === "copied") {
    return "Summary Copied";
  }
  if (state === "download") {
    return "Save Summary";
  }
  if (state === "saved") {
    return "Summary Saved";
  }
  if (state === "unavailable") {
    return "Use Ledger Text";
  }
  return "Copy Summary";
}
