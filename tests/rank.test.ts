import { describe, expect, it } from "vitest";
import { RankSystem } from "../src/game/systems/RankSystem";

describe("RankSystem", () => {
  it("uses accuracy and cost efficiency, not only round count", () => {
    const ranker = new RankSystem();
    const efficient = ranker.calculate({
      rounds: 12,
      accuracy: 0.78,
      totalPay: 40,
      totalCost: 20,
      balance: 12
    });
    const wasteful = ranker.calculate({
      rounds: 12,
      accuracy: 0.78,
      totalPay: 20,
      totalCost: 60,
      balance: 0
    });

    expect(efficient.rank).toBe("BPE Adjacent");
    expect(wasteful.rank).toBe("Junior Boundary Clerk");
    expect(efficient.rankScore).toBeGreaterThan(wasteful.rankScore);
  });

  it("caps zero-cost efficiency to keep scores bounded", () => {
    const rank = new RankSystem().calculate({
      rounds: 8,
      accuracy: 1,
      totalPay: 25,
      totalCost: 0,
      balance: 20
    });

    expect(rank.costEfficiency).toBe(3);
    expect(rank.rank).toBe("Prompt Intake Associate");
  });

  it("reports active rank-track progress in growing stage targets for the HUD", () => {
    const system = new RankSystem();

    expect(system.progressForRound(1)).toEqual({ current: 0, target: 5 });
    expect(system.progressForRound(5)).toEqual({ current: 4, target: 5 });
    expect(system.progressForRound(6)).toEqual({ current: 0, target: 10 });
    expect(system.progressForRound(11)).toEqual({ current: 5, target: 10 });
    expect(system.progressForRound(16)).toEqual({ current: 0, target: 15 });
  });

  it("can hold a completed stage during review before the next active prompt resets", () => {
    const system = new RankSystem();

    expect(system.progressForCompletedRounds(5, true)).toEqual({ current: 5, target: 5 });
    expect(system.progressForCompletedRounds(5)).toEqual({ current: 0, target: 10 });
    expect(system.progressForCompletedRounds(15, true)).toEqual({ current: 10, target: 10 });
    expect(system.progressForCompletedRounds(15)).toEqual({ current: 0, target: 15 });
  });
});
