import { describe, expect, it } from "vitest";
import { DifficultySystem } from "../src/game/systems/DifficultySystem";
import {
  ScoringSystem,
  STARTING_TOKEN_CREDITS
} from "../src/game/systems/ScoringSystem";
import { SwipeCutSystem } from "../src/game/systems/SwipeCutSystem";
import { TokenizerSystem, type TokenFixture } from "../src/game/systems/TokenizerSystem";

type StrategyName = "none" | "overcut" | "half" | "nearPerfect" | "intermittent" | "perfect";

interface StrategySimulation {
  failureRound: number;
  finalCredits: number;
  totalVerifiedCredits: number;
  totalReworkCredits: number;
  roundsPlayed: number;
  maxTierReached: number;
}

function pickEndlessFixtures(limit: number): TokenFixture[] {
  const tokenizer = new TokenizerSystem();
  const difficulty = new DifficultySystem();
  const fixtures: TokenFixture[] = [];
  let previousId: string | undefined;
  let previousCategory: string | undefined;
  let recentIds: string[] = [];
  let recentCategories: string[] = [];

  for (let round = 1; round <= limit; round += 1) {
    const state = difficulty.getState(round);
    const fixture = tokenizer.pickFixture(round, {
      tierCap: state.tierCap,
      previousId,
      previousCategory,
      recentIds,
      recentCategories,
      preferHighestTier: true
    });

    fixtures.push(fixture);
    previousId = fixture.id;
    previousCategory = fixture.category;
    recentIds = [...recentIds, fixture.id].slice(-4);
    recentCategories = [...recentCategories, fixture.category].slice(-4);
  }

  return fixtures;
}

function simulateStrategy(strategy: StrategyName, limit: number): StrategySimulation {
  const difficulty = new DifficultySystem();
  const scoring = new ScoringSystem();
  const fixtures = pickEndlessFixtures(limit);
  let credits = STARTING_TOKEN_CREDITS;
  let totalVerifiedCredits = 0;
  let totalReworkCredits = 0;
  let failureRound = 0;
  let roundsPlayed = 0;
  let maxTierReached = 0;

  for (let index = 0; index < fixtures.length; index += 1) {
    const round = index + 1;
    const fixture = fixtures[index];
    const state = difficulty.getState(round);
    const score = scoring.scoreRound({
      truth: fixture.boundary_positions,
      guesses: strategyGuesses(strategy, fixture, round),
      difficultyWeight: fixture.difficulty_weight,
      penaltyScale: state.penaltyScale
    });

    credits += score.creditDelta;
    totalVerifiedCredits += score.verifiedCredits;
    totalReworkCredits += score.reworkCredits;
    roundsPlayed = round;
    maxTierReached = Math.max(maxTierReached, fixture.tier);
    if (credits <= 0) {
      failureRound = round;
      break;
    }
  }

  return {
    failureRound,
    finalCredits: credits,
    totalVerifiedCredits,
    totalReworkCredits,
    roundsPlayed,
    maxTierReached
  };
}

function strategyGuesses(strategy: StrategyName, fixture: TokenFixture, round = 1): number[] {
  if (strategy === "none") {
    return [];
  }

  if (strategy === "perfect") {
    return fixture.boundary_positions;
  }

  if (strategy === "nearPerfect") {
    return fixture.boundary_positions.slice(0, Math.max(0, fixture.boundary_positions.length - 1));
  }

  if (strategy === "intermittent") {
    if (round % 5 === 0) {
      return [];
    }

    return round % 3 === 0
      ? fixture.boundary_positions.slice(0, Math.max(0, fixture.boundary_positions.length - 1))
      : fixture.boundary_positions;
  }

  if (strategy === "half") {
    return fixture.boundary_positions.slice(0, Math.ceil(fixture.boundary_positions.length / 2));
  }

  const swipe = new SwipeCutSystem();
  const slots = swipe.buildPlayableSlots(
    { left: 0, top: 0, bottom: 48, width: fixture.text.length * 30 },
    fixture.text
  );
  return slots.map((slot) => slot.index);
}

describe("endless Token Credit progression", () => {
  it("terminates repeated non-play after onboarding but before credit pressure becomes toothless", () => {
    const difficulty = new DifficultySystem();
    const scoring = new ScoringSystem();
    const fixtures = pickEndlessFixtures(12);
    let credits = STARTING_TOKEN_CREDITS;
    let failureRound = 0;

    for (let index = 0; index < fixtures.length; index += 1) {
      const round = index + 1;
      const fixture = fixtures[index];
      const state = difficulty.getState(round);
      const score = scoring.scoreRound({
        truth: fixture.boundary_positions,
        guesses: [],
        difficultyWeight: fixture.difficulty_weight,
        penaltyScale: state.penaltyScale
      });

      credits += score.creditDelta;
      if (credits <= 0) {
        failureRound = round;
        break;
      }
    }

    expect(failureRound).toBeGreaterThan(4);
    expect(failureRound).toBeLessThanOrEqual(8);
    expect(credits).toBeLessThanOrEqual(0);
  });

  it("has reached dense tier-three strings by round eight", () => {
    const fixtures = pickEndlessFixtures(8);
    const roundEightFixture = fixtures[7];

    expect(roundEightFixture.tier).toBe(3);
    expect(roundEightFixture.category).toMatch(/url|email|filename|code|hashtag/);
  });

  it("drains sustained half-complete segmentation before dense strings become toothless", () => {
    const difficulty = new DifficultySystem();
    const scoring = new ScoringSystem();
    const fixtures = pickEndlessFixtures(16);
    let credits = STARTING_TOKEN_CREDITS;
    let failureRound = 0;

    for (let index = 0; index < fixtures.length; index += 1) {
      const round = index + 1;
      const fixture = fixtures[index];
      const state = difficulty.getState(round);
      const firstHalfOfTruth = fixture.boundary_positions.slice(
        0,
        Math.ceil(fixture.boundary_positions.length / 2)
      );
      const score = scoring.scoreRound({
        truth: fixture.boundary_positions,
        guesses: firstHalfOfTruth,
        difficultyWeight: fixture.difficulty_weight,
        penaltyScale: state.penaltyScale
      });

      credits += score.creditDelta;
      if (credits <= 0) {
        failureRound = round;
        break;
      }
    }

    expect(failureRound).toBeGreaterThanOrEqual(12);
    expect(failureRound).toBeLessThanOrEqual(16);
    expect(credits).toBeLessThanOrEqual(0);
  });

  it("rotates dense categories across early tier-three rounds before repeating", () => {
    const fixtures = pickEndlessFixtures(12);
    const denseCategories = fixtures.slice(7, 12).map((fixture) => fixture.category);

    expect(new Set(denseCategories).size).toBe(5);
  });

  it("keeps the deterministic strategy envelope aligned with learning pressure", () => {
    const noPlay = simulateStrategy("none", 12);
    const overcut = simulateStrategy("overcut", 12);
    const half = simulateStrategy("half", 16);
    const nearPerfect = simulateStrategy("nearPerfect", 20);
    const perfect = simulateStrategy("perfect", 24);

    expect(overcut.failureRound).toBeGreaterThan(0);
    expect(overcut.failureRound).toBeLessThanOrEqual(5);
    expect(overcut.failureRound).toBeLessThan(noPlay.failureRound);

    expect(noPlay.failureRound).toBeGreaterThan(4);
    expect(noPlay.failureRound).toBeLessThanOrEqual(8);

    expect(half.failureRound).toBeGreaterThanOrEqual(12);
    expect(half.failureRound).toBeLessThanOrEqual(16);
    expect(half.maxTierReached).toBe(4);

    expect(nearPerfect.failureRound).toBeGreaterThanOrEqual(13);
    expect(nearPerfect.failureRound).toBeLessThanOrEqual(20);
    expect(nearPerfect.maxTierReached).toBe(4);

    expect(perfect.failureRound).toBe(0);
    expect(perfect.roundsPlayed).toBe(24);
    expect(perfect.maxTierReached).toBe(4);
    expect(perfect.finalCredits).toBeGreaterThan(100);
    expect(perfect.totalVerifiedCredits).toBeGreaterThan(0);
    expect(perfect.totalReworkCredits).toBe(0);
  });

  it("does not let later clean rounds subsidize repeated timeouts indefinitely", () => {
    const intermittent = simulateStrategy("intermittent", 200);
    const perfect = simulateStrategy("perfect", 200);

    expect(intermittent.failureRound).toBeGreaterThanOrEqual(20);
    expect(intermittent.failureRound).toBeLessThanOrEqual(45);
    expect(intermittent.finalCredits).toBeLessThanOrEqual(0);

    expect(perfect.failureRound).toBe(0);
    expect(perfect.roundsPlayed).toBe(200);
    expect(perfect.finalCredits).toBeGreaterThan(500);
    expect(perfect.finalCredits).toBeLessThan(1_000);
  });

  it("penalizes cutting every legal slot on a dense string", () => {
    const tokenizer = new TokenizerSystem();
    const scoring = new ScoringSystem();
    const swipe = new SwipeCutSystem();
    const fixture = tokenizer.byId("dense_001");

    expect(fixture).toBeDefined();
    const slots = swipe.buildPlayableSlots(
      { left: 0, top: 0, bottom: 48, width: fixture!.text.length * 30 },
      fixture!.text
    );
    const score = scoring.scoreRound({
      truth: fixture!.boundary_positions,
      guesses: slots.map((slot) => slot.index),
      difficultyWeight: fixture!.difficulty_weight
    });

    expect(score.correctCuts).toEqual(fixture!.boundary_positions);
    expect(score.falseCuts.length).toBeGreaterThan(0);
    expect(score.creditDelta).toBeLessThan(0);
  });
});
