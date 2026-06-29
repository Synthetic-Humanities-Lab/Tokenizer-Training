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
  fallXOffset: number;
  rotationDeg: number;
  delayMs: number;
  durationMs: number;
}

export function buildSubmittedCutTextPieces(
  text: string,
  submittedCuts: number[],
  bounds: TextSplitBounds
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
    return [{
      text: pieceText,
      x: bounds.left + bounds.width * centerRatio,
      y: bounds.centerY,
      index,
      fallXOffset: direction * (18 + force * 18),
      rotationDeg: direction * (7 + force * 7 + Math.min(8, pieceText.length * 0.45)),
      delayMs: index * 34,
      durationMs: 700 + Math.round(force * 44) + index * 16
    }];
  });
}
