import { buttonVisual, uiPalette } from "../ui/VisualTheme";
import { safeAreaInsets, type SafeAreaInput, type SafeAreaInsets } from "./SafeAreaSystem";
import type { SurfaceProfile } from "./SurfaceProfileSystem";

export interface ViewportSize {
  width: number;
  height: number;
  safeArea?: SafeAreaInput;
  surfaceProfile?: SurfaceProfile;
}

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlayLayout {
  compact: boolean;
  topOffset: number;
  bottomOffset: number;
  contentPanel: LayoutRect;
  playfield: LayoutRect;
  chrome: LayoutRect;
  logoWiener: LayoutRect;
  chromeText: { x: number; y: number };
  timer: LayoutRect;
  textPanel: LayoutRect;
  resolveButton: LayoutRect;
  clearButton: LayoutRect;
  muteButton: LayoutRect;
  exitButton: LayoutRect;
  petWienerSlot: LayoutRect;
  sentenceStartY: number;
  sentenceActiveY: number;
  sentenceEndY: number;
  sentenceReviewY: number;
}

export interface ResolveButtonVisualState {
  label: string;
  alpha: number;
  fillColor: number;
  fillAlpha: number;
  strokeColor: number;
  strokeAlpha: number;
  strokeWidth: number;
  readyPulse: number;
  deadlinePressure: number;
}

export interface ControlButtonVisualState {
  alpha: number;
  fillColor: number;
  fillAlpha: number;
}

const TEXT_PANEL_HEIGHT = 96;
const DESKTOP_BOTTOM_OFFSET = 150;
const DESKTOP_REVIEW_SENTENCE_LIFT = 36;
const MOBILE_SURFACE_SHORT_REVIEW_SENTENCE_LIFT = 36;
export const MIN_TOUCH_TARGET_SIZE = 44;
export const PLAY_CONTROL_BUTTON_HEIGHT = MIN_TOUCH_TARGET_SIZE;
export const COMPACT_PLAY_CONTROL_TOP_ROW_Y = 166;
export const COMPACT_PLAY_CONTROL_ROW_Y = COMPACT_PLAY_CONTROL_TOP_ROW_Y;
export const COMPACT_PLAY_CONTROL_BOTTOM_DOCK_MIN_HEIGHT = 700;
export const COMPACT_PLAY_CONTROL_BOTTOM_MARGIN = 12;
export const REVIEW_TOKEN_EVIDENCE_OFFSET_Y = 86;
export const REVIEW_TOKEN_EVIDENCE_BOTTOM_OFFSET_Y = 118;
export const PLAY_HEADER_BRAND_MIN_WIDTH = 1080;
export const RESOLVE_READY_PULSE_MS = 340;
export const SHORT_LANDSCAPE_REVIEW_HEIGHT = 680;
export const SHORT_LANDSCAPE_REVIEW_COLUMN_GAP = 18;
export const SHORT_LANDSCAPE_REVIEW_MAX_COLUMN_WIDTH = 430;

export interface ShortLandscapeReviewColumns {
  evidence: LayoutRect;
  feedback: LayoutRect;
}

export function computePlayLayout({
  width,
  height,
  safeArea: safeAreaInput,
  surfaceProfile = "browser"
}: ViewportSize): PlayLayout {
  const safeArea = safeAreaInsets(safeAreaInput);
  const compact = width < 760;
  const mobileSurface = surfaceProfile === "mobile";
  const compactTopOffset = mobileSurface && height < 640 ? 186 : 190;
  const topOffset = (compact ? compactTopOffset : 118) + safeArea.top;
  const bottomOffset = (compact ? 136 : DESKTOP_BOTTOM_OFFSET) + safeArea.bottom;
  const playfieldHeight = Math.max(260, height - topOffset - bottomOffset);
  const playfieldY = topOffset + playfieldHeight / 2;
  const contentLeft = safeArea.left + (compact ? 12 : 20);
  const contentRight = width - safeArea.right - (compact ? 12 : 20);
  const contentWidth = Math.max(280, contentRight - contentLeft);
  const contentX = contentLeft + contentWidth / 2;
  const controls = computeControlButtons(width, height, compact, contentRight, safeArea, surfaceProfile);
  const maxPanelWidth = computeTextPanelWidth(width, compact, contentWidth);
  const sentenceActiveY = playfieldY;
  const playfieldTop = playfieldY - playfieldHeight / 2;
  const playfieldBottom = playfieldY + playfieldHeight / 2;
  const controlsTop = Math.min(
    controls.resolveButton.y - controls.resolveButton.height / 2,
    controls.clearButton.y - controls.clearButton.height / 2,
    controls.muteButton.y - controls.muteButton.height / 2
  );
  const sentenceStartY = sentenceActiveY;
  const sentenceEndY = sentenceActiveY;
  const sentenceReviewY = reviewSentenceY({
    width,
    height,
    compact,
    mobileSurface,
    sentenceActiveY: compact && mobileSurface ? sentenceActiveY - 12 : sentenceActiveY,
    playfieldTop
  });
  const petWienerSlot = computePetWienerSlot({
    width,
    height,
    compact,
    sentenceActiveY,
    textPanelHeight: TEXT_PANEL_HEIGHT,
    controlBottom: controls.resolveButton.y + controls.resolveButton.height / 2
  });
  const logoHeight = compact ? 30 : 38;
  const logoWidth = logoHeight * (69 / 89);
  const chrome = {
    x: contentLeft + (compact ? 72 : 94),
    y: compact ? 42 : 54,
    width: compact ? 140 : 188,
    height: 40
  };

  return {
    compact,
    topOffset,
    bottomOffset,
    contentPanel: {
      x: contentX,
      y: safeArea.top + Math.max(0, height - safeArea.top - safeArea.bottom) / 2,
      width: contentWidth,
      height: Math.max(0, height - safeArea.top - safeArea.bottom - 24)
    },
    playfield: {
      x: contentX,
      y: playfieldY,
      width: contentWidth,
      height: playfieldHeight
    },
    chrome,
    logoWiener: {
      x: chrome.x - chrome.width / 2 + 18,
      y: chrome.y,
      width: logoWidth,
      height: logoHeight
    },
    chromeText: {
      x: contentLeft + 16,
      y: compact ? 126 : 98
    },
    timer: {
      x: contentLeft + 16,
      y: compact && mobileSurface && height < 640 ? topOffset - 8 : topOffset - 14,
      width: Math.max(120, contentWidth - 32),
      height: 8
    },
    textPanel: {
      x: contentX,
      y: sentenceActiveY,
      width: maxPanelWidth,
      height: TEXT_PANEL_HEIGHT
    },
    ...controls,
    exitButton: controls.exitButton,
    petWienerSlot,
    sentenceStartY,
    sentenceActiveY,
    sentenceEndY,
    sentenceReviewY
  };
}

export function shouldShowPlayHeaderBrand(layout: Pick<PlayLayout, "compact" | "contentPanel">): boolean {
  return !layout.compact && layout.contentPanel.width >= PLAY_HEADER_BRAND_MIN_WIDTH;
}

export function usesShortLandscapeReviewLayout({ width, height }: ViewportSize): boolean {
  return width >= 760 && height < SHORT_LANDSCAPE_REVIEW_HEIGHT;
}

export function shortLandscapeReviewColumns({ width, height }: ViewportSize): ShortLandscapeReviewColumns {
  const availableWidth = Math.max(640, width - 40);
  const totalWidth = Math.min(
    availableWidth,
    SHORT_LANDSCAPE_REVIEW_MAX_COLUMN_WIDTH * 2 + SHORT_LANDSCAPE_REVIEW_COLUMN_GAP
  );
  const columnWidth = Math.max(300, (totalWidth - SHORT_LANDSCAPE_REVIEW_COLUMN_GAP) / 2);
  const centerX = width / 2;
  const evidenceX = centerX - columnWidth / 2 - SHORT_LANDSCAPE_REVIEW_COLUMN_GAP / 2;
  const feedbackX = centerX + columnWidth / 2 + SHORT_LANDSCAPE_REVIEW_COLUMN_GAP / 2;

  return {
    evidence: {
      x: evidenceX,
      y: height / 2,
      width: columnWidth,
      height: 0
    },
    feedback: {
      x: feedbackX,
      y: height / 2,
      width: columnWidth,
      height: 0
    }
  };
}

export function exitButtonLabel(compact: boolean, tutorialMode: boolean): string {
  if (compact) {
    return "Exit";
  }

  return tutorialMode ? "Exit Tutorial" : "Exit Training";
}

export function resolveButtonLabel(resolving: boolean, compact = false, stagedCutCount = 0): string {
  void stagedCutCount;
  if (resolving) {
    return compact ? "Review" : "Reviewing";
  }

  return "Resolve";
}

export function clearButtonLabel(compact: boolean, cutCount = 0, canClear = cutCount > 0): string {
  void cutCount;
  void canClear;
  return compact ? "Clear" : "Clear Cuts";
}

export function resolveButtonVisualState(
  resolving: boolean,
  hovered: boolean,
  compact = false,
  ready = false,
  pressed = false,
  stagedCutCount = 0,
  readyPulseAgeMs?: number,
  deadlinePressure = 0
): ResolveButtonVisualState {
  if (resolving) {
    return {
      label: resolveButtonLabel(true, compact),
      alpha: 0.72,
      fillColor: buttonVisual.disabledFill,
      fillAlpha: 0.56,
      strokeColor: buttonVisual.stroke,
      strokeAlpha: 0.62,
      strokeWidth: 1,
      readyPulse: 0,
      deadlinePressure: 0
    };
  }

  const readyPulse = ready ? resolveReadyPulseStrength(readyPulseAgeMs) : 0;
  const normalizedDeadlinePressure = normalizedPressure(deadlinePressure);
  const pressurePulse = Math.max(readyPulse, normalizedDeadlinePressure);
  const deadlineFillColor = pressed
    ? uiPalette.warning
    : hovered
      ? buttonVisual.readyHoverFill
      : buttonVisual.readyFill;
  const readyFillColor = normalizedDeadlinePressure > 0
    ? deadlineFillColor
    : pressed
      ? buttonVisual.readyPressFill
      : hovered
        ? buttonVisual.readyHoverFill
        : buttonVisual.readyFill;

  return {
    label: resolveButtonLabel(false, compact, ready ? stagedCutCount : 0),
    alpha: 1,
    fillColor: ready
      ? readyFillColor
      : normalizedDeadlinePressure > 0
        ? pressed ? uiPalette.warning : hovered ? buttonVisual.readyHoverFill : buttonVisual.readyFill
        : pressed ? buttonVisual.pressFill : hovered ? buttonVisual.hoverFill : buttonVisual.fill,
    fillAlpha: ready
      ? Math.min(1, (pressed ? buttonVisual.readyPressAlpha : hovered ? buttonVisual.readyHoverAlpha : buttonVisual.readyAlpha) + readyPulse * 0.02 + normalizedDeadlinePressure * 0.05)
      : normalizedDeadlinePressure > 0
        ? Math.min(1, (pressed ? buttonVisual.readyPressAlpha : hovered ? buttonVisual.readyHoverAlpha : buttonVisual.readyAlpha) - 0.12 + normalizedDeadlinePressure * 0.08)
        : pressed ? buttonVisual.pressAlpha : hovered ? buttonVisual.hoverAlpha : buttonVisual.fillAlpha,
    strokeColor: ready
      ? normalizedDeadlinePressure > 0 ? uiPalette.warning : buttonVisual.readyStroke
      : normalizedDeadlinePressure > 0 ? uiPalette.warning : buttonVisual.stroke,
    strokeAlpha: ready || normalizedDeadlinePressure > 0
      ? Math.min(1, 0.76 + readyPulse * 0.2 + normalizedDeadlinePressure * 0.18)
      : 0.72,
    strokeWidth: ready || normalizedDeadlinePressure > 0 ? 1 + pressurePulse * (compact ? 1.9 : 2.4) : 1,
    readyPulse,
    deadlinePressure: normalizedDeadlinePressure
  };
}

export function resolveReadyPulseStrength(ageMs?: number): number {
  if (ageMs === undefined || !Number.isFinite(ageMs)) {
    return 0;
  }

  const normalizedAge = Math.max(0, ageMs);
  if (normalizedAge >= RESOLVE_READY_PULSE_MS) {
    return 0;
  }

  return 1 - normalizedAge / RESOLVE_READY_PULSE_MS;
}

function normalizedPressure(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

export function clearButtonVisualState(canClear: boolean, hovered: boolean, pressed = false): ControlButtonVisualState {
  if (!canClear) {
    return {
      alpha: 0.56,
      fillColor: buttonVisual.disabledFill,
      fillAlpha: buttonVisual.disabledAlpha
    };
  }

  return {
    alpha: 1,
    fillColor: pressed ? buttonVisual.pressFill : hovered ? buttonVisual.hoverFill : buttonVisual.fill,
    fillAlpha: pressed ? buttonVisual.pressAlpha : hovered ? buttonVisual.hoverAlpha : buttonVisual.fillAlpha
  };
}

export function compactPlayControlsDockedAtBottom(
  height: number,
  surfaceProfile: SurfaceProfile = "browser"
): boolean {
  return surfaceProfile === "mobile" || height >= COMPACT_PLAY_CONTROL_BOTTOM_DOCK_MIN_HEIGHT;
}

export function compactPlayControlRowY(
  height: number,
  safeAreaInput?: SafeAreaInput,
  surfaceProfile: SurfaceProfile = "browser"
): number {
  const safeArea = safeAreaInsets(safeAreaInput);

  return compactPlayControlsDockedAtBottom(height, surfaceProfile)
    ? height - safeArea.bottom - COMPACT_PLAY_CONTROL_BOTTOM_MARGIN - PLAY_CONTROL_BUTTON_HEIGHT / 2
    : safeArea.top + COMPACT_PLAY_CONTROL_TOP_ROW_Y;
}

function computeControlButtons(
  width: number,
  height: number,
  compact: boolean,
  contentRight = width - 28,
  safeArea: SafeAreaInsets = safeAreaInsets(undefined),
  surfaceProfile: SurfaceProfile = "browser"
): Pick<PlayLayout, "resolveButton" | "clearButton" | "muteButton" | "exitButton"> {
  const buttonHeight = PLAY_CONTROL_BUTTON_HEIGHT;
  const y = compact ? compactPlayControlRowY(height, safeArea, surfaceProfile) : height - safeArea.bottom - 72;

  if (compact) {
    const margin = 16;
    const gap = 8;
    const safeWidth = Math.max(0, width - safeArea.left - safeArea.right);
    const buttonWidth = Math.max(
      MIN_TOUCH_TARGET_SIZE,
      (safeWidth - margin * 2 - gap * 3) / 4
    );
    const muteLeft = safeArea.left + margin;
    const clearLeft = muteLeft + buttonWidth + gap;
    const exitLeft = clearLeft + buttonWidth + gap;
    const resolveLeft = exitLeft + buttonWidth + gap;

    return {
      muteButton: {
        x: muteLeft + buttonWidth / 2,
        y,
        width: buttonWidth,
        height: buttonHeight
      },
      clearButton: {
        x: clearLeft + buttonWidth / 2,
        y,
        width: buttonWidth,
        height: buttonHeight
      },
      exitButton: {
        x: exitLeft + buttonWidth / 2,
        y,
        width: buttonWidth,
        height: buttonHeight
      },
      resolveButton: {
        x: resolveLeft + buttonWidth / 2,
        y,
        width: buttonWidth,
        height: buttonHeight
      }
    };
  }

  const right = contentRight - 14;
  const gap = 18;
  const resolveWidth = 180;
  const clearWidth = 112;
  const muteWidth = 112;
  const exitWidth = 132;
  const resolveLeft = right - resolveWidth;
  const clearLeft = resolveLeft - gap - clearWidth;
  const exitLeft = clearLeft - gap - exitWidth;
  const muteLeft = exitLeft - gap - muteWidth;

  return {
    muteButton: {
      x: muteLeft + muteWidth / 2,
      y,
      width: muteWidth,
      height: buttonHeight
    },
    clearButton: {
      x: clearLeft + clearWidth / 2,
      y,
      width: clearWidth,
      height: buttonHeight
    },
    exitButton: {
      x: exitLeft + exitWidth / 2,
      y,
      width: exitWidth,
      height: buttonHeight
    },
    resolveButton: {
      x: resolveLeft + resolveWidth / 2,
      y,
      width: resolveWidth,
      height: buttonHeight
    }
  };
}

function computePetWienerSlot(input: {
  width: number;
  height: number;
  compact: boolean;
  sentenceActiveY: number;
  textPanelHeight: number;
  controlBottom: number;
}): LayoutRect {
  if (input.compact) {
    const petHeight = 62;
    const promptTop = input.sentenceActiveY - input.textPanelHeight / 2;
    const controlsAbovePrompt = input.controlBottom <= promptTop;
    const minY = controlsAbovePrompt ? input.controlBottom + 8 + petHeight / 2 : 112 + petHeight / 2;
    const maxY = promptTop - 8 - petHeight / 2;
    const preferredY = controlsAbovePrompt ? (input.controlBottom + promptTop) / 2 : promptTop - 107;
    const y = maxY >= minY ? Math.max(minY, Math.min(maxY, preferredY)) : preferredY;

    return {
      x: input.width - 54,
      y,
      width: 56,
      height: petHeight
    };
  }

  return {
    x: input.width - 96,
    y: input.height - 214,
    width: 74,
    height: 82
  };
}

function computeTextPanelWidth(width: number, compact: boolean, contentWidth: number): number {
  if (compact) {
    return Math.min(980, width - 32);
  }

  return Math.min(980, Math.max(320, contentWidth - 42));
}

function reviewSentenceY(input: {
  width: number;
  height: number;
  compact: boolean;
  mobileSurface: boolean;
  sentenceActiveY: number;
  playfieldTop: number;
}): number {
  if (input.compact && input.mobileSurface && input.height < 640) {
    const liftedY = input.sentenceActiveY - MOBILE_SURFACE_SHORT_REVIEW_SENTENCE_LIFT;
    const minY = input.playfieldTop + TEXT_PANEL_HEIGHT / 2 + 16;

    return Math.max(minY, liftedY);
  }

  if (input.compact || usesShortLandscapeReviewLayout(input)) {
    return input.sentenceActiveY;
  }

  const liftedY = input.sentenceActiveY - DESKTOP_REVIEW_SENTENCE_LIFT;
  const minY = input.playfieldTop + TEXT_PANEL_HEIGHT / 2 + 88;

  return Math.max(minY, liftedY);
}
