import { describe, expect, it } from "vitest";
import { displayTokenSegment, tokenSplitLine } from "../src/game/systems/TokenDisplaySystem";

describe("TokenDisplaySystem", () => {
  it("renders spaces literally instead of spelling them out", () => {
    expect(displayTokenSegment(" can")).toBe(" can");
    expect(displayTokenSegment(" ")).toBe(" ");
    expect(displayTokenSegment("")).toBe("[empty]");
  });

  it("keeps non-space control characters explicit", () => {
    expect(displayTokenSegment("\tindent")).toBe("[tab]indent");
    expect(displayTokenSegment("line\nbreak")).toBe("line[newline]break");
  });

  it("formats the feedback-card token split without the old evidence-panel labels", () => {
    const line = tokenSplitLine(["I", " can", "'t"]);

    expect(line).toBe("Tokens 3: <I> < can> <'t>");
    expect(line).not.toContain("[space]");
    expect(line).not.toMatch(/actual tokenization/i);
    expect(line).not.toMatch(/cut audit/i);
  });
});
