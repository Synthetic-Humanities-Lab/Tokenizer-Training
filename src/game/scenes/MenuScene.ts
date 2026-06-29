import Phaser from "phaser";
import { AudioSystem } from "../systems/AudioSystem";
import { clearGameQaSnapshot, writeGameQaSnapshot } from "../systems/GameQaSystem";
import { menuCopy, type MenuCopy } from "../systems/MenuContentSystem";
import { computeMenuLayout, type MenuLayout } from "../systems/MenuLayoutSystem";
import { menuSceneQaSnapshot } from "../systems/MenuSceneQaSystem";
import { PRODUCT_NAME } from "../systems/ProductIdentitySystem";
import { StorageSystem } from "../systems/StorageSystem";
import { buttonVisual, drawDegradedBrowserSurface, uiFonts, uiPalette } from "../ui/VisualTheme";
import { addWienerImage } from "../ui/WienerSprite";

export class MenuScene extends Phaser.Scene {
  private readonly storage = new StorageSystem();
  private readonly audio = new AudioSystem(this.storage.loadMuted());
  private elements: Phaser.GameObjects.GameObject[] = [];
  private muteText?: Phaser.GameObjects.Text;

  constructor() {
    super("MenuScene");
  }

  create(): void {
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
    this.muteText = undefined;

    const width = this.scale.width;
    const height = this.scale.height;
    const highScore = this.storage.loadHighScore();
    const layout = computeMenuLayout(width, height);
    const copy = menuCopy();
    const bestRecordText = menuBestRecordText(layout.compact, highScore?.rank ?? "Regex Intern", highScore?.rounds ?? 0);

    this.addElement(this.add.rectangle(width / 2, height / 2, width, height, uiPalette.shell));
    this.addGrid(width, height);
    this.addElement(this.add.rectangle(layout.card.x + 4, layout.card.y + 5, layout.card.width, layout.card.height, uiPalette.panelShadow, 0.12));
    this.addElement(this.add.rectangle(layout.card.x, layout.card.y, layout.card.width, layout.card.height, uiPalette.panel, 0.96).setStrokeStyle(1, uiPalette.strokeDark, 0.78));
    this.addElement(
      this.add.text(layout.companyMark.x, layout.companyMark.y, "Welcome to WienerWorks", {
        fontFamily: uiFonts.display,
        fontSize: `${layout.companyMark.fontSize}px`,
        color: uiPalette.text,
        align: layout.companyMark.align,
        wordWrap: { width: layout.companyMark.wordWrapWidth }
      }).setOrigin(layout.companyMark.align === "center" ? 0.5 : 0, 0.5)
    );
    this.addElement(
      this.add.text(layout.title.x, layout.title.y, PRODUCT_NAME, {
        fontFamily: uiFonts.body,
        fontSize: `${layout.title.fontSize}px`,
        color: uiPalette.text,
        align: "center",
        wordWrap: { width: layout.title.wordWrapWidth }
      }).setOrigin(0.5, 0.5)
    );
    this.addElement(addWienerImage(this, {
      x: layout.menuMascot.x,
      y: layout.menuMascot.y,
      height: layout.menuMascot.height,
      depth: 9
    }));
    this.addElement(
      this.add.text(layout.moduleLabel.x, layout.moduleLabel.y, layout.moduleLabel.text, {
        fontFamily: uiFonts.body,
        fontSize: `${layout.moduleLabel.fontSize}px`,
        color: "#d65a2b",
        align: "center",
        wordWrap: { width: layout.moduleLabel.wordWrapWidth }
      }).setOrigin(0.5, 0.5)
    );
    this.addElement(
      this.add.text(layout.premise.x, layout.premise.y, copy.premise, {
        fontFamily: uiFonts.body,
        fontSize: `${layout.premise.fontSize}px`,
        color: uiPalette.textMuted,
        align: "center",
        wordWrap: { width: layout.premise.wordWrapWidth }
      }).setOrigin(0.5, 0.5)
    );
    if (layout.workOrder.visible) {
      this.addElement(
        this.add.rectangle(
          layout.workOrder.panel.x,
          layout.workOrder.panel.y,
          layout.workOrder.panel.width,
            layout.workOrder.panel.height,
            uiPalette.panelLight,
          0.62
        ).setStrokeStyle(1, uiPalette.stroke, 0.92)
      );
      this.addElement(
        this.add.rectangle(
          layout.workOrder.panel.x,
          layout.workOrder.panel.y - layout.workOrder.panel.height / 2 + 19,
          layout.workOrder.panel.width - 2,
          28,
          uiPalette.panelTint,
          0.72
        )
      );
      this.addElement(
        this.add.line(
          0,
          0,
          layout.workOrder.panel.x - layout.workOrder.panel.width / 2 + 10,
          layout.workOrder.panel.y - layout.workOrder.panel.height / 2 + 34,
          layout.workOrder.panel.x + layout.workOrder.panel.width / 2 - 10,
          layout.workOrder.panel.y - layout.workOrder.panel.height / 2 + 34,
          uiPalette.strokeDark,
          0.44
        )
      );
      this.addElement(
        this.add.text(layout.workOrder.label.x, layout.workOrder.label.y, copy.workOrderLabel, {
          fontFamily: uiFonts.mono,
          fontSize: `${layout.workOrder.label.fontSize}px`,
          color: uiPalette.textFaint
        }).setOrigin(0, 0.5)
      );
      copy.workOrderRows.forEach((row, index) => {
        this.addElement(
          this.add.text(layout.workOrder.rowX, layout.workOrder.rowYs[index] ?? layout.workOrder.rowYs[0], row, {
            fontFamily: uiFonts.mono,
            fontSize: `${layout.workOrder.rowFontSize}px`,
            color: uiPalette.textMuted,
            wordWrap: { width: layout.workOrder.rowWordWrapWidth }
          }).setOrigin(0, 0.5)
        );
      });
    }
    this.addElement(
      this.add.text(layout.bestRecord.x, layout.bestRecord.y, bestRecordText, {
        fontFamily: uiFonts.body,
        fontSize: `${layout.bestRecord.fontSize}px`,
        color: uiPalette.text,
        align: "center",
        wordWrap: { width: layout.bestRecord.wordWrapWidth }
      }).setOrigin(0.5, 0.5)
    );

    this.createButton(layout.tutorialButton.x, layout.tutorialButton.y, layout.tutorialButton.width, "Begin Tutorial", () => {
      this.audio.play("ui");
      this.scene.start("PlayScene", { tutorial: true, startSource: "menu" });
    });
    this.createButton(layout.endlessButton.x, layout.endlessButton.y, layout.endlessButton.width, "Endless Training", () => {
      this.audio.play("ui");
      this.scene.start("PlayScene", { tutorial: false, startSource: "menu" });
    });
    this.createButton(layout.soundButton.x, layout.soundButton.y, layout.soundButton.width, this.audio.isMuted() ? "Sound: Off" : "Sound: On", () => {
      const muted = this.audio.toggleMuted();
      this.storage.saveMuted(muted);
      this.muteText?.setText(muted ? "Sound: Off" : "Sound: On");
      this.writeMenuQaSnapshot(layout, copy, highScore);
      if (!muted) this.audio.play("ui");
    }, (text) => {
      this.muteText = text;
    });
    this.writeMenuQaSnapshot(layout, copy, highScore);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    label: string,
    action: () => void,
    bindText?: (text: Phaser.GameObjects.Text) => void
  ): void {
    const button = this.add.rectangle(x, y, width, 46, buttonVisual.fill, buttonVisual.fillAlpha).setStrokeStyle(1, buttonVisual.stroke);
    const text = this.add.text(x, y, label, {
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
    bindText?.(text);
    this.addElement(button);
    this.addElement(text);
  }

  private addGrid(width: number, height: number): void {
    const grid = this.add.graphics();
    drawDegradedBrowserSurface(grid, width, height, { compact: width < 620 });
    this.addElement(grid);
  }

  private addElement<T extends Phaser.GameObjects.GameObject>(element: T): T {
    this.elements.push(element);
    return element;
  }

  private writeMenuQaSnapshot(
    layout: MenuLayout,
    copy: MenuCopy,
    highScore: ReturnType<StorageSystem["loadHighScore"]>
  ): void {
    if (!import.meta.env.DEV) {
      return;
    }

    writeGameQaSnapshot(menuSceneQaSnapshot({
      width: this.scale.width,
      height: this.scale.height,
      layout,
      copy,
      highScoreRounds: highScore?.rounds ?? 0,
      highScoreRank: highScore?.rank ?? "Regex Intern",
      soundButtonText: this.muteText?.text ?? (this.audio.isMuted() ? "Sound: Off" : "Sound: On")
    }));
  }
}

function menuBestRecordText(compact: boolean, rank: string, rounds: number): string {
  const normalizedRounds = Math.max(0, Math.floor(rounds));
  return compact
    ? `Best Record: ${rank} / ${normalizedRounds} rounds`
    : `Best Record: ${rank} / ${normalizedRounds} rounds cleared`;
}
