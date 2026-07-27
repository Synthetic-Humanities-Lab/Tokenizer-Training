import { describe, expect, it } from "vitest";
import {
  HUD_IMPACT_PULSE_MS,
  hudImpactDeltaText,
  hudImpactLabelTarget,
  hudImpactTargets,
  hudImpactTone,
  hudImpactVisualState
} from "../src/game/systems/HudImpactSystem";

describe("HudImpactSystem", () => {
  it("targets verified credits and the account for a positive resolved net", () => {
    expect(hudImpactTone(4)).toBe("gain");
    expect(hudImpactTargets(4)).toEqual(["credits", "verified"]);
    expect(hudImpactLabelTarget(4)).toBe("verified");
    expect(hudImpactDeltaText(4)).toBe("NET +4 TC");
  });

  it("targets rework and the account for a negative resolved net", () => {
    expect(hudImpactTone(-2)).toBe("loss");
    expect(hudImpactTargets(-2)).toEqual(["credits", "rework"]);
    expect(hudImpactLabelTarget(-2)).toBe("rework");
    expect(hudImpactDeltaText(-2)).toBe("NET -2 TC");
  });

  it("stays inactive for neutral or invalid resolved net values", () => {
    expect(hudImpactTone(0)).toBeNull();
    expect(hudImpactTone(Number.NaN)).toBeNull();
    expect(hudImpactVisualState({ net: 0, elapsedMs: 0 })).toMatchObject({
      active: false,
      tone: null,
      targets: [],
      labelTarget: null,
      deltaText: "",
      deltaAlpha: 0
    });
  });

  it("decays quickly after the accounting impact beat", () => {
    const start = hudImpactVisualState({ net: 3, elapsedMs: 0 });
    const middle = hudImpactVisualState({ net: 3, elapsedMs: HUD_IMPACT_PULSE_MS / 2 });
    const done = hudImpactVisualState({ net: 3, elapsedMs: HUD_IMPACT_PULSE_MS });

    expect(HUD_IMPACT_PULSE_MS).toBeGreaterThanOrEqual(480);
    expect(HUD_IMPACT_PULSE_MS).toBeLessThanOrEqual(700);
    expect(start.active).toBe(true);
    expect(start.deltaText).toBe("NET +3 TC");
    expect(start.labelTarget).toBe("verified");
    expect(start.fillAlpha).toBeGreaterThan(middle.fillAlpha);
    expect(start.strokeAlpha).toBeGreaterThan(middle.strokeAlpha);
    expect(start.deltaAlpha).toBeGreaterThan(middle.deltaAlpha);
    expect(middle.deltaAlpha).toBeGreaterThan(done.deltaAlpha);
    expect(middle.deltaLift).toBeLessThan(start.deltaLift);
    expect(middle.fillAlpha).toBeGreaterThan(done.fillAlpha);
    expect(done.active).toBe(false);
    expect(done.fillAlpha).toBe(0);
  });
});
