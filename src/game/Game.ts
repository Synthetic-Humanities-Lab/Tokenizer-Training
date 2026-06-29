import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { PlayScene } from "./scenes/PlayScene";
import { ResultsScene } from "./scenes/ResultsScene";
import { TutorialCompleteScene } from "./scenes/TutorialCompleteScene";
import { TutorialScene } from "./scenes/TutorialScene";
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
    scene: [BootScene, MenuScene, TutorialScene, PlayScene, TutorialCompleteScene, ResultsScene]
  };
}

export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game(createGameConfig(parent));
}
