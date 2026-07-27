import {
  usesShortLandscapeReviewLayout,
  type LayoutRect
} from "./PlayLayoutSystem";

export interface WienerSpeechLayout {
  panel: LayoutRect;
  text: { x: number; y: number; wordWrapWidth: number; fontSize: number };
}

export interface PetSpeechLayoutInput {
  viewport: { width: number; height: number };
  textPanel: LayoutRect;
  petBounds: LayoutRect;
  feedback: LayoutRect;
  resolveButton: LayoutRect;
  compact: boolean;
  reviewSpeech: boolean;
  activeTimerRect?: LayoutRect;
  evidenceRect?: LayoutRect;
}

export interface WienerSpeechDurationOptions {
  tutorialMode?: boolean;
  maxLength?: number;
}

export const WIENER_SPEECH_DEFAULT_MAX_LENGTH = 76;
export const WIENER_SPEECH_COMPACT_MAX_LENGTH = 58;
export const REVIEW_SPEECH_CLEARANCE_PX = 14;
export const COMPACT_REVIEW_SPEECH_CLEARANCE_PX = 8;
export const COMPACT_REVIEW_SPEECH_PET_CLEARANCE_PX = 10;
export const COMPACT_PET_SPEECH_TOP_SAFE_Y = 128;
export const ACTIVE_PET_SPEECH_TIMER_CLEARANCE_PX = 8;
const PET_SPEECH_TOP_SAFE_Y = 112;
const SHORT_PHONE_HEIGHT = 640;

export function wienerSpeechMaxLength(compact: boolean, sticky = false): number {
  return compact && !sticky ? WIENER_SPEECH_COMPACT_MAX_LENGTH : WIENER_SPEECH_DEFAULT_MAX_LENGTH;
}

export function wienerSpeechSourceText(value: string, compact: boolean): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  const speakerSource = normalized
    .replace(/^ROBOT SUPERVISOR:\s*/i, "")
    .replace(/^WIENER:\s*/i, "");
  const tutorialSource = speakerSource
    .replace(/^TUTORIAL \d+\/\d+\s*[-:]\s*/, "");
  if (!compact) {
    return tutorialSource;
  }

  return tutorialSource.match(/^.+?[.!?](?:\s|$)/)?.[0]?.trim() ?? tutorialSource;
}

export function wienerBriefLine(value: string, maxLength = WIENER_SPEECH_DEFAULT_MAX_LENGTH): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const firstSentence = normalized.match(/^.+?[.!?](?:\s|$)/)?.[0]?.trim();
  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence;
  }

  const limit = Math.max(0, maxLength - 3);
  let clipped = normalized.slice(0, limit).trimEnd();
  const lastSpace = clipped.lastIndexOf(" ");
  if (lastSpace >= Math.floor(limit * 0.72)) {
    clipped = clipped.slice(0, lastSpace).trimEnd();
  }

  return `${clipped}...`;
}

export function wienerSpeechDurationMs(value: string, options: WienerSpeechDurationOptions = {}): number {
  const briefLength = wienerBriefLine(value, options.maxLength).length;
  const readingMs = 900 + briefLength * (options.tutorialMode ? 58 : 42);
  const minMs = options.tutorialMode ? 4800 : 3400;
  const maxMs = options.tutorialMode ? 6200 : 4800;

  return Math.round(Math.max(minMs, Math.min(maxMs, readingMs)));
}

export function computePetSpeechLayout(input: PetSpeechLayoutInput): WienerSpeechLayout {
  const shortPhone = input.compact && input.viewport.height < SHORT_PHONE_HEIGHT;
  const shortLandscape = !input.compact && usesShortLandscapeReviewLayout(input.viewport);
  const reviewClearance = input.compact ? COMPACT_REVIEW_SPEECH_CLEARANCE_PX : REVIEW_SPEECH_CLEARANCE_PX;
  const pet = rectEdges(input.petBounds);
  const reviewHeight = input.reviewSpeech
    ? input.compact
      ? shortPhone ? 64 : 76
      : shortLandscape ? 64 : 86
    : input.compact ? 58 : 64;
  const compactReviewWidth = Math.max(
    196,
    Math.min(
      input.viewport.width - 104,
      pet.left - COMPACT_REVIEW_SPEECH_PET_CLEARANCE_PX - 14
    )
  );
  const baseWidth = input.reviewSpeech && input.compact
    ? Math.min(input.viewport.width - 36, compactReviewWidth)
    : Math.min(input.compact ? input.viewport.width - 128 : 390, Math.max(260, input.textPanel.width * 0.5));
  const preferredX = clamp(
    pet.left - baseWidth / 2 - (input.compact ? COMPACT_REVIEW_SPEECH_PET_CLEARANCE_PX : 18),
    (input.compact ? 14 : 20) + baseWidth / 2,
    input.viewport.width - (input.compact ? 14 : 20) - baseWidth / 2
  );

  if (input.reviewSpeech && input.evidenceRect) {
    const evidence = rectEdges(input.evidenceRect);
    const feedback = rectEdges(input.feedback);
    const text = rectEdges(input.textPanel);

    if (input.compact) {
      const controlBottom = input.resolveButton.y + input.resolveButton.height / 2;
      const controlsAboveText = controlBottom <= text.top;
      const aboveTop = controlsAboveText ? controlBottom + reviewClearance : petSpeechTopSafeY(input.compact);
      const aboveBottom = Math.min(text.top - reviewClearance, evidence.top - reviewClearance);
      if (aboveBottom - aboveTop >= reviewHeight) {
        return petSpeechLayout({
          x: preferredX,
          y: clamp(input.petBounds.y - 20, aboveTop + reviewHeight / 2, aboveBottom - reviewHeight / 2),
          width: baseWidth,
          height: reviewHeight,
          compact: input.compact
        });
      }

      const belowTop = evidence.bottom + reviewClearance;
      const belowBottom = feedback.top - reviewClearance;
      if (belowBottom - belowTop >= reviewHeight) {
        return petSpeechLayout({
          x: preferredX,
          y: clamp(input.petBounds.y - 20, belowTop + reviewHeight / 2, belowBottom - reviewHeight / 2),
          width: baseWidth,
          height: reviewHeight,
          compact: input.compact
        });
      }
    }

    const topSafe = petSpeechTopSafeY(input.compact);
    if (shortLandscape) {
      const aboveTop = topSafe;
      const aboveBottom = text.top - reviewClearance;
      if (aboveBottom - aboveTop >= reviewHeight) {
        return petSpeechLayout({
          x: preferredX,
          y: aboveBottom - reviewHeight / 2,
          width: baseWidth,
          height: reviewHeight,
          compact: input.compact
        });
      }
    }

    const topBandMinY = topSafe + reviewHeight / 2;
    const feedbackMaxY = feedback.top - reviewClearance - reviewHeight / 2;
    const sideLeft = evidence.right + reviewClearance;
    const sideRight = Math.min(input.viewport.width - 18, pet.left - reviewClearance);
    const sideWidth = Math.min(260, Math.max(0, sideRight - sideLeft));

    if (sideWidth >= 208 && feedbackMaxY >= topBandMinY) {
      return petSpeechLayout({
        x: sideLeft + sideWidth / 2,
        y: clamp(input.evidenceRect.y, topBandMinY, feedbackMaxY),
        width: sideWidth,
        height: reviewHeight,
        compact: input.compact
      });
    }

    const belowTop = evidence.bottom + reviewClearance;
    const belowBottom = feedback.top - reviewClearance;
    if (belowBottom - belowTop >= reviewHeight) {
      return petSpeechLayout({
        x: preferredX,
        y: clamp(input.petBounds.y - 20, belowTop + reviewHeight / 2, belowBottom - reviewHeight / 2),
        width: baseWidth,
        height: reviewHeight,
        compact: input.compact
      });
    }

    const aboveTop = topSafe;
    const aboveBottom = Math.min(text.top - reviewClearance, evidence.top - reviewClearance);
    if (aboveBottom - aboveTop >= reviewHeight) {
      return petSpeechLayout({
        x: preferredX,
        y: aboveBottom - reviewHeight / 2,
        width: baseWidth,
        height: reviewHeight,
        compact: input.compact
      });
    }
  }

  if (input.reviewSpeech) {
    const text = rectEdges(input.textPanel);
    const feedback = rectEdges(input.feedback);
    const topSafe = petSpeechTopSafeY(input.compact);
    const controlBottom = input.resolveButton.y + input.resolveButton.height / 2;
    const controlsAboveText = controlBottom <= text.top;
    const aboveTop = input.compact && controlsAboveText ? controlBottom + reviewClearance : topSafe;
    const aboveBottom = text.top - reviewClearance;

    if (aboveBottom - aboveTop >= reviewHeight) {
      return petSpeechLayout({
        x: preferredX,
        y: clamp(input.petBounds.y - 20, aboveTop + reviewHeight / 2, aboveBottom - reviewHeight / 2),
        width: baseWidth,
        height: reviewHeight,
        compact: input.compact
      });
    }

    const belowTop = text.bottom + reviewClearance;
    const belowBottom = feedback.top - reviewClearance;
    if (belowBottom - belowTop >= reviewHeight) {
      return petSpeechLayout({
        x: preferredX,
        y: clamp(input.petBounds.y - 20, belowTop + reviewHeight / 2, belowBottom - reviewHeight / 2),
        width: baseWidth,
        height: reviewHeight,
        compact: input.compact
      });
    }
  }

  if (!input.reviewSpeech && shortLandscape) {
    const text = rectEdges(input.textPanel);
    const activeClearance = 12;
    const aboveTop = petSpeechTopSafeY(input.compact);
    const aboveBottom = text.top - activeClearance;
    if (aboveBottom - aboveTop >= reviewHeight) {
      return petSpeechLayout({
        x: preferredX,
        y: aboveBottom - reviewHeight / 2,
        width: baseWidth,
        height: reviewHeight,
        compact: input.compact
      });
    }

    const controlsTop = input.resolveButton.y - input.resolveButton.height / 2;
    const belowTop = text.bottom + activeClearance;
    const belowBottom = Math.min(controlsTop - activeClearance, input.viewport.height - reviewHeight / 2 - 16);
    if (belowBottom - belowTop >= reviewHeight) {
      return petSpeechLayout({
        x: preferredX,
        y: clamp(input.petBounds.y - 20, belowTop + reviewHeight / 2, belowBottom - reviewHeight / 2),
        width: baseWidth,
        height: reviewHeight,
        compact: input.compact
      });
    }
  }

  const controlBottom = input.resolveButton.y + input.resolveButton.height / 2;
  const textTop = input.textPanel.y - input.textPanel.height / 2;
  const topSafe = petSpeechTopSafeY(input.compact);
  const preferredY = Math.max(topSafe, input.petBounds.y - 20);
  const controlsAboveText = controlBottom <= textTop;
  const minY = input.compact && controlsAboveText ? controlBottom + 8 + reviewHeight / 2 : topSafe + reviewHeight / 2;
  const feedbackTop = input.feedback.y - input.feedback.height / 2;
  const maxY = input.compact
    ? textTop - 8 - reviewHeight / 2
    : Math.min(input.viewport.height - reviewHeight / 2 - 16, feedbackTop - 14 - reviewHeight / 2);
  const initialY = maxY >= minY
    ? clamp(preferredY, minY, maxY)
    : input.compact ? minY : preferredY;
  const y = input.activeTimerRect && maxY >= minY
    ? speechYClearOfActiveTimer({
        x: preferredX,
        y: initialY,
        width: baseWidth,
        height: reviewHeight,
        minY,
        maxY,
        timer: input.activeTimerRect
      })
    : initialY;

  return petSpeechLayout({
    x: preferredX,
    y,
    width: baseWidth,
    height: reviewHeight,
    compact: input.compact
  });
}

function speechYClearOfActiveTimer(input: {
  x: number;
  y: number;
  width: number;
  height: number;
  minY: number;
  maxY: number;
  timer: LayoutRect;
}): number {
  const speech = rectEdges({ x: input.x, y: input.y, width: input.width, height: input.height });
  const timer = rectEdges(input.timer);
  const horizontalOverlap = speech.left < timer.right && speech.right > timer.left;
  const verticalOverlap = speech.top < timer.bottom && speech.bottom > timer.top;
  if (!horizontalOverlap || !verticalOverlap) {
    return input.y;
  }

  const halfHeight = input.height / 2;
  const aboveMaxY = Math.min(
    input.maxY,
    timer.top - ACTIVE_PET_SPEECH_TIMER_CLEARANCE_PX - halfHeight
  );
  const belowMinY = Math.max(
    input.minY,
    timer.bottom + ACTIVE_PET_SPEECH_TIMER_CLEARANCE_PX + halfHeight
  );
  const candidates: number[] = [];
  if (aboveMaxY >= input.minY) {
    candidates.push(clamp(input.y, input.minY, aboveMaxY));
  }
  if (belowMinY <= input.maxY) {
    candidates.push(clamp(input.y, belowMinY, input.maxY));
  }

  if (candidates.length === 0) {
    return input.y;
  }

  return candidates.slice(1).reduce(
    (nearest, candidate) => Math.abs(candidate - input.y) < Math.abs(nearest - input.y) ? candidate : nearest,
    candidates[0]
  );
}

function petSpeechLayout(input: {
  x: number;
  y: number;
  width: number;
  height: number;
  compact: boolean;
}): WienerSpeechLayout {
  return {
    panel: {
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height
    },
    text: {
      x: input.x - input.width / 2 + 18,
      y: input.y - input.height / 2 + 14,
      wordWrapWidth: input.width - 36,
      fontSize: input.compact ? 12 : 13
    }
  };
}

function petSpeechTopSafeY(compact: boolean): number {
  return compact ? COMPACT_PET_SPEECH_TOP_SAFE_Y : PET_SPEECH_TOP_SAFE_Y;
}

function rectEdges(rect: LayoutRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
