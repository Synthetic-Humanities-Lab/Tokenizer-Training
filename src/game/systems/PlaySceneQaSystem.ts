import type { GameQaElement, GameQaRect, GameQaSnapshot } from "./GameQaSystem";
import type { HudImpactTarget, HudImpactTone } from "./HudImpactSystem";
import type { InputFeelMetricsSnapshot } from "./InputFeelMetricsSystem";
import {
  NO_CUT_FEEDBACK_LABEL,
  type ActiveCutPulseKind,
  type InputResponseBadgeTone,
  type NoCutFeedbackDirection,
  type NoCutFeedbackReason
} from "./ActiveCutFeedbackSystem";
import { MIN_TOUCH_TARGET_SIZE, type PlayLayout } from "./PlayLayoutSystem";
import type { ResolutionCommitTrigger } from "./ResolutionFeedbackSystem";
import type { TouchAimLoupePlacement } from "./TouchAimLoupeSystem";

export type PlaySceneQaPhase = "active" | "review";
export type PlaySceneQaMode = "tutorial" | "endless";

export interface PlaySceneQaSnapshotInput {
  width: number;
  height: number;
  layout: PlayLayout;
  mode: PlaySceneQaMode;
  phase: PlaySceneQaPhase;
  round: number;
  fixtureId: string;
  fixtureText: string;
  cutCount: number;
  activeCutPulseCount?: number;
  activeCutPulseKinds?: ActiveCutPulseKind[];
  activeCutLabelRects?: Array<{ text: string; rect: GameQaRect }>;
  resolvedCutLabelRects?: Array<{ text: string; rect: GameQaRect }>;
  resolutionAuditLegendRect?: GameQaRect;
  resolutionAuditLegendText?: string;
  legalSlotCount: number;
  playableSlotRects?: Array<{ boundary: number; rect: GameQaRect; hinted?: boolean }>;
  snapDistancePx?: number;
  previewDistancePx?: number;
  inputModality: string;
  inputFeel?: InputFeelMetricsSnapshot;
  inputResponseBadgeText?: string;
  inputResponseBadgeTone?: InputResponseBadgeTone;
  inputResponseBadgeRect?: GameQaRect;
  cutStatusText: string;
  cutStatusVisible?: boolean;
  promptBackingVisible?: boolean;
  promptTextVisible?: boolean;
  promptAcquisitionActive?: boolean;
  promptAcquisitionProgress?: number | null;
  promptAcquisitionRect?: GameQaRect;
  promptAcquisitionText?: string;
  promptAcquisitionTextRect?: GameQaRect;
  fallingTextPieceCount?: number;
  textFontSize: number;
  cutStatusFontSize?: number;
  textPanelRect: GameQaRect;
  textRect: GameQaRect;
  logoWienerRect: GameQaRect;
  petWienerRect: GameQaRect;
  petReactionActive?: boolean;
  petReactionKind?: string | null;
  petReactionScaleX?: number | null;
  petReactionScaleY?: number | null;
  petReactionPeakScaleX?: number | null;
  petReactionPeakScaleY?: number | null;
  cutStatusRect: GameQaRect;
  hudRect: GameQaRect;
  resolveButtonText?: string;
  resolveButtonActionable?: boolean;
  resolveButtonReady?: boolean;
  resolveButtonReadyPulse?: number | null;
  resolveButtonDeadlinePressure?: number | null;
  clearButtonText?: string;
  clearButtonActionable?: boolean;
  muteButtonText?: string;
  exitButtonText?: string;
  feedbackRect: GameQaRect;
  feedbackVisible: boolean;
  feedbackText?: string;
  feedbackTokenSplitText?: string;
  feedbackTokenSplitRect?: GameQaRect;
  tutorialReviewReady?: boolean;
  tutorialReviewDwellRemainingMs?: number | null;
  armedPreviewBoundary?: number | null;
  armedPreviewStrength?: number | null;
  armedPreviewReady?: boolean | null;
  armedPreviewRect?: GameQaRect;
  touchAimLoupeBoundary?: number | null;
  touchAimLoupeSnapReady?: boolean | null;
  touchAimLoupeText?: string;
  touchAimLoupeRect?: GameQaRect;
  touchAimLoupePointerClearancePx?: number | null;
  touchAimLoupeOcclusionSafe?: boolean | null;
  touchAimLoupePlacement?: TouchAimLoupePlacement;
  motionStartY?: number | null;
  motionEndY?: number | null;
  motionCurrentY?: number | null;
  motionElapsedMs?: number | null;
  motionDurationMs?: number | null;
  motionProgress?: number | null;
  motionPaused?: boolean | null;
  reducedMotion?: boolean;
  motionPreferenceSupported?: boolean;
  resolvedTextTransition?: "fall" | "fade";
  petSpeechText?: string;
  petSpeechFontSize?: number;
  petSpeechRect?: GameQaRect;
  textCutImpactActive?: boolean;
  textCutImpactRect?: GameQaRect;
  resolveCommitBeatActive?: boolean;
  resolveCommitBeatRect?: GameQaRect;
  resolveCommitBeatText?: string;
  resolveCommitBeatTextRect?: GameQaRect;
  resolutionTrigger?: ResolutionCommitTrigger | null;
  clearCutFeedbackActive?: boolean;
  clearCutFeedbackRect?: GameQaRect;
  cutCorrectionFeedbackActive?: boolean;
  cutCorrectionFeedbackRect?: GameQaRect;
  chainSwipeFeedbackActive?: boolean;
  chainSwipeFeedbackRect?: GameQaRect;
  noCutFeedbackActive?: boolean;
  noCutFeedbackRect?: GameQaRect;
  noCutFeedbackText?: string;
  noCutFeedbackReason?: NoCutFeedbackReason;
  noCutFeedbackDirection?: NoCutFeedbackDirection;
  hudImpactActive?: boolean;
  hudImpactTone?: HudImpactTone | null;
  hudImpactTargets?: HudImpactTarget[];
  hudImpactDeltaText?: string;
  hudImpactDeltaAlpha?: number | null;
  hudImpactDeltaRect?: GameQaRect;
  hudProgressLabel?: string;
  hudProgressCurrent?: number;
  hudProgressTarget?: number;
  timerWarningActive?: boolean;
  timerWarningIntensity?: number;
  timerPressureRect?: GameQaRect;
  timerPressureDeadlineRect?: GameQaRect;
  rendererQaCapture?: boolean;
  rendererQaCaptureStatus?: string;
}

export function playSceneQaSnapshot(input: PlaySceneQaSnapshotInput): GameQaSnapshot {
  const elements: GameQaElement[] = [
    { id: "hud", rect: input.hudRect },
    { id: "brandMark", rect: input.layout.chrome, text: "WienerWorks" },
    { id: "logoWiener", rect: input.logoWienerRect },
    { id: "playfield", rect: input.layout.playfield },
    { id: "petWiener", rect: input.petWienerRect },
    { id: "timer", rect: centeredLeftRect(input.layout.timer) },
    { id: "textPanel", rect: input.textPanelRect },
    {
      id: "text",
      rect: input.textRect,
      text: input.fixtureText,
      fontSize: input.textFontSize
    },
    {
      id: "cutStatus",
      rect: input.cutStatusRect,
      text: input.cutStatusText,
      fontSize: input.cutStatusFontSize ?? 11,
      visible: input.cutStatusVisible ?? true
    },
    ...(input.activeCutLabelRects ?? []).map((entry, index) => ({
      id: `activeCutLabel:${index}`,
      rect: entry.rect,
      text: entry.text,
      visible: true
    })),
    ...(input.inputResponseBadgeRect
      ? [{
          id: "inputResponseBadge",
          rect: input.inputResponseBadgeRect,
          text: input.inputResponseBadgeText ?? "",
          visible: true
        }]
      : []),
    ...(input.promptAcquisitionRect
      ? [{
          id: "promptAcquisition",
          rect: input.promptAcquisitionRect,
          text: input.promptAcquisitionText ?? "",
          visible: input.promptAcquisitionActive ?? true
        }]
      : []),
    ...(input.promptAcquisitionTextRect
      ? [{
          id: "promptAcquisitionLabel",
          rect: input.promptAcquisitionTextRect,
          text: input.promptAcquisitionText ?? "",
          visible: input.promptAcquisitionActive ?? true
        }]
      : []),
    ...(input.chainSwipeFeedbackRect
      ? [{
          id: "chainSwipeFeedback",
          rect: input.chainSwipeFeedbackRect,
          visible: true
        }]
      : []),
    ...(input.resolvedCutLabelRects ?? []).map((entry, index) => ({
      id: `resolvedCutLabel:${index}`,
      rect: entry.rect,
      text: entry.text,
      visible: true
    })),
    ...(input.resolutionAuditLegendRect
      ? [{
          id: "resolutionAuditLegend",
          rect: input.resolutionAuditLegendRect,
          text: input.resolutionAuditLegendText ?? "",
          visible: true
        }]
      : []),
    ...(input.playableSlotRects ?? []).map((slot) => ({
      id: `playableSlot:${slot.boundary}`,
      rect: slot.rect,
      text: `${slot.boundary}`,
      visible: false
    })),
    { id: "resolveButton", rect: input.layout.resolveButton, text: input.resolveButtonText },
    { id: "clearButton", rect: input.layout.clearButton, text: input.clearButtonText },
    { id: "muteButton", rect: input.layout.muteButton, text: input.muteButtonText },
    { id: "exitButton", rect: input.layout.exitButton, text: input.exitButtonText },
    {
      id: "feedbackCard",
      rect: input.feedbackRect,
      visible: input.feedbackVisible,
      text: input.feedbackVisible ? input.feedbackText ?? "" : ""
    },
    ...(input.feedbackTokenSplitRect
      ? [{
          id: "feedbackTokenSplit",
          rect: input.feedbackTokenSplitRect,
          visible: input.feedbackVisible,
          text: input.feedbackVisible ? input.feedbackTokenSplitText ?? "" : ""
        }]
      : [])
  ];

  if (input.armedPreviewRect) {
    elements.push({ id: "armedCutPreview", rect: input.armedPreviewRect });
  }

  if (input.petSpeechRect) {
    elements.push({
      id: "petSpeechBubble",
      rect: input.petSpeechRect,
      text: input.petSpeechText ?? "",
      fontSize: input.petSpeechFontSize
    });
  }

  if (input.textCutImpactRect) {
    elements.push({
      id: "textCutImpact",
      rect: input.textCutImpactRect,
      visible: input.textCutImpactActive ?? true
    });
  }

  if (input.resolveCommitBeatRect) {
    elements.push({
      id: "resolveCommitBeat",
      rect: input.resolveCommitBeatRect,
      visible: input.resolveCommitBeatActive ?? true,
      text: input.resolutionTrigger ?? ""
    });
  }

  if (input.resolveCommitBeatTextRect) {
    elements.push({
      id: "resolveCommitBeatLabel",
      rect: input.resolveCommitBeatTextRect,
      visible: input.resolveCommitBeatActive ?? true,
      text: input.resolveCommitBeatText ?? ""
    });
  }

  if (input.clearCutFeedbackRect) {
    elements.push({
      id: "clearCutFeedback",
      rect: input.clearCutFeedbackRect,
      visible: input.clearCutFeedbackActive ?? true
    });
  }

  if (input.cutCorrectionFeedbackRect) {
    elements.push({
      id: "cutCorrectionFeedback",
      rect: input.cutCorrectionFeedbackRect,
      visible: input.cutCorrectionFeedbackActive ?? true
    });
  }

    if (input.noCutFeedbackRect) {
    elements.push({
      id: "noCutFeedback",
      rect: input.noCutFeedbackRect,
      text: input.noCutFeedbackText ?? NO_CUT_FEEDBACK_LABEL,
      visible: input.noCutFeedbackActive ?? true
    });
    }

  if (input.hudImpactDeltaRect) {
    elements.push({
      id: "hudImpactDelta",
      rect: input.hudImpactDeltaRect,
      text: input.hudImpactDeltaText ?? "",
      visible: input.hudImpactActive ?? true
    });
  }

  if (input.timerPressureRect) {
    elements.push({
      id: "timerPressureLane",
      rect: input.timerPressureRect,
      visible: input.timerWarningActive ?? true
    });
  }

  if (input.timerPressureDeadlineRect) {
    elements.push({
      id: "timerPressureDeadlineGates",
      rect: input.timerPressureDeadlineRect,
      visible: input.timerWarningActive ?? true
    });
  }

  const resolveTouchTargetOk = isMinimumTouchTarget(input.layout.resolveButton);
  const clearTouchTargetOk = isMinimumTouchTarget(input.layout.clearButton);
  const muteTouchTargetOk = isMinimumTouchTarget(input.layout.muteButton);
  const exitTouchTargetOk = isMinimumTouchTarget(input.layout.exitButton);

  return {
    scene: "PlayScene",
    compact: input.layout.compact,
    viewport: {
      width: input.width,
      height: input.height
    },
    state: {
      mode: input.mode,
      phase: input.phase,
      round: Math.max(0, Math.floor(input.round)),
      fixtureId: input.fixtureId,
      cutCount: Math.max(0, Math.floor(input.cutCount)),
      activeCutPulseCount: Math.max(0, Math.floor(input.activeCutPulseCount ?? 0)),
      activeCutPulseKinds: (input.activeCutPulseKinds ?? []).join(","),
      activeCutLabelCount: Math.max(0, Math.floor(input.activeCutLabelRects?.length ?? 0)),
      resolvedCutLabelCount: Math.max(0, Math.floor(input.resolvedCutLabelRects?.length ?? 0)),
      resolutionAuditLegendVisible: input.resolutionAuditLegendRect !== undefined,
      resolutionAuditLegendText: input.resolutionAuditLegendText ?? "",
      legalSlotCount: Math.max(0, Math.floor(input.legalSlotCount)),
      snapDistancePx: normalizedNumber(input.snapDistancePx),
      previewDistancePx: normalizedNumber(input.previewDistancePx),
      armedPreviewBoundary: input.armedPreviewBoundary ?? null,
      armedPreviewStrength: normalizedNumber(input.armedPreviewStrength),
      armedPreviewReady: input.armedPreviewReady ?? false,
      touchAimLoupeBoundary: null,
      touchAimLoupeVisible: false,
      touchAimLoupeSnapReady: false,
      touchAimLoupePointerClearancePx: null,
      touchAimLoupeOcclusionSafe: false,
      touchAimLoupePlacement: "hidden",
      inputModality: input.inputModality,
      inputFeelGestureActive: input.inputFeel?.gestureActive ?? false,
      inputFeelSampleCount: Math.max(0, Math.floor(input.inputFeel?.sampleCount ?? 0)),
      inputFeelCutCount: Math.max(0, Math.floor(input.inputFeel?.cutCount ?? 0)),
      inputFeelFirstCutLatencyMs: normalizedNumber(input.inputFeel?.firstCutLatencyMs),
      inputFeelLastCutAgeMs: normalizedNumber(input.inputFeel?.lastCutAgeMs),
      inputFeelLastCutBatchCount: Math.max(0, Math.floor(input.inputFeel?.lastCutBatchCount ?? 0)),
      inputFeelReleaseSampleCutCount: Math.max(0, Math.floor(input.inputFeel?.releaseSampleCutCount ?? 0)),
      inputFeelNoCutAcknowledgementCount: Math.max(0, Math.floor(input.inputFeel?.noCutAcknowledgementCount ?? 0)),
      inputFeelNearSlotNoCutAcknowledgementCount: Math.max(0, Math.floor(input.inputFeel?.nearSlotNoCutAcknowledgementCount ?? 0)),
      inputFeelNoSlotAcknowledgementCount: Math.max(0, Math.floor(input.inputFeel?.noSlotAcknowledgementCount ?? 0)),
      inputFeelLastGestureSampleCount: Math.max(0, Math.floor(input.inputFeel?.lastGestureSampleCount ?? 0)),
      inputFeelLastGestureCutCount: Math.max(0, Math.floor(input.inputFeel?.lastGestureCutCount ?? 0)),
      inputFeelLastCutWasReleaseSample: input.inputFeel?.lastCutWasReleaseSample ?? false,
      inputFeelLastCutWasCorrection: input.inputFeel?.lastCutWasCorrection ?? false,
      inputFeelResolveCommitCount: Math.max(0, Math.floor(input.inputFeel?.resolveCommitCount ?? 0)),
      inputFeelResolveAfterFirstCutMs: normalizedNumber(input.inputFeel?.resolveAfterFirstCutMs),
      inputFeelResolveAfterLastCutMs: normalizedNumber(input.inputFeel?.resolveAfterLastCutMs),
      inputFeelCorrectionCutCount: Math.max(0, Math.floor(input.inputFeel?.correctionCutCount ?? 0)),
      inputFeelTouchAimLoupeSampleCount: Math.max(0, Math.floor(input.inputFeel?.touchAimLoupeSampleCount ?? 0)),
      inputFeelTouchAimLoupeSnapReadyCount: Math.max(0, Math.floor(input.inputFeel?.touchAimLoupeSnapReadyCount ?? 0)),
      inputFeelTouchAimLoupeUnsafeClearanceCount: Math.max(0, Math.floor(input.inputFeel?.touchAimLoupeUnsafeClearanceCount ?? 0)),
      inputFeelTouchAimLoupeMinClearancePx: normalizedNumber(input.inputFeel?.touchAimLoupeMinClearancePx),
      inputResponseBadgeVisible: input.inputResponseBadgeRect !== undefined,
      inputResponseBadgeText: input.inputResponseBadgeText ?? "",
      inputResponseBadgeTone: input.inputResponseBadgeTone ?? null,
      minTouchTargetSize: MIN_TOUCH_TARGET_SIZE,
      resolveTouchTargetOk,
      resolveButtonActionable: input.resolveButtonActionable ?? false,
      resolveButtonReady: input.resolveButtonReady ?? false,
      resolveButtonReadyPulse: normalizedNumber(input.resolveButtonReadyPulse),
      resolveButtonDeadlinePressure: normalizedNumber(input.resolveButtonDeadlinePressure),
      clearTouchTargetOk,
      clearButtonActionable: input.clearButtonActionable ?? false,
      muteTouchTargetOk,
      exitTouchTargetOk,
      allPlayControlTouchTargetsOk: resolveTouchTargetOk && clearTouchTargetOk && muteTouchTargetOk && exitTouchTargetOk,
      motionStartY: normalizedNumber(input.motionStartY),
      motionEndY: normalizedNumber(input.motionEndY),
      motionCurrentY: normalizedNumber(input.motionCurrentY),
      motionElapsedMs: normalizedNumber(input.motionElapsedMs),
      motionDurationMs: normalizedNumber(input.motionDurationMs),
      motionProgress: normalizedNumber(input.motionProgress),
      motionPaused: input.motionPaused ?? null,
      reducedMotion: input.reducedMotion ?? false,
      motionPreferenceSupported: input.motionPreferenceSupported ?? false,
      resolvedTextTransition: input.resolvedTextTransition ?? "fall",
      promptBackingVisible: input.promptBackingVisible ?? false,
      promptTextVisible: input.promptTextVisible ?? true,
      promptAcquisitionActive: input.promptAcquisitionActive ?? false,
      promptAcquisitionProgress: normalizedNumber(input.promptAcquisitionProgress),
      fallingTextPieceCount: Math.max(0, Math.floor(input.fallingTextPieceCount ?? 0)),
      petReactionActive: input.petReactionActive ?? false,
      petReactionKind: input.petReactionKind ?? null,
      petReactionScaleX: normalizedNumber(input.petReactionScaleX),
      petReactionScaleY: normalizedNumber(input.petReactionScaleY),
      petReactionPeakScaleX: normalizedNumber(input.petReactionPeakScaleX),
      petReactionPeakScaleY: normalizedNumber(input.petReactionPeakScaleY),
      feedbackVisible: input.feedbackVisible,
      tutorialReviewReady: input.tutorialReviewReady ?? false,
      tutorialReviewDwellRemainingMs: normalizedNumber(input.tutorialReviewDwellRemainingMs),
      textCutImpactActive: input.textCutImpactActive ?? false,
      resolveCommitBeatActive: input.resolveCommitBeatActive ?? false,
      resolveCommitBeatText: input.resolveCommitBeatText ?? null,
      resolutionTrigger: input.resolutionTrigger ?? null,
      clearCutFeedbackActive: input.clearCutFeedbackActive ?? false,
      cutCorrectionFeedbackActive: input.cutCorrectionFeedbackActive ?? false,
      chainSwipeFeedbackActive: input.chainSwipeFeedbackActive ?? false,
      noCutFeedbackActive: input.noCutFeedbackActive ?? false,
      noCutFeedbackReason: input.noCutFeedbackReason ?? null,
      noCutFeedbackDirection: input.noCutFeedbackDirection ?? null,
      hudImpactActive: input.hudImpactActive ?? false,
      hudImpactTone: input.hudImpactTone ?? null,
      hudImpactTargets: (input.hudImpactTargets ?? []).join(","),
      hudImpactDeltaText: input.hudImpactDeltaText ?? "",
      hudImpactDeltaAlpha: normalizedNumber(input.hudImpactDeltaAlpha),
      hudImpactDeltaVisible: input.hudImpactDeltaRect !== undefined,
      hudProgressLabel: input.hudProgressLabel ?? "",
      hudProgressCurrent: Math.max(0, Math.floor(input.hudProgressCurrent ?? 0)),
      hudProgressTarget: Math.max(1, Math.floor(input.hudProgressTarget ?? 1)),
      timerWarningActive: input.timerWarningActive ?? false,
      timerWarningIntensity: normalizedNumber(input.timerWarningIntensity),
      rendererQaCapture: input.rendererQaCapture ?? false,
      rendererQaCaptureStatus: input.rendererQaCaptureStatus ?? null
    },
    elements
  };
}

function isMinimumTouchTarget(rect: GameQaRect): boolean {
  return rect.width >= MIN_TOUCH_TARGET_SIZE && rect.height >= MIN_TOUCH_TARGET_SIZE;
}

function normalizedNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function centeredLeftRect(rect: GameQaRect): GameQaRect {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y,
    width: rect.width,
    height: rect.height
  };
}
