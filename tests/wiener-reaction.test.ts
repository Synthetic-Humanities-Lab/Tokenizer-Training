import { describe, expect, it } from "vitest";
import {
  WIENER_CUT_REACTION_MS,
  wienerCutReaction,
  wienerResolveReaction
} from "../src/game/systems/WienerReactionSystem";

describe("WienerReactionSystem", () => {
  it("reacts only when a cut is actually staged", () => {
    expect(wienerCutReaction(0)).toBeNull();
    expect(wienerCutReaction(Number.NaN)).toBeNull();
    expect(wienerCutReaction(1)).toMatchObject({
      kind: "cut",
      durationMs: WIENER_CUT_REACTION_MS,
      yoyo: true,
      repeat: 0
    });
    expect(WIENER_CUT_REACTION_MS).toBeGreaterThanOrEqual(108);
    expect(WIENER_CUT_REACTION_MS).toBeLessThanOrEqual(130);
    expect(wienerCutReaction(1)?.scaleX).toBeGreaterThan(1);
    expect(wienerCutReaction(1)?.scaleY).toBeLessThan(1);
  });

  it("uses a clean resolve nod for error-free reviews", () => {
    const reaction = wienerResolveReaction({ missedCuts: 0, falseCuts: 0 });

    expect(reaction.kind).toBe("clean");
    expect(reaction.xOffset).toBe(0);
    expect(reaction.angle).toBeGreaterThan(0);
    expect(reaction.scaleX).toBeLessThan(1);
    expect(reaction.scaleY).toBeGreaterThan(1);
    expect(reaction.durationMs).toBeLessThanOrEqual(180);
    expect(reaction.repeat).toBe(1);
  });

  it("uses a short shake for reviews with missed or false cuts", () => {
    const lightError = wienerResolveReaction({ missedCuts: 1, falseCuts: 0 });
    const heavyError = wienerResolveReaction({ missedCuts: 3, falseCuts: 2 });

    expect(lightError.kind).toBe("error");
    expect(lightError.xOffset).toBeLessThan(0);
    expect(lightError.angle).toBeLessThan(0);
    expect(lightError.scaleX).toBeGreaterThan(1);
    expect(lightError.scaleY).toBeLessThan(1);
    expect(lightError.durationMs).toBeLessThan(100);
    expect(heavyError.repeat).toBeGreaterThan(lightError.repeat);
    expect(heavyError.repeat).toBeLessThanOrEqual(3);
  });
});
