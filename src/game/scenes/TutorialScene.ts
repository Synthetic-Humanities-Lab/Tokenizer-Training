import Phaser from "phaser";

export class TutorialScene extends Phaser.Scene {
  constructor() {
    super("TutorialScene");
  }

  create(): void {
    this.scene.start("PlayScene", { tutorial: true });
  }
}
