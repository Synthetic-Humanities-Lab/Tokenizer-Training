import { describe, expect, it } from "vitest";
import { PointerActivationGuard } from "../src/game/systems/PointerActivationGuard";

describe("PointerActivationGuard", () => {
  it("activates only when the same pointer began on the control", () => {
    const guard = new PointerActivationGuard();

    expect(guard.release(1, 100)).toBe("ignore");
    expect(guard.press(1, 100)).toBe(true);
    expect(guard.release(2, 100)).toBe("ignore");
    expect(guard.release(1, 100)).toBe("activate");
    expect(guard.release(1, 100)).toBe("ignore");
  });

  it("rejects a later gesture that reuses the same pointer id", () => {
    const guard = new PointerActivationGuard();

    expect(guard.press(1, 100)).toBe(true);

    expect(guard.release(1, 200)).toBe("cancel");
    expect(guard.release(1, 100)).toBe("ignore");
  });

  it("cancels activation when the armed pointer leaves the control", () => {
    const guard = new PointerActivationGuard();

    expect(guard.press(7, 100)).toBe(true);
    expect(guard.cancel(7)).toBe(true);

    expect(guard.release(7, 100)).toBe("ignore");
  });

  it("gives one pointer ownership and ignores other fingers", () => {
    const guard = new PointerActivationGuard();

    expect(guard.press(3, 100)).toBe(true);
    expect(guard.press(4, 101)).toBe(false);
    expect(guard.isOwnedBy(3)).toBe(true);
    expect(guard.isOwnedBy(4)).toBe(false);
    expect(guard.isOwnedByAnother(4)).toBe(true);
    expect(guard.isOwnedByAnother(3)).toBe(false);
    expect(guard.cancel(4)).toBe(false);
    expect(guard.release(4, 101)).toBe("ignore");
    expect(guard.release(3, 100)).toBe("activate");
    expect(guard.isOwnedBy(3)).toBe(false);
    expect(guard.isOwnedByAnother(4)).toBe(false);
  });

  it("rejects canceled touch releases", () => {
    const guard = new PointerActivationGuard();

    expect(guard.press(3, 100)).toBe(true);
    expect(guard.release(3, 100, true)).toBe("cancel");
  });

  it("ignores a repeated down from the same gesture", () => {
    const guard = new PointerActivationGuard();

    expect(guard.press(3, 100)).toBe(true);
    expect(guard.press(3, 100)).toBe(false);
    expect(guard.release(3, 100)).toBe("activate");
  });

  it("can cancel an owner when the scene loses the pointer", () => {
    const guard = new PointerActivationGuard();

    expect(guard.cancelAll()).toBe(false);
    expect(guard.press(3, 100)).toBe(true);
    expect(guard.cancelAll()).toBe(true);
    expect(guard.release(3, 100)).toBe("ignore");
  });
});
