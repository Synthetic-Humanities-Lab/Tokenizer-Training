import Phaser from "phaser";
import { readSemanticRuntime, type SemanticLease } from "../semantic/SemanticRuntime";
import { AudioSystem } from "../systems/AudioSystem";
import { bindCanvasButtonActivation } from "../systems/CanvasButtonActivationSystem";
import { clearGameQaSnapshot, writeGameQaSnapshot } from "../systems/GameQaSystem";
import { menuCopy, type MenuCopy } from "../systems/MenuContentSystem";
import { computeMenuLayout, type MenuLayout } from "../systems/MenuLayoutSystem";
import { menuSemanticSnapshot } from "../systems/MenuSemanticSystem";
import { menuSceneQaSnapshot } from "../systems/MenuSceneQaSystem";
import { bestRankDisplayText } from "../systems/RankSystem";
import { readSafeAreaInsetsForSurface } from "../systems/SafeAreaSystem";
import { StorageSystem } from "../systems/StorageSystem";
import { readSurfaceProfile } from "../systems/SurfaceProfileSystem";
import { tutorialIntakeRoutes } from "../systems/TutorialIntakeSystem";
import { TUTORIAL_ROUND_COUNT } from "../systems/TutorialSystem";
import {
  applyUiTextResolution,
  buttonVisual,
  drawDegradedBrowserSurface,
  uiFonts,
  uiPalette
} from "../ui/VisualTheme";
import { addWienerImage } from "../ui/WienerSprite";

interface MenuSceneRoute {
  semanticFocusActionId?: "settings" | "token-log";
}

export class MenuScene extends Phaser.Scene {
  private readonly storage = new StorageSystem();
  private readonly audio = new AudioSystem(this.storage.loadMuted());
  private elements: Phaser.GameObjects.GameObject[] = [];
  private semanticLease?: SemanticLease;
  private transitionStarted = false;

  constructor() {
    super("MenuScene");
  }

  create(data: MenuSceneRoute = {}): void {
    this.transitionStarted = false;
    this.audio.setMuted(this.storage.loadMuted());
    this.semanticLease?.dispose();
    this.scale.on("resize", this.render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.transitionStarted = true;
      this.semanticLease?.dispose();
      this.semanticLease = undefined;
      this.scale.off("resize", this.render, this);
      clearGameQaSnapshot();
    });
    this.semanticLease = readSemanticRuntime(this.registry)?.mount("menu", (actionId) => {
      this.handleSemanticAction(actionId);
    });
    this.render();
    if (data.semanticFocusActionId !== undefined) {
      this.semanticLease?.focusAction(data.semanticFocusActionId);
    }
  }

  private render(): void {
    this.elements.forEach((element) => element.destroy());
    this.elements = [];

    const width = this.scale.width;
    const height = this.scale.height;
    const highScore = this.storage.loadHighScore();
    const trainingQualified = this.trainingQualified(highScore?.rounds ?? 0);
    const surfaceProfile = readSurfaceProfile();
    const layout = computeMenuLayout(width, height, readSafeAreaInsetsForSurface(surfaceProfile), surfaceProfile);
    const copy = menuCopy();
    const bestRecordText = menuBestRecordText(highScore?.rounds ?? 0);

    this.addElement(this.add.rectangle(width / 2, height / 2, width, height, uiPalette.shell));
    this.addGrid(width, height);
    this.addElement(this.add.rectangle(layout.card.x + 4, layout.card.y + 5, layout.card.width, layout.card.height, uiPalette.panelShadow, 0.12));
    this.addElement(this.add.rectangle(layout.card.x, layout.card.y, layout.card.width, layout.card.height, uiPalette.panel, 0.96).setStrokeStyle(1, uiPalette.strokeDark, 0.78));
    this.addCardBottomRail(layout);
    this.addElement(
      this.add.text(layout.companyMark.x, layout.companyMark.y, layout.companyMark.displayText, {
        fontFamily: uiFonts.display,
        fontSize: `${layout.companyMark.fontSize}px`,
        color: uiPalette.text,
        align: layout.companyMark.align,
        wordWrap: { width: layout.companyMark.wordWrapWidth }
      }).setOrigin(layout.companyMark.align === "center" ? 0.5 : 0, 0.5)
    );
    this.addElement(
      this.add.text(layout.title.x, layout.title.y, layout.title.displayText, {
        fontFamily: uiFonts.display,
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
    if (layout.moduleLabel.visible) {
      this.addElement(
        this.add.text(layout.moduleLabel.x, layout.moduleLabel.y, layout.moduleLabel.text, {
          fontFamily: uiFonts.body,
          fontSize: `${layout.moduleLabel.fontSize}px`,
          color: "#d65a2b",
          align: "center",
          wordWrap: { width: layout.moduleLabel.wordWrapWidth }
        }).setOrigin(0.5, 0.5)
      );
    }
    if (layout.premise.visible) {
      this.addElement(
        this.add.text(layout.premise.x, layout.premise.y, copy.premise, {
          fontFamily: uiFonts.body,
          fontSize: `${layout.premise.fontSize}px`,
          color: uiPalette.textMuted,
          align: "center",
          wordWrap: { width: layout.premise.wordWrapWidth }
        }).setOrigin(0.5, 0.5)
      );
    }
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
    if (layout.bestRecord.visible) {
      this.addElement(
        this.add.text(layout.bestRecord.x, layout.bestRecord.y, bestRecordText, {
          fontFamily: uiFonts.body,
          fontSize: `${layout.bestRecord.fontSize}px`,
          color: uiPalette.text,
          align: "center",
          wordWrap: { width: layout.bestRecord.wordWrapWidth }
        }).setOrigin(0.5, 0.5)
      );
    }

    this.createButton(layout.tutorialButton.x, layout.tutorialButton.y, layout.tutorialButton.width, layout.tutorialButton.height, "Tutorial", () => this.startTutorial(), { primary: true });
    this.createButton(
      layout.trainingButton.x,
      layout.trainingButton.y,
      layout.trainingButton.width,
      layout.trainingButton.height,
      trainingQualified ? "Training" : "Training - Locked",
      () => this.startTraining(),
      { disabled: !trainingQualified }
    );
    this.createButton(layout.tokenLogButton.x, layout.tokenLogButton.y, layout.tokenLogButton.width, layout.tokenLogButton.height, "Token Log", () => this.openTokenLog());
    this.createButton(layout.settingsButton.x, layout.settingsButton.y, layout.settingsButton.width, layout.settingsButton.height, "Settings", () => this.openSettings());
    this.writeMenuQaSnapshot(layout, copy, highScore, trainingQualified);
    this.semanticLease?.publish(menuSemanticSnapshot({ bestRankText: bestRecordText, trainingQualified }));
  }

  private handleSemanticAction(actionId: string): void {
    switch (actionId) {
      case "tutorial":
        this.startTutorial();
        return;
      case "training":
        this.startTraining();
        return;
      case "token-log":
        this.openTokenLog(true);
        return;
      case "settings":
        this.openSettings(true);
    }
  }

  private startTutorial(): void {
    this.runTransitionOnce(() => {
      this.scene.start(tutorialIntakeRoutes.entry.scene);
    });
  }

  private startTraining(): void {
    this.runTransitionOnce(() => {
      this.scene.start("PlayScene", { tutorial: false, startSource: "menu" });
    });
  }

  private openTokenLog(semanticEntry = false): void {
    this.runTransitionOnce(() => {
      if (semanticEntry) {
        this.scene.start("TokenLogScene", { semanticEntry: true });
        return;
      }
      this.scene.start("TokenLogScene");
    });
  }

  private openSettings(semanticEntry = false): void {
    this.runTransitionOnce(() => {
      if (semanticEntry) {
        this.scene.start("SettingsScene", { semanticEntry: true });
        return;
      }
      this.scene.start("SettingsScene");
    });
  }

  private runTransitionOnce(transition: () => void): void {
    if (this.transitionStarted) {
      return;
    }

    this.transitionStarted = true;
    this.audio.play("ui");
    transition();
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    action: () => void,
    options: { primary?: boolean; disabled?: boolean } = {}
  ): void {
    const fill = options.primary ? 0xfff8ec : buttonVisual.fill;
    const stroke = options.primary ? 0xd3b184 : buttonVisual.stroke;
    const hoverFill = options.primary ? 0xf7ead7 : buttonVisual.hoverFill;
    const pressFill = options.primary ? 0xead7ba : buttonVisual.pressFill;
    const button = this.add.rectangle(x, y, width, height, fill, buttonVisual.fillAlpha).setStrokeStyle(1, stroke);
    const disabled = options.disabled === true;
    const text = this.add.text(x, y, label, {
      fontFamily: uiFonts.body,
      fontSize: height <= 38 ? "12px" : "16px",
      color: disabled ? uiPalette.textFaint : uiPalette.text
    }).setOrigin(0.5);

    if (disabled) {
      button.setFillStyle(buttonVisual.disabledFill, buttonVisual.disabledAlpha);
      button.setStrokeStyle(1, buttonVisual.stroke, 0.45);
    } else {
      button.setInteractive({ useHandCursor: true });
      bindCanvasButtonActivation({
        button,
        input: this.input,
        onRest: () => button.setFillStyle(fill, buttonVisual.fillAlpha),
        onHover: () => button.setFillStyle(hoverFill, buttonVisual.hoverAlpha),
        onPress: () => button.setFillStyle(pressFill, buttonVisual.pressAlpha),
        onActivate: action
      });
    }
    this.addElement(button);
    this.addElement(text);
  }

  private addGrid(width: number, height: number): void {
    const grid = this.add.graphics();
    drawDegradedBrowserSurface(grid, width, height, { compact: width < 620 });
    this.addElement(grid);
  }

  private addCardBottomRail(layout: MenuLayout): void {
    const rail = this.add.graphics();
    const railWidth = Math.max(0, layout.card.width - 48);
    rail.fillStyle(0x6e665c, 0.08);
    rail.fillRoundedRect(
      layout.card.x - railWidth / 2,
      layout.card.y + layout.card.height / 2 - 36,
      railWidth,
      5,
      3
    );
    this.addElement(rail);
  }

  private addElement<T extends Phaser.GameObjects.GameObject>(element: T): T {
    applyUiTextResolution(element);
    this.elements.push(element);
    return element;
  }

  private writeMenuQaSnapshot(
    layout: MenuLayout,
    copy: MenuCopy,
    highScore: ReturnType<StorageSystem["loadHighScore"]>,
    trainingQualified: boolean
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
      muted: this.audio.isMuted(),
      trainingQualified,
      storageQaState: this.storage.qaState()
    }));
  }

  private trainingQualified(highScoreRounds: number): boolean {
    if (this.storage.loadTutorialQualified()) {
      return true;
    }

    const legacyQualification = highScoreRounds > 0
      || this.storage.loadTokenLogSentences().length >= TUTORIAL_ROUND_COUNT;
    if (legacyQualification) {
      this.storage.saveTutorialQualified();
    }
    return legacyQualification;
  }
}

function menuBestRecordText(rounds: number): string {
  return bestRankDisplayText(rounds);
}
