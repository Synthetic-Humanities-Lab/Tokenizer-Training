import type { LayoutRect } from "../systems/PlayLayoutSystem";
import { uiFonts, uiPalette } from "./VisualTheme";

export interface OverseerPanelLayout {
  panel: LayoutRect;
  label: { x: number; y: number };
  body: { x: number; y: number; fontSize: number; wordWrapWidth: number };
}

export interface OverseerPanelQaState {
  text: string;
  fontSize: number;
  wordWrapWidth: number;
}

export const OVERSEER_COMPACT_MAX_LINES = 3;

export class OverseerPanel {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly chrome: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private compact = false;
  private sourceText = "Awaiting biological tokenizer.";

  constructor(private readonly scene: Phaser.Scene) {
    this.background = scene.add.rectangle(0, 0, 0, 64, uiPalette.panel, 0.91).setOrigin(0.5, 0.5).setDepth(18);
    this.background.setStrokeStyle(1, uiPalette.strokeDark, 0.92);
    this.chrome = scene.add.graphics().setDepth(19);
    this.label = scene.add.text(0, 0, "WIENER / SEGMENTATION ASSISTANT", {
      fontFamily: uiFonts.body,
      fontSize: "11px",
      color: uiPalette.textFaint
    }).setDepth(20);
    this.body = scene.add.text(0, 0, "Awaiting biological tokenizer.", {
      fontFamily: uiFonts.body,
      fontSize: "15px",
      color: uiPalette.text,
      wordWrap: { width: 720 }
    }).setDepth(20);
  }

  layout(width: number, height: number, reservedRight = 0): void {
    const layout = computeOverseerPanelLayout(width, height, reservedRight);
    this.compact = width < 760;
    this.background.setPosition(layout.panel.x, layout.panel.y);
    this.background.setSize(layout.panel.width, layout.panel.height);
    this.drawChrome(layout.panel);
    this.label.setPosition(layout.label.x, layout.label.y);
    this.body.setPosition(layout.body.x, layout.body.y);
    this.body.setStyle({ fontSize: `${layout.body.fontSize}px` });
    this.body.setWordWrapWidth(layout.body.wordWrapWidth);
    this.body.setText(overseerDisplayText(this.sourceText, this.compact));
  }

  setText(value: string): void {
    this.sourceText = value;
    this.body.setText(overseerDisplayText(value, this.compact));
  }

  setVisible(value: boolean): void {
    this.background.setVisible(value);
    this.chrome.setVisible(value);
    this.label.setVisible(value);
    this.body.setVisible(value);
  }

  isVisible(): boolean {
    return this.background.visible;
  }

  qaState(): OverseerPanelQaState {
    const fontSize = Number.parseFloat(String(this.body.style.fontSize));

    return {
      text: this.body.text,
      fontSize: Number.isFinite(fontSize) ? fontSize : 0,
      wordWrapWidth: this.body.style.wordWrapWidth ?? 0
    };
  }

  private drawChrome(panel: LayoutRect): void {
    const left = panel.x - panel.width / 2;
    const top = panel.y - panel.height / 2;

    this.chrome.clear();
    this.chrome.fillStyle(uiPalette.amber, 0.34);
    this.chrome.fillRect(left + 1, top + 1, 4, panel.height - 2);
    this.chrome.fillStyle(uiPalette.panelLight, 0.12);
    this.chrome.fillRect(left + 6, top + 1, panel.width - 8, 8);
    this.chrome.lineStyle(1, uiPalette.stroke, 0.22);
    this.chrome.lineBetween(left + 14, top + panel.height - 13, left + panel.width - 14, top + panel.height - 13);
  }
}

export function overseerDisplayText(value: string, compact: boolean): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!compact) {
    return normalized;
  }

  const introMatch = normalized.match(/^TUTORIAL (\d+\/\d+) - [^:]+:\s+(.+)$/);
  if (introMatch) {
    return `TUTORIAL ${introMatch[1]}: ${firstSentence(introMatch[2])}`;
  }

  const activeMatch = normalized.match(/^TUTORIAL (\d+\/\d+) - (.+)$/);
  if (activeMatch) {
    return `TUTORIAL ${activeMatch[1]}: ${activeMatch[2]}`;
  }

  return normalized;
}

export function computeOverseerPanelLayout(width: number, height: number, reservedRight = 0): OverseerPanelLayout {
  const compact = width < 760;
  const panelWidth = Math.max(280, width - 32 - reservedRight);
  const panelHeight = compact ? 92 : 66;
  const panelX = 16 + panelWidth / 2;
  const panelY = height - panelHeight / 2 - 12;
  const top = panelY - panelHeight / 2;

  return {
    panel: {
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight
    },
    label: {
      x: 28,
      y: top + 12
    },
    body: {
      x: 28,
      y: top + (compact ? 34 : 30),
      fontSize: compact ? 13 : 15,
      wordWrapWidth: panelWidth - 32
    }
  };
}

function firstSentence(value: string): string {
  return value.match(/^.+?[.!?](?:\s|$)/)?.[0]?.trim() ?? value;
}
