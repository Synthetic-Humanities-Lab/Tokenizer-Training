import { describe, expect, it } from "vitest";
import {
  inputModalityEvidenceLine,
  inputModalityFromPointer,
  inputModalitySummaryLine,
  mergeInputModality
} from "../src/game/systems/InputModalitySystem";

describe("InputModalitySystem", () => {
  it("classifies Phaser touch pointers", () => {
    expect(inputModalityFromPointer({ wasTouch: true })).toBe("touch");
    expect(inputModalityFromPointer({ event: { type: "touchstart" } })).toBe("touch");
  });

  it("classifies mouse and pen signals when the browser exposes them", () => {
    expect(inputModalityFromPointer({ wasTouch: false })).toBe("mouse");
    expect(inputModalityFromPointer({ event: { type: "mousedown" } })).toBe("mouse");
    expect(inputModalityFromPointer({ event: { pointerType: "pen" } })).toBe("pen");
  });

  it("merges a session to mixed only after real modality disagreement", () => {
    expect(mergeInputModality("none", "touch")).toBe("touch");
    expect(mergeInputModality("unknown", "mouse")).toBe("mouse");
    expect(mergeInputModality("touch", "unknown")).toBe("touch");
    expect(mergeInputModality("touch", "touch")).toBe("touch");
    expect(mergeInputModality("touch", "mouse")).toBe("mixed");
    expect(mergeInputModality("mixed", "touch")).toBe("mixed");
  });

  it("formats copied-summary input evidence without inventing it", () => {
    expect(inputModalitySummaryLine(undefined)).toBe("Input: not captured");
    expect(inputModalitySummaryLine("none")).toBe("Input: not captured");
    expect(inputModalitySummaryLine("unknown")).toBe("Input: unknown");
    expect(inputModalitySummaryLine("touch")).toBe("Input: touch");
    expect(inputModalitySummaryLine("mixed")).toBe("Input: mixed");
  });

  it("formats copied-summary evidence without treating pointer type as device proof", () => {
    expect(inputModalityEvidenceLine(undefined)).toBe("Input evidence: no in-game pointer event captured");
    expect(inputModalityEvidenceLine("none")).toBe("Input evidence: no in-game pointer event captured");
    expect(inputModalityEvidenceLine("unknown")).toBe("Input evidence: pointer event captured, browser type unknown");
    expect(inputModalityEvidenceLine("mouse")).toBe("Input evidence: browser pointer reported mouse; not mobile-gate evidence");
    expect(inputModalityEvidenceLine("touch")).toBe("Input evidence: browser pointer reported touch; verify device metadata");
    expect(inputModalityEvidenceLine("pen")).toBe("Input evidence: browser pointer reported pen; verify device metadata");
    expect(inputModalityEvidenceLine("mixed")).toBe("Input evidence: browser reported mixed pointer types; verify session context");
  });
});
