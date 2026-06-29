import { describe, expect, it } from "vitest";
import { sessionStartSummaryLine } from "../src/game/systems/SessionStartSystem";

describe("sessionStartSummaryLine", () => {
  it("formats copied-summary session-start evidence", () => {
    expect(sessionStartSummaryLine(undefined)).toBe("Start: not captured");
    expect(sessionStartSummaryLine("unknown")).toBe("Start: not captured");
    expect(sessionStartSummaryLine("menu")).toBe("Start: menu");
    expect(sessionStartSummaryLine("direct")).toBe("Start: direct");
    expect(sessionStartSummaryLine("handoff-screen")).toBe("Start: handoff screen");
    expect(sessionStartSummaryLine("results-retry")).toBe("Start: results retry");
  });
});
