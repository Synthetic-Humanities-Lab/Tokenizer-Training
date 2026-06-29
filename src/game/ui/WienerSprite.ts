export const WIENER_TEXTURE_KEY = "wiener-reference";
export const WIENER_REFERENCE_WIDTH = 69;
export const WIENER_REFERENCE_HEIGHT = 89;

export interface WienerSpriteOptions {
  x: number;
  y: number;
  height: number;
  depth?: number;
  alpha?: number;
}

export function addWienerImage(scene: Phaser.Scene, options: WienerSpriteOptions): Phaser.GameObjects.Image {
  const image = scene.add.image(options.x, options.y, WIENER_TEXTURE_KEY);
  image.setOrigin(0.5);
  image.setDisplaySize(options.height * (WIENER_REFERENCE_WIDTH / WIENER_REFERENCE_HEIGHT), options.height);
  image.setDepth(options.depth ?? 20);
  image.setAlpha(options.alpha ?? 1);
  return image;
}

export function sizeWienerImage(image: Phaser.GameObjects.Image, height: number): void {
  image.setDisplaySize(height * (WIENER_REFERENCE_WIDTH / WIENER_REFERENCE_HEIGHT), height);
}
