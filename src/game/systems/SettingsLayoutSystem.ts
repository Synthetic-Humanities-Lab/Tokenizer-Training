import type { LayoutRect } from "./PlayLayoutSystem";
import { safeAreaInsets, type SafeAreaInput } from "./SafeAreaSystem";

interface SettingsTextLayout {
  x: number;
  y: number;
  fontSize: number;
  width: number;
}

export interface SettingsLayout {
  compact: boolean;
  card: LayoutRect;
  title: SettingsTextLayout;
  status: SettingsTextLayout;
  soundButton: LayoutRect;
  resetButton: LayoutRect;
  resetDialog: LayoutRect;
  resetDialogTitle: SettingsTextLayout;
  resetDialogMessage: SettingsTextLayout;
  resetCancelButton: LayoutRect;
  resetConfirmButton: LayoutRect;
  reducedMotionControl: LayoutRect;
  hapticsControl: LayoutRect;
  backButton: LayoutRect;
}

export function computeSettingsLayout(
  width: number,
  height: number,
  mobileSurface: boolean,
  safeAreaInput?: SafeAreaInput
): SettingsLayout {
  const safeArea = safeAreaInsets(safeAreaInput);
  const usableWidth = Math.max(0, width - safeArea.left - safeArea.right);
  const usableHeight = Math.max(0, height - safeArea.top - safeArea.bottom);
  const compact = mobileSurface || width < 620;
  const cardWidth = Math.min(compact ? 430 : 620, Math.max(0, usableWidth - 24));
  const cardHeight = Math.min(Math.max(0, usableHeight - 24), 500);
  const cardX = safeArea.left + usableWidth / 2;
  const cardY = safeArea.top + usableHeight / 2;
  const top = cardY - cardHeight / 2;
  const bottom = cardY + cardHeight / 2;
  const buttonWidth = compact ? Math.min(cardWidth - 40, 320) : 260;
  const buttonHeight = compact ? 48 : 44;
  const controlGap = compact ? 10 : 12;
  const soundY = top + (compact ? 172 : 176);
  const resetY = soundY + buttonHeight + controlGap;
  const reducedMotionY = resetY + buttonHeight + controlGap;
  const hapticsY = reducedMotionY + buttonHeight + controlGap;
  const resetDialogWidth = Math.min(264, Math.max(0, cardWidth - 32));
  const resetDialogHeight = Math.min(232, Math.max(0, cardHeight - 32));
  const resetDialogCopyWidth = Math.min(224, Math.max(0, resetDialogWidth - 40));
  const resetDialogButtonGap = Math.min(12, resetDialogCopyWidth);
  const resetDialogButtonWidth = Math.max(0, (resetDialogCopyWidth - resetDialogButtonGap) / 2);
  const resetDialogButtonHeight = 48;
  const resetDialogButtonOffset = resetDialogButtonWidth / 2 + resetDialogButtonGap / 2;
  const resetDialogButtonY = cardY + resetDialogHeight / 2 - 24 - resetDialogButtonHeight / 2;

  return {
    compact,
    card: { x: cardX, y: cardY, width: cardWidth, height: cardHeight },
    title: { x: cardX, y: top + (compact ? 46 : 50), fontSize: compact ? 32 : 36, width: cardWidth - 48 },
    status: { x: cardX, y: top + (compact ? 108 : 112), fontSize: compact ? 14 : 15, width: cardWidth - 52 },
    soundButton: { x: cardX, y: soundY, width: buttonWidth, height: buttonHeight },
    resetButton: { x: cardX, y: resetY, width: buttonWidth, height: buttonHeight },
    resetDialog: { x: cardX, y: cardY, width: resetDialogWidth, height: resetDialogHeight },
    resetDialogTitle: {
      x: cardX,
      y: cardY - resetDialogHeight / 2 + 36,
      fontSize: 22,
      width: resetDialogCopyWidth
    },
    resetDialogMessage: {
      x: cardX,
      y: cardY - resetDialogHeight / 2 + 98,
      fontSize: 14,
      width: resetDialogCopyWidth
    },
    resetCancelButton: {
      x: cardX - resetDialogButtonOffset,
      y: resetDialogButtonY,
      width: resetDialogButtonWidth,
      height: resetDialogButtonHeight
    },
    resetConfirmButton: {
      x: cardX + resetDialogButtonOffset,
      y: resetDialogButtonY,
      width: resetDialogButtonWidth,
      height: resetDialogButtonHeight
    },
    reducedMotionControl: { x: cardX, y: reducedMotionY, width: buttonWidth, height: buttonHeight },
    hapticsControl: { x: cardX, y: hapticsY, width: buttonWidth, height: buttonHeight },
    backButton: {
      x: cardX,
      y: bottom - (compact ? 40 : 42),
      width: buttonWidth,
      height: buttonHeight
    }
  };
}
