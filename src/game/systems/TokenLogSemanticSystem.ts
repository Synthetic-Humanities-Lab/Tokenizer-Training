import type {
  SemanticContentGroup,
  SemanticSnapshot
} from "../semantic/SemanticRuntime";
import {
  DISPLAY_SPACE_MARKER,
  TOKEN_ID_ENCODING
} from "./TokenDisplaySystem";
import {
  tokenLogEntryMetadata,
  type TokenLogEntry,
  type TokenLogSummary
} from "./TokenLogSystem";

export function tokenLogSemanticSnapshot(
  entries: readonly TokenLogEntry[],
  summary: TokenLogSummary,
  canGoPrevious: boolean,
  canGoNext: boolean
): SemanticSnapshot {
  return {
    scene: "token-log",
    heading: "Token Log",
    summary: tokenLogSemanticLegend(summary),
    groups: entries.map((entry, index) => tokenLogSemanticGroup(entry, index)),
    actions: [
      { id: "previous", label: "Previous page", disabled: !canGoPrevious },
      { id: "back", label: "Back" },
      { id: "next", label: "Next page", disabled: !canGoNext }
    ]
  };
}

function tokenLogSemanticGroup(
  entry: TokenLogEntry,
  entryIndex: number
): SemanticContentGroup {
  return {
    id: entry.id,
    heading: `${entry.text}: ${entry.successful ? "Correct" : "Review"}`,
    sourceText: entry.text,
    metadata: tokenLogEntryMetadata(entry),
    mappings: entry.tokenMappings.map((mapping, mappingIndex) => ({
      id: `${entry.id}:token-${mappingIndex + 1}`,
      positionLabel: `Token piece ${mappingIndex + 1}`,
      rawText: mapping.rawText,
      displayText: mapping.displayText,
      ...(mapping.description === undefined ? {} : { description: mapping.description }),
      valueLabel: `${TOKEN_ID_ENCODING} ID`,
      value: mapping.tokenId
    }))
  };
}

function tokenLogSemanticLegend(summary: TokenLogSummary): string {
  const progress = summary.totalCount === 0
    ? `No encountered sentences have been recorded yet. The catalog contains ${summary.quota} samples.`
    : summary.totalCount >= summary.quota
      ? `Catalog complete: ${summary.quota} of ${summary.quota} unique samples recorded; ${summary.correctCount} correct and ${summary.reviewCount} marked for review.`
      : `${summary.totalCount} of ${summary.quota} unique samples recorded; ${summary.correctCount} correct and ${summary.reviewCount} marked for review.`;
  return `${progress} ${TOKEN_ID_ENCODING} IDs are tokenizer vocabulary lookup numbers, not scores. ` +
    `The "${DISPLAY_SPACE_MARKER}" marker means U+0020 SPACE; other whitespace markers name their Unicode code points.`;
}
