import type { LayoutRect } from "./PlayLayoutSystem";

export interface MenuLayout {
  compact: boolean;
  card: LayoutRect;
  logo: LayoutRect;
  menuMascot: LayoutRect;
  companyMark: { x: number; y: number; fontSize: number; wordWrapWidth: number; align: "left" | "center" };
  title: { x: number; y: number; fontSize: number; wordWrapWidth: number };
  moduleLabel: { x: number; y: number; fontSize: number; text: string; wordWrapWidth: number };
  premise: { x: number; y: number; fontSize: number; wordWrapWidth: number };
  workOrder: {
    visible: boolean;
    panel: LayoutRect;
    label: { x: number; y: number; fontSize: number };
    rowX: number;
    rowYs: number[];
    rowFontSize: number;
    rowWordWrapWidth: number;
  };
  bestRecord: { x: number; y: number; fontSize: number; wordWrapWidth: number };
  tutorialButton: LayoutRect;
  endlessButton: LayoutRect;
  soundButton: LayoutRect;
}

const MAX_CARD_WIDTH = 680;
const DESKTOP_CARD_HEIGHT = 500;
const COMPACT_CARD_HEIGHT = 600;
const CARD_MARGIN_X = 16;
const CARD_MARGIN_Y = 22;
const BUTTON_HEIGHT = 46;
const BUTTON_GAP = 12;
const DESKTOP_BUTTON_GAP = 14;

export function computeMenuLayout(width: number, height: number): MenuLayout {
  const compact = width < 620;
  const shortPhone = compact && width < 340;
  const cardWidth = Math.min(compact ? MAX_CARD_WIDTH : 780, width - CARD_MARGIN_X * 2);
  const cardHeight = Math.min(height - CARD_MARGIN_Y * 2, compact ? COMPACT_CARD_HEIGHT : 470);
  const cardX = width / 2;
  const cardY = height / 2;
  const card = {
    x: cardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight
  };
  const buttonWidth = compact
    ? Math.max(0, Math.min(cardWidth - 32, Math.max(236, cardWidth - 96)))
    : 174;
  const buttonBlockHeight = compact ? BUTTON_HEIGHT * 3 + BUTTON_GAP * 2 : BUTTON_HEIGHT;
  const buttonBottomMargin = shortPhone ? 2 : 42;
  const buttonY = cardY + cardHeight / 2 - buttonBottomMargin - buttonBlockHeight + BUTTON_HEIGHT / 2;
  const desktopButtonStartX = cardX - (buttonWidth * 2 + 138 + DESKTOP_BUTTON_GAP * 2) / 2 + buttonWidth / 2;
  const workOrderVisible = false;
  const workOrderPanel = {
    x: cardX,
    y: cardY - cardHeight / 2 + 324,
    width: Math.min(638, cardWidth - 84),
    height: 96
  };
  const titleY = cardY - cardHeight / 2 + (shortPhone ? 172 : compact ? 196 : 184);
  const mascotHeight = shortPhone ? 36 : compact ? 42 : 42;
  const moduleText = compact
    ? "HUMAN SEGMENTATION DIVISION"
    : "Human Segmentation Division";

  return {
    compact,
    card,
    logo: {
      x: cardX,
      y: cardY - cardHeight / 2 + 108,
      width: 0,
      height: 0
    },
    menuMascot: {
      x: cardX,
      y: cardY - cardHeight / 2 + (shortPhone ? 118 : compact ? 128 : 132),
      width: mascotHeight * (69 / 89),
      height: mascotHeight
    },
    companyMark: {
      x: cardX,
      y: cardY - cardHeight / 2 + (compact ? 78 : 96),
      fontSize: compact ? 18 : 20,
      wordWrapWidth: compact ? cardWidth - 88 : cardWidth - 220,
      align: "center"
    },
    title: {
      x: cardX,
      y: titleY,
      fontSize: shortPhone ? 23 : width < 560 ? 34 : 48,
      wordWrapWidth: compact ? cardWidth - 58 : cardWidth - 130
    },
    moduleLabel: {
      x: cardX,
      y: cardY - cardHeight / 2 + (shortPhone ? 230 : compact ? 264 : 258),
      fontSize: compact ? 11 : 13,
      text: moduleText,
      wordWrapWidth: compact ? cardWidth - 56 : cardWidth - 130
    },
    premise: {
      x: cardX,
      y: cardY - cardHeight / 2 + (shortPhone ? 286 : compact ? 316 : 324),
      fontSize: compact ? 14 : 15,
      wordWrapWidth: compact ? cardWidth - 42 : cardWidth - 130
    },
    workOrder: {
      visible: workOrderVisible,
      panel: workOrderPanel,
      label: {
        x: workOrderPanel.x - workOrderPanel.width / 2 + 14,
        y: workOrderPanel.y - workOrderPanel.height / 2 + 15,
        fontSize: 10
      },
      rowX: workOrderPanel.x - workOrderPanel.width / 2 + 14,
      rowYs: [workOrderPanel.y - 7, workOrderPanel.y + 11, workOrderPanel.y + 29],
      rowFontSize: 11,
      rowWordWrapWidth: workOrderPanel.width - 28
    },
    bestRecord: {
      x: cardX,
      y: cardY - cardHeight / 2 + (shortPhone ? 339 : compact ? 376 : 370),
      fontSize: compact ? 14 : 15,
      wordWrapWidth: compact ? cardWidth - 48 : cardWidth - 130
    },
    tutorialButton: {
      x: compact ? cardX : desktopButtonStartX,
      y: buttonY,
      width: buttonWidth,
      height: BUTTON_HEIGHT
    },
    endlessButton: {
      x: compact ? cardX : desktopButtonStartX + buttonWidth + DESKTOP_BUTTON_GAP,
      y: compact ? buttonY + BUTTON_HEIGHT + BUTTON_GAP : buttonY,
      width: buttonWidth,
      height: BUTTON_HEIGHT
    },
    soundButton: {
      x: compact ? cardX : desktopButtonStartX + (buttonWidth + DESKTOP_BUTTON_GAP) * 2,
      y: compact ? buttonY + (BUTTON_HEIGHT + BUTTON_GAP) * 2 : buttonY,
      width: compact ? buttonWidth : 138,
      height: BUTTON_HEIGHT
    }
  };
}
