import { describe, expect, it } from "vitest";
import {
  difficultyPhaseAnnouncement,
  DifficultySystem,
  ENDLESS_MAX_WORKLOAD_FACTOR,
  ENDLESS_MIN_DURATION_MS,
  ENDLESS_START_DURATION_MS,
  workloadAdjustedRoundDurationMs
} from "../src/game/systems/DifficultySystem";

describe("DifficultySystem", () => {
  it("starts with plain-language fixtures and a readable deadline", () => {
    const state = new DifficultySystem().getState(1);

    expect(state.tierCap).toBe(1);
    expect(state.roundDurationMs).toBe(10000);
    expect(state.penaltyScale).toBe(1);
    expect(state.phase).toBe("plain-language");
    expect(state.contentFocus).toBe("word-like chunks");
  });

  it("unlocks higher tiers over rounds", () => {
    const system = new DifficultySystem();

    expect(system.getState(3).tierCap).toBe(1);
    expect(system.getState(4).tierCap).toBe(2);
    expect(system.getState(5).tierCap).toBe(2);
    expect(system.getState(8).tierCap).toBe(3);
    expect(system.getState(13).tierCap).toBe(4);
    expect(system.getState(30).tierCap).toBe(4);
  });

  it("ties each fixture tier to a deliberate content phase", () => {
    const system = new DifficultySystem();

    expect(system.getState(4)).toMatchObject({
      phase: "punctuation",
      contentFocus: "punctuation and numbers"
    });
    expect(system.getState(8)).toMatchObject({
      phase: "machine-text",
      contentFocus: "URLs, code, and identifiers"
    });
    expect(system.getState(13)).toMatchObject({
      phase: "edge-cases",
      contentFocus: "full queue with edge cases"
    });
  });

  it("reaches dense strings with a materially faster but still readable deadline", () => {
    const state = new DifficultySystem().getState(8);

    expect(state.tierCap).toBe(3);
    expect(state.roundDurationMs).toBe(6250);
  });

  it("gives each phase transition a concise in-world warning", () => {
    expect(difficultyPhaseAnnouncement("punctuation")).toMatch(/punctuation|numbers/i);
    expect(difficultyPhaseAnnouncement("machine-text")).toMatch(/code|URLs|commands/i);
    expect(difficultyPhaseAnnouncement("edge-cases")).toMatch(/multilingual|symbols/i);
  });

  it("accelerates every round toward an intentionally inhuman floor", () => {
    const system = new DifficultySystem();
    const durations = Array.from({ length: 30 }, (_, index) => system.getState(index + 1).roundDurationMs);

    expect(durations.slice(1).every((duration, index) => duration <= durations[index])).toBe(true);
    expect(system.getState(20).roundDurationMs).toBeLessThan(system.getState(1).roundDurationMs);
    expect(system.getState(20).roundDurationMs).toBe(2800);
    expect(system.getState(30).roundDurationMs).toBe(1800);
    expect(system.getState(100).roundDurationMs).toBe(1800);
  });

  it("gives materially denser sentences more time without escaping the accelerating bounds", () => {
    const sparse = workloadAdjustedRoundDurationMs(3400, {
      boundaryCount: 1,
      tokenCount: 2,
      textLength: 10
    });
    const dense = workloadAdjustedRoundDurationMs(3200, {
      boundaryCount: 6,
      tokenCount: 7,
      textLength: 22
    });

    expect(sparse).toBe(2900);
    expect(dense).toBe(4500);
    expect(dense).toBeGreaterThan(sparse);
    expect(sparse).toBeGreaterThanOrEqual(ENDLESS_MIN_DURATION_MS);
    expect(dense).toBeLessThanOrEqual(ENDLESS_START_DURATION_MS);
    expect(ENDLESS_MAX_WORKLOAD_FACTOR).toBe(1.4);
  });

  it("applies workload without changing tier, penalty, or curriculum", () => {
    const system = new DifficultySystem();
    const base = system.getState(18);
    const adjusted = system.applyWorkload(base, {
      boundaryCount: 6,
      tokenCount: 7,
      textLength: 22
    });

    expect(adjusted.roundDurationMs).toBeGreaterThan(base.roundDurationMs);
    expect(adjusted).toMatchObject({
      round: base.round,
      tierCap: base.tierCap,
      penaltyScale: base.penaltyScale,
      phase: base.phase,
      contentFocus: base.contentFocus
    });
  });
});
