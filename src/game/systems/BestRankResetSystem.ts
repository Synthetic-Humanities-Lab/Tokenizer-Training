import { bestRankDisplayText, rankForRounds } from "./RankSystem";
import type {
  HighScoreClearResult,
  HighScoreRecord,
  StorageSystem
} from "./StorageSystem";

export const RESET_BEST_RANK_TITLE = "Reset Best Rank?";
export const RESET_BEST_RANK_MESSAGE =
  "Removes the saved rank and round record on this device. Token Log, sample progress, Training access, and preferences remain.";
export const RESET_BEST_RANK_CANCEL_LABEL = "Cancel";
export const RESET_BEST_RANK_CONFIRM_LABEL = "Reset Rank";

export type BestRankResetPhase = "idle" | "confirming";
export type BestRankResetOutcome = "none" | HighScoreClearResult["status"];

export interface BestRankResetSnapshot {
  phase: BestRankResetPhase;
  outcome: BestRankResetOutcome;
  persisted: HighScoreRecord | null;
}

type BestRankResetStorage = Pick<StorageSystem, "clearHighScore">;

export class BestRankResetSystem {
  private state: BestRankResetSnapshot = {
    phase: "idle",
    outcome: "none",
    persisted: null
  };

  constructor(private readonly storage: BestRankResetStorage) {}

  request(): Readonly<BestRankResetSnapshot> {
    if (this.state.phase === "confirming") {
      return this.snapshot();
    }

    this.state = {
      phase: "confirming",
      outcome: "none",
      persisted: null
    };
    return this.snapshot();
  }

  cancel(): Readonly<BestRankResetSnapshot> {
    this.reset();
    return this.snapshot();
  }

  confirm(): Readonly<BestRankResetSnapshot> {
    if (this.state.phase !== "confirming") {
      return this.snapshot();
    }

    const result = this.storage.clearHighScore();
    this.state = {
      phase: "idle",
      outcome: result.status,
      persisted: result.persisted
    };
    return this.snapshot();
  }

  reset(): void {
    this.state = {
      phase: "idle",
      outcome: "none",
      persisted: null
    };
  }

  snapshot(): Readonly<BestRankResetSnapshot> {
    return { ...this.state };
  }
}

export function bestRankStatus(
  record: HighScoreRecord | null,
  reset: Readonly<BestRankResetSnapshot>
): string {
  if (reset.outcome === "cleared") {
    return "BEST RANK RESET\nRegex Intern\n0 rounds";
  }

  if (reset.outcome === "already-clear") {
    return bestRankDisplayText(0);
  }

  if (reset.outcome === "unavailable") {
    if (!reset.persisted) {
      return "Reset unavailable. Stored rank could not be verified.";
    }

    return `Reset unavailable. Rank kept: ${rankAndRounds(reset.persisted)}`;
  }

  return bestRankDisplayText(record?.rounds ?? 0);
}

function rankAndRounds(record: HighScoreRecord): string {
  const rounds = Math.max(0, Math.floor(record.rounds));
  return `${rankForRounds(rounds)} / ${rounds} rounds`;
}
