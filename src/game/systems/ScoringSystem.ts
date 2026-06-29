export interface RoundScoreInput {
  truth: number[];
  guesses: number[];
  tier: number;
  difficultyWeight: number;
  tokenCount: number;
  timeRemainingRatio?: number;
}

export interface RoundScoreResult {
  correctCuts: number[];
  missedCuts: number[];
  falseCuts: number[];
  accuracy: number;
  pay: number;
  companyCost: number;
  net: number;
  tokenCount: number;
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values.filter(Number.isInteger))].sort((a, b) => a - b);
}

function money(value: number): number {
  return Number(value.toFixed(2));
}

const CORRECT_CUT_PAY_BASE = 0.35;
const CORRECT_CUT_PAY_PER_TIER = 0.12;
const ACCURACY_BONUS_BASE = 0.8;
const ACCURACY_BONUS_PER_TIER = 0.35;
const ACCURACY_BONUS_POWER = 4;
const TIME_BONUS_MULTIPLIER = 0.2;
const MISSED_CUT_COST = 2;
const FALSE_CUT_COST = 1;
const TOKEN_OVERHEAD_COST = 0.15;
const TIER_COST_SCALE = 0.16;

export class ScoringSystem {
  scoreRound(input: RoundScoreInput): RoundScoreResult {
    const truth = uniqueSorted(input.truth);
    const guesses = uniqueSorted(input.guesses);
    const correctCuts = guesses.filter((guess) => truth.includes(guess));
    const missedCuts = truth.filter((truthBoundary) => !guesses.includes(truthBoundary));
    const falseCuts = guesses.filter((guess) => !truth.includes(guess));
    const accuracy = truth.length === 0 ? 1 : correctCuts.length / truth.length;
    const timeMultiplier =
      1 + Math.max(0, Math.min(1, input.timeRemainingRatio ?? 0)) * TIME_BONUS_MULTIPLIER;
    const tierWeight = 1 + Math.max(0, input.tier - 1) * TIER_COST_SCALE;
    const correctCutPay = CORRECT_CUT_PAY_BASE + input.tier * CORRECT_CUT_PAY_PER_TIER;
    const accuracyBonus = ACCURACY_BONUS_BASE + input.tier * ACCURACY_BONUS_PER_TIER;
    const tokenOverhead = Math.max(0, input.tokenCount - 5) * TOKEN_OVERHEAD_COST;
    const pay = money(
      (correctCuts.length * correctCutPay + accuracyBonus * Math.pow(accuracy, ACCURACY_BONUS_POWER)) *
        timeMultiplier *
        input.difficultyWeight
    );
    const companyCost = money(
      (missedCuts.length * MISSED_CUT_COST + falseCuts.length * FALSE_CUT_COST + tokenOverhead) *
        input.difficultyWeight *
        tierWeight
    );

    return {
      correctCuts,
      missedCuts,
      falseCuts,
      accuracy,
      pay,
      companyCost,
      net: money(pay - companyCost),
      tokenCount: input.tokenCount
    };
  }
}
