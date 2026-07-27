import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { tutorialCompleteCopy } from "../src/game/systems/TutorialCompleteContentSystem";
import { tutorialCompleteSemanticSnapshot } from "../src/game/systems/TutorialCompleteSemanticSystem";

const tutorialCompleteSceneSource = readFileSync(
  fileURLToPath(new URL("../src/game/scenes/TutorialCompleteScene.ts", import.meta.url)),
  "utf8"
);

describe("tutorialCompleteSemanticSnapshot", () => {
  it("projects the exact cleared outcome and visual action order", () => {
    const copy = tutorialCompleteCopy({ accuracy: 1 });

    expect(tutorialCompleteSemanticSnapshot(copy)).toEqual({
      scene: "tutorial-complete",
      heading: "Tutorial Cleared",
      summary:
        "Qualification approved. WienerWorks permits you to begin Machine Replacement Training with a 40 TC account. Production speed remains theoretical.",
      actions: [
        { id: "primary", label: "Start Training" },
        { id: "menu", label: "Return to Menu" }
      ],
      announcement: {
        id: "tutorial-complete:outcome",
        text:
          "Tutorial Cleared\nQualification approved. WienerWorks permits you to begin Machine Replacement Training with a 40 TC account. Production speed remains theoretical.",
        politeness: "polite"
      }
    });
  });

  it("projects the exact diagnostic failure copy without deriving semantics from action labels", () => {
    const copy = tutorialCompleteCopy({
      accuracy: 0.5,
      totalCorrectCuts: 3,
      totalMissedCuts: 2,
      totalFalseCuts: 1
    });

    expect(tutorialCompleteSemanticSnapshot(copy)).toEqual({
      scene: "tutorial-complete",
      heading: "Tutorial Failed",
      summary:
        "Boundary accuracy: 50%. Readiness requires 70%. Focus: recover missed boundaries. Qualification denied. Payroll remains unconvinced.",
      actions: [
        { id: "primary", label: "Retry Tutorial" },
        { id: "menu", label: "Return to Menu" }
      ],
      announcement: {
        id: "tutorial-complete:outcome",
        text:
          "Tutorial Failed\nBoundary accuracy: 50%. Readiness requires 70%. Focus: recover missed boundaries. Qualification denied. Payroll remains unconvinced.",
        politeness: "polite"
      }
    });
  });

  it("uses a non-interrupting announcement for a routine outcome screen", () => {
    const snapshot = tutorialCompleteSemanticSnapshot(tutorialCompleteCopy({ accuracy: 1 }));

    // Tutorial completion is expected navigation, not an emergency that should preempt assistive-technology speech.
    expect(snapshot.announcement?.politeness).toBe("polite");
    expect(snapshot.announcement?.text).toBe(`${snapshot.heading}\n${snapshot.summary}`);
  });
});

describe("TutorialCompleteScene semantic integration", () => {
  it("mounts one lease after performance is established and disposes it on shutdown", () => {
    const create = tutorialCompleteSceneSource.slice(
      tutorialCompleteSceneSource.indexOf("  create("),
      tutorialCompleteSceneSource.indexOf("\n  private render")
    );
    const shutdown = create.slice(
      create.indexOf("this.events.once(Phaser.Scenes.Events.SHUTDOWN"),
      create.indexOf("    this.render();")
    );

    expect(tutorialCompleteSceneSource.match(/\.mount\("tutorial-complete"/g)).toHaveLength(1);
    expect(create).toContain("this.navigationStarted = false;");
    expect(create.indexOf("this.navigationStarted = false;")).toBeLessThan(
      create.indexOf("this.performance = {")
    );
    expect(create.indexOf("this.performance = {")).toBeLessThan(
      create.indexOf('readSemanticRuntime(this.registry)?.mount("tutorial-complete"')
    );
    expect(shutdown).toContain("this.semanticLease?.dispose();");
    expect(shutdown).toContain("this.navigationStarted = true;");
    expect(shutdown).toContain("this.semanticLease = undefined;");
    expect(shutdown).toContain("clearGameQaSnapshot();");
  });

  it("uses one canonical copy per render and publishes semantics after measured QA", () => {
    const render = tutorialCompleteSceneSource.slice(
      tutorialCompleteSceneSource.indexOf("  private render"),
      tutorialCompleteSceneSource.indexOf("\n  private handleSemanticAction")
    );
    const qaIndex = render.indexOf("writeGameQaSnapshot(tutorialCompleteQaSnapshot(");
    const semanticIndex = render.indexOf(
      "this.semanticLease?.publish(tutorialCompleteSemanticSnapshot(copy));"
    );

    expect(render.match(/const copy = tutorialCompleteCopy\(this\.performance\);/g)).toHaveLength(1);
    expect(render).toContain("const summaryBounds = summaryText.getBounds();");
    expect(render).toContain("tutorialCompleteQaSnapshot(width, height, layout, copy, summaryRect)");
    expect(qaIndex).toBeGreaterThan(-1);
    expect(semanticIndex).toBeGreaterThan(qaIndex);
  });

  it("routes canvas and semantic controls through the same guarded commands", () => {
    expect(tutorialCompleteSceneSource).toContain(
      "this.createButton(layout.primaryButton, copy.primaryAction, () => this.commandPrimary());"
    );
    expect(tutorialCompleteSceneSource).toContain(
      "this.createButton(layout.menuButton, copy.secondaryAction, () => this.commandReturnToMenu());"
    );
    expect(tutorialCompleteSceneSource).toContain(
      'if (actionId === "primary") {\n      this.commandPrimary();'
    );
    expect(tutorialCompleteSceneSource).toContain(
      'if (actionId === "menu") {\n      this.commandReturnToMenu();'
    );
  });

  it("derives the primary route from canonical performance and rejects a second navigation", () => {
    const primary = tutorialCompleteSceneSource.slice(
      tutorialCompleteSceneSource.indexOf("  private commandPrimary"),
      tutorialCompleteSceneSource.indexOf("\n  private commandReturnToMenu")
    );
    const menu = tutorialCompleteSceneSource.slice(
      tutorialCompleteSceneSource.indexOf("  private commandReturnToMenu"),
      tutorialCompleteSceneSource.indexOf("\n  private beginNavigation")
    );
    const guard = tutorialCompleteSceneSource.slice(
      tutorialCompleteSceneSource.indexOf("  private beginNavigation"),
      tutorialCompleteSceneSource.indexOf("\n  private createButton")
    );

    expect(primary).toContain("if (!this.beginNavigation())");
    expect(primary).toContain("tutorialCompleteCopy(this.performance).status");
    expect(primary).not.toContain("primaryAction");
    expect(primary).not.toContain("actionId");
    expect(menu).toContain("if (!this.beginNavigation())");
    expect(guard).toContain("if (this.navigationStarted)");
    expect(guard).toContain("return false;");
    expect(guard).toContain("this.navigationStarted = true;");
  });

  it("preserves the cleared, failed, and menu route payloads", () => {
    expect(tutorialCompleteSceneSource).toContain(
      'this.scene.start("PlayScene", { tutorial: true, startSource: "direct" });'
    );
    expect(tutorialCompleteSceneSource).toContain(
      'this.scene.start("PlayScene", { tutorial: false, startSource: "handoff-screen" });'
    );
    expect(tutorialCompleteSceneSource).toContain('this.scene.start("MenuScene");');
  });
});
