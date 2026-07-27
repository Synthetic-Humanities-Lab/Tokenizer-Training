import Phaser from "phaser";
import { readSemanticRuntime, type SemanticLease } from "../semantic/SemanticRuntime";
import { AudioSystem } from "../systems/AudioSystem";
import { bindCanvasButtonActivation } from "../systems/CanvasButtonActivationSystem";
import {
  clearGameQaSnapshot,
  writeGameQaSnapshot,
  type GameQaRect
} from "../systems/GameQaSystem";
import { readSafeAreaInsetsForSurface } from "../systems/SafeAreaSystem";
import { StorageSystem } from "../systems/StorageSystem";
import { readSurfaceProfile } from "../systems/SurfaceProfileSystem";
import {
  tutorialCompleteCopy,
  type TutorialCompletePerformance
} from "../systems/TutorialCompleteContentSystem";
import { computeTutorialCompleteLayout, type TutorialCompleteLayout } from "../systems/TutorialCompleteLayoutSystem";
import {
  centeredGameQaRectFromTopLeftBounds,
  tutorialCompleteQaSnapshot
} from "../systems/TutorialCompleteQaSystem";
import { tutorialCompleteSemanticSnapshot } from "../systems/TutorialCompleteSemanticSystem";
import { buttonVisual, drawDegradedBrowserSurface, uiFonts, uiPalette } from "../ui/VisualTheme";

export class TutorialCompleteScene extends Phaser.Scene {
  private readonly storage = new StorageSystem();
  private readonly audio = new AudioSystem(this.storage.loadMuted());
  private elements: Phaser.GameObjects.GameObject[] = [];
  private performance: TutorialCompletePerformance = { accuracy: 1 };
  private semanticLease?: SemanticLease;
  private navigationStarted = false;

  constructor() {
    super("TutorialCompleteScene");
  }

  create(data: TutorialCompletePerformance = {}): void {
    this.navigationStarted = false;
    this.audio.setMuted(this.storage.loadMuted());
    this.performance = {
      accuracy: data.accuracy ?? 1,
      totalCorrectCuts: data.totalCorrectCuts,
      totalMissedCuts: data.totalMissedCuts,
      totalFalseCuts: data.totalFalseCuts
    };
    if (tutorialCompleteCopy(this.performance).status === "passed") {
      this.storage.saveTutorialQualified();
    }
    this.semanticLease?.dispose();
    this.semanticLease = readSemanticRuntime(this.registry)?.mount("tutorial-complete", (actionId) => {
      this.handleSemanticAction(actionId);
    });
    this.scale.on("resize", this.render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.render, this);
      this.navigationStarted = true;
      this.semanticLease?.dispose();
      this.semanticLease = undefined;
      clearGameQaSnapshot();
    });
    this.render();
  }

  private render(): void {
    this.elements.forEach((element) => element.destroy());
    this.elements = [];

    const width = this.scale.width;
    const height = this.scale.height;
    const layout = computeTutorialCompleteLayout(width, height, readSafeAreaInsetsForSurface(readSurfaceProfile()));
    const copy = tutorialCompleteCopy(this.performance);

    this.addElement(this.add.rectangle(width / 2, height / 2, width, height, uiPalette.shell));
    this.addGrid(width, height);
    this.addElement(this.add.rectangle(layout.panel.x + 5, layout.panel.y + 6, layout.panel.width, layout.panel.height, uiPalette.panelShadow, 0.28));
    this.addElement(this.add.rectangle(layout.panel.x, layout.panel.y, layout.panel.width, layout.panel.height, uiPalette.panel, 0.95).setStrokeStyle(2, uiPalette.strokeDark, 0.94));
    this.addElement(this.add.text(layout.title.x, layout.title.y, copy.title, {
      fontFamily: uiFonts.display,
      fontSize: `${layout.title.fontSize}px`,
      color: uiPalette.text,
      align: "center",
      wordWrap: { width: layout.title.wordWrapWidth }
    }).setOrigin(0.5));
    const summaryText = this.addElement(this.add.text(
      layout.summary.x,
      layout.summary.y,
      copy.summary,
      {
        fontFamily: uiFonts.body,
        fontSize: `${layout.summary.fontSize}px`,
        color: uiPalette.textMuted,
        align: "center",
        wordWrap: { width: layout.summary.wordWrapWidth }
      }
    ).setOrigin(0.5));
    const summaryBounds = summaryText.getBounds();
    const summaryRect: GameQaRect = centeredGameQaRectFromTopLeftBounds(summaryBounds);

    this.createButton(layout.primaryButton, copy.primaryAction, () => this.commandPrimary());
    this.createButton(layout.menuButton, copy.secondaryAction, () => this.commandReturnToMenu());
    writeGameQaSnapshot(tutorialCompleteQaSnapshot(width, height, layout, copy, summaryRect));
    this.semanticLease?.publish(tutorialCompleteSemanticSnapshot(copy));
  }

  private handleSemanticAction(actionId: string): void {
    if (actionId === "primary") {
      this.commandPrimary();
      return;
    }
    if (actionId === "menu") {
      this.commandReturnToMenu();
    }
  }

  private commandPrimary(): void {
    if (!this.beginNavigation()) {
      return;
    }

    this.audio.play("ui");
    if (tutorialCompleteCopy(this.performance).status === "failed") {
      this.scene.start("PlayScene", { tutorial: true, startSource: "direct" });
      return;
    }

    this.scene.start("PlayScene", { tutorial: false, startSource: "handoff-screen" });
  }

  private commandReturnToMenu(): void {
    if (!this.beginNavigation()) {
      return;
    }

    this.audio.play("ui");
    this.scene.start("MenuScene");
  }

  private beginNavigation(): boolean {
    if (this.navigationStarted) {
      return false;
    }

    this.navigationStarted = true;
    return true;
  }

  private createButton(bounds: TutorialCompleteLayout["primaryButton"], label: string, action: () => void): void {
    const button = this.add.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, buttonVisual.fill, buttonVisual.fillAlpha).setStrokeStyle(1, buttonVisual.stroke);
    const text = this.add.text(bounds.x, bounds.y, label, {
      fontFamily: uiFonts.body,
      fontSize: "16px",
      color: uiPalette.text
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    bindCanvasButtonActivation({
      button,
      input: this.input,
      onRest: () => button.setFillStyle(buttonVisual.fill, buttonVisual.fillAlpha),
      onHover: () => button.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha),
      onPress: () => button.setFillStyle(buttonVisual.pressFill, buttonVisual.pressAlpha),
      onActivate: action
    });
    this.addElement(button);
    this.addElement(text);
  }

  private addGrid(width: number, height: number): void {
    const grid = this.add.graphics();
    drawDegradedBrowserSurface(grid, width, height, { compact: width < 560 });
    this.addElement(grid);
  }

  private addElement<T extends Phaser.GameObjects.GameObject>(element: T): T {
    this.elements.push(element);
    return element;
  }
}
