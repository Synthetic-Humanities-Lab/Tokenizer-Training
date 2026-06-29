import {
  compactPlayControlRowY,
  PLAY_CONTROL_BUTTON_HEIGHT,
  type LayoutRect
} from "./PlayLayoutSystem";

export interface TutorialPopupLayout {
  panel: LayoutRect;
  header: LayoutRect;
  title: { x: number; y: number; fontSize: number; maxWidth: number };
  body: { x: number; y: number; wordWrapWidth: number; fontSize: number };
  stamp: { x: number; y: number; visible: boolean };
  constrained: boolean;
}

export interface TutorialPopupLayoutInput {
  width: number;
  height: number;
  resolving: boolean;
  referenceBottom?: number;
  referenceTop?: number;
}

export function computeTutorialPopupLayout(input: TutorialPopupLayoutInput): TutorialPopupLayout {
  const compact = input.width < 760;
  const constrained = compact && input.height < 640;
  const popupWidth = Math.min(compact ? input.width - 28 : 320, Math.max(300, input.width * 0.58));
  const popupHeight = constrained
    ? input.resolving ? 104 : 76
    : compact && !input.resolving ? 136
    : compact ? 156 : input.resolving ? 118 : 82;
  const desktopCalloutOffset = Math.min(170, input.width * 0.14);
  const x = compact ? input.width / 2 : input.width / 2 + desktopCalloutOffset;
  const defaultY = compact ? input.height < 640 ? 268 : input.resolving ? 248 : 262 : 210;
  const reviewY =
    input.referenceBottom === undefined ? defaultY : input.referenceBottom + 12 + popupHeight / 2;
  const desiredY = input.resolving ? reviewY : defaultY;
  const bottomReserve = compact ? 108 : 96;
  const minY = popupHeight / 2 + (constrained ? 186 : 18);
  const compactControlBottom = compactPlayControlRowY(input.height) + PLAY_CONTROL_BUTTON_HEIGHT / 2;
  const compactControlsAboveReference = input.referenceTop === undefined || compactControlBottom <= input.referenceTop;
  const activeCompactMinY = compactControlsAboveReference ? popupHeight / 2 + compactControlBottom + 8 : minY;
  const activeMinY = compact && !input.resolving ? Math.max(minY, activeCompactMinY) : minY;
  const viewportMaxY = input.height - popupHeight / 2 - bottomReserve;
  const safeY = !input.resolving && input.referenceTop !== undefined && input.referenceBottom !== undefined
    ? activeAvoidingReferenceY({
        defaultY,
        minY: activeMinY,
        maxY: viewportMaxY,
        popupHeight,
        referenceTop: input.referenceTop,
        referenceBottom: input.referenceBottom
      })
    : Math.min(
        viewportMaxY,
        Math.max(minY, desiredY)
      );

  return {
    constrained,
    panel: {
      x,
      y: safeY,
      width: popupWidth,
      height: popupHeight
    },
    header: {
      x,
      y: safeY - popupHeight / 2 + 12,
      width: popupWidth - 2,
      height: 24
    },
    title: {
      x: x - popupWidth / 2 + 14,
      y: safeY - popupHeight / 2 + 5,
      fontSize: compact ? 9 : 10,
      maxWidth: popupWidth - 28
    },
    body: {
      x: x - popupWidth / 2 + 16,
      y: safeY - popupHeight / 2 + (constrained ? 34 : 38),
      wordWrapWidth: popupWidth - 32,
      fontSize: constrained ? 12 : compact ? 13 : 12
    },
    stamp: {
      x: x - popupWidth / 2 + 16,
      y: safeY + popupHeight / 2 - 20,
      visible: compact && !constrained
    }
  };
}

function activeAvoidingReferenceY(input: {
  defaultY: number;
  minY: number;
  maxY: number;
  popupHeight: number;
  referenceTop: number;
  referenceBottom: number;
}): number {
  const aboveMaxY = input.referenceTop - 6 - input.popupHeight / 2;
  if (aboveMaxY >= input.minY) {
    return clamp(input.defaultY, input.minY, Math.min(input.maxY, aboveMaxY));
  }

  const belowMinY = input.referenceBottom + 8 + input.popupHeight / 2;
  if (belowMinY <= input.maxY) {
    return clamp(Math.max(input.defaultY, belowMinY), belowMinY, input.maxY);
  }

  return clamp(input.defaultY, input.minY, input.maxY);
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    return (min + max) / 2;
  }

  return Math.max(min, Math.min(max, value));
}
