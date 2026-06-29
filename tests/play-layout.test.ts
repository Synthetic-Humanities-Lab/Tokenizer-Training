import { describe, expect, it } from "vitest";
import {
  clearButtonLabel,
  clearButtonVisualState,
  compactPlayControlRowY,
  compactPlayControlsDockedAtBottom,
  COMPACT_PLAY_CONTROL_TOP_ROW_Y,
  computePlayLayout,
  exitButtonLabel,
  MIN_TOUCH_TARGET_SIZE,
  RESOLVE_READY_PULSE_MS,
  resolveReadyPulseStrength,
  shouldShowPlayHeaderBrand,
  resolveButtonLabel,
  resolveButtonVisualState,
  type LayoutRect
} from "../src/game/systems/PlayLayoutSystem";
import { computeFeedbackCardLayout } from "../src/game/ui/FeedbackCard";
import { computeHudLayout } from "../src/game/ui/Hud";
import { uiPalette } from "../src/game/ui/VisualTheme";

function edges(rect: LayoutRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function overlaps(a: LayoutRect, b: LayoutRect): boolean {
  const ae = edges(a);
  const be = edges(b);
  return ae.left < be.right && ae.right > be.left && ae.top < be.bottom && ae.bottom > be.top;
}

function contains(outer: LayoutRect, inner: LayoutRect): boolean {
  const oe = edges(outer);
  const ie = edges(inner);
  return ie.left >= oe.left && ie.right <= oe.right && ie.top >= oe.top && ie.bottom <= oe.bottom;
}

function withinViewport(rect: LayoutRect, width: number, height: number): boolean {
  const rectEdges = edges(rect);
  return rectEdges.left >= 0 && rectEdges.right <= width && rectEdges.top >= 0 && rectEdges.bottom <= height;
}

describe("computePlayLayout", () => {
  it("keeps portrait controls reachable without overlapping each other", () => {
    const layout = computePlayLayout({ width: 390, height: 844 });

    expect(layout.compact).toBe(true);
    expect(withinViewport(layout.exitButton, 390, 844)).toBe(true);
    expect(withinViewport(layout.resolveButton, 390, 844)).toBe(true);
    expect(withinViewport(layout.clearButton, 390, 844)).toBe(true);
    expect(withinViewport(layout.muteButton, 390, 844)).toBe(true);
    expect(overlaps(layout.resolveButton, layout.muteButton)).toBe(false);
    expect(overlaps(layout.resolveButton, layout.clearButton)).toBe(false);
    expect(overlaps(layout.clearButton, layout.muteButton)).toBe(false);
    expect(overlaps(layout.exitButton, layout.resolveButton)).toBe(false);
  });

  it("keeps the compact control row usable on narrow portrait widths", () => {
    const layout = computePlayLayout({ width: 320, height: 568 });

    expect(compactPlayControlsDockedAtBottom(568)).toBe(false);
    expect(layout.resolveButton.y).toBe(COMPACT_PLAY_CONTROL_TOP_ROW_Y);
    expect(withinViewport(layout.resolveButton, 320, 568)).toBe(true);
    expect(withinViewport(layout.clearButton, 320, 568)).toBe(true);
    expect(withinViewport(layout.muteButton, 320, 568)).toBe(true);
    expect(overlaps(layout.resolveButton, layout.clearButton)).toBe(false);
    expect(overlaps(layout.clearButton, layout.muteButton)).toBe(false);
    expect(overlaps(layout.exitButton, layout.clearButton)).toBe(false);
    expect(overlaps(layout.exitButton, layout.resolveButton)).toBe(false);
    expect(layout.resolveButton.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
    expect(layout.resolveButton.height).toBe(MIN_TOUCH_TARGET_SIZE);
    expect(layout.clearButton.height).toBe(MIN_TOUCH_TARGET_SIZE);
    expect(layout.muteButton.height).toBe(MIN_TOUCH_TARGET_SIZE);
    expect(layout.exitButton.height).toBe(MIN_TOUCH_TARGET_SIZE);
  });

  it("bottom-docks compact controls on normal portrait phones for thumb reach", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });

    expect(compactPlayControlsDockedAtBottom(height)).toBe(true);
    expect(layout.resolveButton.y).toBe(compactPlayControlRowY(height));
    expect(edges(layout.resolveButton).bottom).toBe(height - 12);
    expect(edges(layout.resolveButton).top).toBeGreaterThan(edges(layout.playfield).bottom);
    expect(edges(layout.clearButton).top).toBeGreaterThan(edges(layout.playfield).bottom);
    expect(edges(layout.muteButton).top).toBeGreaterThan(edges(layout.playfield).bottom);
    expect(edges(layout.exitButton).top).toBeGreaterThan(edges(layout.playfield).bottom);
  });

  it("keeps the active portrait sentence static and clear of controls", () => {
    const layout = computePlayLayout({ width: 390, height: 844 });
    const activeTextPanel = {
      ...layout.textPanel,
      y: layout.sentenceActiveY
    };

    expect(overlaps(activeTextPanel, layout.resolveButton)).toBe(false);
    expect(overlaps(activeTextPanel, layout.clearButton)).toBe(false);
    expect(overlaps(activeTextPanel, layout.muteButton)).toBe(false);
    expect(overlaps(activeTextPanel, layout.exitButton)).toBe(false);
    expect(layout.sentenceStartY).toBe(layout.sentenceActiveY);
    expect(layout.sentenceEndY).toBe(layout.sentenceActiveY);
  });

  it("keeps compact review text in the same static prompt lane", () => {
    const layout = computePlayLayout({ width: 390, height: 844 });
    const reviewTextPanel = {
      ...layout.textPanel,
      y: layout.sentenceReviewY
    };

    expect(layout.sentenceReviewY).toBe(layout.sentenceActiveY);
    expect(contains(layout.playfield, reviewTextPanel)).toBe(true);
    expect(overlaps(reviewTextPanel, layout.resolveButton)).toBe(false);
    expect(overlaps(reviewTextPanel, layout.clearButton)).toBe(false);
    expect(overlaps(reviewTextPanel, layout.muteButton)).toBe(false);
  });

  it("keeps the desktop active prompt static below the HUD and lifts review only for evidence clearance", () => {
    const layout = computePlayLayout({ width: 1280, height: 720 });
    const activeTextPanel = {
      ...layout.textPanel,
      y: layout.sentenceActiveY
    };
    const reviewTextPanel = {
      ...layout.textPanel,
      y: layout.sentenceReviewY
    };
    const hud = computeHudLayout(1280, layout.contentPanel).background;
    const hudPanel = {
      x: hud.x,
      y: hud.y + hud.height / 2,
      width: hud.width,
      height: hud.height
    };

    expect(layout.sentenceStartY).toBe(layout.sentenceActiveY);
    expect(layout.sentenceEndY).toBe(layout.sentenceActiveY);
    expect(layout.sentenceReviewY).toBeLessThan(layout.sentenceActiveY);
    expect(layout.sentenceActiveY - layout.sentenceReviewY).toBeGreaterThanOrEqual(30);
    expect(overlaps(activeTextPanel, hudPanel)).toBe(false);
    expect(overlaps(reviewTextPanel, hudPanel)).toBe(false);
    expect(overlaps(reviewTextPanel, layout.chrome)).toBe(false);
  });

  it("keeps compact static prompt inside the playfield and away from the pet avatar", () => {
    const layout = computePlayLayout({ width: 390, height: 844 });
    const startingTextPanel = {
      ...layout.textPanel,
      y: layout.sentenceStartY
    };
    const playfieldEdges = edges(layout.playfield);
    const startingEdges = edges(startingTextPanel);

    expect(startingEdges.top).toBeGreaterThanOrEqual(playfieldEdges.top);
    expect(startingEdges.bottom).toBeLessThanOrEqual(playfieldEdges.bottom);
    expect(overlaps(startingTextPanel, layout.petWienerSlot)).toBe(false);
  });

  it("keeps desktop prompt inside the simplified central playfield", () => {
    const medium = computePlayLayout({ width: 960, height: 720 });
    const desktop = computePlayLayout({ width: 1280, height: 720 });
    const activeDesktopTextPanel = {
      ...desktop.textPanel,
      y: desktop.sentenceActiveY
    };

    expect(contains(medium.playfield, { ...medium.textPanel, y: medium.sentenceActiveY })).toBe(true);
    expect(contains(desktop.playfield, activeDesktopTextPanel)).toBe(true);
  });

  it("uses one pet slot instead of side assistant geometry", () => {
    const portrait = computePlayLayout({ width: 390, height: 844 });
    const medium = computePlayLayout({ width: 960, height: 720 });
    const wide = computePlayLayout({ width: 1280, height: 720 });

    expect(withinViewport(portrait.petWienerSlot, 390, 844)).toBe(true);
    expect(withinViewport(medium.petWienerSlot, 960, 720)).toBe(true);
    expect(withinViewport(wide.petWienerSlot, 1280, 720)).toBe(true);
    expect(overlaps(portrait.petWienerSlot, portrait.textPanel)).toBe(false);
  });

  it("keeps desktop exit and bottom controls in a shared bottom row", () => {
    const layout = computePlayLayout({ width: 1280, height: 720 });

    expect(withinViewport(layout.exitButton, 1280, 720)).toBe(true);
    expect(withinViewport(layout.resolveButton, 1280, 720)).toBe(true);
    expect(withinViewport(layout.clearButton, 1280, 720)).toBe(true);
    expect(withinViewport(layout.muteButton, 1280, 720)).toBe(true);
    expect(edges(layout.resolveButton).top).toBeGreaterThan(edges(layout.playfield).bottom);
    expect(edges(layout.clearButton).top).toBeGreaterThan(edges(layout.playfield).bottom);
    expect(edges(layout.muteButton).top).toBeGreaterThan(edges(layout.playfield).bottom);
    expect(overlaps(layout.resolveButton, layout.clearButton)).toBe(false);
    expect(overlaps(layout.clearButton, layout.muteButton)).toBe(false);
    expect(overlaps(layout.exitButton, layout.clearButton)).toBe(false);
    expect(overlaps(layout.exitButton, layout.muteButton)).toBe(false);
    expect(layout.exitButton.y).toBe(layout.resolveButton.y);
  });

  it("keeps compact combined resolution feedback below the review prompt and above controls", () => {
    const width = 390;
    const height = 568;
    const playLayout = computePlayLayout({ width, height });
    const feedback = computeFeedbackCardLayout(width, height);
    const reviewTextPanel = {
      ...playLayout.textPanel,
      y: playLayout.sentenceReviewY
    };

    expect(feedback.compact).toBe(true);
    expect(edges(feedback).top).toBeGreaterThanOrEqual(edges(reviewTextPanel).bottom + 8);
    expect(edges(feedback).bottom).toBeLessThanOrEqual(height - 16);
    expect(overlaps(feedback, playLayout.resolveButton)).toBe(false);
  });

  it("keeps bounded desktop HUD and feedback inside the simplified central console", () => {
    const width = 1280;
    const height = 720;
    const layout = computePlayLayout({ width, height });
    const hud = computeHudLayout(width, layout.contentPanel).background;
    const feedback = computeFeedbackCardLayout(width, height, layout.contentPanel);

    expect(contains(layout.contentPanel, {
      x: hud.x,
      y: hud.y + hud.height / 2,
      width: hud.width,
      height: hud.height
    })).toBe(true);
    expect(contains(layout.contentPanel, feedback)).toBe(true);
  });

  it("hides the play header brand before it would collide with HUD metrics", () => {
    const medium = computePlayLayout({ width: 960, height: 720 });
    const wide = computePlayLayout({ width: 1280, height: 720 });
    const mediumHud = computeHudLayout(960, medium.contentPanel);
    const wideHud = computeHudLayout(1280, wide.contentPanel);

    expect(shouldShowPlayHeaderBrand(medium)).toBe(false);
    expect(shouldShowPlayHeaderBrand(wide)).toBe(true);
    expect(mediumHud.balance.x).toBeGreaterThan(0);
    expect(mediumHud.pay.x).toBeGreaterThan(mediumHud.balance.x + 120);
    expect(wideHud.balance.x).toBeGreaterThan(wide.logoWiener.x + wide.logoWiener.width / 2 + 130);
  });

  it("labels compact endless exit as a quit action, not a direct menu jump", () => {
    expect(exitButtonLabel(true, true)).toBe("Menu");
    expect(exitButtonLabel(true, false)).toBe("Exit");
    expect(exitButtonLabel(false, true)).toBe("Exit Tutorial");
    expect(exitButtonLabel(false, false)).toBe("Exit Training");
  });

  it("uses compact text for the clear control on portrait layouts and adds cut count when active", () => {
    expect(clearButtonLabel(true)).toBe("Clear");
    expect(clearButtonLabel(false)).toBe("Clear Cuts");
    expect(clearButtonLabel(true, 3)).toBe("Clear 3");
    expect(clearButtonLabel(false, 3)).toBe("Clear 3");
    expect(clearButtonLabel(false, 3.9)).toBe("Clear 3");
    expect(clearButtonLabel(false, -2)).toBe("Clear Cuts");
    expect(clearButtonLabel(false, 3, false)).toBe("Clear Cuts");
    expect(clearButtonLabel(true, 3, false)).toBe("Clear");
  });

  it("labels the resolve control as review-only after resolution", () => {
    expect(resolveButtonLabel(false)).toBe("Resolve");
    expect(resolveButtonLabel(true)).toBe("Reviewing");
    expect(resolveButtonLabel(false, true)).toBe("Resolve");
    expect(resolveButtonLabel(true, true)).toBe("Review");
    expect(resolveButtonLabel(false, true, 3)).toBe("Resolve 3");
    expect(resolveButtonLabel(false, false, 3)).toBe("Resolve 3");
    expect(resolveButtonLabel(false, false, 3.9)).toBe("Resolve 3");
    expect(resolveButtonLabel(false, false, -2)).toBe("Resolve");
    expect(resolveButtonLabel(true, true, 3)).toBe("Review");
  });

  it("keeps Resolve actionable during active play and disabled only during review", () => {
    const active = resolveButtonVisualState(false, false);
    const activeHover = resolveButtonVisualState(false, true);
    const activePressed = resolveButtonVisualState(false, true, false, false, true);
    const activeReady = resolveButtonVisualState(false, false, false, true, false, 3);
    const activeReadyFresh = resolveButtonVisualState(false, false, false, true, false, 3, 0);
    const activeReadySettling = resolveButtonVisualState(false, false, false, true, false, 3, RESOLVE_READY_PULSE_MS / 2);
    const activeReadyBaseline = resolveButtonVisualState(false, false, false, true, false, 3, RESOLVE_READY_PULSE_MS);
    const activeReadyHover = resolveButtonVisualState(false, true, false, true, false, 3);
    const activeReadyPressed = resolveButtonVisualState(false, true, false, true, true, 3);
    const reviewing = resolveButtonVisualState(true, false);
    const reviewingHover = resolveButtonVisualState(true, true);
    const reviewingReady = resolveButtonVisualState(true, false, false, true, true);

    expect(activeHover.fillAlpha).toBeGreaterThan(active.fillAlpha);
    expect(activeHover.fillColor).not.toBe(active.fillColor);
    expect(activePressed.fillAlpha).toBeGreaterThan(activeHover.fillAlpha);
    expect(activePressed.fillColor).not.toBe(activeHover.fillColor);
    expect(activeReady.label).toBe("Resolve 3");
    expect(activeReady.fillColor).not.toBe(active.fillColor);
    expect(activeReady.fillAlpha).toBeGreaterThan(active.fillAlpha);
    expect(activeReadyFresh.readyPulse).toBe(1);
    expect(activeReadySettling.readyPulse).toBeGreaterThan(0);
    expect(activeReadySettling.readyPulse).toBeLessThan(1);
    expect(activeReadyBaseline.readyPulse).toBe(0);
    expect(activeReadyFresh.strokeWidth).toBeGreaterThan(activeReadySettling.strokeWidth);
    expect(activeReadySettling.strokeWidth).toBeGreaterThan(activeReadyBaseline.strokeWidth);
    expect(activeReadyFresh.strokeAlpha).toBeGreaterThan(activeReadyBaseline.strokeAlpha);
    expect(activeReadyHover.fillColor).not.toBe(activeReady.fillColor);
    expect(activeReadyPressed.fillColor).not.toBe(activeReadyHover.fillColor);
    expect(reviewing.label).toBe("Reviewing");
    expect(reviewing.alpha).toBeLessThan(active.alpha);
    expect(reviewingHover).toEqual(reviewing);
    expect(reviewingReady).toEqual(reviewing);
  });

  it("carries deadline pressure into Resolve without changing staged cut ownership", () => {
    const ready = resolveButtonVisualState(false, false, false, true, false, 3, undefined, 0);
    const pressured = resolveButtonVisualState(false, false, false, true, false, 3, undefined, 0.72);
    const compactPressured = resolveButtonVisualState(false, false, true, true, false, 2, undefined, 0.72);
    const zeroCutPressure = resolveButtonVisualState(false, false, false, false, false, 0, undefined, 0.72);
    const reviewingPressure = resolveButtonVisualState(true, false, false, true, false, 3, undefined, 0.72);

    expect(pressured.label).toBe("Resolve 3");
    expect(pressured.deadlinePressure).toBeCloseTo(0.72);
    expect(pressured.strokeColor).toBe(uiPalette.warning);
    expect(pressured.strokeAlpha).toBeGreaterThan(ready.strokeAlpha);
    expect(pressured.strokeWidth).toBeGreaterThan(ready.strokeWidth);
    expect(pressured.fillAlpha).toBeGreaterThan(ready.fillAlpha);
    expect(compactPressured.label).toBe("Resolve 2");
    expect(compactPressured.deadlinePressure).toBeCloseTo(0.72);
    expect(zeroCutPressure.label).toBe("Resolve");
    expect(zeroCutPressure.deadlinePressure).toBeCloseTo(0.72);
    expect(zeroCutPressure.strokeColor).toBe(uiPalette.warning);
    expect(zeroCutPressure.strokeWidth).toBeGreaterThan(resolveButtonVisualState(false, false).strokeWidth);
    expect(zeroCutPressure.fillColor).not.toBe(resolveButtonVisualState(false, false).fillColor);
    expect(reviewingPressure.deadlinePressure).toBe(0);
    expect(reviewingPressure.label).toBe("Reviewing");
  });

  it("decays the resolve-ready pulse without changing the staged cut count", () => {
    expect(RESOLVE_READY_PULSE_MS).toBeGreaterThanOrEqual(300);
    expect(RESOLVE_READY_PULSE_MS).toBeLessThanOrEqual(380);
    expect(resolveReadyPulseStrength(0)).toBe(1);
    expect(resolveReadyPulseStrength(RESOLVE_READY_PULSE_MS / 2)).toBeGreaterThan(0);
    expect(resolveReadyPulseStrength(RESOLVE_READY_PULSE_MS / 2)).toBeLessThan(1);
    expect(resolveReadyPulseStrength(RESOLVE_READY_PULSE_MS)).toBe(0);
    expect(resolveReadyPulseStrength(undefined)).toBe(0);
    expect(resolveButtonVisualState(false, false, false, false, false, 0, 0).readyPulse).toBe(0);
  });

  it("uses compact resolve text in the portrait control row", () => {
    expect(resolveButtonVisualState(false, false, true).label).toBe("Resolve");
    expect(resolveButtonVisualState(false, false, true, true, false, 2).label).toBe("Resolve 2");
    expect(resolveButtonVisualState(true, false, true).label).toBe("Review");
  });

  it("visually disables the clear control until there are cuts to clear", () => {
    const disabled = clearButtonVisualState(false, false);
    const disabledHover = clearButtonVisualState(false, true);
    const disabledPressed = clearButtonVisualState(false, true, true);
    const active = clearButtonVisualState(true, false);
    const activeHover = clearButtonVisualState(true, true);
    const activePressed = clearButtonVisualState(true, true, true);

    expect(disabled.alpha).toBeLessThan(active.alpha);
    expect(disabledHover).toEqual(disabled);
    expect(disabledPressed).toEqual(disabled);
    expect(activeHover.fillAlpha).toBeGreaterThan(active.fillAlpha);
    expect(activeHover.fillColor).not.toBe(active.fillColor);
    expect(activePressed.fillAlpha).toBeGreaterThan(activeHover.fillAlpha);
    expect(activePressed.fillColor).not.toBe(activeHover.fillColor);
  });
});
