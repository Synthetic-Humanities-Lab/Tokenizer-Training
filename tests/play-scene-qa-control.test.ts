import { describe, expect, it } from "vitest";
import {
  parseQaCanvasCapture,
  parseQaFreezeElapsedMs,
  playSceneQaControlsFromUrl
} from "../src/game/systems/PlaySceneQaControlSystem";

describe("PlayScene QA controls", () => {
  it("reads a deterministic active-round freeze from query parameters", () => {
    expect(
      playSceneQaControlsFromUrl("http://127.0.0.1:5173/?mode=tutorial&qaFreezeElapsedMs=6200")
    ).toEqual({
      freezeElapsedMs: 6200
    });
  });

  it("reads a deterministic active-round freeze from hash parameters", () => {
    expect(
      playSceneQaControlsFromUrl("http://127.0.0.1:5173/?mode=tutorial#qaFreezeElapsedMs=3000")
    ).toEqual({
      freezeElapsedMs: 3000
    });
  });

  it("ignores malformed freeze values instead of coercing them", () => {
    expect(parseQaFreezeElapsedMs(null)).toBeUndefined();
    expect(parseQaFreezeElapsedMs("")).toBeUndefined();
    expect(parseQaFreezeElapsedMs("-1")).toBeUndefined();
    expect(parseQaFreezeElapsedMs("1200.5")).toBeUndefined();
    expect(parseQaFreezeElapsedMs("soon")).toBeUndefined();
    expect(playSceneQaControlsFromUrl("not a url")).toEqual({});
  });

  it("caps extreme freeze values so QA URLs cannot force unbounded elapsed time", () => {
    expect(parseQaFreezeElapsedMs("999999")).toBe(120_000);
  });

  it("keeps canvas QA capture opt-in so normal play does not encode frames during pointer input", () => {
    expect(parseQaCanvasCapture(null)).toBeUndefined();
    expect(parseQaCanvasCapture("1")).toBe(true);
    expect(parseQaCanvasCapture("true")).toBe(true);
    expect(parseQaCanvasCapture("0")).toBe(false);
    expect(parseQaCanvasCapture("false")).toBe(false);
    expect(parseQaCanvasCapture("later")).toBeUndefined();
    expect(
      playSceneQaControlsFromUrl("http://127.0.0.1:5173/?mode=endless&qaCanvasCapture=1")
    ).toEqual({
      canvasCapture: true
    });
    expect(
      playSceneQaControlsFromUrl("http://127.0.0.1:5173/?mode=endless#qaCanvasCapture=false")
    ).toEqual({
      canvasCapture: false
    });
  });
});
