import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  parseQaCanvasCapture,
  parseQaCuts,
  parseQaFixtureId,
  parseQaFreezeElapsedMs,
  parseQaHoldReview,
  playSceneQaControlsFromUrl
} from "../src/game/systems/PlaySceneQaControlSystem";

const playSceneSource = readFileSync("src/game/scenes/PlayScene.ts", "utf8");

describe("PlayScene QA controls", () => {
  it("keeps general URL QA controls behind the Vite development gate", () => {
    expect(playSceneSource).toContain(
      "private readonly qaControls: PlaySceneQaControls = import.meta.env.DEV || nativeQaLaunchEnabled()"
    );
    expect(playSceneSource).toContain("capabilities?.qa === true");
  });

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

  it("reads a deterministic fixture override for internal endless QA", () => {
    expect(parseQaFixtureId(null)).toBeUndefined();
    expect(parseQaFixtureId(" simple_001 ")).toBe("simple_001");
    expect(parseQaFixtureId("dense-001")).toBe("dense-001");
    expect(parseQaFixtureId("")).toBeUndefined();
    expect(parseQaFixtureId("../simple_001")).toBeUndefined();
    expect(parseQaFixtureId("simple 001")).toBeUndefined();
    expect(parseQaFixtureId("Simple_001")).toBeUndefined();
    expect(
      playSceneQaControlsFromUrl("http://127.0.0.1:5173/?mode=endless&qaFixtureId=simple_001")
    ).toEqual({
      fixtureId: "simple_001"
    });
    expect(
      playSceneQaControlsFromUrl("http://127.0.0.1:5173/?mode=endless#qaFixtureId=dense_001")
    ).toEqual({
      fixtureId: "dense_001"
    });
  });

  it("reads a dev-only review hold for stable endless review capture", () => {
    expect(parseQaHoldReview(null)).toBeUndefined();
    expect(parseQaHoldReview("1")).toBe(true);
    expect(parseQaHoldReview("true")).toBe(true);
    expect(parseQaHoldReview("0")).toBe(false);
    expect(parseQaHoldReview("false")).toBe(false);
    expect(parseQaHoldReview("eventually")).toBeUndefined();
    expect(
      playSceneQaControlsFromUrl("http://127.0.0.1:5173/?mode=endless&qaFixtureId=simple_001&qaHoldReview=1")
    ).toEqual({
      fixtureId: "simple_001",
      holdReview: true
    });
  });

  it("parses strict grapheme cut indexes and fails closed", () => {
    expect(parseQaCuts(null)).toBeUndefined();
    expect(parseQaCuts("3,7,11,14,18")).toEqual([3, 7, 11, 14, 18]);
    expect(parseQaCuts(" 3,7,11 ")).toEqual([3, 7, 11]);
    expect(parseQaCuts("")).toBeUndefined();
    expect(parseQaCuts("3,,7")).toBeUndefined();
    expect(parseQaCuts("3.5,7")).toBeUndefined();
    expect(parseQaCuts("0,7")).toBeUndefined();
    expect(parseQaCuts("3,3")).toBeUndefined();
    expect(
      playSceneQaControlsFromUrl(
        "http://127.0.0.1:5173/?mode=endless&qaFixtureId=simple_001&qaCuts=3,7,11,14,18&qaAutoResolve=1&qaHoldSplit=1"
      )
    ).toEqual({
      fixtureId: "simple_001",
      cuts: [3, 7, 11, 14, 18],
      autoResolve: true,
      holdSplit: true
    });
  });
});
