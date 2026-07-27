import type { GameQaRect, GameQaSnapshot } from "./GameQaSystem";
import type { TutorialCompleteCopy } from "./TutorialCompleteContentSystem";
import type { TutorialCompleteLayout } from "./TutorialCompleteLayoutSystem";

export function centeredGameQaRectFromTopLeftBounds(
  bounds: Readonly<{ x: number; y: number; width: number; height: number }>
): GameQaRect {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
    width: bounds.width,
    height: bounds.height
  };
}

export function tutorialCompleteQaSnapshot(
  width: number,
  height: number,
  layout: TutorialCompleteLayout,
  copy: TutorialCompleteCopy,
  summaryRect: GameQaRect
): GameQaSnapshot {
  return {
    scene: "TutorialCompleteScene",
    compact: layout.compact,
    viewport: { width, height },
    elements: [
      { id: "panel", rect: layout.panel },
      {
        id: "title",
        text: copy.title,
        fontSize: layout.title.fontSize,
        wordWrapWidth: layout.title.wordWrapWidth,
        rect: {
          x: layout.title.x,
          y: layout.title.y,
          width: layout.title.wordWrapWidth,
          height: layout.title.fontSize * 1.25
        }
      },
      {
        id: "summary",
        text: copy.summary,
        fontSize: layout.summary.fontSize,
        wordWrapWidth: layout.summary.wordWrapWidth,
        rect: summaryRect
      },
      { id: "primaryButton", text: copy.primaryAction, rect: layout.primaryButton },
      { id: "menuButton", text: copy.secondaryAction, rect: layout.menuButton }
    ]
  };
}
