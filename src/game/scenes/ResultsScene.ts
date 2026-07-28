import Phaser from "phaser";
import { readSemanticRuntime, type SemanticLease } from "../semantic/SemanticRuntime";
import { AudioSystem } from "../systems/AudioSystem";
import { bindCanvasButtonActivation } from "../systems/CanvasButtonActivationSystem";
import { clearGameQaSnapshot, writeGameQaSnapshot } from "../systems/GameQaSystem";
import type { PlaytestInputModality } from "../systems/InputModalitySystem";
import { playtestRunIdFromDate } from "../systems/PlaytestRunSystem";
import { RankSystem, type RankResult } from "../systems/RankSystem";
import {
  RESULTS_TOKEN_LOG_ACTION_LABEL,
  resultsSemanticSnapshot
} from "../systems/ResultsSemanticSystem";
import {
  computeResultMetricTypography,
  computeResultsLayout,
  type ResultsLayout
} from "../systems/ResultsLayoutSystem";
import { resultsSceneQaSnapshot } from "../systems/ResultsSceneQaSystem";
import { readSafeAreaInsetsForSurface } from "../systems/SafeAreaSystem";
import {
  SessionFlowSystem,
  type ResultBestPersistence,
  type SessionOutcome,
  type SessionRoundTrace
} from "../systems/SessionFlowSystem";
import type { PlaySessionStartSource } from "../systems/SessionStartSystem";
import {
  StorageSystem,
  type HighScoreRecord,
  type HighScoreSaveResult
} from "../systems/StorageSystem";
import { readSurfaceProfile } from "../systems/SurfaceProfileSystem";
import {
  applyUiTextResolution,
  buttonVisual,
  drawDegradedBrowserSurface,
  uiFonts,
  uiPalette
} from "../ui/VisualTheme";

export interface ResultsSceneData {
  runId?: string;
  rounds: number;
  creditBalance: number;
  accuracy: number;
  totalCorrectCuts?: number;
  totalMissedCuts?: number;
  totalFalseCuts?: number;
  startSource?: PlaySessionStartSource;
  inputModality?: PlaytestInputModality;
  totalVerifiedCredits: number;
  totalReworkCredits: number;
  roundTraces?: SessionRoundTrace[];
  outcome: SessionOutcome;
}

export function resultsRecoveryCue({
  outcome,
  totalMissedCuts = 0,
  totalFalseCuts = 0
}: {
  outcome: SessionOutcome;
  totalMissedCuts?: number;
  totalFalseCuts?: number;
}): string {
  const missed = count(totalMissedCuts);
  const falseCuts = count(totalFalseCuts);
  const correction = missed === 0 && falseCuts === 0
    ? "confirm the clean route"
    : missed > falseCuts
      ? "learn which boundaries you missed"
      : falseCuts > missed
        ? "learn which cuts were false"
        : "learn from both error types";
  const nextStep = outcome === "budget"
    ? "before retraining"
    : "before resuming";

  return `Review the Token Log to ${correction} ${nextStep}.`;
}

interface ResultMetricRow {
  id: string;
  label: string;
  value: string;
  tone?: "gain" | "loss" | "neutral";
}

export class ResultsScene extends Phaser.Scene {
  private readonly storage = new StorageSystem();
  private readonly audio = new AudioSystem(this.storage.loadMuted());
  private readonly rankSystem = new RankSystem();
  private readonly sessionFlow = new SessionFlowSystem();
  private elements: Phaser.GameObjects.GameObject[] = [];
  private dataSnapshot: ResultsSceneData = {
    runId: undefined,
    rounds: 0,
    creditBalance: 0,
    accuracy: 0,
    totalVerifiedCredits: 0,
    totalReworkCredits: 0,
    outcome: "budget"
  };
  private rank: RankResult = {
    rank: "Regex Intern",
    rankScore: 0,
    creditEfficiency: 0
  };
  private bestSaveResult: HighScoreSaveResult | null = null;
  private persistedBestRecord: HighScoreRecord | null = null;
  private semanticLease?: SemanticLease;
  private announceOutcomeOnNextPublish = true;
  private navigationStarted = false;

  constructor() {
    super("ResultsScene");
  }

  create(data: Partial<ResultsSceneData>): void {
    this.audio.setMuted(this.storage.loadMuted());
    this.announceOutcomeOnNextPublish = true;
    this.navigationStarted = false;
    this.dataSnapshot = {
      runId: data.runId ?? playtestRunIdFromDate(new Date()),
      rounds: data.rounds ?? 0,
      creditBalance: data.creditBalance ?? 0,
      accuracy: data.accuracy ?? 0,
      totalCorrectCuts: data.totalCorrectCuts,
      totalMissedCuts: data.totalMissedCuts,
      totalFalseCuts: data.totalFalseCuts,
      startSource: data.startSource ?? "unknown",
      inputModality: data.inputModality ?? "none",
      totalVerifiedCredits: data.totalVerifiedCredits ?? 0,
      totalReworkCredits: data.totalReworkCredits ?? 0,
      roundTraces: data.roundTraces ?? [],
      outcome: data.outcome ?? "budget"
    };
    this.rank = this.rankSystem.calculate(this.dataSnapshot);
    if (this.sessionFlow.shouldSaveResult(this.dataSnapshot)) {
      this.bestSaveResult = this.storage.saveHighScore({
        rounds: this.dataSnapshot.rounds,
        balance: this.dataSnapshot.creditBalance,
        accuracy: this.dataSnapshot.accuracy,
        rank: this.rank.rank,
        rankScore: this.rank.rankScore,
        costEfficiency: this.rank.creditEfficiency,
        totalPay: this.dataSnapshot.totalVerifiedCredits,
        totalCost: this.dataSnapshot.totalReworkCredits
      });
      this.persistedBestRecord = null;
    } else {
      this.bestSaveResult = null;
      this.persistedBestRecord = this.storage.loadHighScore();
    }
    this.semanticLease?.dispose();
    this.semanticLease = readSemanticRuntime(this.registry)?.mount("results", (actionId) => {
      this.handleSemanticAction(actionId);
    });
    this.scale.on("resize", this.render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.render, this);
      this.navigationStarted = true;
      this.semanticLease?.dispose();
      this.semanticLease = undefined;
      clearGameQaSnapshot();
    });
    this.render();
  }

  private render(): void {
    this.elements.forEach((element) => element.destroy());
    this.elements = [];

    const width = this.scale.width;
    const height = this.scale.height;
    const metricRows = this.resultMetricRows();
    const layout = this.computeLayoutForMetricRows(metricRows);

    this.addElement(this.add.rectangle(width / 2, height / 2, width, height, uiPalette.shell));
    this.addGrid(width, height);
    this.addElement(this.add.rectangle(layout.panel.x + 5, layout.panel.y + 6, layout.panel.width, layout.panel.height, uiPalette.panelShadow, 0.28));
    this.addElement(this.add.rectangle(layout.panel.x, layout.panel.y, layout.panel.width, layout.panel.height, uiPalette.panel, 0.95).setStrokeStyle(1, uiPalette.strokeDark, 0.96));
    this.addElement(
      this.add.text(layout.title.x, layout.title.y, this.titleText(), {
        fontFamily: uiFonts.display,
        fontSize: `${layout.title.fontSize}px`,
        color: uiPalette.text,
        align: "center",
        wordWrap: { width: layout.title.wordWrapWidth }
      }).setOrigin(0.5)
    );
    this.addElement(
      this.add.text(layout.summary.x, layout.summary.y, this.summaryText(), {
        fontFamily: uiFonts.body,
        fontSize: `${layout.summary.fontSize}px`,
        color: uiPalette.textMuted,
        align: "center",
        wordWrap: { width: layout.summary.wordWrapWidth }
      }).setOrigin(0.5)
    );
    this.drawMetricRows(layout, metricRows);

    this.createButton(layout.copyButton, RESULTS_TOKEN_LOG_ACTION_LABEL, () => {
      this.commandTokenLog();
    });
    this.createButton(layout.againButton, "Run Training Again", () => {
      this.commandRetry();
    });
    this.createButton(layout.menuButton, "Return to Menu", () => {
      this.commandReturnToMenu();
    });
    this.writeResultsQaSnapshot(layout);
    this.publishSemanticSnapshot();
  }

  private createButton(
    bounds: ResultsLayout["againButton"],
    label: string,
    action: () => void,
    bindText?: (text: Phaser.GameObjects.Text) => void
  ): void {
    const button = this.add.rectangle(bounds.x, bounds.y, bounds.width, bounds.height, buttonVisual.fill, buttonVisual.fillAlpha).setStrokeStyle(1, buttonVisual.stroke);
    const text = this.add.text(bounds.x, bounds.y, label, {
      fontFamily: uiFonts.body,
      fontSize: "16px",
      color: uiPalette.text
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true });
    bindCanvasButtonActivation({
      button,
      input: this.input,
      onRest: () => button.setFillStyle(buttonVisual.fill, buttonVisual.fillAlpha),
      onHover: () => button.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha),
      onPress: () => button.setFillStyle(buttonVisual.pressFill, buttonVisual.pressAlpha),
      onActivate: action
    });
    bindText?.(text);
    this.addElement(button);
    this.addElement(text);
  }

  private addElement<T extends Phaser.GameObjects.GameObject>(element: T): T {
    applyUiTextResolution(element);
    this.elements.push(element);
    return element;
  }

  private addGrid(width: number, height: number): void {
    const grid = this.add.graphics();
    drawDegradedBrowserSurface(grid, width, height, { compact: width < 560 });
    this.addElement(grid);
  }

  private drawMetricRows(layout: ResultsLayout, rows: ResultMetricRow[]): void {
    const frame = this.add.graphics();

    this.addElement(frame);
    layout.metricCards.forEach((card, index) => {
      const row = rows[index];
      if (!row) {
        return;
      }
      const left = card.x - card.width / 2;
      const top = card.y - card.height / 2;
      const typography = computeResultMetricTypography(layout, card, row.value, {
        maxValueLines: row.id === "rank" ? 2 : 1
      });

      frame.fillStyle(uiPalette.panelLight, 0.72);
      frame.fillRoundedRect(left, top, card.width, card.height, 5);
      frame.lineStyle(1, uiPalette.stroke, 0.74);
      frame.strokeRoundedRect(left, top, card.width, card.height, 5);
      frame.fillStyle(metricAccentColor(row), 0.38);
      frame.fillRect(left + 1, top + 1, 4, card.height - 2);

      this.addElement(this.add.text(left + 9, top + typography.labelTopOffset, row.label, {
        fontFamily: uiFonts.mono,
        fontSize: `${typography.labelFontSize}px`,
        color: uiPalette.textMuted
      }));
      this.addElement(this.add.text(left + 9, top + typography.valueTopOffset, row.value, {
        fontFamily: uiFonts.body,
        fontSize: `${typography.valueFontSize}px`,
        color: metricTextColor(row),
        wordWrap: { width: typography.valueWordWrapWidth }
      }));
    });
  }

  private titleText(): string {
    return this.sessionFlow.resultCopy(this.dataSnapshot.outcome).title;
  }

  private summaryText(): string {
    const summary = this.sessionFlow.resultCopy(this.dataSnapshot.outcome).summary;
    return `${summary} ${resultsRecoveryCue(this.dataSnapshot)}`;
  }

  private resultLedgerText(): string {
    const input = {
      runId: this.dataSnapshot.runId,
      rounds: this.dataSnapshot.rounds,
      creditBalance: this.dataSnapshot.creditBalance,
      accuracy: this.dataSnapshot.accuracy,
      totalCorrectCuts: this.dataSnapshot.totalCorrectCuts,
      totalMissedCuts: this.dataSnapshot.totalMissedCuts,
      totalFalseCuts: this.dataSnapshot.totalFalseCuts,
      startSource: this.dataSnapshot.startSource,
      inputModality: this.dataSnapshot.inputModality,
      totalVerifiedCredits: this.dataSnapshot.totalVerifiedCredits,
      totalReworkCredits: this.dataSnapshot.totalReworkCredits,
      creditEfficiency: this.rank.creditEfficiency,
      rank: this.rank.rank,
      bestPersistence: this.resultBestPersistence()
    };

    return computeResultsLayout(this.scale.width, this.scale.height, readSafeAreaInsetsForSurface(readSurfaceProfile())).compact
      ? this.sessionFlow.compactResultLedgerText(input)
      : this.sessionFlow.resultLedgerText(input);
  }

  private resultMetricRows(): ResultMetricRow[] {
    const correct = Math.max(0, Math.floor(this.dataSnapshot.totalCorrectCuts ?? 0));
    const missed = Math.max(0, Math.floor(this.dataSnapshot.totalMissedCuts ?? 0));
    const falseCuts = Math.max(0, Math.floor(this.dataSnapshot.totalFalseCuts ?? 0));
    const accuracy = `${Math.round(Math.max(0, Math.min(1, this.dataSnapshot.accuracy)) * 100)}%`;
    const rows: ResultMetricRow[] = [
      { id: "run", label: "RUN", value: `${Math.max(0, Math.floor(this.dataSnapshot.rounds))} rounds` },
      { id: "cuts", label: "CUTS", value: `OK ${correct} / M ${missed} / F ${falseCuts}` },
      { id: "accuracy", label: "ACCURACY", value: accuracy }
    ];

    if (this.dataSnapshot.outcome !== "budget") {
      rows.push({
        id: "credits",
        label: "CREDITS",
        value: tokenCredits(this.dataSnapshot.creditBalance)
      });
    }
    rows.push({ id: "rank", label: "RANK", value: this.rank.rank });

    return rows;
  }

  private playtestSummaryText(): string {
    return this.sessionFlow.playtestSummaryText({
      runId: this.dataSnapshot.runId,
      rounds: this.dataSnapshot.rounds,
      creditBalance: this.dataSnapshot.creditBalance,
      accuracy: this.dataSnapshot.accuracy,
      totalCorrectCuts: this.dataSnapshot.totalCorrectCuts,
      totalMissedCuts: this.dataSnapshot.totalMissedCuts,
      totalFalseCuts: this.dataSnapshot.totalFalseCuts,
      startSource: this.dataSnapshot.startSource,
      inputModality: this.dataSnapshot.inputModality,
      totalVerifiedCredits: this.dataSnapshot.totalVerifiedCredits,
      totalReworkCredits: this.dataSnapshot.totalReworkCredits,
      roundTraces: this.dataSnapshot.roundTraces,
      creditEfficiency: this.rank.creditEfficiency,
      rank: this.rank.rank,
      bestPersistence: this.resultBestPersistence(),
      outcome: this.dataSnapshot.outcome
    });
  }

  private resultBestPersistence(): ResultBestPersistence {
    if (this.bestSaveResult) {
      return this.bestSaveResult;
    }

    return {
      status: "not-attempted",
      achieved: null,
      persisted: this.persistedBestRecord
    };
  }

  private handleSemanticAction(actionId: string): void {
    if (actionId === "token-log") {
      this.commandTokenLog();
      return;
    }
    if (actionId === "retry") {
      this.commandRetry();
      return;
    }
    if (actionId === "menu") {
      this.commandReturnToMenu();
    }
  }

  private commandTokenLog(): void {
    if (!this.beginNavigation()) {
      return;
    }
    this.audio.play("ui");
    this.scene.start("TokenLogScene");
  }

  private commandRetry(): void {
    if (!this.beginNavigation()) {
      return;
    }

    this.audio.play("ui");
    this.scene.start("PlayScene", { tutorial: false, startSource: "results-retry" });
  }

  private commandReturnToMenu(): void {
    if (!this.beginNavigation()) {
      return;
    }

    this.audio.play("ui");
    this.scene.start("MenuScene");
  }

  private beginNavigation(): boolean {
    if (this.navigationStarted) {
      return false;
    }

    this.navigationStarted = true;
    return true;
  }

  private publishSemanticSnapshot(): void {
    if (!this.semanticLease) {
      return;
    }

    this.semanticLease.publish(resultsSemanticSnapshot({
      title: this.titleText(),
      summary: this.summaryText(),
      metricRows: this.resultMetricRows(),
      outcomeAnnouncementId: this.announceOutcomeOnNextPublish
        ? `results:${this.dataSnapshot.runId ?? "unknown"}:outcome`
        : undefined
    }));
    this.announceOutcomeOnNextPublish = false;
  }

  private computeLayoutForMetricRows(metricRows: ResultMetricRow[]): ResultsLayout {
    return computeResultsLayout(
      this.scale.width,
      this.scale.height,
      readSafeAreaInsetsForSurface(readSurfaceProfile()),
      { metricCount: metricRows.length }
    );
  }

  private writeResultsQaSnapshot(layout: ResultsLayout): void {
    if (!import.meta.env.DEV) {
      return;
    }

    writeGameQaSnapshot(resultsSceneQaSnapshot({
      width: this.scale.width,
      height: this.scale.height,
      layout,
      outcome: this.dataSnapshot.outcome,
      rounds: this.dataSnapshot.rounds,
      runId: this.dataSnapshot.runId,
      startSource: this.dataSnapshot.startSource,
      inputModality: this.dataSnapshot.inputModality,
      rank: this.rank.rank,
      titleText: this.titleText(),
      summaryText: this.summaryText(),
      ledgerText: this.resultLedgerText(),
      metricRows: this.resultMetricRows(),
      playtestSummaryText: this.playtestSummaryText(),
      reviewButtonText: RESULTS_TOKEN_LOG_ACTION_LABEL
    }));
  }
}

function tokenCredits(value: number): string {
  return `${Math.max(0, Math.floor(value))} TC`;
}

function count(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function metricAccentColor(row: ResultMetricRow): number {
  if (row.tone === "gain") return uiPalette.oxidizedGreen;
  if (row.tone === "loss") return uiPalette.warning;
  return uiPalette.amber;
}

function metricTextColor(row: ResultMetricRow): string {
  if (row.tone === "gain") return "#3f7358";
  if (row.tone === "loss") return "#b6534a";
  return uiPalette.text;
}
