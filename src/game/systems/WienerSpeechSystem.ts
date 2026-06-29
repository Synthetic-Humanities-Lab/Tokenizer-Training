import {
  computePlayLayout,
  usesShortLandscapeReviewLayout,
  type LayoutRect
} from "./PlayLayoutSystem";

export interface WienerSpeechLayout {
  panel: LayoutRect;
  label: { x: number; y: number; fontSize: number; visible: boolean };
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
const SHORT_PHONE_HEIGHT = 640;

export function wienerSpeechMaxLength(compact: boolean): number {
  return compact ? WIENER_SPEECH_COMPACT_MAX_LENGTH : WIENER_SPEECH_DEFAULT_MAX_LENGTH;
}

export function wienerSpeechSourceText(value: string, compact: boolean): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  const speakerSource = normalized
    .replace(/^ROBOT SUPERVISOR:\s*/i, "")
    .replace(/^WIENER:\s*/i, "");
  const tutorialSource = speakerSource
    .replace(/^TUTORIAL \d+\/\d+ - [^:]+:\s+/, "")
    .replace(/^TUTORIAL \d+\/\d+ - /, "");
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

export function computeWienerSpeechLayout(
  viewport: { width: number; height: number },
  textPanel: LayoutRect,
  compact: boolean
): WienerSpeechLayout {
  const width = Math.min(compact ? viewport.width - 32 : 520, Math.max(260, textPanel.width * 0.72));
  const defaultHeight = compact ? 62 : 58;
  const tightHeight = 38;
  const margin = 14;
  const playLayout = compact ? computePlayLayout(viewport) : undefined;
  const controlBottom = playLayout ? playLayout.resolveButton.y + playLayout.resolveButton.height / 2 : 0;
  const textTop = textPanel.y - textPanel.height / 2;
  const textBottom = textPanel.y + textPanel.height / 2;
  const controlsAboveText = controlBottom <= textTop;
  const minTop = compact && controlsAboveText ? controlBottom + 2 : margin;
  const fullTop = textTop - defaultHeight - 10;
  const tightTop = textTop - tightHeight - 2;
  const tight = compact && fullTop < minTop && tightTop >= minTop;
  const height = tight ? tightHeight : defaultHeight;
  const preferredY = textTop - height / 2 - (tight ? 2 : 10);
  const fallbackY = textBottom + height / 2 + 10;
  const y = preferredY - height / 2 >= minTop
    ? preferredY
    : Math.min(viewport.height - height / 2 - margin, fallbackY);
  const x = Math.max(width / 2 + margin, Math.min(viewport.width - width / 2 - margin, textPanel.x));
  const labelVisible = !tight;

  return {
    panel: {
      x,
      y,
      width,
      height
    },
    label: {
      x: x - width / 2 + 16,
      y: y - height / 2 + 8,
      fontSize: compact ? 8 : 9,
      visible: labelVisible
    },
    text: {
      x: x - width / 2 + 16,
      y: y - height / 2 + (tight ? 7 : compact ? 24 : 23),
      wordWrapWidth: tight ? width - 24 : width - 32,
      fontSize: tight ? 11 : compact ? 12 : 13
    }
  };
}

export function computePetSpeechLayout(input: PetSpeechLayoutInput): WienerSpeechLayout {
  const shortPhone = input.compact && input.viewport.height < SHORT_PHONE_HEIGHT;
  const shortLandscape = !input.compact && usesShortLandscapeReviewLayout(input.viewport);
  const reviewClearance = input.compact ? COMPACT_REVIEW_SPEECH_CLEARANCE_PX : REVIEW_SPEECH_CLEARANCE_PX;
  const reviewHeight = input.reviewSpeech
    ? input.compact
      ? shortPhone ? 64 : 76
      : shortLandscape ? 64 : 86
    : input.compact ? 58 : 64;
  const baseWidth = input.reviewSpeech && input.compact
    ? Math.min(input.viewport.width - 36, Math.max(240, input.viewport.width - 68))
    : Math.min(input.compact ? input.viewport.width - 128 : 390, Math.max(260, input.textPanel.width * 0.5));
  const pet = rectEdges(input.petBounds);
  const preferredX = clamp(
    pet.left - baseWidth / 2 - (input.compact ? 10 : 18),
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
      const aboveTop = controlsAboveText ? controlBottom + reviewClearance : 112;
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

    const topSafe = 112;
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
    const topSafe = input.compact ? 112 : 112;
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
    const aboveTop = 112;
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
  const preferredY = Math.max(112, input.petBounds.y - 20);
  const controlsAboveText = controlBottom <= textTop;
  const minY = input.compact && controlsAboveText ? controlBottom + 8 + reviewHeight / 2 : 112 + reviewHeight / 2;
  const feedbackTop = input.feedback.y - input.feedback.height / 2;
  const maxY = input.compact
    ? textTop - 8 - reviewHeight / 2
    : Math.min(input.viewport.height - reviewHeight / 2 - 16, feedbackTop - 14 - reviewHeight / 2);
  const y = maxY >= minY
    ? clamp(preferredY, minY, maxY)
    : input.compact ? minY : preferredY;

  return petSpeechLayout({
    x: preferredX,
    y,
    width: baseWidth,
    height: reviewHeight,
    compact: input.compact
  });
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
    label: {
      x: input.x - input.width / 2 + 18,
      y: input.y - input.height / 2 + 10,
      fontSize: input.compact ? 8 : 9,
      visible: false
    },
    text: {
      x: input.x - input.width / 2 + 18,
      y: input.y - input.height / 2 + 14,
      wordWrapWidth: input.width - 36,
      fontSize: input.compact ? 12 : 13
    }
  };
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
