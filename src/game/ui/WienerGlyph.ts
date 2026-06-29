import { uiPalette } from "./VisualTheme";

export type WienerGlyphMood = "idle" | "teaching" | "snark" | "alarm" | "disappointed" | "neutral";

export interface WienerGlyphOptions {
  x: number;
  y: number;
  scale?: number;
  mood?: WienerGlyphMood;
}

export function drawWienerGlyph(
  graphics: Phaser.GameObjects.Graphics,
  { x, y, scale = 3, mood = "neutral" }: WienerGlyphOptions
): void {
  const drawPixel = (px: number, py: number, width: number, height: number, color: number, alpha = 1) => {
    graphics.fillStyle(color, alpha);
    graphics.fillRect(x + px * scale, y + py * scale, width * scale, height * scale);
  };

  const outline = 0x201814;
  const bunEdge = 0x9b5a2d;
  const bun = 0xeaa966;
  const bunLight = 0xf6d28e;
  const bunShadow = 0xbd743c;
  const sausage = 0xb64830;
  const sausageDark = 0x7e2b20;
  const sausageLight = 0xc85c3b;
  const sausageHighlight = 0xe07a51;
  const mustard = 0xf3cd4e;

  const drawRows = (rows: readonly (readonly [number, number, number])[], color: number, alpha = 1) => {
    for (const [rowX, rowY, rowWidth] of rows) {
      drawPixel(rowX, rowY, rowWidth, 1, color, alpha);
    }
  };

  if (mood === "idle") {
    const idleOutlineRows = [
      [7, 9, 11],
      [5, 10, 17],
      [3, 11, 22],
      [2, 12, 25],
      [1, 13, 26],
      [1, 14, 27],
      [2, 15, 26],
      [3, 16, 24],
      [5, 17, 19],
      [8, 18, 12]
    ] as const;
    const idleSausageRows = [
      [10, 10, 6],
      [8, 11, 10],
      [7, 12, 12],
      [6, 13, 14],
      [6, 14, 14],
      [7, 15, 12],
      [8, 16, 10],
      [11, 17, 5]
    ] as const;
    const idleFrontBunRows = [
      [18, 11, 4],
      [19, 12, 6],
      [20, 13, 6],
      [20, 14, 7],
      [19, 15, 6],
      [18, 16, 5]
    ] as const;

    drawRows(idleOutlineRows, outline);
    idleOutlineRows.forEach(([rowX, rowY, rowWidth], index) => {
      drawPixel(rowX + 1, rowY, rowWidth - 2, 1, index % 3 === 0 ? bunLight : bun);
      drawPixel(rowX + rowWidth - 5, rowY, 3, 1, bunShadow, 0.72);
    });
    idleSausageRows.forEach(([rowX, rowY, rowWidth], index) => {
      drawPixel(rowX, rowY, rowWidth, 1, sausageDark);
      drawPixel(rowX + 1, rowY, rowWidth - 2, 1, index % 3 === 0 ? sausageLight : sausage);
    });
    idleFrontBunRows.forEach(([rowX, rowY, rowWidth], index) => {
      drawPixel(rowX, rowY, rowWidth, 1, bunEdge);
      drawPixel(rowX + 1, rowY, rowWidth - 1, 1, index % 3 === 0 ? bunLight : bun);
    });
    for (const [px, py] of [
      [9, 12],
      [13, 12],
      [17, 13],
      [20, 14],
      [14, 15],
      [8, 15]
    ] as const) {
      drawPixel(px, py, 1, 1, mustard);
    }
    drawPixel(2, 18, 22, 2, uiPalette.strokeDark, 0.16);
    drawPixel(11, 13, 1, 1, outline, 0.62);
    drawPixel(15, 13, 1, 1, outline, 0.62);
    drawPixel(13, 15, 4, 1, outline, 0.56);
    return;
  }

  const bunRows = [
    [16, 0, 5],
    [14, 1, 9],
    [12, 2, 12],
    [11, 3, 14],
    [9, 4, 17],
    [8, 5, 18],
    [7, 6, 19],
    [6, 7, 20],
    [5, 8, 21],
    [4, 9, 21],
    [3, 10, 22],
    [3, 11, 21],
    [2, 12, 21],
    [2, 13, 20],
    [2, 14, 19],
    [2, 15, 18],
    [2, 16, 17],
    [3, 17, 16],
    [3, 18, 15],
    [4, 19, 14],
    [5, 20, 12],
    [6, 21, 10],
    [8, 22, 7],
    [10, 23, 4]
  ] as const;
  const sausageRows = [
    [15, 2, 4],
    [14, 3, 5],
    [13, 4, 6],
    [12, 5, 7],
    [11, 6, 8],
    [10, 7, 8],
    [9, 8, 8],
    [8, 9, 8],
    [7, 10, 8],
    [6, 11, 8],
    [6, 12, 7],
    [5, 13, 7],
    [5, 14, 6],
    [5, 15, 6],
    [5, 16, 5],
    [5, 17, 5],
    [6, 18, 4],
    [6, 19, 3],
    [7, 20, 2]
  ] as const;
  const frontBunRows = [
    [19, 2, 3],
    [18, 3, 5],
    [18, 4, 6],
    [17, 5, 7],
    [17, 6, 8],
    [16, 7, 9],
    [16, 8, 9],
    [15, 9, 9],
    [15, 10, 9],
    [14, 11, 9],
    [14, 12, 8],
    [13, 13, 8],
    [13, 14, 7],
    [12, 15, 7],
    [12, 16, 6],
    [11, 17, 6],
    [11, 18, 5],
    [10, 19, 5],
    [10, 20, 4]
  ] as const;

  drawRows(bunRows, outline);
  bunRows.forEach(([rowX, rowY, rowWidth], index) => {
    if (rowWidth > 4) {
      drawPixel(rowX + 1, rowY, rowWidth - 2, 1, bunEdge);
    }

    if (rowWidth > 7) {
      drawPixel(rowX + 2, rowY, rowWidth - 4, 1, index % 5 === 0 ? bunLight : bun);
      drawPixel(rowX + rowWidth - 6, rowY, 4, 1, bunLight, 0.86);
      drawPixel(rowX + rowWidth - 3, rowY, 1, 1, bunShadow, 0.72);
    }
  });

  sausageRows.forEach(([rowX, rowY, rowWidth], index) => {
    drawPixel(rowX - 1, rowY, rowWidth + 2, 1, outline);
    drawPixel(rowX, rowY, rowWidth, 1, sausageDark);
    if (rowWidth > 4) {
      drawPixel(rowX + 1, rowY, rowWidth - 2, 1, index % 4 === 0 ? sausageLight : sausage);
      drawPixel(rowX + Math.max(1, Math.floor(rowWidth * 0.34)), rowY, 2, 1, sausageHighlight, 0.58);
    }
  });
  frontBunRows.forEach(([rowX, rowY, rowWidth], index) => {
    drawPixel(rowX, rowY, rowWidth, 1, bunEdge);
    if (rowWidth > 2) {
      drawPixel(rowX + 1, rowY, rowWidth - 1, 1, index % 5 === 0 ? bunLight : bun);
      drawPixel(rowX + rowWidth - 2, rowY, 1, 1, bunShadow, 0.68);
    }
  });

  for (const [px, py, w] of [
    [16, 3, 1],
    [15, 4, 1],
    [13, 6, 1],
    [12, 7, 1],
    [10, 9, 1],
    [9, 10, 1],
    [7, 12, 1],
    [6, 14, 1],
    [6, 16, 1],
    [7, 18, 1]
  ] as const) {
    drawPixel(px, py, w, 1, mustard);
  }

  for (const [px, py] of [
    [20, 6],
    [18, 9],
    [16, 13],
    [14, 16]
  ] as const) {
    drawPixel(px, py, 1, 1, bunLight, 0.9);
  }

  drawPixel(24, 2, 1, 3, outline, 0.9);
  drawPixel(25, 1, 2, 1, outline, 0.9);
  drawPixel(27, 0, 1, 2, outline, 0.9);
  drawPixel(3, 13, 1, 3, outline, 0.88);
  drawPixel(1, 15, 3, 1, outline, 0.88);
  drawPixel(8, 23, 1, 3, outline, 0.92);
  drawPixel(6, 26, 4, 1, outline, 0.92);
  drawPixel(14, 21, 1, 3, outline, 0.9);
  drawPixel(14, 24, 4, 1, outline, 0.9);

  drawPixel(15, 5, 1, 1, outline);
  drawPixel(12, 8, 1, 1, outline);
  drawPixel(16, 4, 1, 1, 0xffffff, 0.5);

  if (mood === "alarm") {
    drawPixel(15, 4, 4, 1, uiPalette.warning);
    drawPixel(11, 8, 5, 1, uiPalette.warning);
    drawPixel(9, 10, 5, 1, uiPalette.warning);
    drawPixel(21, 0, 1, 2, uiPalette.warning);
    drawPixel(23, 0, 1, 1, uiPalette.warning);
  } else if (mood === "disappointed") {
    drawPixel(10, 11, 4, 1, 0x5c332a);
    drawPixel(14, 5, 3, 1, 0x5c332a);
    drawPixel(11, 8, 3, 1, 0x5c332a);
    drawPixel(4, 21, 8, 2, uiPalette.strokeDark, 0.16);
  } else if (mood === "snark") {
    drawPixel(14, 4, 4, 1, outline);
    drawPixel(11, 8, 4, 1, outline);
    drawPixel(9, 10, 3, 1, outline);
    drawPixel(6, 19, 4, 1, outline);
  } else if (mood === "teaching") {
    drawPixel(10, 10, 3, 1, outline);
    drawPixel(21, 10, 5, 1, uiPalette.blueGrey);
    drawPixel(25, 8, 1, 4, uiPalette.blueGrey);
    drawPixel(26, 8, 2, 1, uiPalette.blueGrey, 0.7);
  } else {
    drawPixel(10, 10, 3, 1, outline);
  }
}
