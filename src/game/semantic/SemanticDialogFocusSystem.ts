import type { SemanticAlertDialog } from "./SemanticTypes";

type DialogFocusDescriptor = Pick<
  SemanticAlertDialog,
  "id" | "initialFocusActionId" | "modal" | "returnFocusActionId"
>;

export interface DialogFocusTransition {
  previousDialog?: DialogFocusDescriptor;
  nextDialog?: DialogFocusDescriptor;
  focusWasInsideSurface: boolean;
  focusWasInsideDialog: boolean;
}

export function dialogTransitionFocusActionId({
  previousDialog,
  nextDialog,
  focusWasInsideSurface,
  focusWasInsideDialog
}: DialogFocusTransition): string | undefined {
  if (nextDialog !== undefined && previousDialog?.id !== nextDialog.id) {
    return nextDialog.modal || focusWasInsideSurface
      ? nextDialog.initialFocusActionId
      : undefined;
  }
  if (previousDialog !== undefined && nextDialog === undefined && focusWasInsideDialog) {
    return previousDialog.returnFocusActionId;
  }
  return undefined;
}

export function dialogTabActionId(
  enabledActionIds: readonly string[],
  focusedActionId: string | undefined,
  backwards: boolean
): string | undefined {
  if (enabledActionIds.length === 0) {
    return undefined;
  }

  const currentIndex = focusedActionId === undefined ? -1 : enabledActionIds.indexOf(focusedActionId);
  if (currentIndex < 0) {
    return backwards ? enabledActionIds[enabledActionIds.length - 1] : enabledActionIds[0];
  }

  const offset = backwards ? -1 : 1;
  return enabledActionIds[(currentIndex + offset + enabledActionIds.length) % enabledActionIds.length];
}
