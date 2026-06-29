import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIME_WARNING_THRESHOLD_MS,
  TIME_WARNING_PULSE_MS,
  shouldPlayTimeWarning,
  timerPressureVisualState
} from "../src/game/systems/TimePressureSystem";

describe("shouldPlayTimeWarning", () => {
  it("triggers once when endless time enters the warning window", () => {
    expect(DEFAULT_TIME_WARNING_THRESHOLD_MS).toBe(2000);
    expect(shouldPlayTimeWarning({
      tutorialMode: false,
      resolving: false,
      warningPlayed: false,
      timeRemainingMs: 2000
    })).toBe(true);
    expect(shouldPlayTimeWarning({
      tutorialMode: false,
      resolving: false,
      warningPlayed: false,
      timeRemainingMs: 2001
    })).toBe(false);
  });

  it("suppresses warning cues while tutorial, review, or a prior warning owns the state", () => {
    const base = {
      timeRemainingMs: 1200,
      thresholdMs: 2000
    };

    expect(shouldPlayTimeWarning({
      ...base,
      tutorialMode: true,
      resolving: false,
      warningPlayed: false
    })).toBe(false);
    expect(shouldPlayTimeWarning({
      ...base,
      tutorialMode: false,
      resolving: true,
      warningPlayed: false
    })).toBe(false);
    expect(shouldPlayTimeWarning({
      ...base,
      tutorialMode: false,
      resolving: false,
      warningPlayed: true
    })).toBe(false);
  });

  it("does not fire after the timer has already reached zero", () => {
    expect(shouldPlayTimeWarning({
      tutorialMode: false,
      resolving: false,
      warningPlayed: false,
      timeRemainingMs: 0
    })).toBe(false);
  });

  it("adds a visible endless-only warning pulse as time runs out", () => {
    expect(TIME_WARNING_PULSE_MS).toBeGreaterThan(300);
    const state = timerPressureVisualState({
      tutorialMode: false,
      resolving: false,
      timeRemainingMs: 1000,
      durationMs: 8000,
      timeMs: TIME_WARNING_PULSE_MS / 4
    });

    expect(state.ratio).toBeCloseTo(0.125);
    expect(state.warningActive).toBe(true);
    expect(state.warningIntensity).toBeGreaterThan(0.35);
    expect(state.pulseStrength).toBeCloseTo(1);
    expect(state.fillAlpha).toBeGreaterThan(0.9);
    expect(state.height).toBeGreaterThan(8);
    expect(state.laneAlpha).toBeGreaterThan(0.3);
    expect(state.laneStrokeWidth).toBeGreaterThan(1);
    expect(state.laneHighlightAlpha).toBeGreaterThan(0.2);
    expect(state.deadlineGateAlpha).toBeGreaterThan(state.laneAlpha);
    expect(state.deadlineGateInsetRatio).toBeGreaterThan(0.08);
    expect(state.deadlineGateInsetRatio).toBeLessThan(0.18);
    expect(state.deadlineGateStrokeWidth).toBeGreaterThan(state.laneStrokeWidth);
  });

  it("keeps tutorial, paused, and review timer visuals calm", () => {
    const base = {
      timeRemainingMs: 1000,
      durationMs: 8000,
      timeMs: TIME_WARNING_PULSE_MS / 4
    };

    expect(timerPressureVisualState({
      ...base,
      tutorialMode: true,
      resolving: false
    })).toMatchObject({
      warningActive: false,
      warningIntensity: 0,
      pulseStrength: 0,
      height: 8,
      laneAlpha: 0,
      laneStrokeWidth: 0,
      laneHighlightAlpha: 0,
      deadlineGateAlpha: 0,
      deadlineGateInsetRatio: 0,
      deadlineGateStrokeWidth: 0
    });
    expect(timerPressureVisualState({
      ...base,
      tutorialMode: false,
      resolving: true
    })).toMatchObject({
      warningActive: false,
      warningIntensity: 0,
      pulseStrength: 0,
      height: 8,
      laneAlpha: 0,
      laneStrokeWidth: 0,
      laneHighlightAlpha: 0,
      deadlineGateAlpha: 0,
      deadlineGateInsetRatio: 0,
      deadlineGateStrokeWidth: 0
    });
    expect(timerPressureVisualState({
      ...base,
      tutorialMode: false,
      resolving: false,
      paused: true
    })).toMatchObject({
      warningActive: false,
      warningIntensity: 0,
      pulseStrength: 0,
      height: 8,
      laneAlpha: 0,
      laneStrokeWidth: 0,
      laneHighlightAlpha: 0,
      deadlineGateAlpha: 0,
      deadlineGateInsetRatio: 0,
      deadlineGateStrokeWidth: 0
    });
  });
});
