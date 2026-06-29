import type {
  HudImpactTarget,
  HudImpactVisualState
} from "../systems/HudImpactSystem";
import { uiFonts, uiPalette } from "./VisualTheme";

export type HudTimerMode = "active" | "paused" | "review";

export interface HudState {
  balance: number;
  pay: number;
  cost: number;
  progressLabel: string;
  progressCurrent: number;
  progressTarget: number;
  timeRemainingMs: number;
  timerMode?: HudTimerMode;
  timeWarningEnabled?: boolean;
  highScoreRounds: number;
  highScoreRank: string;
  impact?: HudImpactVisualState;
}

export interface HudTextLayout {
  x: number;
  y: number;
  fontSize: number;
  lineSpacing: number;
}

export interface HudLayout {
  compact: boolean;
  background: { x: number; y: number; width: number; height: number };
  balance: HudTextLayout;
  pay: HudTextLayout;
  cost: HudTextLayout;
  round: HudTextLayout;
  time: HudTextLayout;
  highScore: HudTextLayout;
}

export interface HudBounds {
  x: number;
  width: number;
}

export function hudMoney(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

export function balanceHudLabel(balance: number): string {
  if (balance <= 0) {
    return "BUDGET ZERO";
  }

  if (balance <= 10) {
    return "BALANCE LOW";
  }

  return "BALANCE";
}

export function balanceHudText(balance: number): string {
  return `${balanceHudLabel(balance)}\n${hudMoney(Math.max(0, balance))}`;
}

export function payHudText(pay: number, mode: HudTimerMode = "active"): string {
  const visiblePay = mode === "review" ? Math.max(0, pay) : 0;
  return `PAY\n+$${visiblePay.toFixed(2)}`;
}

export function costHudText(cost: number, mode: HudTimerMode = "active"): string {
  const visibleCost = mode === "review" ? Math.max(0, cost) : 0;
  return `COST\n-$${visibleCost.toFixed(2)}`;
}

export function compactBalanceHudText(balance: number): string {
  if (balance <= 0) {
    return `ZERO\n${hudMoney(0)}`;
  }

  if (balance <= 10) {
    return `LOW BAL\n${hudMoney(balance)}`;
  }

  return `BAL\n${hudMoney(balance)}`;
}

export function highScoreHudText(rounds: number, rank: string, compact = false): string {
  return `BEST\n${Math.max(0, Math.floor(rounds))} / ${shortRank(rank, compact)}`;
}

export function progressHudText(
  label: string,
  current: number,
  target: number,
  compact = false
): string {
  const normalizedCurrent = Math.max(0, Math.floor(current));
  const normalizedTarget = Math.max(1, Math.floor(target));
  return `${progressHudLabel(label, compact)}\n${normalizedCurrent} / ${normalizedTarget}`;
}

export function progressHudLabel(label: string, compact = false): string {
  if (!compact) {
    return label;
  }

  switch (label) {
    case "CLEARANCE":
      return "CLEAR";
    case "TUTORIAL":
      return "LESSON";
    default:
      return label;
  }
}

export function progressHudRatio(current: number, target: number): number {
  const normalizedCurrent = Math.max(0, Math.floor(current));
  const normalizedTarget = Math.max(1, Math.floor(target));
  return Math.max(0, Math.min(1, normalizedCurrent / normalizedTarget));
}

export function timeHudText(timeRemainingMs: number, mode: HudTimerMode = "active"): string {
  const seconds = `${Math.max(0, timeRemainingMs / 1000).toFixed(1)}s`;
  const label = mode === "paused" ? "PAUSED" : mode === "review" ? "REVIEW" : "TIME";
  return `${label}\n${seconds}`;
}

export function compactTimeHudText(timeRemainingMs: number, mode: HudTimerMode = "active"): string {
  const seconds = `${Math.max(0, timeRemainingMs / 1000).toFixed(1)}s`;
  const label = mode === "paused" ? "PAUSE" : mode === "review" ? "REVW" : "TIME";
  return `${label}\n${seconds}`;
}

export function timeHudColor(timeRemainingMs: number, mode: HudTimerMode = "active", warningEnabled = true): string {
  return warningEnabled && mode === "active" && timeRemainingMs <= 2000 ? "#b6534a" : uiPalette.text;
}

export function roundHudText(round: number, tier: number, compact = false): string {
  return progressHudText("PROGRESS", round, tier, compact);
}

export function computeHudLayout(width: number, bounds?: HudBounds): HudLayout {
  const compact = width < 760;
  const hudWidth = bounds ? Math.max(280, bounds.width) : Math.max(280, width - 24);
  const hudX = bounds?.x ?? width / 2;
  const background = {
    x: hudX,
    y: 12,
    width: hudWidth,
    height: compact ? 112 : 84
  };

  if (compact) {
    return {
      compact,
      background,
      balance: { x: 24, y: 22, fontSize: 18, lineSpacing: 2 },
      time: { x: width * 0.45, y: 22, fontSize: 16, lineSpacing: 2 },
      highScore: { x: width - 112, y: 22, fontSize: 13, lineSpacing: 2 },
      pay: { x: 24, y: 76, fontSize: 14, lineSpacing: 2 },
      cost: { x: width * 0.34, y: 76, fontSize: 14, lineSpacing: 2 },
      round: { x: width * 0.62, y: 76, fontSize: 14, lineSpacing: 2 }
    };
  }

  if (bounds && background.width < 1080) {
    const left = background.x - background.width / 2;

    return {
      compact,
      background,
      balance: { x: left + 22, y: 24, fontSize: 18, lineSpacing: 4 },
      pay: { x: left + background.width * 0.24, y: 26, fontSize: 14, lineSpacing: 4 },
      cost: { x: left + background.width * 0.4, y: 26, fontSize: 14, lineSpacing: 4 },
      round: { x: left + background.width * 0.56, y: 26, fontSize: 14, lineSpacing: 4 },
      time: { x: left + background.width * 0.72, y: 26, fontSize: 14, lineSpacing: 4 },
      highScore: { x: left + background.width - 146, y: 26, fontSize: 12, lineSpacing: 4 }
    };
  }

  if (bounds) {
    const left = background.x - background.width / 2;
    const right = left + background.width;

    return {
      compact,
      background,
      balance: { x: left + 220, y: 24, fontSize: 22, lineSpacing: 4 },
      pay: { x: left + 390, y: 26, fontSize: 16, lineSpacing: 4 },
      cost: { x: left + 530, y: 26, fontSize: 16, lineSpacing: 4 },
      round: { x: left + 680, y: 26, fontSize: 16, lineSpacing: 4 },
      time: { x: left + 850, y: 26, fontSize: 16, lineSpacing: 4 },
      highScore: { x: right - 194, y: 26, fontSize: 15, lineSpacing: 4 }
    };
  }

  return {
    compact,
    background,
    balance: { x: 180, y: 24, fontSize: 22, lineSpacing: 4 },
    pay: { x: 340, y: 26, fontSize: 16, lineSpacing: 4 },
    cost: { x: 470, y: 26, fontSize: 16, lineSpacing: 4 },
    round: { x: 610, y: 26, fontSize: 16, lineSpacing: 4 },
    time: { x: 780, y: 26, fontSize: 16, lineSpacing: 4 },
    highScore: { x: width - 194, y: 26, fontSize: 15, lineSpacing: 4 }
  };
}

export class Hud {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly chrome: Phaser.GameObjects.Graphics;
  private readonly progressChrome: Phaser.GameObjects.Graphics;
  private readonly impactChrome: Phaser.GameObjects.Graphics;
  private readonly impactLabelText: Phaser.GameObjects.Text;
  private readonly balanceText: Phaser.GameObjects.Text;
  private readonly payText: Phaser.GameObjects.Text;
  private readonly costText: Phaser.GameObjects.Text;
  private readonly roundText: Phaser.GameObjects.Text;
  private readonly timeText: Phaser.GameObjects.Text;
  private readonly highScoreText: Phaser.GameObjects.Text;
  private compact = false;
  private currentLayout?: HudLayout;

  constructor(private readonly scene: Phaser.Scene) {
    this.background = scene.add.rectangle(0, 0, 0, 0, uiPalette.panel, 0.91).setOrigin(0.5, 0).setDepth(18);
    this.background.setStrokeStyle(1, uiPalette.strokeDark, 0.92);
    this.chrome = scene.add.graphics().setDepth(19);
    this.progressChrome = scene.add.graphics().setDepth(19);
    this.impactChrome = scene.add.graphics().setDepth(19);
    this.impactLabelText = scene.add.text(0, 0, "", {
      fontFamily: uiFonts.mono,
      fontSize: "11px",
      color: uiPalette.text
    }).setOrigin(0.5).setDepth(21).setVisible(false);
    this.balanceText = this.makeText("BALANCE\n$40.00", 24, 20, 24);
    this.payText = this.makeText("PAY\n+$0.00", 230, 22, 17);
    this.costText = this.makeText("COST\n-$0.00", 380, 22, 17);
    this.roundText = this.makeText("PROGRESS\n0 / 5", 530, 22, 17);
    this.timeText = this.makeText("TIME\n9.0s", 700, 22, 17);
    this.highScoreText = this.makeText("BEST\n0 ROUNDS", 820, 22, 15);
  }

  layout(width: number, bounds?: HudBounds): void {
    const layout = computeHudLayout(width, bounds);
    this.compact = layout.compact;
    this.currentLayout = layout;
    this.background.setPosition(layout.background.x, layout.background.y);
    this.background.setSize(layout.background.width, layout.background.height);
    this.drawChrome(layout);
    this.applyTextLayout(this.balanceText, layout.balance);
    this.applyTextLayout(this.payText, layout.pay);
    this.applyTextLayout(this.costText, layout.cost);
    this.applyTextLayout(this.roundText, layout.round);
    this.applyTextLayout(this.timeText, layout.time);
    this.applyTextLayout(this.highScoreText, layout.highScore);
  }

  update(state: HudState): void {
    const timerMode = state.timerMode ?? "active";
    this.balanceText.setText(this.compact ? compactBalanceHudText(state.balance) : balanceHudText(state.balance));
    this.payText.setText(payHudText(state.pay, timerMode));
    this.costText.setText(costHudText(state.cost, timerMode));
    this.roundText.setText(progressHudText(state.progressLabel, state.progressCurrent, state.progressTarget, this.compact));
    this.timeText.setText(this.compact ? compactTimeHudText(state.timeRemainingMs, timerMode) : timeHudText(state.timeRemainingMs, timerMode));
    this.highScoreText.setText(highScoreHudText(state.highScoreRounds, state.highScoreRank, this.compact));
    this.balanceText.setColor(state.balance <= 10 ? "#b6534a" : uiPalette.text);
    this.timeText.setColor(timeHudColor(state.timeRemainingMs, timerMode, state.timeWarningEnabled ?? true));
    this.drawProgressMeter(state);
    this.drawImpact(state.impact);
  }

  impactLabelBounds(): Phaser.Geom.Rectangle | undefined {
    return this.impactLabelText.visible ? this.impactLabelText.getBounds() : undefined;
  }

  private makeText(value: string, x: number, y: number, size: number): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, value, {
        fontFamily: uiFonts.body,
        fontSize: `${size}px`,
        color: uiPalette.text,
        lineSpacing: 4
      })
      .setDepth(20);
  }

  private applyTextLayout(text: Phaser.GameObjects.Text, layout: HudTextLayout): void {
    text.setPosition(layout.x, layout.y);
    text.setFontSize(layout.fontSize);
    text.setLineSpacing(layout.lineSpacing);
  }

  private drawChrome(layout: HudLayout): void {
    const left = layout.background.x - layout.background.width / 2;
    const top = layout.background.y;
    const right = left + layout.background.width;
    const bottom = top + layout.background.height;

    this.chrome.clear();
    this.chrome.fillStyle(uiPalette.panelLight, 0.18);
    this.chrome.fillRect(left + 1, top + 1, layout.background.width - 2, 9);
    this.chrome.fillStyle(uiPalette.amber, 0.56);
    this.chrome.fillRect(left + 1, top + 1, layout.compact ? 84 : 156, 3);
    this.chrome.fillStyle(uiPalette.blueGrey, 0.24);
    this.chrome.fillRect(right - (layout.compact ? 118 : 196), top + 1, layout.compact ? 92 : 168, 3);
    this.chrome.lineStyle(1, uiPalette.strokeDark, 0.28);
    this.chrome.lineBetween(left + 10, bottom - 1, right - 10, bottom - 1);
    this.chrome.lineStyle(1, uiPalette.stroke, 0.32);

    const separators = layout.compact
      ? [layout.cost.x - 16, layout.round.x - 16, layout.highScore.x - 16]
      : [layout.pay.x - 26, layout.cost.x - 26, layout.round.x - 26, layout.time.x - 26, layout.highScore.x - 26];

    for (const x of separators) {
      this.chrome.lineBetween(x, top + 15, x, bottom - 14);
    }
  }

  private drawImpact(impact?: HudImpactVisualState): void {
    this.impactChrome.clear();
    if (!impact?.active) {
      this.impactLabelText.setVisible(false);
      return;
    }

    const color = impact.tone === "gain" ? uiPalette.oxidizedGreen : uiPalette.warning;
    for (const target of impact.targets) {
      const bounds = this.hudTargetText(target).getBounds();
      const paddingX = this.compact ? 7 : 9;
      const paddingY = this.compact ? 4 : 5;
      const x = bounds.x - paddingX;
      const y = bounds.y - paddingY;
      const width = bounds.width + paddingX * 2;
      const height = bounds.height + paddingY * 2;

      this.impactChrome.fillStyle(color, impact.fillAlpha);
      this.impactChrome.fillRoundedRect(x, y, width, height, 5);
      this.impactChrome.lineStyle(1, color, impact.strokeAlpha);
      this.impactChrome.strokeRoundedRect(x, y, width, height, 5);
    }

    this.impactLabelText.setVisible(false);
  }

  private drawProgressMeter(state: HudState): void {
    this.progressChrome.clear();
    if (!this.currentLayout) {
      return;
    }

    const bounds = this.roundText.getBounds();
    const ratio = progressHudRatio(state.progressCurrent, state.progressTarget);
    const railWidth = Math.max(this.compact ? 58 : 68, Math.min(this.compact ? 92 : 112, bounds.width + 16));
    const railHeight = this.compact ? 4 : 5;
    const x = bounds.x;
    const y = Math.min(
      this.currentLayout.background.y + this.currentLayout.background.height - (this.compact ? 12 : 11),
      bounds.y + bounds.height + (this.compact ? 3 : 5)
    );

    this.progressChrome.fillStyle(uiPalette.strokeDark, 0.18);
    this.progressChrome.fillRoundedRect(x, y, railWidth, railHeight, 2);
    if (ratio > 0) {
      this.progressChrome.fillStyle(uiPalette.oxidizedGreen, this.compact ? 0.5 : 0.56);
      this.progressChrome.fillRoundedRect(x, y, railWidth * ratio, railHeight, 2);
    }
    this.progressChrome.lineStyle(1, uiPalette.stroke, 0.36);
    this.progressChrome.strokeRoundedRect(x, y, railWidth, railHeight, 2);
  }

  private hudTargetText(target: HudImpactTarget): Phaser.GameObjects.Text {
    switch (target) {
      case "balance":
        return this.balanceText;
      case "pay":
        return this.payText;
      case "cost":
        return this.costText;
    }
  }
}

export function shortRank(rank: string, compact = false): string {
  switch (rank) {
    case "Regex Intern":
      return compact ? "Regex" : rank;
    case "Temporary Sequence Specialist":
      return compact ? "Temp Seq." : "Temp Sequence";
    case "cl100k Probationary":
      return compact ? "cl100k" : "cl100k Prob.";
    case "BPE Adjacent":
      return "BPE Adj.";
    case "Prompt Intake Associate":
      return compact ? "Prompt" : "Prompt Intake";
    case "Junior Boundary Clerk":
      return compact ? "Boundary" : "Boundary Clerk";
    default:
      return rank;
  }
}
