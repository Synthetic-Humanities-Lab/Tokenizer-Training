import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import fixturesJson from "../src/game/data/fixtures.json";
import {
  generateFixture,
  generateFixturesFromCsv,
  parseSeedCsv,
  UnsafeFixtureError
} from "../scripts/generate-token-fixtures";
import {
  reconstructFixture,
  TokenizerSystem,
  validateFixture,
  type TokenFixture
} from "../src/game/systems/TokenizerSystem";
import { SwipeCutSystem } from "../src/game/systems/SwipeCutSystem";

const fixtures = fixturesJson as TokenFixture[];

describe("tokenizer fixtures", () => {
  it("matches the seed CSV ids", () => {
    const csv = readFileSync(resolve("data/seed_strings.csv"), "utf8");
    const seeds = parseSeedCsv(csv);
    const generated = generateFixturesFromCsv(csv);

    expect(generated.map((fixture) => fixture.id)).toEqual(seeds.map((seed) => seed.id));
    expect(fixtures.map((fixture) => fixture.id)).toEqual(seeds.map((seed) => seed.id));
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
    const emojiReasons = rejectedReasons("emoji_split", "mañana 😂");
    const combiningReasons = rejectedReasons("combining_split", "e\u0301clair test");
    const doubleSpaceReasons = rejectedReasons("double_space", "spaces  matter");
    const standaloneSeparatorReasons = rejectedReasons("standalone_separator", "invoice_final_04.csv");

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

  it("keeps enough fixture variety for a first user playtest", () => {
    const byTier = new Map<number, number>();
    const byCategory = new Map<string, number>();
    for (const fixture of fixtures) {
      byTier.set(fixture.tier, (byTier.get(fixture.tier) ?? 0) + 1);
      byCategory.set(fixture.category, (byCategory.get(fixture.category) ?? 0) + 1);
    }

    expect(fixtures.length).toBeGreaterThanOrEqual(76);
    expect(byTier.get(1)).toBeGreaterThanOrEqual(16);
    expect(byTier.get(2)).toBeGreaterThanOrEqual(22);
    expect(byTier.get(3)).toBeGreaterThanOrEqual(19);
    expect(byTier.get(4)).toBeGreaterThanOrEqual(19);
    expect(byCategory.size).toBeGreaterThanOrEqual(18);
    for (const category of ["url", "email", "filename", "code", "hashtag", "multilingual", "leading_space"]) {
      expect(byCategory.get(category)).toBeGreaterThanOrEqual(2);
    }
    expect(byCategory.get("numbers_symbols")).toBeGreaterThanOrEqual(9);
    expect(byCategory.get("punctuation")).toBeGreaterThanOrEqual(7);
    expect(byCategory.get("symbolic")).toBeGreaterThanOrEqual(3);
    expect(byCategory.get("tokenizer_string")).toBeGreaterThanOrEqual(4);
    expect(byCategory.get("command")).toBeGreaterThanOrEqual(1);
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
});

function rejectedReasons(id: string, text: string): string[] {
  try {
    generateFixture({
      id,
      text,
      tier: 4,
      category: "unsafe_test",
      notes: "test-only unsafe fixture"
    });
  } catch (error) {
    expect(error).toBeInstanceOf(UnsafeFixtureError);
    return (error as UnsafeFixtureError).reasons;
  }

  throw new Error(`Expected ${id} to be rejected.`);
}
