import Phaser from "phaser";
import { AudioSystem } from "../systems/AudioSystem";
import { clearGameQaSnapshot, writeGameQaSnapshot } from "../systems/GameQaSystem";
import { StorageSystem } from "../systems/StorageSystem";
import {
  tutorialCompleteCopy,
  type TutorialCompletePerformance
} from "../systems/TutorialCompleteContentSystem";
import { computeTutorialCompleteLayout, type TutorialCompleteLayout } from "../systems/TutorialCompleteLayoutSystem";
import { tutorialCompleteQaSnapshot } from "../systems/TutorialCompleteQaSystem";
import { buttonVisual, drawDegradedBrowserSurface, uiFonts, uiPalette } from "../ui/VisualTheme";

export class TutorialCompleteScene extends Phaser.Scene {
  private readonly storage = new StorageSystem();
  private readonly audio = new AudioSystem(this.storage.loadMuted());
  private elements: Phaser.GameObjects.GameObject[] = [];
  private performance: TutorialCompletePerformance = { accuracy: 1 };

  constructor() {
    super("TutorialCompleteScene");
  }

  create(data: TutorialCompletePerformance = {}): void {
    this.performance = {
      accuracy: data.accuracy ?? 1,
      totalCorrectCuts: data.totalCorrectCuts,
      totalMissedCuts: data.totalMissedCuts,
      totalFalseCuts: data.totalFalseCuts
    };
    this.scale.on("resize", this.render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.render, this);
      clearGameQaSnapshot();
    });
    this.render();
  }

  private render(): void {
    this.elements.forEach((element) => element.destroy());
    this.elements = [];

    const width = this.scale.width;
    const height = this.scale.height;
    const layout = computeTutorialCompleteLayout(width, height);
    const copy = tutorialCompleteCopy(this.performance);

    this.addElement(this.add.rectangle(width / 2, height / 2, width, height, uiPalette.shell));
    this.addGrid(width, height);
    this.addElement(this.add.rectangle(layout.panel.x + 5, layout.panel.y + 6, layout.panel.width, layout.panel.height, uiPalette.panelShadow, 0.28));
    this.addElement(this.add.rectangle(layout.panel.x, layout.panel.y, layout.panel.width, layout.panel.height, uiPalette.panel, 0.95).setStrokeStyle(2, uiPalette.strokeDark, 0.94));
    this.addElement(this.add.rectangle(layout.chrome.x, layout.chrome.y, layout.chrome.width, layout.chrome.height, uiPalette.panelTint, 0.92).setStrokeStyle(1, uiPalette.stroke, 0.9));
    this.addElement(this.add.text(layout.chromeText.x, layout.chromeText.y, copy.chromePath, {
      fontFamily: uiFonts.mono,
      fontSize: "12px",
      color: uiPalette.textMuted
    }).setOrigin(0, 0.5));
    this.addElement(this.add.text(layout.title.x, layout.title.y, copy.title, {
      fontFamily: uiFonts.body,
      fontSize: `${layout.title.fontSize}px`,
      color: uiPalette.text,
      align: "center",
      wordWrap: { width: layout.title.wordWrapWidth }
    }).setOrigin(0.5));
    this.addElement(this.add.text(
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

    this.createButton(layout.primaryButton, copy.primaryAction, () => {
      this.audio.play("ui");
      if (copy.status === "failed") {
        this.scene.start("PlayScene", { tutorial: true, startSource: "direct" });
        return;
      }

      this.scene.start("PlayScene", { tutorial: false, startSource: "handoff-screen" });
    });
    this.createButton(layout.menuButton, copy.secondaryAction, () => {
      this.audio.play("ui");
      this.scene.start("MenuScene");
    });
    writeGameQaSnapshot(tutorialCompleteQaSnapshot(width, height, layout, copy));
  }

  private createButton(bounds: TutorialCompleteLayout["primaryButton"], label: string, action: () => void): void {
    const button = this.add.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, buttonVisual.fill, buttonVisual.fillAlpha).setStrokeStyle(1, buttonVisual.stroke);
    const text = this.add.text(bounds.x, bounds.y, label, {
      fontFamily: uiFonts.body,
      fontSize: "16px",
      color: uiPalette.text
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha));
    button.on("pointerout", () => button.setFillStyle(buttonVisual.fill, buttonVisual.fillAlpha));
    button.on("pointerdown", () => button.setFillStyle(buttonVisual.pressFill, buttonVisual.pressAlpha));
    button.on("pointerup", () => {
      button.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha);
      action();
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
