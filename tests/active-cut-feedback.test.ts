import { describe, expect, it } from "vitest";
import {
  ACTIVE_CUT_LABEL_LIMIT,
  ACTIVE_CUT_LABEL_MIN_GAP,
  ACTIVE_CUT_PULSE_MS,
  ACTIVE_CUT_STATUS_PULSE_MS,
  ARMED_CUT_PREVIEW_RECT_WIDTH,
  AUTO_RELEASE_CUT_FEEDBACK_MS,
  CHAIN_SWIPE_FEEDBACK_MS,
  COMPACT_ACTIVE_CUT_LABEL_MIN_GAP,
  CLEAR_CUT_FEEDBACK_MS,
  INPUT_RESPONSE_BADGE_MS,
  NO_CUT_FEEDBACK_AIM_LABEL,
  NO_CUT_FEEDBACK_AIM_LEFT_LABEL,
  NO_CUT_FEEDBACK_AIM_RIGHT_LABEL,
  NO_CUT_FEEDBACK_MS,
  NO_CUT_FEEDBACK_LABEL,
  NEAR_SLOT_NO_CUT_FEEDBACK_MS,
  TEXT_CUT_IMPACT_MS,
  activeCutLabelsHaveRoom,
  activeCutLabelMinGap,
  activeCutMarkerStyle,
  activeCutPulseStrength,
  activeCutStatusBadgeStyle,
  activeCutStatusPulseStrength,
  activeCutStatusText,
  armedCutSnapStrength,
  armedCutPreviewStrength,
  armedCutPreviewStyle,
  autoReleaseCutFeedbackStyle,
  chainSwipeFeedbackStyle,
  clearCutFeedbackStyle,
  cutCorrectionFeedbackStyle,
  inputResponseBadgeState,
  noCutFeedbackLabel,
  noCutFeedbackDirection,
  noCutFeedbackReason,
  noCutFeedbackStyle,
  shouldAcknowledgeNoCutGesture,
  shouldShowActiveCutLabels,
  textCutImpactStyle
} from "../src/game/systems/ActiveCutFeedbackSystem";

describe("shouldShowActiveCutLabels", () => {
  it("shows active cut labels while the player has made a readable number of cuts", () => {
    expect(ACTIVE_CUT_LABEL_LIMIT).toBeGreaterThan(0);
    expect(shouldShowActiveCutLabels(0)).toBe(true);
    expect(shouldShowActiveCutLabels(ACTIVE_CUT_LABEL_LIMIT)).toBe(true);
  });

  it("suppresses repeated CUT text once dense cutting would clutter the prompt", () => {
    expect(shouldShowActiveCutLabels(ACTIVE_CUT_LABEL_LIMIT + 1)).toBe(false);
    expect(shouldShowActiveCutLabels(14)).toBe(false);
  });

  it("suppresses CUT labels when adjacent boundaries would overlap", () => {
    expect(ACTIVE_CUT_LABEL_MIN_GAP).toBeGreaterThanOrEqual(42);
    expect(COMPACT_ACTIVE_CUT_LABEL_MIN_GAP).toBeGreaterThan(ACTIVE_CUT_LABEL_MIN_GAP);
    expect(activeCutLabelMinGap(false)).toBe(ACTIVE_CUT_LABEL_MIN_GAP);
    expect(activeCutLabelMinGap(true)).toBe(COMPACT_ACTIVE_CUT_LABEL_MIN_GAP);
    expect(activeCutLabelsHaveRoom([100, 148, 198])).toBe(true);
    expect(activeCutLabelsHaveRoom([100, 134, 180])).toBe(false);
    expect(activeCutLabelsHaveRoom([100, 118, 180])).toBe(false);
    expect(activeCutLabelsHaveRoom([196, 100, Number.NaN, 148])).toBe(true);
  });

  it("normalizes invalid or fractional counts conservatively", () => {
    expect(shouldShowActiveCutLabels(-3)).toBe(true);
    expect(shouldShowActiveCutLabels(ACTIVE_CUT_LABEL_LIMIT + 0.9)).toBe(true);
  });

  it("summarizes staged cuts without implying a quota or correctness", () => {
    expect(activeCutStatusText(0)).toBe("NO CUTS");
    expect(activeCutStatusText(3)).toBe("SEGMENTS STAGED: 3");
    expect(activeCutStatusText(3.9)).toBe("SEGMENTS STAGED: 3");
    expect(activeCutStatusText(-2)).toBe("NO CUTS");
  });

  it("uses a shorter staged-cut status on compact layouts without implying a quota", () => {
    expect(activeCutStatusText(0, true)).toBe("NO CUTS");
    expect(activeCutStatusText(3, true)).toBe("STAGED: 3");
    expect(activeCutStatusText(3, true)).not.toContain("/");
  });

  it("makes the staged-cut status readable and briefly emphatic after count changes", () => {
    const idle = activeCutStatusBadgeStyle(0, false);
    const fresh = activeCutStatusBadgeStyle(4, false, 0);
    const settling = activeCutStatusBadgeStyle(4, false, ACTIVE_CUT_STATUS_PULSE_MS / 2);
    const baseline = activeCutStatusBadgeStyle(4, false, ACTIVE_CUT_STATUS_PULSE_MS);
    const compact = activeCutStatusBadgeStyle(4, true, 0);

    expect(ACTIVE_CUT_STATUS_PULSE_MS).toBeGreaterThanOrEqual(220);
    expect(ACTIVE_CUT_STATUS_PULSE_MS).toBeLessThanOrEqual(300);
    expect(idle.fontSize).toBeGreaterThan(11);
    expect(idle.fillAlpha).toBeLessThan(fresh.fillAlpha);
    expect(fresh.pulse).toBe(1);
    expect(fresh.fillAlpha).toBeGreaterThan(settling.fillAlpha);
    expect(settling.fillAlpha).toBeGreaterThan(baseline.fillAlpha);
    expect(fresh.strokeAlpha).toBeGreaterThan(baseline.strokeAlpha);
    expect(baseline.pulse).toBe(0);
    expect(compact.fontSize).toBeLessThanOrEqual(fresh.fontSize);
    expect(compact.paddingX).toBeLessThan(fresh.paddingX);
  });

  it("decays staged-cut status pulse without changing committed cuts", () => {
    expect(activeCutStatusPulseStrength(0)).toBe(1);
    expect(activeCutStatusPulseStrength(ACTIVE_CUT_STATUS_PULSE_MS / 2)).toBeGreaterThan(0);
    expect(activeCutStatusPulseStrength(ACTIVE_CUT_STATUS_PULSE_MS / 2)).toBeLessThan(1);
    expect(activeCutStatusPulseStrength(ACTIVE_CUT_STATUS_PULSE_MS)).toBe(0);
    expect(activeCutStatusPulseStrength(undefined)).toBe(0);
  });

  it("summarizes first-cut response with temporary word badges instead of unexplained counters", () => {
    const snap = inputResponseBadgeState({
      firstCutLatencyMs: 32,
      lastCutAgeMs: 24,
      lastCutWasReleaseSample: false
    });
    const tracked = inputResponseBadgeState({
      firstCutLatencyMs: 140,
      lastCutAgeMs: 24,
      lastCutWasReleaseSample: false
    });
    const latched = inputResponseBadgeState({
      firstCutLatencyMs: 140,
      lastCutAgeMs: 24,
      lastCutWasReleaseSample: true
    });
    const chained = inputResponseBadgeState({
      firstCutLatencyMs: 140,
      lastCutAgeMs: 24,
      lastCutWasReleaseSample: true,
      lastCutBatchCount: 3
    });
    const chainedGesture = inputResponseBadgeState({
      gestureActive: false,
      firstCutLatencyMs: 32,
      lastCutAgeMs: 24,
      lastCutBatchCount: 1,
      lastGestureCutCount: 5
    });
    const freshSingleCutAfterPriorChain = inputResponseBadgeState({
      gestureActive: true,
      firstCutLatencyMs: 32,
      lastCutAgeMs: 24,
      lastCutBatchCount: 1,
      lastGestureCutCount: 5
    });
    const adjusted = inputResponseBadgeState({
      firstCutLatencyMs: 24,
      lastCutAgeMs: 24,
      lastCutWasReleaseSample: true,
      lastCutWasCorrection: true,
      lastCutBatchCount: 3
    });
    const fading = inputResponseBadgeState({
      firstCutLatencyMs: 32,
      lastCutAgeMs: INPUT_RESPONSE_BADGE_MS / 2
    });
    const expired = inputResponseBadgeState({
      firstCutLatencyMs: 32,
      lastCutAgeMs: INPUT_RESPONSE_BADGE_MS
    });

    expect(INPUT_RESPONSE_BADGE_MS).toBeGreaterThanOrEqual(560);
    expect(INPUT_RESPONSE_BADGE_MS).toBeLessThanOrEqual(680);
    expect(snap?.text).toBe("SNAP");
    expect(snap?.tone).toBe("snap");
    expect(tracked?.text).toBe("TRACKED");
    expect(tracked?.tone).toBe("tracked");
    expect(latched?.text).toBe("LATCHED");
    expect(latched?.tone).toBe("latched");
    expect(chained?.text).toBe("CHAINED");
    expect(chained?.tone).toBe("chained");
    expect(chainedGesture?.text).toBe("CHAINED");
    expect(chainedGesture?.tone).toBe("chained");
    expect(freshSingleCutAfterPriorChain?.text).toBe("SNAP");
    expect(freshSingleCutAfterPriorChain?.tone).toBe("snap");
    expect(adjusted?.text).toBe("ADJUSTED");
    expect(adjusted?.tone).toBe("adjusted");
    expect(snap?.text).not.toMatch(/\d/);
    expect(tracked?.text).not.toMatch(/\d/);
    expect(latched?.text).not.toMatch(/\d/);
    expect(chained?.text).not.toMatch(/\d/);
    expect(chainedGesture?.text).not.toMatch(/\d/);
    expect(freshSingleCutAfterPriorChain?.text).not.toMatch(/\d/);
    expect(adjusted?.text).not.toMatch(/\d/);
    expect(fading?.alpha).toBeGreaterThan(0);
    expect(fading?.alpha).toBeLessThan(snap?.alpha ?? 0);
    expect(expired).toBeNull();
    expect(inputResponseBadgeState({ firstCutLatencyMs: null, lastCutAgeMs: null })).toBeNull();
  });

  it("keeps Clear silent instead of adding recovery narration", async () => {
    const feedback = await import("../src/game/systems/ActiveCutFeedbackSystem");

    expect("clearCutRecoveryLine" in feedback).toBe(false);
  });

  it("gives cleared cuts a short release decay without reusing active marker strength", () => {
    const desktop = clearCutFeedbackStyle(1, false);
    const dense = clearCutFeedbackStyle(8, false);
    const compact = clearCutFeedbackStyle(1, true);
    const active = activeCutMarkerStyle(undefined, false);

    expect(CLEAR_CUT_FEEDBACK_MS).toBeGreaterThanOrEqual(300);
    expect(CLEAR_CUT_FEEDBACK_MS).toBeLessThanOrEqual(380);
    expect(clearCutFeedbackStyle(0)).toBeNull();
    expect(desktop?.durationMs).toBe(CLEAR_CUT_FEEDBACK_MS);
    expect(compact?.durationMs).toBeLessThan(CLEAR_CUT_FEEDBACK_MS);
    expect(compact?.durationMs).toBeGreaterThanOrEqual(280);
    expect(desktop?.lineAlpha).toBeLessThan(active.lineAlpha);
    expect(desktop?.haloAlpha).toBeGreaterThan(0);
    expect(dense?.lineWidth).toBeGreaterThan(desktop?.lineWidth ?? 0);
    expect(dense?.lineAlpha).toBeGreaterThan(desktop?.lineAlpha ?? 0);
    expect(dense?.lineAlpha).toBeLessThan(0.5);
  });

  it("gives automatically released cuts a weaker shorter decay than manual Clear", () => {
    const clear = clearCutFeedbackStyle(2, false);
    const released = autoReleaseCutFeedbackStyle(2, false);
    const compact = autoReleaseCutFeedbackStyle(2, true);

    expect(AUTO_RELEASE_CUT_FEEDBACK_MS).toBeGreaterThanOrEqual(200);
    expect(AUTO_RELEASE_CUT_FEEDBACK_MS).toBeLessThanOrEqual(260);
    expect(autoReleaseCutFeedbackStyle(0)).toBeNull();
    expect(released?.durationMs).toBe(AUTO_RELEASE_CUT_FEEDBACK_MS);
    expect(compact?.durationMs).toBeLessThan(AUTO_RELEASE_CUT_FEEDBACK_MS);
    expect(released?.durationMs).toBeLessThan(clear?.durationMs ?? 0);
    expect(released?.lineWidth).toBeLessThan(clear?.lineWidth ?? 0);
    expect(released?.lineAlpha).toBeLessThan(clear?.lineAlpha ?? 0);
    expect(released?.haloAlpha).toBeLessThan(clear?.haloAlpha ?? 0);
    expect(released?.capAlpha).toBeLessThan(clear?.capAlpha ?? 0);
    expect(released?.lineAlpha).toBeGreaterThan(0.16);
  });

  it("gives same-gesture correction a brief bridge distinct from Clear", () => {
    const clear = clearCutFeedbackStyle(2, false);
    const correction = cutCorrectionFeedbackStyle(1, false);
    const dense = cutCorrectionFeedbackStyle(5, false);
    const compact = cutCorrectionFeedbackStyle(1, true);

    expect(cutCorrectionFeedbackStyle(0)).toBeNull();
    expect(correction?.durationMs).toBeGreaterThanOrEqual(220);
    expect(correction?.durationMs).toBeLessThan(clear?.durationMs ?? 0);
    expect(compact?.durationMs).toBeLessThan(correction?.durationMs ?? 0);
    expect(correction?.bridgeAlpha).toBeGreaterThan(0.3);
    expect(correction?.bridgeAlpha).toBeLessThan(0.55);
    expect(correction?.haloWidth).toBeGreaterThan(correction?.bridgeWidth ?? 0);
    expect(correction?.arrowLength).toBeGreaterThan(0);
    expect(dense?.bridgeWidth).toBeGreaterThan(correction?.bridgeWidth ?? 0);
    expect(dense?.bridgeAlpha).toBeGreaterThan(correction?.bridgeAlpha ?? 0);
    expect(dense?.bridgeAlpha).toBeLessThan(0.55);
  });

  it("gives chained multi-cut swipes a brief rail without changing active marker styling", () => {
    const chain = chainSwipeFeedbackStyle(3, false);
    const dense = chainSwipeFeedbackStyle(8, false);
    const compact = chainSwipeFeedbackStyle(3, true);
    const active = activeCutMarkerStyle(undefined, false);

    expect(CHAIN_SWIPE_FEEDBACK_MS).toBeGreaterThanOrEqual(260);
    expect(CHAIN_SWIPE_FEEDBACK_MS).toBeLessThanOrEqual(340);
    expect(chainSwipeFeedbackStyle(1)).toBeNull();
    expect(chain?.durationMs).toBe(CHAIN_SWIPE_FEEDBACK_MS);
    expect(compact?.durationMs).toBe(CHAIN_SWIPE_FEEDBACK_MS);
    expect(chain?.railWidth).toBeGreaterThan(2);
    expect(chain?.railAlpha).toBeGreaterThan(0.35);
    expect(chain?.railAlpha).toBeLessThan(active.lineAlpha);
    expect(chain?.haloWidth).toBeGreaterThan(chain?.railWidth ?? 0);
    expect(chain?.tickLength).toBeGreaterThan(10);
    expect(dense?.railWidth).toBeGreaterThan(chain?.railWidth ?? 0);
    expect(dense?.railAlpha).toBeGreaterThan(chain?.railAlpha ?? 0);
    expect(dense?.railAlpha).toBeLessThan(0.55);
  });

  it("gives missed swipes a short no-cut acknowledgement without creating a fake boundary", () => {
    const desktop = noCutFeedbackStyle(false);
    const compact = noCutFeedbackStyle(true);
    const nearSlot = noCutFeedbackStyle(false, "near-slot");
    const compactNearSlot = noCutFeedbackStyle(true, "near-slot");

    expect(NO_CUT_FEEDBACK_LABEL).toBe("NO SLOT");
    expect(NO_CUT_FEEDBACK_AIM_LABEL).toBe("AIM CLOSER");
    expect(NO_CUT_FEEDBACK_AIM_LEFT_LABEL).toBe("AIM LEFT");
    expect(NO_CUT_FEEDBACK_AIM_RIGHT_LABEL).toBe("AIM RIGHT");
    expect(noCutFeedbackReason(false)).toBe("no-slot");
    expect(noCutFeedbackReason(true)).toBe("near-slot");
    expect(noCutFeedbackLabel("no-slot")).toBe("NO SLOT");
    expect(noCutFeedbackLabel("near-slot")).toBe("AIM CLOSER");
    expect(noCutFeedbackLabel("near-slot", "left")).toBe("AIM LEFT");
    expect(noCutFeedbackLabel("near-slot", "right")).toBe("AIM RIGHT");
    expect(noCutFeedbackLabel("no-slot", "left")).toBe("NO SLOT");
    expect(noCutFeedbackDirection(120, 100)).toBe("left");
    expect(noCutFeedbackDirection(80, 100)).toBe("right");
    expect(noCutFeedbackDirection(100.5, 100)).toBe("center");
    expect(noCutFeedbackDirection(Number.NaN, 100)).toBe("center");
    expect(NO_CUT_FEEDBACK_MS).toBeGreaterThanOrEqual(220);
    expect(NO_CUT_FEEDBACK_MS).toBeLessThanOrEqual(300);
    expect(desktop.durationMs).toBe(NO_CUT_FEEDBACK_MS);
    expect(compact.durationMs).toBeLessThan(NO_CUT_FEEDBACK_MS);
    expect(NEAR_SLOT_NO_CUT_FEEDBACK_MS).toBeGreaterThan(NO_CUT_FEEDBACK_MS);
    expect(NEAR_SLOT_NO_CUT_FEEDBACK_MS).toBeLessThanOrEqual(420);
    expect(nearSlot.durationMs).toBe(NEAR_SLOT_NO_CUT_FEEDBACK_MS);
    expect(compactNearSlot.durationMs).toBeGreaterThan(compact.durationMs);
    expect(compactNearSlot.durationMs).toBeLessThan(nearSlot.durationMs);
    expect(nearSlot.alpha).toBeGreaterThan(desktop.alpha);
    expect(nearSlot.fontSize).toBeGreaterThan(desktop.fontSize);
    expect(nearSlot.snapGuideAlpha).toBeGreaterThan(desktop.snapGuideAlpha);
    expect(nearSlot.snapLineAlpha).toBeGreaterThan(desktop.snapLineAlpha);
    expect(nearSlot.snapTickAlpha).toBeGreaterThan(desktop.snapTickAlpha);
    expect(nearSlot.correctionArrowAlpha).toBeGreaterThan(desktop.correctionArrowAlpha);
    expect(nearSlot.correctionArrowAlpha).toBeLessThan(0.7);
    expect(desktop.alpha).toBeLessThan(1);
    expect(desktop.yLift).toBeGreaterThan(0);
    expect(compact.fontSize).toBeLessThanOrEqual(desktop.fontSize);
    expect(desktop.scuffLength).toBeGreaterThan(desktop.fontSize);
    expect(desktop.scuffAlpha).toBeGreaterThan(0.35);
    expect(desktop.scuffAlpha).toBeLessThan(0.55);
    expect(desktop.scuffHaloWidth).toBeGreaterThan(desktop.scuffWidth);
    expect(desktop.scuffHaloAlpha).toBeLessThan(desktop.scuffAlpha);
    expect(compact.scuffLength).toBeLessThan(desktop.scuffLength);
    expect(desktop.snapGuideWidth).toBeGreaterThan(desktop.scuffWidth);
    expect(desktop.snapGuideAlpha).toBeGreaterThan(0.1);
    expect(desktop.snapGuideAlpha).toBeLessThan(desktop.scuffAlpha);
    expect(desktop.snapLineWidth).toBeLessThan(desktop.scuffWidth);
    expect(desktop.snapLineAlpha).toBeLessThan(desktop.scuffAlpha);
    expect(desktop.snapTickLength).toBeGreaterThan(0);
    expect(compact.snapGuideWidth).toBeLessThan(desktop.snapGuideWidth);
    expect(desktop.correctionArrowLength).toBeGreaterThan(20);
    expect(desktop.correctionArrowAlpha).toBeGreaterThan(desktop.snapTickAlpha);
    expect(desktop.correctionArrowAlpha).toBeLessThan(desktop.scuffAlpha);
    expect(compact.correctionArrowLength).toBeLessThan(desktop.correctionArrowLength);
  });

  it("acknowledges no-cut releases for real swipes or short near-slot attempts only", () => {
    expect(shouldAcknowledgeNoCutGesture({
      touchedCutBand: true,
      hadCut: false,
      trailPointCount: 2
    })).toBe(true);
    expect(shouldAcknowledgeNoCutGesture({
      touchedCutBand: true,
      hadCut: false,
      trailPointCount: 1,
      hadPreviewTarget: true
    })).toBe(true);
    expect(shouldAcknowledgeNoCutGesture({
      touchedCutBand: true,
      hadCut: false,
      trailPointCount: 1
    })).toBe(false);
    expect(shouldAcknowledgeNoCutGesture({
      touchedCutBand: false,
      hadCut: false,
      trailPointCount: 4,
      hadPreviewTarget: true
    })).toBe(false);
    expect(shouldAcknowledgeNoCutGesture({
      touchedCutBand: true,
      hadCut: true,
      trailPointCount: 4,
      hadPreviewTarget: true
    })).toBe(false);
  });

  it("gives newly staged cuts a brief attack and decay pulse", () => {
    expect(ACTIVE_CUT_PULSE_MS).toBeGreaterThanOrEqual(280);
    expect(ACTIVE_CUT_PULSE_MS).toBeLessThanOrEqual(340);
    expect(activeCutPulseStrength(0)).toBe(1);
    expect(activeCutPulseStrength(ACTIVE_CUT_PULSE_MS / 2)).toBeGreaterThan(0);
    expect(activeCutPulseStrength(ACTIVE_CUT_PULSE_MS / 2)).toBeLessThan(1);
    expect(activeCutPulseStrength(ACTIVE_CUT_PULSE_MS)).toBe(0);
    expect(activeCutPulseStrength(undefined)).toBe(0);
  });

  it("returns active cut markers to the persistent baseline after the pulse", () => {
    const fresh = activeCutMarkerStyle(0);
    const confirmed = activeCutMarkerStyle(0, false, "confirm");
    const releaseLatched = activeCutMarkerStyle(0, false, "release");
    const settling = activeCutMarkerStyle(ACTIVE_CUT_PULSE_MS / 2);
    const baseline = activeCutMarkerStyle(ACTIVE_CUT_PULSE_MS);

    expect(fresh.lineWidth).toBeGreaterThan(settling.lineWidth);
    expect(settling.lineWidth).toBeGreaterThan(baseline.lineWidth);
    expect(confirmed.lineWidth).toBeLessThan(fresh.lineWidth);
    expect(confirmed.lineWidth).toBeGreaterThan(baseline.lineWidth);
    expect(releaseLatched.lineWidth).toBeLessThan(fresh.lineWidth);
    expect(releaseLatched.lineWidth).toBeGreaterThan(confirmed.lineWidth);
    expect(releaseLatched.haloAlpha).toBeGreaterThan(fresh.haloAlpha);
    expect(confirmed.haloAlpha).toBeLessThan(fresh.haloAlpha);
    expect(confirmed.haloAlpha).toBeGreaterThan(baseline.haloAlpha);
    expect(fresh.haloAlpha).toBeGreaterThan(0);
    expect(fresh.haloAlpha).toBeGreaterThan(0.2);
    expect(fresh.capAlpha).toBeGreaterThan(0.2);
    expect(baseline.haloAlpha).toBe(0);
    expect(baseline.lineAlpha).toBeCloseTo(0.84);
  });

  it("adds a brief text-object impact without letting it become a layout effect", () => {
    const desktop = textCutImpactStyle(1, false);
    const stacked = textCutImpactStyle(4, false);
    const compact = textCutImpactStyle(1, true);

    expect(TEXT_CUT_IMPACT_MS).toBeGreaterThanOrEqual(180);
    expect(TEXT_CUT_IMPACT_MS).toBeLessThanOrEqual(230);
    expect(textCutImpactStyle(0)).toBeNull();
    expect(desktop?.durationMs).toBe(TEXT_CUT_IMPACT_MS);
    expect(desktop?.scaleY).toBeGreaterThan(desktop?.scaleX ?? 0);
    expect(stacked?.scaleY).toBeGreaterThan(desktop?.scaleY ?? 0);
    expect(stacked?.scaleY).toBeLessThan(1.06);
    expect(compact?.durationMs).toBeLessThan(TEXT_CUT_IMPACT_MS);
    expect(compact?.durationMs).toBeGreaterThanOrEqual(160);
    expect(compact?.durationMs).toBeLessThanOrEqual(200);
    expect(compact?.scaleY).toBeLessThan(desktop?.scaleY ?? Number.POSITIVE_INFINITY);
  });

  it("scales the armed preview as the pointer approaches a legal slot", () => {
    expect(armedCutPreviewStrength(0, 32)).toBe(1);
    expect(armedCutPreviewStrength(16, 32)).toBe(0.5);
    expect(armedCutPreviewStrength(32, 32)).toBe(0);
    expect(armedCutPreviewStrength(40, 32)).toBe(0);
    expect(armedCutPreviewStrength(Number.NaN, 32)).toBe(0);
  });

  it("keeps armed preview visually distinct from committed cuts", () => {
    const near = armedCutPreviewStyle(0, 32);
    const far = armedCutPreviewStyle(28, 32);
    const committed = activeCutMarkerStyle(undefined);

    expect(near.rectWidth).toBe(ARMED_CUT_PREVIEW_RECT_WIDTH);
    expect(near.guideWidth).toBeGreaterThan(far.guideWidth);
    expect(near.targetAlpha).toBeGreaterThan(far.targetAlpha);
    expect(near.lineAlpha).toBeLessThan(committed.lineAlpha);
    expect(far.guideAlpha).toBeGreaterThan(0);
  });

  it("separates preview range from the real snap-ready range", () => {
    expect(armedCutSnapStrength(0, 20)).toBe(1);
    expect(armedCutSnapStrength(10, 20)).toBe(0.5);
    expect(armedCutSnapStrength(20, 20)).toBe(0);
    expect(armedCutSnapStrength(21, 20)).toBe(0);
    expect(armedCutSnapStrength(Number.NaN, 20)).toBe(0);

    const ready = armedCutPreviewStyle(8, 32, false, 20);
    const edge = armedCutPreviewStyle(20, 32, false, 20);
    const approach = armedCutPreviewStyle(28, 32, false, 20);
    const legacy = armedCutPreviewStyle(8, 32);

    expect(ready.snapReady).toBe(true);
    expect(edge.snapReady).toBe(true);
    expect(approach.snapReady).toBe(false);
    expect(legacy.snapReady).toBe(false);
    expect(ready.snapStrength).toBeGreaterThan(edge.snapStrength);
    expect(ready.lineAlpha).toBeGreaterThan(approach.lineAlpha);
    expect(ready.targetAlpha).toBeGreaterThan(approach.targetAlpha);
    expect(ready.guideWidth).toBeGreaterThan(approach.guideWidth);
    expect(ready.latchLength).toBeGreaterThan(edge.latchLength);
    expect(ready.latchAlpha).toBeGreaterThan(0.7);
    expect(edge.latchAlpha).toBeGreaterThan(0);
    expect(edge.latchWidth).toBeGreaterThan(2);
    expect(approach.latchLength).toBe(0);
    expect(approach.latchAlpha).toBe(0);
    expect(approach.latchWidth).toBe(0);
    expect(legacy.latchLength).toBe(0);
    expect(approach.strength).toBeGreaterThan(0);
  });
});
