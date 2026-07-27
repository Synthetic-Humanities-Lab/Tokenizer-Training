import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import linesJson from "../src/game/data/wiener_speech_lines.json";
import {
  WIENER_SPEECH_EMERGENCY_LINE,
  WienerSpeechLineSystem,
  validateWienerSpeechLinesV2,
  type WienerSpeechLinesV2
} from "../src/game/systems/WienerSpeechLineSystem";
import { WIENER_SPEECH_DEFAULT_MAX_LENGTH } from "../src/game/systems/WienerSpeechSystem";
import type { RoundScoreResult } from "../src/game/systems/ScoringSystem";

function scoreWith(overrides: Partial<RoundScoreResult> = {}): RoundScoreResult {
  return {
    correctCuts: [1],
    missedCuts: [],
    falseCuts: [],
    accuracy: 1,
    verifiedTokenIndexes: [0, 1, 2],
    reworkTokenIndexes: [],
    verifiedCredits: 3,
    reworkCredits: 0,
    creditDelta: 3,
    tokenCount: 3,
    ...overrides
  };
}

function minimalSchema(categories: WienerSpeechLinesV2["categories"]): WienerSpeechLinesV2 {
  return {
    schema_version: 2,
    persona: {
      id: "test",
      display_name: "WIENER",
      company: "WienerWorks",
      surface: "test",
      world_year: 2040,
      interface_era: 2026,
      description: "test schema",
      selection_policy: {
        repeat_window: 3,
        max_same_category_in_row: 1,
        prefer_short_lines_during_active_play: true,
        suppress_nonessential_barks_during_swipe: true
      }
    },
    categories
  };
}

function category(lines: string[]): WienerSpeechLinesV2["categories"][string] {
  return {
    scene: "play",
    delivery: "bubble",
    target_length: "short",
    cooldown_group: "test",
    lines
  };
}

describe("WienerSpeechLineSystem", () => {
  it("keeps FeedbackSystem off the old six-pool JSON contract", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../src/game/systems/FeedbackSystem.ts", import.meta.url)),
      "utf8"
    );

    expect(source).not.toContain("lines.lowBalance");
    expect(source).not.toContain("lines.overcut");
    expect(source).not.toContain("lines.missed");
    expect(source).not.toContain("lines.falseCut");
    expect(source).not.toContain("lines.good");
    expect(source).not.toContain("lines.bad");
  });

  it("validates the runtime v2 category schema", () => {
    const schema = validateWienerSpeechLinesV2(linesJson);

    expect(schema.schema_version).toBe(2);
    expect(schema.categories["play.resolve.missed"].lines.length).toBeGreaterThan(0);
    expect(schema.categories.good).toBeUndefined();
    expect(schema.categories.missed).toBeUndefined();
    expect(schema.categories.falseCut).toBeUndefined();
    expect(schema.categories.overcut).toBeUndefined();
    expect(schema.categories.lowBalance).toBeUndefined();
    expect(schema.categories.bad).toBeUndefined();
  });

  it("keeps retired endless labels out of player-visible runtime speech", () => {
    const retiredLine = Object.values(linesJson.categories)
      .flatMap(({ lines }) => lines)
      .find((line) => /\bendless (?:mode|training)\b/i.test(line));

    expect(retiredLine).toBeUndefined();
  });

  it("keeps deterministic tutorial copy out of the random speech pool", () => {
    const staleTutorialCategories = Object.keys(linesJson.categories)
      .filter((categoryName) => categoryName.startsWith("tutorial."));

    expect(staleTutorialCategories).toEqual([]);
  });

  it("keeps every Training resolution line inside the visible sticky bubble budget", () => {
    const resolutionLines = Object.entries(linesJson.categories)
      .filter(([categoryName]) => categoryName.startsWith("play.resolve."))
      .flatMap(([, categoryValue]) => categoryValue.lines);

    expect(resolutionLines.length).toBeGreaterThan(0);
    for (const line of resolutionLines) {
      expect(line.length, line).toBeLessThanOrEqual(WIENER_SPEECH_DEFAULT_MAX_LENGTH);
    }
  });

  it("selects category lines deterministically by seed", () => {
    const system = new WienerSpeechLineSystem();
    const first = system.pick("play.resolve.missed", { seed: 0, remember: false });
    const second = system.pick("play.resolve.missed", { seed: 1, remember: false });

    expect(first).toBe(linesJson.categories["play.resolve.missed"].lines[0]);
    expect(second).toBe(linesJson.categories["play.resolve.missed"].lines[1]);
  });

  it("falls back to system.record_missing and then to the emergency line", () => {
    const withRecordMissing = minimalSchema({
      "system.record_missing": category(["Record missing fallback."])
    });
    const withoutRecordMissing = minimalSchema({
      "play.resolve.good": category(["Only known line."])
    });

    expect(new WienerSpeechLineSystem(withRecordMissing).pick("missing.category", { remember: false }))
      .toBe("Record missing fallback.");
    expect(new WienerSpeechLineSystem(withoutRecordMissing).pick("missing.category", { remember: false }))
      .toBe(WIENER_SPEECH_EMERGENCY_LINE);
  });

  it("avoids immediate line repetition when alternatives exist", () => {
    const system = new WienerSpeechLineSystem(minimalSchema({
      "play.resolve.good": category(["A", "B"])
    }));

    expect(system.pick("play.resolve.good", { seed: 0 })).toBe("A");
    expect(system.pick("play.resolve.good", { seed: 0 })).toBe("B");
    expect(system.pick("play.resolve.good", { seed: 0 })).toBe("A");
  });

  it("maps legacy aliases to v2 categories", () => {
    const system = new WienerSpeechLineSystem();

    expect(system.pickLegacy("good", { seed: 0, remember: false }))
      .toBe(linesJson.categories["play.resolve.perfect"].lines[0]);
    expect(system.pickLegacy("missed", { seed: 0, remember: false }))
      .toBe(linesJson.categories["play.resolve.missed"].lines[0]);
    expect(system.pickLegacy("falseCut", { seed: 0, remember: false }))
      .toBe(linesJson.categories["play.resolve.false_cut"].lines[0]);
    expect(system.pickLegacy("overcut", { seed: 0, remember: false }))
      .toBe(linesJson.categories["play.resolve.overcut"].lines[0]);
    expect(system.pickLegacy("lowBalance", { seed: 0, remember: false }))
      .toBe(linesJson.categories["economy.balance_warning"].lines[0]);
    expect(system.pickLegacy("bad", { seed: 0, remember: false }))
      .toBe(linesJson.categories["play.resolve.mixed"].lines[0]);
  });

  it("classifies resolve and round-start contexts without mutating gameplay inputs", () => {
    const system = new WienerSpeechLineSystem();

    expect(system.categoryForResolve(scoreWith())).toBe("play.resolve.perfect");
    expect(system.categoryForResolve(scoreWith({ missedCuts: [7] }))).toBe("play.resolve.missed");
    expect(system.categoryForResolve(scoreWith({ falseCuts: [4] }))).toBe("play.resolve.false_cut");
    expect(system.categoryForResolve(scoreWith({ missedCuts: [7], falseCuts: [4] }))).toBe("play.resolve.mixed");
    expect(system.categoryForResolve(scoreWith({ missedCuts: [7], falseCuts: [1, 2, 3] }))).toBe("play.resolve.overcut");
    expect(system.categoryForRoundStart({ creditBalance: 10 })).toBe("play.round_start.low_balance");
    expect(system.categoryForRoundStart({ creditBalance: 40 })).toBe("play.round_start.neutral");
    expect(system.categoryForRoundStart({
      creditBalance: 40,
      fixture: {
        id: "dense",
        text: "wiener.ai/pricing",
        category: "url",
        tier: 3,
        token_count: 5,
        token_ids: [17043, 804, 41483, 45772, 10332],
        token_strings: ["wi", "ener", ".ai", "/pr", "icing"],
        token_byte_spans: [[0, 2], [2, 6], [6, 9], [9, 12], [12, 17]],
        graphemes: [],
        grapheme_byte_spans: [],
        boundary_positions: [2, 6, 9, 12],
        boundary_byte_positions: [2, 6, 9, 12],
        difficulty_weight: 1,
        notes: "test",
        tokenizer: "cl100k_base"
      }
    })).toBe("play.round_start.dense_string");
  });

  it("rejects empty categories before runtime selection", () => {
    expect(() => validateWienerSpeechLinesV2(minimalSchema({
      "play.resolve.good": category([])
    }))).toThrow(/at least one line/);
  });
});
