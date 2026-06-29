import { describe, expect, it } from "vitest";
import { sceneClockNow } from "../src/game/systems/SceneClockSystem";

describe("sceneClockNow", () => {
  it("uses the game-loop clock when scene time has not advanced during scene creation", () => {
    expect(sceneClockNow(12345, 0)).toBe(12345);
  });

  it("falls back to scene time when the loop clock is not yet usable", () => {
    expect(sceneClockNow(0, 250)).toBe(250);
    expect(sceneClockNow(Number.NaN, 250)).toBe(250);
  });

  it("returns zero only when neither clock has usable time", () => {
    expect(sceneClockNow(0, 0)).toBe(0);
    expect(sceneClockNow(Number.NaN, Number.NaN)).toBe(0);
  });
});
