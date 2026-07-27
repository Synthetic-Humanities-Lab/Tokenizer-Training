import type { LayoutRect } from "./PlayLayoutSystem";
import { safeAreaInsets, type SafeAreaInput } from "./SafeAreaSystem";

export interface TutorialCompleteLayout {
  compact: boolean;
  panel: LayoutRect;
  title: { x: number; y: number; fontSize: number; wordWrapWidth: number };
  summary: { x: number; y: number; fontSize: number; wordWrapWidth: number };
  primaryButton: LayoutRect;
  menuButton: LayoutRect;
}

const MAX_PANEL_WIDTH = 680;
const MAX_COMPACT_PANEL_HEIGHT = 340;
const MAX_DESKTOP_PANEL_HEIGHT = 400;
const PANEL_MARGIN_X = 16;
const PANEL_MARGIN_Y = 22;
const BUTTON_HEIGHT = 46;
const BUTTON_GAP = 12;

export function computeTutorialCompleteLayout(width: number, height: number, safeAreaInput?: SafeAreaInput): TutorialCompleteLayout {
  const safeArea = safeAreaInsets(safeAreaInput);
  const usableWidth = Math.max(0, width - safeArea.left - safeArea.right);
  const usableHeight = Math.max(0, height - safeArea.top - safeArea.bottom);
  const compact = width < 560;
  const panelWidth = Math.min(MAX_PANEL_WIDTH, usableWidth - PANEL_MARGIN_X * 2);
  const panelHeight = Math.min(
    compact ? MAX_COMPACT_PANEL_HEIGHT : MAX_DESKTOP_PANEL_HEIGHT,
    usableHeight - PANEL_MARGIN_Y * 2
  );
  const panelX = safeArea.left + usableWidth / 2;
  const panelY = safeArea.top + usableHeight / 2;
  const panel = {
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight
  };
  const buttonWidth = Math.max(220, Math.min(340, panelWidth - 48));
  const panelTop = panelY - panelHeight / 2;
  const primaryY = panelTop + (compact ? 226 : 266);

  return {
    compact,
    panel,
    title: {
      x: panelX,
      y: panelTop + (compact ? 56 : 70),
      fontSize: compact ? 32 : 42,
      wordWrapWidth: panelWidth - 58
    },
    summary: {
      x: panelX,
      y: panelTop + (compact ? 122 : 142),
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
