export const uiPalette = {
  shell: 0xf6f1e8,
  shellWash: 0xefe8dc,
  shellInk: 0x171511,
  scanline: 0xffffff,
  grid: 0xd8d0c3,
  panel: 0xfbf7ef,
  panelLight: 0xfffcf6,
  panelTint: 0xeee5d8,
  panelShadow: 0x191511,
  stroke: 0xd2c8ba,
  strokeDark: 0x958b7d,
  text: "#171511",
  textMuted: "#504a42",
  textFaint: "#7d7469",
  amber: 0xea8b2f,
  amberLight: 0xffc06a,
  blueGrey: 0x9daaad,
  coldGlass: 0xded7cd,
  oxidizedGreen: 0xa8b69a,
  degradedPurple: 0xb7a9a0,
  warning: 0xd65a2b
} as const;

export const uiFonts = {
  body: '"Avenir Next", "Inter", "Trebuchet MS", Verdana, Tahoma, Arial, sans-serif',
  mono: '"IBM Plex Mono", "Courier New", Courier, monospace',
  display: 'Georgia, "Times New Roman", serif'
} as const;

export const buttonVisual = {
  fill: 0xfffcf6,
  fillAlpha: 0.94,
  hoverFill: 0xf2e8da,
  hoverAlpha: 0.98,
  pressFill: 0xe8dccb,
  pressAlpha: 1,
  readyFill: 0xffefd2,
  readyAlpha: 0.98,
  readyHoverFill: 0xffe2b5,
  readyHoverAlpha: 1,
  readyPressFill: 0xf5c785,
  readyPressAlpha: 1,
  readyStroke: 0xd77824,
  disabledFill: 0xe0d8cb,
  disabledAlpha: 0.5,
  stroke: 0xbeb2a3
} as const;

export interface WienerWorksSurfaceOptions {
  topOffset?: number;
  bottomOffset?: number;
  compact?: boolean;
}

export type DegradedSurfaceOptions = WienerWorksSurfaceOptions;

export function drawWienerWorksSurface(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  options: WienerWorksSurfaceOptions = {}
): void {
  const topOffset = options.topOffset ?? 0;
  const bottomOffset = options.bottomOffset ?? 0;
  const workTop = Math.max(0, topOffset - 42);
  const workBottom = Math.max(workTop, height - bottomOffset + 18);

  graphics.clear();
  graphics.fillStyle(uiPalette.shell, 1);
  graphics.fillRect(0, 0, width, height);
  graphics.fillStyle(uiPalette.shellWash, 0.54);
  graphics.fillRect(0, 0, width, height);

  const workLeft = 12;
  const workWidth = Math.max(0, width - 24);
  const workHeight = Math.max(0, height - topOffset - bottomOffset - 18);
  graphics.fillStyle(uiPalette.panelLight, 0.3);
  graphics.fillRoundedRect(workLeft, topOffset + 8, workWidth, workHeight, 6);
  graphics.lineStyle(1, uiPalette.stroke, 0.46);
  graphics.strokeRoundedRect(workLeft, topOffset + 8, workWidth, workHeight, 6);
  graphics.lineStyle(1, uiPalette.scanline, 0.48);
  graphics.lineBetween(18, topOffset + 18, Math.max(18, width - 18), topOffset + 18);
  graphics.lineBetween(18, Math.max(topOffset + 18, height - bottomOffset - 18), Math.max(18, width - 18), Math.max(topOffset + 18, height - bottomOffset - 18));

  graphics.lineStyle(1, uiPalette.grid, 0.33);
  for (let x = options.compact ? 28 : 30; x < width; x += options.compact ? 64 : 72) {
    graphics.lineBetween(x, workTop, x, workBottom);
  }

  graphics.lineStyle(1, uiPalette.scanline, 0.3);
  for (let y = workTop + 18; y < workBottom; y += 42) {
    graphics.lineBetween(18, y, Math.max(18, width - 18), y);
  }

  graphics.fillStyle(uiPalette.panelTint, 0.38);
  graphics.fillRoundedRect(18, Math.min(height - 70, topOffset + 18), Math.max(0, width - 36), 28, 6);
  graphics.fillStyle(uiPalette.amber, 0.34);
  graphics.fillRoundedRect(Math.max(22, width - 184), Math.min(height - 64, topOffset + 22), 132, 3, 2);
  graphics.fillStyle(uiPalette.blueGrey, 0.18);
  graphics.fillRoundedRect(26, Math.max(52, height - bottomOffset - 30), Math.max(0, width - 52), 12, 6);
  graphics.fillStyle(uiPalette.coldGlass, 0.28);
  graphics.fillRoundedRect(30, Math.max(58, height - bottomOffset - 24), Math.max(0, width * 0.22), 4, 2);
  graphics.fillStyle(uiPalette.oxidizedGreen, 0.24);
  graphics.fillCircle(width - 72, Math.max(60, height - bottomOffset - 24), 5);
  graphics.fillCircle(width - 58, Math.max(60, height - bottomOffset - 24), 5);

  graphics.lineStyle(1, uiPalette.strokeDark, 0.24);
  graphics.lineBetween(0, 48, width, 48);
  graphics.lineBetween(0, height - 38, width, height - 38);
  graphics.lineStyle(1, uiPalette.scanline, 0.54);
  graphics.lineBetween(0, 49, width, 49);
}

export function drawDegradedBrowserSurface(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  options: DegradedSurfaceOptions = {}
): void {
  drawWienerWorksSurface(graphics, width, height, options);
}
