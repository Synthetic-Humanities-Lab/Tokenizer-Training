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
  it("targets pay and balance for a positive resolved net", () => {
    expect(hudImpactTone(4.75)).toBe("gain");
    expect(hudImpactTargets(4.75)).toEqual(["balance", "pay"]);
    expect(hudImpactLabelTarget(4.75)).toBe("pay");
    expect(hudImpactDeltaText(4.75)).toBe("NET +$4.75");
  });

  it("targets cost and balance for a negative resolved net", () => {
    expect(hudImpactTone(-2.1)).toBe("loss");
    expect(hudImpactTargets(-2.1)).toEqual(["balance", "cost"]);
    expect(hudImpactLabelTarget(-2.1)).toBe("cost");
    expect(hudImpactDeltaText(-2.1)).toBe("NET -$2.10");
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
    const start = hudImpactVisualState({ net: 3.5, elapsedMs: 0 });
    const middle = hudImpactVisualState({ net: 3.5, elapsedMs: HUD_IMPACT_PULSE_MS / 2 });
    const done = hudImpactVisualState({ net: 3.5, elapsedMs: HUD_IMPACT_PULSE_MS });

    expect(HUD_IMPACT_PULSE_MS).toBeGreaterThanOrEqual(480);
    expect(HUD_IMPACT_PULSE_MS).toBeLessThanOrEqual(700);
    expect(start.active).toBe(true);
    expect(start.deltaText).toBe("NET +$3.50");
    expect(start.labelTarget).toBe("pay");
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
