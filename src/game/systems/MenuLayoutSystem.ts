import type { LayoutRect } from "./PlayLayoutSystem";
import { safeAreaInsets, type SafeAreaInput } from "./SafeAreaSystem";
import type { SurfaceProfile } from "./SurfaceProfileSystem";

export interface MenuLayout {
  compact: boolean;
  card: LayoutRect;
  logo: LayoutRect;
  menuMascot: LayoutRect;
  companyMark: { x: number; y: number; fontSize: number; wordWrapWidth: number; align: "left" | "center"; displayText: string };
  title: { x: number; y: number; fontSize: number; wordWrapWidth: number; displayText: string };
  moduleLabel: { x: number; y: number; fontSize: number; text: string; wordWrapWidth: number; visible: boolean };
  premise: { x: number; y: number; fontSize: number; wordWrapWidth: number; visible: boolean };
  workOrder: {
    visible: boolean;
    panel: LayoutRect;
    label: { x: number; y: number; fontSize: number };
    rowX: number;
    rowYs: number[];
    rowFontSize: number;
    rowWordWrapWidth: number;
  };
  bestRecord: { x: number; y: number; fontSize: number; wordWrapWidth: number; visible: boolean };
  tutorialButton: LayoutRect;
  trainingButton: LayoutRect;
  tokenLogButton: LayoutRect;
  settingsButton: LayoutRect;
}

const MAX_CARD_WIDTH = 680;
const DESKTOP_CARD_HEIGHT = 500;
const COMPACT_CARD_HEIGHT = 600;
const CARD_MARGIN_X = 16;
const CARD_MARGIN_Y = 22;
const BUTTON_HEIGHT = 46;
const MOBILE_BUTTON_HEIGHT = 54;
const BUTTON_GAP = 12;
const MOBILE_BUTTON_GAP = 14;
const DESKTOP_BUTTON_GAP = 14;

export function computeMenuLayout(
  width: number,
  height: number,
  safeAreaInput?: SafeAreaInput,
  surfaceProfile: SurfaceProfile = "browser"
): MenuLayout {
  const safeArea = safeAreaInsets(safeAreaInput);
  const usableWidth = Math.max(0, width - safeArea.left - safeArea.right);
  const usableHeight = Math.max(0, height - safeArea.top - safeArea.bottom);
  const mobileSurface = surfaceProfile === "mobile";
  const compact = mobileSurface || width < 620;
  const shortPhone = !mobileSurface && compact && width < 340;
  const narrowCompact = compact && width < 390;
  const secondaryCopyVisible = false;
  const bestRecordVisible = true;
  const cardMarginX = mobileSurface ? 12 : CARD_MARGIN_X;
  const cardMarginY = mobileSurface ? (height < 640 ? 26 : 12) : CARD_MARGIN_Y;
  const cardWidth = Math.min(mobileSurface ? 430 : compact ? MAX_CARD_WIDTH : 780, usableWidth - cardMarginX * 2);
  const cardHeight = Math.min(
    usableHeight - cardMarginY * 2,
    mobileSurface ? 660 : compact ? COMPACT_CARD_HEIGHT : 470
  );
  const cardX = safeArea.left + usableWidth / 2;
  const cardY = safeArea.top + usableHeight / 2;
  const card = {
    x: cardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight
  };
  const actionButtonCount = 4;
  const shortMobile = mobileSurface && usableHeight < 640;
  const buttonHeight = mobileSurface
    ? shortMobile ? 46 : MOBILE_BUTTON_HEIGHT
    : BUTTON_HEIGHT;
  const buttonGap = mobileSurface
    ? shortMobile ? 8 : MOBILE_BUTTON_GAP
    : BUTTON_GAP;
  const desktopButtonWidth = Math.min(
    174,
    Math.max(132, (cardWidth - DESKTOP_BUTTON_GAP * (actionButtonCount - 1)) / actionButtonCount)
  );
  const buttonWidth = compact
    ? Math.max(0, Math.min(cardWidth - 32, Math.max(236, cardWidth - (mobileSurface ? 40 : 96))))
    : desktopButtonWidth;
  const buttonBlockHeight = compact ? buttonHeight * actionButtonCount + buttonGap * (actionButtonCount - 1) : buttonHeight;
  const tallMobileActionLift = mobileSurface ? Math.min(56, Math.max(0, usableHeight - 552) * 0.44) : 0;
  const buttonBottomMargin = mobileSurface
    ? (shortMobile ? 14 : 22 + tallMobileActionLift)
    : shortPhone ? 2 : 42;
  const buttonY = cardY + cardHeight / 2 - buttonBottomMargin - buttonBlockHeight + buttonHeight / 2;
  const desktopButtonStartX = cardX - (buttonWidth * actionButtonCount + DESKTOP_BUTTON_GAP * (actionButtonCount - 1)) / 2 + buttonWidth / 2;
  const settingsHeight = buttonHeight;
  const settingsWidth = buttonWidth;
  const workOrderVisible = false;
  const workOrderPanel = {
    x: cardX,
    y: cardY - cardHeight / 2 + 324,
    width: Math.min(638, cardWidth - 84),
    height: 96
  };
  const cardTop = cardY - cardHeight / 2;
  const buttonTop = buttonY - buttonHeight / 2;
  const mobileReferenceScale = mobileSurface ? Math.min(1, Math.max(0.86, usableHeight / 707)) : 1;
  const compactBestY = mobileSurface
    ? Math.min(
        cardTop + (shortMobile ? 280 : 287) * mobileReferenceScale,
        buttonTop - 38
      )
    : Math.min(cardTop + 300, buttonTop - 39);
  const compactPremiseY = shortPhone ? cardTop + 286 : Math.min(cardTop + 252, compactBestY - 50);
  const compactModuleY = shortPhone ? cardTop + 230 : Math.min(cardTop + 210, compactPremiseY - 40);
  const compactTitleY = mobileSurface
    ? Math.min(
        cardTop + (shortMobile ? 200 : 209) * mobileReferenceScale,
        compactBestY - 70 * mobileReferenceScale
      )
    : shortPhone ? cardTop + 172 : narrowCompact ? cardTop + 96 : Math.min(cardTop + 156, compactModuleY - 54);
  const compactMascotY = mobileSurface
    ? Math.min(
        cardTop + (shortMobile ? 129 : 136) * mobileReferenceScale,
        compactTitleY - 70 * mobileReferenceScale
      )
    : shortPhone ? cardTop + 118 : narrowCompact ? cardTop + 58 : Math.min(cardTop + 106, compactTitleY - 48);
  const compactCompanyY = mobileSurface
    ? Math.min(
        cardTop + (shortMobile ? 69 : 74) * mobileReferenceScale,
        compactMascotY - 58 * mobileReferenceScale
      )
    : shortPhone ? cardTop + 78 : narrowCompact ? cardTop + 28 : Math.min(cardTop + 66, compactMascotY - 44);
  const titleY = compact ? compactTitleY : cardTop + 184;
  const mobileTitleFontSize = Math.round((height < 640 ? 30 : 32) * mobileReferenceScale);
  const mobileCompanyFontSize = Math.round((height < 640 ? 22 : 24) * mobileReferenceScale);
  const mascotHeight = mobileSurface ? 58 * mobileReferenceScale : shortPhone ? 36 : compact ? 42 : 42;
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
      y: compact ? compactMascotY : cardTop + 132,
      width: mascotHeight * (69 / 89),
      height: mascotHeight
    },
    companyMark: {
      x: cardX,
      y: compact ? compactCompanyY : cardTop + 96,
      fontSize: mobileSurface ? mobileCompanyFontSize : compact ? 18 : 20,
      wordWrapWidth: mobileSurface ? Math.min(210, cardWidth - 96) : compact ? cardWidth - 88 : cardWidth - 220,
      align: "center",
      displayText: mobileSurface ? "Welcome to\nWienerWorks" : "Welcome to WienerWorks"
    },
    title: {
      x: cardX,
      y: titleY,
      fontSize: mobileSurface ? mobileTitleFontSize : shortPhone ? 23 : width < 390 ? 22 : width < 560 ? 34 : 48,
      wordWrapWidth: mobileSurface ? Math.min(230, cardWidth - 48) : compact ? cardWidth - 58 : cardWidth - 130,
      displayText: mobileSurface ? "Tokenizer\nTraining" : "Tokenizer Training"
    },
    moduleLabel: {
      x: cardX,
      y: compact ? compactModuleY : cardTop + 258,
      fontSize: compact ? 11 : 13,
      text: moduleText,
      wordWrapWidth: compact ? cardWidth - 56 : cardWidth - 130,
      visible: secondaryCopyVisible
    },
    premise: {
      x: cardX,
      y: compact ? compactPremiseY : cardTop + 324,
      fontSize: compact ? 14 : 15,
      wordWrapWidth: compact ? cardWidth - 42 : cardWidth - 130,
      visible: secondaryCopyVisible
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
      y: compact ? compactBestY : cardTop + 352,
      fontSize: mobileSurface ? 13 : compact ? 14 : 15,
      wordWrapWidth: mobileSurface ? cardWidth - 24 : compact ? cardWidth - 48 : cardWidth - 130,
      visible: bestRecordVisible
    },
    tutorialButton: {
      x: compact ? cardX : desktopButtonStartX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight
    },
    trainingButton: {
      x: compact ? cardX : desktopButtonStartX + buttonWidth + DESKTOP_BUTTON_GAP,
      y: compact ? buttonY + buttonHeight + buttonGap : buttonY,
      width: buttonWidth,
      height: buttonHeight
    },
    tokenLogButton: {
      x: compact ? cardX : desktopButtonStartX + (buttonWidth + DESKTOP_BUTTON_GAP) * 2,
      y: compact ? buttonY + (buttonHeight + buttonGap) * 2 : buttonY,
      width: buttonWidth,
      height: buttonHeight
    },
    settingsButton: {
      x: compact ? cardX : desktopButtonStartX + (buttonWidth + DESKTOP_BUTTON_GAP) * 3,
      y: compact ? buttonY + (buttonHeight + buttonGap) * 3 : buttonY,
      width: settingsWidth,
      height: settingsHeight
    }
  };
}
