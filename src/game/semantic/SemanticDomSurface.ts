import type {
  SemanticAlertDialog,
  SemanticAnnouncement,
  SemanticContentGroup,
  SemanticControl,
  SemanticOrderedMapping,
  SemanticSnapshot
} from "./SemanticTypes";
import type { SemanticSurfacePort } from "./SemanticCoordinator";
import {
  dialogTabActionId,
  dialogTransitionFocusActionId
} from "./SemanticDialogFocusSystem";

const ACTION_ID_ATTRIBUTE = "data-semantic-action-id";
const ACTION_TOKEN_ATTRIBUTE = "data-semantic-render-token";

type SemanticActionElement = HTMLButtonElement | HTMLInputElement;

export function semanticQaVisibleFromSearch(search: string | undefined): boolean {
  return new URLSearchParams(search ?? "").get("semanticUi") === "visible";
}

export function semanticQaFocusActionId(scene: SemanticSnapshot["scene"]): string {
  if (scene === "menu") {
    return "token-log";
  }
  return scene === "token-log" || scene === "settings" ? "back" : "menu";
}

function resolveParent(parent: string | HTMLElement): HTMLElement {
  if (typeof parent !== "string") {
    return parent;
  }

  const parentId = parent.startsWith("#") ? parent.slice(1) : parent;
  const element = document.getElementById(parentId) ?? document.querySelector<HTMLElement>(parent);
  if (element === null) {
    throw new Error(`Cannot create semantic runtime: parent "${parent}" was not found.`);
  }
  return element;
}

function setOptionalText(element: HTMLElement, text: string | undefined): void {
  element.hidden = text === undefined;
  if (element.textContent !== (text ?? "")) {
    element.textContent = text ?? "";
  }
}

export class SemanticDomSurface implements SemanticSurfacePort {
  private readonly host: HTMLElement;
  private readonly root: HTMLElement;
  private readonly content: HTMLDivElement;
  private readonly heading: HTMLHeadingElement;
  private readonly summary: HTMLParagraphElement;
  private readonly details: HTMLUListElement;
  private readonly groups: HTMLUListElement;
  private readonly controls: HTMLDivElement;
  private readonly actions: HTMLDivElement;
  private readonly dialogHost: HTMLDivElement;
  private readonly politeRegion: HTMLDivElement;
  private readonly assertiveRegion: HTMLDivElement;
  private readonly buttons = new Map<string, HTMLButtonElement>();
  private readonly actionElements = new Map<string, SemanticActionElement>();
  private readonly modalSiblingState = new Map<HTMLElement, {
    inert: boolean;
    ariaHidden: string | null;
  }>();
  private actionHandler?: (renderToken: number, actionId: string, checked?: boolean) => void;
  private currentRenderToken?: number;
  private renderedDialog?: SemanticAlertDialog;
  private escapeDispatchToken?: number;

  constructor(parent: string | HTMLElement) {
    const host = resolveParent(parent);
    this.host = host;
    const ownerDocument = host.ownerDocument;
    if (host.querySelector('[data-semantic-surface="true"]') !== null) {
      throw new Error("Cannot create semantic runtime: the parent already contains a semantic surface.");
    }

    this.root = ownerDocument.createElement("section");
    this.root.className = "semantic-surface";
    this.root.dataset.semanticSurface = "true";
    this.root.setAttribute("role", "region");
    if (semanticQaVisibleFromSearch(ownerDocument.defaultView?.location.search)) {
      this.root.dataset.semanticQaVisible = "true";
    }

    this.content = ownerDocument.createElement("div");
    this.content.className = "semantic-surface__content";

    this.heading = ownerDocument.createElement("h1");
    this.heading.className = "semantic-surface__heading";
    this.heading.id = "tokenizer-training-semantic-heading";
    this.heading.tabIndex = -1;
    this.root.setAttribute("aria-labelledby", this.heading.id);

    this.summary = ownerDocument.createElement("p");
    this.summary.className = "semantic-surface__summary";

    this.details = ownerDocument.createElement("ul");
    this.details.className = "semantic-surface__details";

    this.groups = ownerDocument.createElement("ul");
    this.groups.className = "semantic-surface__groups";

    this.controls = ownerDocument.createElement("div");
    this.controls.className = "semantic-surface__controls";

    this.actions = ownerDocument.createElement("div");
    this.actions.className = "semantic-surface__actions";

    this.dialogHost = ownerDocument.createElement("div");
    this.dialogHost.className = "semantic-surface__dialog-host";

    this.politeRegion = this.createLiveRegion(ownerDocument, "polite");
    this.assertiveRegion = this.createLiveRegion(ownerDocument, "assertive");

    this.content.append(
      this.heading,
      this.summary,
      this.details,
      this.groups,
      this.controls,
      this.actions
    );
    this.root.append(
      this.content,
      this.dialogHost,
      this.politeRegion,
      this.assertiveRegion
    );
    this.root.addEventListener("click", this.handleClick);
    this.root.addEventListener("change", this.handleChange);
    ownerDocument.addEventListener("keydown", this.handleKeyDown, true);
    host.append(this.root);
    this.clear();
  }

  setActionHandler(handler: (renderToken: number, actionId: string, checked?: boolean) => void): () => void {
    this.actionHandler = handler;
    return () => {
      if (this.actionHandler === handler) {
        this.actionHandler = undefined;
      }
    };
  }

  render(snapshot: SemanticSnapshot, renderToken: number, announcement?: SemanticAnnouncement): void {
    const activeElement = this.root.ownerDocument.activeElement;
    const previousDialog = this.renderedDialog;
    const focusWasInsideSurface = activeElement !== null && this.root.contains(activeElement);
    const focusWasInsideDialog = activeElement !== null && this.dialogHost.contains(activeElement);

    if (this.currentRenderToken !== renderToken) {
      this.escapeDispatchToken = undefined;
    }
    this.currentRenderToken = renderToken;
    this.buttons.clear();
    this.actionElements.clear();
    this.root.dataset.semanticScene = snapshot.scene;
    this.heading.hidden = false;
    if (this.heading.textContent !== snapshot.heading) {
      this.heading.textContent = snapshot.heading;
    }
    setOptionalText(this.summary, snapshot.summary);
    this.renderDetails(snapshot.details ?? []);
    this.renderGroups(snapshot.groups ?? []);
    this.renderControls(snapshot.controls ?? [], renderToken);
    this.renderActions(snapshot.actions, renderToken);
    this.renderDialog(snapshot.dialog, renderToken);
    this.setDialogBackground(snapshot.dialog !== undefined, snapshot.dialog?.modal === true);
    this.renderedDialog = snapshot.dialog;

    const transitionFocusActionId = dialogTransitionFocusActionId({
      previousDialog,
      nextDialog: snapshot.dialog,
      focusWasInsideSurface,
      focusWasInsideDialog
    });
    if (transitionFocusActionId !== undefined) {
      this.focusAction(transitionFocusActionId);
    } else if (
      snapshot.dialog === undefined &&
      previousDialog === undefined &&
      this.root.dataset.semanticQaVisible === "true"
    ) {
      this.focusAction(semanticQaFocusActionId(snapshot.scene));
    }
    if (announcement !== undefined) {
      this.renderAnnouncement(announcement);
    }
  }

  clear(): void {
    delete this.root.dataset.semanticScene;
    this.heading.hidden = true;
    this.heading.textContent = "";
    setOptionalText(this.summary, undefined);
    this.details.hidden = true;
    this.details.replaceChildren();
    this.groups.hidden = true;
    this.groups.replaceChildren();
    this.controls.hidden = true;
    this.controls.replaceChildren();
    this.actions.hidden = true;
    this.actions.replaceChildren();
    this.dialogHost.hidden = true;
    this.dialogHost.replaceChildren();
    this.setDialogBackground(false, false);
    this.buttons.clear();
    this.actionElements.clear();
    this.currentRenderToken = undefined;
    this.renderedDialog = undefined;
    this.escapeDispatchToken = undefined;
    this.politeRegion.replaceChildren();
    this.assertiveRegion.replaceChildren();
    delete this.politeRegion.dataset.announcementId;
    delete this.assertiveRegion.dataset.announcementId;
  }

  focusedActionId(): string | undefined {
    const activeElement = this.root.ownerDocument.activeElement;
    for (const [actionId, element] of this.actionElements) {
      if (element === activeElement) {
        return actionId;
      }
    }
    return undefined;
  }

  focusHeading(): void {
    if (this.renderedDialog !== undefined) {
      this.focusAction(this.renderedDialog.initialFocusActionId);
      return;
    }
    if (!this.heading.hidden) {
      this.heading.focus({ preventScroll: true });
    }
  }

  focusAction(actionId: string): void {
    const element = this.actionElements.get(actionId);
    if (element !== undefined && !element.disabled) {
      element.focus({ preventScroll: true });
    }
  }

  ownsTarget(target: EventTarget | null): boolean {
    const NodeConstructor = this.root.ownerDocument.defaultView?.Node;
    return NodeConstructor !== undefined && target instanceof NodeConstructor && this.root.contains(target);
  }

  destroy(): void {
    this.actionHandler = undefined;
    this.setDialogBackground(false, false);
    this.root.removeEventListener("click", this.handleClick);
    this.root.removeEventListener("change", this.handleChange);
    this.root.ownerDocument.removeEventListener("keydown", this.handleKeyDown, true);
    this.root.remove();
    this.buttons.clear();
    this.actionElements.clear();
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const ElementConstructor = this.root.ownerDocument.defaultView?.Element;
    if (ElementConstructor === undefined || !(event.target instanceof ElementConstructor)) {
      return;
    }
    const button = event.target.closest<HTMLButtonElement>(`button[${ACTION_ID_ATTRIBUTE}]`);
    if (button === null || !this.root.contains(button) || button.disabled) {
      return;
    }

    this.dispatchActionElement(button);
  };

  private readonly handleChange = (event: Event): void => {
    const InputConstructor = this.root.ownerDocument.defaultView?.HTMLInputElement;
    if (InputConstructor === undefined || !(event.target instanceof InputConstructor)) {
      return;
    }
    const input = event.target;
    if (
      input.type !== "checkbox" ||
      !input.hasAttribute(ACTION_ID_ATTRIBUTE) ||
      !this.root.contains(input) ||
      input.disabled
    ) {
      return;
    }

    this.dispatchActionElement(input);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const dialog = this.renderedDialog;
    const renderToken = this.currentRenderToken;
    if (dialog === undefined || !dialog.modal || renderToken === undefined) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (this.escapeDispatchToken === renderToken) {
        return;
      }
      const dismissAction = this.actionElements.get(dialog.dismissActionId);
      if (dismissAction !== undefined && !dismissAction.disabled) {
        this.escapeDispatchToken = renderToken;
        this.dispatchActionElement(dismissAction);
      }
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const enabledActionIds = dialog.actions
      .filter((action) => {
        const element = this.actionElements.get(action.id);
        return !action.disabled && element?.tagName === "BUTTON" && !element.disabled;
      })
      .map((action) => action.id);
    const nextActionId = dialogTabActionId(enabledActionIds, this.focusedActionId(), event.shiftKey);
    if (nextActionId !== undefined) {
      this.focusAction(nextActionId);
    }
  };

  private dispatchActionElement(element: SemanticActionElement): void {
    const actionId = element.getAttribute(ACTION_ID_ATTRIBUTE);
    const elementRenderToken = Number(element.getAttribute(ACTION_TOKEN_ATTRIBUTE));
    const currentRenderToken = this.currentRenderToken;
    if (
      actionId === null ||
      currentRenderToken === undefined ||
      elementRenderToken !== currentRenderToken ||
      this.actionElements.get(actionId) !== element
    ) {
      return;
    }

    const InputConstructor = this.root.ownerDocument.defaultView?.HTMLInputElement;
    const checked = InputConstructor !== undefined && element instanceof InputConstructor
      ? element.checked
      : undefined;
    this.actionHandler?.(currentRenderToken, actionId, checked);
  }

  private createLiveRegion(ownerDocument: Document, politeness: "polite" | "assertive"): HTMLDivElement {
    const region = ownerDocument.createElement("div");
    region.className = "semantic-surface__live";
    region.setAttribute("role", politeness === "assertive" ? "alert" : "status");
    region.setAttribute("aria-live", politeness);
    region.setAttribute("aria-atomic", "true");
    return region;
  }

  private renderDetails(details: readonly string[]): void {
    while (this.details.children.length > details.length) {
      this.details.lastElementChild?.remove();
    }
    details.forEach((detail, index) => {
      const item =
        (this.details.children.item(index) as HTMLLIElement | null) ??
        this.details.appendChild(this.root.ownerDocument.createElement("li"));
      if (item.textContent !== detail) {
        item.textContent = detail;
      }
    });
    this.details.hidden = details.length === 0;
  }

  private renderGroups(groups: readonly SemanticContentGroup[]): void {
    const groupItems = groups.map((group) => this.createGroupItem(group));
    this.groups.replaceChildren(...groupItems);
    this.groups.hidden = groups.length === 0;
  }

  private createGroupItem(group: SemanticContentGroup): HTMLLIElement {
    const ownerDocument = this.root.ownerDocument;
    const item = ownerDocument.createElement("li");
    item.className = "semantic-surface__group";
    item.dataset.semanticGroupId = group.id;

    const heading = ownerDocument.createElement("h2");
    heading.className = "semantic-surface__group-heading";
    heading.textContent = group.heading;

    const source = ownerDocument.createElement("p");
    source.className = "semantic-surface__source";
    const sourceText = ownerDocument.createElement("bdi");
    sourceText.setAttribute("dir", "auto");
    sourceText.textContent = group.sourceText;
    source.append(sourceText);

    item.append(heading, source);
    if (group.metadata !== undefined) {
      const metadata = ownerDocument.createElement("p");
      metadata.className = "semantic-surface__metadata";
      metadata.textContent = group.metadata;
      item.append(metadata);
    }

    const mappingsHeading = ownerDocument.createElement("h3");
    mappingsHeading.className = "semantic-surface__mappings-heading";
    mappingsHeading.textContent = "Token mappings";
    const mappings = ownerDocument.createElement("ol");
    mappings.className = "semantic-surface__mappings";
    mappings.append(...group.mappings.map((mapping) => this.createMappingItem(mapping)));
    item.append(mappingsHeading, mappings);
    return item;
  }

  private createMappingItem(mapping: SemanticOrderedMapping): HTMLLIElement {
    const ownerDocument = this.root.ownerDocument;
    const item = ownerDocument.createElement("li");
    item.className = "semantic-surface__mapping";
    item.dataset.semanticMappingId = mapping.id;

    const token = ownerDocument.createElement("p");
    token.className = "semantic-surface__mapping-token";
    const position = ownerDocument.createElement("span");
    position.className = "semantic-surface__position";
    position.textContent = `${mapping.positionLabel}: token text`;
    const tokenCode = ownerDocument.createElement("code");
    const displayText = ownerDocument.createElement("bdi");
    displayText.setAttribute("dir", "auto");
    displayText.textContent = mapping.displayText;
    tokenCode.append(displayText);
    token.append(position, ownerDocument.createTextNode(" "), tokenCode);
    item.append(token);

    if (mapping.description !== undefined) {
      const description = ownerDocument.createElement("p");
      description.className = "semantic-surface__mapping-description";
      description.textContent = mapping.description;
      item.append(description);
    }

    const value = ownerDocument.createElement("p");
    value.className = "semantic-surface__mapping-value";
    const valueLabel = ownerDocument.createElement("span");
    valueLabel.textContent = `${mapping.valueLabel}:`;
    const valueCode = ownerDocument.createElement("code");
    valueCode.textContent = String(mapping.value);
    value.append(valueLabel, ownerDocument.createTextNode(" "), valueCode);
    item.append(value);
    return item;
  }

  private renderControls(controls: readonly SemanticControl[], renderToken: number): void {
    const ownerDocument = this.root.ownerDocument;
    const rows = controls.map((control) => {
      const row = ownerDocument.createElement("div");
      row.className = `semantic-surface__control semantic-surface__control--${control.kind}`;
      row.dataset.semanticControlId = control.id;

      if (control.kind === "status") {
        const label = ownerDocument.createElement("span");
        label.className = "semantic-surface__control-label";
        label.textContent = control.label;
        const value = ownerDocument.createElement("span");
        value.className = "semantic-surface__control-value";
        value.textContent = String(control.value);
        row.append(label, value);
        return row;
      }

      if (control.kind === "switch") {
        const input = ownerDocument.createElement("input");
        input.type = "checkbox";
        input.id = `tokenizer-training-semantic-${safeDomId(control.id)}`;
        input.setAttribute("role", "switch");
        input.checked = control.checked;
        input.disabled = Boolean(control.disabled);
        this.assignActionAttributes(input, control.id, renderToken);

        const label = ownerDocument.createElement("label");
        label.htmlFor = input.id;
        label.textContent = control.label;
        row.append(label, input);
        this.actionElements.set(control.id, input);
        return row;
      }

      const button = this.createActionButton(control, renderToken);
      row.append(button);
      this.buttons.set(control.id, button);
      this.actionElements.set(control.id, button);
      return row;
    });

    this.controls.replaceChildren(...rows);
    this.controls.hidden = rows.length === 0;
  }

  private renderDialog(dialog: SemanticAlertDialog | undefined, renderToken: number): void {
    if (dialog === undefined) {
      this.dialogHost.hidden = true;
      this.dialogHost.replaceChildren();
      return;
    }

    const ownerDocument = this.root.ownerDocument;
    const panel = ownerDocument.createElement("div");
    const title = ownerDocument.createElement("h2");
    const message = ownerDocument.createElement("p");
    const actions = ownerDocument.createElement("div");
    const titleId = `tokenizer-training-${safeDomId(dialog.id)}-title`;
    const messageId = `tokenizer-training-${safeDomId(dialog.id)}-message`;

    panel.className = "semantic-surface__dialog";
    panel.dataset.semanticDialogId = dialog.id;
    panel.setAttribute("role", "alertdialog");
    if (dialog.modal) {
      panel.setAttribute("aria-modal", "true");
    }
    panel.setAttribute("aria-labelledby", titleId);
    panel.setAttribute("aria-describedby", messageId);

    title.className = "semantic-surface__dialog-title";
    title.id = titleId;
    title.textContent = dialog.title;
    message.className = "semantic-surface__dialog-message";
    message.id = messageId;
    message.textContent = dialog.message;
    actions.className = "semantic-surface__dialog-actions";

    for (const action of dialog.actions) {
      const button = this.createActionButton(action, renderToken);
      actions.append(button);
      this.buttons.set(action.id, button);
      this.actionElements.set(action.id, button);
    }

    panel.append(title, message, actions);
    this.dialogHost.replaceChildren(panel);
    this.dialogHost.hidden = false;
  }

  private setDialogBackground(dialogOpen: boolean, modal: boolean): void {
    if (dialogOpen) {
      this.content.setAttribute("inert", "");
      this.content.setAttribute("aria-hidden", "true");
    } else {
      this.content.removeAttribute("inert");
      this.content.removeAttribute("aria-hidden");
    }

    if (modal) {
      const HTMLElementConstructor = this.root.ownerDocument.defaultView?.HTMLElement;
      if (HTMLElementConstructor === undefined) {
        return;
      }
      for (const sibling of Array.from(this.host.children)) {
        if (sibling === this.root || !(sibling instanceof HTMLElementConstructor)) {
          continue;
        }
        if (!this.modalSiblingState.has(sibling)) {
          this.modalSiblingState.set(sibling, {
            inert: sibling.hasAttribute("inert"),
            ariaHidden: sibling.getAttribute("aria-hidden")
          });
        }
        sibling.setAttribute("inert", "");
        sibling.setAttribute("aria-hidden", "true");
      }
      return;
    }

    for (const [sibling, previous] of this.modalSiblingState) {
      if (!previous.inert) {
        sibling.removeAttribute("inert");
      }
      if (previous.ariaHidden === null) {
        sibling.removeAttribute("aria-hidden");
      } else {
        sibling.setAttribute("aria-hidden", previous.ariaHidden);
      }
    }
    this.modalSiblingState.clear();
  }

  private createActionButton(
    action: { id: string; label: string; disabled?: boolean; destructive?: boolean },
    renderToken: number
  ): HTMLButtonElement {
    const button = this.root.ownerDocument.createElement("button");
    button.type = "button";
    button.disabled = Boolean(action.disabled);
    button.textContent = action.label;
    this.assignActionAttributes(button, action.id, renderToken);
    if (action.destructive) {
      button.dataset.semanticDestructive = "true";
    }
    return button;
  }

  private assignActionAttributes(
    element: SemanticActionElement,
    actionId: string,
    renderToken: number
  ): void {
    element.setAttribute(ACTION_ID_ATTRIBUTE, actionId);
    element.setAttribute(ACTION_TOKEN_ATTRIBUTE, String(renderToken));
  }

  private renderActions(actions: SemanticSnapshot["actions"], renderToken: number): void {
    const nextButtons = new Map<string, HTMLButtonElement>();
    const orderedButtons = actions.map((action) => {
      const button = this.buttons.get(action.id) ?? this.root.ownerDocument.createElement("button");
      button.type = "button";
      button.setAttribute(ACTION_ID_ATTRIBUTE, action.id);
      button.setAttribute(ACTION_TOKEN_ATTRIBUTE, String(renderToken));
      button.disabled = Boolean(action.disabled);
      if (button.textContent !== action.label) {
        button.textContent = action.label;
      }
      nextButtons.set(action.id, button);
      this.actionElements.set(action.id, button);
      return button;
    });

    orderedButtons.forEach((button, index) => {
      const currentButton = this.actions.children.item(index);
      if (currentButton !== button) {
        this.actions.insertBefore(button, currentButton);
      }
    });
    while (this.actions.children.length > orderedButtons.length) {
      this.actions.lastElementChild?.remove();
    }

    nextButtons.forEach((button, actionId) => this.buttons.set(actionId, button));
    this.actions.hidden = actions.length === 0;
  }

  private renderAnnouncement(announcement: SemanticAnnouncement): void {
    const region = announcement.politeness === "assertive" ? this.assertiveRegion : this.politeRegion;
    const otherRegion = announcement.politeness === "assertive" ? this.politeRegion : this.assertiveRegion;
    otherRegion.replaceChildren();
    delete otherRegion.dataset.announcementId;
    region.dataset.announcementId = announcement.id;
    region.replaceChildren(this.root.ownerDocument.createTextNode(announcement.text));
  }
}

function safeDomId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}
