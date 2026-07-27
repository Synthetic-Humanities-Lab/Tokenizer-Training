import type {
  HudImpactTarget,
  HudImpactVisualState
} from "../systems/HudImpactSystem";
import { safeAreaInsets, type SafeAreaInput } from "../systems/SafeAreaSystem";
import type { SurfaceProfile } from "../systems/SurfaceProfileSystem";
import { uiFonts, uiPalette } from "./VisualTheme";

export type HudTimerMode = "active" | "paused" | "review";

export interface HudState {
  creditBalance: number;
  verifiedCredits: number;
  reworkCredits: number;
  progressLabel: string;
  progressCurrent: number;
  progressTarget: number;
  timeRemainingMs: number;
  timerMode?: HudTimerMode;
  timeWarningEnabled?: boolean;
  highScoreRounds: number;
  currentRounds: number;
  impact?: HudImpactVisualState;
}

export interface HudTextLayout {
  x: number;
  y: number;
  fontSize: number;
  lineSpacing: number;
  visible?: boolean;
}

export interface HudLayout {
  compact: boolean;
  mobile: boolean;
  background: { x: number; y: number; width: number; height: number };
  credits: HudTextLayout;
  verified: HudTextLayout;
  rework: HudTextLayout;
  round: HudTextLayout;
  time: HudTextLayout;
  highScore: HudTextLayout;
}

export interface HudMetricVisibility {
  credits: boolean;
  verified: boolean;
  rework: boolean;
  round: boolean;
  time: boolean;
  highScore: boolean;
}

export interface HudBounds {
  x: number;
  width: number;
}

export function tokenCredits(value: number): string {
  if (!Number.isFinite(value)) {
    return "∞ TC";
  }

  return `${Math.max(0, Math.floor(value))} TC`;
}

export function creditHudLabel(creditBalance: number): string {
  if (creditBalance <= 0) {
    return "CREDITS EMPTY";
  }

  if (creditBalance <= 10) {
    return "CREDITS LOW";
  }

  return "CREDITS";
}

export function creditHudText(creditBalance: number): string {
  return `${creditHudLabel(creditBalance)}\n${tokenCredits(creditBalance)}`;
}

export function verifiedHudText(credits: number, mode: HudTimerMode = "active"): string {
  const visibleCredits = mode === "review" ? Math.max(0, Math.floor(credits)) : 0;
  return `VERIFIED\n+${visibleCredits} TC`;
}

export function reworkHudText(credits: number, mode: HudTimerMode = "active"): string {
  const visibleCredits = mode === "review" ? Math.max(0, Math.floor(credits)) : 0;
  return `REWORK\n-${visibleCredits} TC`;
}

export function compactCreditHudText(creditBalance: number): string {
  if (creditBalance <= 0) {
    return `EMPTY\n${tokenCredits(0)}`;
  }

  if (creditBalance <= 10) {
    return `LOW TC\n${tokenCredits(creditBalance)}`;
  }

  return `CREDITS\n${tokenCredits(creditBalance)}`;
}

export function highScoreHudText(rounds: number, rank: string, compact = false): string {
  return `BEST\n${Math.max(0, Math.floor(rounds))} / ${shortRank(rank, compact)}`;
}

export function rankLedgerHudText(
  bestRounds: number,
  currentRounds: number
): string {
  return `BEST RUN  ${Math.max(0, Math.floor(bestRounds))}\nCURRENT  ${Math.max(0, Math.floor(currentRounds))}`;
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

export function mobileProgressHudText(label: string, current: number, target: number): string {
  const normalizedCurrent = Math.max(0, Math.floor(current));
  const normalizedTarget = Math.max(1, Math.floor(target));
  return `${progressHudLabel(label, true)} ${normalizedCurrent}/${normalizedTarget}`;
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
  if (mode === "review") {
    return "STATUS\nAUDIT";
  }

  const seconds = `${Math.max(0, timeRemainingMs / 1000).toFixed(1)}s`;
  const label = mode === "paused" ? "PAUSED" : "TIME";
  return `${label}\n${seconds}`;
}

export function compactTimeHudText(timeRemainingMs: number, mode: HudTimerMode = "active"): string {
  if (mode === "review") {
    return "STATUS\nAUDIT";
  }

  const seconds = `${Math.max(0, timeRemainingMs / 1000).toFixed(1)}s`;
  const label = mode === "paused" ? "PAUSE" : "TIME";
  return `${label}\n${seconds}`;
}

export function timeHudColor(timeRemainingMs: number, mode: HudTimerMode = "active", warningEnabled = true): string {
  return warningEnabled && mode === "active" && timeRemainingMs <= 2000 ? "#b6534a" : uiPalette.text;
}

export function roundHudText(round: number, tier: number, compact = false): string {
  return progressHudText("PROGRESS", round, tier, compact);
}

export function hudMetricVisibility(layout: HudLayout, timerMode: HudTimerMode = "active"): HudMetricVisibility {
  const predictionMode = timerMode === "active" && (layout.compact || layout.mobile);

  return {
    credits: true,
    time: true,
    verified: !predictionMode && layout.verified.visible !== false,
    rework: !predictionMode && layout.rework.visible !== false,
    round: layout.mobile
      ? layout.round.visible !== false
      : !predictionMode && layout.round.visible !== false,
    highScore: layout.highScore.visible !== false
  };
}

export function computeHudLayout(
  width: number,
  bounds?: HudBounds,
  safeAreaInput?: SafeAreaInput,
  surfaceProfile: SurfaceProfile = "browser"
): HudLayout {
  const safeArea = safeAreaInsets(safeAreaInput);
  const compact = width < 760;
  const mobile = surfaceProfile === "mobile";
  const hudWidth = bounds ? Math.max(280, bounds.width) : Math.max(280, width - 24);
  const hudX = bounds?.x ?? width / 2;
  const background = {
    x: hudX,
    y: safeArea.top + 12,
    width: hudWidth,
    height: mobile ? 78 : compact ? 112 : 84
  };

  if (mobile) {
    const left = background.x - background.width / 2;
    const right = background.x + background.width / 2;

    return {
      compact,
      mobile,
      background,
      credits: { x: left + 22, y: safeArea.top + 21, fontSize: 16, lineSpacing: 1 },
      time: { x: left + background.width * 0.44, y: safeArea.top + 21, fontSize: 15, lineSpacing: 1 },
      highScore: { x: right - 116, y: safeArea.top + 24, fontSize: 12, lineSpacing: 2 },
      verified: { x: left + 22, y: safeArea.top + 58, fontSize: 1, lineSpacing: 0, visible: false },
      rework: { x: left + background.width * 0.34, y: safeArea.top + 58, fontSize: 1, lineSpacing: 0, visible: false },
      round: { x: background.x, y: safeArea.top + 56, fontSize: 11, lineSpacing: 0, visible: true }
    };
  }

  if (compact) {
    const left = background.x - background.width / 2;
    const right = background.x + background.width / 2;

    return {
      compact,
      mobile,
      background,
      credits: { x: left + 24, y: safeArea.top + 22, fontSize: 18, lineSpacing: 2 },
      time: { x: left + background.width * 0.45, y: safeArea.top + 22, fontSize: 16, lineSpacing: 2 },
      highScore: { x: right - 112, y: safeArea.top + 22, fontSize: 13, lineSpacing: 2 },
      verified: { x: left + 24, y: safeArea.top + 76, fontSize: 14, lineSpacing: 2 },
      rework: { x: left + background.width * 0.34, y: safeArea.top + 76, fontSize: 14, lineSpacing: 2 },
      round: { x: left + background.width * 0.62, y: safeArea.top + 76, fontSize: 14, lineSpacing: 2 }
    };
  }

  if (bounds && background.width < 1080) {
    const left = background.x - background.width / 2;

    return {
      compact,
      mobile,
      background,
      credits: { x: left + 22, y: 24, fontSize: 18, lineSpacing: 4 },
      verified: { x: left + background.width * 0.24, y: 26, fontSize: 14, lineSpacing: 4 },
      rework: { x: left + background.width * 0.4, y: 26, fontSize: 14, lineSpacing: 4 },
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
      mobile,
      background,
      credits: { x: left + 220, y: 24, fontSize: 22, lineSpacing: 4 },
      verified: { x: left + 390, y: 26, fontSize: 16, lineSpacing: 4 },
      rework: { x: left + 530, y: 26, fontSize: 16, lineSpacing: 4 },
      round: { x: left + 680, y: 26, fontSize: 16, lineSpacing: 4 },
      time: { x: left + 850, y: 26, fontSize: 16, lineSpacing: 4 },
      highScore: { x: right - 194, y: 26, fontSize: 15, lineSpacing: 4 }
    };
  }

  return {
    compact,
    mobile,
    background,
    credits: { x: 180, y: 24, fontSize: 22, lineSpacing: 4 },
    verified: { x: 340, y: 26, fontSize: 16, lineSpacing: 4 },
    rework: { x: 470, y: 26, fontSize: 16, lineSpacing: 4 },
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
  private readonly creditsText: Phaser.GameObjects.Text;
  private readonly verifiedText: Phaser.GameObjects.Text;
  private readonly reworkText: Phaser.GameObjects.Text;
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
    this.creditsText = this.makeText("CREDITS\n40 TC", 24, 20, 24);
    this.verifiedText = this.makeText("VERIFIED\n+0 TC", 230, 22, 17);
    this.reworkText = this.makeText("REWORK\n-0 TC", 380, 22, 17);
    this.roundText = this.makeText("PROGRESS\n0 / 5", 530, 22, 17);
    this.timeText = this.makeText("TIME\n9.0s", 700, 22, 17);
    this.highScoreText = this.makeText("BEST\n0 ROUNDS", 820, 22, 15);
  }

  layout(width: number, bounds?: HudBounds, safeArea?: SafeAreaInput, surfaceProfile: SurfaceProfile = "browser"): void {
    const layout = computeHudLayout(width, bounds, safeArea, surfaceProfile);
    this.compact = layout.compact;
    this.currentLayout = layout;
    this.background.setPosition(layout.background.x, layout.background.y);
    this.background.setSize(layout.background.width, layout.background.height);
    this.drawChrome(layout);
    this.applyTextLayout(this.creditsText, layout.credits);
    this.applyTextLayout(this.verifiedText, layout.verified);
    this.applyTextLayout(this.reworkText, layout.rework);
    this.applyTextLayout(this.roundText, layout.round);
    this.roundText.setOrigin(layout.mobile ? 0.5 : 0, 0);
    this.applyTextLayout(this.timeText, layout.time);
    this.applyTextLayout(this.highScoreText, layout.highScore);
  }

  update(state: HudState): void {
    const timerMode = state.timerMode ?? "active";
    this.applyMetricVisibility(hudMetricVisibility(this.currentLayout ?? computeHudLayout(1280), timerMode));
    this.creditsText.setText(
      this.compact ? compactCreditHudText(state.creditBalance) : creditHudText(state.creditBalance)
    );
    this.verifiedText.setText(verifiedHudText(state.verifiedCredits, timerMode));
    this.reworkText.setText(reworkHudText(state.reworkCredits, timerMode));
    this.roundText.setText(this.currentLayout?.mobile
      ? mobileProgressHudText(state.progressLabel, state.progressCurrent, state.progressTarget)
      : progressHudText(state.progressLabel, state.progressCurrent, state.progressTarget, this.compact));
    this.timeText.setText(this.compact ? compactTimeHudText(state.timeRemainingMs, timerMode) : timeHudText(state.timeRemainingMs, timerMode));
    this.highScoreText.setText(rankLedgerHudText(
      state.highScoreRounds,
      state.currentRounds
    ));
    this.creditsText.setColor(state.creditBalance <= 10 ? "#b6534a" : uiPalette.text);
    this.timeText.setColor(timeHudColor(state.timeRemainingMs, timerMode, state.timeWarningEnabled ?? true));
    this.drawProgressMeter(state);
    this.drawImpact(this.currentLayout?.mobile ? undefined : state.impact);
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
    text.setVisible(layout.visible !== false);
  }

  private applyMetricVisibility(visibility: HudMetricVisibility): void {
    this.creditsText.setVisible(visibility.credits);
    this.verifiedText.setVisible(visibility.verified);
    this.reworkText.setVisible(visibility.rework);
    this.roundText.setVisible(visibility.round);
    this.timeText.setVisible(visibility.time);
    this.highScoreText.setVisible(visibility.highScore);
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

    const separators = layout.mobile
      ? [layout.time.x - 18, layout.highScore.x - 18]
      : layout.compact
      ? [layout.rework.x - 16, layout.round.x - 16, layout.highScore.x - 16]
      : [layout.verified.x - 26, layout.rework.x - 26, layout.round.x - 26, layout.time.x - 26, layout.highScore.x - 26];

    for (const x of separators) {
      this.chrome.lineBetween(x, top + 15, x, bottom - (layout.mobile ? 20 : 14));
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

    if (this.currentLayout.mobile) {
      const ratio = progressHudRatio(state.progressCurrent, state.progressTarget);
      const railWidth = Math.max(104, Math.min(164, this.currentLayout.background.width * 0.38));
      const railHeight = 4;
      const x = this.currentLayout.background.x - railWidth / 2;
      const y = this.currentLayout.background.y + this.currentLayout.background.height - 16;

      this.progressChrome.fillStyle(uiPalette.strokeDark, 0.18);
      this.progressChrome.fillRoundedRect(x, y, railWidth, railHeight, 2);
      if (ratio > 0) {
        this.progressChrome.fillStyle(uiPalette.oxidizedGreen, 0.5);
        this.progressChrome.fillRoundedRect(x, y, railWidth * ratio, railHeight, 2);
      }
      this.progressChrome.lineStyle(1, uiPalette.stroke, 0.36);
      this.progressChrome.strokeRoundedRect(x, y, railWidth, railHeight, 2);
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
      case "credits":
        return this.creditsText;
      case "verified":
        return this.verifiedText;
      case "rework":
        return this.reworkText;
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
