import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  displayTokenSegment,
  formatTokenIdMappings,
  tokenEvidenceLine,
  tokenSplitLine
} from "../src/game/systems/TokenDisplaySystem";

describe("TokenDisplaySystem", () => {
  it("makes spaces visible without rewriting literal underscores", () => {
    expect(displayTokenSegment(" can")).toBe("␠can");
    expect(displayTokenSegment(" ")).toBe("␠");
    expect(displayTokenSegment("_can do")).toBe("_can␠do");
    expect(displayTokenSegment("")).toBe("[empty]");
  });

  it("keeps non-space control characters explicit", () => {
    expect(displayTokenSegment("\tindent")).toBe("[tab]indent");
    expect(displayTokenSegment("line\nbreak")).toBe("line[newline]break");
  });

  it("formats the feedback-card token split without the old evidence-panel labels", () => {
    const line = tokenSplitLine(["I", " can", "'t"]);

    expect(line).toBe("Tokens 3: <I> <␠can> <'t>");
    expect(line).not.toContain("[space]");
    expect(line).not.toMatch(/actual tokenization/i);
    expect(line).not.toMatch(/cut audit/i);
  });

  it("formats resolved feedback as a compact boundary-separated row", () => {
    expect(tokenEvidenceLine(["the", " cat", " sat"]))
      .toBe("the │ ␠cat │ ␠sat");
  });

  it("checks alignment and qualifies complete mappings as cl100k_base", () => {
    expect(formatTokenIdMappings(["the", " cat"], [1820, 8415]))
      .toBe("cl100k_base IDs: <the>->1820  <␠cat>->8415");
    expect(() => formatTokenIdMappings(["the", " cat"], [1820]))
      .toThrow(/length mismatch/);
    expect(() => formatTokenIdMappings(["the"], [-1]))
      .toThrow(/invalid token ID/);
    expect(() => formatTokenIdMappings(["the"], [1.5]))
      .toThrow(/invalid token ID/);
  });

  it("samples the first space-bearing token and otherwise the first token", () => {
    expect(formatTokenIdMappings(["one", " two"], [1, 2], { sample: true }))
      .toBe("cl100k_base sample ID: <␠two>->2");
    expect(formatTokenIdMappings(["one", "two"], [1, 2], { sample: true }))
      .toBe("cl100k_base sample ID: <one>->1");
  });

  it("keeps numeric evidence out of prediction-facing systems", () => {
    for (const path of [
      "src/game/systems/ActiveCutFeedbackSystem.ts",
      "src/game/systems/CutInputSessionSystem.ts",
      "src/game/systems/SlotHintPolicySystem.ts",
      "src/game/systems/TextSplitAnimationSystem.ts"
    ]) {
      const source = readFileSync(path, "utf8");
      expect(source, path).not.toMatch(/formatTokenIdMappings|token_ids/);
    }
  });
});
