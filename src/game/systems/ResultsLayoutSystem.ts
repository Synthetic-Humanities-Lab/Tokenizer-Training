import type { LayoutRect } from "./PlayLayoutSystem";
import { safeAreaInsets, type SafeAreaInput } from "./SafeAreaSystem";

export interface ResultsLayout {
  compact: boolean;
  panel: LayoutRect;
  title: { x: number; y: number; fontSize: number; wordWrapWidth: number };
  summary: { x: number; y: number; fontSize: number; wordWrapWidth: number };
  ledger: { x: number; y: number; fontSize: number; lineSpacing: number };
  metricCards: LayoutRect[];
  copyButton: LayoutRect;
  againButton: LayoutRect;
  menuButton: LayoutRect;
}

export interface ResultsLayoutOptions {
  metricCount?: number;
}

export interface ResultMetricTypography {
  labelFontSize: number;
  valueFontSize: number;
  labelTopOffset: number;
  valueTopOffset: number;
  valueWordWrapWidth: number;
  estimatedValueLineCount: number;
}

export interface ResultMetricTypographyOptions {
  maxValueLines?: number;
}

const MAX_PANEL_WIDTH = 680;
const MAX_PANEL_HEIGHT = 520;
const PANEL_MARGIN_X = 16;
const PANEL_MARGIN_Y = 22;
const BUTTON_HEIGHT = 44;
const MAX_BUTTON_WIDTH = 280;
const MIN_BUTTON_WIDTH = 180;
const COMPACT_LEDGER_TEXT_HEIGHT_RATIO = 1.33;
const MIN_METRIC_VALUE_FONT_SIZE = 10;
const ESTIMATED_GLYPH_WIDTH_RATIO = 0.55;
const ESTIMATED_LINE_HEIGHT_RATIO = 1.15;
const COMPACT_TITLE_TOP_OFFSET = 72;
const COMPACT_SUSPENDED_SUMMARY_TOP_OFFSET = 145;
const COMPACT_DEPLETED_SUMMARY_TOP_OFFSET = 163;
const COMPACT_SUSPENDED_METRICS_TOP_OFFSET = 205;
const COMPACT_DEPLETED_METRICS_TOP_OFFSET = 225;
export const RESULT_LEDGER_LINE_COUNT = 9;
export const RESULT_METRIC_COUNT = 5;
export const RESULT_METRIC_LABEL_FONT_SIZE = 12;

export function computeResultsLayout(
  width: number,
  height: number,
  safeAreaInput?: SafeAreaInput,
  options: ResultsLayoutOptions = {}
): ResultsLayout {
  const safeArea = safeAreaInsets(safeAreaInput);
  const usableWidth = Math.max(0, width - safeArea.left - safeArea.right);
  const usableHeight = Math.max(0, height - safeArea.top - safeArea.bottom);
  const compact = width < 560;
  const shortPhone = compact && width < 360;
  const panelWidth = Math.min(MAX_PANEL_WIDTH, usableWidth - PANEL_MARGIN_X * 2);
  const panelHeight = Math.min(MAX_PANEL_HEIGHT, usableHeight - PANEL_MARGIN_Y * 2);
  const panelX = safeArea.left + usableWidth / 2;
  const panelY = safeArea.top + usableHeight / 2;
  const panel = {
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight
  };
  const metricCount = Math.max(1, Math.floor(options.metricCount ?? RESULT_METRIC_COUNT));
  const depletedLayout = metricCount === 4;
  const buttonWidth = Math.min(MAX_BUTTON_WIDTH, Math.max(MIN_BUTTON_WIDTH, panelWidth - 48));
  const metricCards = computeMetricCards(panel, compact, shortPhone, metricCount);
  const buttonBottomMargin = compact ? 12 : 26;
  const buttonGap = compact ? 8 : 10;
  const menuButtonY = panelY + panelHeight / 2 - buttonBottomMargin - BUTTON_HEIGHT / 2;
  const againButtonY = menuButtonY - BUTTON_HEIGHT - buttonGap;
  const copyButtonY = againButtonY - BUTTON_HEIGHT - buttonGap;

  return {
    compact,
    panel,
    title: {
      x: panelX,
      y: panelY - panelHeight / 2 + (compact ? COMPACT_TITLE_TOP_OFFSET : 92),
      fontSize: shortPhone ? 24 : compact ? 28 : 42,
      wordWrapWidth: panelWidth - 36
    },
    summary: {
      x: panelX,
      y: panelY - panelHeight / 2 + (
        compact
          ? depletedLayout
            ? COMPACT_DEPLETED_SUMMARY_TOP_OFFSET
            : COMPACT_SUSPENDED_SUMMARY_TOP_OFFSET
          : 156
      ),
      fontSize: shortPhone ? 12 : compact ? 13 : 17,
      wordWrapWidth: panelWidth - 72
    },
    ledger: {
      x: panelX,
      y: panelY + (compact ? 4 : 0),
      fontSize: compact ? 11 : 14,
      lineSpacing: compact ? 2 : 3
    },
    metricCards,
    copyButton: {
      x: panelX,
      y: copyButtonY,
      width: buttonWidth,
      height: BUTTON_HEIGHT
    },
    againButton: {
      x: panelX,
      y: againButtonY,
      width: buttonWidth,
      height: BUTTON_HEIGHT
    },
    menuButton: {
      x: panelX,
      y: menuButtonY,
      width: buttonWidth,
      height: BUTTON_HEIGHT
    }
  };
}

function computeMetricCards(panel: LayoutRect, compact: boolean, shortPhone: boolean, metricCount: number): LayoutRect[] {
  const normalizedMetricCount = Math.max(1, Math.floor(metricCount));
  const fourCardGrid = normalizedMetricCount === 4;
  const constrainedCompact = compact && panel.height < MAX_PANEL_HEIGHT;
  const columns = compact ? 2 : fourCardGrid ? 4 : 3;
  const gapX = compact ? 8 : 12;
  const gapY = compact ? fourCardGrid ? 8 : 6 : 8;
  const cardHeight = compact
    ? fourCardGrid ? 46 : shortPhone || constrainedCompact ? 38 : 42
    : fourCardGrid ? 48 : 44;
  const panelTop = panel.y - panel.height / 2;
  const compactTopOffset = fourCardGrid
    ? COMPACT_DEPLETED_METRICS_TOP_OFFSET
    : COMPACT_SUSPENDED_METRICS_TOP_OFFSET;
  const top = panelTop + (compact ? compactTopOffset : 196);
  const availableWidth = panel.width - 48;
  const cardWidth = (availableWidth - gapX * (columns - 1)) / columns;
  const left = panel.x - availableWidth / 2;

  return Array.from({ length: normalizedMetricCount }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    if (compact && !fourCardGrid && index === normalizedMetricCount - 1) {
      return {
        x: panel.x,
        y: top + cardHeight / 2 + row * (cardHeight + gapY),
        width: availableWidth,
        height: cardHeight
      };
    }

    return {
      x: left + cardWidth / 2 + column * (cardWidth + gapX),
      y: top + cardHeight / 2 + row * (cardHeight + gapY),
      width: cardWidth,
      height: cardHeight
    };
  });
}

export function computeResultMetricTypography(
  layout: ResultsLayout,
  card: LayoutRect,
  value: string,
  options: ResultMetricTypographyOptions = {}
): ResultMetricTypography {
  const fullWidthCompact = layout.compact && card.width > layout.panel.width * 0.7;
  const preferredValueFontSize = layout.compact ? fullWidthCompact ? 13 : 12 : 13;
  const labelTopOffset = layout.compact ? 4 : 5;
  const valueTopOffset = layout.compact ? 18 : 19;
  const valueWordWrapWidth = Math.max(1, card.width - 16);
  const maxValueLines = Math.max(1, Math.floor(options.maxValueLines ?? 1));
  const availableValueHeight = Math.max(1, card.height - valueTopOffset - 2);

  for (let fontSize = preferredValueFontSize; fontSize >= MIN_METRIC_VALUE_FONT_SIZE; fontSize -= 1) {
    const lineCount = estimatedWrappedLineCount(value, fontSize, valueWordWrapWidth);
    const estimatedHeight = lineCount * fontSize * ESTIMATED_LINE_HEIGHT_RATIO;
    if (lineCount <= maxValueLines && estimatedHeight <= availableValueHeight) {
      return {
        labelFontSize: RESULT_METRIC_LABEL_FONT_SIZE,
        valueFontSize: fontSize,
        labelTopOffset,
        valueTopOffset,
        valueWordWrapWidth,
        estimatedValueLineCount: lineCount
      };
    }
  }

  return {
    labelFontSize: RESULT_METRIC_LABEL_FONT_SIZE,
    valueFontSize: MIN_METRIC_VALUE_FONT_SIZE,
    labelTopOffset,
    valueTopOffset,
    valueWordWrapWidth,
    estimatedValueLineCount: estimatedWrappedLineCount(
      value,
      MIN_METRIC_VALUE_FONT_SIZE,
      valueWordWrapWidth
    )
  };
}

function estimatedWrappedLineCount(text: string, fontSize: number, width: number): number {
  const maxCharacters = Math.max(1, Math.floor(width / (fontSize * ESTIMATED_GLYPH_WIDTH_RATIO)));
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 1;
  }

  let lines = 1;
  let lineLength = 0;
  for (const word of words) {
    const nextLength = lineLength === 0 ? word.length : lineLength + 1 + word.length;
    if (nextLength <= maxCharacters) {
      lineLength = nextLength;
      continue;
    }

    lines += 1;
    lineLength = word.length;
  }

  return lines;
}

export function resultLedgerRect(layout: ResultsLayout, lineCount = RESULT_LEDGER_LINE_COUNT): LayoutRect {
  const rowHeight = resultLedgerRowHeight(layout);
  return {
    x: layout.ledger.x,
    y: layout.ledger.y,
    width: layout.panel.width - 48,
    height: lineCount * rowHeight - layout.ledger.lineSpacing
  };
}

export function resultLedgerRowHeight(layout: ResultsLayout): number {
  if (!layout.compact) {
    return layout.ledger.fontSize + layout.ledger.lineSpacing;
  }

  return layout.ledger.fontSize * COMPACT_LEDGER_TEXT_HEIGHT_RATIO + layout.ledger.lineSpacing;
}
