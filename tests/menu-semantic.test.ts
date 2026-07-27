import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { menuSemanticSnapshot } from "../src/game/systems/MenuSemanticSystem";

const menuSceneSource = readFileSync(
  fileURLToPath(new URL("../src/game/scenes/MenuScene.ts", import.meta.url)),
  "utf8"
);

describe("menuSemanticSnapshot", () => {
  it("projects the exact menu heading, summary, and visual action order", () => {
    const snapshot = menuSemanticSnapshot({
      bestRankText: "Best Rank: Boundary Clerk / 7 rounds cleared"
    });

    expect(snapshot).toEqual({
      scene: "menu",
      heading: "Tokenizer Training",
      summary: "Welcome to WienerWorks\nBest Rank: Boundary Clerk / 7 rounds cleared",
      actions: [
        { id: "tutorial", label: "Tutorial" },
        { id: "training", label: "Training" },
        { id: "token-log", label: "Token Log" },
        { id: "settings", label: "Settings" }
      ]
    });
  });

  it("exposes Training as unavailable until tutorial qualification", () => {
    const snapshot = menuSemanticSnapshot({
      bestRankText: "Best Rank: Regex Intern / 0 rounds",
      trainingQualified: false
    });

    expect(snapshot.actions[1]).toEqual({
      id: "training",
      label: "Training - Locked",
      disabled: true
    });
  });

  it("routes canvas actions through guarded menu commands", () => {
    expect(menuSceneSource).toContain('"Tutorial", () => this.startTutorial()');
    expect(menuSceneSource).toContain('trainingQualified ? "Training" : "Training - Locked"');
    expect(menuSceneSource).toContain('() => this.startTraining()');
    expect(menuSceneSource).toContain('{ disabled: !trainingQualified }');
    expect(menuSceneSource).toContain('"Token Log", () => this.openTokenLog()');
    expect(menuSceneSource).toContain('"Settings", () => this.openSettings()');

    expect(menuSceneSource).toContain('this.scene.start(tutorialIntakeRoutes.entry.scene);');
    expect(menuSceneSource).toContain('this.scene.start("PlayScene", { tutorial: false, startSource: "menu" });');
    expect(menuSceneSource).toContain('"Token Log", () => this.openTokenLog()');
    expect(menuSceneSource).toContain('this.scene.start("TokenLogScene");');
    expect(menuSceneSource).toContain('this.scene.start("SettingsScene");');
    expect(menuSceneSource).toContain("private runTransitionOnce(transition: () => void): void");
    expect(menuSceneSource).toContain("if (this.transitionStarted)");
    expect(menuSceneSource).toContain("this.transitionStarted = true;");
    expect(menuSceneSource).toContain('this.audio.play("ui");');
  });

  it("mounts one menu lease, publishes after render, and disposes on shutdown", () => {
    expect(menuSceneSource.match(/\.mount\("menu"/g)).toHaveLength(1);
    expect(menuSceneSource).toContain('readSemanticRuntime(this.registry)?.mount("menu", (actionId) => {');
    expect(menuSceneSource).toContain("this.handleSemanticAction(actionId);");
    expect(menuSceneSource).toContain("this.semanticLease?.dispose();");
    expect(menuSceneSource).toContain("this.semanticLease = undefined;");
    expect(menuSceneSource).toContain("create(data: MenuSceneRoute = {}): void {\n    this.transitionStarted = false;");
    expect(menuSceneSource).not.toContain("document.");
    expect(menuSceneSource).not.toContain("HTMLElement");

    const qaPublishIndex = menuSceneSource.indexOf("this.writeMenuQaSnapshot(layout, copy, highScore, trainingQualified);");
    const semanticPublishIndex = menuSceneSource.indexOf(
      "this.semanticLease?.publish(menuSemanticSnapshot({ bestRankText: bestRecordText, trainingQualified }));"
    );
    expect(qaPublishIndex).toBeGreaterThan(-1);
    expect(semanticPublishIndex).toBeGreaterThan(qaPublishIndex);
  });

  it("routes semantic action IDs through the same guarded menu commands", () => {
    expect(menuSceneSource).toContain('case "tutorial":\n        this.startTutorial();');
    expect(menuSceneSource).toContain('case "training":\n        this.startTraining();');
    expect(menuSceneSource).toContain('case "token-log":\n        this.openTokenLog(true);');
    expect(menuSceneSource).toContain('case "settings":\n        this.openSettings(true);');
  });

  it("distinguishes semantic Token Log entry while preserving the canvas route", () => {
    const openTokenLog = menuSceneSource.slice(
      menuSceneSource.indexOf("  private openTokenLog"),
      menuSceneSource.indexOf("\n  private openSettings")
    );

    expect(openTokenLog).toContain("this.runTransitionOnce(() => {");
    expect(openTokenLog).toContain("if (semanticEntry)");
    expect(openTokenLog).toContain('this.scene.start("TokenLogScene", { semanticEntry: true });');
    expect(openTokenLog).toContain('this.scene.start("TokenLogScene");');
    expect(openTokenLog).not.toContain('this.audio.play("ui")');
  });

  it("distinguishes semantic Settings entry while preserving the canvas route", () => {
    const openSettings = menuSceneSource.slice(
      menuSceneSource.indexOf("  private openSettings"),
      menuSceneSource.indexOf("\n  private runTransitionOnce")
    );

    expect(openSettings).toContain("if (semanticEntry)");
    expect(openSettings).toContain('this.scene.start("SettingsScene", { semanticEntry: true });');
    expect(openSettings).toContain('this.scene.start("SettingsScene");');
    expect(openSettings).not.toContain('this.audio.play("ui")');
  });

  it("restores Token Log or Settings semantic focus only when explicitly routed back", () => {
    const create = menuSceneSource.slice(
      menuSceneSource.indexOf("  create("),
      menuSceneSource.indexOf("\n  private render")
    );

    expect(menuSceneSource).toContain('semanticFocusActionId?: "settings" | "token-log";');
    expect(create).toContain("if (data.semanticFocusActionId !== undefined)");
    expect(create).toContain("this.semanticLease?.focusAction(data.semanticFocusActionId);");
    expect(create.indexOf("this.render();")).toBeLessThan(
      create.indexOf("this.semanticLease?.focusAction(data.semanticFocusActionId);")
    );
    expect(menuSceneSource.match(/focusAction\(/g)).toHaveLength(1);
  });
});
