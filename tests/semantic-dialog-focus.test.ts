import { describe, expect, it } from "vitest";
import {
  dialogTabActionId,
  dialogTransitionFocusActionId
} from "../src/game/semantic/SemanticDialogFocusSystem";

const dialog = {
  id: "reset-dialog",
  modal: true,
  initialFocusActionId: "cancel",
  returnFocusActionId: "reset"
};

describe("semantic dialog focus", () => {
  it("always enters a modal, but enters a nonmodal dialog only from semantic focus", () => {
    expect(dialogTransitionFocusActionId({
      nextDialog: dialog,
      focusWasInsideSurface: true,
      focusWasInsideDialog: false
    })).toBe("cancel");
    expect(dialogTransitionFocusActionId({
      nextDialog: dialog,
      focusWasInsideSurface: false,
      focusWasInsideDialog: false
    })).toBe("cancel");
    expect(dialogTransitionFocusActionId({
      nextDialog: { ...dialog, modal: false },
      focusWasInsideSurface: false,
      focusWasInsideDialog: false
    })).toBeUndefined();
    expect(dialogTransitionFocusActionId({
      previousDialog: dialog,
      focusWasInsideSurface: true,
      focusWasInsideDialog: true
    })).toBe("reset");
    expect(dialogTransitionFocusActionId({
      previousDialog: dialog,
      focusWasInsideSurface: false,
      focusWasInsideDialog: false
    })).toBeUndefined();
  });

  it("contains forward and backward Tab order among enabled dialog actions", () => {
    const actions = ["cancel", "confirm"];

    expect(dialogTabActionId(actions, undefined, false)).toBe("cancel");
    expect(dialogTabActionId(actions, undefined, true)).toBe("confirm");
    expect(dialogTabActionId(actions, "cancel", false)).toBe("confirm");
    expect(dialogTabActionId(actions, "confirm", false)).toBe("cancel");
    expect(dialogTabActionId(actions, "cancel", true)).toBe("confirm");
    expect(dialogTabActionId([], "cancel", false)).toBeUndefined();
  });
});
