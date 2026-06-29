export const ACTIVE_CUT_LABEL_LIMIT = 5;
export const ACTIVE_CUT_LABEL_MIN_GAP = 44;
export const COMPACT_ACTIVE_CUT_LABEL_MIN_GAP = 48;
export const ACTIVE_CUT_PULSE_MS = 320;
export const ACTIVE_CUT_STATUS_PULSE_MS = 260;
export const ARMED_CUT_PREVIEW_RECT_WIDTH = 24;
export const TEXT_CUT_IMPACT_MS = 210;
export const CLEAR_CUT_FEEDBACK_MS = 360;
export const AUTO_RELEASE_CUT_FEEDBACK_MS = 240;
export const CHAIN_SWIPE_FEEDBACK_MS = 340;
export const NO_CUT_FEEDBACK_MS = 260;
export const NEAR_SLOT_NO_CUT_FEEDBACK_MS = 380;
export const NO_CUT_FEEDBACK_LABEL = "NO SLOT";
export const NO_CUT_FEEDBACK_AIM_LABEL = "AIM CLOSER";
export const NO_CUT_FEEDBACK_AIM_LEFT_LABEL = "AIM LEFT";
export const NO_CUT_FEEDBACK_AIM_RIGHT_LABEL = "AIM RIGHT";
export const INPUT_RESPONSE_BADGE_MS = 620;
export type NoCutFeedbackReason = "near-slot" | "no-slot";
export type NoCutFeedbackDirection = "left" | "right" | "center";
export type ActiveCutPulseKind = "new" | "confirm" | "release";
export type InputResponseBadgeTone = "snap" | "tracked" | "latched" | "adjusted" | "chained";

export interface ActiveCutMarkerStyle {
  lineWidth: number;
  lineAlpha: number;
  haloWidth: number;
  haloAlpha: number;
  capRadius: number;
  capAlpha: number;
}

export interface ActiveCutStatusBadgeStyle {
  fontSize: number;
  paddingX: number;
  paddingY: number;
  fillAlpha: number;
  strokeAlpha: number;
  strokeWidth: number;
  pulse: number;
}

export interface InputResponseBadgeInput {
  gestureActive?: boolean;
  firstCutLatencyMs: number | null;
  lastCutAgeMs: number | null;
  lastCutWasReleaseSample?: boolean;
  lastCutWasCorrection?: boolean;
  lastCutBatchCount?: number;
  lastGestureCutCount?: number;
}

export interface InputResponseBadgeState {
  text: string;
  tone: InputResponseBadgeTone;
  alpha: number;
  fontSize: number;
  paddingX: number;
  paddingY: number;
  strokeAlpha: number;
  fillAlpha: number;
}

export interface ArmedCutPreviewStyle {
  strength: number;
  snapReady: boolean;
  snapStrength: number;
  rectWidth: number;
  guideWidth: number;
  guideAlpha: number;
  lineWidth: number;
  lineAlpha: number;
  targetRadius: number;
  targetAlpha: number;
  tickLength: number;
  latchLength: number;
  latchAlpha: number;
  latchWidth: number;
}

export interface TextCutImpactStyle {
  scaleX: number;
  scaleY: number;
  durationMs: number;
  ease: string;
}

export interface ClearCutFeedbackStyle {
  lineWidth: number;
  lineAlpha: number;
  haloWidth: number;
  haloAlpha: number;
  capRadius: number;
  capAlpha: number;
  durationMs: number;
  ease: string;
}

export interface CutCorrectionFeedbackStyle {
  bridgeWidth: number;
  bridgeAlpha: number;
  haloWidth: number;
  haloAlpha: number;
  endpointRadius: number;
  endpointAlpha: number;
  arrowLength: number;
  durationMs: number;
  ease: string;
}

export interface ChainSwipeFeedbackStyle {
  railWidth: number;
  railAlpha: number;
  haloWidth: number;
  haloAlpha: number;
  tickLength: number;
  tickWidth: number;
  tickAlpha: number;
  capRadius: number;
  capAlpha: number;
  durationMs: number;
  ease: string;
}

export interface NoCutFeedbackStyle {
  alpha: number;
  durationMs: number;
  yLift: number;
  fontSize: number;
  scuffLength: number;
  scuffWidth: number;
  scuffAlpha: number;
  scuffHaloWidth: number;
  scuffHaloAlpha: number;
  snapGuideWidth: number;
  snapGuideAlpha: number;
  snapLineWidth: number;
  snapLineAlpha: number;
  snapTickLength: number;
  snapTickAlpha: number;
  correctionArrowLength: number;
  correctionArrowWidth: number;
  correctionArrowAlpha: number;
  ease: string;
}

export interface NoCutGestureReleaseInput {
  touchedCutBand: boolean;
  hadCut: boolean;
  trailPointCount: number;
  hadPreviewTarget?: boolean;
}

export function shouldShowActiveCutLabels(cutCount: number): boolean {
  return Math.max(0, Math.floor(cutCount)) <= ACTIVE_CUT_LABEL_LIMIT;
}

export function activeCutLabelsHaveRoom(cutXs: number[], minGap = ACTIVE_CUT_LABEL_MIN_GAP): boolean {
  const sorted = cutXs
    .filter((x) => Number.isFinite(x))
    .sort((a, b) => a - b);

  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index] - sorted[index - 1] < minGap) {
      return false;
    }
  }

  return true;
}

export function activeCutLabelMinGap(compact = false): number {
  return compact ? COMPACT_ACTIVE_CUT_LABEL_MIN_GAP : ACTIVE_CUT_LABEL_MIN_GAP;
}

export function activeCutStatusText(cutCount: number, compact = false): string {
  const normalizedCutCount = Math.max(0, Math.floor(cutCount));
  if (normalizedCutCount === 0) {
    return "NO CUTS";
  }

  const label = compact ? "STAGED" : "SEGMENTS STAGED";

  return `${label}: ${normalizedCutCount}`;
}

export function activeCutStatusBadgeStyle(
  cutCount: number,
  compact = false,
  ageMs?: number
): ActiveCutStatusBadgeStyle {
  const normalizedCutCount = Math.max(0, Math.floor(cutCount));
  const pulse = normalizedCutCount > 0 ? activeCutStatusPulseStrength(ageMs) : 0;

  return {
    fontSize: compact ? 12 : 13,
    paddingX: compact ? 8 : 10,
    paddingY: compact ? 3 : 4,
    fillAlpha: normalizedCutCount > 0 ? 0.56 + pulse * 0.14 : 0.18,
    strokeAlpha: normalizedCutCount > 0 ? 0.54 + pulse * 0.22 : 0.22,
    strokeWidth: 1 + pulse * 0.5,
    pulse
  };
}

export function inputResponseBadgeState(
  input: InputResponseBadgeInput,
  compact = false
): InputResponseBadgeState | null {
  if (!Number.isFinite(input.lastCutAgeMs) || input.lastCutAgeMs === null || input.lastCutAgeMs >= INPUT_RESPONSE_BADGE_MS) {
    return null;
  }

  const progress = Math.max(0, Math.min(1, input.lastCutAgeMs / INPUT_RESPONSE_BADGE_MS));
  const alpha = Math.max(0, 1 - progress * progress);
  const multiCutGesture = input.gestureActive !== true && normalizedInputResponseBatchCount(input.lastGestureCutCount) >= 2;
  const tone = input.lastCutWasCorrection
    ? "adjusted"
    : normalizedInputResponseBatchCount(input.lastCutBatchCount) >= 2 || multiCutGesture
      ? "chained"
      : input.lastCutWasReleaseSample
        ? "latched"
        : input.firstCutLatencyMs !== null && Number.isFinite(input.firstCutLatencyMs) && input.firstCutLatencyMs <= 96
          ? "snap"
          : "tracked";

  return {
    text: inputResponseBadgeText(tone),
    tone,
    alpha,
    fontSize: compact ? 10 : 11,
    paddingX: compact ? 7 : 8,
    paddingY: compact ? 2 : 3,
    strokeAlpha: 0.36 + alpha * 0.34,
    fillAlpha: 0.16 + alpha * 0.42
  };
}

export function activeCutMarkerStyle(
  ageMs?: number,
  compact = false,
  kind: ActiveCutPulseKind = "new"
): ActiveCutMarkerStyle {
  const baseWidth = compact ? 3 : 4;
  const pulse = activeCutPulseStrength(ageMs);
  const confirmation = kind === "confirm";
  const releaseLatch = kind === "release";
  const linePulse = pulse * (confirmation ? 0.62 : releaseLatch ? 0.84 : 1);
  const haloPulse = pulse * (confirmation ? 0.68 : releaseLatch ? 1.12 : 1);

  return {
    lineWidth: baseWidth + linePulse * (compact ? 4.5 : 5.5),
    lineAlpha: 0.84 + linePulse * 0.12,
    haloWidth: baseWidth + haloPulse * (compact ? 15 : 20),
    haloAlpha: haloPulse * 0.24,
    capRadius: (compact ? 4 : 6) + haloPulse * (compact ? 5 : 7),
    capAlpha: haloPulse * 0.22
  };
}

function inputResponseBadgeText(tone: InputResponseBadgeTone): string {
  if (tone === "adjusted") {
    return "ADJUSTED";
  }

  if (tone === "chained") {
    return "CHAINED";
  }

  if (tone === "latched") {
    return "LATCHED";
  }

  if (tone === "snap") {
    return "SNAP";
  }

  return "TRACKED";
}

function normalizedInputResponseBatchCount(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value ?? 0));
}

export function textCutImpactStyle(addedCutCount: number, compact = false): TextCutImpactStyle | null {
  if (!Number.isFinite(addedCutCount) || addedCutCount <= 0) {
    return null;
  }

  const force = Math.min(1, Math.max(1, Math.floor(addedCutCount)) / 3);

  return {
    scaleX: 1 + force * (compact ? 0.018 : 0.024),
    scaleY: 1 + force * (compact ? 0.036 : 0.046),
    durationMs: compact ? 180 : TEXT_CUT_IMPACT_MS,
    ease: "Sine.easeOut"
  };
}

export function clearCutFeedbackStyle(cutCount: number, compact = false): ClearCutFeedbackStyle | null {
  if (!Number.isFinite(cutCount) || cutCount <= 0) {
    return null;
  }

  const force = Math.min(1, Math.max(1, Math.floor(cutCount)) / 5);

  return {
    lineWidth: (compact ? 2.5 : 3) + force * (compact ? 1 : 1.4),
    lineAlpha: 0.28 + force * 0.12,
    haloWidth: (compact ? 9 : 12) + force * (compact ? 5 : 7),
    haloAlpha: 0.1 + force * 0.06,
    capRadius: (compact ? 3 : 4) + force * (compact ? 2 : 3),
    capAlpha: 0.12 + force * 0.06,
    durationMs: compact ? 320 : CLEAR_CUT_FEEDBACK_MS,
    ease: "Sine.easeOut"
  };
}

export function autoReleaseCutFeedbackStyle(cutCount: number, compact = false): ClearCutFeedbackStyle | null {
  const clearStyle = clearCutFeedbackStyle(cutCount, compact);
  if (!clearStyle) {
    return null;
  }

  return {
    lineWidth: Math.max(1.5, clearStyle.lineWidth * 0.72),
    lineAlpha: Math.max(0.16, clearStyle.lineAlpha * 0.62),
    haloWidth: Math.max(6, clearStyle.haloWidth * 0.68),
    haloAlpha: clearStyle.haloAlpha * 0.55,
    capRadius: Math.max(2, clearStyle.capRadius * 0.74),
    capAlpha: clearStyle.capAlpha * 0.62,
    durationMs: compact ? 210 : AUTO_RELEASE_CUT_FEEDBACK_MS,
    ease: clearStyle.ease
  };
}

export function cutCorrectionFeedbackStyle(replacementCount: number, compact = false): CutCorrectionFeedbackStyle | null {
  if (!Number.isFinite(replacementCount) || replacementCount <= 0) {
    return null;
  }

  const force = Math.min(1, Math.max(1, Math.floor(replacementCount)) / 3);

  return {
    bridgeWidth: (compact ? 2 : 2.5) + force * (compact ? 0.9 : 1.2),
    bridgeAlpha: 0.36 + force * 0.14,
    haloWidth: (compact ? 8 : 10) + force * (compact ? 3 : 5),
    haloAlpha: 0.12 + force * 0.06,
    endpointRadius: (compact ? 3 : 4) + force * (compact ? 1.5 : 2),
    endpointAlpha: 0.2 + force * 0.12,
    arrowLength: compact ? 9 : 12,
    durationMs: compact ? 220 : 260,
    ease: "Sine.easeOut"
  };
}

export function chainSwipeFeedbackStyle(cutCount: number, compact = false): ChainSwipeFeedbackStyle | null {
  if (!Number.isFinite(cutCount) || cutCount < 2) {
    return null;
  }

  const force = Math.min(1, Math.max(2, Math.floor(cutCount)) / 5);

  return {
    railWidth: (compact ? 2.5 : 3) + force * (compact ? 1.2 : 1.6),
    railAlpha: 0.34 + force * 0.16,
    haloWidth: (compact ? 10 : 13) + force * (compact ? 4 : 6),
    haloAlpha: 0.1 + force * 0.07,
    tickLength: (compact ? 10 : 13) + force * (compact ? 2 : 3),
    tickWidth: compact ? 1.5 : 1.75,
    tickAlpha: 0.26 + force * 0.16,
    capRadius: (compact ? 3 : 4) + force * (compact ? 1.5 : 2),
    capAlpha: 0.2 + force * 0.12,
    durationMs: CHAIN_SWIPE_FEEDBACK_MS,
    ease: "Sine.easeOut"
  };
}

export function noCutFeedbackStyle(compact = false, reason: NoCutFeedbackReason = "no-slot"): NoCutFeedbackStyle {
  const nearSlot = reason === "near-slot";

  return {
    alpha: nearSlot ? compact ? 0.86 : 0.9 : compact ? 0.78 : 0.82,
    durationMs: nearSlot ? compact ? 320 : NEAR_SLOT_NO_CUT_FEEDBACK_MS : compact ? 220 : NO_CUT_FEEDBACK_MS,
    yLift: nearSlot ? compact ? 9 : 11 : compact ? 7 : 9,
    fontSize: nearSlot ? compact ? 11 : 12 : compact ? 10 : 11,
    scuffLength: compact ? 22 : 28,
    scuffWidth: compact ? 2.5 : 3,
    scuffAlpha: compact ? 0.42 : 0.48,
    scuffHaloWidth: compact ? 9 : 12,
    scuffHaloAlpha: compact ? 0.1 : 0.12,
    snapGuideWidth: compact ? 14 : 18,
    snapGuideAlpha: nearSlot ? compact ? 0.2 : 0.24 : compact ? 0.14 : 0.16,
    snapLineWidth: compact ? 1.5 : 1.75,
    snapLineAlpha: nearSlot ? compact ? 0.46 : 0.52 : compact ? 0.34 : 0.38,
    snapTickLength: compact ? 7 : 9,
    snapTickAlpha: nearSlot ? compact ? 0.36 : 0.42 : compact ? 0.24 : 0.28,
    correctionArrowLength: compact ? 18 : 24,
    correctionArrowWidth: compact ? 1.5 : 1.75,
    correctionArrowAlpha: nearSlot ? compact ? 0.5 : 0.56 : compact ? 0.38 : 0.44,
    ease: "Sine.easeOut"
  };
}

export function noCutFeedbackReason(hasPreviewTarget: boolean): NoCutFeedbackReason {
  return hasPreviewTarget ? "near-slot" : "no-slot";
}

export function noCutFeedbackDirection(pointX: number, slotX: number, deadZonePx = 2): NoCutFeedbackDirection {
  if (!Number.isFinite(pointX) || !Number.isFinite(slotX)) {
    return "center";
  }

  const delta = slotX - pointX;
  if (Math.abs(delta) <= Math.max(0, deadZonePx)) {
    return "center";
  }

  return delta < 0 ? "left" : "right";
}

export function noCutFeedbackLabel(
  reason: NoCutFeedbackReason,
  direction: NoCutFeedbackDirection = "center"
): string {
  if (reason === "no-slot") {
    return NO_CUT_FEEDBACK_LABEL;
  }

  if (direction === "left") {
    return NO_CUT_FEEDBACK_AIM_LEFT_LABEL;
  }

  if (direction === "right") {
    return NO_CUT_FEEDBACK_AIM_RIGHT_LABEL;
  }

  return NO_CUT_FEEDBACK_AIM_LABEL;
}

export function shouldAcknowledgeNoCutGesture(input: NoCutGestureReleaseInput): boolean {
  if (!input.touchedCutBand || input.hadCut) {
    return false;
  }

  return Math.max(0, Math.floor(input.trailPointCount)) > 1 || input.hadPreviewTarget === true;
}

export function activeCutPulseStrength(ageMs?: number): number {
  if (!Number.isFinite(ageMs) || ageMs === undefined || ageMs < 0 || ageMs >= ACTIVE_CUT_PULSE_MS) {
    return 0;
  }

  const progress = Math.max(0, Math.min(1, ageMs / ACTIVE_CUT_PULSE_MS));
  return (1 - progress) * (1 - progress);
}

export function activeCutStatusPulseStrength(ageMs?: number): number {
  if (!Number.isFinite(ageMs) || ageMs === undefined || ageMs < 0 || ageMs >= ACTIVE_CUT_STATUS_PULSE_MS) {
    return 0;
  }

  const progress = Math.max(0, Math.min(1, ageMs / ACTIVE_CUT_STATUS_PULSE_MS));
  return (1 - progress) * (1 - progress);
}

export function armedCutPreviewStrength(distancePx: number, previewDistancePx: number): number {
  if (
    !Number.isFinite(distancePx) ||
    !Number.isFinite(previewDistancePx) ||
    distancePx < 0 ||
    previewDistancePx <= 0 ||
    distancePx >= previewDistancePx
  ) {
    return 0;
  }

  const progress = Math.max(0, Math.min(1, distancePx / previewDistancePx));
  return 1 - progress;
}

export function armedCutSnapStrength(distancePx: number, snapDistancePx: number): number {
  if (
    !Number.isFinite(distancePx) ||
    !Number.isFinite(snapDistancePx) ||
    distancePx < 0 ||
    snapDistancePx <= 0 ||
    distancePx > snapDistancePx
  ) {
    return 0;
  }

  const progress = Math.max(0, Math.min(1, distancePx / snapDistancePx));
  return 1 - progress;
}

export function armedCutPreviewStyle(
  distancePx: number,
  previewDistancePx: number,
  compact = false,
  snapDistancePx?: number
): ArmedCutPreviewStyle {
  const strength = armedCutPreviewStrength(distancePx, previewDistancePx);
  const snapStrength = snapDistancePx === undefined ? 0 : armedCutSnapStrength(distancePx, snapDistancePx);
  const snapReady = snapDistancePx !== undefined && distancePx <= snapDistancePx && strength > 0;
  const snapBonus = snapReady ? 0.24 + snapStrength * 0.18 : 0;

  return {
    strength,
    snapReady,
    snapStrength,
    rectWidth: ARMED_CUT_PREVIEW_RECT_WIDTH,
    guideWidth: (compact ? 16 : 18) + strength * (compact ? 4 : 6) + snapBonus * (compact ? 5 : 7),
    guideAlpha: snapReady ? 0.18 + strength * 0.1 + snapStrength * 0.08 : 0.08 + strength * 0.1,
    lineWidth: (compact ? 1.5 : 1.75) + strength * (compact ? 0.7 : 0.9) + snapBonus * (compact ? 1.3 : 1.6),
    lineAlpha: snapReady ? 0.56 + snapStrength * 0.24 : 0.2 + strength * 0.28,
    targetRadius: (compact ? 3 : 4) + strength * (compact ? 2 : 3) + snapBonus * (compact ? 4 : 5),
    targetAlpha: snapReady ? 0.54 + snapStrength * 0.24 : 0.12 + strength * 0.18,
    tickLength: (compact ? 6 : 7) + strength * (compact ? 3 : 4) + snapBonus * (compact ? 5 : 7),
    latchLength: snapReady ? (compact ? 12 : 15) + snapStrength * (compact ? 7 : 9) : 0,
    latchAlpha: snapReady ? 0.5 + snapStrength * 0.36 : 0,
    latchWidth: snapReady ? (compact ? 2.25 : 2.75) + snapStrength * 1.25 : 0
  };
}
