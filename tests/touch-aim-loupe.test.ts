import { describe, expect, it } from "vitest";
import {
  TOUCH_AIM_LOUPE_HEIGHT,
  TOUCH_AIM_LOUPE_MIN_POINTER_CLEARANCE,
  TOUCH_AIM_LOUPE_POINTER_CLEARANCE,
  TOUCH_AIM_LOUPE_WIDTH,
  shouldShowTouchAimLoupe,
  touchAimLoupePointerClearance,
  touchAimLoupeState,
  touchAimLoupeText,
  touchAimLoupeVisualStyle,
  touchAimLoupeX
} from "../src/game/systems/TouchAimLoupeSystem";
import type { BoundarySlot } from "../src/game/systems/SwipeCutSystem";

const slot: BoundarySlot = {
  index: 3,
  x: 105,
  yMin: 0,
  yMax: 40,
  hinted: false
};

describe("TouchAimLoupeSystem", () => {
  it("shows only for compact or touch-like input", () => {
    expect(shouldShowTouchAimLoupe(false, "mouse")).toBe(false);
    expect(shouldShowTouchAimLoupe(true, "mouse")).toBe(true);
    expect(shouldShowTouchAimLoupe(false, "touch")).toBe(true);
    expect(shouldShowTouchAimLoupe(false, "pen")).toBe(true);
    expect(shouldShowTouchAimLoupe(false, "mixed")).toBe(true);
  });

  it("mirrors the candidate boundary without inventing space labels", () => {
    expect(touchAimLoupeText("the cat", 3)).toBe("the| cat");
    expect(touchAimLoupeText("openai.com", 6)).toBe("enai|.com");
  });

  it("returns no visible loupe without an armed preview slot", () => {
    expect(touchAimLoupeState({
      compact: true,
      inputModality: "touch",
      viewport: { width: 390, height: 844 },
      pointer: { x: 100, y: 300 },
      text: "the cat",
      textBounds: { x: 195, y: 300, width: 260, height: 32 },
      slot: null
    })).toEqual({
      visible: false,
      text: "",
      boundary: null,
      snapReady: false,
      pointerClearancePx: null,
      occlusionSafe: false,
      placement: "hidden"
    });
  });

  it("places a compact loupe above the text and inside the viewport", () => {
    const state = touchAimLoupeState({
      compact: true,
      inputModality: "touch",
      viewport: { width: 390, height: 844 },
      pointer: { x: 130, y: 300 },
      text: "the cat",
      textBounds: { x: 195, y: 300, width: 260, height: 32 },
      slot
    });

    expect(state.visible).toBe(true);
    expect(state.boundary).toBe(3);
    expect(state.snapReady).toBe(false);
    expect(state.text).toBe("the| cat");
    expect(state.rect?.width).toBe(TOUCH_AIM_LOUPE_WIDTH);
    expect(state.rect?.height).toBe(TOUCH_AIM_LOUPE_HEIGHT);
    expect(state.rect?.y).toBeLessThan(300);
    expect(state.placement).toBe("above");
    expect(state.pointerClearancePx).toBeGreaterThanOrEqual(TOUCH_AIM_LOUPE_MIN_POINTER_CLEARANCE);
    expect(state.occlusionSafe).toBe(true);
    expect((state.rect?.x ?? 0) - TOUCH_AIM_LOUPE_WIDTH / 2).toBeGreaterThanOrEqual(10);
    expect((state.rect?.x ?? 0) + TOUCH_AIM_LOUPE_WIDTH / 2).toBeLessThanOrEqual(380);
  });

  it("moves below the text when top-edge clamping would put the loupe under the finger", () => {
    const state = touchAimLoupeState({
      compact: true,
      inputModality: "touch",
      viewport: { width: 390, height: 240 },
      pointer: { x: 130, y: 60 },
      text: "the cat",
      textBounds: { x: 195, y: 60, width: 260, height: 32 },
      slot
    });

    expect(state.visible).toBe(true);
    expect(state.placement).toBe("below");
    expect(state.rect?.y).toBeGreaterThan(60);
    expect(state.pointerClearancePx).toBeGreaterThanOrEqual(TOUCH_AIM_LOUPE_MIN_POINTER_CLEARANCE);
    expect(state.occlusionSafe).toBe(true);
  });

  it("measures pointer clearance so touch occlusion can be audited", () => {
    const rect = { x: 160, y: 180, width: TOUCH_AIM_LOUPE_WIDTH, height: TOUCH_AIM_LOUPE_HEIGHT };

    expect(touchAimLoupePointerClearance({ x: 160, y: 180 }, rect)).toBe(0);
    expect(touchAimLoupePointerClearance({ x: 160, y: 250 }, rect)).toBe(49);
    expect(touchAimLoupePointerClearance({ x: 260, y: 180 }, rect)).toBe(36);
  });

  it("keeps the compact loupe laterally clear of the finger when space allows", () => {
    const leftOfFinger = touchAimLoupeX({ x: 210, y: 300 }, 180, 390);
    const rightOfFinger = touchAimLoupeX({ x: 170, y: 300 }, 180, 390);

    expect(leftOfFinger).toBeLessThan(180);
    expect(rightOfFinger).toBeGreaterThan(180);
    expect(Math.abs(leftOfFinger - 180)).toBe(TOUCH_AIM_LOUPE_POINTER_CLEARANCE);
    expect(Math.abs(rightOfFinger - 180)).toBe(TOUCH_AIM_LOUPE_POINTER_CLEARANCE);
  });

  it("chooses the roomier side when the finger is directly on the candidate slot", () => {
    expect(touchAimLoupeX({ x: 120, y: 300 }, 120, 390)).toBeGreaterThan(120);
    expect(touchAimLoupeX({ x: 280, y: 300 }, 280, 390)).toBeLessThan(280);
  });

  it("carries snap-ready state without changing the mirrored text", () => {
    const state = touchAimLoupeState({
      compact: true,
      inputModality: "touch",
      viewport: { width: 390, height: 844 },
      pointer: { x: 104, y: 300 },
      text: "the cat",
      textBounds: { x: 195, y: 300, width: 260, height: 32 },
      slot,
      snapReady: true
    });

    expect(state.visible).toBe(true);
    expect(state.boundary).toBe(3);
    expect(state.snapReady).toBe(true);
    expect(state.text).toBe("the| cat");
  });

  it("makes snap-ready presentation visibly stronger without changing loupe geometry", () => {
    const approach = touchAimLoupeVisualStyle(false);
    const ready = touchAimLoupeVisualStyle(true);

    expect(ready.accentAlpha).toBeGreaterThan(approach.accentAlpha);
    expect(ready.borderAlpha).toBeGreaterThan(approach.borderAlpha);
    expect(ready.centerLineWidth).toBeGreaterThan(approach.centerLineWidth);
    expect(ready.centerLineAlpha).toBeGreaterThan(approach.centerLineAlpha);
    expect(ready.railAlpha).toBeGreaterThan(approach.railAlpha);
    expect(ready.railHeight).toBeGreaterThan(approach.railHeight);
    expect(ready.sideRailWidth).toBeGreaterThanOrEqual(approach.sideRailWidth);
  });
});
