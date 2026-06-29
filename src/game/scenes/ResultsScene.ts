import Phaser from "phaser";
import { AudioSystem } from "../systems/AudioSystem";
import { copyTextToClipboard } from "../systems/ClipboardSystem";
import { downloadTextFile, summaryFilename } from "../systems/DownloadSystem";
import { clearGameQaSnapshot, writeGameQaSnapshot } from "../systems/GameQaSystem";
import type { PlaytestInputModality } from "../systems/InputModalitySystem";
import { playtestRunIdFromDate } from "../systems/PlaytestRunSystem";
import { RankSystem, type RankResult } from "../systems/RankSystem";
import { copySummaryButtonLabel, type ResultsCopyState } from "../systems/ResultsCopySystem";
import { computeResultsLayout, type ResultsLayout } from "../systems/ResultsLayoutSystem";
import { resultsSceneQaSnapshot } from "../systems/ResultsSceneQaSystem";
import { SessionFlowSystem, type SessionOutcome, type SessionRoundTrace } from "../systems/SessionFlowSystem";
import type { PlaySessionStartSource } from "../systems/SessionStartSystem";
import { StorageSystem, type HighScoreRecord } from "../systems/StorageSystem";
import { buttonVisual, drawDegradedBrowserSurface, uiFonts, uiPalette } from "../ui/VisualTheme";

export interface ResultsSceneData {
  runId?: string;
  rounds: number;
  balance: number;
  accuracy: number;
  totalCorrectCuts?: number;
  totalMissedCuts?: number;
  totalFalseCuts?: number;
  startSource?: PlaySessionStartSource;
  inputModality?: PlaytestInputModality;
  totalPay: number;
  totalCost: number;
  roundTraces?: SessionRoundTrace[];
  outcome: SessionOutcome;
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
  private copySummaryLabel?: Phaser.GameObjects.Text;
  private summaryButtonState: ResultsCopyState = "idle";
  private dataSnapshot: ResultsSceneData = {
    runId: undefined,
    rounds: 0,
    balance: 0,
    accuracy: 0,
    totalPay: 0,
    totalCost: 0,
    outcome: "budget"
  };
  private rank: RankResult = {
    rank: "Regex Intern",
    rankScore: 0,
    costEfficiency: 0
  };
  private bestRecord: HighScoreRecord | null = null;

  constructor() {
    super("ResultsScene");
  }

  create(data: Partial<ResultsSceneData>): void {
    this.summaryButtonState = "idle";
    this.dataSnapshot = {
      runId: data.runId ?? playtestRunIdFromDate(new Date()),
      rounds: data.rounds ?? 0,
      balance: data.balance ?? 0,
      accuracy: data.accuracy ?? 0,
      totalCorrectCuts: data.totalCorrectCuts,
      totalMissedCuts: data.totalMissedCuts,
      totalFalseCuts: data.totalFalseCuts,
      startSource: data.startSource ?? "unknown",
      inputModality: data.inputModality ?? "none",
      totalPay: data.totalPay ?? 0,
      totalCost: data.totalCost ?? 0,
      roundTraces: data.roundTraces ?? [],
      outcome: data.outcome ?? "budget"
    };
    this.rank = this.rankSystem.calculate(this.dataSnapshot);
    const record = {
      rounds: this.dataSnapshot.rounds,
      balance: this.dataSnapshot.balance,
      accuracy: this.dataSnapshot.accuracy,
      rank: this.rank.rank,
      rankScore: this.rank.rankScore,
      costEfficiency: this.rank.costEfficiency,
      totalPay: this.dataSnapshot.totalPay,
      totalCost: this.dataSnapshot.totalCost
    };
    this.bestRecord = this.sessionFlow.shouldSaveResult(this.dataSnapshot)
      ? this.storage.saveHighScore(record)
      : this.storage.loadHighScore();
    this.scale.on("resize", this.render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.render, this);
      clearGameQaSnapshot();
    });
    this.render();
  }

  private render(): void {
    this.elements.forEach((element) => element.destroy());
    this.elements = [];
    this.copySummaryLabel = undefined;

    const width = this.scale.width;
    const height = this.scale.height;
    const layout = computeResultsLayout(width, height);

    this.addElement(this.add.rectangle(width / 2, height / 2, width, height, uiPalette.shell));
    this.addGrid(width, height);
    this.addElement(this.add.rectangle(layout.panel.x + 5, layout.panel.y + 6, layout.panel.width, layout.panel.height, uiPalette.panelShadow, 0.28));
    this.addElement(this.add.rectangle(layout.panel.x, layout.panel.y, layout.panel.width, layout.panel.height, uiPalette.panel, 0.95).setStrokeStyle(1, uiPalette.strokeDark, 0.96));
    this.addElement(this.add.rectangle(layout.chrome.x, layout.chrome.y, layout.chrome.width, layout.chrome.height, uiPalette.panelTint, 0.92).setStrokeStyle(1, uiPalette.stroke, 0.9));
    this.addElement(
      this.add.text(layout.chromeText.x, layout.chromeText.y, layout.chromeText.text, {
        fontFamily: uiFonts.mono,
        fontSize: `${layout.chromeText.fontSize}px`,
        color: uiPalette.textMuted
      }).setOrigin(0, 0.5)
    );
    this.addElement(
      this.add.text(layout.title.x, layout.title.y, this.titleText(), {
        fontFamily: uiFonts.body,
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
    this.drawMetricRows(layout, this.resultMetricRows());

    this.createButton(layout.copyButton, copySummaryButtonLabel(this.summaryButtonState), () => {
      this.audio.play("ui");
      void this.handleSummaryAction();
    }, (text) => {
      this.copySummaryLabel = text;
    });
    this.createButton(layout.againButton, "Run Training Again", () => {
      this.audio.play("ui");
      this.scene.start("PlayScene", { tutorial: false, startSource: "results-retry" });
    });
    this.createButton(layout.menuButton, "Return to Menu", () => {
      this.audio.play("ui");
      this.scene.start("MenuScene");
    });
    this.writeResultsQaSnapshot(layout);
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
    button.on("pointerover", () => button.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha));
    button.on("pointerout", () => button.setFillStyle(buttonVisual.fill, buttonVisual.fillAlpha));
    button.on("pointerdown", () => button.setFillStyle(buttonVisual.pressFill, buttonVisual.pressAlpha));
    button.on("pointerup", () => {
      button.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha);
      action();
    });
    bindText?.(text);
    this.addElement(button);
    this.addElement(text);
  }

  private addElement<T extends Phaser.GameObjects.GameObject>(element: T): T {
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
      const labelSize = layout.compact ? 8 : 9;
      const valueSize = layout.compact ? 10 : 13;

      frame.fillStyle(uiPalette.panelLight, 0.72);
      frame.fillRoundedRect(left, top, card.width, card.height, 5);
      frame.lineStyle(1, uiPalette.stroke, 0.74);
      frame.strokeRoundedRect(left, top, card.width, card.height, 5);
      frame.fillStyle(metricAccentColor(row), 0.38);
      frame.fillRect(left + 1, top + 1, 4, card.height - 2);

      this.addElement(this.add.text(left + 9, top + (layout.compact ? 3 : 5), row.label, {
        fontFamily: uiFonts.mono,
        fontSize: `${labelSize}px`,
        color: uiPalette.textFaint
      }));
      this.addElement(this.add.text(left + 9, top + (layout.compact ? 13 : 18), row.value, {
        fontFamily: uiFonts.body,
        fontSize: `${valueSize}px`,
        color: metricTextColor(row),
        wordWrap: { width: card.width - 16 }
      }));
    });
  }

  private titleText(): string {
    return this.sessionFlow.resultCopy(this.dataSnapshot.outcome).title;
  }

  private summaryText(): string {
    return this.sessionFlow.resultCopy(this.dataSnapshot.outcome).summary;
  }

  private resultLedgerText(): string {
    const input = {
      runId: this.dataSnapshot.runId,
      rounds: this.dataSnapshot.rounds,
      balance: this.dataSnapshot.balance,
      accuracy: this.dataSnapshot.accuracy,
      totalCorrectCuts: this.dataSnapshot.totalCorrectCuts,
      totalMissedCuts: this.dataSnapshot.totalMissedCuts,
      totalFalseCuts: this.dataSnapshot.totalFalseCuts,
      startSource: this.dataSnapshot.startSource,
      inputModality: this.dataSnapshot.inputModality,
      totalPay: this.dataSnapshot.totalPay,
      totalCost: this.dataSnapshot.totalCost,
      costEfficiency: this.rank.costEfficiency,
      rank: this.rank.rank,
      bestRounds: this.bestRecord?.rounds ?? 0,
      bestRank: this.bestRecord?.rank ?? "Regex Intern"
    };

    return computeResultsLayout(this.scale.width, this.scale.height).compact
      ? this.sessionFlow.compactResultLedgerText(input)
      : this.sessionFlow.resultLedgerText(input);
  }

  private resultMetricRows(): ResultMetricRow[] {
    const correct = Math.max(0, Math.floor(this.dataSnapshot.totalCorrectCuts ?? 0));
    const missed = Math.max(0, Math.floor(this.dataSnapshot.totalMissedCuts ?? 0));
    const falseCuts = Math.max(0, Math.floor(this.dataSnapshot.totalFalseCuts ?? 0));
    const accuracy = `${Math.round(Math.max(0, Math.min(1, this.dataSnapshot.accuracy)) * 100)}%`;
    const net = this.dataSnapshot.totalPay - this.dataSnapshot.totalCost;

    return [
      { id: "run", label: "RUN", value: `${Math.max(0, Math.floor(this.dataSnapshot.rounds))} rounds` },
      { id: "cuts", label: "CUTS", value: `OK ${correct} / M ${missed} / F ${falseCuts}` },
      { id: "accuracy", label: "ACCURACY", value: accuracy },
      { id: "pay", label: "PAY", value: money(this.dataSnapshot.totalPay), tone: "gain" },
      { id: "cost", label: "COST", value: money(this.dataSnapshot.totalCost), tone: "loss" },
      { id: "net", label: "NET", value: signedMoney(net), tone: net >= 0 ? "gain" : "loss" },
      { id: "balance", label: "BALANCE", value: money(Math.max(0, this.dataSnapshot.balance)) },
      { id: "efficiency", label: "EFFICIENCY", value: `${Math.max(0, this.rank.costEfficiency).toFixed(2)}x` },
      { id: "rank", label: "RANK", value: this.rank.rank }
    ];
  }

  private playtestSummaryText(): string {
    return this.sessionFlow.playtestSummaryText({
      runId: this.dataSnapshot.runId,
      rounds: this.dataSnapshot.rounds,
      balance: this.dataSnapshot.balance,
      accuracy: this.dataSnapshot.accuracy,
      totalCorrectCuts: this.dataSnapshot.totalCorrectCuts,
      totalMissedCuts: this.dataSnapshot.totalMissedCuts,
      totalFalseCuts: this.dataSnapshot.totalFalseCuts,
      startSource: this.dataSnapshot.startSource,
      inputModality: this.dataSnapshot.inputModality,
      totalPay: this.dataSnapshot.totalPay,
      totalCost: this.dataSnapshot.totalCost,
      roundTraces: this.dataSnapshot.roundTraces,
      costEfficiency: this.rank.costEfficiency,
      rank: this.rank.rank,
      bestRounds: this.bestRecord?.rounds ?? 0,
      bestRank: this.bestRecord?.rank ?? "Regex Intern",
      outcome: this.dataSnapshot.outcome
    });
  }

  private async handleSummaryAction(): Promise<void> {
    if (this.summaryButtonState === "download" || this.summaryButtonState === "saved") {
      this.savePlaytestSummary();
      return;
    }

    await this.copyPlaytestSummary();
  }

  private async copyPlaytestSummary(): Promise<void> {
    const result = await copyTextToClipboard(this.playtestSummaryText());
    this.setSummaryButtonState(result === "copied" ? "copied" : "download");
  }

  private savePlaytestSummary(): void {
    const result = downloadTextFile(
      this.playtestSummaryText(),
      summaryFilename(this.dataSnapshot.runId)
    );
    this.setSummaryButtonState(result === "saved" ? "saved" : "unavailable");
  }

  private setSummaryButtonState(state: ResultsCopyState): void {
    this.summaryButtonState = state;
    this.copySummaryLabel?.setText(copySummaryButtonLabel(state));
    this.writeResultsQaSnapshot(computeResultsLayout(this.scale.width, this.scale.height));
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
      copySummaryText: this.playtestSummaryText(),
      copyButtonText: this.copySummaryLabel?.text ?? copySummaryButtonLabel(this.summaryButtonState)
    }));
  }
}

function money(value: number): string {
  return `$${Math.max(0, value).toFixed(2)}`;
}

function signedMoney(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  return `${amount >= 0 ? "+" : "-"}$${Math.abs(amount).toFixed(2)}`;
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
