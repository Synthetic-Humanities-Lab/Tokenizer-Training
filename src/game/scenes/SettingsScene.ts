import Phaser from "phaser";
import {
  readSemanticRuntime,
  type SemanticAnnouncement,
  type SemanticLease
} from "../semantic/SemanticRuntime";
import { AudioSystem } from "../systems/AudioSystem";
import { bindCanvasButtonActivation } from "../systems/CanvasButtonActivationSystem";
import {
  BestRankResetSystem,
  bestRankStatus,
  RESET_BEST_RANK_CANCEL_LABEL,
  RESET_BEST_RANK_CONFIRM_LABEL,
  RESET_BEST_RANK_MESSAGE,
  RESET_BEST_RANK_TITLE
} from "../systems/BestRankResetSystem";
import { clearGameQaSnapshot, writeGameQaSnapshot, type GameQaElement } from "../systems/GameQaSystem";
import {
  HapticFeedbackSystem,
  hapticFeedbackCapability,
  type HapticFeedbackCapability
} from "../systems/HapticFeedbackSystem";
import {
  readHapticPreferenceRuntime,
  type HapticPreferenceRuntime,
  type HapticPreferenceSnapshot
} from "../systems/HapticPreferenceSystem";
import { readSafeAreaInsetsForSurface } from "../systems/SafeAreaSystem";
import { computeSettingsLayout, type SettingsLayout } from "../systems/SettingsLayoutSystem";
import { StorageSystem } from "../systems/StorageSystem";
import { readSurfaceProfile } from "../systems/SurfaceProfileSystem";
import {
  motionPreferenceLabel,
  MOTION_PREFERENCE_REGISTRY_KEY,
  type MotionPreferenceRuntime,
  type MotionPreferenceSnapshot,
  unsupportedMotionPreference
} from "../systems/MotionPreferenceSystem";
import {
  settingsResetAnnouncement,
  settingsSemanticSnapshot
} from "../systems/SettingsSemanticSystem";
import {
  applyUiTextResolution,
  buttonVisual,
  drawDegradedBrowserSurface,
  uiFonts,
  uiPalette
} from "../ui/VisualTheme";

interface SettingsSceneData {
  resetConfirmation?: boolean;
  semanticEntry?: boolean;
}

export class SettingsScene extends Phaser.Scene {
  private readonly storage = new StorageSystem();
  private readonly audio = new AudioSystem(this.storage.loadMuted());
  private readonly haptics = new HapticFeedbackSystem(true);
  private readonly bestRankReset = new BestRankResetSystem(this.storage);
  private hapticPreferenceRuntime!: HapticPreferenceRuntime;
  private motionPreferenceRuntime!: MotionPreferenceRuntime;
  private elements: Phaser.GameObjects.GameObject[] = [];
  private soundText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private reducedMotionText?: Phaser.GameObjects.Text;
  private hapticText?: Phaser.GameObjects.Text;
  private motionPreference: Readonly<MotionPreferenceSnapshot> = unsupportedMotionPreference();
  private hapticCapability: Readonly<HapticFeedbackCapability> = hapticFeedbackCapability();
  private hapticPreference: Readonly<HapticPreferenceSnapshot> = {
    enabled: false,
    persisted: false,
    source: "unavailable"
  };
  private resetConfirmationOnCreate = false;
  private semanticEntryOnCreate = false;
  private unsubscribeMotionPreference?: () => void;
  private semanticLease?: SemanticLease;
  private navigationStarted = false;
  private semanticReady = false;
  private semanticResetModal = false;
  private motionAnnouncementSequence = 0;
  private pendingSemanticAnnouncement?: SemanticAnnouncement;

  constructor() {
    super("SettingsScene");
  }

  init(data: SettingsSceneData = {}): void {
    this.resetConfirmationOnCreate = data.resetConfirmation === true;
    this.semanticEntryOnCreate = data.semanticEntry === true;
  }

  create(): void {
    this.navigationStarted = false;
    this.semanticReady = false;
    this.semanticResetModal = this.resetConfirmationOnCreate && this.semanticEntryOnCreate;
    this.pendingSemanticAnnouncement = undefined;
    this.bestRankReset.reset();
    if (this.resetConfirmationOnCreate) {
      this.bestRankReset.request();
    }
    this.audio.setMuted(this.storage.loadMuted());
    const hapticPreferenceRuntime = readHapticPreferenceRuntime(this.registry);
    if (!hapticPreferenceRuntime) {
      throw new Error("SettingsScene requires the shared haptic preference runtime.");
    }
    this.hapticPreferenceRuntime = hapticPreferenceRuntime;
    this.hapticCapability = hapticFeedbackCapability();
    this.hapticPreference = this.hapticPreferenceRuntime.snapshot(this.hapticCapability.available);
    this.haptics.setMuted(!this.hapticPreference.enabled);
    const motionRuntime = this.registry.get(MOTION_PREFERENCE_REGISTRY_KEY) as MotionPreferenceRuntime | undefined;
    if (!motionRuntime) {
      throw new Error("SettingsScene requires the shared motion preference runtime.");
    }
    this.motionPreferenceRuntime = motionRuntime;
    this.motionPreference = motionRuntime.snapshot();
    this.semanticLease?.dispose();
    this.semanticLease = readSemanticRuntime(this.registry)?.mount("settings", (actionId, checked) => {
      this.handleSemanticAction(actionId, checked);
    });
    this.unsubscribeMotionPreference = motionRuntime?.subscribe((snapshot) => {
      if (
        snapshot.reduced === this.motionPreference.reduced
        && snapshot.supported === this.motionPreference.supported
      ) {
        return;
      }
      this.motionPreference = snapshot;
      if (this.semanticReady) {
        this.pendingSemanticAnnouncement = {
          id: `settings:motion:${++this.motionAnnouncementSequence}`,
          text: motionPreferenceLabel(snapshot),
          politeness: "polite"
        };
      }
      this.render();
    });
    this.scale.on("resize", this.render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.navigationStarted = true;
      this.semanticReady = false;
      this.scale.off("resize", this.render, this);
      this.unsubscribeMotionPreference?.();
      this.unsubscribeMotionPreference = undefined;
      this.semanticLease?.dispose();
      this.semanticLease = undefined;
      clearGameQaSnapshot();
    });
    this.render();
    this.semanticReady = true;
    if (this.semanticEntryOnCreate) {
      if (this.bestRankReset.snapshot().phase === "confirming") {
        this.semanticLease?.focusAction("reset-cancel");
      } else {
        this.semanticLease?.focusHeading();
      }
    }
  }

  private render(): void {
    this.elements.forEach((element) => element.destroy());
    this.elements = [];
    this.soundText = undefined;
    this.statusText = undefined;
    this.reducedMotionText = undefined;
    this.hapticText = undefined;

    const width = this.scale.width;
    const height = this.scale.height;
    this.hapticCapability = hapticFeedbackCapability();
    this.hapticPreference = this.hapticPreferenceRuntime.snapshot(this.hapticCapability.available);
    const layout = this.currentLayout();
    const highScore = this.storage.loadHighScore();
    const resetSnapshot = this.bestRankReset.snapshot();
    const bestRankStatusText = bestRankStatus(highScore, resetSnapshot);

    this.addElement(this.add.rectangle(width / 2, height / 2, width, height, uiPalette.shell));
    this.addGrid(width, height);
    this.addElement(this.add.rectangle(layout.card.x + 4, layout.card.y + 5, layout.card.width, layout.card.height, uiPalette.panelShadow, 0.14));
    this.addElement(this.add.rectangle(layout.card.x, layout.card.y, layout.card.width, layout.card.height, uiPalette.panel, 0.96).setStrokeStyle(1, uiPalette.strokeDark, 0.78));
    this.addCardBottomRail(layout);
    this.addElement(this.add.text(layout.title.x, layout.title.y, "Settings", {
      fontFamily: uiFonts.display,
      fontSize: `${layout.title.fontSize}px`,
      color: uiPalette.text,
      align: "center",
      wordWrap: { width: layout.title.width }
    }).setOrigin(0.5));
    const status = this.add.text(layout.status.x, layout.status.y, bestRankStatusText, {
      fontFamily: uiFonts.body,
      fontSize: `${layout.status.fontSize}px`,
      color: uiPalette.textMuted,
      align: "center",
      wordWrap: { width: layout.status.width }
    }).setOrigin(0.5);
    this.statusText = status;
    this.addElement(status);
    const targetMuted = !this.audio.isMuted();
    this.createButton(layout.soundButton, this.soundLabel(), () => {
      this.commandSetSoundMuted(targetMuted);
    }, (text) => {
      this.soundText = text;
    });
    this.createButton(layout.resetButton, "Reset Best Rank", () => {
      this.commandRequestBestRankReset(false);
    });
    const targetReducedMotion = !this.motionPreference.reduced;
    this.createButton(layout.reducedMotionControl, motionPreferenceLabel(this.motionPreference), () => {
      this.commandSetReducedMotion(targetReducedMotion);
    }, (text) => {
      this.reducedMotionText = text;
    });
    if (this.hapticCapability.available) {
      const targetHapticsEnabled = !this.hapticPreference.enabled;
      this.createButton(layout.hapticsControl, this.hapticLabel(), () => {
        this.commandSetHapticsEnabled(targetHapticsEnabled);
      }, (text) => {
        this.hapticText = text;
      });
    }
    this.createButton(layout.backButton, "Back", () => {
      this.commandBack(false);
    });
    if (resetSnapshot.phase === "confirming") {
      this.createResetConfirmation(layout);
    }
    this.writeQaSnapshot(layout);
    this.semanticLease?.publish(settingsSemanticSnapshot({
      bestRankStatus: bestRankStatusText,
      muted: this.audio.isMuted(),
      motionPreference: this.motionPreference,
      hapticCapability: this.hapticCapability,
      hapticPreference: this.hapticPreference,
      reset: resetSnapshot,
      dialogModal: this.semanticResetModal,
      announcement: this.pendingSemanticAnnouncement
    }));
    this.pendingSemanticAnnouncement = undefined;
  }

  private handleSemanticAction(actionId: string, requestedChecked?: boolean): void {
    switch (actionId) {
      case "sound":
        if (typeof requestedChecked === "boolean") {
          this.commandSetSoundMuted(!requestedChecked);
        }
        return;
      case "reset-best-rank":
        this.commandRequestBestRankReset(true);
        return;
      case "reset-cancel":
        this.commandCancelBestRankReset(true);
        return;
      case "reset-confirm":
        this.commandConfirmBestRankReset(true);
        return;
      case "reduced-motion":
        if (typeof requestedChecked === "boolean") {
          this.commandSetReducedMotion(requestedChecked);
        }
        return;
      case "haptics":
        if (this.hapticCapability.available && typeof requestedChecked === "boolean") {
          this.commandSetHapticsEnabled(requestedChecked);
        }
        return;
      case "back":
        this.commandBack(true);
    }
  }

  private commandSetSoundMuted(targetMuted: boolean): void {
    if (this.audio.isMuted() === targetMuted) {
      return;
    }

    this.audio.setMuted(targetMuted);
    this.storage.saveMuted(targetMuted);
    if (!targetMuted) {
      this.audio.play("ui");
    }
    this.render();
  }

  private commandSetHapticsEnabled(targetEnabled: boolean): void {
    if (!this.hapticCapability.available || this.hapticPreference.enabled === targetEnabled) {
      return;
    }

    this.hapticPreference = this.hapticPreferenceRuntime.setEnabled(targetEnabled);
    this.haptics.setMuted(!this.hapticPreference.enabled);
    if (this.hapticPreference.enabled) {
      this.haptics.play("confirm", "touch");
    }
    this.render();
  }

  private commandSetReducedMotion(targetReduced: boolean): void {
    if (this.motionPreference.reduced === targetReduced) {
      return;
    }

    this.audio.play("ui");
    this.motionPreferenceRuntime.setReduced(targetReduced);
  }

  private commandRequestBestRankReset(semanticSource: boolean): void {
    this.audio.play("ui");
    this.bestRankReset.request();
    this.semanticResetModal = semanticSource;
    this.render();
    if (semanticSource) {
      this.semanticLease?.focusAction("reset-cancel");
    }
  }

  private commandCancelBestRankReset(semanticSource: boolean): void {
    this.audio.play("ui");
    this.bestRankReset.cancel();
    this.semanticResetModal = false;
    this.render();
    if (semanticSource) {
      this.semanticLease?.focusAction("reset-best-rank");
    }
  }

  private commandConfirmBestRankReset(semanticSource: boolean): void {
    this.audio.play("ui");
    const resetSnapshot = this.bestRankReset.confirm();
    this.semanticResetModal = false;
    this.pendingSemanticAnnouncement = settingsResetAnnouncement(
      resetSnapshot,
      bestRankStatus(this.storage.loadHighScore(), resetSnapshot)
    );
    this.render();
    if (semanticSource) {
      this.semanticLease?.focusAction("reset-best-rank");
    }
  }

  private commandBack(restoreSemanticFocus: boolean): void {
    if (this.navigationStarted) {
      return;
    }

    this.navigationStarted = true;
    this.audio.play("ui");
    if (restoreSemanticFocus) {
      this.scene.start("MenuScene", { semanticFocusActionId: "settings" });
      return;
    }
    this.scene.start("MenuScene");
  }

  private soundLabel(): string {
    return this.audio.isMuted() ? "Sound: Off" : "Sound: On";
  }

  private hapticLabel(): string {
    return this.hapticPreference.enabled ? "Haptics: On" : "Haptics: Off";
  }

  private currentLayout(): SettingsLayout {
    const surfaceProfile = readSurfaceProfile();
    return computeSettingsLayout(
      this.scale.width,
      this.scale.height,
      surfaceProfile === "mobile",
      readSafeAreaInsetsForSurface(surfaceProfile),
      this.hapticCapability.available
    );
  }

  private createButton(
    bounds: SettingsLayout["soundButton"],
    label: string,
    action: () => void,
    bindText?: (text: Phaser.GameObjects.Text) => void,
    options: { destructive?: boolean } = {}
  ): void {
    const fill = options.destructive ? 0xfff6ef : buttonVisual.fill;
    const hoverFill = options.destructive ? 0xf8e2d5 : buttonVisual.hoverFill;
    const pressFill = options.destructive ? 0xf0c6af : buttonVisual.pressFill;
    const stroke = options.destructive ? uiPalette.warning : buttonVisual.stroke;
    const button = this.add.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, fill, buttonVisual.fillAlpha).setStrokeStyle(1, stroke);
    const text = this.add.text(bounds.x, bounds.y, label, {
      fontFamily: uiFonts.body,
      fontSize: bounds.height <= 38 ? "12px" : "15px",
      color: options.destructive ? "#a53e1d" : uiPalette.text
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    bindCanvasButtonActivation({
      button,
      input: this.input,
      onRest: () => button.setFillStyle(fill, buttonVisual.fillAlpha),
      onHover: () => button.setFillStyle(hoverFill, buttonVisual.hoverAlpha),
      onPress: () => button.setFillStyle(pressFill, buttonVisual.pressAlpha),
      onActivate: action
    });
    bindText?.(text);
    this.addElement(button);
    this.addElement(text);
  }

  private createResetConfirmation(layout: SettingsLayout): void {
    const blocker = this.add.rectangle(
      layout.card.x,
      layout.card.y,
      layout.card.width,
      layout.card.height,
      uiPalette.panelShadow,
      0.32
    ).setInteractive();
    blocker.name = "resetDialogBlocker";
    this.addElement(blocker);

    this.addElement(this.add.rectangle(
      layout.resetDialog.x + 4,
      layout.resetDialog.y + 5,
      layout.resetDialog.width,
      layout.resetDialog.height,
      uiPalette.panelShadow,
      0.2
    ));
    this.addElement(this.add.rectangle(
      layout.resetDialog.x,
      layout.resetDialog.y,
      layout.resetDialog.width,
      layout.resetDialog.height,
      uiPalette.panelLight,
      1
    ).setStrokeStyle(1, uiPalette.strokeDark, 0.94));
    this.addElement(this.add.text(
      layout.resetDialogTitle.x,
      layout.resetDialogTitle.y,
      RESET_BEST_RANK_TITLE,
      {
        fontFamily: uiFonts.display,
        fontSize: `${layout.resetDialogTitle.fontSize}px`,
        color: uiPalette.text,
        align: "center",
        wordWrap: { width: layout.resetDialogTitle.width }
      }
    ).setOrigin(0.5));
    this.addElement(this.add.text(
      layout.resetDialogMessage.x,
      layout.resetDialogMessage.y,
      RESET_BEST_RANK_MESSAGE,
      {
        fontFamily: uiFonts.body,
        fontSize: `${layout.resetDialogMessage.fontSize}px`,
        color: uiPalette.textMuted,
        align: "center",
        lineSpacing: 2,
        wordWrap: { width: layout.resetDialogMessage.width }
      }
    ).setOrigin(0.5));
    this.createButton(layout.resetCancelButton, RESET_BEST_RANK_CANCEL_LABEL, () => {
      this.commandCancelBestRankReset(false);
    });
    this.createButton(layout.resetConfirmButton, RESET_BEST_RANK_CONFIRM_LABEL, () => {
      this.commandConfirmBestRankReset(false);
    }, undefined, { destructive: true });
  }

  private addGrid(width: number, height: number): void {
    const grid = this.add.graphics();
    drawDegradedBrowserSurface(grid, width, height, { compact: width < 620 });
    this.addElement(grid);
  }

  private addCardBottomRail(layout: SettingsLayout): void {
    const rail = this.add.graphics();
    const railWidth = Math.max(0, layout.card.width - 48);
    rail.fillStyle(0x6e665c, 0.08);
    rail.fillRoundedRect(
      layout.card.x - railWidth / 2,
      layout.card.y + layout.card.height / 2 - 30,
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

  private writeQaSnapshot(layout: SettingsLayout): void {
    if (!import.meta.env.DEV) {
      return;
    }

    const resetSnapshot = this.bestRankReset.snapshot();
    const elements: GameQaElement[] = [
      { id: "card", rect: rectToQa(layout.card) },
      { id: "title", text: "Settings", rect: textRect(layout.title.x, layout.title.y, layout.title.width, layout.title.fontSize) },
      {
        id: "status",
        text: this.statusText?.text,
        rect: this.statusText
          ? phaserBoundsToQa(this.statusText.getBounds())
          : textRect(layout.status.x, layout.status.y, layout.status.width, layout.status.fontSize)
      }
    ];

    if (resetSnapshot.phase === "confirming") {
      elements.push(
        { id: "resetDialog", rect: rectToQa(layout.resetDialog) },
        {
          id: "resetDialogTitle",
          text: RESET_BEST_RANK_TITLE,
          rect: textRect(
            layout.resetDialogTitle.x,
            layout.resetDialogTitle.y,
            layout.resetDialogTitle.width,
            layout.resetDialogTitle.fontSize
          )
        },
        {
          id: "resetDialogMessage",
          text: RESET_BEST_RANK_MESSAGE,
          rect: textRect(
            layout.resetDialogMessage.x,
            layout.resetDialogMessage.y,
            layout.resetDialogMessage.width,
            layout.resetDialogMessage.fontSize,
            4
          )
        },
        { id: "resetCancelButton", text: RESET_BEST_RANK_CANCEL_LABEL, rect: rectToQa(layout.resetCancelButton) },
        { id: "resetConfirmButton", text: RESET_BEST_RANK_CONFIRM_LABEL, rect: rectToQa(layout.resetConfirmButton) }
      );
    } else {
      elements.push(
        { id: "soundButton", text: this.soundLabel(), rect: rectToQa(layout.soundButton) },
        { id: "resetButton", text: "Reset Best Rank", rect: rectToQa(layout.resetButton) },
        {
          id: "reducedMotion",
          text: motionPreferenceLabel(this.motionPreference),
          rect: rectToQa(layout.reducedMotionControl)
        },
        { id: "backButton", text: "Back", rect: rectToQa(layout.backButton) }
      );
      if (this.hapticCapability.available) {
        elements.splice(elements.length - 1, 0, {
          id: "haptics",
          text: this.hapticLabel(),
          rect: rectToQa(layout.hapticsControl)
        });
      }
    }

    writeGameQaSnapshot({
      scene: "SettingsScene",
      compact: layout.card.width < 520,
      viewport: { width: this.scale.width, height: this.scale.height },
      state: {
        muted: this.audio.isMuted(),
        highScorePresent: this.storage.loadHighScore() !== null,
        reducedMotion: this.motionPreference.reduced,
        motionPreferenceSupported: this.motionPreference.supported,
        hapticFeedbackAvailable: this.hapticCapability.available,
        hapticFeedbackRoute: this.hapticCapability.route,
        hapticsEnabled: this.hapticPreference.enabled,
        hapticPreferencePersisted: this.hapticPreference.persisted,
        hapticPreferenceSource: this.hapticPreference.source,
        bestRankResetPhase: resetSnapshot.phase,
        bestRankResetOutcome: resetSnapshot.outcome
      },
      elements
    });
  }
}

function rectToQa(rect: SettingsLayout["card"]) {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

function textRect(x: number, y: number, width: number, fontSize: number, lineCount = 1) {
  return { x, y, width, height: fontSize * 1.4 * lineCount };
}

function phaserBoundsToQa(bounds: Phaser.Geom.Rectangle) {
  return {
    x: bounds.centerX,
    y: bounds.centerY,
    width: bounds.width,
    height: bounds.height
  };
}
