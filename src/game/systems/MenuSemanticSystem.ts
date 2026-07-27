import type { SemanticSnapshot } from "../semantic/SemanticRuntime";
import { PRODUCT_NAME } from "./ProductIdentitySystem";

export interface MenuSemanticSnapshotInput {
  bestRankText: string;
  trainingQualified?: boolean;
}

export function menuSemanticSnapshot(input: MenuSemanticSnapshotInput): SemanticSnapshot {
  return {
    scene: "menu",
    heading: PRODUCT_NAME,
    summary: ["Welcome to WienerWorks", input.bestRankText].join("\n"),
    actions: [
      { id: "tutorial", label: "Tutorial" },
      {
        id: "training",
        label: input.trainingQualified === false ? "Training - Locked" : "Training",
        ...(input.trainingQualified === false ? { disabled: true } : {})
      },
      { id: "token-log", label: "Token Log" },
      { id: "settings", label: "Settings" }
    ]
  };
}
