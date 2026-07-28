import Phaser from "phaser";
import { readSemanticRuntime, type SemanticLease } from "../semantic/SemanticRuntime";
import { AudioSystem } from "../systems/AudioSystem";
import { bindCanvasButtonActivation } from "../systems/CanvasButtonActivationSystem";
import { clearGameQaSnapshot, writeGameQaSnapshot } from "../systems/GameQaSystem";
import {
  MOTION_PREFERENCE_REGISTRY_KEY,
  type MotionPreferenceRuntime,
  type MotionPreferenceSnapshot,
  unsupportedMotionPreference
} from "../systems/MotionPreferenceSystem";
import { readSafeAreaInsetsForSurface } from "../systems/SafeAreaSystem";
import { StorageSystem } from "../systems/StorageSystem";
import { readSurfaceProfile } from "../systems/SurfaceProfileSystem";
import {
  computeTutorialIntakeLayout,
  tutorialIntakeCopy,
  tutorialIntakeQaSnapshot,
  tutorialIntakeRoutes,
  tutorialIntakeSemanticSnapshot,
  type TutorialIntakeActionId,
  type TutorialIntakeArtifact,
  type TutorialIntakeLayout,
  type TutorialIntakeTextBlock
} from "../systems/TutorialIntakeSystem";
import {
  applyUiTextResolution,
  buttonVisual,
  drawDegradedBrowserSurface,
  uiFonts,
  uiPalette
} from "../ui/VisualTheme";
import { addWienerImage } from "../ui/WienerSprite";

export class TutorialScene extends Phaser.Scene {
  private readonly storage = new StorageSystem();
  private readonly audio = new AudioSystem(this.storage.loadMuted());
  private elements: Phaser.GameObjects.GameObject[] = [];
  private semanticLease?: SemanticLease;
  private mascot?: Phaser.GameObjects.Image;
  private mascotBobTween?: Phaser.Tweens.Tween;
  private mascotBaseY = 0;
  private motionPreference: Readonly<MotionPreferenceSnapshot> = unsupportedMotionPreference();
  private unsubscribeMotionPreference?: () => void;
  private navigationStarted = false;
  private pageIndex = 0;

  constructor() {
    super("TutorialScene");
  }

  create(): void {
    this.navigationStarted = false;
    this.pageIndex = 0;
    this.audio.setMuted(this.storage.loadMuted());
    const motionRuntime = this.registry.get(MOTION_PREFERENCE_REGISTRY_KEY) as MotionPreferenceRuntime | undefined;
    this.motionPreference = motionRuntime?.snapshot() ?? unsupportedMotionPreference();
    this.unsubscribeMotionPreference?.();
    this.unsubscribeMotionPreference = motionRuntime?.subscribe((snapshot) => {
      this.motionPreference = snapshot;
      this.restartMascotBob();
    });
    this.semanticLease?.dispose();
    this.semanticLease = readSemanticRuntime(this.registry)?.mount("tutorial-intake", (actionId) => {
      this.handleSemanticAction(actionId as TutorialIntakeActionId);
    });
    this.scale.on("resize", this.render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.navigationStarted = true;
      this.semanticLease?.dispose();
      this.semanticLease = undefined;
      this.unsubscribeMotionPreference?.();
      this.unsubscribeMotionPreference = undefined;
      this.stopMascotBob();
      this.scale.off("resize", this.render, this);
      clearGameQaSnapshot();
    });
    this.render();
  }

  private render(): void {
    this.stopMascotBob();
    this.elements.forEach((element) => element.destroy());
    this.elements = [];
    this.mascot = undefined;

    const width = this.scale.width;
    const height = this.scale.height;
    const copy = tutorialIntakeCopy(this.pageIndex);
    const layout = computeTutorialIntakeLayout(
      width,
      height,
      readSafeAreaInsetsForSurface(readSurfaceProfile()),
      copy.pageIndex
    );

    this.addElement(this.add.rectangle(width / 2, height / 2, width, height, uiPalette.shell));
    this.addGrid(width, height);
    this.addElement(this.add.rectangle(layout.panel.x + 5, layout.panel.y + 6, layout.panel.width, layout.panel.height, uiPalette.panelShadow, 0.2));
    this.addElement(this.add.rectangle(layout.panel.x, layout.panel.y, layout.panel.width, layout.panel.height, uiPalette.panel, 0.97).setStrokeStyle(2, uiPalette.strokeDark, 0.9));
    this.addText(layout.title, copy.title, uiFonts.display, uiPalette.text);
    this.addText(layout.premise, copy.premise, uiFonts.body, uiPalette.textMuted);
    this.addOrientationArtifact(layout.artifact, copy.artifact);
    this.addWienerBubble(layout);
    this.addText(layout.wienerNote, copy.wienerNote, uiFonts.body, uiPalette.text);
    this.mascot = this.addElement(addWienerImage(this, {
      x: layout.mascot.x,
      y: layout.mascot.y,
      height: layout.mascot.height,
      depth: 8
    }));
    this.mascotBaseY = layout.mascot.y;
    this.restartMascotBob();
    this.addProgress(layout, copy.pageIndex, copy.progressLabels);
    this.createButton(layout.primaryButton, copy.primaryAction, () => this.commandAdvance(), true);
    this.createButton(layout.secondaryButton, copy.secondaryAction, () => this.commandBack(), false);
    writeGameQaSnapshot(tutorialIntakeQaSnapshot(width, height, layout, copy));
    this.semanticLease?.publish(tutorialIntakeSemanticSnapshot(copy));
  }

  private handleSemanticAction(actionId: TutorialIntakeActionId): void {
    if (actionId === "continue" || actionId === "clock-in") {
      this.commandAdvance();
      return;
    }
    if (actionId === "back") {
      this.commandBack();
    }
  }

  private commandAdvance(): void {
    const copy = tutorialIntakeCopy(this.pageIndex);
    this.audio.play("ui");
    if (copy.primaryActionId === "continue") {
      this.pageIndex += 1;
      this.render();
      return;
    }

    if (!this.beginNavigation()) {
      return;
    }
    this.scene.start(tutorialIntakeRoutes.clockIn.scene, tutorialIntakeRoutes.clockIn.data);
  }

  private commandBack(): void {
    if (this.pageIndex > 0) {
      this.audio.play("ui");
      this.pageIndex -= 1;
      this.render();
      return;
    }

    if (!this.beginNavigation()) {
      return;
    }

    this.audio.play("ui");
    this.scene.start(tutorialIntakeRoutes.back.scene);
  }

  private beginNavigation(): boolean {
    if (this.navigationStarted) {
      return false;
    }

    this.navigationStarted = true;
    return true;
  }

  private createButton(bounds: TutorialIntakeLayout["primaryButton"], label: string, action: () => void, primary: boolean): void {
    const fill = primary ? buttonVisual.readyFill : buttonVisual.fill;
    const hoverFill = primary ? buttonVisual.readyHoverFill : buttonVisual.hoverFill;
    const pressFill = primary ? buttonVisual.readyPressFill : buttonVisual.pressFill;
    const stroke = primary ? buttonVisual.readyStroke : buttonVisual.stroke;
    const button = this.add.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, fill, primary ? buttonVisual.readyAlpha : buttonVisual.fillAlpha).setStrokeStyle(1, stroke);
    const text = this.add.text(bounds.x, bounds.y, label, {
      fontFamily: uiFonts.body,
      fontSize: primary ? "17px" : "14px",
      color: uiPalette.text
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    bindCanvasButtonActivation({
      button,
      input: this.input,
      onRest: () => button.setFillStyle(fill, primary ? buttonVisual.readyAlpha : buttonVisual.fillAlpha),
      onHover: () => button.setFillStyle(hoverFill, primary ? buttonVisual.readyHoverAlpha : buttonVisual.hoverAlpha),
      onPress: () => button.setFillStyle(pressFill, primary ? buttonVisual.readyPressAlpha : buttonVisual.pressAlpha),
      onActivate: action
    });
    this.addElement(button);
    this.addElement(text);
  }

  private addText(block: TutorialIntakeTextBlock, value: string, fontFamily: string, color: string): void {
    const text = this.add.text(block.x, block.y, value, {
      fontFamily,
      fontSize: `${block.fontSize}px`,
      color,
      align: block.align,
      wordWrap: { width: block.width }
    });
    text.setOrigin(block.align === "left" ? 0 : 0.5, 0.5);
    this.addElement(text);
  }

  private addGrid(width: number, height: number): void {
    const grid = this.add.graphics();
    drawDegradedBrowserSurface(grid, width, height, { compact: width < 620 });
    this.addElement(grid);
  }

  private addWienerBubble(layout: TutorialIntakeLayout): void {
    const bubble = layout.wienerBubble;
    const top = bubble.y - bubble.height / 2;
    const right = bubble.x + bubble.width / 2;
    const bottom = bubble.y + bubble.height / 2;
    const mascotLeft = layout.mascot.x - layout.mascot.width / 2;
    const tailStartX = right - Math.min(42, bubble.width * 0.2);
    const tailEndX = right - 10;
    const mouthX = mascotLeft + Math.min(10, layout.mascot.width * 0.18);
    const mouthY = layout.mascot.y + layout.mascot.height * 0.08;
    const graphics = this.add.graphics();
    graphics.fillStyle(uiPalette.panelLight, 0.92);
    graphics.fillRoundedRect(bubble.x - bubble.width / 2, top, bubble.width, bubble.height, 8);
    graphics.lineStyle(1, uiPalette.strokeDark, 0.62);
    graphics.strokeRoundedRect(bubble.x - bubble.width / 2, top, bubble.width, bubble.height, 8);
    graphics.fillStyle(uiPalette.panelLight, 0.92);
    graphics.fillTriangle(tailStartX, bottom - 2, tailEndX, bottom - 5, mouthX, mouthY);
    graphics.lineBetween(tailStartX + 8, bottom - 2, mouthX, mouthY);
    graphics.lineBetween(mouthX, mouthY, tailEndX, bottom - 5);
    this.addElement(graphics);
  }

  private addOrientationArtifact(
    bounds: TutorialIntakeLayout["panel"],
    artifact: TutorialIntakeArtifact
  ): void {
    const graphics = this.add.graphics();
    const left = bounds.x - bounds.width / 2;
    const top = bounds.y - bounds.height / 2;
    const bottom = bounds.y + bounds.height / 2;
    graphics.lineStyle(1, uiPalette.stroke, 0.34);
    graphics.lineBetween(left, top, left + bounds.width, top);
    graphics.lineBetween(left, bottom, left + bounds.width, bottom);

    if (artifact.kind === "assignment") {
      const dividerX = bounds.x - bounds.width * 0.18;
      graphics.lineBetween(dividerX, top + 6, dividerX, bottom - 6);
      graphics.fillStyle(uiPalette.amber, 0.72);
      graphics.fillRect(left, top, 3, bounds.height);
      this.addElement(this.add.text(left + 12, bounds.y, "ASSIGNMENT", {
        fontFamily: uiFonts.mono,
        fontSize: "10px",
        color: uiPalette.textFaint
      }).setOrigin(0, 0.5));
      this.addElement(this.add.text(dividerX + 10, bounds.y - 8, artifact.division, {
        fontFamily: uiFonts.mono,
        fontSize: "10px",
        color: uiPalette.text
      }).setOrigin(0, 0.5));
      this.addElement(this.add.text(dividerX + 10, bounds.y + 9, artifact.status, {
        fontFamily: uiFonts.mono,
        fontSize: "10px",
        color: uiPalette.textFaint
      }).setOrigin(0, 0.5));
      this.addElement(graphics);
      return;
    }

    if (artifact.kind === "qualification") {
      const stepWidth = bounds.width / Math.max(1, artifact.steps.length);
      const railY = bounds.y - 5;
      graphics.lineStyle(1, uiPalette.strokeDark, 0.48);
      graphics.lineBetween(left + stepWidth / 2, railY, left + bounds.width - stepWidth / 2, railY);
      artifact.steps.forEach((step, index) => {
        const x = left + stepWidth * (index + 0.5);
        graphics.fillStyle(index === 0 ? uiPalette.amber : uiPalette.panelLight, 1);
        graphics.fillCircle(x, railY, 4);
        graphics.lineStyle(1, index === 0 ? uiPalette.amber : uiPalette.strokeDark, 0.82);
        graphics.strokeCircle(x, railY, 4);
        this.addElement(this.add.text(x, bounds.y + 10, step, {
          fontFamily: uiFonts.mono,
          fontSize: "10px",
          color: index === 0 ? uiPalette.text : uiPalette.textFaint
        }).setOrigin(0.5));
      });
      this.addElement(graphics);
      return;
    }

    const stepWidth = bounds.width / Math.max(1, artifact.tokenStrings.length);
    artifact.tokenStrings.forEach((token, index) => {
      const x = left + stepWidth * (index + 0.5);
      if (index > 0) {
        const boundaryX = left + stepWidth * index;
        graphics.lineStyle(2, uiPalette.amber, 0.78);
        graphics.lineBetween(boundaryX, top + 5, boundaryX, bottom - 5);
      }
      this.addElement(this.add.text(x, bounds.y - (artifact.tokenIds ? 8 : 0), token, {
        fontFamily: uiFonts.mono,
        fontSize: artifact.tokenIds ? "10px" : "11px",
        color: uiPalette.text,
        align: "center"
      }).setOrigin(0.5));
      if (artifact.tokenIds) {
        this.addElement(this.add.text(x, bounds.y + 10, String(artifact.tokenIds[index]), {
          fontFamily: uiFonts.mono,
          fontSize: "10px",
          color: "#a75d2b",
          align: "center"
        }).setOrigin(0.5));
      }
    });

    this.addElement(graphics);
  }

  private restartMascotBob(): void {
    this.stopMascotBob();
    if (!this.mascot?.active || this.motionPreference.reduced) {
      return;
    }

    this.mascotBobTween = this.tweens.add({
      targets: this.mascot,
      y: this.mascotBaseY - 4,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  private stopMascotBob(): void {
    this.mascotBobTween?.stop();
    this.mascotBobTween = undefined;
    this.mascot?.setY(this.mascotBaseY);
  }

  private addProgress(
    layout: TutorialIntakeLayout,
    activeIndex: number,
    labels: readonly string[]
  ): void {
    const graphics = this.add.graphics();
    const left = layout.progress.x - layout.progress.width / 2;
    const stepWidth = layout.progress.width / Math.max(1, labels.length);
    labels.forEach((label, index) => {
      const x = left + stepWidth * (index + 0.5);
      const active = index === activeIndex;
      const complete = index < activeIndex;
      graphics.fillStyle(active ? uiPalette.amber : complete ? uiPalette.oxidizedGreen : uiPalette.stroke, active ? 0.9 : 0.52);
      graphics.fillRect(x - stepWidth * 0.34, layout.progress.y - 7, stepWidth * 0.68, active ? 3 : 2);
      this.addElement(this.add.text(x, layout.progress.y + 4, label, {
        fontFamily: uiFonts.mono,
        fontSize: "10px",
        color: active ? uiPalette.text : uiPalette.textFaint
      }).setOrigin(0.5, 0));
    });
    this.addElement(graphics);
  }

  private addElement<T extends Phaser.GameObjects.GameObject>(element: T): T {
    applyUiTextResolution(element);
    this.elements.push(element);
    return element;
  }
}
