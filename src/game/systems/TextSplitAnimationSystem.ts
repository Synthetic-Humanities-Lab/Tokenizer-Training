import { splitGraphemes } from "./GraphemeSystem";

export interface TextSplitBounds {
  left: number;
  width: number;
  centerY: number;
}

export interface TextSplitPiecePlan {
  text: string;
  x: number;
  y: number;
  index: number;
  tokenId?: number;
  fallXOffset: number;
  rotationDeg: number;
  delayMs: number;
  durationMs: number;
}

export interface TextSplitTokenIdentityInput {
  tokenStrings: readonly string[];
  tokenIds: readonly number[];
}

export function buildSubmittedCutTextPieces(
  text: string,
  submittedCuts: number[],
  bounds: TextSplitBounds,
  tokenIdentity?: TextSplitTokenIdentityInput
): TextSplitPiecePlan[] {
  const graphemes = splitGraphemes(text);
  const length = graphemes.length;
  const cuts = [...new Set(submittedCuts)]
    .filter((cut) => Number.isInteger(cut) && cut > 0 && cut < length)
    .sort((a, b) => a - b);
  if (cuts.length === 0) {
    return [];
  }

  const boundaries = [0, ...cuts, length];

  const pieceCount = boundaries.length - 1;
  const centerIndex = (pieceCount - 1) / 2;
  const tokenIdsBySpan = tokenIdsByGraphemeSpan(graphemes, text, tokenIdentity);

  return boundaries.slice(0, -1).flatMap((start, index) => {
    const end = boundaries[index + 1];
    const pieceText = graphemes.slice(start, end).join("");
    if (!pieceText) {
      return [];
    }

    const centerRatio = (start + end) / 2 / Math.max(1, length);
    const outward = index - centerIndex;
    const direction = outward === 0 ? (index % 2 === 0 ? -1 : 1) : Math.sign(outward);
    const force = Math.max(0.7, Math.abs(outward));
    const tokenId = tokenIdsBySpan.get(spanKey(start, end));
    return [{
      text: pieceText,
      x: bounds.left + bounds.width * centerRatio,
      y: bounds.centerY,
      index,
      ...(tokenId === undefined ? {} : { tokenId }),
      fallXOffset: direction * (18 + force * 18),
      rotationDeg: direction * (7 + force * 7 + Math.min(8, pieceText.length * 0.45)),
      delayMs: index * 20,
      durationMs: 400 + Math.round(force * 32) + index * 10
    }];
  });
}

function tokenIdsByGraphemeSpan(
  graphemes: readonly string[],
  text: string,
  tokenIdentity: TextSplitTokenIdentityInput | undefined
): Map<string, number> {
  const tokenIdsBySpan = new Map<string, number>();
  if (!tokenIdentity) {
    return tokenIdsBySpan;
  }

  const { tokenStrings, tokenIds } = tokenIdentity;
  if (
    tokenStrings.length === 0 ||
    tokenStrings.length !== tokenIds.length ||
    tokenStrings.join("") !== text ||
    tokenIds.some((tokenId) => !Number.isSafeInteger(tokenId) || tokenId < 0)
  ) {
    return tokenIdsBySpan;
  }

  let start = 0;
  for (let index = 0; index < tokenStrings.length; index += 1) {
    const token = tokenStrings[index];
    const tokenGraphemes = splitGraphemes(token);
    const end = start + tokenGraphemes.length;
    if (
      tokenGraphemes.length === 0 ||
      graphemes.slice(start, end).join("") !== token
    ) {
      return new Map();
    }

    tokenIdsBySpan.set(spanKey(start, end), tokenIds[index]);
    start = end;
  }

  return start === graphemes.length ? tokenIdsBySpan : new Map();
}

function spanKey(start: number, end: number): string {
  return `${start}:${end}`;
}
