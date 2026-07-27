import { describe, expect, it } from "vitest";
import { ARMED_CUT_PREVIEW_RECT_WIDTH } from "../src/game/systems/ActiveCutFeedbackSystem";
import type { GameQaElement, GameQaRect } from "../src/game/systems/GameQaSystem";
import { computePlayLayout, MIN_TOUCH_TARGET_SIZE } from "../src/game/systems/PlayLayoutSystem";
import { playSceneQaSnapshot, type PlaySceneQaSnapshotInput } from "../src/game/systems/PlaySceneQaSystem";
import { computeFeedbackCardLayout } from "../src/game/ui/FeedbackCard";
import { computeHudLayout } from "../src/game/ui/Hud";

function element(elements: GameQaElement[], id: string): GameQaElement {
  const match = elements.find((candidate) => candidate.id === id);
  if (!match) {
    throw new Error(`Missing QA element ${id}.`);
  }

  return match;
}

function edges(rect: GameQaRect) {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2
  };
}

function withinViewport(rect: GameQaRect, width: number, height: number): boolean {
  const rectEdges = edges(rect);
  return (
    rectEdges.left >= 0 &&
    rectEdges.right <= width &&
    rectEdges.top >= 0 &&
    rectEdges.bottom <= height
  );
}

function hudRect(width: number, bounds?: { x: number; width: number }): GameQaRect {
  const background = computeHudLayout(width, bounds).background;
  return {
    x: background.x,
    y: background.y + background.height / 2,
    width: background.width,
    height: background.height
  };
}

describe("playSceneQaSnapshot", () => {
  it("exposes portrait active-round geometry and armed preview state for browser QA", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const input: PlaySceneQaSnapshotInput = {
      width,
      height,
      layout,
      mode: "tutorial",
      phase: "active",
      round: 1,
      fixtureId: "simple_001",
      fixtureText: "the cat sat on the mat",
      cutCount: 0,
      activeCutPulseCount: 2,
      activeCutPulseKinds: ["new", "confirm"],
      activeCutLabelRects: [
        {
          text: "CUT",
          rect: {
            x: layout.textPanel.x - 120,
            y: layout.textPanel.y - 42,
            width: 28,
            height: 14
          }
        }
      ],
      legalSlotCount: 17,
      playableSlotRects: [
        {
          boundary: 3,
          hinted: true,
          rect: {
            x: layout.textPanel.x - 120,
            y: layout.textPanel.y,
            width: 52,
            height: 76
          }
        },
        {
          boundary: 7,
          hinted: true,
          rect: {
            x: layout.textPanel.x - 40,
            y: layout.textPanel.y,
            width: 52,
            height: 76
          }
        }
      ],
      snapDistancePx: 26,
      previewDistancePx: 38,
      inputModality: "touch",
      inputFeel: {
        gestureActive: true,
        sampleCount: 3,
        cutCount: 1,
        firstCutLatencyMs: 24,
        lastCutAgeMs: 12,
        lastCutBatchCount: 1,
        releaseSampleCutCount: 0,
        lastCutWasReleaseSample: false,
        lastCutWasCorrection: false,
        noCutAcknowledgementCount: 0,
        nearSlotNoCutAcknowledgementCount: 0,
        noSlotAcknowledgementCount: 0,
        lastGestureSampleCount: 0,
        lastGestureCutCount: 0,
        resolveCommitCount: 0,
        resolveAfterFirstCutMs: null,
        resolveAfterLastCutMs: null,
        correctionCutCount: 0,
        touchAimLoupeSampleCount: 2,
        touchAimLoupeSnapReadyCount: 1,
        touchAimLoupeUnsafeClearanceCount: 0,
        touchAimLoupeMinClearancePx: 48
      },
      cutStatusText: "NO CUTS",
      textFontSize: 18,
      cutStatusFontSize: 12,
      textPanelRect: layout.textPanel,
      logoWienerRect: layout.logoWiener,
      petWienerRect: layout.petWienerSlot,
      petReactionActive: true,
      petReactionKind: "cut",
      petReactionScaleX: 1.08,
      petReactionScaleY: 0.93,
      petReactionPeakScaleX: 1.08,
      petReactionPeakScaleY: 0.93,
      textRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y,
        width: 320,
        height: 28
      },
      cutStatusRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y + 39,
        width: 90,
        height: 16
      },
      hudRect: hudRect(width, layout.contentPanel),
      resolveButtonText: "Resolve",
      resolveButtonActionable: true,
      resolveButtonReady: true,
      resolveButtonReadyPulse: 0.75,
      clearButtonText: "Clear",
      muteButtonText: "Sound",
      exitButtonText: "Exit",
      feedbackRect: computeFeedbackCardLayout(width, height, layout.contentPanel),
      feedbackVisible: false,
      armedPreviewBoundary: 3,
      armedPreviewStrength: 0.62,
      armedPreviewReady: true,
      touchAimLoupeBoundary: 3,
      touchAimLoupeSnapReady: true,
      touchAimLoupeText: "the| cat",
      touchAimLoupeRect: {
        x: 195,
        y: layout.textPanel.y - 56,
        width: 128,
        height: 42
      },
      touchAimLoupePointerClearancePx: 48,
      touchAimLoupeOcclusionSafe: true,
      touchAimLoupePlacement: "above",
      motionStartY: layout.sentenceStartY,
      motionEndY: layout.sentenceEndY,
      motionCurrentY: layout.sentenceStartY + (layout.sentenceEndY - layout.sentenceStartY) * 0.25,
      motionElapsedMs: 5500,
      motionDurationMs: 22000,
      motionProgress: 0.25,
      motionPaused: false,
      hudImpactActive: false,
      hudProgressLabel: "TUTORIAL",
      hudProgressCurrent: 1,
      hudProgressTarget: 10,
      cutCorrectionFeedbackActive: true,
      cutCorrectionFeedbackRect: {
        x: layout.textPanel.x - 110,
        y: layout.textPanel.y + 36,
        width: 54,
        height: 30
      },
      armedPreviewRect: {
        x: layout.textPanel.x - 120,
        y: layout.textPanel.y,
        width: ARMED_CUT_PREVIEW_RECT_WIDTH,
        height: 72
      },
      petSpeechText: "Swipe targets; pale guides mark slots; Resolve submits.",
      petSpeechFontSize: 12,
      petSpeechRect: {
        x: 195,
        y: 432,
        width: 358,
        height: 62
      }
    };
    const snapshot = playSceneQaSnapshot(input);

    expect(snapshot.scene).toBe("PlayScene");
    expect(snapshot.compact).toBe(true);
    expect(snapshot.state).toMatchObject({
      mode: "tutorial",
      phase: "active",
      round: 1,
      fixtureId: "simple_001",
      cutCount: 0,
      activeCutPulseCount: 2,
      activeCutPulseKinds: "new,confirm",
      activeCutLabelCount: 1,
      resolvedCutLabelCount: 0,
      legalSlotCount: 17,
      snapDistancePx: 26,
      previewDistancePx: 38,
      armedPreviewBoundary: 3,
      armedPreviewStrength: 0.62,
      armedPreviewReady: true,
      touchAimLoupeBoundary: null,
      touchAimLoupeVisible: false,
      touchAimLoupeSnapReady: false,
      touchAimLoupePointerClearancePx: null,
      touchAimLoupeOcclusionSafe: false,
      touchAimLoupePlacement: "hidden",
      inputModality: "touch",
      inputFeelGestureActive: true,
      inputFeelSampleCount: 3,
      inputFeelCutCount: 1,
      inputFeelFirstCutLatencyMs: 24,
      inputFeelLastCutAgeMs: 12,
      inputFeelReleaseSampleCutCount: 0,
      inputFeelNoCutAcknowledgementCount: 0,
      inputFeelNearSlotNoCutAcknowledgementCount: 0,
      inputFeelNoSlotAcknowledgementCount: 0,
      inputFeelLastGestureSampleCount: 0,
      inputFeelLastGestureCutCount: 0,
      inputFeelResolveCommitCount: 0,
      inputFeelResolveAfterFirstCutMs: null,
      inputFeelResolveAfterLastCutMs: null,
      inputFeelTouchAimLoupeSampleCount: 2,
      inputFeelTouchAimLoupeSnapReadyCount: 1,
      inputFeelTouchAimLoupeUnsafeClearanceCount: 0,
      inputFeelTouchAimLoupeMinClearancePx: 48,
      minTouchTargetSize: MIN_TOUCH_TARGET_SIZE,
      resolveTouchTargetOk: true,
      resolveButtonActionable: true,
      resolveButtonReady: true,
      resolveButtonReadyPulse: 0.75,
      clearTouchTargetOk: true,
      clearButtonActionable: false,
      muteTouchTargetOk: true,
      exitTouchTargetOk: true,
      allPlayControlTouchTargetsOk: true,
      motionStartY: layout.sentenceStartY,
      motionEndY: layout.sentenceEndY,
      motionCurrentY: layout.sentenceStartY + (layout.sentenceEndY - layout.sentenceStartY) * 0.25,
      motionElapsedMs: 5500,
      motionDurationMs: 22000,
      motionProgress: 0.25,
      motionPaused: false,
      promptTextVisible: true,
      fallingTextPieceCount: 0,
      petReactionActive: true,
      petReactionKind: "cut",
      petReactionScaleX: 1.08,
      petReactionScaleY: 0.93,
      petReactionPeakScaleX: 1.08,
      petReactionPeakScaleY: 0.93,
      hudImpactActive: false,
      hudImpactTone: null,
      hudImpactTargets: "",
      hudProgressLabel: "TUTORIAL",
      hudProgressCurrent: 1,
      hudProgressTarget: 10,
      cutCorrectionFeedbackActive: true
    });
    expect(element(snapshot.elements, "resolveButton").rect?.height).toBe(MIN_TOUCH_TARGET_SIZE);
    expect(element(snapshot.elements, "clearButton").rect?.height).toBe(MIN_TOUCH_TARGET_SIZE);
    expect(element(snapshot.elements, "muteButton").rect?.height).toBe(MIN_TOUCH_TARGET_SIZE);
    expect(element(snapshot.elements, "exitButton").rect?.height).toBe(MIN_TOUCH_TARGET_SIZE);
    expect(element(snapshot.elements, "resolveButton").text).toBe("Resolve");
    expect(element(snapshot.elements, "clearButton").text).toBe("Clear");
    expect(element(snapshot.elements, "muteButton").text).toBe("Sound");
    expect(element(snapshot.elements, "exitButton").text).toBe("Exit");
    expect(element(snapshot.elements, "logoWiener").rect).toEqual(layout.logoWiener);
    expect(element(snapshot.elements, "petWiener").rect).toEqual(layout.petWienerSlot);
    expect(element(snapshot.elements, "text").text).toBe("the cat sat on the mat");
    expect(element(snapshot.elements, "cutStatus").text).toBe("NO CUTS");
    expect(element(snapshot.elements, "cutStatus").fontSize).toBe(12);
    expect(element(snapshot.elements, "activeCutLabel:0").text).toBe("CUT");
    expect(element(snapshot.elements, "activeCutLabel:0").rect).toEqual({
      x: layout.textPanel.x - 120,
      y: layout.textPanel.y - 42,
      width: 28,
      height: 14
    });
    expect(element(snapshot.elements, "playableSlot:3").text).toBe("3");
    expect(element(snapshot.elements, "playableSlot:3").visible).toBe(false);
    expect(element(snapshot.elements, "playableSlot:3").rect).toEqual({
      x: layout.textPanel.x - 120,
      y: layout.textPanel.y,
      width: 52,
      height: 76
    });
    expect(element(snapshot.elements, "playableSlot:7").text).toBe("7");
    expect(element(snapshot.elements, "armedCutPreview").rect?.width).toBe(ARMED_CUT_PREVIEW_RECT_WIDTH);
    expect(element(snapshot.elements, "cutCorrectionFeedback").visible).toBe(true);
    expect(element(snapshot.elements, "cutCorrectionFeedback").rect).toEqual({
      x: layout.textPanel.x - 110,
      y: layout.textPanel.y + 36,
      width: 54,
      height: 30
    });
    expect(snapshot.elements.some((entry) => entry.id === "touchAimLoupe")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "overseer")).toBe(false);
    expect(element(snapshot.elements, "petSpeechBubble").text).toContain("pale guides");
    expect(snapshot.elements.some((entry) => entry.id === "tutorialPopup")).toBe(false);
    expect(element(snapshot.elements, "feedbackCard").visible).toBe(false);
    expect(element(snapshot.elements, "feedbackCard").text).toBe("");
    for (const entry of snapshot.elements) {
      if (entry.rect) {
        expect(withinViewport(entry.rect, width, height), entry.id).toBe(true);
      }
    }

    const shortControlSnapshot = playSceneQaSnapshot({
      ...input,
      layout: {
        ...layout,
        clearButton: {
          ...layout.clearButton,
          height: MIN_TOUCH_TARGET_SIZE - 1
        }
      }
    });
    expect(shortControlSnapshot.state?.clearTouchTargetOk).toBe(false);
    expect(shortControlSnapshot.state?.allPlayControlTouchTargetsOk).toBe(false);
  });

  it("exposes zero-cut Resolve as actionable without marking staged-cut readiness", () => {
    const width = 1280;
    const height = 720;
    const snapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      resolveButtonText: "Resolve",
      resolveButtonActionable: true,
      resolveButtonReady: false,
      resolveButtonReadyPulse: null,
      resolveButtonDeadlinePressure: 0
    });

    expect(snapshot.state).toMatchObject({
      phase: "active",
      cutCount: 0,
      resolveButtonActionable: true,
      resolveButtonReady: false,
      clearButtonActionable: false,
      resolveButtonReadyPulse: null,
      resolveButtonDeadlinePressure: 0
    });
    expect(element(snapshot.elements, "resolveButton").text).toBe("Resolve");
  });

  it("exposes persistent quota progress for active and review progression feel checks", () => {
    const width = 1280;
    const height = 720;
    const active = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      mode: "endless",
      phase: "active",
      hudProgressLabel: "QUOTA",
      hudProgressCurrent: 84,
      hudProgressTarget: 200
    });
    const review = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      mode: "endless",
      phase: "review",
      hudProgressLabel: "QUOTA",
      hudProgressCurrent: 85,
      hudProgressTarget: 200
    });

    expect(active.state).toMatchObject({
      hudProgressLabel: "QUOTA",
      hudProgressCurrent: 84,
      hudProgressTarget: 200
    });
    expect(review.state).toMatchObject({
      hudProgressLabel: "QUOTA",
      hudProgressCurrent: 85,
      hudProgressTarget: 200
    });
  });

  it("exposes Clear as actionable only when staged cuts can actually be removed", () => {
    const width = 1280;
    const height = 720;
    const zeroCutSnapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      cutCount: 0,
      clearButtonText: "Clear Cuts",
      clearButtonActionable: false
    });
    const stagedCutSnapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      cutCount: 2,
      clearButtonText: "Clear 2",
      clearButtonActionable: true
    });
    const reviewSnapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      phase: "review",
      cutCount: 2,
      clearButtonText: "Clear Cuts",
      clearButtonActionable: false
    });

    expect(zeroCutSnapshot.state).toMatchObject({
      phase: "active",
      cutCount: 0,
      clearButtonActionable: false
    });
    expect(element(zeroCutSnapshot.elements, "clearButton").text).toBe("Clear Cuts");
    expect(stagedCutSnapshot.state).toMatchObject({
      phase: "active",
      cutCount: 2,
      clearButtonActionable: true
    });
    expect(element(stagedCutSnapshot.elements, "clearButton").text).toBe("Clear 2");
    expect(reviewSnapshot.state).toMatchObject({
      phase: "review",
      cutCount: 2,
      clearButtonActionable: false
    });
  });

  it("exposes existing-cut confirmation labels and pulse kinds for input-trust QA", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const snapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      layout,
      cutCount: 1,
      activeCutPulseCount: 1,
      activeCutPulseKinds: ["confirm"],
      activeCutLabelRects: [
        {
          text: "HELD",
          rect: {
            x: layout.textPanel.x - 84,
            y: layout.textPanel.y - 42,
            width: 32,
            height: 14
          }
        }
      ]
    });

    expect(snapshot.state).toMatchObject({
      activeCutPulseCount: 1,
      activeCutPulseKinds: "confirm",
      activeCutLabelCount: 1
    });
    expect(element(snapshot.elements, "activeCutLabel:0").text).toBe("HELD");
  });

  it("exposes temporary input-response badge state for browser game-feel QA", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const badgeRect = {
      x: layout.textPanel.x + 76,
      y: layout.textPanel.y + 39,
      width: 64,
      height: 18
    };
    const snapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      layout,
      inputResponseBadgeText: "SNAP",
      inputResponseBadgeTone: "snap",
      inputResponseBadgeRect: badgeRect
    });

    expect(snapshot.state).toMatchObject({
      inputResponseBadgeVisible: true,
      inputResponseBadgeText: "SNAP",
      inputResponseBadgeTone: "snap"
    });
    expect(String(snapshot.state?.inputResponseBadgeText)).not.toMatch(/\d/);
    expect(element(snapshot.elements, "inputResponseBadge").text).toBe("SNAP");
    expect(element(snapshot.elements, "inputResponseBadge").rect).toEqual(badgeRect);

    const expired = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      layout
    });
    expect(expired.state?.inputResponseBadgeVisible).toBe(false);
    expect(expired.state?.inputResponseBadgeText).toBe("");
    expect(expired.state?.inputResponseBadgeTone).toBeNull();
    expect(expired.elements.some((entry) => entry.id === "inputResponseBadge")).toBe(false);
  });

  it("exposes prompt acquisition geometry for round-start game-feel QA", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const acquisitionRect = {
      x: layout.textPanel.x,
      y: layout.textPanel.y,
      width: 248,
      height: 58
    };
    const labelRect = {
      x: layout.textPanel.x,
      y: layout.textPanel.y - 35,
      width: 92,
      height: 14
    };
    const snapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      layout,
      promptAcquisitionActive: true,
      promptAcquisitionProgress: 0.42,
      promptAcquisitionRect: acquisitionRect,
      promptAcquisitionText: "TUTORIAL LIVE",
      promptAcquisitionTextRect: labelRect
    });

    expect(snapshot.state).toMatchObject({
      promptAcquisitionActive: true,
      promptAcquisitionProgress: 0.42
    });
    expect(element(snapshot.elements, "promptAcquisition").text).toBe("TUTORIAL LIVE");
    expect(element(snapshot.elements, "promptAcquisition").rect).toEqual(acquisitionRect);
    expect(element(snapshot.elements, "promptAcquisitionLabel").text).toBe("TUTORIAL LIVE");
    expect(element(snapshot.elements, "promptAcquisitionLabel").rect).toEqual(labelRect);

    const settled = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      layout
    });
    expect(settled.state?.promptAcquisitionActive).toBe(false);
    expect(settled.state?.promptAcquisitionProgress).toBeNull();
    expect(settled.elements.some((entry) => entry.id === "promptAcquisition")).toBe(false);
    expect(settled.elements.some((entry) => entry.id === "promptAcquisitionLabel")).toBe(false);
  });

  it("exposes same-gesture correction response state for browser game-feel QA", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const badgeRect = {
      x: layout.textPanel.x + 82,
      y: layout.textPanel.y + 39,
      width: 80,
      height: 18
    };
    const snapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      layout,
      inputFeel: {
        gestureActive: true,
        sampleCount: 2,
        cutCount: 1,
        firstCutLatencyMs: 18,
        lastCutAgeMs: 12,
        lastCutBatchCount: 1,
        releaseSampleCutCount: 0,
        lastCutWasReleaseSample: false,
        lastCutWasCorrection: true,
        noCutAcknowledgementCount: 0,
        nearSlotNoCutAcknowledgementCount: 0,
        noSlotAcknowledgementCount: 0,
        lastGestureSampleCount: 0,
        lastGestureCutCount: 0,
        resolveCommitCount: 0,
        resolveAfterFirstCutMs: null,
        resolveAfterLastCutMs: null,
        correctionCutCount: 1,
        touchAimLoupeSampleCount: 1,
        touchAimLoupeSnapReadyCount: 1,
        touchAimLoupeUnsafeClearanceCount: 0,
        touchAimLoupeMinClearancePx: 44
      },
      inputResponseBadgeText: "ADJUSTED",
      inputResponseBadgeTone: "adjusted",
      inputResponseBadgeRect: badgeRect
    });

    expect(snapshot.state).toMatchObject({
      inputFeelLastCutWasCorrection: true,
      inputFeelCorrectionCutCount: 1,
      inputFeelTouchAimLoupeSampleCount: 1,
      inputFeelTouchAimLoupeSnapReadyCount: 1,
      inputFeelTouchAimLoupeUnsafeClearanceCount: 0,
      inputFeelTouchAimLoupeMinClearancePx: 44,
      inputResponseBadgeVisible: true,
      inputResponseBadgeText: "ADJUSTED",
      inputResponseBadgeTone: "adjusted"
    });
    expect(String(snapshot.state?.inputResponseBadgeText)).not.toMatch(/\d/);
    expect(element(snapshot.elements, "inputResponseBadge").text).toBe("ADJUSTED");
    expect(element(snapshot.elements, "inputResponseBadge").rect).toEqual(badgeRect);
  });

  it("exposes chained multi-cut response state for browser game-feel QA", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const badgeRect = {
      x: layout.textPanel.x + 84,
      y: layout.textPanel.y + 39,
      width: 78,
      height: 18
    };
    const snapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      layout,
      inputFeel: {
        gestureActive: true,
        sampleCount: 5,
        cutCount: 3,
        firstCutLatencyMs: 34,
        lastCutAgeMs: 16,
        lastCutBatchCount: 3,
        releaseSampleCutCount: 0,
        lastCutWasReleaseSample: false,
        lastCutWasCorrection: false,
        noCutAcknowledgementCount: 0,
        nearSlotNoCutAcknowledgementCount: 0,
        noSlotAcknowledgementCount: 0,
        lastGestureSampleCount: 0,
        lastGestureCutCount: 0,
        resolveCommitCount: 0,
        resolveAfterFirstCutMs: null,
        resolveAfterLastCutMs: null,
        correctionCutCount: 0,
        touchAimLoupeSampleCount: 2,
        touchAimLoupeSnapReadyCount: 2,
        touchAimLoupeUnsafeClearanceCount: 0,
        touchAimLoupeMinClearancePx: 42
      },
      inputResponseBadgeText: "CHAINED",
      inputResponseBadgeTone: "chained",
      inputResponseBadgeRect: badgeRect
    });

    expect(snapshot.state).toMatchObject({
      inputFeelLastCutBatchCount: 3,
      inputResponseBadgeVisible: true,
      inputResponseBadgeText: "CHAINED",
      inputResponseBadgeTone: "chained"
    });
    expect(String(snapshot.state?.inputResponseBadgeText)).not.toMatch(/\d/);
    expect(element(snapshot.elements, "inputResponseBadge").text).toBe("CHAINED");
    expect(element(snapshot.elements, "inputResponseBadge").rect).toEqual(badgeRect);
  });

  it("exposes release-sampled cut labels and pulse kinds for fast-swipe QA", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const snapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      layout,
      cutCount: 1,
      activeCutPulseCount: 1,
      activeCutPulseKinds: ["release"],
      activeCutLabelRects: [
        {
          text: "SET",
          rect: {
            x: layout.textPanel.x - 44,
            y: layout.textPanel.y - 42,
            width: 30,
            height: 14
          }
        }
      ]
    });

    expect(snapshot.state).toMatchObject({
      activeCutPulseCount: 1,
      activeCutPulseKinds: "release",
      activeCutLabelCount: 1
    });
    expect(element(snapshot.elements, "activeCutLabel:0").text).toBe("SET");
  });

  it("exposes desktop review state without an armed preview element", () => {
    const width = 1280;
    const height = 720;
    const layout = computePlayLayout({ width, height });
    const snapshot = playSceneQaSnapshot({
      width,
      height,
      layout,
      mode: "endless",
      phase: "review",
      round: 8,
      fixtureId: "dense_001",
      fixtureText: "wiener.ai/pricing",
      cutCount: 5,
      legalSlotCount: 17,
      inputModality: "mouse",
      cutStatusText: "",
      cutStatusVisible: false,
      textFontSize: 36,
      textPanelRect: {
        ...layout.textPanel,
        y: layout.sentenceReviewY
      },
      logoWienerRect: layout.logoWiener,
      petWienerRect: layout.petWienerSlot,
      textRect: {
        x: layout.textPanel.x,
        y: layout.sentenceReviewY,
        width: 360,
        height: 42
      },
      cutStatusRect: {
        x: layout.textPanel.x,
        y: layout.sentenceReviewY + 39,
        width: 1,
        height: 1
      },
      hudRect: hudRect(width, layout.contentPanel),
      feedbackRect: computeFeedbackCardLayout(width, height, layout.contentPanel),
      feedbackVisible: true,
      feedbackText: [
        "RESOLVED TOKENS 5",
        "wi │ ener │ .ai │ /pr │ icing",
        "PAY +$7.50   DEBIT -$4.75   NET +$2.75",
        "OK 2          MISS 1          FALSE 1"
      ].join("\n"),
      feedbackTokenSplitText: "RESOLVED TOKENS 5\nwi │ ener │ .ai │ /pr │ icing",
      feedbackTokenSplitRect: {
        x: layout.textPanel.x,
        y: computeFeedbackCardLayout(width, height, layout.contentPanel).y - 18,
        width: 460,
        height: 28
      },
      promptTextVisible: false,
      fallingTextPieceCount: 3,
      resolvedCutLabelRects: [
        {
          text: "OK",
          rect: {
            x: layout.textPanel.x - 68,
            y: layout.sentenceReviewY - 54,
            width: 20,
            height: 14
          }
        },
        {
          text: "MISS",
          rect: {
            x: layout.textPanel.x + 42,
            y: layout.sentenceReviewY - 74,
            width: 36,
            height: 14
          }
        }
      ],
      resolveCommitBeatActive: true,
      resolveCommitBeatRect: {
        x: layout.textPanel.x,
        y: layout.sentenceReviewY,
        width: 180,
        height: 92
      },
      resolveCommitBeatText: "DEADLINE 5",
      resolveCommitBeatTextRect: {
        x: layout.textPanel.x,
        y: layout.sentenceReviewY - 58,
        width: 82,
        height: 14
      },
      resolutionTrigger: "deadline",
      hudImpactActive: true,
      hudImpactTone: "loss",
      hudImpactTargets: ["credits", "rework"],
      hudImpactDeltaText: "NET -2 TC",
      hudImpactDeltaAlpha: 0.72
    });

    expect(snapshot.compact).toBe(false);
    expect(snapshot.state).toMatchObject({
      mode: "endless",
      phase: "review",
      round: 8,
      cutCount: 5,
      armedPreviewBoundary: null,
      armedPreviewReady: false,
      touchAimLoupeBoundary: null,
      touchAimLoupeVisible: false,
      touchAimLoupeSnapReady: false,
      touchAimLoupePlacement: "hidden",
      minTouchTargetSize: MIN_TOUCH_TARGET_SIZE,
      resolveTouchTargetOk: true,
      clearTouchTargetOk: true,
      muteTouchTargetOk: true,
      exitTouchTargetOk: true,
      allPlayControlTouchTargetsOk: true,
      motionStartY: null,
      motionEndY: null,
      motionCurrentY: null,
      motionElapsedMs: null,
      motionDurationMs: null,
      motionProgress: null,
      motionPaused: null,
      promptTextVisible: false,
      fallingTextPieceCount: 3,
      feedbackVisible: true,
      tutorialReviewReady: false,
      resolveCommitBeatActive: true,
      resolveCommitBeatText: "DEADLINE 5",
      resolutionTrigger: "deadline",
      activeCutLabelCount: 0,
      resolvedCutLabelCount: 2,
      resolutionAuditLegendVisible: false,
      resolutionAuditLegendText: "",
      hudImpactActive: true,
      hudImpactTone: "loss",
      hudImpactTargets: "credits,rework",
      hudImpactDeltaText: "NET -2 TC",
      hudImpactDeltaAlpha: 0.72,
      hudImpactDeltaVisible: false
    });
    expect(snapshot.elements.some((entry) => entry.id === "hudImpactDelta")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "armedCutPreview")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "touchAimLoupe")).toBe(false);
    expect(element(snapshot.elements, "cutStatus").visible).toBe(false);
    expect(element(snapshot.elements, "brandMark").text).toBe("WienerWorks");
    expect(element(snapshot.elements, "logoWiener").rect).toEqual(layout.logoWiener);
    expect(element(snapshot.elements, "petWiener").rect).toEqual(layout.petWienerSlot);
    expect(snapshot.elements.some((entry) => entry.id === "brandPanel")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "assistantPanel")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "footerPanel")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "petSpeechBubble")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "tutorialPopup")).toBe(false);
    expect(element(snapshot.elements, "feedbackCard").visible).toBe(true);
    expect(element(snapshot.elements, "feedbackCard").text).toContain("DEBIT -$4.75");
    expect(element(snapshot.elements, "feedbackCard").text).not.toContain("Balance");
    expect(snapshot.elements.some((entry) => entry.id === "overseer")).toBe(false);
    expect(element(snapshot.elements, "feedbackTokenSplit").text).toContain("/pr");
    expect(snapshot.elements.some((entry) => entry.id === "tokenStrip")).toBe(false);
    expect(element(snapshot.elements, "resolvedCutLabel:0").text).toBe("OK");
    expect(element(snapshot.elements, "resolvedCutLabel:1").text).toBe("MISS");
    expect(snapshot.elements.some((entry) => entry.id === "resolutionAuditLegend")).toBe(false);
    expect(element(snapshot.elements, "resolveCommitBeat").visible).toBe(true);
    expect(element(snapshot.elements, "resolveCommitBeat").rect).toEqual({
      x: layout.textPanel.x,
      y: layout.sentenceReviewY,
      width: 180,
      height: 92
    });
    expect(element(snapshot.elements, "resolveCommitBeat").text).toBe("deadline");
    expect(element(snapshot.elements, "resolveCommitBeatLabel").text).toBe("DEADLINE 5");
    expect(element(snapshot.elements, "resolveCommitBeatLabel").visible).toBe(true);
    for (const entry of snapshot.elements) {
      if (entry.rect) {
        expect(withinViewport(entry.rect, width, height), entry.id).toBe(true);
      }
    }
  });

  it("exposes an active endless timer-pressure lane only when the warning cue is active", () => {
    const width = 1280;
    const height = 720;
    const layout = computePlayLayout({ width, height });
    const timerPressureRect = {
      x: layout.playfield.x,
      y: layout.sentenceActiveY,
      width: layout.textPanel.width + 96,
      height: layout.textPanel.height + 38
    };
    const timerPressureDeadlineRect = {
      x: layout.playfield.x,
      y: layout.sentenceActiveY,
      width: timerPressureRect.width - 112,
      height: timerPressureRect.height - 20
    };
    const snapshot = playSceneQaSnapshot({
      width,
      height,
      layout,
      mode: "endless",
      phase: "active",
      round: 9,
      fixtureId: "dense_001",
      fixtureText: "wiener.ai/pricing",
      cutCount: 2,
      legalSlotCount: 17,
      inputModality: "mouse",
      cutStatusText: "SEGMENTS STAGED: 2",
      textFontSize: 36,
      textPanelRect: layout.textPanel,
      logoWienerRect: layout.logoWiener,
      petWienerRect: layout.petWienerSlot,
      textRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y,
        width: 360,
        height: 42
      },
      cutStatusRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y + 39,
        width: 160,
        height: 16
      },
      hudRect: hudRect(width, layout.contentPanel),
      feedbackRect: computeFeedbackCardLayout(width, height, layout.contentPanel),
      feedbackVisible: false,
      timerWarningActive: true,
      timerWarningIntensity: 0.72,
      resolveButtonReady: true,
      resolveButtonReadyPulse: 0,
      resolveButtonDeadlinePressure: 0.72,
      timerPressureRect,
      timerPressureDeadlineRect
    });

    expect(snapshot.state).toMatchObject({
      mode: "endless",
      phase: "active",
      timerWarningActive: true,
      timerWarningIntensity: 0.72,
      resolveButtonReady: true,
      resolveButtonReadyPulse: 0,
      resolveButtonDeadlinePressure: 0.72
    });
    expect(element(snapshot.elements, "timerPressureLane").visible).toBe(true);
    expect(element(snapshot.elements, "timerPressureLane").rect).toEqual(timerPressureRect);
    expect(element(snapshot.elements, "timerPressureDeadlineGates").visible).toBe(true);
    expect(element(snapshot.elements, "timerPressureDeadlineGates").rect).toEqual(timerPressureDeadlineRect);

    const calmSnapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      mode: "tutorial",
      phase: "active",
      timerWarningActive: false
    });
    expect(calmSnapshot.state?.timerWarningActive).toBe(false);
    expect(calmSnapshot.elements.some((entry) => entry.id === "timerPressureLane")).toBe(false);
    expect(calmSnapshot.elements.some((entry) => entry.id === "timerPressureDeadlineGates")).toBe(false);
  });

  it("does not report stale token-split evidence elements when feedback is hidden", () => {
    const width = 390;
    const height = 844;
    const snapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
    });

    expect(snapshot.elements.some((entry) => entry.id === "tokenStrip")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "segmentationEvidence")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "feedbackTokenSplit")).toBe(false);
  });

  it("exposes reason-specific no-cut input-feel metrics and visible aim guidance", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const noCutRect = {
      x: layout.textPanel.x - 70,
      y: layout.textPanel.y - 14,
      width: 86,
      height: 60
    };
    const snapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      inputModality: "touch",
      inputFeel: {
        gestureActive: false,
        sampleCount: 4,
        cutCount: 0,
        firstCutLatencyMs: null,
        lastCutAgeMs: null,
        lastCutBatchCount: 0,
        releaseSampleCutCount: 0,
        lastCutWasReleaseSample: false,
        lastCutWasCorrection: false,
        noCutAcknowledgementCount: 2,
        nearSlotNoCutAcknowledgementCount: 1,
        noSlotAcknowledgementCount: 1,
        lastGestureSampleCount: 4,
        lastGestureCutCount: 0,
        resolveCommitCount: 1,
        resolveAfterFirstCutMs: null,
        resolveAfterLastCutMs: null,
        correctionCutCount: 0,
        touchAimLoupeSampleCount: 3,
        touchAimLoupeSnapReadyCount: 0,
        touchAimLoupeUnsafeClearanceCount: 1,
        touchAimLoupeMinClearancePx: 24
      },
      noCutFeedbackActive: true,
      noCutFeedbackRect: noCutRect,
      noCutFeedbackText: "AIM LEFT",
      noCutFeedbackReason: "near-slot",
      noCutFeedbackDirection: "left"
    });

    expect(snapshot.state).toMatchObject({
      inputModality: "touch",
      inputFeelNoCutAcknowledgementCount: 2,
      inputFeelNearSlotNoCutAcknowledgementCount: 1,
      inputFeelNoSlotAcknowledgementCount: 1,
      inputFeelResolveCommitCount: 1,
      inputFeelResolveAfterFirstCutMs: null,
      inputFeelResolveAfterLastCutMs: null,
      inputFeelTouchAimLoupeSampleCount: 3,
      inputFeelTouchAimLoupeSnapReadyCount: 0,
      inputFeelTouchAimLoupeUnsafeClearanceCount: 1,
      inputFeelTouchAimLoupeMinClearancePx: 24,
      noCutFeedbackActive: true,
      noCutFeedbackReason: "near-slot",
      noCutFeedbackDirection: "left"
    });
    expect(snapshot.state?.inputFeelCutCount).toBe(0);
    expect(element(snapshot.elements, "noCutFeedback").text).toBe("AIM LEFT");
    expect(element(snapshot.elements, "noCutFeedback").rect).toEqual(noCutRect);
    expect(withinViewport(element(snapshot.elements, "noCutFeedback").rect!, width, height)).toBe(true);
  });

  it("exposes resolve commit timing metrics for hesitation and trust checks", () => {
    const width = 960;
    const height = 720;
    const snapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      inputFeel: {
        gestureActive: false,
        sampleCount: 8,
        cutCount: 3,
        firstCutLatencyMs: 28,
        lastCutAgeMs: 160,
        lastCutBatchCount: 2,
        releaseSampleCutCount: 1,
        lastCutWasReleaseSample: true,
        lastCutWasCorrection: false,
        noCutAcknowledgementCount: 0,
        nearSlotNoCutAcknowledgementCount: 0,
        noSlotAcknowledgementCount: 0,
        lastGestureSampleCount: 8,
        lastGestureCutCount: 3,
        resolveCommitCount: 1,
        resolveAfterFirstCutMs: 940,
        resolveAfterLastCutMs: 160,
        correctionCutCount: 0,
        touchAimLoupeSampleCount: 6,
        touchAimLoupeSnapReadyCount: 4,
        touchAimLoupeUnsafeClearanceCount: 0,
        touchAimLoupeMinClearancePx: 40
      }
    });

    expect(snapshot.state).toMatchObject({
      inputFeelResolveCommitCount: 1,
      inputFeelResolveAfterFirstCutMs: 940,
      inputFeelResolveAfterLastCutMs: 160,
      inputFeelLastCutBatchCount: 2,
      inputFeelTouchAimLoupeSampleCount: 6,
      inputFeelTouchAimLoupeSnapReadyCount: 4,
      inputFeelTouchAimLoupeUnsafeClearanceCount: 0,
      inputFeelTouchAimLoupeMinClearancePx: 40,
      inputFeelLastCutWasReleaseSample: true
    });
  });

  it("exposes review token split through the feedback card only", () => {
    const width = 960;
    const height = 720;
    const textRect = {
      x: 480,
      y: 462,
      width: 460,
      height: 38
    };
    const snapshot = playSceneQaSnapshot({
      ...snapshotBaseInput(width, height),
      phase: "review",
      feedbackVisible: true,
      feedbackText: "RESOLVED TOKENS 3\nopen │ ai │ .com",
      feedbackTokenSplitText: "RESOLVED TOKENS 3\nopen │ ai │ .com",
      feedbackTokenSplitRect: textRect
    });

    expect(snapshot.elements.some((entry) => entry.id === "tokenStrip")).toBe(false);
    expect(snapshot.elements.some((entry) => entry.id === "segmentationEvidence")).toBe(false);
    expect(element(snapshot.elements, "feedbackTokenSplit").rect).toEqual(textRect);
    expect(element(snapshot.elements, "feedbackTokenSplit").text).toContain("open │ ai");
  });

  it("exposes transient text cut impact geometry when the prompt responds to a cut", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const snapshot = playSceneQaSnapshot({
      width,
      height,
      layout,
      mode: "tutorial",
      phase: "active",
      round: 1,
      fixtureId: "simple_001",
      fixtureText: "the cat sat on the mat",
      cutCount: 1,
      legalSlotCount: 17,
      inputModality: "touch",
      cutStatusText: "STAGED: 1",
      textFontSize: 18,
      textPanelRect: layout.textPanel,
      logoWienerRect: layout.logoWiener,
      petWienerRect: layout.petWienerSlot,
      textRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y,
        width: 278,
        height: 19
      },
      cutStatusRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y + 39,
        width: 90,
        height: 16
      },
      hudRect: hudRect(width, layout.contentPanel),
      feedbackRect: computeFeedbackCardLayout(width, height, layout.contentPanel),
      feedbackVisible: false,
      textCutImpactActive: true,
      textCutImpactRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y,
        width: 288,
        height: 22
      }
    });

    expect(snapshot.state?.textCutImpactActive).toBe(true);
    expect(element(snapshot.elements, "textCutImpact").visible).toBe(true);
    expect(element(snapshot.elements, "textCutImpact").rect).toEqual({
      x: layout.textPanel.x,
      y: layout.textPanel.y,
      width: 288,
      height: 22
    });
  });

  it("exposes transient clear-cut release geometry when staged markers are withdrawn", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const clearCutFeedbackRect = {
      x: layout.textPanel.x,
      y: layout.textPanel.y,
      width: 74,
      height: 58
    };
    const snapshot = playSceneQaSnapshot({
      width,
      height,
      layout,
      mode: "tutorial",
      phase: "active",
      round: 1,
      fixtureId: "simple_001",
      fixtureText: "the cat sat on the mat",
      cutCount: 0,
      legalSlotCount: 17,
      inputModality: "touch",
      cutStatusText: "NO CUTS",
      textFontSize: 18,
      textPanelRect: layout.textPanel,
      logoWienerRect: layout.logoWiener,
      petWienerRect: layout.petWienerSlot,
      textRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y,
        width: 278,
        height: 19
      },
      cutStatusRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y + 39,
        width: 90,
        height: 16
      },
      hudRect: hudRect(width, layout.contentPanel),
      feedbackRect: computeFeedbackCardLayout(width, height, layout.contentPanel),
      feedbackVisible: false,
      clearCutFeedbackActive: true,
      clearCutFeedbackRect
    });

    expect(snapshot.state?.clearCutFeedbackActive).toBe(true);
    expect(element(snapshot.elements, "clearCutFeedback").visible).toBe(true);
    expect(element(snapshot.elements, "clearCutFeedback").rect).toEqual(clearCutFeedbackRect);
  });

  it("exposes transient chained-swipe bridge geometry for broad gesture QA", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const chainSwipeFeedbackRect = {
      x: layout.textPanel.x + 16,
      y: layout.textPanel.y + 28,
      width: 132,
      height: 24
    };
    const snapshot = playSceneQaSnapshot({
      width,
      height,
      layout,
      mode: "tutorial",
      phase: "active",
      round: 1,
      fixtureId: "simple_001",
      fixtureText: "the cat sat on the mat",
      cutCount: 3,
      legalSlotCount: 17,
      inputModality: "touch",
      cutStatusText: "STAGED: 3",
      textFontSize: 18,
      textPanelRect: layout.textPanel,
      logoWienerRect: layout.logoWiener,
      petWienerRect: layout.petWienerSlot,
      textRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y,
        width: 278,
        height: 19
      },
      cutStatusRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y + 39,
        width: 90,
        height: 16
      },
      hudRect: hudRect(width, layout.contentPanel),
      feedbackRect: computeFeedbackCardLayout(width, height, layout.contentPanel),
      feedbackVisible: false,
      chainSwipeFeedbackActive: true,
      chainSwipeFeedbackRect
    });

    expect(snapshot.state?.chainSwipeFeedbackActive).toBe(true);
    expect(element(snapshot.elements, "chainSwipeFeedback").visible).toBe(true);
    expect(element(snapshot.elements, "chainSwipeFeedback").rect).toEqual(chainSwipeFeedbackRect);
  });

  it("exposes transient no-cut feedback geometry when a swipe lands no boundary", () => {
    const width = 390;
    const height = 844;
    const layout = computePlayLayout({ width, height });
    const noCutFeedbackRect = {
      x: layout.textPanel.x + 28,
      y: layout.textPanel.y - 20,
      width: 48,
      height: 44
    };
    const snapshot = playSceneQaSnapshot({
      width,
      height,
      layout,
      mode: "tutorial",
      phase: "active",
      round: 1,
      fixtureId: "simple_001",
      fixtureText: "the cat sat on the mat",
      cutCount: 0,
      legalSlotCount: 17,
      inputModality: "touch",
      cutStatusText: "NO CUTS",
      textFontSize: 18,
      textPanelRect: layout.textPanel,
      logoWienerRect: layout.logoWiener,
      petWienerRect: layout.petWienerSlot,
      textRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y,
        width: 278,
        height: 19
      },
      cutStatusRect: {
        x: layout.textPanel.x,
        y: layout.textPanel.y + 39,
        width: 90,
        height: 16
      },
      hudRect: hudRect(width, layout.contentPanel),
      feedbackRect: computeFeedbackCardLayout(width, height, layout.contentPanel),
      feedbackVisible: false,
      noCutFeedbackActive: true,
      noCutFeedbackRect,
      noCutFeedbackText: "AIM LEFT",
      noCutFeedbackReason: "near-slot",
      noCutFeedbackDirection: "left"
    });

    expect(snapshot.state?.noCutFeedbackActive).toBe(true);
    expect(snapshot.state?.noCutFeedbackReason).toBe("near-slot");
    expect(snapshot.state?.noCutFeedbackDirection).toBe("left");
    expect(element(snapshot.elements, "noCutFeedback").visible).toBe(true);
    expect(element(snapshot.elements, "noCutFeedback").text).toBe("AIM LEFT");
    expect(element(snapshot.elements, "noCutFeedback").rect).toEqual(noCutFeedbackRect);
  });
});

function snapshotBaseInput(width: number, height: number): PlaySceneQaSnapshotInput {
  const layout = computePlayLayout({ width, height });
  return {
    width,
    height,
    layout,
    mode: "tutorial",
    phase: "active",
    round: 1,
    fixtureId: "simple_001",
    fixtureText: "the cat sat on the mat",
    cutCount: 0,
    legalSlotCount: 17,
    inputModality: "touch",
    cutStatusText: "NO CUTS",
    textFontSize: 18,
    textPanelRect: layout.textPanel,
    logoWienerRect: layout.logoWiener,
    petWienerRect: layout.petWienerSlot,
    textRect: {
      x: layout.textPanel.x,
      y: layout.textPanel.y,
      width: 278,
      height: 19
    },
    cutStatusRect: {
      x: layout.textPanel.x,
      y: layout.textPanel.y + 39,
      width: 90,
      height: 16
    },
    hudRect: hudRect(width, layout.contentPanel),
    feedbackRect: computeFeedbackCardLayout(width, height, layout.contentPanel),
    feedbackVisible: false
  };
}
