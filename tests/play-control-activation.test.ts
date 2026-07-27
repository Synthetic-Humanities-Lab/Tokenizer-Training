import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { bindPlayControlActivation } from "../src/game/systems/PlayControlActivationSystem";
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

function harness(router = new PlayInputRoutingSystem()) {
  const button = new EventEmitter();
  const visuals: string[] = [];
  let activations = 0;
  const dispose = bindPlayControlActivation({
    controlId: "resolve",
    button,
    router,
    onRest: () => visuals.push("rest"),
    onHover: () => visuals.push("hover"),
    onPress: () => visuals.push("press"),
    onActivate: () => {
      visuals.push("activate");
      activations += 1;
    }
  });
  return { router, button, visuals, activations: () => activations, dispose };
}

describe("play control activation", () => {
  it("applies mouse release feedback before activation", () => {
    const control = harness();
    const down = pointer(1, 100);
    const up = pointer(1, 100, { primaryDown: false });

    control.button.emit("pointerover", down);
    control.button.emit("pointerdown", down);
    control.button.emit("pointerup", up);

    expect(control.visuals).toEqual(["hover", "press", "hover", "activate"]);
    expect(control.activations()).toBe(1);
  });

  it("preserves touch press when Phaser emits over after down", () => {
    const control = harness();
    const touch = pointer(1, 100, { wasTouch: true });

    control.button.emit("pointerdown", touch);
    control.button.emit("pointerover", touch);
    control.button.emit("pointerup", touch);

    expect(control.visuals).toEqual(["press", "rest", "activate"]);
  });

  it("cancels after pointerout and does not rearm on re-entry", () => {
    const control = harness();
    const touch = pointer(1, 100, { wasTouch: true });

    control.button.emit("pointerdown", touch);
    control.button.emit("pointerout", touch);
    control.button.emit("pointerover", touch);
    control.button.emit("pointerup", touch);

    expect(control.visuals).toEqual(["press", "rest", "rest"]);
    expect(control.activations()).toBe(0);
  });

  it("does not activate from a slice-owner release over the control", () => {
    const router = new PlayInputRoutingSystem();
    const control = harness(router);
    const touch = pointer(1, 100, { wasTouch: true });

    router.beginSlice(touch);
    control.button.emit("pointerover", touch);
    control.button.emit("pointerup", touch);

    expect(control.visuals).toEqual([]);
    expect(control.activations()).toBe(0);
    expect(router.ownsSlice(touch)).toBe(true);
  });

  it("keeps a second finger from altering the owner visual or action", () => {
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

  it("removes every listener on destroy", () => {
    const control = harness();

    control.button.emit("destroy");
    control.button.emit("pointerdown", pointer(1, 100));
    control.dispose();

    expect(control.visuals).toEqual([]);
    expect(control.button.listenerCount("pointerdown")).toBe(0);
    expect(control.button.listenerCount("pointerup")).toBe(0);
  });
});
