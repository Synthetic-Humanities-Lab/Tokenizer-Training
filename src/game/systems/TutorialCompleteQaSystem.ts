import type { GameQaSnapshot } from "./GameQaSystem";
import type { TutorialCompleteCopy } from "./TutorialCompleteContentSystem";
import type { TutorialCompleteLayout } from "./TutorialCompleteLayoutSystem";

export function tutorialCompleteQaSnapshot(
  width: number,
  height: number,
  layout: TutorialCompleteLayout,
  copy: TutorialCompleteCopy
): GameQaSnapshot {
  return {
    scene: "TutorialCompleteScene",
    compact: layout.compact,
    viewport: { width, height },
    elements: [
      { id: "panel", rect: layout.panel },
      { id: "chrome", rect: layout.chrome },
      {
        id: "chromeText",
        text: copy.chromePath,
        rect: {
          x: layout.chromeText.x + (layout.chrome.width - 14) / 2,
          y: layout.chromeText.y,
          width: layout.chrome.width - 14,
          height: 16
        }
      },
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
        rect: {
          x: layout.summary.x,
          y: layout.summary.y,
          width: layout.summary.wordWrapWidth,
          height: layout.summary.fontSize * 3.6
        }
      },
      { id: "primaryButton", text: copy.primaryAction, rect: layout.primaryButton },
      { id: "menuButton", text: copy.secondaryAction, rect: layout.menuButton }
    ]
  };
}
