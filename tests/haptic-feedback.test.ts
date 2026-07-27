import { describe, expect, it, vi } from "vitest";
import {
  HapticFeedbackSystem,
  MAX_CUT_CONFIRMATION_HAPTIC_PULSES,
  cutConfirmationHapticPattern,
  hapticFeedbackCapability,
  hapticFeedbackCapabilityLabel,
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
    const haptics = new HapticFeedbackSystem(false, { navigator: { vibrate } });

    expect(haptics.play("cut", "touch")).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(12);

    expect(haptics.play("miss", "pen")).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([10, 18, 10]);

    expect(haptics.play("warning", "mixed")).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([8, 22, 8]);
  });

  it("plays cut bursts through the same modality and mute gates", () => {
    const vibrate = vi.fn(() => true);
    const haptics = new HapticFeedbackSystem(false, { navigator: { vibrate } });

    expect(haptics.playCutBurst(3, "touch")).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([7, 12, 7, 12, 7]);
    expect(haptics.playCutBurst(3, "mouse")).toBe(false);
    expect(haptics.playCutBurst(0, "touch")).toBe(false);
  });

  it("does not vibrate for mouse, unsupported browsers, muted output, or thrown browser errors", () => {
    const vibrate = vi.fn(() => true);
    expect(new HapticFeedbackSystem(false, { navigator: { vibrate } }).play("cut", "mouse")).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();

    expect(new HapticFeedbackSystem(false, {}).play("cut", "touch")).toBe(false);

    const mutedNavigator = { vibrate: vi.fn(() => true) };
    const muted = new HapticFeedbackSystem(true, { navigator: mutedNavigator });
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
    expect(new HapticFeedbackSystem(false, { navigator: throwingNavigator }).play("miss", "touch")).toBe(false);
  });

  it("prefers the bounded native cue bridge and sends capped cut repeats", () => {
    const postMessage = vi.fn();
    const vibrate = vi.fn(() => true);
    const haptics = new HapticFeedbackSystem(false, {
      navigator: { vibrate },
      native: { available: true, handler: { postMessage } }
    });

    expect(haptics.play("warning", "touch")).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ cue: "warning", repeats: 1 });
    expect(haptics.playCutBurst(99, "touch")).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ cue: "cut", repeats: 4 });
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("falls back to browser vibration if the native message handler rejects a cue", () => {
    const vibrate = vi.fn(() => true);
    const haptics = new HapticFeedbackSystem(false, {
      navigator: { vibrate },
      native: {
        available: true,
        handler: { postMessage: vi.fn(() => { throw new Error("bridge stopped"); }) }
      }
    });

    expect(haptics.play("clear", "touch")).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([6, 14, 6]);
  });

  it("reports consumer-facing capability from the route that can actually play", () => {
    const native = hapticFeedbackCapability({
      native: { available: true, handler: { postMessage: vi.fn() } }
    });
    const browser = hapticFeedbackCapability({ navigator: { vibrate: vi.fn(() => true) } });
    const unavailable = hapticFeedbackCapability({ native: { available: false, handler: { postMessage: vi.fn() } } });

    expect(native).toEqual({ available: true, route: "native" });
    expect(browser).toEqual({ available: true, route: "browser" });
    expect(unavailable).toEqual({ available: false, route: "unavailable" });
    expect(hapticFeedbackCapabilityLabel(native)).toBe("Haptics: Available");
    expect(hapticFeedbackCapabilityLabel(unavailable)).toBe("Haptics: Unavailable");
  });
});
