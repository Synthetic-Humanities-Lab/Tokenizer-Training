import type {
  SemanticAction,
  SemanticAlertDialog,
  SemanticAnnouncement,
  SemanticContentGroup,
  SemanticControl,
  SemanticLease,
  SemanticOrderedMapping,
  SemanticRuntime,
  SemanticSceneId,
  SemanticSnapshot
} from "./SemanticTypes";

export interface SemanticSurfacePort {
  setActionHandler(handler: (renderToken: number, actionId: string, checked?: boolean) => void): () => void;
  render(snapshot: SemanticSnapshot, renderToken: number, announcement?: SemanticAnnouncement): void;
  clear(): void;
  focusedActionId(): string | undefined;
  focusHeading(): void;
  focusAction(actionId: string): void;
  ownsTarget(target: EventTarget | null): boolean;
  destroy(): void;
}

interface ActiveLease {
  epoch: number;
  scene: SemanticSceneId;
  handler: (actionId: string, checked?: boolean) => void;
  snapshot?: SemanticSnapshot;
  announcementKey?: string;
  renderToken?: number;
  consumedActions: Set<string>;
  actions: ReadonlyMap<string, boolean>;
}

const inertLease: SemanticLease = Object.freeze({
  publish: () => undefined,
  focusHeading: () => undefined,
  focusAction: () => undefined,
  dispose: () => undefined
});

function copyGroups(groups: readonly SemanticContentGroup[] | undefined): SemanticContentGroup[] | undefined {
  return groups?.map((group) => ({
    id: group.id,
    heading: group.heading,
    sourceText: group.sourceText,
    metadata: group.metadata,
    mappings: group.mappings.map((mapping) => ({ ...mapping }))
  }));
}

function copyControls(controls: readonly SemanticControl[] | undefined): SemanticControl[] | undefined {
  return controls?.map((control) => ({ ...control }));
}

function copyDialog(dialog: SemanticAlertDialog | undefined): SemanticAlertDialog | undefined {
  return dialog === undefined
    ? undefined
    : {
        ...dialog,
        actions: dialog.actions.map((action) => ({ ...action }))
      };
}

function copySnapshot(snapshot: SemanticSnapshot): SemanticSnapshot {
  return {
    scene: snapshot.scene,
    heading: snapshot.heading,
    summary: snapshot.summary,
    details: snapshot.details ? [...snapshot.details] : undefined,
    groups: copyGroups(snapshot.groups),
    controls: copyControls(snapshot.controls),
    actions: snapshot.actions.map((action) => ({ ...action })),
    dialog: copyDialog(snapshot.dialog),
    announcement: snapshot.announcement ? { ...snapshot.announcement } : undefined
  };
}

function announcementsEqual(
  left: SemanticAnnouncement | undefined,
  right: SemanticAnnouncement | undefined
): boolean {
  return (
    left === right ||
    (left !== undefined &&
      right !== undefined &&
      left.id === right.id &&
      left.text === right.text &&
      left.politeness === right.politeness)
  );
}

function stringListsEqual(left: readonly string[] | undefined, right: readonly string[] | undefined): boolean {
  if (left === right) {
    return true;
  }
  if (left === undefined || right === undefined || left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}

function mappingsEqual(left: SemanticOrderedMapping, right: SemanticOrderedMapping): boolean {
  return (
    left.id === right.id &&
    left.positionLabel === right.positionLabel &&
    left.rawText === right.rawText &&
    left.displayText === right.displayText &&
    left.description === right.description &&
    left.valueLabel === right.valueLabel &&
    left.value === right.value
  );
}

function groupsEqual(
  left: readonly SemanticContentGroup[] | undefined,
  right: readonly SemanticContentGroup[] | undefined
): boolean {
  if (left === right) {
    return true;
  }
  if (left === undefined || right === undefined || left.length !== right.length) {
    return false;
  }
  return left.every((group, groupIndex) => {
    const candidate = right[groupIndex];
    return (
      group.id === candidate.id &&
      group.heading === candidate.heading &&
      group.sourceText === candidate.sourceText &&
      group.metadata === candidate.metadata &&
      group.mappings.length === candidate.mappings.length &&
      group.mappings.every((mapping, mappingIndex) =>
        mappingsEqual(mapping, candidate.mappings[mappingIndex])
      )
    );
  });
}

function actionsEqual(left: readonly SemanticAction[], right: readonly SemanticAction[]): boolean {
  return (
    left.length === right.length &&
    left.every((action, index) => {
      const candidate = right[index];
      return (
        action.id === candidate.id &&
        action.label === candidate.label &&
        Boolean(action.disabled) === Boolean(candidate.disabled) &&
        Boolean(action.destructive) === Boolean(candidate.destructive)
      );
    })
  );
}

function controlsEqual(
  left: readonly SemanticControl[] | undefined,
  right: readonly SemanticControl[] | undefined
): boolean {
  if (left === right) {
    return true;
  }
  if (left === undefined || right === undefined || left.length !== right.length) {
    return false;
  }
  return left.every((control, index) => {
    const candidate = right[index];
    if (control.kind !== candidate.kind || control.id !== candidate.id || control.label !== candidate.label) {
      return false;
    }
    if (control.kind === "status") {
      return candidate.kind === "status" && control.value === candidate.value;
    }
    if (control.kind === "switch") {
      return (
        candidate.kind === "switch" &&
        control.checked === candidate.checked &&
        Boolean(control.disabled) === Boolean(candidate.disabled)
      );
    }
    return (
      candidate.kind === "button" &&
      Boolean(control.disabled) === Boolean(candidate.disabled) &&
      Boolean(control.destructive) === Boolean(candidate.destructive)
    );
  });
}

function dialogsEqual(left: SemanticAlertDialog | undefined, right: SemanticAlertDialog | undefined): boolean {
  return (
    left === right ||
    (left !== undefined &&
      right !== undefined &&
      left.id === right.id &&
      left.title === right.title &&
      left.message === right.message &&
      left.modal === right.modal &&
      left.initialFocusActionId === right.initialFocusActionId &&
      left.dismissActionId === right.dismissActionId &&
      left.returnFocusActionId === right.returnFocusActionId &&
      actionsEqual(left.actions, right.actions))
  );
}

function snapshotsEqual(left: SemanticSnapshot | undefined, right: SemanticSnapshot): boolean {
  if (left === undefined) {
    return false;
  }
  if (
    left.scene !== right.scene ||
    left.heading !== right.heading ||
    left.summary !== right.summary ||
    !stringListsEqual(left.details, right.details) ||
    !groupsEqual(left.groups, right.groups) ||
    !controlsEqual(left.controls, right.controls) ||
    !actionsEqual(left.actions, right.actions) ||
    !dialogsEqual(left.dialog, right.dialog) ||
    !announcementsEqual(left.announcement, right.announcement)
  ) {
    return false;
  }
  return true;
}

function announcementKey(announcement: SemanticAnnouncement): string {
  return JSON.stringify([announcement.id, announcement.text, announcement.politeness]);
}

function actionStates(snapshot: SemanticSnapshot): ReadonlyMap<string, boolean> {
  const states = new Map<string, boolean>();
  if (snapshot.dialog !== undefined) {
    snapshot.dialog.actions.forEach((action) => states.set(action.id, Boolean(action.disabled)));
    return states;
  }

  snapshot.actions.forEach((action) => states.set(action.id, Boolean(action.disabled)));
  snapshot.controls?.forEach((control) => {
    if (control.kind !== "status") {
      states.set(control.id, Boolean(control.disabled));
    }
  });
  return states;
}

export class SemanticRuntimeCoordinator implements SemanticRuntime {
  private active?: ActiveLease;
  private destroyed = false;
  private nextEpoch = 0;
  private nextRenderToken = 0;
  private readonly stopActionHandler: () => void;

  constructor(private readonly port: SemanticSurfacePort) {
    this.stopActionHandler = port.setActionHandler((renderToken, actionId, checked) => {
      this.handleAction(renderToken, actionId, checked);
    });
  }

  mount(scene: SemanticSceneId, handler: (actionId: string, checked?: boolean) => void): SemanticLease {
    if (this.destroyed) {
      return inertLease;
    }

    const epoch = ++this.nextEpoch;
    this.active = {
      epoch,
      scene,
      handler,
      consumedActions: new Set(),
      actions: new Map()
    };
    this.port.clear();

    return {
      publish: (snapshot) => {
        this.publish(epoch, snapshot);
      },
      focusHeading: () => {
        this.focusHeading(epoch);
      },
      focusAction: (actionId) => {
        this.focusAction(epoch, actionId);
      },
      dispose: () => {
        this.dispose(epoch);
      }
    };
  }

  ownsKeyboardEvent(event: KeyboardEvent): boolean {
    return !this.destroyed && this.port.ownsTarget(event.target);
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.active = undefined;
    this.stopActionHandler();
    this.port.destroy();
  }

  private publish(epoch: number, snapshot: SemanticSnapshot): void {
    const active = this.active;
    if (this.destroyed || active?.epoch !== epoch || snapshot.scene !== active.scene) {
      return;
    }

    const nextSnapshot = copySnapshot(snapshot);
    if (snapshotsEqual(active.snapshot, nextSnapshot)) {
      return;
    }

    const focusedActionId = this.port.focusedActionId();
    const renderToken = ++this.nextRenderToken;
    const announcement = nextSnapshot.announcement;
    const nextAnnouncementKey = announcement ? announcementKey(announcement) : undefined;
    const shouldAnnounce = announcement !== undefined && nextAnnouncementKey !== active.announcementKey;

    active.snapshot = nextSnapshot;
    active.renderToken = renderToken;
    active.consumedActions.clear();
    active.actions = actionStates(nextSnapshot);
    active.announcementKey = nextAnnouncementKey;

    this.port.render(nextSnapshot, renderToken, shouldAnnounce ? announcement : undefined);

    if (focusedActionId !== undefined && active.actions.get(focusedActionId) === false) {
      this.port.focusAction(focusedActionId);
    }
  }

  private dispose(epoch: number): void {
    if (this.destroyed || this.active?.epoch !== epoch) {
      return;
    }
    this.active = undefined;
    this.port.clear();
  }

  private focusHeading(epoch: number): void {
    const active = this.active;
    if (this.destroyed || active?.epoch !== epoch || active.snapshot === undefined) {
      return;
    }
    this.port.focusHeading();
  }

  private focusAction(epoch: number, actionId: string): void {
    const active = this.active;
    if (
      this.destroyed ||
      active?.epoch !== epoch ||
      active.snapshot === undefined ||
      active.actions.get(actionId) !== false
    ) {
      return;
    }
    this.port.focusAction(actionId);
  }

  private handleAction(renderToken: number, actionId: string, checked?: boolean): void {
    const active = this.active;
    if (
      this.destroyed ||
      active === undefined ||
      active.renderToken !== renderToken ||
      active.consumedActions.has(actionId) ||
      active.actions.get(actionId) !== false
    ) {
      return;
    }

    active.consumedActions.add(actionId);
    active.handler(actionId, checked);
  }
}
