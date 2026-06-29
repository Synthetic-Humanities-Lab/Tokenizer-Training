import type { LayoutRect } from "./PlayLayoutSystem";

export interface ResultsLayout {
  compact: boolean;
  panel: LayoutRect;
  chrome: LayoutRect;
  chromeText: { x: number; y: number; text: string; fontSize: number };
  title: { x: number; y: number; fontSize: number; wordWrapWidth: number };
  summary: { x: number; y: number; fontSize: number; wordWrapWidth: number };
  ledger: { x: number; y: number; fontSize: number; lineSpacing: number };
  metricCards: LayoutRect[];
  copyButton: LayoutRect;
  againButton: LayoutRect;
  menuButton: LayoutRect;
}

const MAX_PANEL_WIDTH = 680;
const MAX_PANEL_HEIGHT = 520;
const PANEL_MARGIN_X = 16;
const PANEL_MARGIN_Y = 22;
const CHROME_HEIGHT = 34;
const BUTTON_HEIGHT = 44;
const MAX_BUTTON_WIDTH = 280;
const MIN_BUTTON_WIDTH = 180;
const COMPACT_LEDGER_TEXT_HEIGHT_RATIO = 1.33;
export const RESULT_LEDGER_LINE_COUNT = 9;
export const RESULT_METRIC_COUNT = 9;

export function computeResultsLayout(width: number, height: number): ResultsLayout {
  const compact = width < 560;
  const shortPhone = compact && width < 360;
  const panelWidth = Math.min(MAX_PANEL_WIDTH, width - PANEL_MARGIN_X * 2);
  const panelHeight = Math.min(MAX_PANEL_HEIGHT, height - PANEL_MARGIN_Y * 2);
  const panelX = width / 2;
  const panelY = height / 2;
  const panel = {
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight
  };
  const buttonWidth = Math.min(MAX_BUTTON_WIDTH, Math.max(MIN_BUTTON_WIDTH, panelWidth - 48));
  const metricCards = computeMetricCards(panel, compact, shortPhone);
  const buttonBottomMargin = compact ? 12 : 26;
  const buttonGap = compact ? 8 : 10;
  const menuButtonY = panelY + panelHeight / 2 - buttonBottomMargin - BUTTON_HEIGHT / 2;
  const againButtonY = menuButtonY - BUTTON_HEIGHT - buttonGap;
  const copyButtonY = againButtonY - BUTTON_HEIGHT - buttonGap;

  return {
    compact,
    panel,
    chrome: {
      x: panelX,
      y: panelY - panelHeight / 2 + 22,
      width: panelWidth - 18,
      height: CHROME_HEIGHT
    },
    chromeText: {
      x: panelX - panelWidth / 2 + 24,
      y: panelY - panelHeight / 2 + 22,
      text: compact ? "wienerworks://audit" : "wienerworks://human-segmentation/audit-summary",
      fontSize: compact ? 10 : 12
    },
    title: {
      x: panelX,
      y: panelY - panelHeight / 2 + (shortPhone ? 84 : 92),
      fontSize: shortPhone ? 24 : compact ? 28 : 42,
      wordWrapWidth: panelWidth - 36
    },
    summary: {
      x: panelX,
      y: panelY - panelHeight / 2 + (shortPhone ? 152 : compact ? 142 : 156),
      fontSize: compact ? 14 : 17,
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

function computeMetricCards(panel: LayoutRect, compact: boolean, shortPhone: boolean): LayoutRect[] {
  const columns = compact ? 2 : 3;
  const gapX = compact ? 8 : 12;
  const gapY = compact ? shortPhone ? 6 : 4 : 8;
  const cardHeight = compact ? shortPhone ? 26 : 28 : 36;
  const panelTop = panel.y - panel.height / 2;
  const top = panelTop + (compact ? shortPhone ? 196 : 186 : 196);
  const availableWidth = panel.width - 48;
  const cardWidth = (availableWidth - gapX * (columns - 1)) / columns;
  const left = panel.x - availableWidth / 2;

  return Array.from({ length: RESULT_METRIC_COUNT }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      x: left + cardWidth / 2 + column * (cardWidth + gapX),
      y: top + cardHeight / 2 + row * (cardHeight + gapY),
      width: cardWidth,
      height: cardHeight
    };
  });
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
