import type { LayoutRect } from "./PlayLayoutSystem";

export interface TutorialCompleteLayout {
  compact: boolean;
  panel: LayoutRect;
  chrome: LayoutRect;
  chromeText: { x: number; y: number };
  title: { x: number; y: number; fontSize: number; wordWrapWidth: number };
  summary: { x: number; y: number; fontSize: number; wordWrapWidth: number };
  primaryButton: LayoutRect;
  menuButton: LayoutRect;
}

const MAX_PANEL_WIDTH = 680;
const MAX_PANEL_HEIGHT = 420;
const PANEL_MARGIN_X = 16;
const PANEL_MARGIN_Y = 22;
const CHROME_HEIGHT = 34;
const BUTTON_HEIGHT = 46;
const BUTTON_GAP = 12;

export function computeTutorialCompleteLayout(width: number, height: number): TutorialCompleteLayout {
  const compact = width < 560;
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
  const buttonWidth = Math.max(220, Math.min(340, panelWidth - 48));
  const primaryY = panelY + panelHeight / 2 - 116;

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
      y: panelY - panelHeight / 2 + 22
    },
    title: {
      x: panelX,
      y: panelY - panelHeight / 2 + 96,
      fontSize: compact ? 32 : 42,
      wordWrapWidth: panelWidth - 58
    },
    summary: {
      x: panelX,
      y: panelY - panelHeight / 2 + (compact ? 168 : 174),
      fontSize: compact ? 15 : 17,
      wordWrapWidth: panelWidth - 76
    },
    primaryButton: {
      x: panelX,
      y: primaryY,
      width: buttonWidth,
      height: BUTTON_HEIGHT
    },
    menuButton: {
      x: panelX,
      y: primaryY + BUTTON_HEIGHT + BUTTON_GAP,
      width: buttonWidth,
      height: BUTTON_HEIGHT
    }
  };
}
