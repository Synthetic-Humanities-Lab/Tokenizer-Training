import { describe, expect, it } from "vitest";
import {
  SemanticRuntimeCoordinator,
  type SemanticSurfacePort
} from "../src/game/semantic/SemanticCoordinator";
import {
  readSemanticRuntime,
  SEMANTIC_RUNTIME_REGISTRY_KEY,
  type SemanticAnnouncement,
  type SemanticRuntime,
  type SemanticSnapshot
} from "../src/game/semantic/SemanticRuntime";

interface RenderCall {
  snapshot: SemanticSnapshot;
  renderToken: number;
  announcement?: SemanticAnnouncement;
}

class FakeSemanticSurface implements SemanticSurfacePort {
  readonly renders: RenderCall[] = [];
  readonly focusCalls: string[] = [];
  readonly ownedTargets = new Set<EventTarget>();
  clearCount = 0;
  destroyCount = 0;
  headingFocusCount = 0;
  focusedId?: string;
  private actionHandler?: (renderToken: number, actionId: string, checked?: boolean) => void;

  setActionHandler(handler: (renderToken: number, actionId: string, checked?: boolean) => void): () => void {
    this.actionHandler = handler;
    return () => {
      if (this.actionHandler === handler) {
        this.actionHandler = undefined;
      }
    };
  }

  render(snapshot: SemanticSnapshot, renderToken: number, announcement?: SemanticAnnouncement): void {
    this.renders.push({ snapshot, renderToken, announcement });
    this.focusedId = undefined;
  }

  clear(): void {
    this.clearCount += 1;
    this.focusedId = undefined;
  }

  focusedActionId(): string | undefined {
    return this.focusedId;
  }

  focusHeading(): void {
    this.headingFocusCount += 1;
    this.focusedId = undefined;
  }

  focusAction(actionId: string): void {
    this.focusCalls.push(actionId);
    this.focusedId = actionId;
  }

  ownsTarget(target: EventTarget | null): boolean {
    return target !== null && this.ownedTargets.has(target);
  }

  destroy(): void {
    this.destroyCount += 1;
    this.focusedId = undefined;
  }

  activate(renderToken: number, actionId: string, checked?: boolean): void {
    this.actionHandler?.(renderToken, actionId, checked);
  }
}

function menuSnapshot(overrides: Partial<SemanticSnapshot> = {}): SemanticSnapshot {
  return {
    scene: "menu",
    heading: "Tokenizer Training",
    summary: "Welcome to WienerWorks",
    actions: [
      { id: "tutorial", label: "Tutorial" },
      { id: "training", label: "Training" }
    ],
    ...overrides
  };
}

function resultsSnapshot(overrides: Partial<SemanticSnapshot> = {}): SemanticSnapshot {
  return {
    scene: "results",
    heading: "Token Credits Depleted",
    summary: "Training access revoked.",
    details: ["RUN: 12 rounds", "RANK: BPE Adjacent"],
    actions: [
      { id: "token-log", label: "Review Token Log" },
      { id: "menu", label: "Return to Menu" }
    ],
    ...overrides
  };
}

function tokenLogSnapshot(overrides: Partial<SemanticSnapshot> = {}): SemanticSnapshot {
  return {
    scene: "token-log",
    heading: "Token Log",
    summary: "Recent tokenizer records.",
    groups: [
      {
        id: "fixture-greeting",
        heading: "Recent sentence 1",
        sourceText: "Hello world",
        metadata: "cl100k_base · 2 tokens",
        mappings: [
          {
            id: "fixture-greeting-token-1",
            positionLabel: "Token 1",
            rawText: "Hello",
            displayText: "Hello",
            valueLabel: "cl100k_base ID",
            value: 9906
          },
          {
            id: "fixture-greeting-token-2",
            positionLabel: "Token 2",
            rawText: " world",
            displayText: "\u2420world",
            description: "One leading U+0020 SPACE followed by world.",
            valueLabel: "cl100k_base ID",
            value: 1917
          }
        ]
      }
    ],
    actions: [{ id: "back", label: "Back" }],
    ...overrides
  };
}

function settingsSnapshot(overrides: Partial<SemanticSnapshot> = {}): SemanticSnapshot {
  return {
    scene: "settings",
    heading: "Settings",
    summary: "Best Rank: Regex Intern / 0 rounds",
    controls: [
      { kind: "switch", id: "sound", label: "Sound", checked: true },
      { kind: "button", id: "reset-best-rank", label: "Reset Best Rank" },
      { kind: "status", id: "reduced-motion", label: "Reduced Motion", value: "Off (System)" },
      { kind: "button", id: "back", label: "Back" }
    ],
    actions: [],
    ...overrides
  };
}

describe("SemanticRuntimeCoordinator", () => {
  it("deduplicates snapshots and announcements while restoring focus by action id", () => {
    const port = new FakeSemanticSurface();
    const runtime = new SemanticRuntimeCoordinator(port);
    const lease = runtime.mount("menu", () => undefined);
    const announcement = { id: "menu-ready", text: "Menu ready", politeness: "polite" } as const;

    lease.publish(menuSnapshot({ announcement }));
    expect(port.renders).toHaveLength(1);
    expect(port.renders[0].announcement).toEqual(announcement);

    port.focusedId = "training";
    lease.publish(menuSnapshot({ summary: "Best Rank: Boundary Clerk", announcement }));
    expect(port.renders).toHaveLength(2);
    expect(port.renders[1].announcement).toBeUndefined();
    expect(port.focusCalls).toEqual(["training"]);

    lease.publish(menuSnapshot({ summary: "Best Rank: Boundary Clerk", announcement: { ...announcement } }));
    expect(port.renders).toHaveLength(2);
    expect(port.focusCalls).toEqual(["training"]);

    port.focusedId = "training";
    lease.publish(
      menuSnapshot({
        summary: "Training unavailable",
        actions: [
          { id: "tutorial", label: "Tutorial" },
          { id: "training", label: "Training", disabled: true }
        ],
        announcement: { id: "training-offline", text: "Training unavailable", politeness: "assertive" }
      })
    );
    expect(port.renders[2].announcement?.politeness).toBe("assertive");
    expect(port.focusCalls).toEqual(["training"]);
  });

  it("deep-copies structured groups and compares every nested mapping value", () => {
    const port = new FakeSemanticSurface();
    const runtime = new SemanticRuntimeCoordinator(port);
    const lease = runtime.mount("token-log", () => undefined);
    const snapshot = tokenLogSnapshot();

    lease.publish(snapshot);
    const rendered = port.renders[0].snapshot;
    expect(rendered.groups).toEqual(snapshot.groups);
    expect(rendered.groups).not.toBe(snapshot.groups);
    expect(rendered.groups?.[0]).not.toBe(snapshot.groups?.[0]);
    expect(rendered.groups?.[0].mappings).not.toBe(snapshot.groups?.[0].mappings);
    expect(rendered.groups?.[0].mappings[0]).not.toBe(snapshot.groups?.[0].mappings[0]);

    lease.publish(tokenLogSnapshot());
    expect(port.renders).toHaveLength(1);

    lease.publish(
      tokenLogSnapshot({
        groups: [
          {
            ...snapshot.groups![0],
            mappings: snapshot.groups![0].mappings.map((mapping, index) =>
              index === 1 ? { ...mapping, value: 1918 } : mapping
            )
          }
        ]
      })
    );
    expect(port.renders).toHaveLength(2);
    expect(port.renders[1].snapshot.groups?.[0].mappings[1].value).toBe(1918);
  });

  it("copies typed controls and routes only modal actions while a dialog is active", () => {
    const port = new FakeSemanticSurface();
    const runtime = new SemanticRuntimeCoordinator(port);
    const actions: Array<[string, boolean | undefined]> = [];
    const lease = runtime.mount("settings", (actionId, checked) => actions.push([actionId, checked]));

    lease.publish(settingsSnapshot());
    const idleToken = port.renders[0].renderToken;
    expect(port.renders[0].snapshot.controls).toEqual(settingsSnapshot().controls);
    expect(port.renders[0].snapshot.controls).not.toBe(settingsSnapshot().controls);

    port.activate(idleToken, "reduced-motion");
    port.activate(idleToken, "sound", false);
    expect(actions).toEqual([["sound", false]]);

    lease.publish(settingsSnapshot({
      dialog: {
        id: "reset-best-rank-dialog",
        title: "Reset Best Rank?",
        message: "Removes the saved rank.",
        modal: true,
        actions: [
          { kind: "button", id: "reset-cancel", label: "Cancel" },
          { kind: "button", id: "reset-confirm", label: "Reset Rank", destructive: true }
        ],
        initialFocusActionId: "reset-cancel",
        dismissActionId: "reset-cancel",
        returnFocusActionId: "reset-best-rank"
      }
    }));
    const dialogToken = port.renders[1].renderToken;

    port.activate(idleToken, "back");
    port.activate(dialogToken, "sound");
    port.activate(dialogToken, "reset-best-rank");
    port.activate(dialogToken, "reset-confirm");
    port.activate(dialogToken, "reset-confirm");
    expect(actions).toEqual([
      ["sound", false],
      ["reset-confirm", undefined]
    ]);
  });

  it("reannounces the same outcome after an intervening snapshot clears the dedupe key", () => {
    const port = new FakeSemanticSurface();
    const runtime = new SemanticRuntimeCoordinator(port);
    const lease = runtime.mount("settings", () => undefined);
    const announcement = {
      id: "settings:reset:unavailable",
      text: "Reset unavailable.",
      politeness: "assertive"
    } as const;

    lease.publish(settingsSnapshot({ announcement }));
    lease.publish(settingsSnapshot({ summary: "Reset pending." }));
    lease.publish(settingsSnapshot({ summary: "Reset unavailable.", announcement }));

    expect(port.renders).toHaveLength(3);
    expect(port.renders[0].announcement).toEqual(announcement);
    expect(port.renders[1].announcement).toBeUndefined();
    expect(port.renders[2].announcement).toEqual(announcement);
  });

  it("epoch-guards heading and action focus until a current snapshot is published", () => {
    const port = new FakeSemanticSurface();
    const runtime = new SemanticRuntimeCoordinator(port);
    const staleLease = runtime.mount("menu", () => undefined);

    staleLease.focusHeading();
    staleLease.focusAction("training");
    expect(port.headingFocusCount).toBe(0);
    expect(port.focusCalls).toEqual([]);

    staleLease.publish(menuSnapshot());
    staleLease.focusHeading();
    staleLease.focusAction("training");
    staleLease.focusAction("unknown");
    expect(port.headingFocusCount).toBe(1);
    expect(port.focusCalls).toEqual(["training"]);

    const activeLease = runtime.mount("results", () => undefined);
    staleLease.focusHeading();
    staleLease.focusAction("training");
    activeLease.focusHeading();
    activeLease.focusAction("menu");
    expect(port.headingFocusCount).toBe(1);
    expect(port.focusCalls).toEqual(["training"]);

    activeLease.publish(
      resultsSnapshot({
        actions: [
          { id: "token-log", label: "Review Token Log", disabled: true },
          { id: "menu", label: "Return to Menu" }
        ]
      })
    );
    activeLease.focusHeading();
    activeLease.focusAction("copy-summary");
    activeLease.focusAction("menu");
    expect(port.headingFocusCount).toBe(2);
    expect(port.focusCalls).toEqual(["training", "menu"]);

    activeLease.dispose();
    activeLease.focusHeading();
    activeLease.focusAction("menu");
    expect(port.headingFocusCount).toBe(2);
    expect(port.focusCalls).toEqual(["training", "menu"]);

    const destroyedLease = runtime.mount("menu", () => undefined);
    destroyedLease.publish(menuSnapshot());
    runtime.destroy();
    destroyedLease.focusHeading();
    destroyedLease.focusAction("training");
    runtime.mount("menu", () => undefined).focusHeading();
    expect(port.headingFocusCount).toBe(2);
    expect(port.focusCalls).toEqual(["training", "menu"]);
  });

  it("rejects stale publishes, actions, and disposal across replacement epochs", () => {
    const port = new FakeSemanticSurface();
    const runtime = new SemanticRuntimeCoordinator(port);
    const menuActions: string[] = [];
    const resultsActions: string[] = [];
    const menuLease = runtime.mount("menu", (actionId) => menuActions.push(actionId));
    menuLease.publish(menuSnapshot({ actions: [{ id: "menu", label: "Shared action" }] }));
    const staleRenderToken = port.renders[0].renderToken;

    const resultsLease = runtime.mount("results", (actionId) => resultsActions.push(actionId));
    resultsLease.publish(resultsSnapshot({ actions: [{ id: "menu", label: "Return to Menu" }] }));
    const currentRenderToken = port.renders[1].renderToken;

    menuLease.publish(menuSnapshot({ heading: "Late menu" }));
    menuLease.dispose();
    port.activate(staleRenderToken, "menu");
    expect(port.renders).toHaveLength(2);
    expect(port.clearCount).toBe(2);
    expect(menuActions).toEqual([]);
    expect(resultsActions).toEqual([]);

    port.activate(currentRenderToken, "menu");
    port.activate(currentRenderToken, "menu");
    expect(resultsActions).toEqual(["menu"]);

    resultsLease.dispose();
    port.activate(currentRenderToken, "menu");
    expect(resultsActions).toEqual(["menu"]);
    expect(port.clearCount).toBe(3);
  });

  it("routes only enabled actions from the current rendered snapshot", () => {
    const port = new FakeSemanticSurface();
    const runtime = new SemanticRuntimeCoordinator(port);
    const actions: string[] = [];
    const lease = runtime.mount("results", (actionId) => actions.push(actionId));
    lease.publish(
      resultsSnapshot({
        actions: [
          { id: "copy-summary", label: "Copy Summary", disabled: true },
          { id: "retry", label: "Run Training Again" },
          { id: "menu", label: "Return to Menu" }
        ]
      })
    );
    const firstRenderToken = port.renders[0].renderToken;

    port.activate(firstRenderToken, "unknown");
    port.activate(firstRenderToken, "token-log");
    expect(actions).toEqual([]);

    port.activate(firstRenderToken, "menu");
    expect(actions).toEqual(["menu"]);

    port.activate(firstRenderToken, "retry");
    port.activate(firstRenderToken, "retry");
    expect(actions).toEqual(["menu", "retry"]);

    lease.publish(resultsSnapshot({ summary: "Copy state changed." }));
    const secondRenderToken = port.renders[1].renderToken;
    port.activate(firstRenderToken, "token-log");
    port.activate(secondRenderToken, "token-log");
    expect(actions).toEqual(["menu", "retry", "token-log"]);
  });

  it("ignores wrong-scene snapshots and releases ownership when destroyed", () => {
    const port = new FakeSemanticSurface();
    const runtime = new SemanticRuntimeCoordinator(port);
    const lease = runtime.mount("menu", () => undefined);
    const inside = new EventTarget();
    const outside = new EventTarget();
    port.ownedTargets.add(inside);

    lease.publish(resultsSnapshot());
    expect(port.renders).toHaveLength(0);
    expect(runtime.ownsKeyboardEvent({ target: inside } as KeyboardEvent)).toBe(true);
    expect(runtime.ownsKeyboardEvent({ target: outside } as KeyboardEvent)).toBe(false);

    runtime.destroy();
    runtime.destroy();
    lease.publish(menuSnapshot());
    runtime.mount("menu", () => undefined).publish(menuSnapshot());
    expect(runtime.ownsKeyboardEvent({ target: inside } as KeyboardEvent)).toBe(false);
    expect(port.renders).toHaveLength(0);
    expect(port.destroyCount).toBe(1);
  });
});

describe("readSemanticRuntime", () => {
  it("reads only a runtime-shaped value from the shared registry key", () => {
    const runtime: SemanticRuntime = {
      mount: () => ({
        publish: () => undefined,
        focusHeading: () => undefined,
        focusAction: () => undefined,
        dispose: () => undefined
      }),
      ownsKeyboardEvent: () => false,
      destroy: () => undefined
    };
    const keys: string[] = [];

    expect(
      readSemanticRuntime({
        get(key) {
          keys.push(key);
          return runtime;
        }
      })
    ).toBe(runtime);
    expect(keys).toEqual([SEMANTIC_RUNTIME_REGISTRY_KEY]);
    expect(readSemanticRuntime({ get: () => ({ mount: () => undefined }) })).toBeUndefined();
  });
});
