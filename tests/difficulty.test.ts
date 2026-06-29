import { describe, expect, it } from "vitest";
import { DifficultySystem } from "../src/game/systems/DifficultySystem";

describe("DifficultySystem", () => {
  it("starts with tier one and generous time", () => {
    const state = new DifficultySystem().getState(1);

    expect(state.tierCap).toBe(1);
    expect(state.roundDurationMs).toBe(9000);
    expect(state.penaltyScale).toBe(1);
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

  it("keeps round eight dense-string pacing readable", () => {
    const state = new DifficultySystem().getState(8);

    expect(state.tierCap).toBe(3);
    expect(state.roundDurationMs).toBeGreaterThanOrEqual(7000);
  });

  it("reduces duration but keeps a readable floor", () => {
    const system = new DifficultySystem();

    expect(system.getState(20).roundDurationMs).toBeLessThan(system.getState(1).roundDurationMs);
    expect(system.getState(100).roundDurationMs).toBe(4200);
  });
});
