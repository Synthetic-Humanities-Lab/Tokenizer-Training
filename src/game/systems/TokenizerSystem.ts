import fixturesJson from "../data/fixtures.json";
import {
  graphemeBoundaryByteOffsets,
  graphemeIndexForByteOffset,
  graphemeLength,
  segmentGraphemesWithByteSpans
} from "./GraphemeSystem";

export type ByteSpan = [number, number];

export interface TokenFixture {
  id: string;
  text: string;
  category: string;
  tier: number;
  token_count: number;
  token_ids: number[];
  token_strings: string[];
  token_byte_spans: ByteSpan[];
  graphemes: string[];
  grapheme_byte_spans: ByteSpan[];
  boundary_positions: number[];
  boundary_byte_positions: number[];
  difficulty_weight: number;
  notes: string;
  tokenizer: "cl100k_base" | string;
}

export interface FixtureValidationResult {
  ok: boolean;
  errors: string[];
}

export interface FixturePickOptions {
  tierCap: number;
  previousId?: string;
  previousCategory?: string;
  preferHighestTier?: boolean;
  allowTierOverflowWhenExhausted?: boolean;
  recentIds?: string[];
  recentCategories?: string[];
  excludeIds?: string[];
  preferredIds?: string[];
}

const fixtures = fixturesJson as TokenFixture[];
const encoder = new TextEncoder();
const standaloneBlankLikeTokens = new Set([" ", "_", "\u00a0"]);

export function displayLength(value: string): number {
  return graphemeLength(value);
}

export function reconstructFixture(fixture: Pick<TokenFixture, "token_strings">): string {
  return fixture.token_strings.join("");
}

export function boundaryPositionsFromTokens(tokenStrings: string[]): number[] {
  const boundaries: number[] = [];
  let cursor = 0;

  for (let index = 0; index < tokenStrings.length - 1; index += 1) {
    cursor += displayLength(tokenStrings[index]);
    boundaries.push(cursor);
  }

  return boundaries;
}

export function validateFixture(fixture: TokenFixture): FixtureValidationResult {
  const errors: string[] = [];
  const reconstructed = reconstructFixture(fixture);
  const textLength = displayLength(fixture.text);
  const graphemes = segmentGraphemesWithByteSpans(fixture.text);
  const sourceBytes = encoder.encode(fixture.text);

  if (reconstructed !== fixture.text) {
    errors.push(`Fixture ${fixture.id} token strings do not reconstruct text.`);
  }

  if (fixture.token_count !== fixture.token_strings.length) {
    errors.push(`Fixture ${fixture.id} token_count does not match token_strings length.`);
  }

  if (fixture.token_ids.length !== fixture.token_strings.length) {
    errors.push(`Fixture ${fixture.id} token_ids does not match token_strings length.`);
  }

  if (fixture.token_byte_spans.length !== fixture.token_strings.length) {
    errors.push(`Fixture ${fixture.id} token_byte_spans does not match token_strings length.`);
  }

  fixture.token_strings.forEach((token, index) => {
    if (standaloneBlankLikeTokens.has(token)) {
      errors.push(`Fixture ${fixture.id} token ${index} is a standalone blank-like separator and is not playable.`);
    }
  });

  if (fixture.graphemes.join("") !== fixture.text) {
    errors.push(`Fixture ${fixture.id} graphemes do not reconstruct text.`);
  }

  if (fixture.graphemes.join("") !== graphemes.map((span) => span.text).join("")) {
    errors.push(`Fixture ${fixture.id} stored graphemes do not match runtime segmentation.`);
  }

  if (fixture.grapheme_byte_spans.length !== fixture.graphemes.length) {
    errors.push(`Fixture ${fixture.id} grapheme_byte_spans does not match graphemes length.`);
  }

  fixture.grapheme_byte_spans.forEach(([start, end], index) => {
    const expected = graphemes[index];
    if (!expected || start !== expected.byteStart || end !== expected.byteEnd) {
      errors.push(`Fixture ${fixture.id} grapheme byte span ${index} does not match runtime segmentation.`);
    }
  });

  validateTokenByteSpans(fixture, sourceBytes, errors);

  const expectedBoundaries = boundaryPositionsFromTokens(fixture.token_strings);
  if (expectedBoundaries.join(",") !== fixture.boundary_positions.join(",")) {
    errors.push(`Fixture ${fixture.id} boundary_positions do not match token string grapheme spans.`);
  }

  const expectedBoundaryBytes = fixture.token_byte_spans
    .slice(0, -1)
    .map(([, end]) => end);
  if (expectedBoundaryBytes.join(",") !== fixture.boundary_byte_positions.join(",")) {
    errors.push(`Fixture ${fixture.id} boundary_byte_positions do not match token byte spans.`);
  }

  const graphemeBoundaryBytes = new Set(graphemeBoundaryByteOffsets(graphemes));
  for (let index = 0; index < fixture.boundary_positions.length; index += 1) {
    const boundary = fixture.boundary_positions[index];
    const boundaryByte = fixture.boundary_byte_positions[index];
    const previous = fixture.boundary_positions[index - 1] ?? 0;

    if (!Number.isInteger(boundary)) {
      errors.push(`Fixture ${fixture.id} boundary ${boundary} is not an integer.`);
    }

    if (boundary <= previous) {
      errors.push(`Fixture ${fixture.id} boundaries are not strictly increasing.`);
    }

    if (boundary <= 0 || boundary >= textLength) {
      errors.push(`Fixture ${fixture.id} boundary ${boundary} is outside display range.`);
    }

    if (!graphemeBoundaryBytes.has(boundaryByte)) {
      errors.push(`Fixture ${fixture.id} byte boundary ${boundaryByte} falls inside a grapheme.`);
    }

    if (graphemeIndexForByteOffset(graphemes, boundaryByte) !== boundary) {
      errors.push(`Fixture ${fixture.id} boundary ${boundary} does not match byte boundary ${boundaryByte}.`);
    }

    if (fixture.graphemes[boundary - 1] === " ") {
      errors.push(`Fixture ${fixture.id} boundary ${boundary} follows a visible space and is not playable.`);
    }

    if (fixture.graphemes[boundary - 1] === "_") {
      errors.push(`Fixture ${fixture.id} boundary ${boundary} follows a blank-like separator and is not playable.`);
    }
  }

  if (fixture.boundary_positions.length === 0) {
    errors.push(`Fixture ${fixture.id} has no playable boundary.`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

function validateTokenByteSpans(fixture: TokenFixture, sourceBytes: Uint8Array, errors: string[]): void {
  const reconstructedBytes: number[] = [];
  let expectedStart = 0;

  fixture.token_byte_spans.forEach(([start, end], index) => {
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start) {
      errors.push(`Fixture ${fixture.id} token byte span ${index} is invalid.`);
      return;
    }

    if (start !== expectedStart) {
      errors.push(`Fixture ${fixture.id} token byte span ${index} is not contiguous.`);
    }

    reconstructedBytes.push(...sourceBytes.slice(start, end));
    expectedStart = end;
  });

  if (expectedStart !== sourceBytes.length) {
    errors.push(`Fixture ${fixture.id} token byte spans do not cover the full input.`);
  }

  if (
    reconstructedBytes.length !== sourceBytes.length ||
    reconstructedBytes.some((byte, index) => byte !== sourceBytes[index])
  ) {
    errors.push(`Fixture ${fixture.id} token byte spans do not reconstruct input bytes.`);
  }
}

export class TokenizerSystem {
  private readonly fixtures: TokenFixture[];

  constructor(source: TokenFixture[] = fixtures) {
    this.fixtures = source;
  }

  all(): TokenFixture[] {
    return [...this.fixtures];
  }

  byId(id: string): TokenFixture | undefined {
    return this.fixtures.find((fixture) => fixture.id === id);
  }

  pickFixture(round: number, options: FixturePickOptions): TokenFixture {
    const tierEligible = this.fixtures.filter((fixture) => fixture.tier <= options.tierCap);
    if (tierEligible.length === 0) {
      throw new Error("No tokenizer fixtures available for the requested difficulty.");
    }

    const preferredIds = new Set(options.preferredIds ?? []);
    const excludedIds = new Set(options.excludeIds ?? []);
    const preferred = this.fixtures.filter((fixture) => preferredIds.has(fixture.id));
    const unplayedInTier = tierEligible.filter((fixture) => !excludedIds.has(fixture.id));
    const unplayedAcrossCorpus = options.allowTierOverflowWhenExhausted
      ? this.fixtures.filter((fixture) => !excludedIds.has(fixture.id))
      : [];
    const available = preferred.length > 0
      ? preferred
      : unplayedInTier.length > 0
        ? unplayedInTier
        : unplayedAcrossCorpus.length > 0
          ? nearestUnlockedTier(unplayedAcrossCorpus)
          : tierEligible;
    const maxTier = Math.max(...available.map((fixture) => fixture.tier));
    const tierPool =
      options.preferHighestTier === false
        ? available
        : available.filter((fixture) => fixture.tier === maxTier);
    const recentCategories = new Set([
      ...(options.recentCategories ?? []),
      options.previousCategory
    ].filter((category): category is string => typeof category === "string" && category.length > 0));
    const recentIds = new Set([
      ...(options.recentIds ?? []),
      options.previousId
    ].filter((id): id is string => typeof id === "string" && id.length > 0));
    const categoryRotated = tierPool.filter((fixture) => !recentCategories.has(fixture.category));
    const immediateCategoryRotated = tierPool.filter((fixture) => fixture.category !== options.previousCategory);
    const categoryPool =
      categoryRotated.length > 0
        ? categoryRotated
        : immediateCategoryRotated.length > 0
          ? immediateCategoryRotated
          : tierPool;
    const nonRepeating = categoryPool.filter((fixture) => !recentIds.has(fixture.id));
    const immediateNonRepeating = categoryPool.filter((fixture) => fixture.id !== options.previousId);
    const pool =
      nonRepeating.length > 0
        ? nonRepeating
        : immediateNonRepeating.length > 0
          ? immediateNonRepeating
          : categoryPool;

    return pool[(Math.max(1, round) - 1) % pool.length];
  }

  validateAll(): FixtureValidationResult {
    const errors = this.fixtures.flatMap((fixture) => validateFixture(fixture).errors);

    return {
      ok: errors.length === 0,
      errors
    };
  }
}

function nearestUnlockedTier(fixtures: readonly TokenFixture[]): TokenFixture[] {
  const minimumTier = Math.min(...fixtures.map(({ tier }) => tier));
  return fixtures.filter(({ tier }) => tier === minimumTier);
}
