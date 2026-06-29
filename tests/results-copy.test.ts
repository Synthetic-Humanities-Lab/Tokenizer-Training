import { describe, expect, it } from "vitest";
import { copySummaryButtonLabel, type ResultsCopyState } from "../src/game/systems/ResultsCopySystem";

describe("copySummaryButtonLabel", () => {
  it.each([
    ["idle", "Copy Summary"],
    ["copied", "Summary Copied"],
    ["download", "Save Summary"],
    ["saved", "Summary Saved"],
    ["unavailable", "Use Ledger Text"]
  ] satisfies Array<[ResultsCopyState, string]>)("maps %s to %s", (state, label) => {
    expect(copySummaryButtonLabel(state)).toBe(label);
  });

  it("keeps result-screen labels compact enough for the fixed button", () => {
    const labels = [
      copySummaryButtonLabel("idle"),
      copySummaryButtonLabel("copied"),
      copySummaryButtonLabel("unavailable")
    ];

    expect(labels.every((label) => label.length <= 16)).toBe(true);
  });
});
