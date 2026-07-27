import { describe, expect, it } from "vitest";
import {
  PlayInputRoutingSystem,
  type PlayInputPointer
} from "../src/game/systems/PlayInputRoutingSystem";

function pointer(
  id: number,
  downTime: number,
  options: Partial<Omit<PlayInputPointer, "id" | "downTime">> = {}
): PlayInputPointer {
  const wasTouch = options.wasTouch ?? false;
  return {
    id,
    downTime,
    button: options.button ?? 0,
    primaryDown: options.primaryDown ?? !wasTouch,
    wasTouch,
    wasCanceled: options.wasCanceled ?? false
  };
}

describe("PlayInputRoutingSystem", () => {
  it("keeps one slice owner through continuation and matching release", () => {
    const router = new PlayInputRoutingSystem();
    const owner = pointer(1, 100, { wasTouch: true });

    expect(router.beginSlice(owner)).toBe(true);
    expect(router.beginSlice(owner)).toBe(true);
    expect(router.ownsSlice(owner)).toBe(true);
    expect(router.endPointer(owner)).toEqual({
      kind: "slice",
      pointerId: 1,
      gestureId: 100
    });
    expect(router.hasOwner()).toBe(false);
  });

  it("prevents a secondary pointer from sampling or ending a slice", () => {
    const router = new PlayInputRoutingSystem();
    const owner = pointer(1, 100, { wasTouch: true });
    const other = pointer(2, 101, { wasTouch: true });

    expect(router.beginSlice(owner)).toBe(true);
    expect(router.beginSlice(other)).toBe(false);
    expect(router.endPointer(other)).toBeUndefined();
    expect(router.ownsSlice(owner)).toBe(true);
  });

  it("activates only the control that owns the matching gesture", () => {
    const router = new PlayInputRoutingSystem();
    const touch = pointer(1, 100, { wasTouch: true });

    expect(router.releaseControl("resolve", touch)).toBe("ignore");
    expect(router.beginControl("clear", touch)).toBe(true);
    expect(router.releaseControl("resolve", touch)).toBe("ignore");
    expect(router.releaseControl("clear", touch)).toBe("activate");
  });

  it("keeps a canceled control gesture blocked from slicing until terminal release", () => {
    const router = new PlayInputRoutingSystem();
    const touch = pointer(1, 100, { wasTouch: true });

    expect(router.beginControl("clear", touch)).toBe(true);
    expect(router.cancelControl("clear", touch)).toBe(true);
    expect(router.beginSlice(touch)).toBe(false);
    expect(router.releaseControl("clear", touch)).toBe("cancel");
    expect(router.beginSlice(pointer(1, 200, { wasTouch: true }))).toBe(true);
  });

  it("does not reacquire a canceled gesture from continuation after canvas exit", () => {
    const router = new PlayInputRoutingSystem();
    const touch = pointer(1, 100, { wasTouch: true });

    expect(router.beginControl("clear", touch)).toBe(true);
    expect(router.cancelAll()?.kind).toBe("control");
    expect(router.continueSlice(touch)).toBe(false);
    expect(router.ownsPointer(touch)).toBe(false);
  });

  it("rejects canceled touch activation", () => {
    const router = new PlayInputRoutingSystem();
    const down = pointer(1, 100, { wasTouch: true });
    const canceled = pointer(1, 100, { wasTouch: true, wasCanceled: true });

    expect(router.beginControl("exit", down)).toBe(true);
    expect(router.releaseControl("exit", canceled)).toBe("cancel");
  });

  it.each([1, 2])("rejects mouse button %i for controls and slicing", (button) => {
    const router = new PlayInputRoutingSystem();
    const mouse = pointer(1, 100, { button });

    expect(router.beginControl("mute", mouse)).toBe(false);
    expect(router.beginSlice(mouse)).toBe(false);
  });

  it("rejects a macOS control-click without blocking the next primary gesture", () => {
    const router = new PlayInputRoutingSystem();
    const controlClick = pointer(1, 100, { button: 0, primaryDown: false });

    expect(router.beginControl("mute", controlClick)).toBe(false);
    expect(router.beginSlice(controlClick)).toBe(false);
    expect(router.beginControl("mute", pointer(1, 200))).toBe(true);
  });

  it("ignores a wrong-button release for a primary owner", () => {
    const router = new PlayInputRoutingSystem();
    const down = pointer(1, 100);
    const wrongUp = pointer(1, 100, { button: 2, primaryDown: false });
    const primaryUp = pointer(1, 100, { primaryDown: false });

    expect(router.beginSlice(down)).toBe(true);
    expect(router.endPointer(wrongUp)).toBeUndefined();
    expect(router.ownsSlice(down)).toBe(true);
    expect(router.endPointer(primaryUp)?.kind).toBe("slice");
  });

  it("conservatively returns and clears the owner on cancellation", () => {
    const router = new PlayInputRoutingSystem();
    const touch = pointer(1, 100, { wasTouch: true });

    router.beginControl("resolve", touch);

    expect(router.cancelAll()).toMatchObject({ kind: "control", controlId: "resolve" });
    expect(router.cancelAll()).toBeUndefined();
  });

  it("matches ownership by both pointer and gesture identity", () => {
    const router = new PlayInputRoutingSystem();
    const owner = pointer(1, 100, { wasTouch: true });

    router.beginSlice(owner);

    expect(router.ownsPointer(owner)).toBe(true);
    expect(router.ownsPointer(pointer(1, 101, { wasTouch: true }))).toBe(false);
    expect(router.ownsPointer(pointer(2, 100, { wasTouch: true }))).toBe(false);
  });
});
