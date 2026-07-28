import { describe, expect, it, vi } from "vitest";
import {
  BestRankResetSystem,
  bestRankStatus,
  RESET_BEST_RANK_CANCEL_LABEL,
  RESET_BEST_RANK_CONFIRM_LABEL,
  RESET_BEST_RANK_MESSAGE,
  RESET_BEST_RANK_TITLE
} from "../src/game/systems/BestRankResetSystem";
import type { HighScoreClearResult, HighScoreRecord } from "../src/game/systems/StorageSystem";

const STORED_RANK: HighScoreRecord = {
  rounds: 7.9,
  balance: 14,
  accuracy: 0.8,
  rank: "Junior Boundary Clerk",
  updatedAt: "2026-07-18T00:00:00.000Z"
};

function system(result: HighScoreClearResult) {
  const clearHighScore = vi.fn(() => result);
  return {
    clearHighScore,
    reset: new BestRankResetSystem({ clearHighScore })
  };
}

describe("BestRankResetSystem", () => {
  it("requires a separate request before it can clear storage", () => {
    const { clearHighScore, reset } = system({ status: "cleared", persisted: null });

    expect(reset.confirm()).toEqual({ phase: "idle", outcome: "none", persisted: null });
    expect(clearHighScore).not.toHaveBeenCalled();

    expect(reset.request()).toEqual({ phase: "confirming", outcome: "none", persisted: null });
    expect(clearHighScore).not.toHaveBeenCalled();
  });

  it("cancels without touching storage", () => {
    const { clearHighScore, reset } = system({ status: "cleared", persisted: null });

    reset.request();
    expect(reset.cancel()).toEqual({ phase: "idle", outcome: "none", persisted: null });
    expect(clearHighScore).not.toHaveBeenCalled();
  });

  it.each<HighScoreClearResult>([
    { status: "cleared", persisted: null },
    { status: "already-clear", persisted: null },
    { status: "unavailable", persisted: STORED_RANK },
    { status: "unavailable", persisted: null }
  ])("publishes the verified $status result once", (result) => {
    const { clearHighScore, reset } = system(result);

    reset.request();
    expect(reset.confirm()).toEqual({
      phase: "idle",
      outcome: result.status,
      persisted: result.persisted
    });
    expect(reset.confirm()).toEqual({
      phase: "idle",
      outcome: result.status,
      persisted: result.persisted
    });
    expect(clearHighScore).toHaveBeenCalledTimes(1);
  });

  it("uses direct confirmation copy and names preserved settings", () => {
    expect(RESET_BEST_RANK_TITLE).toBe("Reset Best Rank?");
    expect(RESET_BEST_RANK_MESSAGE).toContain("saved rank and round record");
    expect(RESET_BEST_RANK_MESSAGE).toContain("Token Log, sample progress, Training access");
    expect(RESET_BEST_RANK_MESSAGE).toContain("preferences remain");
    expect(RESET_BEST_RANK_CANCEL_LABEL).toBe("Cancel");
    expect(RESET_BEST_RANK_CONFIRM_LABEL).toBe("Reset Rank");
  });

  it("reports the current, cleared, retained, and unverifiable states without lying", () => {
    const idle = { phase: "idle", outcome: "none", persisted: null } as const;

    expect(bestRankStatus(STORED_RANK, idle)).toBe("BEST RANK\nRegex Intern\n7 rounds");
    expect(bestRankStatus(null, idle)).toBe("BEST RANK\nRegex Intern\n0 rounds");
    expect(bestRankStatus(null, { ...idle, outcome: "cleared" })).toBe(
      "BEST RANK RESET\nRegex Intern\n0 rounds"
    );
    expect(bestRankStatus(null, { ...idle, outcome: "already-clear" })).toBe(
      "BEST RANK\nRegex Intern\n0 rounds"
    );
    expect(bestRankStatus(null, { ...idle, outcome: "unavailable", persisted: STORED_RANK })).toBe(
      "Reset unavailable. Rank kept: Regex Intern / 7 rounds"
    );
    expect(bestRankStatus(null, { ...idle, outcome: "unavailable" })).toBe(
      "Reset unavailable. Stored rank could not be verified."
    );
  });
});
