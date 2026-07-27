import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import fixturesJson from "../src/game/data/fixtures.json";
import {
  createBuildTimeTokenizerAdapter,
  generateFixture,
  generateFixturesFromCsv,
  parseSeedCsv,
  UnsafeFixtureError,
  type BuildTimeTokenizerAdapter
} from "../scripts/generate-token-fixtures";
import {
  reconstructFixture,
  TokenizerSystem,
  validateFixture,
  type TokenFixture
} from "../src/game/systems/TokenizerSystem";
import { SwipeCutSystem } from "../src/game/systems/SwipeCutSystem";

const fixtures = fixturesJson as TokenFixture[];
const buildTimeTokenizer = createBuildTimeTokenizerAdapter();

describe("tokenizer fixtures", () => {
  it("matches regenerated cl100k_base fixtures exactly", () => {
    const csv = readFileSync(resolve("data/seed_strings.csv"), "utf8");
    const seeds = parseSeedCsv(csv);
    const generated = generateFixturesFromCsv(csv, buildTimeTokenizer);

    expect(generated.map((fixture) => fixture.id)).toEqual(seeds.map((seed) => seed.id));
    expect(fixtures.map((fixture) => fixture.id)).toEqual(seeds.map((seed) => seed.id));
    expect(generated).toEqual(fixtures);
  });

  it("reconstructs every source string", () => {
    expect(fixtures.length).toBeGreaterThan(0);

    for (const fixture of fixtures) {
      expect(reconstructFixture(fixture)).toBe(fixture.text);
      expect(fixture.tokenizer).toBe("cl100k_base");
      expect(fixture.token_byte_spans).toHaveLength(fixture.token_count);
      expect(fixture.boundary_byte_positions).toHaveLength(fixture.boundary_positions.length);
      expect(fixture.graphemes.join("")).toBe(fixture.text);
    }
  });

  it("has sorted playable display boundaries", () => {
    const system = new SwipeCutSystem();
    for (const fixture of fixtures) {
      const validation = validateFixture(fixture);
      expect(validation.errors).toEqual([]);
      expect(validation.ok).toBe(true);
      expect(system.hasAdjacentSpaceDuplicates(fixture.boundary_positions, fixture.text)).toBe(false);
      expect(system.unplayableBoundaries(fixture.boundary_positions, fixture.text)).toEqual([]);
    }
  });

  it("rejects post-space boundaries that the simplified display cannot cut cleanly", () => {
    const validation = validateFixture({
      id: "bad_space_boundary",
      text: "the cat",
      category: "simple_prose",
      tier: 1,
      token_count: 2,
      token_ids: [1, 2],
      token_strings: ["the ", "cat"],
      token_byte_spans: [[0, 4], [4, 7]],
      graphemes: ["t", "h", "e", " ", "c", "a", "t"],
      grapheme_byte_spans: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]],
      boundary_positions: [4],
      boundary_byte_positions: [4],
      difficulty_weight: 1,
      notes: "post-space boundary regression",
      tokenizer: "cl100k_base"
    });

    expect(validation.ok).toBe(false);
    expect(validation.errors).toContain("Fixture bad_space_boundary boundary 4 follows a visible space and is not playable.");
  });

  it("rejects standalone blank-like separator tokens that read as two cuts around a gap", () => {
    const validation = validateFixture({
      id: "bad_standalone_separator",
      text: "invoice_final_04.csv",
      category: "filename",
      tier: 3,
      token_count: 5,
      token_ids: [1, 2, 3, 4, 5],
      token_strings: ["invoice", "_final", "_", "04", ".csv"],
      token_byte_spans: [[0, 7], [7, 13], [13, 14], [14, 16], [16, 20]],
      graphemes: ["i", "n", "v", "o", "i", "c", "e", "_", "f", "i", "n", "a", "l", "_", "0", "4", ".", "c", "s", "v"],
      grapheme_byte_spans: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19], [19, 20]],
      boundary_positions: [7, 13, 14, 16],
      boundary_byte_positions: [7, 13, 14, 16],
      difficulty_weight: 1,
      notes: "standalone separator regression",
      tokenizer: "cl100k_base"
    });

    expect(validation.ok).toBe(false);
    expect(validation.errors).toContain("Fixture bad_standalone_separator token 2 is a standalone blank-like separator and is not playable.");
    expect(validation.errors).toContain("Fixture bad_standalone_separator boundary 14 follows a blank-like separator and is not playable.");
  });

  it("rejects byte boundaries that split a displayed grapheme", () => {
    const validation = validateFixture({
      id: "bad_combining_boundary",
      text: "e\u0301x",
      category: "combining",
      tier: 4,
      token_count: 2,
      token_ids: [1, 2],
      token_strings: ["e", "\u0301x"],
      token_byte_spans: [[0, 1], [1, 4]],
      graphemes: ["e\u0301", "x"],
      grapheme_byte_spans: [[0, 3], [3, 4]],
      boundary_positions: [1],
      boundary_byte_positions: [1],
      difficulty_weight: 1,
      notes: "combining mark regression",
      tokenizer: "cl100k_base"
    });

    expect(validation.ok).toBe(false);
    expect(validation.errors).toContain("Fixture bad_combining_boundary byte boundary 1 falls inside a grapheme.");
    expect(validation.errors).toContain("Fixture bad_combining_boundary boundary 1 does not match byte boundary 1.");
  });

  it("rejects unsafe real-tokenizer candidates before they reach runtime fixtures", () => {
    const emojiReasons = rejectedReasons("emoji_split", "mañana 😂", buildTimeTokenizer);
    const combiningReasons = rejectedReasons("combining_split", "e\u0301clair test", buildTimeTokenizer);
    const doubleSpaceReasons = rejectedReasons("double_space", "spaces  matter", buildTimeTokenizer);
    const standaloneSeparatorReasons = rejectedReasons("standalone_separator", "invoice_final_04.csv", buildTimeTokenizer);

    expect(emojiReasons).toContain("token byte boundary 11 falls inside a grapheme");
    expect(combiningReasons).toContain("token byte boundary 1 falls inside a grapheme");
    expect(doubleSpaceReasons).toContain("token boundary 7 follows a visible space");
    expect(doubleSpaceReasons).toContain("token boundaries create duplicate cuts around a visible space");
    expect(standaloneSeparatorReasons).toContain("tokenizer created a standalone blank-like separator token");
  });

  it("accepts clean accents, leading spaces, URLs, and code-like strings", () => {
    const byId = (id: string) => fixtures.find((fixture) => fixture.id === id);
    const accent = byId("chaos_001");
    const leading = byId("chaos_006");
    const url = byId("dense_001");
    const code = byId("dense_004");

    expect(accent?.text).toBe("café mañana");
    expect(accent?.graphemes).toContain("é");
    expect(accent?.graphemes).toContain("ñ");
    expect(validateFixture(accent!)).toEqual({ ok: true, errors: [] });
    expect(leading?.text.startsWith(" ")).toBe(true);
    expect(leading?.boundary_positions).toEqual([8]);
    expect(validateFixture(leading!)).toEqual({ ok: true, errors: [] });
    expect(url?.category).toBe("url");
    expect(url?.token_strings.join("")).toBe(url?.text);
    expect(code?.category).toBe("code");
    expect(code?.token_strings.join("")).toBe(code?.text);
    expect(fixtures.some((fixture) => fixture.token_strings.some((token) => token === " " || token === "_"))).toBe(false);
  });

  it("is accepted by the runtime tokenizer system", () => {
    const system = new TokenizerSystem(fixtures);
    const validation = system.validateAll();

    expect(validation.errors).toEqual([]);
    expect(validation.ok).toBe(true);
  });

  it("meets the 200-sentence quota and requested content mix", () => {
    const byTier = new Map<number, number>();
    const byCategory = new Map<string, number>();
    for (const fixture of fixtures) {
      byTier.set(fixture.tier, (byTier.get(fixture.tier) ?? 0) + 1);
      byCategory.set(fixture.category, (byCategory.get(fixture.category) ?? 0) + 1);
    }

    const countCategories = (categories: readonly string[]): number =>
      categories.reduce((total, category) => total + (byCategory.get(category) ?? 0), 0);

    expect(fixtures).toHaveLength(200);
    expect(new Set(fixtures.map(({ text }) => text))).toHaveLength(200);
    expect(Object.fromEntries(byTier)).toEqual({ 1: 40, 2: 50, 3: 50, 4: 60 });
    expect(countCategories(["simple_prose"])).toBe(60);
    expect(countCategories([
      "contraction",
      "hyphenation",
      "numbers_symbols",
      "punctuation",
      "internet_punctuation"
    ])).toBe(60);
    expect(countCategories([
      "url",
      "email",
      "filename",
      "code",
      "hashtag",
      "command",
      "code_symbols",
      "tokenizer_string"
    ])).toBe(40);
    expect(countCategories([
      "multilingual",
      "spacing",
      "leading_space",
      "symbolic",
      "proper_noun"
    ])).toBe(40);
  });

  it("keeps every fixture to one mobile line and fictionalizes model-company brands", () => {
    for (const fixture of fixtures) {
      expect(fixture.text).not.toMatch(/[\r\n]/);
      expect(Array.from(fixture.text).length).toBeLessThanOrEqual(30);
      expect(fixture.text).not.toMatch(/openai|chatgpt|claude|gpt-?4/i);
    }
  });

  it("selects from the highest available tier during endless progression", () => {
    const system = new TokenizerSystem(fixtures);
    const fixture = system.pickFixture(5, {
      tierCap: 2
    });

    expect(fixture.tier).toBe(2);
  });

  it("avoids immediate fixture and category repeats when alternatives exist", () => {
    const system = new TokenizerSystem(fixtures);
    const previous = fixtures.find((fixture) => fixture.tier === 3);
    expect(previous).toBeDefined();

    const fixture = system.pickFixture(9, {
      tierCap: 3,
      previousId: previous?.id,
      previousCategory: previous?.category
    });

    expect(fixture.id).not.toBe(previous?.id);
    expect(fixture.category).not.toBe(previous?.category);
  });

  it("rotates complete sentences across the opening Training rounds", () => {
    const system = new TokenizerSystem(fixtures);
    const recentIds: string[] = [];
    const recentCategories: string[] = [];
    const selected: TokenFixture[] = [];

    for (let round = 1; round <= 3; round += 1) {
      const previous = selected.at(-1);
      const fixture = system.pickFixture(round, {
        tierCap: 1,
        previousId: previous?.id,
        previousCategory: previous?.category,
        recentIds,
        recentCategories
      });
      selected.push(fixture);
      recentIds.push(fixture.id);
      recentCategories.push(fixture.category);
    }

    expect(new Set(selected.map(({ id }) => id)).size).toBe(3);
    expect(new Set(selected.map(({ text }) => text)).size).toBe(3);
  });

  it("avoids recent category repeats when a fresh category exists in the tier pool", () => {
    const system = new TokenizerSystem(fixtures);
    const fixture = system.pickFixture(12, {
      tierCap: 3,
      previousId: "dense_005",
      previousCategory: "hashtag",
      recentIds: ["dense_003", "dense_001", "dense_004", "dense_005"],
      recentCategories: ["filename", "url", "code", "hashtag"]
    });

    expect(fixture.tier).toBe(3);
    expect(["filename", "url", "code", "hashtag"]).not.toContain(fixture.category);
  });

  it("falls back to immediate category rotation when recent categories exhaust the tier pool", () => {
    const system = new TokenizerSystem(fixtures);
    const fixture = system.pickFixture(13, {
      tierCap: 3,
      previousId: "dense_001",
      previousCategory: "url",
      recentIds: ["dense_001", "dense_002", "dense_003", "dense_004", "dense_005"],
      recentCategories: ["url", "email", "filename", "code", "hashtag"]
    });

    expect(fixture.tier).toBe(3);
    expect(fixture.category).not.toBe("url");
  });

  it("avoids recent fixture ids when category rotation is not possible", () => {
    const system = new TokenizerSystem(fixtures);
    const fixture = system.pickFixture(5, {
      tierCap: 1,
      previousId: "simple_004",
      previousCategory: "simple_prose",
      recentIds: ["simple_001", "simple_002", "simple_003", "simple_004"],
      recentCategories: ["simple_prose"]
    });

    expect(fixture.tier).toBe(1);
    expect(fixture.category).toBe("simple_prose");
    expect(["simple_001", "simple_002", "simple_003", "simple_004"]).not.toContain(fixture.id);
  });

  it("excludes completed run fixtures while unseen eligible fixtures remain", () => {
    const system = new TokenizerSystem(fixtures);
    const tierOneIds = fixtures.filter(({ tier }) => tier === 1).map(({ id }) => id);
    const fixture = system.pickFixture(20, {
      tierCap: 1,
      excludeIds: tierOneIds.slice(0, -1)
    });

    expect(fixture.id).toBe(tierOneIds.at(-1));
  });

  it("prioritizes a due failed fixture even after the difficulty tier advances", () => {
    const system = new TokenizerSystem(fixtures);
    const failed = fixtures.find(({ tier }) => tier === 1);
    expect(failed).toBeDefined();

    const fixture = system.pickFixture(10, {
      tierCap: 3,
      preferredIds: [failed!.id],
      excludeIds: [failed!.id],
      preferHighestTier: true
    });

    expect(fixture.id).toBe(failed!.id);
  });

  it("prioritizes a due retry even when a new session has not unlocked its tier", () => {
    const system = new TokenizerSystem(fixtures);
    const failed = fixtures.find(({ tier }) => tier === 4);
    expect(failed).toBeDefined();

    const fixture = system.pickFixture(1, {
      tierCap: 1,
      preferredIds: [failed!.id],
      excludeIds: [failed!.id],
      allowTierOverflowWhenExhausted: true
    });

    expect(fixture.id).toBe(failed!.id);
  });

  it("advances to the nearest unseen tier before repeating mastered opening material", () => {
    const system = new TokenizerSystem(fixtures);
    const tierOneIds = fixtures.filter(({ tier }) => tier === 1).map(({ id }) => id);

    const fixture = system.pickFixture(1, {
      tierCap: 1,
      excludeIds: tierOneIds,
      allowTierOverflowWhenExhausted: true
    });

    expect(fixture.tier).toBe(2);
    expect(tierOneIds).not.toContain(fixture.id);
  });

  it("does not repeat a clean sentence across the first thirty Training rounds", () => {
    const system = new TokenizerSystem(fixtures);
    const selected: TokenFixture[] = [];

    for (let round = 1; round <= 30; round += 1) {
      const previous = selected.at(-1);
      const fixture = system.pickFixture(round, {
        tierCap: round >= 13 ? 4 : round >= 8 ? 3 : round >= 4 ? 2 : 1,
        previousId: previous?.id,
        previousCategory: previous?.category,
        recentIds: selected.slice(-4).map(({ id }) => id),
        recentCategories: selected.slice(-4).map(({ category }) => category),
        excludeIds: selected.map(({ id }) => id),
        preferHighestTier: true
      });
      selected.push(fixture);
    }

    expect(new Set(selected.map(({ id }) => id)).size).toBe(selected.length);
  });

  it("can fill the entire quota once before falling back to mastered material", () => {
    const system = new TokenizerSystem(fixtures);
    const selected: TokenFixture[] = [];

    for (let round = 1; round <= fixtures.length; round += 1) {
      const tierCap = round >= 13 ? 4 : round >= 8 ? 3 : round >= 4 ? 2 : 1;
      const previous = selected.at(-1);
      selected.push(system.pickFixture(round, {
        tierCap,
        previousId: previous?.id,
        previousCategory: previous?.category,
        recentIds: selected.slice(-4).map(({ id }) => id),
        recentCategories: selected.slice(-4).map(({ category }) => category),
        excludeIds: selected.map(({ id }) => id),
        preferHighestTier: tierCap < 4,
        allowTierOverflowWhenExhausted: true
      }));
    }

    expect(new Set(selected.map(({ id }) => id))).toHaveLength(200);
    expect(new Set(selected.map(({ text }) => text))).toHaveLength(200);
  });
});

function rejectedReasons(id: string, text: string, adapter: BuildTimeTokenizerAdapter): string[] {
  try {
    generateFixture({
      id,
      text,
      tier: 4,
      category: "unsafe_test",
      notes: "test-only unsafe fixture"
    }, adapter);
  } catch (error) {
    expect(error).toBeInstanceOf(UnsafeFixtureError);
    return (error as UnsafeFixtureError).reasons;
  }

  throw new Error(`Expected ${id} to be rejected.`);
}
