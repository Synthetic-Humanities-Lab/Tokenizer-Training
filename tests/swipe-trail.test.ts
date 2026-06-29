import { describe, expect, it } from "vitest";
import {
  appendTrailPoint,
  buildOrangeBrushTrailSegments,
  MAX_SWIPE_TRAIL_POINTS,
  ORANGE_BRUSH_TRAIL_LAYERS,
  SWIPE_TRAIL_FADE_MS
} from "../src/game/systems/SwipeTrailSystem";

describe("SwipeTrailSystem", () => {
  it("defines a broad layered orange brush trail with a short fade", () => {
    expect(SWIPE_TRAIL_FADE_MS).toBeGreaterThanOrEqual(180);
    expect(SWIPE_TRAIL_FADE_MS).toBeLessThanOrEqual(260);
    expect(ORANGE_BRUSH_TRAIL_LAYERS).toHaveLength(3);
    expect(ORANGE_BRUSH_TRAIL_LAYERS[0]).toMatchObject({ color: 0xffd9a3 });
    expect(ORANGE_BRUSH_TRAIL_LAYERS[0].width).toBeGreaterThan(ORANGE_BRUSH_TRAIL_LAYERS[1].width);
    expect(ORANGE_BRUSH_TRAIL_LAYERS[1].color).toBe(0xf28a2e);
    expect(ORANGE_BRUSH_TRAIL_LAYERS[2].color).toBe(0xffefbd);
  });

  it("builds smoothed tapered segments for each brush layer", () => {
    const segments = buildOrangeBrushTrailSegments([
      { x: 10, y: 40 },
      { x: 40, y: 20 },
      { x: 80, y: 24 },
      { x: 120, y: 18 }
    ]);

    expect(segments).toHaveLength(ORANGE_BRUSH_TRAIL_LAYERS.length * 3);
    expect(segments[0].from).toEqual({ x: 10, y: 40 });
    expect(segments[0].control).toEqual({ x: 10, y: 40 });
    expect(segments[0].to).toEqual({ x: 25, y: 30 });
    expect(segments.at(-1)?.to).toEqual({ x: 120, y: 18 });
    expect(segments[2].width).toBeGreaterThan(segments[0].width);
    expect(segments[2].alpha).toBeGreaterThan(segments[0].alpha);
  });

  it("keeps only the latest trail points when repeated swipes arrive quickly", () => {
    const points = Array.from({ length: MAX_SWIPE_TRAIL_POINTS + 3 }, (_, index) => ({ x: index, y: index * 2 }))
      .reduce((trail, point) => appendTrailPoint(trail, point), [] as Array<{ x: number; y: number }>);

    expect(points).toHaveLength(MAX_SWIPE_TRAIL_POINTS);
    expect(points[0]).toEqual({ x: 3, y: 6 });
    expect(points.at(-1)).toEqual({ x: MAX_SWIPE_TRAIL_POINTS + 2, y: (MAX_SWIPE_TRAIL_POINTS + 2) * 2 });
  });
});
