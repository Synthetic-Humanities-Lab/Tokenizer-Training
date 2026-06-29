export interface GraphemeSpan {
  index: number;
  text: string;
  byteStart: number;
  byteEnd: number;
}

const encoder = new TextEncoder();

type SegmenterConstructor = new (
  locale?: string,
  options?: { granularity?: "grapheme" }
) => {
  segment(input: string): Iterable<{ segment: string }>;
};

export function splitGraphemes(text: string): string[] {
  const segmenter = (Intl as typeof Intl & { Segmenter?: SegmenterConstructor }).Segmenter;
  if (!segmenter) {
    return Array.from(text);
  }

  return Array.from(new segmenter("en", { granularity: "grapheme" }).segment(text), (part) => part.segment);
}

export function graphemeLength(text: string): number {
  return splitGraphemes(text).length;
}

export function segmentGraphemesWithByteSpans(text: string): GraphemeSpan[] {
  let byteCursor = 0;
  return splitGraphemes(text).map((grapheme, index) => {
    const byteLength = encoder.encode(grapheme).length;
    const span = {
      index,
      text: grapheme,
      byteStart: byteCursor,
      byteEnd: byteCursor + byteLength
    };
    byteCursor += byteLength;
    return span;
  });
}

export function byteLength(text: string): number {
  return encoder.encode(text).length;
}

export function graphemeIndexForByteOffset(spans: GraphemeSpan[], byteOffset: number): number | null {
  if (byteOffset === 0) {
    return 0;
  }

  const boundary = spans.find((span) => span.byteEnd === byteOffset);
  return boundary ? boundary.index + 1 : null;
}

export function graphemeBoundaryByteOffsets(spans: GraphemeSpan[]): number[] {
  return [0, ...spans.map((span) => span.byteEnd)];
}
