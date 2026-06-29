export interface RankInput {
  rounds: number;
  accuracy: number;
  totalPay: number;
  totalCost: number;
  balance: number;
}

export interface RankResult {
  rank: string;
  rankScore: number;
  costEfficiency: number;
}

export interface RankProgressResult {
  current: number;
  target: number;
}

const RANK_PROGRESS_STEP = 5;

export class RankSystem {
  calculate(input: RankInput): RankResult {
    const rounds = Math.max(0, Math.floor(input.rounds));
    const accuracy = clamp(input.accuracy, 0, 1);
    const costEfficiency = this.costEfficiency(input.totalPay, input.totalCost);
    const rankScore = Number(
      (
        rounds * 10 +
        accuracy * 35 +
        Math.min(3, costEfficiency) * 10 +
        Math.max(0, input.balance) * 0.15
      ).toFixed(2)
    );

    return {
      rank: this.rankFor(rounds, accuracy, costEfficiency),
      rankScore,
      costEfficiency
    };
  }

  progressForRound(round: number): RankProgressResult {
    const completedRounds = Math.max(0, Math.floor(round) - 1);
    return this.progressForCompletedRounds(completedRounds);
  }

  progressForCompletedRounds(completedRounds: number, holdCompletedStage = false): RankProgressResult {
    const completed = Math.max(0, Math.floor(completedRounds));
    let stageStart = 0;
    let target = RANK_PROGRESS_STEP;

    while (holdCompletedStage ? completed > stageStart + target : completed >= stageStart + target) {
      stageStart += target;
      target += RANK_PROGRESS_STEP;
    }

    return {
      current: completed - stageStart,
      target
    };
  }

  private rankFor(rounds: number, accuracy: number, costEfficiency: number): string {
    if (rounds >= 24 && accuracy >= 0.9 && costEfficiency >= 1.2) return "Temporary Sequence Specialist";
    if (rounds >= 18 && accuracy >= 0.82 && costEfficiency >= 1) return "cl100k Probationary";
    if (rounds >= 12 && accuracy >= 0.72 && costEfficiency >= 0.8) return "BPE Adjacent";
    if (rounds >= 8 && accuracy >= 0.6 && costEfficiency >= 0.55) return "Prompt Intake Associate";
    if (rounds >= 4 && accuracy >= 0.45) return "Junior Boundary Clerk";
    return "Regex Intern";
  }

  private costEfficiency(totalPay: number, totalCost: number): number {
    if (totalCost <= 0) {
      return totalPay > 0 ? 3 : 0;
    }

    return Number((Math.max(0, totalPay) / totalCost).toFixed(3));
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
