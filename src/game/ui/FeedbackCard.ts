import type { EconomyTone, FeedbackSummary } from "../systems/FeedbackSystem";
import {
  computePlayLayout,
  shortLandscapeReviewColumns,
  usesShortLandscapeReviewLayout
} from "../systems/PlayLayoutSystem";
import { uiFonts, uiPalette } from "./VisualTheme";

export interface FeedbackCardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  compact: boolean;
  shortLandscape?: boolean;
}

export interface FeedbackCardTextLayout {
  technical: FeedbackCardTextBlock;
  tokenSplit: FeedbackCardTextBlock;
  economy: FeedbackCardTextBlock;
  cuts: FeedbackCardTextBlock;
}

export interface FeedbackCardTextBlock {
  x: number;
  y: number;
  fontSize: number;
  wordWrapWidth: number;
  align?: "left" | "center";
  originX?: number;
}

export interface FeedbackCardQaState {
  text: string;
  technical: string;
  tokenSplit: string;
  economy: string;
  audit: string;
}

export const FEEDBACK_CARD_CONTROL_CLEARANCE = 12;
const DESKTOP_FEEDBACK_CARD_MIN_WIDTH = 560;
const DESKTOP_FEEDBACK_CARD_DEFAULT_WIDTH = 640;
const DESKTOP_FEEDBACK_CARD_MAX_WIDTH = 700;
const DESKTOP_FEEDBACK_CARD_HEIGHT = 160;

export function computeFeedbackCardLayout(
  width: number,
  height: number,
  bounds?: { x: number; width: number },
  summary?: FeedbackSummary
): FeedbackCardLayout {
  const compact = width < 760;
  const shortLandscape = !compact && usesShortLandscapeReviewLayout({ width, height });
  const shortColumns = shortLandscape ? shortLandscapeReviewColumns({ width, height }) : undefined;
  const cardWidth = shortColumns?.feedback.width
    ?? (compact
      ? width - 32
      : Math.min(
          desktopFeedbackCardWidth(summary),
          !bounds ? width - 32 : Math.max(280, bounds.width - 22)
        ));
  const cardHeight = compact
    ? compactFeedbackCardHeight(width, height)
    : shortLandscape
      ? shortLandscapeFeedbackCardHeight(width, height)
      : DESKTOP_FEEDBACK_CARD_HEIGHT;

  return {
    x: shortColumns?.feedback.x ?? (compact || !bounds ? width / 2 : bounds.x),
    y: compact
      ? compactFeedbackCardY(width, height, cardHeight)
      : shortLandscape
        ? shortLandscapeFeedbackCardY(width, height, cardHeight)
        : desktopFeedbackCardY(width, height, cardHeight),
    width: cardWidth,
    height: cardHeight,
    compact,
    shortLandscape
  };
}

export function computeFeedbackCardTextLayout(layout: FeedbackCardLayout): FeedbackCardTextLayout {
  const dense = layout.compact || layout.shortLandscape === true;
  const inset = dense ? 14 : 18;
  const wordWrapWidth = layout.width - inset * 2;
  const top = layout.y - layout.height / 2;

  if (dense) {
    const tight = layout.height < 132;
    const tokenFontSize = layout.shortLandscape ? 15 : layout.width < 340 ? 14 : 15;
    return {
      technical: {
        x: layout.x,
        y: top + 10,
        fontSize: tight ? 14 : layout.shortLandscape ? 16 : 17,
        wordWrapWidth,
        align: "center",
        originX: 0.5
      },
      tokenSplit: {
        x: layout.x,
        y: top + (tight ? 34 : 40),
        fontSize: tight ? 13 : tokenFontSize,
        wordWrapWidth,
        align: "center",
        originX: 0.5
      },
      economy: {
        x: layout.x,
        y: top + (tight ? 82 : 92),
        fontSize: 12,
        wordWrapWidth,
        align: "center",
        originX: 0.5
      },
      cuts: {
        x: layout.x,
        y: top + (tight ? 104 : 130),
        fontSize: 9,
        wordWrapWidth,
        align: "center",
        originX: 0.5
      }
    };
  }

  return {
    technical: { x: layout.x, y: top + 16, fontSize: 20, wordWrapWidth, align: "center", originX: 0.5 },
    tokenSplit: { x: layout.x, y: top + 46, fontSize: 20, wordWrapWidth, align: "center", originX: 0.5 },
    economy: { x: layout.x, y: top + 94, fontSize: 15, wordWrapWidth, align: "center", originX: 0.5 },
    cuts: { x: layout.x, y: top + 121, fontSize: 13, wordWrapWidth, align: "center", originX: 0.5 }
  };
}

function desktopFeedbackCardWidth(summary?: FeedbackSummary): number {
  if (!summary) {
    return DESKTOP_FEEDBACK_CARD_DEFAULT_WIDTH;
  }

  const chromePadding = 48;
  const estimatedContentWidth = Math.max(
    estimateBodyTextWidth(summary.technical, 20, 0.54),
    estimateBodyTextWidth(summary.tokenSplit, 20, 0.61),
    estimateBodyTextWidth(summary.economy, 15, 0.54),
    Math.min(
      estimateBodyTextWidth(summary.audit, 13, 0.5),
      DESKTOP_FEEDBACK_CARD_DEFAULT_WIDTH - chromePadding
    )
  );

  return clamp(Math.ceil(estimatedContentWidth + chromePadding), DESKTOP_FEEDBACK_CARD_MIN_WIDTH, DESKTOP_FEEDBACK_CARD_MAX_WIDTH);
}

function estimateBodyTextWidth(text: string, fontSize: number, averageWidthRatio: number): number {
  const longestLine = text.split("\n").reduce((longest, line) => Math.max(longest, line.length), 0);

  return longestLine * fontSize * averageWidthRatio;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function compactFeedbackCardHeight(width: number, height: number): number {
  const minTop = compactFeedbackReviewMinTop(width, height);
  const availableHeight = compactFeedbackMaxBottom(width, height) - minTop;
  const maxHeight = height < 640 ? 176 : 164;

  return Math.max(104, Math.min(maxHeight, availableHeight));
}

function compactFeedbackCardY(width: number, height: number, cardHeight: number): number {
  const minY = compactFeedbackReviewMinTop(width, height) + cardHeight / 2;
  const maxY = compactFeedbackMaxBottom(width, height) - cardHeight / 2;
  const preferredY = Math.max(310, height - 172);

  if (minY > maxY) {
    return (minY + maxY) / 2;
  }

  return Math.max(minY, Math.min(maxY, preferredY));
}

function compactFeedbackReviewMinTop(width: number, height: number): number {
  const layout = computePlayLayout({ width, height });
  const reviewTextPanelBottom = layout.sentenceReviewY + layout.textPanel.height / 2;

  return reviewTextPanelBottom + 16;
}

function compactFeedbackMaxBottom(width: number, height: number): number {
  const layout = computePlayLayout({ width, height });
  const controlTop = Math.min(
    layout.resolveButton.y - layout.resolveButton.height / 2,
    layout.clearButton.y - layout.clearButton.height / 2,
    layout.muteButton.y - layout.muteButton.height / 2,
    layout.exitButton.y - layout.exitButton.height / 2
  );
  const controlsBelowReview = controlTop > layout.sentenceReviewY + layout.textPanel.height / 2;

  return controlsBelowReview
    ? controlTop - FEEDBACK_CARD_CONTROL_CLEARANCE
    : height - 16;
}

function shortLandscapeFeedbackCardHeight(width: number, height: number): number {
  const minTop = shortLandscapeFeedbackMinTop(width, height);
  const maxBottom = shortLandscapeFeedbackMaxBottom(width, height);

  return Math.max(104, Math.min(148, maxBottom - minTop));
}

function shortLandscapeFeedbackCardY(width: number, height: number, cardHeight: number): number {
  const minY = shortLandscapeFeedbackMinTop(width, height) + cardHeight / 2;
  const maxY = shortLandscapeFeedbackMaxBottom(width, height) - cardHeight / 2;

  if (minY > maxY) {
    return (minY + maxY) / 2;
  }

  return Math.max(minY, Math.min(maxY, minY));
}

function shortLandscapeFeedbackMinTop(width: number, height: number): number {
  const layout = computePlayLayout({ width, height });

  return layout.sentenceReviewY + layout.textPanel.height / 2 + 8;
}

function shortLandscapeFeedbackMaxBottom(width: number, height: number): number {
  const layout = computePlayLayout({ width, height });
  const controlsTop = Math.min(
    layout.resolveButton.y - layout.resolveButton.height / 2,
    layout.clearButton.y - layout.clearButton.height / 2,
    layout.muteButton.y - layout.muteButton.height / 2,
    layout.exitButton.y - layout.exitButton.height / 2
  );

  return controlsTop - FEEDBACK_CARD_CONTROL_CLEARANCE;
}

function desktopFeedbackCardY(width: number, height: number, cardHeight: number): number {
  const layout = computePlayLayout({ width, height });
  const preferredY = Math.max(250, height - 168);
  const controlsTop = Math.min(
    layout.resolveButton.y - layout.resolveButton.height / 2,
    layout.clearButton.y - layout.clearButton.height / 2,
    layout.muteButton.y - layout.muteButton.height / 2,
    layout.exitButton.y - layout.exitButton.height / 2
  );
  const minY = layout.sentenceReviewY + layout.textPanel.height / 2 + 18 + cardHeight / 2;
  const maxY = controlsTop - FEEDBACK_CARD_CONTROL_CLEARANCE - cardHeight / 2;

  if (minY > maxY) {
    return Math.max(cardHeight / 2 + 16, maxY);
  }

  return Math.max(minY, Math.min(maxY, preferredY));
}

export class FeedbackCard {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly chrome: Phaser.GameObjects.Graphics;
  private readonly technicalText: Phaser.GameObjects.Text;
  private readonly tokenSplitText: Phaser.GameObjects.Text;
  private readonly economyText: Phaser.GameObjects.Text;
  private readonly cutsText: Phaser.GameObjects.Text;
  private currentSummary?: FeedbackSummary;
  private currentLayout?: FeedbackCardLayout;
  private lastLayoutInput?: {
    width: number;
    height: number;
    bounds?: { x: number; width: number };
  };

  constructor(private readonly scene: Phaser.Scene) {
    this.background = scene.add.rectangle(0, 0, 0, 122, uiPalette.panel, 0.95).setOrigin(0.5, 0.5).setDepth(18);
    this.background.setStrokeStyle(1, uiPalette.strokeDark, 0.94);
    this.chrome = scene.add.graphics().setDepth(19);
    this.technicalText = this.makeText(0, 0, 18).setDepth(19);
    this.tokenSplitText = this.makeText(0, 0, 18, uiFonts.mono).setDepth(19);
    this.economyText = this.makeText(0, 0, 14).setDepth(19);
    this.cutsText = this.makeText(0, 0, 14).setDepth(19);
    this.setVisible(false);
  }

  layout(width: number, height: number, bounds?: { x: number; width: number }): void {
    this.lastLayoutInput = { width, height, bounds };
    this.applyLayout(computeFeedbackCardLayout(width, height, bounds, this.currentSummary));
  }

  show(summary: FeedbackSummary): void {
    this.currentSummary = summary;
    this.technicalText.setText(summary.technical);
    this.tokenSplitText.setText(summary.tokenSplit);
    this.economyText.setText(summary.economy);
    this.economyText.setColor(feedbackEconomyColor(summary.economyTone));
    this.cutsText.setText(summary.audit);
    this.relayoutWithCurrentSummary();
    this.setVisible(true);
  }

  hide(): void {
    this.currentSummary = undefined;
    this.relayoutWithCurrentSummary();
    this.setVisible(false);
  }

  isVisible(): boolean {
    return this.background.visible;
  }

  qaState(): FeedbackCardQaState {
    const technical = this.technicalText.text;
    const tokenSplit = this.tokenSplitText.text;
    const economy = this.economyText.text;
    const audit = this.cutsText.text;

    return {
      text: [technical, tokenSplit, economy, audit].filter(Boolean).join("\n"),
      technical,
      tokenSplit,
      economy,
      audit
    };
  }

  layoutState(): FeedbackCardLayout | undefined {
    return this.currentLayout;
  }

  private makeText(x: number, y: number, size: number, fontFamily: string = uiFonts.body): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, "", {
      fontFamily,
      fontSize: `${size}px`,
      color: uiPalette.text
    });
  }

  private applyTextLayout(text: Phaser.GameObjects.Text, layout: FeedbackCardTextBlock): void {
    text.setOrigin(layout.originX ?? 0, 0);
    text.setPosition(layout.x, layout.y);
    text.setWordWrapWidth(layout.wordWrapWidth);
    text.setStyle({
      fontSize: `${layout.fontSize}px`,
      align: layout.align ?? "left"
    });
  }

  private relayoutWithCurrentSummary(): void {
    if (!this.lastLayoutInput) {
      return;
    }

    this.applyLayout(computeFeedbackCardLayout(
      this.lastLayoutInput.width,
      this.lastLayoutInput.height,
      this.lastLayoutInput.bounds,
      this.currentSummary
    ));
  }

  private applyLayout(layout: FeedbackCardLayout): void {
    const textLayout = computeFeedbackCardTextLayout(layout);
    this.currentLayout = layout;
    this.background.setPosition(layout.x, layout.y);
    this.background.setSize(layout.width, layout.height);
    this.drawChrome(layout);
    this.applyTextLayout(this.technicalText, textLayout.technical);
    this.applyTextLayout(this.tokenSplitText, textLayout.tokenSplit);
    this.applyTextLayout(this.economyText, textLayout.economy);
    this.applyTextLayout(this.cutsText, textLayout.cuts);
  }

  private setVisible(value: boolean): void {
    this.background.setVisible(value);
    this.chrome.setVisible(value);
    this.technicalText.setVisible(value);
    this.tokenSplitText.setVisible(value);
    this.economyText.setVisible(value);
    this.cutsText.setVisible(value);
  }

  private drawChrome(layout: FeedbackCardLayout): void {
    const left = layout.x - layout.width / 2;
    const top = layout.y - layout.height / 2;

    this.chrome.clear();
    this.chrome.fillStyle(uiPalette.panelLight, 0.16);
    this.chrome.fillRect(left + 1, top + 1, layout.width - 2, 10);
    this.chrome.fillStyle(uiPalette.blueGrey, 0.28);
    this.chrome.fillRect(left + 1, top + 1, layout.compact || layout.shortLandscape ? 96 : 122, 3);
    this.chrome.fillStyle(uiPalette.amber, 0.42);
    this.chrome.fillRect(left + 1, top + 10, 4, layout.height - 12);
    if (!layout.compact && !layout.shortLandscape) {
      this.chrome.fillStyle(uiPalette.panelLight, 0.46);
      this.chrome.fillRoundedRect(layout.x - 34, top + 10, 68, 3, 2);
    }
    this.chrome.lineStyle(1, uiPalette.stroke, 0.24);
    this.chrome.lineBetween(
      left + 16,
      top + (layout.compact || layout.shortLandscape ? 78 : 86),
      left + layout.width - 16,
      top + (layout.compact || layout.shortLandscape ? 78 : 86)
    );
  }
}

export function feedbackEconomyColor(tone: EconomyTone): string {
  switch (tone) {
    case "gain":
      return "#3f7358";
    case "loss":
      return "#b6534a";
    case "neutral":
      return uiPalette.text;
  }
}
