import type { GameQaElement, GameQaSnapshot } from "./GameQaSystem";
import type { MenuCopy } from "./MenuContentSystem";
import type { MenuLayout } from "./MenuLayoutSystem";
import { PRODUCT_NAME } from "./ProductIdentitySystem";
import { bestRankDisplayText, rankForRounds } from "./RankSystem";
import type { StorageQaState } from "./StorageSystem";

export interface MenuSceneQaSnapshotInput {
  width: number;
  height: number;
  layout: MenuLayout;
  copy: MenuCopy;
  highScoreRounds: number;
  highScoreRank: string;
  muted: boolean;
  trainingQualified?: boolean;
  storageQaState?: StorageQaState;
}

export function menuSceneQaSnapshot(input: MenuSceneQaSnapshotInput): GameQaSnapshot {
  const highScoreRounds = Math.max(0, Math.floor(input.highScoreRounds));
  const bestRecordText = bestRankDisplayText(highScoreRounds);
  const elements: GameQaElement[] = [
    { id: "card", rect: input.layout.card },
    {
      id: "companyMark",
      text: "Welcome to WienerWorks",
      fontSize: input.layout.companyMark.fontSize,
      wordWrapWidth: input.layout.companyMark.wordWrapWidth,
      rect: {
        x: input.layout.companyMark.align === "center"
          ? input.layout.companyMark.x
          : input.layout.companyMark.x + input.layout.companyMark.wordWrapWidth / 2,
        y: input.layout.companyMark.y,
        width: input.layout.companyMark.wordWrapWidth,
        height: input.layout.companyMark.fontSize * 1.35 * lineCount(input.layout.companyMark.displayText)
      }
    },
    {
      id: "title",
      text: PRODUCT_NAME,
      fontSize: input.layout.title.fontSize,
      wordWrapWidth: input.layout.title.wordWrapWidth,
      rect: {
        x: input.layout.title.x,
        y: input.layout.title.y,
        width: input.layout.title.wordWrapWidth,
        height: input.layout.title.fontSize * 1.25 * lineCount(input.layout.title.displayText)
      }
    },
    {
      id: "menuMascot",
      rect: input.layout.menuMascot
    },
    ...(input.layout.moduleLabel.visible
      ? [
          {
            id: "moduleLabel",
            text: input.layout.moduleLabel.text,
            fontSize: input.layout.moduleLabel.fontSize,
            wordWrapWidth: input.layout.moduleLabel.wordWrapWidth,
            rect: {
              x: input.layout.moduleLabel.x,
              y: input.layout.moduleLabel.y,
              width: input.layout.moduleLabel.wordWrapWidth,
              height: input.layout.compact ? 28 : 16
            }
          }
        ]
      : []),
    ...(input.layout.premise.visible
      ? [
          {
            id: "premise",
            text: input.copy.premise,
            fontSize: input.layout.premise.fontSize,
            wordWrapWidth: input.layout.premise.wordWrapWidth,
            rect: {
              x: input.layout.premise.x,
              y: input.layout.premise.y,
              width: input.layout.premise.wordWrapWidth,
              height: 76
            }
          }
        ]
      : []),
    ...(input.layout.workOrder.visible
      ? [
          {
            id: "workOrderPanel",
            text: input.copy.workOrderLabel,
            rect: input.layout.workOrder.panel
          },
          ...input.copy.workOrderRows.map((row, index): GameQaElement => ({
            id: `workOrderRow${index + 1}`,
            text: row,
            fontSize: input.layout.workOrder.rowFontSize,
            wordWrapWidth: input.layout.workOrder.rowWordWrapWidth,
            rect: {
              x: input.layout.workOrder.rowX + input.layout.workOrder.rowWordWrapWidth / 2,
              y: input.layout.workOrder.rowYs[index] ?? input.layout.workOrder.rowYs[0],
              width: input.layout.workOrder.rowWordWrapWidth,
              height: input.layout.workOrder.rowFontSize * 1.25
            }
          }))
        ]
      : []),
    {
      id: "bestRecord",
      text: bestRecordText,
      fontSize: input.layout.bestRecord.fontSize,
      wordWrapWidth: input.layout.bestRecord.wordWrapWidth,
      rect: {
        x: input.layout.bestRecord.x,
        y: input.layout.bestRecord.y,
        width: input.layout.bestRecord.wordWrapWidth,
        height: input.layout.bestRecord.fontSize * 1.35 * lineCount(bestRecordText)
      },
      visible: input.layout.bestRecord.visible
    },
    { id: "tutorialButton", text: "Tutorial", rect: input.layout.tutorialButton },
    {
      id: "trainingButton",
      text: input.trainingQualified === false ? "Training - Locked" : "Training",
      rect: input.layout.trainingButton
    },
    { id: "tokenLogButton", text: "Token Log", rect: input.layout.tokenLogButton },
    { id: "settingsButton", text: "Settings", rect: input.layout.settingsButton }
  ];

  return {
    scene: "MenuScene",
    compact: input.layout.compact,
    viewport: {
      width: input.width,
      height: input.height
    },
    state: {
      highScoreRounds: Math.max(0, Math.floor(input.highScoreRounds)),
      highScoreRank: rankForRounds(highScoreRounds),
      muted: input.muted,
      trainingQualified: input.trainingQualified ?? true,
      ...input.storageQaState
    },
    elements
  };
}

function lineCount(text: string): number {
  return Math.max(1, text.split("\n").length);
}
