export type SemanticSceneId = "menu" | "results" | "settings" | "token-log" | "tutorial-intake" | "tutorial-complete";

export interface SemanticAction {
  id: string;
  label: string;
  disabled?: boolean;
  destructive?: boolean;
}

export interface SemanticAnnouncement {
  id: string;
  text: string;
  politeness: "polite" | "assertive";
}

export interface SemanticButtonControl extends SemanticAction {
  kind: "button";
}

export interface SemanticSwitchControl extends SemanticAction {
  kind: "switch";
  checked: boolean;
}

export interface SemanticStatusControl {
  kind: "status";
  id: string;
  label: string;
  value: string | number;
}

export type SemanticControl = SemanticButtonControl | SemanticSwitchControl | SemanticStatusControl;

export interface SemanticAlertDialog {
  id: string;
  title: string;
  message: string;
  modal: boolean;
  actions: readonly SemanticButtonControl[];
  initialFocusActionId: string;
  dismissActionId: string;
  returnFocusActionId: string;
}

export interface SemanticOrderedMapping {
  id: string;
  positionLabel: string;
  rawText: string;
  displayText: string;
  description?: string;
  valueLabel: string;
  value: string | number;
}

export interface SemanticContentGroup {
  id: string;
  heading: string;
  sourceText: string;
  metadata?: string;
  mappings: readonly SemanticOrderedMapping[];
}

export interface SemanticSnapshot {
  scene: SemanticSceneId;
  heading: string;
  summary?: string;
  details?: readonly string[];
  groups?: readonly SemanticContentGroup[];
  controls?: readonly SemanticControl[];
  actions: readonly SemanticAction[];
  dialog?: SemanticAlertDialog;
  announcement?: SemanticAnnouncement;
}

export interface SemanticLease {
  publish(snapshot: SemanticSnapshot): void;
  focusHeading(): void;
  focusAction(actionId: string): void;
  dispose(): void;
}

export interface SemanticRuntime {
  mount(scene: SemanticSceneId, handler: (actionId: string, checked?: boolean) => void): SemanticLease;
  ownsKeyboardEvent(event: KeyboardEvent): boolean;
  destroy(): void;
}
