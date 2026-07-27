import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { bindCanvasButtonActivation } from "../src/game/systems/CanvasButtonActivationSystem";

interface TestPointer {
  id: number;
  downTime: number;
  button: number;
  primaryDown: boolean;
  wasTouch: boolean;
  wasCanceled: boolean;
}

function pointer(
  id: number,
  downTime: number,
  options: Partial<Pick<TestPointer, "button" | "primaryDown" | "wasTouch" | "wasCanceled">> = {}
): TestPointer {
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

function harness() {
  const button = new EventEmitter();
  const input = new EventEmitter();
  const visuals: string[] = [];
  let activations = 0;
  const dispose = bindCanvasButtonActivation({
    button,
    input,
    onRest: () => visuals.push("rest"),
    onHover: () => visuals.push("hover"),
    onPress: () => visuals.push("press"),
    onActivate: () => {
      visuals.push("activate");
      activations += 1;
    }
  });

  return { button, input, visuals, dispose, activations: () => activations };
}

describe("canvas button activation", () => {
  it("activates after matching mouse press and release, with visual feedback first", () => {
    const control = harness();
    const mouse = pointer(1, 100);

    control.button.emit("pointerover", mouse);
    control.button.emit("pointerdown", mouse);
    control.button.emit("pointerup", mouse);

    expect(control.visuals).toEqual(["hover", "press", "hover", "activate"]);
    expect(control.activations()).toBe(1);
  });

  it("does not activate when release occurs over a control that was never pressed", () => {
    const control = harness();
    const mouse = pointer(1, 100);

    control.button.emit("pointerover", mouse);
    control.button.emit("pointerup", mouse);

    expect(control.visuals).toEqual(["hover"]);
    expect(control.activations()).toBe(0);
  });

  it.each([1, 2])("ignores non-primary mouse button %i", (button) => {
    const control = harness();
    const mouse = pointer(1, 100, { button });

    control.button.emit("pointerover", mouse);
    control.button.emit("pointerdown", mouse);
    control.button.emit("pointerup", mouse);

    expect(control.visuals).toEqual(["hover"]);
    expect(control.activations()).toBe(0);
  });

  it("rejects a macOS control-click remapped away from primary input", () => {
    const control = harness();
    const mouse = pointer(1, 100, { button: 0, primaryDown: false });

    control.button.emit("pointerover", mouse);
    control.button.emit("pointerdown", mouse);
    control.button.emit("pointerup", mouse);

    expect(control.visuals).toEqual(["hover"]);
    expect(control.activations()).toBe(0);
  });

  it("accepts a primary mouse release after Phaser clears primaryDown", () => {
    const control = harness();
    const down = pointer(1, 100);
    const up = pointer(1, 100, { primaryDown: false });

    control.button.emit("pointerdown", down);
    control.button.emit("pointerup", up);

    expect(control.visuals).toEqual(["press", "hover", "activate"]);
    expect(control.activations()).toBe(1);
  });

  it("cancels when the owning pointer leaves the control", () => {
    const control = harness();
    const mouse = pointer(1, 100);

    control.button.emit("pointerdown", mouse);
    control.button.emit("pointerout", mouse);
    control.button.emit("pointerup", mouse);

    expect(control.visuals).toEqual(["press", "rest"]);
    expect(control.activations()).toBe(0);
  });

  it("keeps the owner visual and action isolated from another finger", () => {
    const control = harness();
    const owner = pointer(1, 100, { wasTouch: true });
    const other = pointer(2, 101, { wasTouch: true });

    control.button.emit("pointerdown", owner);
    control.button.emit("pointerover", other);
    control.button.emit("pointerdown", other);
    control.button.emit("pointerup", other);
    control.button.emit("pointerout", other);
    control.button.emit("pointerup", owner);

    expect(control.visuals).toEqual(["press", "rest", "activate"]);
    expect(control.activations()).toBe(1);
  });

  it("rejects canceled touches and returns to rest", () => {
    const control = harness();
    const touch = pointer(1, 100, { wasTouch: true, wasCanceled: true });

    control.button.emit("pointerdown", touch);
    control.button.emit("pointerup", touch);

    expect(control.visuals).toEqual(["press", "rest"]);
    expect(control.activations()).toBe(0);
  });

  it("preserves touch press feedback when Phaser emits over after down", () => {
    const control = harness();
    const touch = pointer(1, 100, { wasTouch: true });

    control.button.emit("pointerdown", touch);
    control.button.emit("pointerover", touch);
    control.button.emit("pointerup", touch);

    expect(control.visuals).toEqual(["press", "rest", "activate"]);
    expect(control.activations()).toBe(1);
  });

  it("cancels an owner released outside the canvas and accepts its next gesture", () => {
    const control = harness();
    const first = pointer(1, 100, { wasTouch: true });
    const second = pointer(1, 200, { wasTouch: true });

    control.button.emit("pointerdown", first);
    control.input.emit("pointerupoutside", first);
    control.button.emit("pointerdown", second);
    control.button.emit("pointerup", second);

    expect(control.visuals).toEqual(["press", "rest", "press", "rest", "activate"]);
    expect(control.activations()).toBe(1);
  });

  it("cancels and resets when the pointer leaves the game canvas", () => {
    const control = harness();
    const mouse = pointer(1, 100);

    control.button.emit("pointerdown", mouse);
    control.input.emit("gameout");
    control.button.emit("pointerup", mouse);

    expect(control.visuals).toEqual(["press", "rest"]);
    expect(control.activations()).toBe(0);
  });

  it("removes scene-input listeners when the button is destroyed", () => {
    const control = harness();

    control.button.emit("destroy");
    control.input.emit("gameout");
    control.input.emit("pointerupoutside", pointer(1, 100));
    control.dispose();

    expect(control.visuals).toEqual([]);
    expect(control.button.listenerCount("pointerup")).toBe(0);
    expect(control.input.listenerCount("gameout")).toBe(0);
    expect(control.input.listenerCount("pointerupoutside")).toBe(0);
  });
});
