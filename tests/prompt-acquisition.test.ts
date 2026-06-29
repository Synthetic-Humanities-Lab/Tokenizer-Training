import { describe, expect, it } from "vitest";
import {
  PROMPT_ACQUISITION_MS,
  promptAcquisitionVisualState
} from "../src/game/systems/PromptAcquisitionSystem";

describe("PromptAcquisitionSystem", () => {
  it("gives a new round a short acquisition beat before settling", () => {
    const start = promptAcquisitionVisualState({ elapsedMs: 0 });
    const middle = promptAcquisitionVisualState({ elapsedMs: PROMPT_ACQUISITION_MS / 2 });
    const done = promptAcquisitionVisualState({ elapsedMs: PROMPT_ACQUISITION_MS });
    const unset = promptAcquisitionVisualState({ elapsedMs: Number.POSITIVE_INFINITY });

    expect(PROMPT_ACQUISITION_MS).toBeGreaterThanOrEqual(360);
    expect(PROMPT_ACQUISITION_MS).toBeLessThanOrEqual(480);
    expect(start.active).toBe(true);
    expect(start.progress).toBe(0);
    expect(start.labelText).toBe("ROUTE LIVE");
    expect(start.sweepScale).toBeLessThan(middle.sweepScale);
    expect(middle.sweepScale).toBeLessThanOrEqual(1);
    expect(middle.labelAlpha).toBeGreaterThan(done.labelAlpha);
    expect(middle.frameAlpha).toBeGreaterThan(done.frameAlpha);
    expect(middle.sweepAlpha).toBeGreaterThan(done.sweepAlpha);
    expect(done.active).toBe(false);
    expect(done.progress).toBe(1);
    expect(done.labelAlpha).toBe(0);
    expect(done.frameAlpha).toBe(0);
    expect(done.sweepAlpha).toBe(0);
    expect(unset.active).toBe(false);
    expect(unset.progress).toBe(1);
  });

  it("uses compact sizing and tutorial-specific labels without changing timing", () => {
    const desktop = promptAcquisitionVisualState({ elapsedMs: 120, tutorialMode: true });
    const compact = promptAcquisitionVisualState({ elapsedMs: 120, compact: true, tutorialMode: true });

    expect(desktop.labelText).toBe("TUTORIAL LIVE");
    expect(compact.labelText).toBe("TUTORIAL LIVE");
    expect(compact.progress).toBe(desktop.progress);
    expect(compact.strokeWidth).toBeLessThan(desktop.strokeWidth);
    expect(compact.paddingX).toBeLessThan(desktop.paddingX);
    expect(compact.paddingY).toBeLessThan(desktop.paddingY);
  });

  it("treats missing elapsed time as a just-started beat for direct style calls", () => {
    const implicitStart = promptAcquisitionVisualState();

    expect(implicitStart.active).toBe(true);
    expect(implicitStart.progress).toBe(0);
    expect(implicitStart.labelText).toBe("ROUTE LIVE");
  });
});
