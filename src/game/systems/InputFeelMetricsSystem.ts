import type { NoCutFeedbackReason } from "./ActiveCutFeedbackSystem";

export interface InputFeelMetricsSnapshot {
  gestureActive: boolean;
  sampleCount: number;
  cutCount: number;
  firstCutLatencyMs: number | null;
  lastCutAgeMs: number | null;
  lastCutBatchCount: number;
  lastCutWasReleaseSample: boolean;
  lastCutWasCorrection: boolean;
  releaseSampleCutCount: number;
  noCutAcknowledgementCount: number;
  nearSlotNoCutAcknowledgementCount: number;
  noSlotAcknowledgementCount: number;
  lastGestureSampleCount: number;
  lastGestureCutCount: number;
  resolveCommitCount: number;
  resolveAfterFirstCutMs: number | null;
  resolveAfterLastCutMs: number | null;
  correctionCutCount: number;
  touchAimLoupeSampleCount: number;
  touchAimLoupeSnapReadyCount: number;
  touchAimLoupeUnsafeClearanceCount: number;
  touchAimLoupeMinClearancePx: number | null;
}

export interface InputFeelCutEvent {
  nowMs: number;
  cutCount: number;
  gestureCutCount?: number;
  releaseSample?: boolean;
  correction?: boolean;
}

export interface InputFeelTouchAimLoupeEvent {
  visible: boolean;
  snapReady?: boolean;
  pointerClearancePx?: number | null;
  occlusionSafe?: boolean;
}

export class InputFeelMetricsSystem {
  private gestureStartedAt?: number;
  private currentGestureSampleCount = 0;
  private currentGestureCutCount = 0;
  private firstCutAtMs: number | null = null;
  private firstCutLatencyMs: number | null = null;
  private lastCutAtMs: number | null = null;
  private lastCutBatchCount = 0;
  private lastCutWasReleaseSample = false;
  private lastCutWasCorrection = false;
  private sampleCount = 0;
  private cutCount = 0;
  private releaseSampleCutCount = 0;
  private noCutAcknowledgementCount = 0;
  private nearSlotNoCutAcknowledgementCount = 0;
  private noSlotAcknowledgementCount = 0;
  private lastGestureSampleCount = 0;
  private lastGestureCutCount = 0;
  private resolveCommitCount = 0;
  private resolveAfterFirstCutMs: number | null = null;
  private resolveAfterLastCutMs: number | null = null;
  private correctionCutCount = 0;
  private touchAimLoupeSampleCount = 0;
  private touchAimLoupeSnapReadyCount = 0;
  private touchAimLoupeUnsafeClearanceCount = 0;
  private touchAimLoupeMinClearancePx: number | null = null;

  startRound(): void {
    this.gestureStartedAt = undefined;
    this.currentGestureSampleCount = 0;
    this.currentGestureCutCount = 0;
    this.firstCutAtMs = null;
    this.firstCutLatencyMs = null;
    this.lastCutAtMs = null;
    this.lastCutBatchCount = 0;
    this.lastCutWasReleaseSample = false;
    this.lastCutWasCorrection = false;
    this.sampleCount = 0;
    this.cutCount = 0;
    this.releaseSampleCutCount = 0;
    this.noCutAcknowledgementCount = 0;
    this.nearSlotNoCutAcknowledgementCount = 0;
    this.noSlotAcknowledgementCount = 0;
    this.lastGestureSampleCount = 0;
    this.lastGestureCutCount = 0;
    this.resolveCommitCount = 0;
    this.resolveAfterFirstCutMs = null;
    this.resolveAfterLastCutMs = null;
    this.correctionCutCount = 0;
    this.touchAimLoupeSampleCount = 0;
    this.touchAimLoupeSnapReadyCount = 0;
    this.touchAimLoupeUnsafeClearanceCount = 0;
    this.touchAimLoupeMinClearancePx = null;
  }

  recordSample(nowMs: number): void {
    if (this.gestureStartedAt === undefined) {
      this.gestureStartedAt = normalizedTime(nowMs);
      this.currentGestureSampleCount = 0;
      this.currentGestureCutCount = 0;
    }

    this.sampleCount += 1;
    this.currentGestureSampleCount += 1;
  }

  recordCutsAdded(input: InputFeelCutEvent): void {
    const normalizedCutCount = normalizedCount(input.cutCount);
    if (normalizedCutCount <= 0) {
      return;
    }

    const now = normalizedTime(input.nowMs);
    if (this.gestureStartedAt === undefined) {
      this.gestureStartedAt = now;
    }

    if (this.firstCutLatencyMs === null) {
      this.firstCutLatencyMs = Math.max(0, Math.round(now - this.gestureStartedAt));
      this.firstCutAtMs = now;
    }

    this.lastCutAtMs = now;
    this.lastCutBatchCount = normalizedCutCount;
    this.lastCutWasReleaseSample = input.releaseSample === true;
    this.lastCutWasCorrection = input.correction === true;
    this.cutCount += normalizedCutCount;
    const gestureCutCount = normalizedOptionalCount(input.gestureCutCount);
    this.currentGestureCutCount = gestureCutCount ?? this.currentGestureCutCount + normalizedCutCount;
    if (input.releaseSample === true) {
      this.releaseSampleCutCount += normalizedCutCount;
    }
    if (input.correction === true) {
      this.correctionCutCount += normalizedCutCount;
    }
  }

  recordNoCutAcknowledgement(reason: NoCutFeedbackReason = "no-slot"): void {
    this.noCutAcknowledgementCount += 1;
    if (reason === "near-slot") {
      this.nearSlotNoCutAcknowledgementCount += 1;
      return;
    }

    this.noSlotAcknowledgementCount += 1;
  }

  recordTouchAimLoupe(input: InputFeelTouchAimLoupeEvent): void {
    if (!input.visible) {
      return;
    }

    this.touchAimLoupeSampleCount += 1;
    if (input.snapReady === true) {
      this.touchAimLoupeSnapReadyCount += 1;
    }
    if (input.occlusionSafe === false) {
      this.touchAimLoupeUnsafeClearanceCount += 1;
    }

    const clearance = normalizedNullableCount(input.pointerClearancePx);
    if (clearance === null) {
      return;
    }

    this.touchAimLoupeMinClearancePx = this.touchAimLoupeMinClearancePx === null
      ? clearance
      : Math.min(this.touchAimLoupeMinClearancePx, clearance);
  }

  recordResolveCommit(nowMs: number): void {
    const now = normalizedTime(nowMs);
    this.resolveCommitCount += 1;
    this.resolveAfterFirstCutMs = this.firstCutAtMs === null
      ? null
      : Math.max(0, Math.round(now - this.firstCutAtMs));
    this.resolveAfterLastCutMs = this.lastCutAtMs === null
      ? null
      : Math.max(0, Math.round(now - this.lastCutAtMs));
  }

  endGesture(): void {
    if (this.gestureStartedAt === undefined) {
      return;
    }

    this.lastGestureSampleCount = this.currentGestureSampleCount;
    this.lastGestureCutCount = this.currentGestureCutCount;
    this.gestureStartedAt = undefined;
    this.currentGestureSampleCount = 0;
    this.currentGestureCutCount = 0;
  }

  snapshot(nowMs: number): InputFeelMetricsSnapshot {
    const now = normalizedTime(nowMs);
    return {
      gestureActive: this.gestureStartedAt !== undefined,
      sampleCount: this.sampleCount,
      cutCount: this.cutCount,
      firstCutLatencyMs: this.firstCutLatencyMs,
      lastCutAgeMs: this.lastCutAtMs === null ? null : Math.max(0, Math.round(now - this.lastCutAtMs)),
      lastCutBatchCount: this.lastCutBatchCount,
      lastCutWasReleaseSample: this.lastCutWasReleaseSample,
      lastCutWasCorrection: this.lastCutWasCorrection,
      releaseSampleCutCount: this.releaseSampleCutCount,
      noCutAcknowledgementCount: this.noCutAcknowledgementCount,
      nearSlotNoCutAcknowledgementCount: this.nearSlotNoCutAcknowledgementCount,
      noSlotAcknowledgementCount: this.noSlotAcknowledgementCount,
      lastGestureSampleCount: this.lastGestureSampleCount,
      lastGestureCutCount: this.lastGestureCutCount,
      resolveCommitCount: this.resolveCommitCount,
      resolveAfterFirstCutMs: this.resolveAfterFirstCutMs,
      resolveAfterLastCutMs: this.resolveAfterLastCutMs,
      correctionCutCount: this.correctionCutCount,
      touchAimLoupeSampleCount: this.touchAimLoupeSampleCount,
      touchAimLoupeSnapReadyCount: this.touchAimLoupeSnapReadyCount,
      touchAimLoupeUnsafeClearanceCount: this.touchAimLoupeUnsafeClearanceCount,
      touchAimLoupeMinClearancePx: this.touchAimLoupeMinClearancePx
    };
  }
}

function normalizedCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function normalizedOptionalCount(value: number | undefined): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.floor(value ?? 0));
}

function normalizedTime(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function normalizedNullableCount(value: number | null | undefined): number | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.floor(value ?? 0));
}
