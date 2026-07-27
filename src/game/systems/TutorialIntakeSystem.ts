import type { SemanticSnapshot } from "../semantic/SemanticRuntime";
import type { GameQaSnapshot } from "./GameQaSystem";
import type { LayoutRect } from "./PlayLayoutSystem";
import { safeAreaInsets, type SafeAreaInput } from "./SafeAreaSystem";

export type TutorialIntakeActionId = "continue" | "clock-in" | "back";

export type TutorialIntakeArtifact =
  | {
      kind: "assignment";
      division: string;
      status: string;
    }
  | {
      kind: "tokens";
      tokenStrings: readonly string[];
      tokenIds?: readonly number[];
    }
  | {
      kind: "qualification";
      steps: readonly string[];
    };

export const tutorialIntakeRoutes = {
  entry: { scene: "TutorialScene" },
  clockIn: { scene: "PlayScene", data: { tutorial: true, startSource: "menu" } },
  back: { scene: "MenuScene" }
} as const;

export interface TutorialIntakeCopy {
  pageIndex: number;
  pageCount: number;
  title: string;
  premise: string;
  wienerNote: string;
  artifact: TutorialIntakeArtifact;
  progressLabels: readonly string[];
  primaryActionId: "continue" | "clock-in";
  primaryAction: string;
  secondaryAction: string;
}

export interface TutorialIntakeTextBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  align: "left" | "center";
}

export interface TutorialIntakeLayout {
  compact: boolean;
  panel: LayoutRect;
  mascot: LayoutRect;
  title: TutorialIntakeTextBlock;
  premise: TutorialIntakeTextBlock;
  artifact: LayoutRect;
  wienerBubble: LayoutRect;
  wienerNote: TutorialIntakeTextBlock;
  progress: LayoutRect;
  primaryButton: LayoutRect;
  secondaryButton: LayoutRect;
}

interface TutorialIntakePage {
  title: string;
  premise: string;
  wienerNote: string;
  artifact: TutorialIntakeArtifact;
}

const PAGE_COPY: readonly TutorialIntakePage[] = [
  {
    title: "Your First Shift",
    premise: "Welcome to your first day at WienerWorks. You have been assigned to the Manual Tokenization Division.",
    wienerNote: "I am Wiener. Compute is expensive, and human attention cheap, so management has given me the impossible task of training you to replace the machine. Good luck.",
    artifact: {
      kind: "assignment",
      division: "MANUAL TOKENIZATION",
      status: "ORIENTATION IN PROGRESS"
    }
  },
  {
    title: "The Inference Pipeline",
    premise: "You are now an essential part of the WienerWorks inference pipeline. Before a language model can process text, its input must be converted into tokens. Your assignment is to mark those tokens accurately.",
    wienerNote: "The model receives tokens, not sentences: reusable pieces that may be a word, part of a word, punctuation, or even a space. You will be finding them by hand. A charming arrangement.",
    artifact: {
      kind: "tokens",
      tokenStrings: ["please", " summarize", " this", " sentence"]
    }
  },
  {
    title: "Standard Tokenization Protocol",
    premise: "WienerWorks uses the Standard Tokenization Protocol adopted across production systems. Every approved token corresponds to a fixed numerical identifier.",
    wienerNote: "The standard was built by repeatedly merging byte patterns that appear often. Each token receives a number the system uses to identify and process it. Please resist assigning them meaning.",
    artifact: {
      kind: "tokens",
      tokenStrings: ["please", " summarize", " this", " sentence"],
      tokenIds: [31121, 63179, 420, 11914]
    }
  },
  {
    title: "Qualification",
    premise: "Complete the supervised tutorial to qualify for Machine Replacement Training. Passing grants access to the accelerating production queue and a 40 TC operating account.",
    wienerNote: "Correct token prediction earns Token Credits (TC). Missed boundaries and invented fragments cost TCs to rework. At zero, access is revoked. TCs are redeemable for WienerWorks inference. Management calls this compensation.",
    artifact: {
      kind: "qualification",
      steps: ["TUTORIAL", "QUALIFIED", "TRAINING"]
    }
  }
];

const PROGRESS_LABELS = ["JOB", "TOKENS", "BOUNDARIES", "QUALIFY"] as const;
const PANEL_MARGIN_X = 14;
const PANEL_MARGIN_Y = 12;
const MAX_PANEL_WIDTH = 720;
const MAX_PANEL_HEIGHT = 620;

export function tutorialIntakePageCount(): number {
  return PAGE_COPY.length;
}

export function tutorialIntakeCopy(pageIndex = 0): TutorialIntakeCopy {
  const normalizedPageIndex = Math.max(0, Math.min(PAGE_COPY.length - 1, Math.floor(pageIndex)));
  const page = PAGE_COPY[normalizedPageIndex];
  const finalPage = normalizedPageIndex === PAGE_COPY.length - 1;

  return {
    pageIndex: normalizedPageIndex,
    pageCount: PAGE_COPY.length,
    title: page.title,
    premise: page.premise,
    wienerNote: page.wienerNote,
    artifact: page.artifact,
    progressLabels: PROGRESS_LABELS,
    primaryActionId: finalPage ? "clock-in" : "continue",
    primaryAction: finalPage ? "Clock In" : "Continue",
    secondaryAction: normalizedPageIndex === 0 ? "Return to Menu" : "Previous"
  };
}

export function computeTutorialIntakeLayout(
  width: number,
  height: number,
  safeAreaInput?: SafeAreaInput,
  pageIndex = 0
): TutorialIntakeLayout {
  const safeArea = safeAreaInsets(safeAreaInput);
  const usableWidth = Math.max(0, width - safeArea.left - safeArea.right);
  const usableHeight = Math.max(0, height - safeArea.top - safeArea.bottom);
  const compact = usableWidth < 620 || usableHeight < 700;
  const panelWidth = Math.max(0, Math.min(MAX_PANEL_WIDTH, usableWidth - PANEL_MARGIN_X * 2));
  const panelHeight = Math.max(0, Math.min(MAX_PANEL_HEIGHT, usableHeight - PANEL_MARGIN_Y * 2));
  const panel = {
    x: safeArea.left + usableWidth / 2,
    y: safeArea.top + usableHeight / 2,
    width: panelWidth,
    height: panelHeight
  };
  const panelTop = panel.y - panel.height / 2;
  const panelBottom = panel.y + panel.height / 2;
  const shortPanel = panel.height < 580;
  const narrowPhone = compact && usableWidth < 350;
  const horizontalInset = compact ? 22 : 54;
  const contentWidth = Math.max(0, panel.width - horizontalInset * 2);
  const secondaryHeight = compact ? 40 : 42;
  const primaryHeight = compact ? 50 : 52;
  const secondaryButton = {
    x: panel.x,
    y: panelBottom - 18 - secondaryHeight / 2,
    width: Math.max(0, Math.min(compact ? 316 : 300, panel.width - 36)),
    height: secondaryHeight
  };
  const primaryButton = {
    x: panel.x,
    y: secondaryButton.y - secondaryHeight / 2 - 10 - primaryHeight / 2,
    width: secondaryButton.width,
    height: primaryHeight
  };
  const progress = {
    x: panel.x,
    y: primaryButton.y - primaryButton.height / 2 - 20,
    width: Math.min(contentWidth, compact ? 280 : 340),
    height: 24
  };
  const mascotHeight = narrowPhone ? 56 : shortPanel ? 62 : compact ? 72 : 82;
  const mascotWidth = mascotHeight * (69 / 89);
  const speechGap = narrowPhone ? 4 : compact ? 10 : 18;
  const bubbleHeight = narrowPhone ? 182 : shortPanel ? 166 : 168;
  const compactBubbleLeft = panel.x - contentWidth / 2;
  const compactMascotX = panel.x + panel.width / 2 - mascotWidth / 2;
  const compactBubbleWidth = compactMascotX - mascotWidth / 2 - speechGap - compactBubbleLeft;
  const bubbleWidth = Math.max(
    0,
    compact
      ? compactBubbleWidth
      : Math.min(420, contentWidth - mascotWidth - speechGap)
  );
  const speechGroupWidth = bubbleWidth + speechGap + mascotWidth;
  const speechGroupLeft = compact
    ? compactBubbleLeft
    : panel.x - speechGroupWidth / 2;
  const bubbleClearance = shortPanel ? 6 : 12;
  const artifactHeight = shortPanel ? 36 : 50;
  const artifactY = panelTop + (shortPanel ? 172 : 214);
  const artifactBottom = artifactY + artifactHeight / 2;
  const bubbleTop = artifactBottom + bubbleClearance;
  const bubbleY = Math.min(
    bubbleTop + bubbleHeight / 2,
    progress.y - bubbleClearance - bubbleHeight / 2
  );
  const mascotX = compact
    ? compactMascotX
    : speechGroupLeft + bubbleWidth + speechGap + mascotWidth / 2;
  const mascotY = bubbleY + bubbleHeight / 2 - mascotHeight / 2 + 2;
  const titleY = panelTop + (shortPanel ? 54 : 60);
  const premiseY = panelTop + (shortPanel ? 116 : 138);
  const premiseHeight = shortPanel ? 62 : 84;
  const bubbleX = speechGroupLeft + bubbleWidth / 2;
  const speechPadding = narrowPhone ? 12 : 16;
  const speechFontSize = compact ? 11 : 14;

  return {
    compact,
    panel,
    title: { x: panel.x, y: titleY, width: contentWidth, height: 58, fontSize: compact ? 27 : 34, align: "center" },
    premise: {
      x: panel.x,
      y: premiseY,
      width: contentWidth,
      height: premiseHeight,
      fontSize: compact ? 12 : 15,
      align: "center"
    },
    artifact: { x: panel.x, y: artifactY, width: contentWidth, height: artifactHeight },
    wienerBubble: { x: bubbleX, y: bubbleY, width: bubbleWidth, height: bubbleHeight },
    wienerNote: {
      x: speechGroupLeft + speechPadding,
      y: bubbleY,
      width: Math.max(0, bubbleWidth - speechPadding * 2),
      height: bubbleHeight - 24,
      fontSize: speechFontSize,
      align: "left"
    },
    mascot: { x: mascotX, y: mascotY, width: mascotWidth, height: mascotHeight },
    progress,
    primaryButton,
    secondaryButton
  };
}

export function tutorialIntakeSemanticSnapshot(copy: TutorialIntakeCopy): SemanticSnapshot {
  const artifact = tutorialIntakeArtifactSummary(copy.artifact);
  return {
    scene: "tutorial-intake",
    heading: copy.title,
    summary: [copy.premise, artifact, copy.wienerNote].join("\n"),
    actions: [
      { id: copy.primaryActionId, label: copy.primaryAction },
      { id: "back", label: copy.secondaryAction }
    ],
    announcement: {
      id: `tutorial-intake:${copy.pageIndex + 1}`,
      text: `${copy.title}\n${copy.premise}`,
      politeness: "polite"
    }
  };
}

export function tutorialIntakeQaSnapshot(
  width: number,
  height: number,
  layout: TutorialIntakeLayout,
  copy: TutorialIntakeCopy
): GameQaSnapshot {
  return {
    scene: "TutorialScene",
    compact: layout.compact,
    viewport: { width, height },
    elements: [
      { id: "panel", rect: layout.panel },
      qaText("title", copy.title, layout.title),
      qaText("premise", copy.premise, layout.premise),
      { id: "artifact", text: tutorialIntakeArtifactSummary(copy.artifact), rect: layout.artifact },
      { id: "wienerBubble", rect: layout.wienerBubble },
      qaText("wienerNote", copy.wienerNote, layout.wienerNote),
      { id: "mascot", rect: layout.mascot },
      { id: "progress", text: copy.progressLabels.join(" / "), rect: layout.progress },
      { id: "primaryButton", text: copy.primaryAction, rect: layout.primaryButton },
      { id: "secondaryButton", text: copy.secondaryAction, rect: layout.secondaryButton }
    ]
  };
}

function tutorialIntakeArtifactSummary(artifact: TutorialIntakeArtifact): string {
  if (artifact.kind === "assignment") {
    return `Division: ${artifact.division}; Status: ${artifact.status}`;
  }

  if (artifact.kind === "qualification") {
    return artifact.steps.join(" -> ");
  }

  return artifact.tokenStrings
    .map((token, index) => artifact.tokenIds ? `${token} -> ${artifact.tokenIds[index]}` : token)
    .join(" | ");
}

function qaText(id: string, text: string, block: TutorialIntakeTextBlock) {
  return {
    id,
    text,
    fontSize: block.fontSize,
    wordWrapWidth: block.width,
    rect: {
      x: block.align === "left" ? block.x + block.width / 2 : block.x,
      y: block.y,
      width: block.width,
      height: block.height
    }
  };
}
