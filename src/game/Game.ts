import Phaser from "phaser";
import { createSemanticRuntime, SEMANTIC_RUNTIME_REGISTRY_KEY } from "./semantic/SemanticRuntime";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { PlayScene } from "./scenes/PlayScene";
import { ResultsScene } from "./scenes/ResultsScene";
import { SettingsScene } from "./scenes/SettingsScene";
import { TokenLogScene } from "./scenes/TokenLogScene";
import { TutorialCompleteScene } from "./scenes/TutorialCompleteScene";
import { TutorialScene } from "./scenes/TutorialScene";
import {
  createMotionPreferenceRuntime,
  MOTION_PREFERENCE_REGISTRY_KEY
} from "./systems/MotionPreferenceSystem";
import {
  createHapticPreferenceRuntime,
  HAPTIC_PREFERENCE_REGISTRY_KEY
} from "./systems/HapticPreferenceSystem";
import { qaViewportFromUrl } from "./systems/QaViewportSystem";

export function createGameConfig(parent: string, dev = import.meta.env.DEV): Phaser.Types.Core.GameConfig {
  const qaViewport = dev ? qaViewportFromUrl(globalThis.location?.href) : undefined;

  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#707983",
    preserveDrawingBuffer: dev,
    scale: {
      mode: qaViewport ? Phaser.Scale.NONE : Phaser.Scale.RESIZE,
      autoCenter: qaViewport ? Phaser.Scale.NO_CENTER : Phaser.Scale.CENTER_BOTH,
      width: qaViewport?.width ?? 960,
      height: qaViewport?.height ?? 640
    },
    input: {
      activePointers: 3
    },
    scene: [BootScene, MenuScene, SettingsScene, TokenLogScene, TutorialScene, PlayScene, TutorialCompleteScene, ResultsScene]
  };
}

export function createGame(parent: string): Phaser.Game {
  const semanticRuntime = createSemanticRuntime(parent);
  const motionPreferenceRuntime = createMotionPreferenceRuntime();
  const hapticPreferenceRuntime = createHapticPreferenceRuntime();
  const config = createGameConfig(parent);
  const existingPreBoot = config.callbacks?.preBoot;

  config.callbacks = {
    ...config.callbacks,
    preBoot(game) {
      game.registry.set(SEMANTIC_RUNTIME_REGISTRY_KEY, semanticRuntime);
      game.registry.set(MOTION_PREFERENCE_REGISTRY_KEY, motionPreferenceRuntime);
      game.registry.set(HAPTIC_PREFERENCE_REGISTRY_KEY, hapticPreferenceRuntime);
      game.events.once(Phaser.Core.Events.DESTROY, () => {
        semanticRuntime.destroy();
        motionPreferenceRuntime.destroy();
      });
      existingPreBoot?.(game);
    }
  };

  try {
    return new Phaser.Game(config);
  } catch (error) {
    semanticRuntime.destroy();
    motionPreferenceRuntime.destroy();
    throw error;
  }
}
