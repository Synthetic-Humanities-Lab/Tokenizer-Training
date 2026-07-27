import type {
  SemanticAnnouncement,
  SemanticControl,
  SemanticSnapshot
} from "../semantic/SemanticRuntime";
import {
  RESET_BEST_RANK_CANCEL_LABEL,
  RESET_BEST_RANK_CONFIRM_LABEL,
  RESET_BEST_RANK_MESSAGE,
  RESET_BEST_RANK_TITLE,
  type BestRankResetSnapshot
} from "./BestRankResetSystem";
import type { HapticFeedbackCapability } from "./HapticFeedbackSystem";
import type { HapticPreferenceSnapshot } from "./HapticPreferenceSystem";
import type { MotionPreferenceSnapshot } from "./MotionPreferenceSystem";

const REDUCED_MOTION_LABEL = "Reduced Motion";

export interface SettingsSemanticSnapshotInput {
  bestRankStatus: string;
  muted: boolean;
  motionPreference: MotionPreferenceSnapshot;
  hapticCapability: HapticFeedbackCapability;
  hapticPreference: HapticPreferenceSnapshot;
  reset: BestRankResetSnapshot;
  dialogModal?: boolean;
  announcement?: SemanticAnnouncement;
}

export type SettingsSemanticSnapshot = SemanticSnapshot & {
  controls: readonly SemanticControl[];
};

export function settingsSemanticSnapshot(
  input: SettingsSemanticSnapshotInput
): SettingsSemanticSnapshot {
  return {
    scene: "settings" as const,
    heading: "Settings",
    summary: input.bestRankStatus,
    actions: [],
    controls: [
      {
        kind: "switch",
        id: "sound",
        label: "Sound",
        checked: !input.muted
      },
      {
        kind: "button",
        id: "reset-best-rank",
        label: "Reset Best Rank"
      },
      {
        kind: "switch",
        id: "reduced-motion",
        label: REDUCED_MOTION_LABEL,
        checked: input.motionPreference.reduced
      },
      input.hapticCapability.available
        ? {
            kind: "switch",
            id: "haptics",
            label: "Haptics",
            checked: input.hapticPreference.enabled
          }
        : {
            kind: "status",
            id: "haptics",
            label: "Haptics",
            value: "Unavailable on this device"
          },
      {
        kind: "button",
        id: "back",
        label: "Back"
      }
    ] as const,
    ...(input.reset.phase === "confirming"
      ? {
          dialog: {
            id: "reset-best-rank-dialog",
            title: RESET_BEST_RANK_TITLE,
            message: RESET_BEST_RANK_MESSAGE,
            modal: input.dialogModal === true,
            actions: [
              {
                kind: "button" as const,
                id: "reset-cancel",
                label: RESET_BEST_RANK_CANCEL_LABEL
              },
              {
                kind: "button" as const,
                id: "reset-confirm",
                label: RESET_BEST_RANK_CONFIRM_LABEL,
                destructive: true
              }
            ],
            initialFocusActionId: "reset-cancel",
            dismissActionId: "reset-cancel",
            returnFocusActionId: "reset-best-rank"
          }
        }
      : {}),
    ...(input.announcement ? { announcement: input.announcement } : {})
  };
}

export function settingsResetAnnouncement(
  reset: BestRankResetSnapshot,
  bestRankStatus: string
): SemanticAnnouncement | undefined {
  if (reset.outcome === "none") {
    return undefined;
  }

  return {
    id: `settings:reset:${reset.outcome}`,
    text: bestRankStatus,
    politeness: reset.outcome === "unavailable" ? "assertive" : "polite"
  };
}
