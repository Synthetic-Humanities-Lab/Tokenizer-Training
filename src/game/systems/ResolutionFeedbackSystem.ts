import type { AudioCue } from "./AudioSystem";
import type { HapticFeedbackCue } from "./HapticFeedbackSystem";

export interface ResolutionAudioInput {
  missedCuts: number[];
  falseCuts: number[];
  balance: number;
}

export interface ResolutionVisualInput {
  correctCuts: number[];
  missedCuts: number[];
  falseCuts: number[];
}

export interface ResolutionReviewDelayInput {
  tutorialMode: boolean;
  finalTutorialRound?: boolean;
  category: string;
  textLength: number;
  tokenCount: number;
  missedCuts: number[];
  falseCuts: number[];
}

export type ResolutionCutKind = "correct" | "missed" | "false";
export type ResolutionCommitTrigger = "manual" | "deadline";

export interface ResolutionCutVisualGroup {
  kind: ResolutionCutKind;
  cuts: number[];
  color: number;
  label: string;
  labelOffsetY: number;
  flash: boolean;
  revealDelayMs: number;
  flashDurationMs: number;
}

export type ResolutionCutLabelMode = "all" | "first-by-kind" | "none";

export interface ResolutionCutLabelModeInput {
  totalCutCount: number;
  cutXs: number[];
  minGap: number;
  maxFullLabels?: number;
}

export interface ResolutionCutLabelGroupInput {
  cutXs: number[];
  minGap: number;
}

export interface ResolutionCutLabelGroupModeInput {
  groups: ResolutionCutLabelGroupInput[];
  maxFullLabels?: number;
}

export interface ResolutionCommitBeatStyle {
  durationMs: number;
  bandPaddingX: number;
  bandPaddingY: number;
  bandAlpha: number;
  haloWidth: number;
  haloAlpha: number;
  lineWidth: number;
  lineAlpha: number;
  capRadius: number;
}

export interface ResolutionAuditLegendItem {
  kind: ResolutionCutKind;
  label: string;
  color: number;
  count: number;
  text: string;
}

const DENSE_REVIEW_CATEGORIES = new Set(["url", "email", "filename", "code", "hashtag"]);
export const RESOLUTION_LABEL_ROW_STEP = 12;
export const COMPACT_RESOLUTION_LABEL_ROW_STEP = 8;
export const RESOLUTION_LABEL_ROW_COUNT = 2;
export const RESOLUTION_FULL_LABEL_LIMIT = 8;
export const RESOLUTION_STAGGERED_LABEL_MIN_GAP_RATIO = 0.86;
export const RESOLUTION_CROSS_KIND_LABEL_MIN_GAP = 30;
export const RESOLUTION_AUDIT_LEGEND_PROMPT_OFFSET_Y = 25;
export const COMPACT_RESOLUTION_AUDIT_LEGEND_PROMPT_OFFSET_Y = 26;

export function resolutionCutLabelMinGap(label: string, compact = false): number {
  const normalizedLength = Math.max(0, label.trim().length);
  const base = normalizedLength <= 2
    ? 34
    : normalizedLength <= 4
      ? 44
      : 52;

  return compact ? base + 6 : base;
}

export function resolutionCommitBeatStyle(
  submittedCutCount: number,
  compact = false,
  trigger: ResolutionCommitTrigger = "manual"
): ResolutionCommitBeatStyle | null {
  const cutCount = Math.max(0, Math.floor(submittedCutCount));
  const deadline = trigger === "deadline";
  if (cutCount === 0) {
    return {
      durationMs: deadline ? compact ? 190 : 230 : compact ? 135 : 165,
      bandPaddingX: compact ? 12 : 16,
      bandPaddingY: compact ? 10 : 12,
      bandAlpha: deadline ? 0.09 : 0.05,
      haloWidth: deadline ? compact ? 7 : 9 : compact ? 5 : 6,
      haloAlpha: deadline ? 0.2 : 0.11,
      lineWidth: deadline ? 3 : 2,
      lineAlpha: deadline ? 0.48 : 0.3,
      capRadius: deadline ? 3 : 2
    };
  }

  const densityBoost = Math.min(0.08, cutCount * 0.012);
  return {
    durationMs: deadline ? compact ? 215 : 255 : compact ? 170 : 210,
    bandPaddingX: compact ? 13 : 18,
    bandPaddingY: compact ? 20 : 25,
    bandAlpha: Math.min(0.22, (deadline ? 0.16 : 0.12) + densityBoost),
    haloWidth: deadline ? compact ? 12 : 15 : compact ? 9 : 12,
    haloAlpha: deadline ? 0.28 : 0.18,
    lineWidth: deadline ? compact ? 4 : 5 : compact ? 3 : 4,
    lineAlpha: deadline ? 0.62 : 0.48,
    capRadius: deadline ? compact ? 4 : 5 : compact ? 3 : 4
  };
}

export function resolutionCommitBeatLabel(
  submittedCutCount: number,
  trigger: ResolutionCommitTrigger = "manual"
): string {
  const cutCount = Math.max(0, Math.floor(Number.isFinite(submittedCutCount) ? submittedCutCount : 0));
  if (cutCount === 0) {
    return trigger === "deadline" ? "TIMEOUT" : "NO CUTS";
  }

  return `${trigger === "deadline" ? "DEADLINE" : "COMMIT"} ${cutCount}`;
}

export function resolutionLabelOffset(baseOffsetY: number, cutIndex: number, compact = false): number {
  const row = Math.max(0, Math.floor(cutIndex)) % RESOLUTION_LABEL_ROW_COUNT;
  const normalizedBaseOffsetY = compact ? compactResolutionLabelBaseOffset(baseOffsetY) : baseOffsetY;
  const rowStep = compact ? COMPACT_RESOLUTION_LABEL_ROW_STEP : RESOLUTION_LABEL_ROW_STEP;
  return normalizedBaseOffsetY + row * rowStep;
}

export function resolutionCutLabelMode(input: ResolutionCutLabelModeInput): ResolutionCutLabelMode {
  const totalCutCount = Math.max(0, Math.floor(input.totalCutCount));
  if (totalCutCount === 0) {
    return "none";
  }

  const maxFullLabels = Math.max(1, Math.floor(input.maxFullLabels ?? RESOLUTION_FULL_LABEL_LIMIT));
  if (totalCutCount > maxFullLabels || !resolutionCutLabelsHaveRoom(input.cutXs, input.minGap)) {
    return "first-by-kind";
  }

  return "all";
}

export function resolutionCutLabelModeForGroups(input: ResolutionCutLabelGroupModeInput): ResolutionCutLabelMode {
  const totalCutCount = input.groups.reduce((total, group) => total + group.cutXs.length, 0);
  if (totalCutCount === 0) {
    return "none";
  }

  const maxFullLabels = Math.max(1, Math.floor(input.maxFullLabels ?? RESOLUTION_FULL_LABEL_LIMIT));
  if (totalCutCount > maxFullLabels) {
    return "first-by-kind";
  }

  const everyGroupHasRoom = input.groups.every((group) =>
    resolutionCutLabelsHaveRoom(group.cutXs, group.minGap)
  );

  return everyGroupHasRoom && resolutionCutLabelGroupsHaveRoom(input.groups) ? "all" : "first-by-kind";
}

export function resolutionCutLabelsHaveRoom(cutXs: number[], minGap: number): boolean {
  const sorted = cutXs
    .filter((x) => Number.isFinite(x))
    .sort((a, b) => a - b);
  const normalizedMinGap = Math.max(0, minGap);
  const staggeredMinGap = Math.max(28, normalizedMinGap * RESOLUTION_STAGGERED_LABEL_MIN_GAP_RATIO);

  for (let index = 1; index < sorted.length; index += 1) {
    const rowsDiffer = index % RESOLUTION_LABEL_ROW_COUNT !== (index - 1) % RESOLUTION_LABEL_ROW_COUNT;
    const requiredGap = rowsDiffer ? staggeredMinGap : normalizedMinGap;
    if (sorted[index] - sorted[index - 1] < requiredGap) {
      return false;
    }
  }

  return true;
}

export function resolutionCutLabelGroupsHaveRoom(
  groups: ResolutionCutLabelGroupInput[],
  minGap = RESOLUTION_CROSS_KIND_LABEL_MIN_GAP
): boolean {
  const normalizedMinGap = Math.max(0, minGap);
  const positions = groups.flatMap((group, groupIndex) =>
    group.cutXs
      .filter((x) => Number.isFinite(x))
      .map((x) => ({ x, groupIndex }))
  );

  for (let leftIndex = 0; leftIndex < positions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < positions.length; rightIndex += 1) {
      const left = positions[leftIndex];
      const right = positions[rightIndex];
      if (left.groupIndex !== right.groupIndex && Math.abs(left.x - right.x) < normalizedMinGap) {
        return false;
      }
    }
  }

  return true;
}

export function resolutionAuditLegendItems(
  groups: ResolutionCutVisualGroup[],
  labelMode: ResolutionCutLabelMode,
  compact = false
): ResolutionAuditLegendItem[] {
  if (labelMode !== "first-by-kind") {
    return [];
  }

  return groups
    .filter((group) => group.cuts.length > 0)
    .map((group) => {
      const count = Math.max(0, Math.floor(group.cuts.length));
      return {
        kind: group.kind,
        label: group.label,
        color: group.color,
        count,
        text: compact ? `${compactLegendLabel(group.label)} ${count}` : `${group.label} ${count}`
      };
    });
}

export function resolutionAuditLegendText(items: ResolutionAuditLegendItem[]): string {
  return items.map((item) => item.text).join(" / ");
}

export function resolutionAuditLegendPromptOffsetY(compact = false): number {
  return compact
    ? COMPACT_RESOLUTION_AUDIT_LEGEND_PROMPT_OFFSET_Y
    : RESOLUTION_AUDIT_LEGEND_PROMPT_OFFSET_Y;
}

function compactResolutionLabelBaseOffset(baseOffsetY: number): number {
  if (baseOffsetY >= 70) {
    return 34;
  }

  if (baseOffsetY >= 44) {
    return 26;
  }

  return Math.min(baseOffsetY, 18);
}

function compactLegendLabel(label: string): string {
  if (label === "FALSE") {
    return "F";
  }

  if (label === "MISS") {
    return "M";
  }

  return label;
}

export class ResolutionFeedbackSystem {
  audioCues(input: ResolutionAudioInput): AudioCue[] {
    const cues: AudioCue[] = ["resolve"];
    if (input.missedCuts.length > 0) {
      cues.push("miss");
    }
    if (input.falseCuts.length > 0) {
      cues.push("falseCut");
    }
    cues.push(input.missedCuts.length === 0 && input.falseCuts.length === 0 ? "good" : "bad");
    if (input.balance <= 10) {
      cues.push("warning");
    }
    return cues;
  }

  hapticCue(input: ResolutionAudioInput): HapticFeedbackCue {
    if (input.balance <= 10) {
      return "warning";
    }

    if (input.missedCuts.length > 0 || input.falseCuts.length > 0) {
      return "miss";
    }

    return "confirm";
  }

  visualCutGroups(input: ResolutionVisualInput): ResolutionCutVisualGroup[] {
    return [
      {
        kind: "correct",
        cuts: input.correctCuts,
        color: 0x477556,
        label: "OK",
        labelOffsetY: 18,
        flash: true,
        revealDelayMs: 0,
        flashDurationMs: 120
      },
      {
        kind: "false",
        cuts: input.falseCuts,
        color: 0x9a4f4f,
        label: "FALSE",
        labelOffsetY: 44,
        flash: false,
        revealDelayMs: 80,
        flashDurationMs: 0
      },
      {
        kind: "missed",
        cuts: input.missedCuts,
        color: 0x6a7885,
        label: "MISS",
        labelOffsetY: 70,
        flash: false,
        revealDelayMs: 160,
        flashDurationMs: 0
      }
    ];
  }

  reviewAdvanceDelayMs(input: ResolutionReviewDelayInput): number {
    const baseDelayMs = input.tutorialMode ? 4200 : 2800;
    const maxDelayMs = input.finalTutorialRound ? 7600 : input.tutorialMode ? 6200 : 4200;
    const errorCount = input.missedCuts.length + input.falseCuts.length;
    const tokenExtraMs = Math.max(0, input.tokenCount - 4) * 140;
    const longTextExtraMs = Math.max(0, input.textLength - 18) * 30;
    const denseExtraMs = DENSE_REVIEW_CATEGORIES.has(input.category) ? 450 : 0;
    const errorExtraMs = errorCount * 180;
    const finalTutorialExtraMs = input.finalTutorialRound ? 1200 : 0;

    return Math.min(
      maxDelayMs,
      baseDelayMs + tokenExtraMs + longTextExtraMs + denseExtraMs + errorExtraMs + finalTutorialExtraMs
    );
  }
}
