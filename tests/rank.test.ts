import { describe, expect, it } from "vitest";
import {
  RANK_LADDER,
  RankSystem,
  bestRankDisplayText,
  rankForRounds
} from "../src/game/systems/RankSystem";

describe("RankSystem", () => {
  it("uses completed rounds alone for title and rank score", () => {
    const ranker = new RankSystem();
    const efficient = ranker.calculate({
      rounds: 12,
      accuracy: 0.78,
      totalVerifiedCredits: 40,
      totalReworkCredits: 20,
      creditBalance: 12
    });
    const wasteful = ranker.calculate({
      rounds: 12,
      accuracy: 0.78,
      totalVerifiedCredits: 20,
      totalReworkCredits: 60,
      creditBalance: 0
    });

    expect(efficient.rank).toBe("Junior Boundary Clerk");
    expect(wasteful.rank).toBe("Junior Boundary Clerk");
    expect(efficient.rankScore).toBe(12);
    expect(wasteful.rankScore).toBe(12);
    expect(efficient.creditEfficiency).toBeGreaterThan(wasteful.creditEfficiency);
  });

  it("caps zero-rework efficiency to keep scores bounded", () => {
    const rank = new RankSystem().calculate({
      rounds: 8,
      accuracy: 1,
      totalVerifiedCredits: 25,
      totalReworkCredits: 0,
      creditBalance: 20
    });

    expect(rank.creditEfficiency).toBe(3);
    expect(rank.rank).toBe("Regex Intern");
  });

  it("provides eleven bureaucratic titles across the 200-round catalog", () => {
    expect(RANK_LADDER).toHaveLength(11);
    expect(RANK_LADDER.map(({ minRounds }) => minRounds)).toEqual([
      0, 10, 20, 30, 40, 50, 70, 90, 110, 130, 200
    ]);
    expect(rankForRounds(69)).toBe("Merge Table Liaison");
    expect(rankForRounds(130)).toBe("Interim Replacement Director");
    expect(rankForRounds(200)).toBe("Artificial Intelligence");
    expect(bestRankDisplayText(25)).toBe(
      "BEST RANK\nPrompt Intake Associate\n25 rounds"
    );
  });

  it("reports active rank-track progress against the next promotion threshold", () => {
    const system = new RankSystem();

    expect(system.progressForRound(1)).toEqual({ current: 0, target: 10 });
    expect(system.progressForRound(10)).toEqual({ current: 9, target: 10 });
    expect(system.progressForRound(11)).toEqual({ current: 0, target: 10 });
    expect(system.progressForRound(51)).toEqual({ current: 0, target: 20 });
    expect(system.progressForRound(131)).toEqual({ current: 0, target: 70 });
    expect(system.progressForRound(201)).toEqual({ current: 70, target: 70 });
  });

  it("can hold a completed stage during review before the next active prompt resets", () => {
    const system = new RankSystem();

    expect(system.progressForCompletedRounds(10, true)).toEqual({ current: 10, target: 10 });
    expect(system.progressForCompletedRounds(10)).toEqual({ current: 0, target: 10 });
    expect(system.progressForCompletedRounds(50, true)).toEqual({ current: 10, target: 10 });
    expect(system.progressForCompletedRounds(50)).toEqual({ current: 0, target: 20 });
    expect(system.progressForCompletedRounds(200, true)).toEqual({ current: 70, target: 70 });
  });
});
