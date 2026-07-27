export interface RoundScoreInput {
  truth: number[];
  guesses: number[];
  difficultyWeight: number;
  penaltyScale?: number;
}

export interface RoundScoreResult {
  correctCuts: number[];
  missedCuts: number[];
  falseCuts: number[];
  accuracy: number;
  verifiedTokenIndexes: number[];
  reworkTokenIndexes: number[];
  verifiedCredits: number;
  reworkCredits: number;
  creditDelta: number;
  tokenCount: number;
}

export const STARTING_TOKEN_CREDITS = 40;
export const LOW_TOKEN_CREDIT_THRESHOLD = 10;

export function cutAuditAccuracy(correctCuts: number, missedCuts: number, falseCuts: number): number {
  const correct = Math.max(0, Math.floor(correctCuts));
  const missed = Math.max(0, Math.floor(missedCuts));
  const falsePositive = Math.max(0, Math.floor(falseCuts));
  const denominator = correct + missed + falsePositive;
  return denominator === 0 ? 1 : correct / denominator;
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values.filter(Number.isInteger))].sort((a, b) => a - b);
}

export class ScoringSystem {
  scoreRound(input: RoundScoreInput): RoundScoreResult {
    const truth = uniqueSorted(input.truth);
    const guesses = uniqueSorted(input.guesses);
    const correctCuts = guesses.filter((guess) => truth.includes(guess));
    const missedCuts = truth.filter((truthBoundary) => !guesses.includes(truthBoundary));
    const falseCuts = guesses.filter((guess) => !truth.includes(guess));
    const accuracy = cutAuditAccuracy(correctCuts.length, missedCuts.length, falseCuts.length);
    const tokenCount = truth.length + 1;
    const verifiedTokenIndexes = exactTokenIndexes(truth, guesses);
    const verifiedTokenSet = new Set(verifiedTokenIndexes);
    const reworkTokenIndexes = Array.from(
      { length: tokenCount },
      (_, tokenIndex) => tokenIndex
    ).filter((tokenIndex) => !verifiedTokenSet.has(tokenIndex));
    const penaltyScale = Math.max(1, input.penaltyScale ?? 1);
    const liabilityScale = Math.max(1, input.difficultyWeight) * penaltyScale;
    const verifiedCredits = verifiedTokenIndexes.length;
    const reworkCredits = Math.ceil(
      (reworkTokenIndexes.length + falseCuts.length) * liabilityScale
    );

    return {
      correctCuts,
      missedCuts,
      falseCuts,
      accuracy,
      verifiedTokenIndexes,
      reworkTokenIndexes,
      verifiedCredits,
      reworkCredits,
      creditDelta: verifiedCredits - reworkCredits,
      tokenCount
    };
  }
}

export function exactTokenIndexes(truthInput: number[], guessesInput: number[]): number[] {
  const truth = uniqueSorted(truthInput);
  const guesses = uniqueSorted(guessesInput);
  const guessSet = new Set(guesses);
  const falseCuts = guesses.filter((guess) => !truth.includes(guess));

  return Array.from({ length: truth.length + 1 }, (_, tokenIndex) => tokenIndex).filter(
    (tokenIndex) => {
      const leftBoundary = tokenIndex === 0 ? Number.NEGATIVE_INFINITY : truth[tokenIndex - 1];
      const rightBoundary =
        tokenIndex === truth.length ? Number.POSITIVE_INFINITY : truth[tokenIndex];
      const leftIsIntact = tokenIndex === 0 || guessSet.has(leftBoundary);
      const rightIsIntact = tokenIndex === truth.length || guessSet.has(rightBoundary);
      const splitByFalseCut = falseCuts.some(
        (falseCut) => falseCut > leftBoundary && falseCut < rightBoundary
      );

      return leftIsIntact && rightIsIntact && !splitByFalseCut;
    }
  );
}
