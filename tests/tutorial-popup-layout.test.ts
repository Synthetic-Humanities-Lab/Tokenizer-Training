import { describe, expect, it } from "vitest";
import {
  compactPlayControlsDockedAtBottom,
  computePlayLayout
} from "../src/game/systems/PlayLayoutSystem";
import { computeTutorialPopupLayout } from "../src/game/systems/TutorialPopupLayoutSystem";
import {
  compactTutorialPopupTitle,
  TUTORIAL_ROUND_DURATION_MS,
  TutorialSystem
} from "../src/game/systems/TutorialSystem";
import type { LayoutRect } from "../src/game/systems/PlayLayoutSystem";
import { computeOverseerPanelLayout } from "../src/game/ui/OverseerPanel";

function edges(rect: LayoutRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function withinViewport(rect: LayoutRect, width: number, height: number): boolean {
  const rectEdges = edges(rect);
  return rectEdges.left >= 0 && rectEdges.right <= width && rectEdges.top >= 0 && rectEdges.bottom <= height;
}

function overlaps(a: LayoutRect, b: LayoutRect): boolean {
  const aEdges = edges(a);
  const bEdges = edges(b);
  return (
    aEdges.left < bEdges.right
    && aEdges.right > bEdges.left
    && aEdges.top < bEdges.bottom
    && aEdges.bottom > bEdges.top
  );
}

function activeTutorialPopupWindows(tutorial: TutorialSystem, instructionWindowMs: number): Array<{ start: number; end: number }> {
  const mechanicsStart = instructionWindowMs;
  const byteStart = mechanicsStart + tutorial.mechanicsPopupWindowMs() + 600;
  const tokenIdStart = byteStart + tutorial.bytePopupWindowMs() + 600;
  const ruleStart = tokenIdStart + tutorial.tokenIdPopupWindowMs() + 600;
  const followupStart = ruleStart + tutorial.rulePopupWindowMs() + 600;

  return [
    { start: 0, end: tutorial.introPopupWindowMs() },
    { start: mechanicsStart, end: mechanicsStart + tutorial.mechanicsPopupWindowMs() },
    { start: byteStart, end: byteStart + tutorial.bytePopupWindowMs() },
    { start: tokenIdStart, end: tokenIdStart + tutorial.tokenIdPopupWindowMs() },
    { start: ruleStart, end: ruleStart + tutorial.rulePopupWindowMs() },
    { start: followupStart, end: followupStart + tutorial.followupPopupWindowMs() }
  ];
}

describe("computeTutorialPopupLayout", () => {
  it("keeps intro tutorial windows as restrained desktop callouts", () => {
    const layout = computeTutorialPopupLayout({
      width: 1280,
      height: 720,
      resolving: false,
      referenceBottom: 140
    });

    expect(layout.panel.x).toBe(810);
    expect(layout.panel.y).toBe(210);
    expect(layout.panel.width).toBe(320);
    expect(layout.panel.height).toBe(82);
    expect(layout.title.fontSize).toBe(10);
    expect(layout.body.fontSize).toBe(12);
    expect(layout.stamp.visible).toBe(false);
    expect(edges(layout.panel).top).toBeGreaterThan(132);
    expect(withinViewport(layout.panel, 1280, 720)).toBe(true);
  });

  it("moves review tutorial windows below resolved text evidence", () => {
    const referenceBottom = 140;
    const layout = computeTutorialPopupLayout({
      width: 1280,
      height: 720,
      resolving: true,
      referenceBottom
    });

    expect(edges(layout.panel).top).toBeGreaterThanOrEqual(referenceBottom + 12);
    expect(layout.panel.y).toBeGreaterThanOrEqual(210);
    expect(withinViewport(layout.panel, 1280, 720)).toBe(true);
  });

  it("keeps compact review tutorial windows below the reference and above reserved bottom chrome", () => {
    const referenceBottom = 235;
    const layout = computeTutorialPopupLayout({
      width: 390,
      height: 844,
      resolving: true,
      referenceBottom
    });

    expect(layout.panel.width).toBeGreaterThanOrEqual(300);
    expect(layout.panel.width).toBeLessThanOrEqual(362);
    expect(layout.title.fontSize).toBe(9);
    expect(layout.body.fontSize).toBe(13);
    expect(edges(layout.panel).top).toBeGreaterThanOrEqual(referenceBottom + 12);
    expect(edges(layout.panel).bottom).toBeLessThanOrEqual(844 - 96);
    expect(withinViewport(layout.panel, 390, 844)).toBe(true);
  });

  it("keeps phone active tutorial windows clear of bottom-docked controls and static prompt text", () => {
    const width = 390;
    const height = 844;
    const playLayout = computePlayLayout({ width, height });
    const frozenElapsedMs = 6200;
    const frozenSentenceY =
      playLayout.sentenceStartY
      + (playLayout.sentenceEndY - playLayout.sentenceStartY) * (frozenElapsedMs / TUTORIAL_ROUND_DURATION_MS);
    const activeTextPanelTop = frozenSentenceY - playLayout.textPanel.height / 2;
    const layout = computeTutorialPopupLayout({
      width,
      height,
      resolving: false,
      referenceBottom: frozenSentenceY + playLayout.textPanel.height / 2,
      referenceTop: activeTextPanelTop
    });

    expect(compactPlayControlsDockedAtBottom(height)).toBe(true);
    expect(edges(layout.panel).bottom).toBeLessThanOrEqual(edges(playLayout.resolveButton).top - 8);
    expect(edges(layout.panel).bottom).toBeLessThanOrEqual(activeTextPanelTop - 48);
    expect(layout.constrained).toBe(false);
    expect(layout.panel.height).toBe(136);
    expect(withinViewport(layout.panel, width, height)).toBe(true);
  });

  it("keeps the legacy short-phone intro popup fallback below the compact control row", () => {
    const width = 320;
    const height = 568;
    const playLayout = computePlayLayout({ width, height });
    const layout = computeTutorialPopupLayout({
      width,
      height,
      resolving: false,
      referenceBottom: 0
    });

    expect(edges(layout.panel).top).toBeGreaterThanOrEqual(edges(playLayout.resolveButton).bottom);
    expect(layout.constrained).toBe(true);
    expect(layout.panel.height).toBe(76);
    expect(withinViewport(layout.panel, width, height)).toBe(true);
  });

  it("keeps short-phone active tutorial windows clear of the moving token text", () => {
    const width = 320;
    const height = 568;
    const playLayout = computePlayLayout({ width, height });
    const frozenElapsedMs = 6200;
    const frozenSentenceY =
      playLayout.sentenceStartY
      + (playLayout.sentenceEndY - playLayout.sentenceStartY) * (frozenElapsedMs / TUTORIAL_ROUND_DURATION_MS);
    const activeTextPanelTop = frozenSentenceY - playLayout.textPanel.height / 2;
    const layout = computeTutorialPopupLayout({
      width,
      height,
      resolving: false,
      referenceBottom: frozenSentenceY + playLayout.textPanel.height / 2,
      referenceTop: activeTextPanelTop
    });

    expect(edges(layout.panel).top).toBeGreaterThanOrEqual(edges(playLayout.resolveButton).bottom);
    expect(edges(layout.panel).top).toBeGreaterThanOrEqual(frozenSentenceY + playLayout.textPanel.height / 2 + 8);
    expect(edges(layout.panel).bottom).toBeLessThanOrEqual(height - 108);
    expect(withinViewport(layout.panel, width, height)).toBe(true);
  });

  it("keeps active tutorial windows clear of the static prompt throughout their scheduled display windows", () => {
    const tutorial = new TutorialSystem();
    const viewports = [
      { width: 320, height: 568 },
      { width: 360, height: 740 },
      { width: 390, height: 844 },
      { width: 414, height: 896 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 }
    ];

    for (const viewport of viewports) {
      const playLayout = computePlayLayout(viewport);
      const overseer = computeOverseerPanelLayout(
        viewport.width,
        viewport.height,
        playLayout.overseerReservedRight
      ).panel;

      for (const round of tutorial.all()) {
        for (const window of activeTutorialPopupWindows(tutorial, round.instructionWindowMs)) {
          for (let elapsedMs = window.start; elapsedMs <= window.end; elapsedMs += 250) {
            const sentenceY =
              playLayout.sentenceStartY
              + (playLayout.sentenceEndY - playLayout.sentenceStartY) * (elapsedMs / TUTORIAL_ROUND_DURATION_MS);
            const textPanel = {
              ...playLayout.textPanel,
              y: sentenceY
            };
            const popup = computeTutorialPopupLayout({
              width: viewport.width,
              height: viewport.height,
              resolving: false,
              referenceTop: sentenceY - playLayout.textPanel.height / 2,
              referenceBottom: sentenceY + playLayout.textPanel.height / 2
            });

            expect(withinViewport(popup.panel, viewport.width, viewport.height)).toBe(true);
            expect(overlaps(popup.panel, textPanel)).toBe(false);
            expect(overlaps(popup.panel, playLayout.resolveButton)).toBe(false);
            expect(overlaps(popup.panel, playLayout.clearButton)).toBe(false);
            expect(overlaps(popup.panel, playLayout.muteButton)).toBe(false);
            expect(overlaps(popup.panel, overseer)).toBe(false);
          }
        }
      }
    }
  });

  it("uses a constrained review window on short phones instead of colliding with bottom chrome", () => {
    const referenceBottom = 343;
    const layout = computeTutorialPopupLayout({
      width: 320,
      height: 568,
      resolving: true,
      referenceBottom
    });

    expect(layout.constrained).toBe(true);
    expect(layout.panel.height).toBe(104);
    expect(layout.body.fontSize).toBe(12);
    expect(layout.stamp.visible).toBe(false);
    expect(edges(layout.panel).top).toBeGreaterThanOrEqual(referenceBottom + 8);
    expect(edges(layout.panel).bottom).toBeLessThanOrEqual(568 - 108);
    expect(withinViewport(layout.panel, 320, 568)).toBe(true);
  });

  it("keeps compact tutorial popup titles inside the header", () => {
    const layout = computeTutorialPopupLayout({
      width: 390,
      height: 844,
      resolving: false,
      referenceBottom: 735
    });
    const tutorial = new TutorialSystem();

    tutorial.all().forEach((_, index) => {
      const title = compactTutorialPopupTitle(tutorial.introPopupFor(index).title);
      const estimatedCourierWidth = title.length * layout.title.fontSize * 0.62;

      expect(estimatedCourierWidth, title).toBeLessThanOrEqual(layout.title.maxWidth);
    });
  });
});
