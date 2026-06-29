import { describe, expect, it } from "vitest";
import { TutorialSystem } from "../src/game/systems/TutorialSystem";
import {
  computeOverseerPanelLayout,
  OVERSEER_COMPACT_MAX_LINES,
  overseerDisplayText
} from "../src/game/ui/OverseerPanel";

function edges(rect: { x: number; y: number; width: number; height: number }) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function estimatedWrappedLineCount(text: string, maxCharsPerLine: number): number {
  const words = text.split(/\s+/).filter(Boolean);
  let lineCount = 1;
  let currentLineLength = 0;

  for (const word of words) {
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

describe("computeOverseerPanelLayout", () => {
  it("keeps compact overseer copy inside the portrait viewport", () => {
    const layout = computeOverseerPanelLayout(390, 844);
    const panelEdges = edges(layout.panel);

    expect(panelEdges.left).toBeGreaterThanOrEqual(0);
    expect(panelEdges.right).toBeLessThanOrEqual(390);
    expect(panelEdges.bottom).toBeLessThanOrEqual(844);
    expect(layout.body.y).toBeGreaterThan(panelEdges.top);
    expect(layout.body.fontSize).toBe(13);
    expect(layout.body.wordWrapWidth).toBeLessThan(layout.panel.width);
  });

  it("shortens compact tutorial intro prompts without changing desktop copy", () => {
    const tutorial = new TutorialSystem();
    const fullPrompt = tutorial.introPromptFor(0);

    expect(overseerDisplayText(fullPrompt, false)).toBe(fullPrompt);
    expect(overseerDisplayText(fullPrompt, true)).toBe(
      "TUTORIAL 1/10: Learn legal cut positions before guessing token boundaries."
    );
  });

  it("keeps all compact tutorial overseer prompts inside the body line budget", () => {
    const tutorial = new TutorialSystem();
    const layout = computeOverseerPanelLayout(390, 844);
    const maxCharsPerLine = Math.floor(layout.body.wordWrapWidth / (layout.body.fontSize * 0.62));

    tutorial.all().forEach((_, index) => {
      for (const prompt of [
        tutorial.introPromptFor(index),
        tutorial.activePromptFor(index),
        tutorial.mechanicsPromptFor(index),
        tutorial.bytePromptFor(index),
        tutorial.rulePromptFor(index),
        tutorial.followupPromptFor(index)
      ]) {
        const displayText = overseerDisplayText(prompt, true);

        expect(estimatedWrappedLineCount(displayText, maxCharsPerLine), displayText).toBeLessThanOrEqual(
          OVERSEER_COMPACT_MAX_LINES
        );
      }
    });
  });

  it("keeps desktop overseer width clear of the reserved side assistant", () => {
    const layout = computeOverseerPanelLayout(1280, 720, 410);

    expect(layout.panel.width).toBe(838);
    expect(edges(layout.panel).right).toBeLessThanOrEqual(870);
    expect(layout.body.fontSize).toBe(15);
  });
});
