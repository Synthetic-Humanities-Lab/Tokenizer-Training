import { describe, expect, it } from "vitest";
import {
  TRAINING_FAILED_RETRY_GAP_ROUNDS,
  TRAINING_REVIEW_INTERVAL,
  TrainingFixtureScheduleSystem
} from "../src/game/systems/TrainingFixtureScheduleSystem";

describe("TrainingFixtureScheduleSystem", () => {
  it("retires a passed sentence for the remainder of the run", () => {
    const schedule = new TrainingFixtureScheduleSystem();
    schedule.recordResult("simple_001", 1, true);

    expect(schedule.selectionForRound(30)).toEqual({
      excludeIds: ["simple_001"],
      preferredIds: []
    });
  });

  it("retries a failed sentence after the gap on the next one-in-five review slot", () => {
    const schedule = new TrainingFixtureScheduleSystem();
    schedule.recordResult("simple_001", 1, false);

    for (let offset = 1; offset <= TRAINING_FAILED_RETRY_GAP_ROUNDS; offset += 1) {
      const selection = schedule.selectionForRound(undefined, 200);
      expect(selection.excludeIds).toContain("simple_001");
      expect(selection.preferredIds).not.toContain("simple_001");
      schedule.recordResult(`filler_${offset}`, offset + 1, true);
    }

    expect(schedule.selectionForRound(undefined, 200).preferredIds).toEqual([]);
    for (let offset = 21; offset <= 23; offset += 1) {
      schedule.recordResult(`filler_${offset}`, offset + 1, true);
    }

    const retry = schedule.selectionForRound(undefined, 200);
    expect(retry.preferredIds).toEqual(["simple_001"]);
    expect(retry.excludeIds).not.toContain("simple_001");
    expect(TRAINING_REVIEW_INTERVAL).toBe(5);
  });

  it("reschedules another failed attempt and retires a successful retry", () => {
    const schedule = new TrainingFixtureScheduleSystem();
    schedule.recordResult("simple_001", 1, false);
    for (let offset = 1; offset <= TRAINING_FAILED_RETRY_GAP_ROUNDS; offset += 1) {
      schedule.recordResult(`first_gap_${offset}`, offset + 1, true);
    }
    schedule.recordResult("simple_001", 22, false);

    for (let offset = 1; offset <= TRAINING_FAILED_RETRY_GAP_ROUNDS; offset += 1) {
      expect(schedule.selectionForRound(undefined, 200).excludeIds).toContain("simple_001");
      schedule.recordResult(`second_gap_${offset}`, 22 + offset, true);
    }
    schedule.recordResult("second_gap_21", 43, true);
    schedule.recordResult("second_gap_22", 44, true);
    expect(schedule.selectionForRound(undefined, 200).preferredIds).toContain("simple_001");

    schedule.recordResult("simple_001", 45, true);
    expect(schedule.selectionForRound(80).excludeIds).toContain("simple_001");
    expect(schedule.selectionForRound(80).preferredIds).not.toContain("simple_001");
  });

  it("restores mastery and retry distance across sessions", () => {
    const firstSession = new TrainingFixtureScheduleSystem();
    firstSession.recordResult("passed_001", 1, true);
    firstSession.recordResult("failed_001", 2, false);
    for (let offset = 1; offset <= TRAINING_FAILED_RETRY_GAP_ROUNDS; offset += 1) {
      firstSession.recordResult(`bridge_${offset}`, 2 + offset, true);
    }
    firstSession.recordResult("bridge_21", 23, true);
    firstSession.recordResult("bridge_22", 24, true);

    const restored = new TrainingFixtureScheduleSystem(firstSession.snapshot());
    expect(restored.selectionForRound(undefined, 200)).toEqual({
      excludeIds: ["passed_001", ...Array.from({ length: 22 }, (_, index) => `bridge_${index + 1}`)],
      preferredIds: ["failed_001"]
    });
  });

  it("permits due reviews immediately after every catalog sample has been seen", () => {
    const schedule = new TrainingFixtureScheduleSystem();
    schedule.recordResult("failed_001", 1, false);
    for (let offset = 1; offset <= TRAINING_FAILED_RETRY_GAP_ROUNDS; offset += 1) {
      schedule.recordResult(`seen_${offset}`, offset + 1, true);
    }

    expect(schedule.selectionForRound(undefined, 21).preferredIds).toEqual(["failed_001"]);
  });
});
