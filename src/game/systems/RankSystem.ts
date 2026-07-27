export interface RankInput {
  rounds: number;
  accuracy: number;
  totalVerifiedCredits: number;
  totalReworkCredits: number;
  creditBalance: number;
}

export interface RankResult {
  rank: string;
  rankScore: number;
  creditEfficiency: number;
}

export interface RankProgressResult {
  current: number;
  target: number;
}

export const RANK_LADDER = [
  { minRounds: 0, rank: "Regex Intern" },
  { minRounds: 10, rank: "Junior Boundary Clerk" },
  { minRounds: 20, rank: "Prompt Intake Associate" },
  { minRounds: 30, rank: "Token Ledger Coordinator" },
  { minRounds: 40, rank: "Whitespace Compliance Officer" },
  { minRounds: 50, rank: "Merge Table Liaison" },
  { minRounds: 70, rank: "Vocabulary Registry Officer" },
  { minRounds: 90, rank: "Senior Sequence Administrator" },
  { minRounds: 110, rank: "Acting Automation Supervisor" },
  { minRounds: 130, rank: "Interim Replacement Director" },
  { minRounds: 200, rank: "Artificial Intelligence" }
] as const;
const RANK_ORDER = RANK_LADDER.map(({ rank }) => rank);

export class RankSystem {
  calculate(input: RankInput): RankResult {
    const rounds = Math.max(0, Math.floor(input.rounds));
    const creditEfficiency = this.creditEfficiency(
      input.totalVerifiedCredits,
      input.totalReworkCredits
    );

    return {
      rank: rankForRounds(rounds),
      rankScore: rounds,
      creditEfficiency
    };
  }

  progressForRound(round: number): RankProgressResult {
    const completedRounds = Math.max(0, Math.floor(round) - 1);
    return this.progressForCompletedRounds(completedRounds);
  }

  progressForCompletedRounds(completedRounds: number, holdCompletedStage = false): RankProgressResult {
    const completed = Math.max(0, Math.floor(completedRounds));
    const exactPromotionIndex = RANK_LADDER.findIndex(
      ({ minRounds }) => minRounds === completed
    );
    if (holdCompletedStage && exactPromotionIndex > 0) {
      const promotion = RANK_LADDER[exactPromotionIndex];
      const previous = RANK_LADDER[exactPromotionIndex - 1];
      if (promotion && previous) {
        const target = promotion.minRounds - previous.minRounds;
        return { current: target, target };
      }
    }

    const nextPromotionIndex = RANK_LADDER.findIndex(
      ({ minRounds }) => minRounds > completed
    );
    if (nextPromotionIndex < 0) {
      const final = RANK_LADDER[RANK_LADDER.length - 1];
      const previous = RANK_LADDER[RANK_LADDER.length - 2];
      const target = final.minRounds - previous.minRounds;
      return { current: target, target };
    }

    const currentTier = RANK_LADDER[Math.max(0, nextPromotionIndex - 1)];
    const nextTier = RANK_LADDER[nextPromotionIndex];
    return {
      current: completed - currentTier.minRounds,
      target: nextTier.minRounds - currentTier.minRounds
    };
  }

  private creditEfficiency(totalVerifiedCredits: number, totalReworkCredits: number): number {
    if (totalReworkCredits <= 0) {
      return totalVerifiedCredits > 0 ? 3 : 0;
    }

    return Number(
      (Math.max(0, totalVerifiedCredits) / totalReworkCredits).toFixed(3)
    );
  }
}

export function rankForRounds(rounds: number): (typeof RANK_LADDER)[number]["rank"] {
  const completed = Math.max(0, Math.floor(rounds));
  for (let index = RANK_LADDER.length - 1; index >= 0; index -= 1) {
    const tier = RANK_LADDER[index];
    if (tier && completed >= tier.minRounds) {
      return tier.rank;
    }
  }

  return "Regex Intern";
}

export function bestRankDisplayText(rounds: number): string {
  const completed = Math.max(0, Math.floor(rounds));
  return `BEST RANK\n${rankForRounds(completed)}\n${completed} rounds`;
}

export function menuRankLabel(rank: string, rounds?: number): string {
  if (rounds !== undefined) {
    return rankForRounds(rounds);
  }

  return rank;
}

export function rankOrdinal(rank: string): number {
  const index = RANK_ORDER.indexOf(rank as (typeof RANK_ORDER)[number]);
  return index < 0 ? 0 : index;
}
