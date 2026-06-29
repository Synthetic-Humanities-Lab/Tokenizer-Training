import { describe, expect, it } from "vitest";
import { InputFeelMetricsSystem } from "../src/game/systems/InputFeelMetricsSystem";

describe("InputFeelMetricsSystem", () => {
  it("measures first-cut response latency without changing cut counts", () => {
    const metrics = new InputFeelMetricsSystem();

    metrics.startRound();
    metrics.recordSample(1000);
    metrics.recordSample(1016);
    metrics.recordCutsAdded({ nowMs: 1032, cutCount: 1 });

    expect(metrics.snapshot(1048)).toMatchObject({
      gestureActive: true,
      sampleCount: 2,
      cutCount: 1,
      firstCutLatencyMs: 32,
      lastCutAgeMs: 16,
      lastCutBatchCount: 1,
      lastCutWasReleaseSample: false,
      lastCutWasCorrection: false,
      releaseSampleCutCount: 0,
      noCutAcknowledgementCount: 0,
      nearSlotNoCutAcknowledgementCount: 0,
      noSlotAcknowledgementCount: 0,
      lastGestureSampleCount: 0,
      lastGestureCutCount: 0,
      resolveCommitCount: 0,
      resolveAfterFirstCutMs: null,
      resolveAfterLastCutMs: null,
      correctionCutCount: 0,
      touchAimLoupeSampleCount: 0,
      touchAimLoupeSnapReadyCount: 0,
      touchAimLoupeUnsafeClearanceCount: 0,
      touchAimLoupeMinClearancePx: null
    });

    metrics.endGesture();

    expect(metrics.snapshot(1050)).toMatchObject({
      gestureActive: false,
      sampleCount: 2,
      cutCount: 1,
      firstCutLatencyMs: 32,
      lastCutAgeMs: 18,
      lastCutBatchCount: 1,
      lastCutWasReleaseSample: false,
      lastCutWasCorrection: false,
      lastGestureSampleCount: 2,
      lastGestureCutCount: 1,
      resolveCommitCount: 0
    });
  });

  it("tracks release-sample cuts and no-cut acknowledgements as separate feel evidence", () => {
    const metrics = new InputFeelMetricsSystem();

    metrics.startRound();
    metrics.recordSample(2000);
    metrics.recordCutsAdded({ nowMs: 2012, cutCount: 2, releaseSample: true });
    metrics.recordNoCutAcknowledgement("near-slot");
    metrics.recordNoCutAcknowledgement("no-slot");
    metrics.endGesture();

    expect(metrics.snapshot(2040)).toMatchObject({
      gestureActive: false,
      sampleCount: 1,
      cutCount: 2,
      firstCutLatencyMs: 12,
      lastCutAgeMs: 28,
      lastCutBatchCount: 2,
      lastCutWasReleaseSample: true,
      lastCutWasCorrection: false,
      releaseSampleCutCount: 2,
      noCutAcknowledgementCount: 2,
      nearSlotNoCutAcknowledgementCount: 1,
      noSlotAcknowledgementCount: 1,
      lastGestureSampleCount: 1,
      lastGestureCutCount: 2
    });
  });

  it("classifies omitted no-cut reasons as true no-slot misses for legacy callers", () => {
    const metrics = new InputFeelMetricsSystem();

    metrics.startRound();
    metrics.recordNoCutAcknowledgement();

    expect(metrics.snapshot(100)).toMatchObject({
      noCutAcknowledgementCount: 1,
      nearSlotNoCutAcknowledgementCount: 0,
      noSlotAcknowledgementCount: 1
    });
  });

  it("records resolve commit delay after the first and latest cuts", () => {
    const metrics = new InputFeelMetricsSystem();

    metrics.startRound();
    metrics.recordSample(1000);
    metrics.recordCutsAdded({ nowMs: 1032, cutCount: 1 });
    metrics.recordCutsAdded({ nowMs: 1100, cutCount: 1 });
    metrics.recordResolveCommit(1250);

    expect(metrics.snapshot(1250)).toMatchObject({
      resolveCommitCount: 1,
      resolveAfterFirstCutMs: 218,
      resolveAfterLastCutMs: 150
    });
  });

  it("tracks same-gesture correction cuts as response evidence without changing counts", () => {
    const metrics = new InputFeelMetricsSystem();

    metrics.startRound();
    metrics.recordSample(3000);
    metrics.recordCutsAdded({ nowMs: 3018, cutCount: 1, correction: true });

    expect(metrics.snapshot(3030)).toMatchObject({
      gestureActive: true,
      sampleCount: 1,
      cutCount: 1,
      firstCutLatencyMs: 18,
      lastCutAgeMs: 12,
      lastCutBatchCount: 1,
      lastCutWasReleaseSample: false,
      lastCutWasCorrection: true,
      releaseSampleCutCount: 0,
      correctionCutCount: 1
    });

    metrics.recordCutsAdded({ nowMs: 3060, cutCount: 1 });

    expect(metrics.snapshot(3070)).toMatchObject({
      cutCount: 2,
      lastCutAgeMs: 10,
      lastCutBatchCount: 1,
      lastCutWasCorrection: false,
      correctionCutCount: 1
    });
  });

  it("keeps final gesture ownership separate from intermediate correction churn", () => {
    const metrics = new InputFeelMetricsSystem();

    metrics.startRound();
    metrics.recordSample(3200);
    metrics.recordCutsAdded({ nowMs: 3210, cutCount: 1, gestureCutCount: 1 });
    metrics.recordCutsAdded({ nowMs: 3230, cutCount: 1, gestureCutCount: 1, correction: true });
    metrics.recordCutsAdded({ nowMs: 3250, cutCount: 2, gestureCutCount: 3 });
    metrics.endGesture();

    expect(metrics.snapshot(3260)).toMatchObject({
      gestureActive: false,
      cutCount: 4,
      lastCutBatchCount: 2,
      correctionCutCount: 1,
      lastGestureCutCount: 3
    });
  });

  it("tracks touch loupe clearance as occlusion evidence without changing cut counts", () => {
    const metrics = new InputFeelMetricsSystem();

    metrics.startRound();
    metrics.recordSample(4000);
    metrics.recordTouchAimLoupe({
      visible: true,
      snapReady: false,
      pointerClearancePx: 46,
      occlusionSafe: true
    });
    metrics.recordTouchAimLoupe({
      visible: true,
      snapReady: true,
      pointerClearancePx: 28,
      occlusionSafe: false
    });
    metrics.recordTouchAimLoupe({ visible: false });
    metrics.recordCutsAdded({ nowMs: 4040, cutCount: 1 });

    expect(metrics.snapshot(4050)).toMatchObject({
      sampleCount: 1,
      cutCount: 1,
      touchAimLoupeSampleCount: 2,
      touchAimLoupeSnapReadyCount: 1,
      touchAimLoupeUnsafeClearanceCount: 1,
      touchAimLoupeMinClearancePx: 28
    });
  });

  it("records no-cut resolve commits without inventing cut delay", () => {
    const metrics = new InputFeelMetricsSystem();

    metrics.startRound();
    metrics.recordSample(500);
    metrics.recordResolveCommit(720);

    expect(metrics.snapshot(720)).toMatchObject({
      gestureActive: true,
      sampleCount: 1,
      cutCount: 0,
      resolveCommitCount: 1,
      resolveAfterFirstCutMs: null,
      resolveAfterLastCutMs: null
    });
  });

  it("resets between rounds", () => {
    const metrics = new InputFeelMetricsSystem();

    metrics.recordSample(100);
    metrics.recordCutsAdded({ nowMs: 110, cutCount: 1 });
    metrics.recordResolveCommit(150);
    metrics.recordNoCutAcknowledgement();
    metrics.endGesture();
    metrics.startRound();

    expect(metrics.snapshot(200)).toEqual({
      gestureActive: false,
      sampleCount: 0,
      cutCount: 0,
      firstCutLatencyMs: null,
      lastCutAgeMs: null,
      lastCutBatchCount: 0,
      lastCutWasReleaseSample: false,
      lastCutWasCorrection: false,
      releaseSampleCutCount: 0,
      noCutAcknowledgementCount: 0,
      nearSlotNoCutAcknowledgementCount: 0,
      noSlotAcknowledgementCount: 0,
      lastGestureSampleCount: 0,
      lastGestureCutCount: 0,
      resolveCommitCount: 0,
      resolveAfterFirstCutMs: null,
      resolveAfterLastCutMs: null,
      correctionCutCount: 0,
      touchAimLoupeSampleCount: 0,
      touchAimLoupeSnapReadyCount: 0,
      touchAimLoupeUnsafeClearanceCount: 0,
      touchAimLoupeMinClearancePx: null
    });
  });
});
