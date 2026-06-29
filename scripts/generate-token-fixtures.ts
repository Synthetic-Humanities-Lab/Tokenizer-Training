import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getEncoding, type Tiktoken } from "js-tiktoken";
import {
  byteLength,
  graphemeIndexForByteOffset,
  segmentGraphemesWithByteSpans
} from "../src/game/systems/GraphemeSystem";
import type { ByteSpan } from "../src/game/systems/TokenizerSystem";

export interface SeedRow {
  id: string;
  text: string;
  tier: number;
  category: string;
  notes: string;
}

export interface GeneratedFixture {
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
  tokenizer: "cl100k_base";
}

export interface TokenizedBytes {
  tokenIds: number[];
  tokenByteSpans: ByteSpan[];
  sourceBytes: Uint8Array;
}

export interface BuildTimeTokenizerAdapter {
  name: "cl100k_base";
  tokenizeToBytes(text: string): TokenizedBytes;
}

type ByteBackedEncoding = Tiktoken & {
  textMap: Map<number, Uint8Array>;
  inverseSpecialTokens: Record<string, Uint8Array>;
};

const encoder = new TextEncoder();
const fatalDecoder = new TextDecoder("utf-8", { fatal: true });

export class UnsafeFixtureError extends Error {
  constructor(
    readonly fixtureId: string,
    readonly reasons: string[]
  ) {
    super(`Unsafe tokenizer fixture ${fixtureId}: ${reasons.join("; ")}`);
  }
}

export function createBuildTimeTokenizerAdapter(): BuildTimeTokenizerAdapter {
  const encoding = getEncoding("cl100k_base") as ByteBackedEncoding;

  return {
    name: "cl100k_base",
    tokenizeToBytes(text: string): TokenizedBytes {
      const tokenIds = encoding.encode(text);
      let cursor = 0;
      const tokenByteSpans: ByteSpan[] = [];
      const tokenBytes: number[] = [];

      for (const tokenId of tokenIds) {
        const bytes = encoding.textMap.get(tokenId) ?? encoding.inverseSpecialTokens[String(tokenId)];
        if (!bytes) {
          throw new Error(`Tokenizer ${this.name} did not expose bytes for token ${tokenId}.`);
        }

        tokenByteSpans.push([cursor, cursor + bytes.length]);
        tokenBytes.push(...bytes);
        cursor += bytes.length;
      }

      const sourceBytes = encoder.encode(text);
      if (!sameBytes(tokenBytes, sourceBytes)) {
        throw new Error(`Tokenizer ${this.name} token bytes do not reconstruct "${text}".`);
      }

      return {
        tokenIds,
        tokenByteSpans,
        sourceBytes
      };
    }
  };
}

export function parseSeedCsv(csv: string): SeedRow[] {
  const rows = parseCsvRows(csv).filter((row) => row.some((cell) => cell.length > 0));
  const [header, ...body] = rows;

  if (!header || header.join(",") !== "id,text,tier,category,notes") {
    throw new Error("Unexpected seed CSV header.");
  }

  return body.map((row, index) => {
    if (row.length !== 5) {
      throw new Error(`Seed row ${index + 2} has ${row.length} columns; expected 5.`);
    }

    const tier = Number(row[2]);
    if (!Number.isInteger(tier) || tier < 1 || tier > 4) {
      throw new Error(`Seed row ${index + 2} has invalid tier ${row[2]}.`);
    }

    return {
      id: row[0],
      text: row[1],
      tier,
      category: row[3],
      notes: row[4]
    };
  });
}

export function generateFixtures(
  rows: SeedRow[],
  adapter: BuildTimeTokenizerAdapter = createBuildTimeTokenizerAdapter()
): GeneratedFixture[] {
  return rows.map((row) => generateFixture(row, adapter));
}

export function generateFixture(
  row: SeedRow,
  adapter: BuildTimeTokenizerAdapter = createBuildTimeTokenizerAdapter()
): GeneratedFixture {
  const tokenized = adapter.tokenizeToBytes(row.text);
  const graphemeSpans = segmentGraphemesWithByteSpans(row.text);
  const graphemes = graphemeSpans.map((span) => span.text);
  const graphemeByteSpans = graphemeSpans.map((span): ByteSpan => [span.byteStart, span.byteEnd]);
  const unsafeReasons: string[] = [];
  const boundaryPositions: number[] = [];
  const boundaryBytePositions: number[] = [];

  for (const [, byteEnd] of tokenized.tokenByteSpans.slice(0, -1)) {
    const graphemeIndex = graphemeIndexForByteOffset(graphemeSpans, byteEnd);
    if (graphemeIndex === null) {
      unsafeReasons.push(`token byte boundary ${byteEnd} falls inside a grapheme`);
      continue;
    }

    if (graphemes[graphemeIndex - 1] === " ") {
      unsafeReasons.push(`token boundary ${graphemeIndex} follows a visible space`);
    }

    boundaryPositions.push(graphemeIndex);
    boundaryBytePositions.push(byteEnd);
  }

  const tokenStrings = tokenized.tokenByteSpans.map(([start, end]) => decodeUtf8Strict(
    row.id,
    tokenized.sourceBytes.slice(start, end),
    unsafeReasons
  ));

  if (tokenStrings.some(isStandaloneBlankLikeToken)) {
    unsafeReasons.push("tokenizer created a standalone blank-like separator token");
  }

  if (hasAdjacentSpaceDuplicates(boundaryPositions, graphemes)) {
    unsafeReasons.push("token boundaries create duplicate cuts around a visible space");
  }

  if (boundaryPositions.length === 0) {
    unsafeReasons.push("fixture has no playable token boundary");
  }

  if (unsafeReasons.length > 0) {
    throw new UnsafeFixtureError(row.id, [...new Set(unsafeReasons)]);
  }

  return {
    id: row.id,
    text: row.text,
    category: row.category,
    tier: row.tier,
    token_count: tokenized.tokenIds.length,
    token_ids: tokenized.tokenIds,
    token_strings: tokenStrings,
    token_byte_spans: tokenized.tokenByteSpans,
    graphemes,
    grapheme_byte_spans: graphemeByteSpans,
    boundary_positions: boundaryPositions,
    boundary_byte_positions: boundaryBytePositions,
    difficulty_weight: difficultyWeight(row.tier, tokenized.tokenIds.length),
    notes: `${row.notes}; cl100k_base fixture; byte spans validated against grapheme boundaries`,
    tokenizer: adapter.name
  };
}

export function generateFixturesFromCsv(csv: string): GeneratedFixture[] {
  return generateFixtures(parseSeedCsv(csv));
}

function decodeUtf8Strict(fixtureId: string, bytes: Uint8Array, unsafeReasons: string[]): string {
  try {
    return fatalDecoder.decode(bytes);
  } catch {
    unsafeReasons.push(`token bytes in ${fixtureId} are not valid standalone UTF-8`);
    return "";
  }
}

function difficultyWeight(tier: number, tokenCount: number): number {
  return Number((0.85 + tier * 0.22 + Math.max(0, tokenCount - 4) * 0.08).toFixed(2));
}

function hasAdjacentSpaceDuplicates(boundaries: number[], graphemes: string[]): boolean {
  const boundarySet = new Set(boundaries);
  for (let index = 0; index < graphemes.length; index += 1) {
    if (graphemes[index] === " " && boundarySet.has(index) && boundarySet.has(index + 1)) {
      return true;
    }
  }

  return false;
}

function isStandaloneBlankLikeToken(token: string): boolean {
  return token === " " || token === "_" || token === "\u00a0";
}

function sameBytes(left: number[], right: Uint8Array): boolean {
  return left.length === right.length && left.every((byte, index) => byte === right[index]);
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const next = csv[index + 1];

    if (character === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += character;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function main(): void {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const seedPath = resolve(root, "data/seed_strings.csv");
  const outputPath = resolve(root, "src/game/data/fixtures.json");
  const csv = readFileSync(seedPath, "utf8");
  const fixtures = generateFixturesFromCsv(csv);
  const unsafe = fixtures.filter((fixture) => byteLength(fixture.text) === 0);
  if (unsafe.length > 0) {
    throw new Error(`Unexpected unsafe fixtures escaped validation: ${unsafe.map((fixture) => fixture.id).join(", ")}`);
  }

  writeFileSync(outputPath, `${JSON.stringify(fixtures, null, 2)}\n`);
  console.info(`Generated ${fixtures.length} cl100k_base tokenizer fixtures at ${outputPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
