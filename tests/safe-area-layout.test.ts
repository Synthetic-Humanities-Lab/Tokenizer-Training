import { describe, expect, it } from "vitest";
import { computeMenuLayout } from "../src/game/systems/MenuLayoutSystem";
import {
  compactPlayControlRowY,
  computePlayLayout,
  type LayoutRect
} from "../src/game/systems/PlayLayoutSystem";
import { computeResultsLayout } from "../src/game/systems/ResultsLayoutSystem";
import { safeAreaInsets, safeAreaInsetsForSurface } from "../src/game/systems/SafeAreaSystem";
import { computeTutorialCompleteLayout } from "../src/game/systems/TutorialCompleteLayoutSystem";
import { computeFeedbackCardLayout } from "../src/game/ui/FeedbackCard";
import { computeHudLayout } from "../src/game/ui/Hud";

const PHONE_SAFE_AREA = {
  top: 59,
  right: 0,
  bottom: 34,
  left: 0
};

function edges(rect: LayoutRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function withinSafeRect(rect: LayoutRect, width: number, height: number, safeArea = PHONE_SAFE_AREA): boolean {
  const rectEdges = edges(rect);
  return (
    rectEdges.left >= safeArea.left &&
    rectEdges.right <= width - safeArea.right &&
    rectEdges.top >= safeArea.top &&
    rectEdges.bottom <= height - safeArea.bottom
  );
}

describe("safe-area layout", () => {
  it("normalizes invalid safe-area values to non-negative finite insets", () => {
    expect(safeAreaInsets({ top: 59, right: Number.NaN, bottom: -12, left: Infinity })).toEqual({
      top: 59,
      right: 0,
      bottom: 0,
      left: 0
    });
  });

  it("passes safe-area insets through for both browser and fullscreen mobile layouts", () => {
    expect(safeAreaInsetsForSurface("browser", PHONE_SAFE_AREA)).toEqual(PHONE_SAFE_AREA);
    expect(safeAreaInsetsForSurface("mobile", PHONE_SAFE_AREA)).toEqual(PHONE_SAFE_AREA);
  });

  it("keeps compact play controls and review feedback outside phone cutout/home-indicator zones", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height, safeArea: PHONE_SAFE_AREA });
    const feedback = computeFeedbackCardLayout(width, height, layout.contentPanel, undefined, PHONE_SAFE_AREA);

    expect(layout.topOffset).toBe(190 + PHONE_SAFE_AREA.top);
    expect(layout.bottomOffset).toBe(136 + PHONE_SAFE_AREA.bottom);
    expect(layout.resolveButton.y).toBe(compactPlayControlRowY(height, PHONE_SAFE_AREA));
    expect(edges(layout.resolveButton).bottom).toBe(height - PHONE_SAFE_AREA.bottom - 12);
    expect(withinSafeRect(layout.resolveButton, width, height)).toBe(true);
    expect(withinSafeRect(layout.clearButton, width, height)).toBe(true);
    expect(withinSafeRect(layout.muteButton, width, height)).toBe(true);
    expect(withinSafeRect(layout.exitButton, width, height)).toBe(true);
    expect(edges(feedback).bottom).toBeLessThanOrEqual(edges(layout.resolveButton).top - 8);
  });

  it("places the compact HUD below the safe-area top inset", () => {
    const width = 390;
    const layout = computePlayLayout({ width, height: 844, safeArea: PHONE_SAFE_AREA });
    const hud = computeHudLayout(width, layout.contentPanel, PHONE_SAFE_AREA);

    expect(hud.background.y).toBe(PHONE_SAFE_AREA.top + 12);
    expect(hud.credits.y).toBeGreaterThan(PHONE_SAFE_AREA.top);
    expect(hud.time.y).toBeGreaterThan(PHONE_SAFE_AREA.top);
  });

  it("centers terminal panels inside the safe viewport instead of the physical viewport", () => {
    const width = 390;
    const height = 844;
    const expectedCenterY = PHONE_SAFE_AREA.top + (height - PHONE_SAFE_AREA.top - PHONE_SAFE_AREA.bottom) / 2;
    const menu = computeMenuLayout(width, height, PHONE_SAFE_AREA);
    const results = computeResultsLayout(width, height, PHONE_SAFE_AREA);
    const tutorialComplete = computeTutorialCompleteLayout(width, height, PHONE_SAFE_AREA);

    expect(menu.card.y).toBe(expectedCenterY);
    expect(results.panel.y).toBe(expectedCenterY);
    expect(tutorialComplete.panel.y).toBe(expectedCenterY);
    expect(withinSafeRect(menu.card, width, height)).toBe(true);
    expect(withinSafeRect(results.panel, width, height)).toBe(true);
    expect(withinSafeRect(tutorialComplete.panel, width, height)).toBe(true);
  });
});
