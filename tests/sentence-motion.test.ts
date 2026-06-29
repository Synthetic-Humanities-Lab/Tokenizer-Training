import { describe, expect, it } from "vitest";
import { computePlayLayout } from "../src/game/systems/PlayLayoutSystem";
import { SentenceMotionSystem } from "../src/game/systems/SentenceMotionSystem";

describe("SentenceMotionSystem", () => {
  it("moves text continuously upward from bottom to top over the round duration", () => {
    const system = new SentenceMotionSystem();
    const state = system.create({
      startY: 700,
      endY: 100,
      durationMs: 6000,
      startedAtMs: 0,
      paused: false
    });

    expect(system.positionAt(state, 0)).toBe(700);
    expect(system.positionAt(state, 3000)).toBe(400);
    expect(system.positionAt(state, 6000)).toBe(100);
  });

  it("derives movement speed from how long the sentence remains on screen", () => {
    const system = new SentenceMotionSystem();
    const fast = system.create({
      startY: 700,
      endY: 100,
      durationMs: 3000,
      startedAtMs: 0,
      paused: false
    });
    const slow = system.create({
      startY: 700,
      endY: 100,
      durationMs: 6000,
      startedAtMs: 0,
      paused: false
    });

    expect(system.positionAt(fast, 1500)).toBe(400);
    expect(system.positionAt(slow, 1500)).toBe(550);
  });

  it("does not insert a hold segment during active bottom-to-top travel", () => {
    const system = new SentenceMotionSystem();
    const state = system.create({
      startY: 720,
      endY: -80,
      durationMs: 8000,
      startedAtMs: 0,
      paused: false
    });
    const positions = [0, 2000, 4000, 6000, 8000].map((time) => system.positionAt(state, time));
    const deltas = positions.slice(1).map((position, index) => position - positions[index]);

    expect(positions).toEqual([720, 520, 320, 120, -80]);
    expect(new Set(deltas)).toEqual(new Set([-200]));
  });

  it("reports when linear motion reaches a target y position", () => {
    const system = new SentenceMotionSystem();
    const state = system.create({
      startY: 700,
      endY: 100,
      durationMs: 6000,
      startedAtMs: 0,
      paused: false
    });

    expect(system.timeToPosition(state, 400)).toBe(3000);
  });

  it("can pause and resume motion without jumping", () => {
    const system = new SentenceMotionSystem();
    let state = system.create({
      startY: 700,
      endY: 100,
      durationMs: 6000,
      startedAtMs: 0,
      paused: false
    });
    state = system.pause(state, 3000);
    const pausedPosition = system.positionAt(state, 3000);
    state = system.resume(state, 5000);

    expect(pausedPosition).toBe(400);
    expect(system.positionAt(state, 5000)).toBe(400);
    expect(system.positionAt(state, 6000)).toBe(300);
  });

  it("uses active motion time for remaining duration and completion", () => {
    const system = new SentenceMotionSystem();
    let state = system.create({
      startY: 700,
      endY: 100,
      durationMs: 6000,
      startedAtMs: 0,
      paused: false
    });

    state = system.pause(state, 3000);
    expect(system.remainingActiveMs(state, 5000)).toBe(3000);
    expect(system.isComplete(state, 8000)).toBe(false);

    state = system.resume(state, 5000);
    expect(system.remainingActiveMs(state, 8000)).toBe(0);
    expect(system.isComplete(state, 8000)).toBe(true);
  });

  it("keeps the prompt static at the active playfield position", () => {
    const system = new SentenceMotionSystem();
    const portrait = computePlayLayout({ width: 390, height: 844 });
    const desktop = computePlayLayout({ width: 1280, height: 720 });
    const panelHalfHeight = 48;
    const portraitMotion = system.create({
      startY: portrait.sentenceStartY,
      endY: portrait.sentenceEndY,
      durationMs: 22000,
      startedAtMs: 0,
      paused: false
    });
    const desktopMotion = system.create({
      startY: desktop.sentenceStartY,
      endY: desktop.sentenceEndY,
      durationMs: 9000,
      startedAtMs: 0,
      paused: false
    });

    expect(portrait.sentenceStartY + panelHalfHeight).toBeLessThanOrEqual(portrait.playfield.y + portrait.playfield.height / 2);
    expect(desktop.sentenceStartY + panelHalfHeight).toBeLessThanOrEqual(desktop.playfield.y + desktop.playfield.height / 2);
    expect(portrait.sentenceStartY).toBe(portrait.sentenceActiveY);
    expect(desktop.sentenceStartY).toBe(desktop.sentenceActiveY);
    expect(portrait.sentenceEndY).toBe(portrait.sentenceActiveY);
    expect(desktop.sentenceEndY).toBe(desktop.sentenceActiveY);
    expect(system.timeToPosition(portraitMotion, portrait.sentenceActiveY)).toBe(0);
    expect(system.timeToPosition(desktopMotion, desktop.sentenceActiveY)).toBe(0);
    expect(system.positionAt(portraitMotion, 11000)).toBe(portrait.sentenceActiveY);
    expect(system.positionAt(desktopMotion, 4500)).toBe(desktop.sentenceActiveY);
  });
});
