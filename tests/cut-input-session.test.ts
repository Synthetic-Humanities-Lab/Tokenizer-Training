import { describe, expect, it } from "vitest";
import { CutInputSessionSystem } from "../src/game/systems/CutInputSessionSystem";

const bounds = { left: 0, top: 0, bottom: 40, width: 210 };

describe("CutInputSessionSystem", () => {
  it("accepts a precise desktop mouse cut at an available slot", () => {
    const system = new CutInputSessionSystem();
    const result = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 105, y: 20 },
      text: "the cat",
      viewportWidth: 1280
    });

    expect(result.cuts).toEqual([3]);
    expect(result.addedCuts).toEqual([3]);
    expect(result.lastPoint).toEqual({ x: 105, y: 20 });
  });

  it("keeps desktop precise while allowing a nearby portrait touch cut", () => {
    const system = new CutInputSessionSystem();
    const sample = {
      bounds,
      currentCuts: [],
      point: { x: 127, y: 20 },
      text: "the cat"
    };

    expect(system.applySample({ ...sample, viewportWidth: 1280 }).cuts).toEqual([]);
    expect(system.applySample({ ...sample, viewportWidth: 390 }).cuts).toEqual([3]);
  });

  it("registers a fast swipe crossing between sampled pointer positions", () => {
    const system = new CutInputSessionSystem();
    const first = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 83, y: 20 },
      text: "the cat",
      viewportWidth: 1280
    });
    const second = system.applySample({
      bounds,
      currentCuts: first.cuts,
      lastPoint: first.lastPoint,
      point: { x: 127, y: 20 },
      text: "the cat",
      viewportWidth: 1280
    });

    expect(first.cuts).toEqual([]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([3]);
  });

  it("does not add an adjacent near cut when a space-run slot was crossed", () => {
    const system = new CutInputSessionSystem();
    const result = system.applySample({
      bounds,
      currentCuts: [],
      lastPoint: { x: 92, y: 20 },
      point: { x: 148, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(result.cuts).toEqual([3]);
    expect(result.addedCuts).toEqual([3]);
  });

  it("does not add the first following word cut when a sample overshoots a space-run slot", () => {
    const system = new CutInputSessionSystem();
    const result = system.applySample({
      bounds,
      currentCuts: [],
      lastPoint: { x: 92, y: 20 },
      point: { x: 154, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(result.cuts).toEqual([3]);
    expect(result.addedCuts).toEqual([3]);
  });

  it("does not add following word cuts when a fast swipe crosses a multi-space run", () => {
    const system = new CutInputSessionSystem();
    const result = system.applySample({
      bounds: { left: 0, top: 0, bottom: 40, width: 240 },
      currentCuts: [],
      lastPoint: { x: 110, y: 20 },
      point: { x: 190, y: 20 },
      text: "the  cat",
      viewportWidth: 390
    });

    expect(result.cuts).toEqual([3]);
    expect(result.addedCuts).toEqual([3]);
  });

  it("redirects a near-space portrait tap to the centered space-run cut", () => {
    const system = new CutInputSessionSystem();
    const result = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 132, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(result.cuts).toEqual([3]);
    expect(result.addedCuts).toEqual([3]);
  });

  it("does not add a second near-space cut after the centered space-run cut already exists", () => {
    const system = new CutInputSessionSystem();
    const first = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 112, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    system.endGesture();
    const second = system.applySample({
      bounds,
      currentCuts: first.cuts,
      point: { x: 132, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([3]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([]);
  });

  it("does not add a following word cut after a multi-space run cut in the same gesture", () => {
    const system = new CutInputSessionSystem();
    const multiSpaceBounds = { left: 0, top: 0, bottom: 40, width: 240 };
    const first = system.applySample({
      bounds: multiSpaceBounds,
      currentCuts: [],
      point: { x: 120, y: 20 },
      text: "the  cat",
      viewportWidth: 390
    });
    const second = system.applySample({
      bounds: multiSpaceBounds,
      currentCuts: first.cuts,
      lastPoint: first.lastPoint,
      point: { x: 190, y: 20 },
      text: "the  cat",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([3]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([]);
  });

  it("still allows a deliberate following-token cut after a space-run on compact text", () => {
    const system = new CutInputSessionSystem();
    const compactBounds = { left: 0, top: 0, bottom: 40, width: 120 };
    const spaceCut = system.applySample({
      bounds: compactBounds,
      currentCuts: [],
      point: { x: 60, y: 20 },
      text: "it $19",
      viewportWidth: 390
    });
    system.endGesture();
    const moneyCut = system.applySample({
      bounds: compactBounds,
      currentCuts: spaceCut.cuts,
      point: { x: 80, y: 20 },
      text: "it $19",
      viewportWidth: 390
    });

    expect(spaceCut.cuts).toEqual([2]);
    expect(moneyCut.cuts).toEqual([2, 4]);
    expect(moneyCut.addedCuts).toEqual([4]);
  });

  it("does not add a following word cut after a space-run cut in the same gesture", () => {
    const system = new CutInputSessionSystem();
    const first = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 112, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    const second = system.applySample({
      bounds,
      currentCuts: first.cuts,
      lastPoint: first.lastPoint,
      point: { x: 150, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([3]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([]);
  });

  it("does not add farther following-word cuts after a space-run cut in the same gesture", () => {
    const system = new CutInputSessionSystem();
    const first = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 112, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    const second = system.applySample({
      bounds,
      currentCuts: first.cuts,
      lastPoint: first.lastPoint,
      point: { x: 181, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([3]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([]);
  });

  it("replaces a following word overshoot with the space-run cut inside one gesture", () => {
    const system = new CutInputSessionSystem();
    const first = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 150, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    const second = system.applySample({
      bounds,
      currentCuts: first.cuts,
      lastPoint: first.lastPoint,
      point: { x: 107, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([5]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([3]);
  });

  it("replaces a farther following-word overshoot with the space-run cut inside one gesture", () => {
    const system = new CutInputSessionSystem();
    const first = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 181, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    const second = system.applySample({
      bounds,
      currentCuts: first.cuts,
      lastPoint: first.lastPoint,
      point: { x: 107, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([6]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([3]);
  });

  it("does not add the first following word cut after an ordinary space-run restart", () => {
    const system = new CutInputSessionSystem();
    const first = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 112, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    system.endGesture();
    const second = system.applySample({
      bounds,
      currentCuts: first.cuts,
      point: { x: 150, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([3]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([]);
  });

  it("suppresses farther following-word cuts after an ordinary space-run cut already exists", () => {
    const system = new CutInputSessionSystem();
    const first = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 112, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    system.endGesture();
    const second = system.applySample({
      bounds,
      currentCuts: first.cuts,
      point: { x: 181, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([3]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([]);
  });

  it("suppresses farther following-word cuts after a staged multi-space run", () => {
    const system = new CutInputSessionSystem();
    const multiSpaceBounds = { left: 0, top: 0, bottom: 40, width: 240 };
    const first = system.applySample({
      bounds: multiSpaceBounds,
      currentCuts: [],
      point: { x: 120, y: 20 },
      text: "the  cat",
      viewportWidth: 390
    });
    system.endGesture();
    const second = system.applySample({
      bounds: multiSpaceBounds,
      currentCuts: first.cuts,
      point: { x: 210, y: 20 },
      text: "the  cat",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([3]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([]);
  });

  it("removes an ordinary following-word duplicate when a restarted drag returns to the staged space-run cut", () => {
    const system = new CutInputSessionSystem();
    const spaceCut = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 112, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    system.endGesture();
    const restartNearSpace = system.applySample({
      bounds,
      currentCuts: [...spaceCut.cuts, 6],
      point: { x: 112, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(restartNearSpace.cuts).toEqual([3]);
    expect(restartNearSpace.addedCuts).toEqual([]);
    expect(restartNearSpace.removedCuts).toEqual([6]);
  });

  it("keeps deliberate non-word following-token cuts when a later gesture returns to the space run", () => {
    const system = new CutInputSessionSystem();
    const compactBounds = { left: 0, top: 0, bottom: 40, width: 120 };
    const spaceCut = system.applySample({
      bounds: compactBounds,
      currentCuts: [],
      point: { x: 60, y: 20 },
      text: "it $19",
      viewportWidth: 390
    });
    system.endGesture();
    const moneyCut = system.applySample({
      bounds: compactBounds,
      currentCuts: spaceCut.cuts,
      point: { x: 80, y: 20 },
      text: "it $19",
      viewportWidth: 390
    });
    system.endGesture();
    const restartNearSpace = system.applySample({
      bounds: compactBounds,
      currentCuts: moneyCut.cuts,
      point: { x: 60, y: 20 },
      text: "it $19",
      viewportWidth: 390
    });

    expect(moneyCut.cuts).toEqual([2, 4]);
    expect(restartNearSpace.cuts).toEqual([2, 4]);
    expect(restartNearSpace.addedCuts).toEqual([]);
    expect(restartNearSpace.removedCuts).toEqual([]);
  });

  it("suppresses a restarted drag that begins on an already-staged space-run cut", () => {
    const system = new CutInputSessionSystem();
    const spaceCut = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 112, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    system.endGesture();
    const gestureStart = system.applySample({
      bounds,
      currentCuts: spaceCut.cuts,
      point: { x: 112, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    const gestureEnd = system.applySample({
      bounds,
      currentCuts: gestureStart.cuts,
      lastPoint: gestureStart.lastPoint,
      point: { x: 181, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(gestureStart.cuts).toEqual([3]);
    expect(gestureStart.addedCuts).toEqual([]);
    expect(gestureEnd.cuts).toEqual([3]);
    expect(gestureEnd.addedCuts).toEqual([]);
  });

  it("suppresses following-word cuts for a restarted drag that begins near the staged space-run cut", () => {
    const system = new CutInputSessionSystem();
    const spaceCut = system.applySample({
      bounds,
      currentCuts: [],
      point: { x: 112, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    system.endGesture();
    const gestureStart = system.applySample({
      bounds,
      currentCuts: spaceCut.cuts,
      point: { x: 145, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });
    const gestureEnd = system.applySample({
      bounds,
      currentCuts: gestureStart.cuts,
      lastPoint: gestureStart.lastPoint,
      point: { x: 181, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(gestureStart.cuts).toEqual([3]);
    expect(gestureStart.addedCuts).toEqual([]);
    expect(gestureEnd.cuts).toEqual([3]);
    expect(gestureEnd.addedCuts).toEqual([]);
  });

  it("still accepts exact multi-cuts away from space-run slots", () => {
    const system = new CutInputSessionSystem();
    const result = system.applySample({
      bounds: { left: 0, top: 0, bottom: 40, width: 210 },
      currentCuts: [],
      lastPoint: { x: 60, y: 20 },
      point: { x: 150, y: 20 },
      text: "abcde",
      viewportWidth: 390
    });

    expect(result.cuts).toEqual([2, 3]);
    expect(result.addedCuts).toEqual([2, 3]);
  });

  it("collapses a short local swipe over two dense slots to the release-side cut", () => {
    const system = new CutInputSessionSystem();
    const result = system.applySample({
      bounds: { left: 0, top: 0, bottom: 40, width: 210 },
      currentCuts: [],
      lastPoint: { x: 70, y: 20 },
      point: { x: 135, y: 20 },
      text: "abcde",
      viewportWidth: 390
    });

    expect(result.cuts).toEqual([3]);
    expect(result.addedCuts).toEqual([3]);
  });

  it("collapses a short local swipe over two dense slots in reverse direction", () => {
    const system = new CutInputSessionSystem();
    const result = system.applySample({
      bounds: { left: 0, top: 0, bottom: 40, width: 210 },
      currentCuts: [],
      lastPoint: { x: 135, y: 20 },
      point: { x: 70, y: 20 },
      text: "abcde",
      viewportWidth: 390
    });

    expect(result.cuts).toEqual([2]);
    expect(result.addedCuts).toEqual([2]);
  });

  it("replaces an early same-gesture dense cut when a short swipe ends on the adjacent slot", () => {
    const system = new CutInputSessionSystem();
    const first = system.applySample({
      bounds: { left: 0, top: 0, bottom: 40, width: 210 },
      currentCuts: [],
      point: { x: 70, y: 20 },
      text: "abcde",
      viewportWidth: 390
    });
    const second = system.applySample({
      bounds: { left: 0, top: 0, bottom: 40, width: 210 },
      currentCuts: first.cuts,
      lastPoint: first.lastPoint,
      point: { x: 135, y: 20 },
      text: "abcde",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([2]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([3]);
    expect(second.removedCuts).toEqual([2]);
    expect(second.replacedCuts).toEqual([2]);
  });

  it("replaces a nearby early cut when the same short swipe reaches the intended word edge", () => {
    const system = new CutInputSessionSystem();
    const textBounds = { left: 242, top: 328, bottom: 361, width: 476 };
    const first = system.applySample({
      bounds: textBounds,
      currentCuts: [],
      point: { x: 293, y: 344 },
      text: "the cat sat on the mat",
      viewportWidth: 960,
      hinted: true
    });
    const second = system.applySample({
      bounds: textBounds,
      currentCuts: first.cuts,
      lastPoint: first.lastPoint,
      point: { x: 312, y: 344 },
      text: "the cat sat on the mat",
      viewportWidth: 960,
      hinted: true
    });
    const settled = system.applySample({
      bounds: textBounds,
      currentCuts: second.cuts,
      lastPoint: second.lastPoint,
      point: { x: 342, y: 344 },
      text: "the cat sat on the mat",
      viewportWidth: 960,
      hinted: true
    });

    expect(first.cuts).toEqual([2]);
    expect(second.cuts).toEqual([3]);
    expect(second.addedCuts).toEqual([3]);
    expect(second.removedCuts).toEqual([2]);
    expect(second.replacedCuts).toEqual([2]);
    expect(settled.cuts).toEqual([3]);
    expect(settled.addedCuts).toEqual([]);
  });

  it("keeps sampled dense cuts when the same gesture becomes a longer sweep", () => {
    const system = new CutInputSessionSystem();
    const first = system.applySample({
      bounds: { left: 0, top: 0, bottom: 40, width: 210 },
      currentCuts: [],
      point: { x: 70, y: 20 },
      text: "abcde",
      viewportWidth: 390
    });
    const second = system.applySample({
      bounds: { left: 0, top: 0, bottom: 40, width: 210 },
      currentCuts: first.cuts,
      lastPoint: first.lastPoint,
      point: { x: 190, y: 20 },
      text: "abcde",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([2]);
    expect(second.cuts).toEqual([2, 3, 4]);
    expect(second.addedCuts).toEqual([3, 4]);
    expect(second.removedCuts).toEqual([]);
    expect(second.replacedCuts).toEqual([]);
  });

  it("lets a long contraction swipe reach the later token edge instead of collapsing everything to the first blank", () => {
    const system = new CutInputSessionSystem();
    const result = system.applySample({
      bounds: { left: 0, top: 0, bottom: 40, width: 380 },
      currentCuts: [],
      lastPoint: { x: 18, y: 20 },
      point: { x: 145, y: 20 },
      text: "I can't believe it.",
      viewportWidth: 390
    });

    expect(result.cuts).toEqual([1, 7]);
    expect(result.addedCuts).toEqual([1, 7]);
  });

  it("allows the contraction punctuation boundary after the leading-space boundary is already staged", () => {
    const system = new CutInputSessionSystem();
    const textBounds = { left: 0, top: 0, bottom: 40, width: 380 };
    const leadingSpace = system.applySample({
      bounds: textBounds,
      currentCuts: [],
      point: { x: 30, y: 20 },
      text: "I can't believe it.",
      viewportWidth: 390
    });
    system.endGesture();
    const contraction = system.applySample({
      bounds: textBounds,
      currentCuts: leadingSpace.cuts,
      point: { x: 100, y: 20 },
      text: "I can't believe it.",
      viewportWidth: 390
    });

    expect(leadingSpace.cuts).toEqual([1]);
    expect(contraction.cuts).toEqual([1, 5]);
    expect(contraction.addedCuts).toEqual([5]);
  });

  it("allows the final punctuation boundary after a leading-space word token is already staged", () => {
    const system = new CutInputSessionSystem();
    const textBounds = { left: 0, top: 0, bottom: 40, width: 380 };
    const leadingIt = system.applySample({
      bounds: textBounds,
      currentCuts: [],
      point: { x: 310, y: 20 },
      text: "I can't believe it.",
      viewportWidth: 390
    });
    system.endGesture();
    const period = system.applySample({
      bounds: textBounds,
      currentCuts: leadingIt.cuts,
      point: { x: 360, y: 20 },
      text: "I can't believe it.",
      viewportWidth: 390
    });

    expect(leadingIt.cuts).toEqual([15]);
    expect(period.cuts).toEqual([15, 18]);
    expect(period.addedCuts).toEqual([18]);
  });

  it("preserves unique cuts and clears gesture state on pointer release", () => {
    const system = new CutInputSessionSystem();
    const first = system.applySample({
      bounds,
      currentCuts: [3],
      point: { x: 105, y: 20 },
      text: "the cat",
      viewportWidth: 390
    });

    expect(first.cuts).toEqual([3]);
    expect(first.addedCuts).toEqual([]);
    expect(system.endGesture()).toBeUndefined();
  });
});
