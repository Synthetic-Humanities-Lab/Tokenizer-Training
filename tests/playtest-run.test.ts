import { describe, expect, it } from "vitest";
import { playtestRunIdFromDate, playtestRunSummaryLine } from "../src/game/systems/PlaytestRunSystem";

describe("PlaytestRunSystem", () => {
  it("formats a stable UTC run id from a date", () => {
    expect(playtestRunIdFromDate(new Date("2026-06-06T17:25:31.900Z"))).toBe("tt-20260606-172531z");
  });

  it("uses an explicit fallback for invalid dates", () => {
    expect(playtestRunIdFromDate(new Date("not a date"))).toBe("tt-unknown-time");
  });

  it("formats copied-summary run evidence without inventing it", () => {
    expect(playtestRunSummaryLine(undefined)).toBe("Run ID: not captured");
    expect(playtestRunSummaryLine("   ")).toBe("Run ID: not captured");
    expect(playtestRunSummaryLine(" tt-20260606-172531z ")).toBe("Run ID: tt-20260606-172531z");
  });
});
