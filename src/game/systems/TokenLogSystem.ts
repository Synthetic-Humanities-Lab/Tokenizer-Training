import { safeAreaInsets, type SafeAreaInput } from "./SafeAreaSystem";
import type {
  TokenLogSentenceObservation,
  TokenLogSentenceRecord
} from "./StorageSystem";
import {
  orderedTokenIdMappings,
  type OrderedTokenIdMapping
} from "./TokenDisplaySystem";
import type { TokenFixture } from "./TokenizerSystem";
import type { RoundScoreResult } from "./ScoringSystem";

export interface TokenLogEntry {
  readonly id: string;
  readonly text: string;
  readonly attempts: number;
  readonly successfulAttempts: number;
  readonly successful: boolean;
  readonly tokenMappings: readonly OrderedTokenIdMapping[];
  readonly fixtureIds: readonly string[];
}

export interface TokenLogSummary {
  totalCount: number;
  correctCount: number;
  reviewCount: number;
  quota: number;
  remainingCount: number;
  label: string;
}

export interface TokenLogRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TokenLogLayout {
  compact: boolean;
  card: TokenLogRect;
  title: { x: number; y: number; fontSize: number; width: number };
  subtitle: { x: number; y: number; fontSize: number; width: number };
  quotaProgress: TokenLogRect;
  rows: TokenLogRect[];
  previousButton: TokenLogRect;
  backButton: TokenLogRect;
  nextButton: TokenLogRect;
}

export interface TokenLogTokenCellLayout extends TokenLogRect {
  readonly index: number;
}

export const TOKEN_LOG_PAGE_SIZE = 3;
export const TOKEN_LOG_QUOTA = 200;

export function tokenLogSentenceObservation(
  fixture: TokenFixture,
  score: Pick<RoundScoreResult, "missedCuts" | "falseCuts">
): TokenLogSentenceObservation {
  return {
    fixtureId: fixture.id,
    text: fixture.text,
    successful: score.missedCuts.length === 0 && score.falseCuts.length === 0,
    tokenStrings: [...fixture.token_strings],
    tokenIds: [...fixture.token_ids]
  };
}

export function tokenLogEntries(records: readonly TokenLogSentenceRecord[]): TokenLogEntry[] {
  return records.map((record) => ({
    id: record.id,
    text: record.text,
    attempts: record.attempts,
    successfulAttempts: record.successfulAttempts,
    successful: record.lastSuccessful,
    tokenMappings: orderedTokenIdMappings(record.tokenStrings, record.tokenIds),
    fixtureIds: Object.freeze([...record.fixtureIds])
  }));
}

export function tokenLogEntryMetadata(entry: TokenLogEntry): string {
  const status = entry.successful ? "CORRECT" : "REVIEW";
  const attempts = entry.attempts === 1 ? "SEEN ONCE" : `SEEN ${entry.attempts} TIMES`;
  return `${status} / ${attempts}`;
}

export function summarizeTokenLog(entries: readonly TokenLogEntry[], pageIndex: number): TokenLogSummary {
  const totalCount = entries.length;
  const correctCount = entries.filter(({ successful }) => successful).length;
  const reviewCount = totalCount - correctCount;
  const remainingCount = Math.max(0, TOKEN_LOG_QUOTA - totalCount);
  const pageCount = tokenLogPageCount(totalCount);
  const safePageIndex = normalizedPageIndex(pageIndex, pageCount);

  return {
    totalCount,
    correctCount,
    reviewCount,
    quota: TOKEN_LOG_QUOTA,
    remainingCount,
    label: totalCount === 0
      ? `SAMPLES 0/${TOKEN_LOG_QUOTA} / NO RECORDS`
      : totalCount >= TOKEN_LOG_QUOTA
        ? `SAMPLES ${TOKEN_LOG_QUOTA}/${TOKEN_LOG_QUOTA} / COMPLETE / REVIEW ${reviewCount} / PAGE ${safePageIndex + 1}/${pageCount}`
        : `SAMPLES ${totalCount}/${TOKEN_LOG_QUOTA} / REVIEW ${reviewCount} / PAGE ${safePageIndex + 1}/${pageCount}`
  };
}

export function tokenLogPage(entries: readonly TokenLogEntry[], pageIndex: number): TokenLogEntry[] {
  const pageCount = tokenLogPageCount(entries.length);
  const safePageIndex = normalizedPageIndex(pageIndex, pageCount);
  const start = safePageIndex * TOKEN_LOG_PAGE_SIZE;
  return entries.slice(start, start + TOKEN_LOG_PAGE_SIZE);
}

export function tokenLogPageCount(entryCount: number): number {
  const count = Number.isFinite(entryCount) ? Math.max(0, Math.floor(entryCount)) : 0;
  return Math.max(1, Math.ceil(count / TOKEN_LOG_PAGE_SIZE));
}

export function tokenLogQuotaProgress(totalCount: number, quota = TOKEN_LOG_QUOTA): number {
  const normalizedQuota = Number.isFinite(quota) ? Math.max(1, Math.floor(quota)) : TOKEN_LOG_QUOTA;
  const normalizedCount = Number.isFinite(totalCount) ? Math.max(0, Math.floor(totalCount)) : 0;
  return Math.min(1, normalizedCount / normalizedQuota);
}

export function computeTokenLogLayout(
  width: number,
  height: number,
  mobileSurface: boolean,
  safeAreaInput?: SafeAreaInput
): TokenLogLayout {
  const safeArea = safeAreaInsets(safeAreaInput);
  const usableWidth = Math.max(0, width - safeArea.left - safeArea.right);
  const usableHeight = Math.max(0, height - safeArea.top - safeArea.bottom);
  const compact = mobileSurface || width < 620;
  const cardWidth = Math.min(compact ? 430 : 760, usableWidth - 24);
  const cardHeight = Math.min(usableHeight - 24, compact ? 700 : 600);
  const cardX = safeArea.left + usableWidth / 2;
  const cardY = safeArea.top + usableHeight / 2;
  const top = cardY - cardHeight / 2;
  const bottom = cardY + cardHeight / 2;
  const rowGap = compact ? 8 : 10;
  const controlsHeight = compact ? 46 : 42;
  const controlsY = bottom - 36;
  const rowsTop = top + 112;
  const rowsBottom = controlsY - controlsHeight / 2 - 12;
  const rowHeight = (rowsBottom - rowsTop - rowGap * (TOKEN_LOG_PAGE_SIZE - 1)) / TOKEN_LOG_PAGE_SIZE;
  const rows = Array.from({ length: TOKEN_LOG_PAGE_SIZE }, (_, index): TokenLogRect => ({
    x: cardX,
    y: rowsTop + rowHeight / 2 + index * (rowHeight + rowGap),
    width: cardWidth - 36,
    height: rowHeight
  }));
  const controlGap = 8;
  const controlWidth = (cardWidth - 44 - controlGap * 2) / 3;
  const firstControlX = cardX - cardWidth / 2 + 22 + controlWidth / 2;

  return {
    compact,
    card: { x: cardX, y: cardY, width: cardWidth, height: cardHeight },
    title: { x: cardX, y: top + 46, fontSize: compact ? 32 : 38, width: cardWidth - 48 },
    subtitle: { x: cardX, y: top + 81, fontSize: compact ? 12 : 13, width: cardWidth - 52 },
    quotaProgress: { x: cardX, y: top + 101, width: cardWidth - 52, height: 4 },
    rows,
    previousButton: { x: firstControlX, y: controlsY, width: controlWidth, height: controlsHeight },
    backButton: { x: firstControlX + controlWidth + controlGap, y: controlsY, width: controlWidth, height: controlsHeight },
    nextButton: { x: firstControlX + (controlWidth + controlGap) * 2, y: controlsY, width: controlWidth, height: controlsHeight }
  };
}

export function computeTokenLogTokenCells(
  row: TokenLogRect,
  tokenCount: number
): TokenLogTokenCellLayout[] {
  if (!Number.isFinite(tokenCount) || tokenCount <= 0) {
    return [];
  }

  const count = Math.floor(tokenCount);
  const compact = row.width < 500;
  const columns = count <= 3 ? count : Math.ceil(count / 2);
  const rows = Math.ceil(count / columns);
  const horizontalPadding = compact ? 10 : 12;
  const bottomPadding = compact ? 8 : 10;
  const contentTop = row.y - row.height / 2 + (compact ? 42 : 48);
  const contentBottom = row.y + row.height / 2 - bottomPadding;
  const gap = compact ? 4 : 6;
  const availableWidth = Math.max(0, row.width - horizontalPadding * 2 - gap * (columns - 1));
  const availableHeight = Math.max(0, contentBottom - contentTop - gap * (rows - 1));
  const cellWidth = availableWidth / columns;
  const cellHeight = availableHeight / rows;
  return Array.from({ length: count }, (_, index): TokenLogTokenCellLayout => {
    const rowIndex = Math.floor(index / columns);
    const columnIndex = index % columns;
    const entriesInRow = Math.min(columns, count - rowIndex * columns);
    const occupiedWidth = entriesInRow * cellWidth + (entriesInRow - 1) * gap;
    const rowLeft = row.x - occupiedWidth / 2;

    return {
      index,
      x: rowLeft + columnIndex * (cellWidth + gap) + cellWidth / 2,
      y: contentTop + rowIndex * (cellHeight + gap) + cellHeight / 2,
      width: cellWidth,
      height: cellHeight
    };
  });
}

function normalizedPageIndex(pageIndex: number, pageCount: number): number {
  if (!Number.isFinite(pageIndex)) {
    return 0;
  }
  return Math.min(pageCount - 1, Math.max(0, Math.floor(pageIndex)));
}
