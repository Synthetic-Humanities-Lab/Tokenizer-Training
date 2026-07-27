import type { CreditTone, FeedbackSummary } from "../systems/FeedbackSystem";
import type { GameQaRect } from "../systems/GameQaSystem";
import {
  computePlayLayout,
  shortLandscapeReviewColumns,
  usesShortLandscapeReviewLayout
} from "../systems/PlayLayoutSystem";
import { safeAreaInsets, type SafeAreaInput } from "../systems/SafeAreaSystem";
import type { SurfaceProfile } from "../systems/SurfaceProfileSystem";
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
  tokenHeader: FeedbackCardTextBlock;
  tokenCount: FeedbackCardTextBlock;
  tokenSplit: FeedbackCardTextBlock;
  ledgerHeader: FeedbackCardTextBlock;
  economy: FeedbackCardTextBlock;
  net: FeedbackCardTextBlock;
  cuts: FeedbackCardTextBlock;
}

export interface FeedbackCardTextBlock {
  x: number;
  y: number;
  fontSize: number;
  wordWrapWidth: number;
  align?: "left" | "center" | "right";
  originX?: number;
}

export interface FeedbackCardQaState {
  text: string;
  technical: string;
  tokenSplit: string;
  tokenSplitRect?: GameQaRect;
  economy: string;
  audit: string;
}

export const FEEDBACK_CARD_CONTROL_CLEARANCE = 16;
const DESKTOP_FEEDBACK_CARD_MIN_WIDTH = 560;
const DESKTOP_FEEDBACK_CARD_DEFAULT_WIDTH = 640;
const DESKTOP_FEEDBACK_CARD_MAX_WIDTH = 700;
const DESKTOP_FEEDBACK_CARD_HEIGHT = 160;

export function computeFeedbackCardLayout(
  width: number,
  height: number,
  bounds?: { x: number; width: number },
  summary?: FeedbackSummary,
  safeAreaInput?: SafeAreaInput,
  surfaceProfile: SurfaceProfile = "browser"
): FeedbackCardLayout {
  const safeArea = safeAreaInsets(safeAreaInput);
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
    ? compactFeedbackCardHeight(width, height, safeArea, surfaceProfile)
    : shortLandscape
      ? shortLandscapeFeedbackCardHeight(width, height)
      : DESKTOP_FEEDBACK_CARD_HEIGHT;

  return {
    x: shortColumns?.feedback.x ?? (compact || !bounds ? width / 2 : bounds.x),
    y: compact
      ? compactFeedbackCardY(width, height, cardHeight, safeArea, surfaceProfile)
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
    const tight = layout.height <= 148;
    const ultraTight = layout.compact && layout.height <= 112;
    const tokenFontSize = layout.shortLandscape ? 15 : layout.width < 340 ? 13 : 14;
    const headerY = top + (ultraTight ? 9 : 11);
    const edgeX = layout.x - layout.width / 2 + inset;
    const rightX = layout.x + layout.width / 2 - inset;
    return {
      tokenHeader: {
        x: edgeX,
        y: headerY,
        fontSize: ultraTight ? 9 : 11,
        wordWrapWidth,
        align: "left"
      },
      tokenCount: {
        x: rightX,
        y: headerY,
        fontSize: ultraTight ? 9 : 11,
        wordWrapWidth,
        align: "right",
        originX: 1
      },
      tokenSplit: {
        x: layout.x,
        y: top + (ultraTight ? 24 : tight ? 27 : 30),
        fontSize: ultraTight ? 11 : tight ? 13 : tokenFontSize,
        wordWrapWidth,
        align: "center",
        originX: 0.5
      },
      ledgerHeader: {
        x: edgeX,
        y: top + (ultraTight ? 55 : tight ? 71 : 84),
        fontSize: ultraTight ? 8 : tight ? 10 : 11,
        wordWrapWidth,
        align: "left"
      },
      economy: {
        x: edgeX,
        y: top + (ultraTight ? 67 : tight ? 84 : 98),
        fontSize: ultraTight ? 9 : tight ? 11 : 12,
        wordWrapWidth: wordWrapWidth * 0.72,
        align: "left"
      },
      net: {
        x: rightX,
        y: top + (ultraTight ? 67 : tight ? 84 : 98),
        fontSize: ultraTight ? 9 : tight ? 11 : 12,
        wordWrapWidth: wordWrapWidth * 0.28,
        align: "right",
        originX: 1
      },
      cuts: {
        x: layout.x,
        y: top + (ultraTight ? 88 : tight ? 108 : 132),
        fontSize: ultraTight ? 10 : tight ? 11 : 13,
        wordWrapWidth,
        align: "center",
        originX: 0.5
      }
    };
  }

  const left = layout.x - layout.width / 2 + inset;
  const right = layout.x + layout.width / 2 - inset;
  return {
    tokenHeader: { x: left, y: top + 13, fontSize: 11, wordWrapWidth, align: "left" },
    tokenCount: { x: right, y: top + 13, fontSize: 11, wordWrapWidth, align: "right", originX: 1 },
    tokenSplit: { x: layout.x, y: top + 35, fontSize: 18, wordWrapWidth, align: "center", originX: 0.5 },
    ledgerHeader: { x: left, y: top + 88, fontSize: 10, wordWrapWidth, align: "left" },
    economy: { x: left, y: top + 105, fontSize: 13, wordWrapWidth: wordWrapWidth * 0.72, align: "left" },
    net: { x: right, y: top + 105, fontSize: 13, wordWrapWidth: wordWrapWidth * 0.28, align: "right", originX: 1 },
    cuts: { x: layout.x, y: top + 133, fontSize: 13, wordWrapWidth, align: "center", originX: 0.5 }
  };
}

export function feedbackAuditTextForLayout(
  summary: FeedbackSummary,
  layout: Pick<FeedbackCardLayout, "compact">,
  surfaceProfile: SurfaceProfile = "browser"
): string {
  return layout.compact && surfaceProfile === "mobile"
    ? summary.auditCompact
    : summary.audit;
}

function desktopFeedbackCardWidth(summary?: FeedbackSummary): number {
  if (!summary) {
    return DESKTOP_FEEDBACK_CARD_DEFAULT_WIDTH;
  }

  const chromePadding = 48;
  const estimatedContentWidth = Math.max(
    estimateBodyTextWidth(summary.tokenSplit, 18, 0.61),
    estimateBodyTextWidth(summary.creditLedger, 13, 0.54),
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

function compactFeedbackCardHeight(
  width: number,
  height: number,
  safeArea?: SafeAreaInput,
  surfaceProfile: SurfaceProfile = "browser"
): number {
  const minTop = compactFeedbackReviewMinTop(width, height, safeArea, surfaceProfile);
  const availableHeight = compactFeedbackMaxBottom(width, height, safeArea, surfaceProfile) - minTop;
  const maxHeight = height < 640 ? 176 : 172;

  return Math.max(104, Math.min(maxHeight, availableHeight));
}

function compactFeedbackCardY(
  width: number,
  height: number,
  cardHeight: number,
  safeArea?: SafeAreaInput,
  surfaceProfile: SurfaceProfile = "browser"
): number {
  const minY = compactFeedbackReviewMinTop(width, height, safeArea, surfaceProfile) + cardHeight / 2;
  const maxY = compactFeedbackMaxBottom(width, height, safeArea, surfaceProfile) - cardHeight / 2;
  const preferredY = Math.max(310, height - 184);

  if (minY > maxY) {
    return (minY + maxY) / 2;
  }

  return Math.max(minY, Math.min(maxY, preferredY));
}

function compactFeedbackReviewMinTop(
  width: number,
  height: number,
  safeArea?: SafeAreaInput,
  surfaceProfile: SurfaceProfile = "browser"
): number {
  const layout = computePlayLayout({ width, height, safeArea, surfaceProfile });
  const reviewTextPanelBottom = layout.sentenceReviewY + layout.textPanel.height / 2;

  return reviewTextPanelBottom + 16;
}

function compactFeedbackMaxBottom(
  width: number,
  height: number,
  safeAreaInput?: SafeAreaInput,
  surfaceProfile: SurfaceProfile = "browser"
): number {
  const safeArea = safeAreaInsets(safeAreaInput);
  const layout = computePlayLayout({ width, height, safeArea, surfaceProfile });
  const controlTop = Math.min(
    layout.resolveButton.y - layout.resolveButton.height / 2,
    layout.clearButton.y - layout.clearButton.height / 2,
    layout.muteButton.y - layout.muteButton.height / 2,
    layout.exitButton.y - layout.exitButton.height / 2
  );
  const controlsBelowReview = controlTop > layout.sentenceReviewY + layout.textPanel.height / 2;

  return controlsBelowReview
    ? controlTop - FEEDBACK_CARD_CONTROL_CLEARANCE
    : height - safeArea.bottom - 16;
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
  private readonly tokenHeaderText: Phaser.GameObjects.Text;
  private readonly tokenCountText: Phaser.GameObjects.Text;
  private readonly tokenSplitText: Phaser.GameObjects.Text;
  private readonly ledgerHeaderText: Phaser.GameObjects.Text;
  private readonly economyText: Phaser.GameObjects.Text;
  private readonly netText: Phaser.GameObjects.Text;
  private readonly cutsText: Phaser.GameObjects.Text;
  private currentSummary?: FeedbackSummary;
  private currentLayout?: FeedbackCardLayout;
  private lastLayoutInput?: {
    width: number;
    height: number;
    bounds?: { x: number; width: number };
    safeArea?: SafeAreaInput;
    surfaceProfile?: SurfaceProfile;
  };

  constructor(private readonly scene: Phaser.Scene) {
    this.background = scene.add.rectangle(0, 0, 0, 122, uiPalette.panel, 0.95).setOrigin(0.5, 0.5).setDepth(18);
    this.background.setStrokeStyle(1, uiPalette.strokeDark, 0.94);
    this.chrome = scene.add.graphics().setDepth(19);
    this.tokenHeaderText = this.makeText(0, 0, 11, uiFonts.mono).setDepth(19);
    this.tokenCountText = this.makeText(0, 0, 11, uiFonts.mono).setDepth(19);
    this.tokenSplitText = this.makeText(0, 0, 18, uiFonts.mono).setDepth(19);
    this.ledgerHeaderText = this.makeText(0, 0, 10, uiFonts.mono).setDepth(19);
    this.economyText = this.makeText(0, 0, 14).setDepth(19);
    this.netText = this.makeText(0, 0, 14).setDepth(19);
    this.cutsText = this.makeText(0, 0, 14).setDepth(19);
    this.setVisible(false);
  }

  layout(
    width: number,
    height: number,
    bounds?: { x: number; width: number },
    safeArea?: SafeAreaInput,
    surfaceProfile: SurfaceProfile = "browser"
  ): void {
    this.lastLayoutInput = { width, height, bounds, safeArea, surfaceProfile };
    this.applyLayout(computeFeedbackCardLayout(width, height, bounds, this.currentSummary, safeArea, surfaceProfile));
  }

  show(summary: FeedbackSummary): void {
    this.currentSummary = summary;
    this.tokenHeaderText.setText("RESOLVED TOKENS");
    this.tokenCountText.setText(String(summary.tokenCount));
    this.tokenSplitText.setText(summary.tokenSplit);
    this.ledgerHeaderText.setText("TOKEN CREDIT LEDGER");
    this.economyText.setText(summary.creditBreakdown);
    this.economyText.setColor(uiPalette.textMuted);
    this.netText.setText(summary.creditDelta);
    this.netText.setColor(feedbackCreditColor(summary.creditTone));
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
    const technical = this.currentSummary?.technical ?? "";
    const tokenHeader = `${this.tokenHeaderText.text} ${this.tokenCountText.text}`.trim();
    const tokenSplit = this.tokenSplitText.text;
    const economy = this.currentSummary?.creditLedger ?? "";
    const audit = this.cutsText.text;

    return {
      text: [tokenHeader, tokenSplit, economy, audit].filter(Boolean).join("\n"),
      technical,
      tokenSplit: [tokenHeader, tokenSplit].filter(Boolean).join("\n"),
      tokenSplitRect: this.unionTextRects(
        this.textRect(this.tokenHeaderText),
        this.textRect(this.tokenCountText),
        this.textRect(this.tokenSplitText)
      ),
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

  private textRect(text: Phaser.GameObjects.Text): GameQaRect | undefined {
    if (!text.visible || text.text.length === 0) {
      return undefined;
    }

    const bounds = text.getBounds();
    return {
      x: bounds.centerX,
      y: bounds.centerY,
      width: bounds.width,
      height: bounds.height
    };
  }

  private unionTextRects(...rects: Array<GameQaRect | undefined>): GameQaRect | undefined {
    const visibleRects = rects.filter((rect): rect is GameQaRect => rect !== undefined);
    if (visibleRects.length === 0) {
      return undefined;
    }

    const left = Math.min(...visibleRects.map((rect) => rect.x - rect.width / 2));
    const right = Math.max(...visibleRects.map((rect) => rect.x + rect.width / 2));
    const top = Math.min(...visibleRects.map((rect) => rect.y - rect.height / 2));
    const bottom = Math.max(...visibleRects.map((rect) => rect.y + rect.height / 2));
    return {
      x: (left + right) / 2,
      y: (top + bottom) / 2,
      width: right - left,
      height: bottom - top
    };
  }

  private relayoutWithCurrentSummary(): void {
    if (!this.lastLayoutInput) {
      return;
    }

    this.applyLayout(computeFeedbackCardLayout(
      this.lastLayoutInput.width,
      this.lastLayoutInput.height,
      this.lastLayoutInput.bounds,
      this.currentSummary,
      this.lastLayoutInput.safeArea,
      this.lastLayoutInput.surfaceProfile
    ));
  }

  private applyLayout(layout: FeedbackCardLayout): void {
    const textLayout = computeFeedbackCardTextLayout(layout);
    this.currentLayout = layout;
    if (this.currentSummary) {
      this.cutsText.setText(feedbackAuditTextForLayout(
        this.currentSummary,
        layout,
        this.lastLayoutInput?.surfaceProfile
      ));
    } else {
      this.cutsText.setText("");
    }
    this.background.setPosition(layout.x, layout.y);
    this.background.setSize(layout.width, layout.height);
    this.drawChrome(layout);
    this.applyTextLayout(this.tokenHeaderText, textLayout.tokenHeader);
    this.applyTextLayout(this.tokenCountText, textLayout.tokenCount);
    this.applyTextLayout(this.tokenSplitText, textLayout.tokenSplit);
    this.applyTextLayout(this.ledgerHeaderText, textLayout.ledgerHeader);
    this.applyTextLayout(this.economyText, textLayout.economy);
    this.applyTextLayout(this.netText, textLayout.net);
    this.applyTextLayout(this.cutsText, textLayout.cuts);
  }

  private setVisible(value: boolean): void {
    this.background.setVisible(value);
    this.chrome.setVisible(value);
    this.tokenHeaderText.setVisible(value);
    this.tokenCountText.setVisible(value);
    this.tokenSplitText.setVisible(value);
    this.ledgerHeaderText.setVisible(value);
    this.economyText.setVisible(value);
    this.netText.setVisible(value);
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
    const ruleY = top + (layout.compact || layout.shortLandscape ? 64 : 80);
    this.chrome.lineBetween(left + 16, ruleY, left + layout.width - 16, ruleY);
  }
}

export function feedbackCreditColor(tone: CreditTone): string {
  switch (tone) {
    case "gain":
      return "#3f7358";
    case "loss":
      return "#b6534a";
    case "neutral":
      return uiPalette.text;
  }
}
