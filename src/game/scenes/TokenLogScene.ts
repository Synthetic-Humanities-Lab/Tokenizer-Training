import Phaser from "phaser";
import { readSemanticRuntime, type SemanticLease } from "../semantic/SemanticRuntime";
import { AudioSystem } from "../systems/AudioSystem";
import { bindCanvasButtonActivation } from "../systems/CanvasButtonActivationSystem";
import { clearGameQaSnapshot, writeGameQaSnapshot, type GameQaElement } from "../systems/GameQaSystem";
import { readSafeAreaInsetsForSurface } from "../systems/SafeAreaSystem";
import { StorageSystem } from "../systems/StorageSystem";
import { readSurfaceProfile } from "../systems/SurfaceProfileSystem";
import {
  computeTokenLogLayout,
  computeTokenLogTokenCells,
  summarizeTokenLog,
  tokenLogEntries,
  tokenLogEntryMetadata,
  tokenLogPage,
  tokenLogPageCount,
  tokenLogQuotaProgress,
  type TokenLogEntry,
  type TokenLogLayout,
  type TokenLogRect,
  type TokenLogSummary
} from "../systems/TokenLogSystem";
import { tokenLogSemanticSnapshot } from "../systems/TokenLogSemanticSystem";
import { buttonVisual, drawDegradedBrowserSurface, uiFonts, uiPalette } from "../ui/VisualTheme";

interface TokenLogSceneRoute {
  semanticEntry?: boolean;
}

interface TokenLogRenderContent {
  entries: TokenLogEntry[];
  pageEntries: TokenLogEntry[];
  summary: TokenLogSummary;
  pageCount: number;
}

export class TokenLogScene extends Phaser.Scene {
  private readonly storage = new StorageSystem();
  private readonly audio = new AudioSystem(this.storage.loadMuted());
  private elements: Phaser.GameObjects.GameObject[] = [];
  private semanticLease?: SemanticLease;
  private navigationStarted = false;
  private pageIndex = 0;

  constructor() {
    super("TokenLogScene");
  }

  create(data: TokenLogSceneRoute = {}): void {
    this.navigationStarted = false;
    this.pageIndex = 0;
    this.audio.setMuted(this.storage.loadMuted());
    this.semanticLease?.dispose();
    this.semanticLease = readSemanticRuntime(this.registry)?.mount("token-log", (actionId) => {
      this.handleSemanticAction(actionId);
    });
    this.scale.on("resize", this.render, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.navigationStarted = true;
      this.scale.off("resize", this.render, this);
      this.semanticLease?.dispose();
      this.semanticLease = undefined;
      this.elements = [];
      clearGameQaSnapshot();
    });
    this.render();
    if (data.semanticEntry === true) {
      this.semanticLease?.focusHeading();
    }
  }

  private render(): void {
    this.elements.forEach((element) => element.destroy());
    this.elements = [];

    const width = this.scale.width;
    const height = this.scale.height;
    const surfaceProfile = readSurfaceProfile();
    const safeArea = readSafeAreaInsetsForSurface(surfaceProfile);
    const layout = computeTokenLogLayout(width, height, surfaceProfile === "mobile", safeArea);
    const entries = tokenLogEntries(this.storage.loadTokenLogSentences());
    const pageCount = tokenLogPageCount(entries.length);
    this.pageIndex = Math.min(this.pageIndex, pageCount - 1);
    const content: TokenLogRenderContent = {
      entries,
      pageEntries: tokenLogPage(entries, this.pageIndex),
      summary: summarizeTokenLog(entries, this.pageIndex),
      pageCount
    };
    const canGoPrevious = this.pageIndex > 0;
    const canGoNext = this.pageIndex < pageCount - 1;

    this.addElement(this.add.rectangle(width / 2, height / 2, width, height, uiPalette.shell));
    this.addGrid(width, height);
    this.addElement(this.add.rectangle(layout.card.x + 4, layout.card.y + 5, layout.card.width, layout.card.height, uiPalette.panelShadow, 0.14));
    this.addElement(this.add.rectangle(layout.card.x, layout.card.y, layout.card.width, layout.card.height, uiPalette.panel, 0.96).setStrokeStyle(1, uiPalette.strokeDark, 0.78));
    this.addCardHeaderRule(layout);
    this.addElement(this.add.text(layout.title.x, layout.title.y, "Token Log", {
      fontFamily: uiFonts.display,
      fontSize: `${layout.title.fontSize}px`,
      color: uiPalette.text,
      align: "center",
      wordWrap: { width: layout.title.width }
    }).setOrigin(0.5));
    this.addElement(this.add.text(layout.subtitle.x, layout.subtitle.y, content.summary.label, {
      fontFamily: uiFonts.mono,
      fontSize: `${layout.subtitle.fontSize}px`,
      color: uiPalette.text,
      align: "center",
      wordWrap: { width: layout.subtitle.width }
    }).setOrigin(0.5));
    this.addQuotaProgress(layout, content.summary);

    if (content.pageEntries.length === 0) {
      this.drawEmptyState(layout);
    } else {
      content.pageEntries.forEach((entry, index) => {
        const row = layout.rows[index];
        if (row) {
          this.drawEntry(row, entry);
        }
      });
    }

    this.createButton(layout.previousButton, "Previous", () => this.changePage(-1, false), !canGoPrevious);
    this.createButton(layout.backButton, "Back", () => this.commandBack(false));
    this.createButton(layout.nextButton, "Next", () => this.changePage(1, false), !canGoNext);
    this.writeQaSnapshot(layout, content);
    this.semanticLease?.publish(
      tokenLogSemanticSnapshot(content.pageEntries, content.summary, canGoPrevious, canGoNext)
    );
  }

  private handleSemanticAction(actionId: string): void {
    if (actionId === "previous") {
      this.changePage(-1, true);
      return;
    }
    if (actionId === "next") {
      this.changePage(1, true);
      return;
    }
    if (actionId === "back") {
      this.commandBack(true);
    }
  }

  private changePage(direction: -1 | 1, restoreSemanticFocus: boolean): void {
    const pageCount = tokenLogPageCount(this.storage.loadTokenLogSentences().length);
    const nextPage = Math.min(pageCount - 1, Math.max(0, this.pageIndex + direction));
    if (nextPage === this.pageIndex) {
      return;
    }

    this.pageIndex = nextPage;
    this.audio.play("ui");
    this.render();
    if (restoreSemanticFocus) {
      this.semanticLease?.focusAction(direction < 0 ? "previous" : "next");
    }
  }

  private commandBack(restoreSemanticFocus: boolean): void {
    if (!this.beginNavigation()) {
      return;
    }

    this.audio.play("ui");
    if (restoreSemanticFocus) {
      this.scene.start("MenuScene", { semanticFocusActionId: "token-log" });
      return;
    }
    this.scene.start("MenuScene");
  }

  private beginNavigation(): boolean {
    if (this.navigationStarted) {
      return false;
    }

    this.navigationStarted = true;
    return true;
  }

  private drawEntry(row: TokenLogRect, entry: TokenLogEntry): void {
    const left = row.x - row.width / 2;
    const top = row.y - row.height / 2;
    const right = row.x + row.width / 2;
    const compact = row.width < 500;
    const statusColor = entry.successful ? "#28583d" : "#944417";

    const rowRule = this.add.graphics();
    rowRule.lineStyle(1, uiPalette.stroke, 0.44);
    rowRule.lineBetween(left, top + row.height, right, top + row.height);
    this.addElement(rowRule);
    this.addElement(this.add.rectangle(left + 2, row.y, 4, row.height - 4, entry.successful ? 0x436c53 : 0xb45d24, 0.82));
    this.addElement(this.add.text(left + 12, top + (compact ? 9 : 10), entry.text, {
      fontFamily: uiFonts.body,
      fontSize: `${sentenceTextSize(entry.text, row.width, compact)}px`,
      color: uiPalette.text
    }).setOrigin(0, 0));
    this.addElement(this.add.text(right - 12, top + (compact ? 27 : 29), tokenLogEntryMetadata(entry), {
      fontFamily: uiFonts.mono,
      fontSize: compact ? "10px" : "11px",
      color: statusColor,
      align: "right"
    }).setOrigin(1, 0));

    computeTokenLogTokenCells(row, entry.tokenMappings.length).forEach((cell) => {
      const mapping = entry.tokenMappings[cell.index];
      if (!mapping) return;

      this.addElement(this.add.rectangle(
        cell.x,
        cell.y,
        cell.width,
        cell.height,
        uiPalette.panelTint,
        cell.index % 2 === 0 ? 0.3 : 0.18
      ));
      const twoLineCell = cell.height >= 28;
      this.addElement(this.add.text(cell.x, cell.y - (twoLineCell ? Math.min(6, cell.height * 0.18) : 0), `<${mapping.displayText}>`, {
        fontFamily: uiFonts.mono,
        fontSize: `${tokenCellTextSize(mapping.displayText, cell.width, compact)}px`,
        color: uiPalette.text,
        align: "center"
      }).setOrigin(0.5));
      if (twoLineCell) {
        this.addElement(this.add.text(cell.x, cell.y + Math.min(8, cell.height * 0.23), `ID ${mapping.tokenId}`, {
          fontFamily: uiFonts.mono,
          fontSize: compact ? "10px" : "11px",
          color: "#944417",
          align: "center"
        }).setOrigin(0.5));
      }
    });
  }

  private drawEmptyState(layout: TokenLogLayout): void {
    const centerY = layout.rows[0].y + layout.rows[0].height * 0.18;
    this.addElement(this.add.text(layout.card.x, centerY - 12, "No sentences recorded yet.", {
      fontFamily: uiFonts.body,
      fontSize: layout.compact ? "18px" : "20px",
      color: uiPalette.text,
      align: "center"
    }).setOrigin(0.5));
    this.addElement(this.add.text(layout.card.x, centerY + 20, "Resolve tutorial rounds to build your record.", {
      fontFamily: uiFonts.mono,
      fontSize: layout.compact ? "12px" : "13px",
      color: uiPalette.textMuted,
      align: "center"
    }).setOrigin(0.5));
  }

  private createButton(bounds: TokenLogRect, label: string, action: () => void, disabled = false): void {
    const button = this.add.rectangle(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      disabled ? buttonVisual.disabledFill : buttonVisual.fill,
      disabled ? buttonVisual.disabledAlpha : buttonVisual.fillAlpha
    ).setStrokeStyle(1, buttonVisual.stroke, disabled ? 0.48 : 1);
    const text = this.add.text(bounds.x, bounds.y, label, {
      fontFamily: uiFonts.body,
      fontSize: bounds.width < 100 ? "13px" : "14px",
      color: disabled ? uiPalette.textMuted : uiPalette.text
    }).setOrigin(0.5).setAlpha(disabled ? 0.58 : 1);

    if (!disabled) {
      button.setInteractive({ useHandCursor: true });
      bindCanvasButtonActivation({
        button,
        input: this.input,
        onRest: () => button.setFillStyle(buttonVisual.fill, buttonVisual.fillAlpha),
        onHover: () => button.setFillStyle(buttonVisual.hoverFill, buttonVisual.hoverAlpha),
        onPress: () => button.setFillStyle(buttonVisual.pressFill, buttonVisual.pressAlpha),
        onActivate: action
      });
    }
    this.addElement(button);
    this.addElement(text);
  }

  private addGrid(width: number, height: number): void {
    const grid = this.add.graphics();
    drawDegradedBrowserSurface(grid, width, height, { compact: width < 620 });
    this.addElement(grid);
  }

  private addCardHeaderRule(layout: TokenLogLayout): void {
    const rule = this.add.graphics();
    const width = Math.max(0, layout.card.width - 48);
    rule.fillStyle(0xc77c3f, 0.42);
    rule.fillRect(layout.card.x - width / 2, layout.card.y - layout.card.height / 2 + 13, width * 0.28, 3);
    rule.fillStyle(0x6e665c, 0.12);
    rule.fillRect(layout.card.x - width / 2 + width * 0.28, layout.card.y - layout.card.height / 2 + 13, width * 0.72, 3);
    this.addElement(rule);
  }

  private addQuotaProgress(layout: TokenLogLayout, summary: TokenLogSummary): void {
    const progress = tokenLogQuotaProgress(summary.totalCount, summary.quota);
    const left = layout.quotaProgress.x - layout.quotaProgress.width / 2;
    const top = layout.quotaProgress.y - layout.quotaProgress.height / 2;
    const rail = this.add.graphics();
    rail.fillStyle(0x6e665c, 0.14);
    rail.fillRoundedRect(left, top, layout.quotaProgress.width, layout.quotaProgress.height, 2);
    if (progress > 0) {
      rail.fillStyle(summary.remainingCount === 0 ? uiPalette.oxidizedGreen : uiPalette.amber, 0.78);
      rail.fillRoundedRect(
        left,
        top,
        Math.max(1, layout.quotaProgress.width * progress),
        layout.quotaProgress.height,
        2
      );
    }
    this.addElement(rail);
  }

  private addElement<T extends Phaser.GameObjects.GameObject>(element: T): T {
    this.elements.push(element);
    return element;
  }

  private writeQaSnapshot(layout: TokenLogLayout, content: TokenLogRenderContent): void {
    if (!import.meta.env.DEV) {
      return;
    }

    const elements: GameQaElement[] = [
      { id: "card", rect: rectToQa(layout.card) },
      { id: "title", text: "Token Log", rect: textRect(layout.title.x, layout.title.y, layout.title.width, layout.title.fontSize) },
      { id: "subtitle", text: content.summary.label, rect: textRect(layout.subtitle.x, layout.subtitle.y, layout.subtitle.width, layout.subtitle.fontSize) },
      { id: "quotaProgress", text: `${content.summary.totalCount}/${content.summary.quota}`, rect: rectToQa(layout.quotaProgress) },
      { id: "previousButton", text: "Previous", rect: rectToQa(layout.previousButton) },
      { id: "backButton", text: "Back", rect: rectToQa(layout.backButton) },
      { id: "nextButton", text: "Next", rect: rectToQa(layout.nextButton) },
      ...content.pageEntries.map((entry, index): GameQaElement => ({
        id: `tokenLogEntry${index + 1}`,
        text: `${entry.text} ${tokenLogEntryMetadata(entry)} ${entry.tokenMappings.map(({ displayText, tokenId }) => `<${displayText}> ID ${tokenId}`).join(" ")}`,
        rect: rectToQa(layout.rows[index])
      }))
    ];

    writeGameQaSnapshot({
      scene: "TokenLogScene",
      compact: layout.compact,
      viewport: { width: this.scale.width, height: this.scale.height },
      state: {
        entryCount: content.entries.length,
        correctCount: content.summary.correctCount,
        reviewCount: content.summary.reviewCount,
        quota: content.summary.quota,
        quotaRemaining: content.summary.remainingCount,
        page: this.pageIndex + 1,
        pageCount: content.pageCount,
        fixtureIds: content.entries.map(({ id }) => id).join(",")
      },
      elements
    });
  }
}

function tokenCellTextSize(displayText: string, cellWidth: number, compact: boolean): number {
  const preferred = compact ? 10 : 11;
  const estimatedWidthPerEm = 0.62;
  const availableWidth = Math.max(1, cellWidth - 8);
  const fitted = Math.floor(availableWidth / (Math.max(1, displayText.length + 2) * estimatedWidthPerEm));
  return Math.max(7, Math.min(preferred, fitted));
}

function sentenceTextSize(text: string, rowWidth: number, compact: boolean): number {
  const preferred = compact ? 15 : 16;
  const availableWidth = Math.max(1, rowWidth - 24);
  const fitted = Math.floor(availableWidth / (Math.max(1, text.length) * 0.56));
  return Math.max(10, Math.min(preferred, fitted));
}

function rectToQa(rect: TokenLogRect) {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

function textRect(x: number, y: number, width: number, fontSize: number) {
  return { x, y, width, height: fontSize * 1.4 };
}
