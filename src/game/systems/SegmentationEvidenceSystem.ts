import {
  shortLandscapeReviewColumns,
  usesShortLandscapeReviewLayout,
  type LayoutRect
} from "./PlayLayoutSystem";

export interface SegmentationEvidenceOptions {
  compact?: boolean;
  maxCharsPerRow?: number;
  submittedCutCount?: number;
  truthBoundaryCount?: number;
  correctCutCount?: number;
  missedCutCount?: number;
  falseCutCount?: number;
}

export interface SegmentationEvidenceLayoutInput {
  viewport: { width: number; height: number };
  textPanel: LayoutRect;
  compact: boolean;
  lineCount: number;
}

export interface SegmentationEvidenceLayout {
  panel: LayoutRect;
  text: {
    x: number;
    y: number;
    wordWrapWidth: number;
    fontSize: number;
    paddingX: number;
    paddingY: number;
  };
  maxCharsPerRow: number;
}

export interface SegmentationEvidenceChipSpan {
  rowIndex: number;
  start: number;
  length: number;
  text: string;
  leadingSpace: boolean;
}

export interface SegmentationEvidenceRevealInput {
  elapsedMs?: number | null;
}

export interface SegmentationEvidenceRevealState {
  active: boolean;
  progress: number;
  panelAlpha: number;
  textAlpha: number;
  accentAlpha: number;
  chipBoostAlpha: number;
  topRuleWidthScale: number;
}

export const SEGMENTATION_EVIDENCE_REVEAL_MS = 460;
export const SEGMENTATION_EVIDENCE_DESKTOP_PROMPT_GAP_Y = 12;
export const SEGMENTATION_EVIDENCE_COMPACT_PROMPT_GAP_Y = 20;
export const SEGMENTATION_EVIDENCE_COMPACT_MAX_HEIGHT = 96;

export function displayTokenSegment(token: string): string {
  if (token.length === 0) {
    return "[empty]";
  }

  return [...token].map((character) => {
    if (character === "\t") return "[tab]";
    if (character === "\n") return "[newline]";
    return character;
  }).join("");
}

export function segmentationEvidenceText(
  tokenStrings: string[],
  options: SegmentationEvidenceOptions = {}
): string {
  const compact = options.compact ?? false;
  const maxCharsPerRow = options.maxCharsPerRow ?? (compact ? 38 : 86);
  const segments = tokenStrings.map((token) => `<${displayTokenSegment(token)}>`);
  const rows = packRows(segments, maxCharsPerRow);
  const labels = segmentationEvidenceLabels(segments.length, options);

  return [...labels, ...rows].join("\n");
}

function segmentationEvidenceLabels(tokenCount: number, options: SegmentationEvidenceOptions): string[] {
  const compact = options.compact ?? false;
  const submittedCutCount = safeCount(options.submittedCutCount);
  const truthBoundaryCount = safeCount(options.truthBoundaryCount);
  const correctCutCount = safeCount(options.correctCutCount);
  const missedCutCount = safeCount(options.missedCutCount);
  const falseCutCount = safeCount(options.falseCutCount);
  const tokenLabel = compact
    ? `TOKENS ${tokenCount}`
    : `TOKEN SPLIT - ${tokenCount} TOKEN${tokenCount === 1 ? "" : "S"}`;

  if (correctCutCount !== undefined && missedCutCount !== undefined && falseCutCount !== undefined) {
    const submittedLabel = submittedCutCount === undefined ? "YOUR CUTS ?" : `YOUR CUTS ${submittedCutCount}`;
    const auditLabel = compact
      ? `${submittedLabel} | OK ${correctCutCount} M ${missedCutCount} F ${falseCutCount}`
      : `CUT AUDIT - ${submittedLabel} | OK ${correctCutCount} | MISS ${missedCutCount} | FALSE ${falseCutCount}`;

    return [tokenLabel, auditLabel];
  }

  if (submittedCutCount === undefined || truthBoundaryCount === undefined) {
    return [compact ? `TOKENS ${tokenCount}` : tokenLabel];
  }

  const edgeLabel = compact
    ? `YOUR CUTS ${submittedCutCount} | TRUE EDGES ${truthBoundaryCount}`
    : `CUT CHECK - YOUR CUTS ${submittedCutCount} | TRUE EDGES ${truthBoundaryCount}`;

  return [tokenLabel, edgeLabel];
}

export function segmentationEvidenceChipSpans(evidenceText: string): SegmentationEvidenceChipSpan[] {
  return segmentationEvidenceTokenRows(evidenceText)
    .flatMap((row, rowIndex) => {
      const spans: SegmentationEvidenceChipSpan[] = [];
      const matcher = /<[^>]*>/g;
      let match: RegExpExecArray | null;
      while ((match = matcher.exec(row)) !== null) {
        const text = match[0] ?? "";
        spans.push({
          rowIndex,
          start: match.index,
          length: text.length,
          text,
          leadingSpace: text.startsWith("< ")
        });
      }

      return spans;
    });
}

export function segmentationEvidenceHeaderLineCount(evidenceText: string): number {
  const rows = evidenceText.split("\n");
  const firstTokenRow = rows.findIndex((row) => row.includes("<"));

  return firstTokenRow < 0 ? Math.max(1, rows.length) : Math.max(1, firstTokenRow);
}

export function segmentationEvidenceTokenRows(evidenceText: string): string[] {
  const rows = evidenceText.split("\n");
  const firstTokenRow = rows.findIndex((row) => row.includes("<"));

  return firstTokenRow < 0 ? [] : rows.slice(firstTokenRow);
}

export function segmentationEvidenceLayout(input: SegmentationEvidenceLayoutInput): SegmentationEvidenceLayout {
  const shortLandscape = usesShortLandscapeReviewLayout(input.viewport);
  const fontSize = segmentationEvidenceFontSize(input.viewport, input.compact);
  const paddingX = input.compact ? 10 : shortLandscape ? 12 : 14;
  const paddingY = input.compact ? 7 : shortLandscape ? 8 : 9;
  const panelWidth = segmentationEvidenceWidth(input.viewport, input.textPanel, input.compact);
  const lineHeight = fontSize + (input.compact || shortLandscape ? 5 : 7);
  const safeLineCount = Math.max(2, Math.floor(input.lineCount));
  const panelHeight = Math.min(
    input.compact ? SEGMENTATION_EVIDENCE_COMPACT_MAX_HEIGHT : shortLandscape ? 92 : 104,
    Math.max(input.compact ? 60 : shortLandscape ? 64 : 70, paddingY * 2 + lineHeight * safeLineCount)
  );
  const promptBottom = input.textPanel.y + input.textPanel.height / 2;
  const promptGap = input.compact
    ? SEGMENTATION_EVIDENCE_COMPACT_PROMPT_GAP_Y
    : shortLandscape
      ? 10
      : SEGMENTATION_EVIDENCE_DESKTOP_PROMPT_GAP_Y;
  const preferredY = promptBottom + promptGap + panelHeight / 2;
  const lowerReserve = input.compact ? 128 : shortLandscape ? 94 : 132;
  const maxY = input.viewport.height - lowerReserve - panelHeight / 2;
  const minY = promptBottom + 8 + panelHeight / 2;
  const panelY = maxY >= minY ? clamp(preferredY, minY, maxY) : maxY;
  const shortColumns = shortLandscape ? shortLandscapeReviewColumns(input.viewport) : undefined;

  return {
    panel: {
      x: shortColumns?.evidence.x ?? input.textPanel.x,
      y: panelY,
      width: panelWidth,
      height: panelHeight
    },
    text: {
      x: shortColumns?.evidence.x ?? input.textPanel.x,
      y: panelY,
      wordWrapWidth: Math.max(120, panelWidth - paddingX * 2),
      fontSize,
      paddingX,
      paddingY
    },
    maxCharsPerRow: Math.max(
      input.compact ? 24 : 48,
      Math.floor((panelWidth - paddingX * 2) / (fontSize * (input.compact ? 0.62 : 0.58)))
    )
  };
}

export function segmentationEvidenceRevealState(
  input: SegmentationEvidenceRevealInput = {}
): SegmentationEvidenceRevealState {
  const elapsedMs = Number.isFinite(input.elapsedMs) ? Math.max(0, input.elapsedMs ?? 0) : SEGMENTATION_EVIDENCE_REVEAL_MS;
  const progress = clamp(elapsedMs / SEGMENTATION_EVIDENCE_REVEAL_MS, 0, 1);
  const active = elapsedMs < SEGMENTATION_EVIDENCE_REVEAL_MS;
  const eased = 1 - Math.pow(1 - progress, 3);
  const decay = Math.pow(1 - progress, 2);

  return {
    active,
    progress,
    panelAlpha: 0.84 + eased * 0.14,
    textAlpha: 0.84 + eased * 0.16,
    accentAlpha: active ? 0.2 + decay * 0.52 : 0,
    chipBoostAlpha: active ? decay * 0.24 : 0,
    topRuleWidthScale: 0.22 + eased * 0.78
  };
}

function segmentationEvidenceFontSize(viewport: { width: number; height: number }, compact: boolean): number {
  if (usesShortLandscapeReviewLayout(viewport)) {
    return 18;
  }

  if (!compact) {
    return viewport.width < 1040 ? 22 : 23;
  }

  if (viewport.width < 340 || viewport.height < 620) {
    return 15;
  }

  return 17;
}

function segmentationEvidenceWidth(
  viewport: { width: number; height: number },
  textPanel: LayoutRect,
  compact: boolean
): number {
  if (usesShortLandscapeReviewLayout(viewport)) {
    return shortLandscapeReviewColumns(viewport).evidence.width;
  }

  if (compact) {
    return Math.min(textPanel.width, Math.max(260, viewport.width - 28));
  }

  return Math.min(940, Math.max(440, textPanel.width - 48), viewport.width - 56);
}

function packRows(segments: string[], maxCharsPerRow: number): string[] {
  const rows: string[] = [];
  let current = "";

  for (const segment of segments) {
    const next = current ? `${current} ${segment}` : segment;
    if (current && next.length > maxCharsPerRow) {
      rows.push(current);
      current = segment;
      continue;
    }

    current = next;
  }

  if (current) {
    rows.push(current);
  }

  return rows.length > 0 ? rows : ["[empty]"];
}

function safeCount(value: number | undefined): number | undefined {
  if (!Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.floor(value ?? 0));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
