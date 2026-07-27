import { describe, expect, it } from "vitest";
import { menuCopy } from "../src/game/systems/MenuContentSystem";

describe("menuCopy", () => {
  it("states the first player verb without explaining the design premise", () => {
    const copy = menuCopy();

    expect(copy.premise).toContain("Predict token boundaries");
    expect(copy.premise).toContain("Verified tokens extend the shift");
    expect(copy.premise.length).toBeLessThanOrEqual(190);
    expect(copy.workOrderLabel).toBe("WORK ORDER / HUMAN SEGMENTATION");
    expect(copy.workOrderRows).toHaveLength(3);
    expect(copy.workOrderRows.join(" ")).toContain("learned token boundaries");
    expect(copy.workOrderRows.join(" ")).toContain("Exact tokens earn Token Credits");
    expect(copy.workOrderRows.join(" ")).toContain("Rework spends them");
    expect(copy.workOrderRows.join(" ")).toContain("Zero closes the queue");
  });
});
