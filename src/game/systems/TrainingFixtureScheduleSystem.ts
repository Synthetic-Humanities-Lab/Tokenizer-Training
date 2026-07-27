import type { TrainingProgressRecord } from "./StorageSystem";

export const TRAINING_FAILED_RETRY_GAP_ROUNDS = 20;
export const TRAINING_REVIEW_INTERVAL = 5;

export interface TrainingFixtureSelection {
  excludeIds: string[];
  preferredIds: string[];
}

interface TrainingFixtureResult {
  passed: boolean;
  resolvedRound: number;
}

export class TrainingFixtureScheduleSystem {
  private readonly results = new Map<string, TrainingFixtureResult>();
  private resolvedCount = 0;

  constructor(progress?: TrainingProgressRecord) {
    if (progress) {
      this.restore(progress);
    }
  }

  reset(): void {
    this.results.clear();
    this.resolvedCount = 0;
  }

  restore(progress: TrainingProgressRecord): void {
    this.reset();
    this.resolvedCount = Math.max(0, Math.floor(progress.resolvedCount));
    for (const fixture of progress.fixtures) {
      if (!fixture.fixtureId || fixture.resolvedAt < 1 || fixture.resolvedAt > this.resolvedCount) {
        continue;
      }
      this.results.set(fixture.fixtureId, {
        passed: fixture.passed,
        resolvedRound: Math.floor(fixture.resolvedAt)
      });
    }
  }

  selectionForRound(_round?: number, corpusSize?: number): TrainingFixtureSelection {
    const nextResolvedRound = this.resolvedCount + 1;
    const normalizedCorpusSize = Number.isFinite(corpusSize)
      ? Math.max(0, Math.floor(corpusSize ?? 0))
      : Number.POSITIVE_INFINITY;
    const unseenRemain = this.results.size < normalizedCorpusSize;
    const reviewSlot = nextResolvedRound % TRAINING_REVIEW_INTERVAL === 0;
    const excludeIds: string[] = [];
    const preferredIds: string[] = [];

    for (const [fixtureId, result] of this.results) {
      const retryDue =
        !result.passed &&
        nextResolvedRound - result.resolvedRound > TRAINING_FAILED_RETRY_GAP_ROUNDS;

      if (retryDue && (!unseenRemain || reviewSlot)) {
        preferredIds.push(fixtureId);
      } else {
        excludeIds.push(fixtureId);
      }
    }

    return { excludeIds, preferredIds };
  }

  recordResult(fixtureId: string, _round: number, passed: boolean): void {
    if (!fixtureId) {
      return;
    }

    this.resolvedCount += 1;

    this.results.set(fixtureId, {
      passed,
      resolvedRound: this.resolvedCount
    });
  }

  snapshot(): TrainingProgressRecord {
    return {
      resolvedCount: this.resolvedCount,
      fixtures: [...this.results.entries()].map(([fixtureId, result]) => ({
        fixtureId,
        passed: result.passed,
        resolvedAt: result.resolvedRound
      }))
    };
  }
}
