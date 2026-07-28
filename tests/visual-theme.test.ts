import { describe, expect, it } from "vitest";
import { uiTextResolution } from "../src/game/ui/VisualTheme";

describe("VisualTheme text resolution", () => {
  it.each([
    { ratio: undefined, expected: 1 },
    { ratio: Number.NaN, expected: 1 },
    { ratio: 0.5, expected: 1 },
    { ratio: 1, expected: 1 },
    { ratio: 1.5, expected: 1.5 },
    { ratio: 2, expected: 2 },
    { ratio: 3, expected: 2 }
  ])("clamps device ratio $ratio to $expected", ({ ratio, expected }) => {
    expect(uiTextResolution(ratio)).toBe(expected);
  });
});
