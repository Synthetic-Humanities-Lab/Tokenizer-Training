import { describe, expect, it } from "vitest";
import type { SemanticAnnouncement } from "../src/game/semantic/SemanticRuntime";
import {
  RESET_BEST_RANK_CANCEL_LABEL,
  RESET_BEST_RANK_CONFIRM_LABEL,
  RESET_BEST_RANK_MESSAGE,
  RESET_BEST_RANK_TITLE,
  type BestRankResetSnapshot
} from "../src/game/systems/BestRankResetSystem";
import type { HapticFeedbackCapability } from "../src/game/systems/HapticFeedbackSystem";
import type { HapticPreferenceSnapshot } from "../src/game/systems/HapticPreferenceSystem";
import type { MotionPreferenceSnapshot } from "../src/game/systems/MotionPreferenceSystem";
import {
  settingsResetAnnouncement,
  settingsSemanticSnapshot,
  type SettingsSemanticSnapshotInput
} from "../src/game/systems/SettingsSemanticSystem";

const BEST_RANK_STATUS = "BEST RANK\nJunior Boundary Clerk\n7 rounds";
const MOTION_OFF: MotionPreferenceSnapshot = { reduced: false, supported: true };
const HAPTICS_AVAILABLE: HapticFeedbackCapability = { available: true, route: "native" };
const HAPTICS_ON: HapticPreferenceSnapshot = {
  enabled: true,
  persisted: true,
  source: "stored"
};
const RESET_IDLE: BestRankResetSnapshot = {
  phase: "idle",
  outcome: "none",
  persisted: null
};

function input(
  overrides: Partial<SettingsSemanticSnapshotInput> = {}
): SettingsSemanticSnapshotInput {
  return {
    bestRankStatus: BEST_RANK_STATUS,
    muted: false,
    motionPreference: MOTION_OFF,
    hapticCapability: HAPTICS_AVAILABLE,
    hapticPreference: HAPTICS_ON,
    reset: RESET_IDLE,
    ...overrides
  };
}

describe("settingsSemanticSnapshot", () => {
  it("projects the Settings status and canvas control order without gameplay data", () => {
    const snapshot = settingsSemanticSnapshot(input());

    expect(snapshot).toEqual({
      scene: "settings",
      heading: "Settings",
      summary: BEST_RANK_STATUS,
      actions: [],
      controls: [
        { kind: "switch", id: "sound", label: "Sound", checked: true },
        { kind: "button", id: "reset-best-rank", label: "Reset Best Rank" },
        {
          kind: "switch",
          id: "reduced-motion",
          label: "Reduced Motion",
          checked: false
        },
        { kind: "switch", id: "haptics", label: "Haptics", checked: true },
        { kind: "button", id: "back", label: "Back" }
      ]
    });
    expect(snapshot).not.toHaveProperty("details");
    expect(snapshot).not.toHaveProperty("groups");
    expect(snapshot.actions).toEqual([]);
  });

  it.each([
    { muted: false, checked: true },
    { muted: true, checked: false }
  ])("keeps the Sound name stable when muted=$muted", ({ muted, checked }) => {
    const control = settingsSemanticSnapshot(input({ muted })).controls[0];

    expect(control).toEqual({ kind: "switch", id: "sound", label: "Sound", checked });
  });

  it.each<{
    motionPreference: MotionPreferenceSnapshot;
    checked: boolean;
  }>([
    { motionPreference: { reduced: true, supported: true }, checked: true },
    { motionPreference: { reduced: false, supported: true }, checked: false },
    { motionPreference: { reduced: false, supported: false }, checked: false }
  ])("exposes Reduced Motion as a functional switch checked=$checked", ({ motionPreference, checked }) => {
    const control = settingsSemanticSnapshot(input({ motionPreference })).controls[2];

    expect(control).toEqual({
      kind: "switch",
      id: "reduced-motion",
      label: "Reduced Motion",
      checked
    });
  });

  it.each([
    { enabled: true, checked: true },
    { enabled: false, checked: false }
  ])("keeps the Haptics name stable when enabled=$enabled", ({ enabled, checked }) => {
    const hapticPreference: HapticPreferenceSnapshot = {
      enabled,
      persisted: false,
      source: "session"
    };
    const control = settingsSemanticSnapshot(input({ hapticPreference })).controls[3];

    expect(control).toEqual({
      kind: "switch",
      id: "haptics",
      label: "Haptics",
      checked
    });
  });

  it("uses static status instead of a fabricated Haptics switch when unavailable", () => {
    const control = settingsSemanticSnapshot(input({
      hapticCapability: { available: false, route: "unavailable" },
      hapticPreference: { enabled: true, persisted: false, source: "unavailable" }
    })).controls[3];

    expect(control).toEqual({
      kind: "status",
      id: "haptics",
      label: "Haptics",
      value: "Unavailable on this device"
    });
  });

  it("retains inert background controls and adds the canonical reset alert dialog", () => {
    const idle = settingsSemanticSnapshot(input());
    const confirming = settingsSemanticSnapshot(input({
      reset: { phase: "confirming", outcome: "none", persisted: null }
    }));

    expect(confirming.controls).toEqual(idle.controls);
    expect(confirming.dialog).toEqual({
      id: "reset-best-rank-dialog",
      title: RESET_BEST_RANK_TITLE,
      message: RESET_BEST_RANK_MESSAGE,
      modal: false,
      actions: [
        { kind: "button", id: "reset-cancel", label: RESET_BEST_RANK_CANCEL_LABEL },
        {
          kind: "button",
          id: "reset-confirm",
          label: RESET_BEST_RANK_CONFIRM_LABEL,
          destructive: true
        }
      ],
      initialFocusActionId: "reset-cancel",
      dismissActionId: "reset-cancel",
      returnFocusActionId: "reset-best-rank"
    });
    expect(confirming.announcement).toBeUndefined();
  });

  it("marks only semantic-initiated confirmation as modal", () => {
    const reset = { phase: "confirming", outcome: "none", persisted: null } as const;

    expect(settingsSemanticSnapshot(input({ reset })).dialog?.modal).toBe(false);
    expect(settingsSemanticSnapshot(input({ reset, dialogModal: true })).dialog?.modal).toBe(true);
  });

  it.each<{
    reset: BestRankResetSnapshot;
    dialog: boolean;
  }>([
    { reset: RESET_IDLE, dialog: false },
    {
      reset: { phase: "confirming", outcome: "none", persisted: null },
      dialog: true
    },
    {
      reset: { phase: "idle", outcome: "cleared", persisted: null },
      dialog: false
    },
    {
      reset: { phase: "idle", outcome: "already-clear", persisted: null },
      dialog: false
    },
    {
      reset: { phase: "idle", outcome: "unavailable", persisted: null },
      dialog: false
    }
  ])("projects reset phase/outcome $reset.phase/$reset.outcome", ({ reset, dialog }) => {
    const snapshot = settingsSemanticSnapshot(input({ reset }));

    expect(snapshot.dialog !== undefined).toBe(dialog);
    expect(snapshot.announcement).toBeUndefined();
  });

  it("uses the supplied one-shot announcement even after a reset outcome", () => {
    const oneShot: SemanticAnnouncement = {
      id: "settings:notice:1",
      text: "Settings status updated.",
      politeness: "assertive"
    };

    expect(settingsSemanticSnapshot(input({ announcement: oneShot })).announcement).toEqual(oneShot);
    expect(settingsSemanticSnapshot(input({
      announcement: oneShot,
      bestRankStatus: "Reset unavailable. Stored rank could not be verified.",
      reset: { phase: "idle", outcome: "unavailable", persisted: null }
    })).announcement).toEqual(oneShot);
  });

  it.each([
    ["cleared", "polite"],
    ["already-clear", "polite"],
    ["unavailable", "assertive"]
  ] as const)("creates one reset outcome announcement for %s", (outcome, politeness) => {
    expect(settingsResetAnnouncement(
      { phase: "idle", outcome, persisted: null },
      BEST_RANK_STATUS
    )).toEqual({
      id: `settings:reset:${outcome}`,
      text: BEST_RANK_STATUS,
      politeness
    });
  });

  it("does not announce ordinary Sound or Haptics state changes", () => {
    expect(settingsSemanticSnapshot(input({ muted: true })).announcement).toBeUndefined();
    expect(settingsSemanticSnapshot(input({
      hapticPreference: { enabled: false, persisted: true, source: "stored" }
    })).announcement).toBeUndefined();
  });
});
