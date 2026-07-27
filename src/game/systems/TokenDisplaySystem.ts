export const TOKEN_ID_ENCODING = "cl100k_base";
export const DISPLAY_SPACE_MARKER = "␠";

export interface TokenIdMappingFormatOptions {
  sample?: boolean;
}

export interface OrderedTokenIdMapping {
  readonly rawText: string;
  readonly displayText: string;
  readonly tokenId: number;
  readonly description?: string;
}

interface WhitespaceDisplay {
  name: string;
  marker: string;
}

const EXPLICIT_WHITESPACE = new Map<string, WhitespaceDisplay>([
  [" ", { name: "U+0020 SPACE", marker: DISPLAY_SPACE_MARKER }],
  ["\t", { name: "U+0009 TAB", marker: "[tab]" }],
  ["\n", { name: "U+000A LINE FEED", marker: "[newline]" }],
  ["\r", { name: "U+000D CARRIAGE RETURN", marker: "[carriage-return]" }],
  ["\u00a0", { name: "U+00A0 NO-BREAK SPACE", marker: "[no-break-space]" }],
  ["\ufeff", { name: "U+FEFF ZERO WIDTH NO-BREAK SPACE", marker: "[zero-width-no-break-space]" }]
]);

export function displayTokenSegment(token: string): string {
  if (token.length === 0) {
    return "[empty]";
  }

  return [...token].map((character) => whitespaceDisplay(character)?.marker ?? character).join("");
}

export function tokenSplitLine(tokenStrings: string[]): string {
  const segments = tokenStrings.map((token) => `<${displayTokenSegment(token)}>`);
  return `Tokens ${segments.length}: ${segments.join(" ")}`;
}

export function tokenEvidenceLine(tokenStrings: string[]): string {
  return tokenStrings.map(displayTokenSegment).join(" │ ");
}

export function describeTokenWhitespace(token: string): string | undefined {
  const positionsByName = new Map<string, number[]>();

  [...token].forEach((character, index) => {
    const whitespace = whitespaceDisplay(character);
    if (whitespace === undefined) {
      return;
    }
    const positions = positionsByName.get(whitespace.name) ?? [];
    positions.push(index + 1);
    positionsByName.set(whitespace.name, positions);
  });

  if (positionsByName.size === 0) {
    return undefined;
  }

  const descriptions = [...positionsByName].map(([name, positions]) => {
    const positionLabel = positions.length === 1 ? "position" : "positions";
    const leadingQualifier = positions.includes(1) ? " (including the leading position)" : "";
    return `${name} at code point ${positionLabel} ${formatPositionList(positions)}${leadingQualifier}`;
  });
  return `Whitespace: ${descriptions.join("; ")}.`;
}

export function orderedTokenIdMappings(
  tokenStrings: readonly string[],
  tokenIds: readonly number[]
): readonly OrderedTokenIdMapping[] {
  validateTokenIdMappingInput(tokenStrings, tokenIds);

  return Object.freeze(tokenStrings.map((rawText, index) => {
    const description = describeTokenWhitespace(rawText);
    return Object.freeze({
      rawText,
      displayText: displayTokenSegment(rawText),
      tokenId: tokenIds[index],
      ...(description === undefined ? {} : { description })
    });
  }));
}

export function formatTokenIdMappings(
  tokenStrings: readonly string[],
  tokenIds: readonly number[],
  options: TokenIdMappingFormatOptions = {}
): string {
  const orderedMappings = orderedTokenIdMappings(tokenStrings, tokenIds);
  const spaceBearingIndex = orderedMappings.findIndex((mapping) => mapping.rawText.includes(" "));
  const sampleIndex = options.sample ? (spaceBearingIndex >= 0 ? spaceBearingIndex : 0) : undefined;
  const mappings = sampleIndex === undefined
    ? orderedMappings
    : [orderedMappings[sampleIndex]];
  const formattedMappings = mappings.map(
    (mapping) => `<${mapping.displayText}>->${mapping.tokenId}`
  );

  return `${TOKEN_ID_ENCODING} ${options.sample ? "sample ID" : "IDs"}: ${formattedMappings.join("  ")}`;
}

function validateTokenIdMappingInput(
  tokenStrings: readonly string[],
  tokenIds: readonly number[]
): void {
  if (tokenStrings.length !== tokenIds.length) {
    throw new RangeError(
      `${TOKEN_ID_ENCODING} mapping length mismatch: ${tokenStrings.length} token strings for ${tokenIds.length} token IDs.`
    );
  }

  if (tokenStrings.length === 0) {
    throw new RangeError(`${TOKEN_ID_ENCODING} mapping requires at least one token.`);
  }

  const invalidId = tokenIds.find((tokenId) => !Number.isSafeInteger(tokenId) || tokenId < 0);
  if (invalidId !== undefined) {
    throw new RangeError(`${TOKEN_ID_ENCODING} mapping contains invalid token ID ${invalidId}.`);
  }
}

function whitespaceDisplay(character: string): WhitespaceDisplay | undefined {
  const explicit = EXPLICIT_WHITESPACE.get(character);
  if (explicit !== undefined) {
    return explicit;
  }
  if (!/^\p{White_Space}$/u.test(character)) {
    return undefined;
  }

  const codePoint = character.codePointAt(0);
  if (codePoint === undefined) {
    return undefined;
  }
  const code = `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
  return {
    name: `${code} WHITESPACE`,
    marker: `[${code} whitespace]`
  };
}

function formatPositionList(positions: readonly number[]): string {
  if (positions.length <= 1) {
    return String(positions[0]);
  }
  if (positions.length === 2) {
    return `${positions[0]} and ${positions[1]}`;
  }

  return `${positions.slice(0, -1).join(", ")}, and ${positions.at(-1)}`;
}
