import { describe, expect, it } from "vitest";
import { computeTutorialCompleteLayout } from "../src/game/systems/TutorialCompleteLayoutSystem";
import type { LayoutRect } from "../src/game/systems/PlayLayoutSystem";

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
  const re = edges(rect);
  return re.left >= 0 && re.right <= width && re.top >= 0 && re.bottom <= height;
}

describe("computeTutorialCompleteLayout", () => {
  it("keeps portrait tutorial-complete actions inside the panel", () => {
    const layout = computeTutorialCompleteLayout(390, 844);

    expect(layout.compact).toBe(true);
    expect(withinViewport(layout.panel, 390, 844)).toBe(true);
    expect(contains(layout.panel, layout.chrome)).toBe(true);
    expect(contains(layout.panel, layout.primaryButton)).toBe(true);
    expect(contains(layout.panel, layout.menuButton)).toBe(true);
    expect(layout.primaryButton.x).toBe(layout.panel.x);
    expect(layout.menuButton.x).toBe(layout.panel.x);
    expect(overlaps(layout.primaryButton, layout.menuButton)).toBe(false);
  });

  it("keeps narrow portrait buttons comfortably inside the panel", () => {
    const layout = computeTutorialCompleteLayout(320, 568);

    expect(withinViewport(layout.panel, 320, 568)).toBe(true);
    expect(contains(layout.panel, layout.primaryButton)).toBe(true);
    expect(contains(layout.panel, layout.menuButton)).toBe(true);
    expect(edges(layout.menuButton).bottom).toBeLessThanOrEqual(edges(layout.panel).bottom);
    expect(layout.summary.y).toBeLessThan(layout.primaryButton.y);
    expect(edges(layout.primaryButton).top).toBeGreaterThan(layout.summary.y + 34);
  });

  it("keeps desktop tutorial-complete chrome and choices aligned", () => {
    const layout = computeTutorialCompleteLayout(1280, 720);

    expect(layout.compact).toBe(false);
    expect(layout.panel.width).toBe(680);
    expect(contains(layout.panel, layout.chrome)).toBe(true);
    expect(contains(layout.panel, layout.primaryButton)).toBe(true);
    expect(contains(layout.panel, layout.menuButton)).toBe(true);
    expect(layout.primaryButton.width).toBe(340);
    expect(layout.primaryButton.x).toBe(layout.menuButton.x);
    expect(layout.primaryButton.y).toBeLessThan(layout.menuButton.y);
  });
});
