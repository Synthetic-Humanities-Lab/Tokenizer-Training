import { describe, expect, it } from "vitest";
import {
  ACTIVE_PET_SPEECH_TIMER_CLEARANCE_PX,
  COMPACT_PET_SPEECH_TOP_SAFE_Y,
  COMPACT_REVIEW_SPEECH_CLEARANCE_PX,
  COMPACT_REVIEW_SPEECH_PET_CLEARANCE_PX,
  computePetSpeechLayout,
  REVIEW_SPEECH_CLEARANCE_PX,
  WIENER_SPEECH_DEFAULT_MAX_LENGTH,
  wienerBriefLine,
  wienerSpeechDurationMs,
  wienerSpeechMaxLength,
  wienerSpeechSourceText
} from "../src/game/systems/WienerSpeechSystem";
import { computePlayLayout, type LayoutRect } from "../src/game/systems/PlayLayoutSystem";
import { resolutionAuditLegendPromptOffsetY } from "../src/game/systems/ResolutionFeedbackSystem";
import { TutorialSystem } from "../src/game/systems/TutorialSystem";
import { computeFeedbackCardLayout } from "../src/game/ui/FeedbackCard";
import { computeHudLayout } from "../src/game/ui/Hud";

function edges(rect: LayoutRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function overlaps(a: LayoutRect, b: LayoutRect): boolean {
  const ae = edges(a);
  const be = edges(b);
  return ae.left < be.right && ae.right > be.left && ae.top < be.bottom && ae.bottom > be.top;
}

function clearanceBetween(a: LayoutRect, b: LayoutRect): number {
  const ae = edges(a);
  const be = edges(b);
  const horizontal = Math.max(be.left - ae.right, ae.left - be.right, 0);
  const vertical = Math.max(be.top - ae.bottom, ae.top - be.bottom, 0);

  return Math.max(horizontal, vertical);
}

function withinViewport(rect: LayoutRect, width: number, height: number): boolean {
  const re = edges(rect);
  return re.left >= 0 && re.right <= width && re.top >= 0 && re.bottom <= height;
}

function estimatedWrappedLineCount(text: string, maxCharsPerLine: number): number {
  const words = text.split(/\s+/).filter(Boolean);
  let lineCount = 1;
  let currentLineLength = 0;

  for (const word of words) {
    if (word.length > maxCharsPerLine) {
      lineCount += Math.max(0, Math.ceil(word.length / maxCharsPerLine) - 1);
      currentLineLength = word.length % maxCharsPerLine;
      continue;
    }

    const nextLength = currentLineLength === 0 ? word.length : currentLineLength + 1 + word.length;
    if (nextLength <= maxCharsPerLine) {
      currentLineLength = nextLength;
      continue;
    }

    lineCount += 1;
    currentLineLength = word.length;
  }

  return lineCount;
}

describe("WienerSpeechSystem", () => {
  it("keeps near-action Wiener speechs brief", () => {
    const line = wienerBriefLine(
      "TUTORIAL 6/10 - Contractions: Tokens are learned byte-pattern chunks and do not respect ordinary classroom word boundaries.",
      76
    );

    expect(line.length).toBeLessThanOrEqual(76);
    expect(line).toContain("TUTORIAL 6/10");
    expect(line.endsWith("...")).toBe(true);
  });

  it("clips near-action comments on readable word boundaries when possible", () => {
    const line = wienerBriefLine(
      "TUTORIAL 1/10 - Swipe orange targets; pale guides show legal slots; payroll wants tokenizer boundaries.",
      76
    );

    expect(line).toBe("TUTORIAL 1/10 - Swipe orange targets; pale guides show legal slots;...");
  });

  it("strips only the tutorial counter without discarding instructional text before a colon", () => {
    const source = wienerSpeechSourceText(
      "TUTORIAL 1/10 - Slot guides: Learn legal cut positions before guessing token boundaries. Pale guides are legal slots.",
      true
    );
    const line = wienerBriefLine(
      source,
      78
    );

    expect(source).not.toContain("TUTORIAL 1/10");
    expect(source).toBe("Slot guides: Learn legal cut positions before guessing token boundaries.");
    expect(line).toBe("Slot guides: Learn legal cut positions before guessing token boundaries.");
  });

  it("gives sticky compact tutorial speech the full bubble copy budget", () => {
    expect(wienerSpeechMaxLength(true, true)).toBe(WIENER_SPEECH_DEFAULT_MAX_LENGTH);
    expect(
      wienerSpeechSourceText(
        "TUTORIAL 1/10 - Before models read, text becomes tokens: reusable chunks, not always words.",
        false
      )
    ).toBe("Before models read, text becomes tokens: reusable chunks, not always words.");
  });

  it("strips Wiener speaker prefixes before shortening near-action toasts", () => {
    expect(wienerSpeechSourceText("WIENER: Help disabled to preserve margin.", true)).toBe(
      "Help disabled to preserve margin."
    );
  });

  it("keeps every tutorial near-action toast within compact wrap capacity", () => {
    const tutorial = new TutorialSystem();
    const maxLength = wienerSpeechMaxLength(true);
    const viewport = { width: 390, height: 844 };
    const playLayout = computePlayLayout(viewport);
    const speechLayout = computePetSpeechLayout({
      viewport,
      textPanel: { ...playLayout.textPanel, y: playLayout.sentenceStartY },
      petBounds: playLayout.petWienerSlot,
      feedback: computeFeedbackCardLayout(viewport.width, viewport.height, playLayout.contentPanel),
      resolveButton: playLayout.resolveButton,
      compact: playLayout.compact,
      reviewSpeech: false
    });
    const maxCharsPerLine = Math.floor(
      speechLayout.text.wordWrapWidth / (speechLayout.text.fontSize * 0.62)
    );

    Array.from({ length: tutorial.count() }, (_, index) => index).forEach((index) => {
      const prompt = tutorial.activePromptFor(index);
      const line = wienerBriefLine(wienerSpeechSourceText(prompt, true), maxLength);

      expect(line.length, line).toBeLessThanOrEqual(maxLength);
      expect(estimatedWrappedLineCount(line, maxCharsPerLine), line).toBeLessThanOrEqual(2);
    });
  });

  it("keeps near-action comments visible long enough to read", () => {
    const short = wienerSpeechDurationMs("Leading-space boundary missed.");
    const long = wienerSpeechDurationMs(
      "TUTORIAL 4/10 - One orange target: cut before the visible gap. Do not add a cut after it.",
      { tutorialMode: true }
    );
    const capped = wienerSpeechDurationMs(
      "TUTORIAL 8/10 - URLs fragment quickly because dots, slashes, short names, and suffixes often become separate tokenizer chunks.",
      { tutorialMode: true }
    );
    const compact = wienerSpeechDurationMs(
      "TUTORIAL 1/10 - Slot guides: Learn legal cut positions before guessing token boundaries.",
      { tutorialMode: true, maxLength: 78 }
    );

    expect(short).toBeGreaterThanOrEqual(3400);
    expect(short).toBeLessThanOrEqual(4800);
    expect(long).toBeGreaterThan(short);
    expect(compact).toBeGreaterThanOrEqual(4800);
    expect(capped).toBeLessThanOrEqual(6200);
  });

  it("keeps active pet speech out of the prompt band on short landscape desktop", () => {
    const width = 960;
    const height = 520;
    const playLayout = computePlayLayout({ width, height });
    const activeTextPanel = {
      ...playLayout.textPanel,
      y: playLayout.sentenceReviewY
    };
    const speech = computePetSpeechLayout({
      viewport: { width, height },
      textPanel: activeTextPanel,
      petBounds: playLayout.petWienerSlot,
      feedback: computeFeedbackCardLayout(width, height, playLayout.contentPanel),
      resolveButton: playLayout.resolveButton,
      compact: playLayout.compact,
      reviewSpeech: false
    });

    expect(withinViewport(speech.panel, width, height)).toBe(true);
    expect(overlaps(speech.panel, activeTextPanel)).toBe(false);
    expect(edges(speech.panel).bottom).toBeLessThanOrEqual(edges(activeTextPanel).top - 12);
  });

  it.each([
    { label: "small mobile phone", width: 320, height: 568, surfaceProfile: "mobile" as const, expectedY: 219 },
    { label: "compact mobile phone", width: 368, height: 552, surfaceProfile: "mobile" as const, expectedY: 219 },
    { label: "standard mobile phone", width: 390, height: 844, surfaceProfile: "mobile" as const },
    { label: "short landscape", width: 960, height: 520, surfaceProfile: "browser" as const },
    { label: "desktop harness", width: 960, height: 720, surfaceProfile: "browser" as const },
    { label: "tablet portrait", width: 768, height: 1024, surfaceProfile: "browser" as const },
    { label: "wide desktop", width: 1280, height: 720, surfaceProfile: "browser" as const }
  ])("keeps active pet speech clear of the timer on $label", ({ width, height, surfaceProfile, expectedY }) => {
    const viewport = { width, height };
    const playLayout = computePlayLayout({ ...viewport, surfaceProfile });
    const textPanel = { ...playLayout.textPanel, y: playLayout.sentenceStartY };
    const timer = {
      ...playLayout.timer,
      x: playLayout.timer.x + playLayout.timer.width / 2
    };
    const speech = computePetSpeechLayout({
      viewport,
      textPanel,
      petBounds: playLayout.petWienerSlot,
      feedback: computeFeedbackCardLayout(width, height, playLayout.contentPanel, undefined, undefined, surfaceProfile),
      resolveButton: playLayout.resolveButton,
      compact: playLayout.compact,
      reviewSpeech: false,
      activeTimerRect: timer
    });

    expect(clearanceBetween(speech.panel, timer)).toBeGreaterThanOrEqual(
      ACTIVE_PET_SPEECH_TIMER_CLEARANCE_PX
    );
    expect(overlaps(speech.panel, playLayout.petWienerSlot)).toBe(false);
    if (expectedY !== undefined) {
      expect(speech.panel.y).toBe(expectedY);
      expect(overlaps(speech.panel, textPanel)).toBe(false);
      expect(edges(speech.panel).bottom).toBeLessThanOrEqual(edges(textPanel).top - 20);
    }
  });

  it("does not move standard-phone active speech when the timer is already clear", () => {
    const viewport = { width: 390, height: 844 };
    const playLayout = computePlayLayout({ ...viewport, surfaceProfile: "mobile" });
    const input = {
      viewport,
      textPanel: { ...playLayout.textPanel, y: playLayout.sentenceStartY },
      petBounds: playLayout.petWienerSlot,
      feedback: computeFeedbackCardLayout(
        viewport.width,
        viewport.height,
        playLayout.contentPanel,
        undefined,
        undefined,
        "mobile" as const
      ),
      resolveButton: playLayout.resolveButton,
      compact: playLayout.compact,
      reviewSpeech: false
    };
    const timer = { ...playLayout.timer, x: playLayout.timer.x + playLayout.timer.width / 2 };

    expect(computePetSpeechLayout({ ...input, activeTimerRect: timer })).toEqual(
      computePetSpeechLayout(input)
    );
  });

  it.each([
    { label: "small phone", width: 320, height: 568 },
    { label: "portrait phone", width: 390, height: 844 },
    { label: "short landscape desktop", width: 960, height: 520 },
    { label: "reported desktop harness", width: 960, height: 720 },
    { label: "tablet portrait", width: 768, height: 1024 },
    { label: "wide desktop", width: 1280, height: 720 }
  ])("keeps tutorial review speech clear of the combined feedback card on $label", ({ width, height }) => {
    const playLayout = computePlayLayout({ width, height });
    const reviewTextPanel = {
      ...playLayout.textPanel,
      y: playLayout.sentenceReviewY
    };
    const feedback = computeFeedbackCardLayout(width, height, playLayout.contentPanel);
    const speech = computePetSpeechLayout({
      viewport: { width, height },
      textPanel: reviewTextPanel,
      petBounds: playLayout.petWienerSlot,
      feedback,
      resolveButton: playLayout.resolveButton,
      compact: playLayout.compact,
      reviewSpeech: true
    });

    expect(withinViewport(speech.panel, width, height)).toBe(true);
    expect(overlaps(speech.panel, reviewTextPanel)).toBe(false);
    expect(overlaps(speech.panel, feedback)).toBe(false);

    const expectedClearance = playLayout.compact
      ? COMPACT_REVIEW_SPEECH_CLEARANCE_PX
      : REVIEW_SPEECH_CLEARANCE_PX;
    expect(clearanceBetween(speech.panel, feedback)).toBeGreaterThanOrEqual(expectedClearance);
  });

  it("uses a shorter compact review bubble when only the short-phone gap above the prompt is available", () => {
    const width = 320;
    const height = 568;
    const playLayout = computePlayLayout({ width, height });
    const reviewTextPanel = {
      ...playLayout.textPanel,
      y: playLayout.sentenceReviewY
    };
    const feedback = computeFeedbackCardLayout(width, height, playLayout.contentPanel);
    const speech = computePetSpeechLayout({
      viewport: { width, height },
      textPanel: reviewTextPanel,
      petBounds: playLayout.petWienerSlot,
      feedback,
      resolveButton: playLayout.resolveButton,
      compact: playLayout.compact,
      reviewSpeech: true
    });

    expect(speech.panel.height).toBe(64);
    expect(edges(speech.panel).bottom).toBeLessThanOrEqual(
      edges(reviewTextPanel).top - COMPACT_REVIEW_SPEECH_CLEARANCE_PX
    );
    expect(edges(speech.panel).top).toBeGreaterThanOrEqual(
      edges(playLayout.resolveButton).bottom + COMPACT_REVIEW_SPEECH_CLEARANCE_PX
    );
  });

  it.each([
    { label: "small mobile surface", width: 320, height: 568 },
    { label: "reported mobile surface", width: 368, height: 552 },
    { label: "standard mobile surface", width: 390, height: 844 }
  ])("keeps compact tutorial review speech clear of Wiener on $label", ({ width, height }) => {
    const playLayout = computePlayLayout({ width, height, surfaceProfile: "mobile" });
    const reviewTextPanel = {
      ...playLayout.textPanel,
      y: playLayout.sentenceReviewY
    };
    const feedback = computeFeedbackCardLayout(
      width,
      height,
      playLayout.contentPanel,
      undefined,
      undefined,
      "mobile"
    );
    const speech = computePetSpeechLayout({
      viewport: { width, height },
      textPanel: reviewTextPanel,
      petBounds: playLayout.petWienerSlot,
      feedback,
      resolveButton: playLayout.resolveButton,
      compact: playLayout.compact,
      reviewSpeech: true
    });

    expect(withinViewport(speech.panel, width, height)).toBe(true);
    expect(overlaps(speech.panel, playLayout.petWienerSlot)).toBe(false);
    expect(clearanceBetween(speech.panel, playLayout.petWienerSlot)).toBeGreaterThanOrEqual(
      COMPACT_REVIEW_SPEECH_PET_CLEARANCE_PX
    );
    expect(speech.text.wordWrapWidth).toBeGreaterThanOrEqual(160);
  });

  it("keeps compact mobile review speech below the HUD band", () => {
    const width = 368;
    const height = 552;
    const playLayout = computePlayLayout({ width, height, surfaceProfile: "mobile" });
    const reviewTextPanel = {
      ...playLayout.textPanel,
      y: playLayout.sentenceReviewY
    };
    const feedback = computeFeedbackCardLayout(
      width,
      height,
      playLayout.contentPanel,
      undefined,
      undefined,
      "mobile"
    );
    const speech = computePetSpeechLayout({
      viewport: { width, height },
      textPanel: reviewTextPanel,
      petBounds: playLayout.petWienerSlot,
      feedback,
      resolveButton: playLayout.resolveButton,
      compact: playLayout.compact,
      reviewSpeech: true,
      evidenceRect: {
        x: reviewTextPanel.x,
        y: reviewTextPanel.y,
        width: 297,
        height: 24
      }
    });
    const hud = computeHudLayout(width, playLayout.contentPanel).background;
    const hudPanel = {
      x: hud.x,
      y: hud.y + hud.height / 2,
      width: hud.width,
      height: hud.height
    };

    expect(edges(speech.panel).top).toBeGreaterThanOrEqual(COMPACT_PET_SPEECH_TOP_SAFE_Y);
    expect(overlaps(speech.panel, hudPanel)).toBe(false);
  });

  it.each([
    { label: "small phone", width: 320, height: 568, renderedWidth: 238, renderedHeight: 18 },
    { label: "portrait phone", width: 390, height: 844, renderedWidth: 238, renderedHeight: 18 },
    { label: "tablet portrait", width: 768, height: 1024, renderedWidth: 360, renderedHeight: 24 },
    { label: "reported desktop harness", width: 960, height: 720, renderedWidth: 360, renderedHeight: 24 },
    { label: "wide desktop", width: 1280, height: 720, renderedWidth: 360, renderedHeight: 24 }
  ])("keeps review speech clear of the audit legend on $label", ({ width, height, renderedWidth, renderedHeight }) => {
    const playLayout = computePlayLayout({ width, height });
    const reviewTextPanel = {
      ...playLayout.textPanel,
      y: playLayout.sentenceReviewY
    };
    const feedback = computeFeedbackCardLayout(width, height, playLayout.contentPanel);
    const speech = computePetSpeechLayout({
      viewport: { width, height },
      textPanel: reviewTextPanel,
      petBounds: playLayout.petWienerSlot,
      feedback,
      resolveButton: playLayout.resolveButton,
      compact: playLayout.compact,
      reviewSpeech: true
    });
    const renderedTextBounds: LayoutRect = {
      x: reviewTextPanel.x,
      y: reviewTextPanel.y,
      width: renderedWidth,
      height: renderedHeight
    };
    const auditLegend: LayoutRect = {
      x: renderedTextBounds.x,
      y: Math.max(
        playLayout.compact ? 46 : 58,
        edges(renderedTextBounds).top - resolutionAuditLegendPromptOffsetY(playLayout.compact)
      ),
      width: playLayout.compact ? 126 : 170,
      height: playLayout.compact ? 20 : 22
    };
    const expectedClearance = playLayout.compact
      ? COMPACT_REVIEW_SPEECH_CLEARANCE_PX
      : REVIEW_SPEECH_CLEARANCE_PX;

    expect(overlaps(speech.panel, auditLegend)).toBe(false);
    expect(edges(auditLegend).bottom).toBeLessThanOrEqual(edges(renderedTextBounds).top - 12);
    expect(clearanceBetween(speech.panel, auditLegend)).toBeGreaterThanOrEqual(expectedClearance);
  });
});
