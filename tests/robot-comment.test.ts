import { describe, expect, it } from "vitest";
import {
  COMPACT_REVIEW_SPEECH_CLEARANCE_PX,
  computePetSpeechLayout,
  computeRobotToastLayout,
  REVIEW_SPEECH_CLEARANCE_PX,
  robotBriefLine,
  robotToastDurationMs,
  robotToastMaxLength,
  robotToastSourceText
} from "../src/game/systems/RobotCommentSystem";
import { computePlayLayout, type LayoutRect } from "../src/game/systems/PlayLayoutSystem";
import { resolutionAuditLegendPromptOffsetY } from "../src/game/systems/ResolutionFeedbackSystem";
import { TUTORIAL_ROUND_DURATION_MS, TutorialSystem } from "../src/game/systems/TutorialSystem";
import { computeFeedbackCardLayout } from "../src/game/ui/FeedbackCard";

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

describe("RobotCommentSystem", () => {
  it("keeps near-action robot comments brief", () => {
    const line = robotBriefLine(
      "TUTORIAL 6/10 - Contractions: Tokens are learned byte-pattern chunks and do not respect ordinary classroom word boundaries.",
      76
    );

    expect(line.length).toBeLessThanOrEqual(76);
    expect(line).toContain("TUTORIAL 6/10");
    expect(line.endsWith("...")).toBe(true);
  });

  it("clips near-action comments on readable word boundaries when possible", () => {
    const line = robotBriefLine(
      "TUTORIAL 1/10 - Swipe orange targets; pale guides show legal slots; payroll wants tokenizer boundaries.",
      76
    );

    expect(line).toBe("TUTORIAL 1/10 - Swipe orange targets; pale guides show legal slots;...");
  });

  it("keeps compact tutorial toasts as complete short instructions when possible", () => {
    const source = robotToastSourceText(
      "TUTORIAL 1/10 - Slot guides: Learn legal cut positions before guessing token boundaries. Pale guides are legal slots.",
      true
    );
    const line = robotBriefLine(
      source,
      78
    );

    expect(source).not.toContain("TUTORIAL 1/10");
    expect(line).toBe("Learn legal cut positions before guessing token boundaries.");
    expect(line.endsWith("...")).toBe(false);
  });

  it("strips Wiener speaker prefixes before shortening near-action toasts", () => {
    expect(robotToastSourceText("WIENER: Help disabled to preserve margin.", true)).toBe(
      "Help disabled to preserve margin."
    );
  });

  it("keeps every tutorial near-action toast within compact wrap capacity", () => {
    const tutorial = new TutorialSystem();
    const maxLength = robotToastMaxLength(true);
    const layout = computeRobotToastLayout(
      { width: 390, height: 844 },
      { x: 195, y: 650, width: 358, height: 96 },
      true
    );
    const maxCharsPerLine = Math.floor(layout.text.wordWrapWidth / (layout.text.fontSize * 0.62));

    tutorial.all().forEach((_, index) => {
      for (const prompt of [
        tutorial.activePromptFor(index),
        tutorial.introPromptFor(index),
        tutorial.mechanicsPromptFor(index),
        tutorial.bytePromptFor(index),
        tutorial.tokenIdPromptFor(index),
        tutorial.rulePromptFor(index),
        tutorial.followupPromptFor(index)
      ]) {
        const line = robotBriefLine(robotToastSourceText(prompt, true), maxLength);

        expect(line.length, line).toBeLessThanOrEqual(maxLength);
        expect(estimatedWrappedLineCount(line, maxCharsPerLine), line).toBeLessThanOrEqual(2);
      }
    });
  });

  it("keeps near-action comments visible long enough to read", () => {
    const short = robotToastDurationMs("Leading-space boundary missed.");
    const long = robotToastDurationMs(
      "TUTORIAL 4/10 - One orange target: cut before the visible gap. Do not add a cut after it.",
      { tutorialMode: true }
    );
    const capped = robotToastDurationMs(
      "TUTORIAL 8/10 - URLs fragment quickly because dots, slashes, short names, and suffixes often become separate tokenizer chunks.",
      { tutorialMode: true }
    );
    const compact = robotToastDurationMs(
      "TUTORIAL 1/10 - Slot guides: Learn legal cut positions before guessing token boundaries.",
      { tutorialMode: true, maxLength: 78 }
    );

    expect(short).toBeGreaterThanOrEqual(3400);
    expect(short).toBeLessThanOrEqual(4800);
    expect(long).toBeGreaterThan(short);
    expect(compact).toBeGreaterThanOrEqual(4800);
    expect(capped).toBeLessThanOrEqual(6200);
  });

  it("positions the robot toast near the static prompt text while staying inside the viewport", () => {
    const layout = computeRobotToastLayout(
      { width: 390, height: 844 },
      { x: 195, y: 520, width: 358, height: 96 },
      true
    );

    expect(layout.panel.x).toBe(195);
    expect(layout.panel.y).toBeLessThan(520);
    expect(layout.panel.height).toBe(62);
    expect(layout.panel.width).toBeLessThanOrEqual(358);
    expect(layout.panel.x - layout.panel.width / 2).toBeGreaterThanOrEqual(14);
    expect(layout.panel.x + layout.panel.width / 2).toBeLessThanOrEqual(376);
    expect(layout.label.fontSize).toBe(8);
    expect(layout.label.visible).toBe(true);
    expect(layout.label.y).toBeLessThan(layout.text.y);
    expect(layout.text.wordWrapWidth).toBe(layout.panel.width - 32);
  });

  it("keeps the compact toast readable above the static prompt", () => {
    const width = 320;
    const height = 568;
    const playLayout = computePlayLayout({ width, height });
    const frozenElapsedMs = Math.round(TUTORIAL_ROUND_DURATION_MS * 0.238);
    const movingTextY =
      playLayout.sentenceStartY
      + (playLayout.sentenceEndY - playLayout.sentenceStartY) * (frozenElapsedMs / TUTORIAL_ROUND_DURATION_MS);
    const movingTextPanel = {
      ...playLayout.textPanel,
      y: movingTextY
    };
    const toast = computeRobotToastLayout({ width, height }, movingTextPanel, true);

    expect(toast.panel.height).toBe(62);
    expect(toast.label.visible).toBe(true);
    expect(toast.text.fontSize).toBe(12);
    expect(edges(toast.panel).top).toBeGreaterThanOrEqual(edges(playLayout.resolveButton).bottom);
    expect(edges(toast.panel).bottom).toBeLessThanOrEqual(edges(movingTextPanel).top);
  });

  it("moves below the text panel when there is no space above it", () => {
    const layout = computeRobotToastLayout(
      { width: 390, height: 844 },
      { x: 195, y: 70, width: 358, height: 96 },
      true
    );

    expect(layout.panel.y).toBeGreaterThan(70);
    expect(layout.panel.y + layout.panel.height / 2).toBeLessThan(844);
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
      petBounds: playLayout.assistantPanel,
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
      petBounds: playLayout.assistantPanel,
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
      petBounds: playLayout.assistantPanel,
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
      petBounds: playLayout.assistantPanel,
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
