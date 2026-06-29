import { describe, expect, it, vi } from "vitest";
import {
  HapticFeedbackSystem,
  MAX_CUT_CONFIRMATION_HAPTIC_PULSES,
  cutConfirmationHapticPattern,
  hapticFeedbackPatterns,
  hapticModalityCanPlay,
  type HapticNavigatorLike
} from "../src/game/systems/HapticFeedbackSystem";

describe("HapticFeedbackSystem", () => {
  it("keeps haptic patterns short enough to act as tactile punctuation", () => {
    expect(hapticFeedbackPatterns.cut).toBe(12);
    expect(hapticFeedbackPatterns.confirm).toBe(8);
    expect(hapticFeedbackPatterns.clear).toEqual([6, 14, 6]);
    expect(hapticFeedbackPatterns.miss).toEqual([10, 18, 10]);
    expect(hapticFeedbackPatterns.warning).toEqual([8, 22, 8]);
  });

  it("plans capped multi-cut vibration bursts for fast segmentation swipes", () => {
    expect(MAX_CUT_CONFIRMATION_HAPTIC_PULSES).toBe(4);
    expect(cutConfirmationHapticPattern(0)).toBeNull();
    expect(cutConfirmationHapticPattern(1)).toBe(12);
    expect(cutConfirmationHapticPattern(2)).toEqual([7, 12, 7]);
    expect(cutConfirmationHapticPattern(3)).toEqual([7, 12, 7, 12, 7]);
    expect(cutConfirmationHapticPattern(99)).toEqual([7, 12, 7, 12, 7, 12, 7]);
  });

  it("only treats physical touch-like modalities as eligible", () => {
    expect(hapticModalityCanPlay("touch")).toBe(true);
    expect(hapticModalityCanPlay("pen")).toBe(true);
    expect(hapticModalityCanPlay("mixed")).toBe(true);
    expect(hapticModalityCanPlay("mouse")).toBe(false);
    expect(hapticModalityCanPlay("unknown")).toBe(false);
    expect(hapticModalityCanPlay("none")).toBe(false);
  });

  it("plays haptics through navigator vibration when available and enabled", () => {
    const vibrate = vi.fn(() => true);
    const haptics = new HapticFeedbackSystem(false, { vibrate });

    expect(haptics.play("cut", "touch")).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(12);

    expect(haptics.play("miss", "pen")).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([10, 18, 10]);

    expect(haptics.play("warning", "mixed")).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([8, 22, 8]);
  });

  it("plays cut bursts through the same modality and mute gates", () => {
    const vibrate = vi.fn(() => true);
    const haptics = new HapticFeedbackSystem(false, { vibrate });

    expect(haptics.playCutBurst(3, "touch")).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([7, 12, 7, 12, 7]);
    expect(haptics.playCutBurst(3, "mouse")).toBe(false);
    expect(haptics.playCutBurst(0, "touch")).toBe(false);
  });

  it("does not vibrate for mouse, unsupported browsers, muted output, or thrown browser errors", () => {
    const vibrate = vi.fn(() => true);
    expect(new HapticFeedbackSystem(false, { vibrate }).play("cut", "mouse")).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();

    expect(new HapticFeedbackSystem(false, {}).play("cut", "touch")).toBe(false);

    const mutedNavigator = { vibrate: vi.fn(() => true) };
    const muted = new HapticFeedbackSystem(true, mutedNavigator);
    expect(muted.play("cut", "touch")).toBe(false);
    expect(mutedNavigator.vibrate).not.toHaveBeenCalled();
    muted.setMuted(false);
    expect(muted.play("confirm", "touch")).toBe(true);
    expect(mutedNavigator.vibrate).toHaveBeenCalledWith(8);

    const throwingNavigator: HapticNavigatorLike = {
      vibrate: vi.fn(() => {
        throw new Error("blocked");
      })
    };
    expect(new HapticFeedbackSystem(false, throwingNavigator).play("miss", "touch")).toBe(false);
  });
});
