import type { SemanticSnapshot } from "../semantic/SemanticRuntime";
import type { TutorialCompleteCopy } from "./TutorialCompleteContentSystem";

export function tutorialCompleteSemanticSnapshot(copy: TutorialCompleteCopy): SemanticSnapshot {
  return {
    scene: "tutorial-complete",
    heading: copy.title,
    summary: copy.summary,
    actions: [
      { id: "primary", label: copy.primaryAction },
      { id: "menu", label: copy.secondaryAction }
    ],
    announcement: {
      id: "tutorial-complete:outcome",
      text: `${copy.title}\n${copy.summary}`,
      politeness: "polite"
    }
  };
}
