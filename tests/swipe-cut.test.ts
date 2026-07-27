import { describe, expect, it } from "vitest";
import { SwipeCutSystem } from "../src/game/systems/SwipeCutSystem";

describe("SwipeCutSystem", () => {
  it("snaps to the nearest boundary inside the vertical band", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildMonospaceSlots({ left: 100, top: 40, bottom: 80, width: 200 }, 5);

    expect(system.nearestBoundary(slots, { x: 180, y: 60 }, 8)).toBe(2);
  });

  it("rejects distant or vertically invalid cuts", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildMonospaceSlots({ left: 100, top: 40, bottom: 80, width: 200 }, 5);

    expect(system.nearestBoundary(slots, { x: 180, y: 130 }, 30)).toBeNull();
    expect(system.nearestBoundary(slots, { x: 133, y: 60 }, 5)).toBeNull();
  });

  it("reports only the vertical cut band for trail rendering", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 100, top: 300, bottom: 340, width: 280 }, "the cat");

    expect(system.pointInsideCutBand(slots, { x: 1080, y: 320 })).toBe(true);
    expect(system.pointInsideCutBand(slots, { x: 1080, y: 520 })).toBe(false);
    expect(system.nearestBoundary(slots, { x: 1080, y: 520 }, 26)).toBeNull();
  });

  it("adds valid cuts as sorted unique boundaries", () => {
    const system = new SwipeCutSystem();

    expect(system.addCut([4, 2], 3, 6)).toEqual([2, 3, 4]);
    expect(system.addCut([2, 3], 3, 6)).toEqual([2, 3]);
    expect(system.addCut([2, 3], 6, 6)).toEqual([2, 3]);
    expect(system.addCuts([4], [3, null, 6, 2], 6)).toEqual([2, 3, 4]);
  });

  it("uses a wider snap target for portrait touch play than desktop mouse play", () => {
    const system = new SwipeCutSystem();

    expect(system.snapDistanceForViewport(390)).toBeGreaterThan(system.snapDistanceForViewport(1280));
    expect(system.snapDistanceForViewport(390)).toBeLessThanOrEqual(28);
    expect(system.snapDistanceForViewport(1280)).toBe(20);
  });

  it("keeps desktop precise while accepting a nearby portrait touch cut", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 210 }, "the cat");

    expect(system.nearestBoundary(slots, { x: 127, y: 20 }, system.snapDistanceForViewport(1280))).toBeNull();
    expect(system.nearestBoundary(slots, { x: 127, y: 20 }, system.snapDistanceForViewport(390))).toBe(3);
  });

  it("previews a legal slot before compact touch input is close enough to stage a cut", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 350 }, "the cat");
    const point = { x: 205, y: 20 };

    expect(system.nearestBoundary(slots, point, system.snapDistanceForViewport(390))).toBeNull();
    expect(system.nearestPreviewSlot(slots, point, [], 390)?.index).toBe(3);
  });

  it("does not preview a cut that has already been staged", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 350 }, "the cat");

    expect(system.nearestPreviewSlot(slots, { x: 205, y: 20 }, [3], 390)).toBeNull();
  });

  it("keeps preview guidance available for the nearest unstaged slot beside a staged cut", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 210 }, "the cat");

    expect(system.nearestBoundary(slots, { x: 118, y: 20 }, system.snapDistanceForViewport(1280))).toBe(3);
    expect(system.nearestPreviewSlot(slots, { x: 118, y: 20 }, [3], 1280)?.index).toBe(5);
  });

  it("registers a fast swipe that crosses a slot between sampled pointer positions", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 210 }, "the cat");

    expect(system.nearestBoundary(slots, { x: 92, y: 20 }, 8)).toBeNull();
    expect(system.nearestBoundary(slots, { x: 118, y: 20 }, 8)).toBeNull();
    expect(system.boundariesCrossedBySegment(slots, { x: 92, y: 20 }, { x: 118, y: 20 })).toEqual([3]);
  });

  it("registers a fast vertical slash through a slot between sampled pointer positions", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 210 }, "the cat");

    expect(system.nearestBoundary(slots, { x: 105, y: -40 }, 8)).toBeNull();
    expect(system.nearestBoundary(slots, { x: 105, y: 90 }, 8)).toBeNull();
    expect(system.boundariesCrossedBySegment(slots, { x: 105, y: -40 }, { x: 105, y: 90 })).toEqual([3]);
  });

  it("uses snap tolerance for near-vertical slash segments without accepting distant misses", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 210 }, "the cat");

    expect(system.boundariesCrossedBySegment(slots, { x: 100, y: -40 }, { x: 100, y: 90 }, 8)).toEqual([3]);
    expect(system.boundariesCrossedBySegment(slots, { x: 96, y: -40 }, { x: 96, y: 90 }, 8)).toEqual([]);
  });

  it("limits tolerant vertical slashes to the closest dense slot", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildMonospaceSlots({ left: 0, top: 0, bottom: 40, width: 80 }, 8);

    expect(system.boundariesCrossedBySegment(slots, { x: 36, y: -40 }, { x: 36, y: 90 }, 16)).toEqual([4]);
  });

  it("does not register crossed slots when the swipe passes outside the cut band", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 210 }, "the cat");

    expect(system.boundariesCrossedBySegment(slots, { x: 92, y: 90 }, { x: 118, y: 90 })).toEqual([]);
  });

  it("returns multiple crossed slots in gesture order", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 210 }, "the cat");

    expect(system.boundariesCrossedBySegment(slots, { x: 190, y: 20 }, { x: 20, y: 20 })).toEqual([6, 5, 3, 2, 1]);
  });

  it("represents an ordinary space with one centered playable slot", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 210 }, "the cat");

    expect(slots.map((slot) => slot.index)).toEqual([1, 2, 3, 5, 6]);
    expect(slots.find((slot) => slot.index === 3)?.x).toBe(105);
    expect(slots.find((slot) => slot.index === 4)).toBeUndefined();
    expect(system.nearestBoundary(slots, { x: 105, y: 20 }, 8)).toBe(3);
  });

  it("exposes both sides of an underscore as independently playable slots", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 190 }, "invoice_final04");
    const indexes = slots.map((slot) => slot.index);

    expect(indexes).toContain(7);
    expect(indexes).toContain(8);
    expect(slots.find((slot) => slot.index === 7)?.x).toBeCloseTo(88.67, 2);
    expect(slots.find((slot) => slot.index === 8)?.x).toBeCloseTo(101.33, 2);
    expect(system.unplayableBoundaries([8], "invoice_final04")).toEqual([]);
  });

  it("collapses a repeated space run into one centered playable slot", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots(
      { left: 0, top: 0, bottom: 40, width: 420 },
      "spaces  matter"
    );

    expect(slots.map((slot) => slot.index)).toContain(6);
    expect(slots.map((slot) => slot.index)).not.toContain(7);
    expect(slots.map((slot) => slot.index)).not.toContain(8);
    expect(slots.find((slot) => slot.index === 6)?.x).toBe(210);
  });

  it("centers token boundary evidence over the represented space run", () => {
    const system = new SwipeCutSystem();
    const bounds = { left: 0, top: 0, bottom: 40, width: 420 };
    const textAwareSlots = system.buildTokenBoundarySlots(bounds, "spaces  matter", [6]);
    const numericSlots = system.buildTokenBoundarySlots(bounds, 14, [6]);

    expect(textAwareSlots).toHaveLength(1);
    expect(textAwareSlots[0].index).toBe(6);
    expect(textAwareSlots[0].x).toBe(210);
    expect(numericSlots[0].x).toBe(180);
  });

  it("reports the suppressed second side of a space as unplayable", () => {
    const system = new SwipeCutSystem();

    expect(system.unplayableBoundaries([3], "the cat")).toEqual([]);
    expect(system.unplayableBoundaries([4], "the cat")).toEqual([4]);
  });

  it("detects duplicate pre-space and post-space boundary modeling", () => {
    const system = new SwipeCutSystem();

    expect(system.hasAdjacentSpaceDuplicates([3, 4], "the cat")).toBe(true);
    expect(system.hasAdjacentSpaceDuplicates([3], "the cat")).toBe(false);
  });

  it("collapses a single segment's first post-space overshoot into the pre-space cut", () => {
    const system = new SwipeCutSystem();

    expect(system.collapseSpaceRunGestureDuplicates([3, 5], "the cat")).toEqual([3]);
    expect(system.collapseSpaceRunGestureDuplicates([5, 3], "the cat")).toEqual([3]);
    expect(system.collapseSpaceRunGestureDuplicates([3, 5, 6], "the cat")).toEqual([3]);
    expect(system.collapseSpaceRunGestureDuplicates([5], "the cat")).toEqual([5]);
    expect(system.collapseSpaceRunGestureDuplicates([3, 6], "the cat")).toEqual([3]);
    expect(system.collapseSpaceRunGestureDuplicates([6, 9], "spaces  matter")).toEqual([6]);
    expect(system.collapseSpaceRunGestureDuplicates([6, 9, 10], "spaces  matter")).toEqual([6]);
  });

  it("builds slots from grapheme indexes instead of code-point indexes", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 120 }, "e\u0301x y");

    expect(slots.map((slot) => slot.index)).toEqual([1, 2]);
    expect(slots.find((slot) => slot.index === 1)?.x).toBe(30);
    expect(slots.find((slot) => slot.index === 2)?.x).toBe(75);
    expect(system.boundaryX({ left: 0, top: 0, bottom: 40, width: 120 }, "e\u0301x y", 1)).toBe(30);
  });

  it("does not expose internal emoji code-unit or byte boundaries as playable slots", () => {
    const system = new SwipeCutSystem();
    const slots = system.buildPlayableSlots({ left: 0, top: 0, bottom: 40, width: 200 }, "a 😂 b");

    expect(slots.map((slot) => slot.index)).toEqual([1, 3]);
    expect(slots.find((slot) => slot.index === 1)?.x).toBe(60);
    expect(slots.find((slot) => slot.index === 3)?.x).toBe(140);
  });
});
