import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

function applyPointerCutSampleMethod(source: string): string {
  return source.match(
    /private applyPointerCutSample\(point: Point, options: \{ releaseSample\?: boolean \} = \{\}\): void \{[\s\S]+?\n  \}/
  )?.[0] ?? "";
}

function writePlayQaSnapshotMethod(source: string): string {
  return source.match(
    /private writePlayQaSnapshot\(options: PlayQaSnapshotOptions = \{\}\): void \{[\s\S]+?\n  \}/
  )?.[0] ?? "";
}

describe("PlayScene input lifecycle", () => {
  it("clears active swipe gesture state when mobile browsers end input outside the canvas", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");

    expect(source).toContain('this.input.on("pointerup", this.handlePointerGestureEnd, this);');
    expect(source).toContain('this.input.on("pointerupoutside", this.handlePointerGestureEnd, this);');
    expect(source).toContain('this.input.on("gameout", this.handlePointerGestureEnd, this);');
    expect(source).toContain('this.input.off("pointerup", this.handlePointerGestureEnd, this);');
    expect(source).toContain('this.input.off("pointerupoutside", this.handlePointerGestureEnd, this);');
    expect(source).toContain('this.input.off("gameout", this.handlePointerGestureEnd, this);');
  });

  it("samples the final pointer-up position before clearing a swipe gesture", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const pointerMethod = source.match(/private handlePointer\(pointer: Phaser\.Input\.Pointer\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const endMethod = source.match(/private handlePointerGestureEnd\(pointer\?: Phaser\.Input\.Pointer\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(pointerMethod).toContain("this.applyPointerCutSample(point);");
    expect(endMethod).toContain("if (!this.resolving && this.currentFixture && this.lastPointerPoint && pointer) {");
    expect(endMethod).toContain("const observedModality = inputModalityFromPointer(pointer);");
    expect(endMethod).toContain("this.inputModality = mergeInputModality(this.inputModality, observedModality);");
    expect(endMethod).toContain('this.applyPointerCutSample({ x: pointer.x, y: pointer.y }, { releaseSample: true });');
    expect(endMethod.indexOf('this.applyPointerCutSample({ x: pointer.x, y: pointer.y }, { releaseSample: true });')).toBeLessThan(
      endMethod.indexOf("const releasePoint = this.lastPointerPoint;")
    );
    expect(endMethod.indexOf("this.lastPointerPoint = this.cutInput.endGesture();")).toBeGreaterThan(
      endMethod.indexOf('this.applyPointerCutSample({ x: pointer.x, y: pointer.y }, { releaseSample: true });')
    );
  });

  it("records input-feel metrics from samples, release cuts, and no-cut acknowledgements", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);
    const endMethod = source.match(/private handlePointerGestureEnd\(pointer\?: Phaser\.Input\.Pointer\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);
    const traceMethod = source.match(/private recordRoundTrace\(fixture: TokenFixture, score: RoundScoreResult\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaSystemSource = readRepoFile("src/game/systems/PlaySceneQaSystem.ts");

    expect(source).toContain("private readonly inputFeelMetrics = new InputFeelMetricsSystem();");
    expect(source).toContain("this.inputFeelMetrics.startRound();");
    expect(sampleMethod).toContain("this.inputFeelMetrics.recordSample(this.baseNowMs());");
    expect(sampleMethod).toContain("this.inputFeelMetrics.recordCutsAdded({");
    expect(sampleMethod).toContain("cutCount: responseCutCount");
    expect(sampleMethod).toContain("gestureCutCount: this.gestureAddedCuts.size");
    expect(sampleMethod).toContain("releaseSample: options.releaseSample");
    expect(endMethod).toContain("this.inputFeelMetrics.recordNoCutAcknowledgement(noCutFeedbackReason(noCutPreview !== undefined));");
    expect(endMethod).toContain("this.inputFeelMetrics.endGesture();");
    expect(endMethod).toContain("this.renderInputResponseBadge(this.inputFeelMetrics.snapshot(this.baseNowMs()));");
    expect(endMethod.indexOf("this.renderInputResponseBadge(this.inputFeelMetrics.snapshot(this.baseNowMs()));")).toBeGreaterThan(
      endMethod.indexOf("this.inputFeelMetrics.endGesture();")
    );
    expect(qaMethod).toContain("const inputFeel = this.inputFeelMetrics.snapshot(this.baseNowMs());");
    expect(qaMethod).toContain("inputFeel,");
    expect(qaSystemSource).toContain("inputFeelCorrectionCutCount");
    expect(qaSystemSource).toContain("inputFeelTouchAimLoupeMinClearancePx");
    expect(traceMethod).toContain("const inputFeel = this.inputFeelMetrics.snapshot(this.baseNowMs());");
    expect(traceMethod).toContain("firstCutLatencyMs: inputFeel.firstCutLatencyMs");
    expect(traceMethod).toContain("resolveAfterFirstCutMs: inputFeel.resolveAfterFirstCutMs");
    expect(traceMethod).toContain("resolveAfterLastCutMs: inputFeel.resolveAfterLastCutMs");
    expect(traceMethod).toContain("lastCutWasReleaseSample: inputFeel.lastCutWasReleaseSample");
    expect(traceMethod).toContain("lastCutWasCorrection: inputFeel.lastCutWasCorrection");
    expect(traceMethod).toContain("releaseSampleCutCount: inputFeel.releaseSampleCutCount");
    expect(traceMethod).toContain("correctionCutCount: inputFeel.correctionCutCount");
    expect(traceMethod).toContain("lastGestureSampleCount: inputFeel.lastGestureSampleCount");
    expect(traceMethod).toContain("lastGestureCutCount: inputFeel.lastGestureCutCount");
    expect(traceMethod).toContain("resolveCommitCount: inputFeel.resolveCommitCount");
    expect(traceMethod).toContain("noCutAcknowledgementCount: inputFeel.noCutAcknowledgementCount");
    expect(traceMethod).toContain("nearSlotNoCutAcknowledgementCount: inputFeel.nearSlotNoCutAcknowledgementCount");
    expect(traceMethod).toContain("noSlotAcknowledgementCount: inputFeel.noSlotAcknowledgementCount");
    expect(traceMethod).toContain("touchAimLoupeSampleCount: inputFeel.touchAimLoupeSampleCount");
    expect(traceMethod).toContain("touchAimLoupeMinClearancePx: inputFeel.touchAimLoupeMinClearancePx");
    expect(sampleMethod).not.toContain("this.scoring.scoreRound");

    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    expect(resolveMethod).toContain("this.inputFeelMetrics.recordResolveCommit(this.baseNowMs());");
    expect(resolveMethod.indexOf("this.inputFeelMetrics.recordResolveCommit(this.baseNowMs());")).toBeGreaterThan(
      resolveMethod.indexOf("this.lastPointerPoint = this.cutInput.endGesture();")
    );
    expect(resolveMethod.indexOf("this.inputFeelMetrics.recordResolveCommit(this.baseNowMs());")).toBeLessThan(
      resolveMethod.indexOf("this.inputFeelMetrics.endGesture();")
    );
  });

  it("updates temporary input-response badges during active frames so they decay and expire", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const updateMethod = source.match(/  update\(time: number\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const updateBadgeMethod = source.match(/private updateInputResponseBadge\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const renderBadgeMethod = source.match(/private renderInputResponseBadge\(inputFeel: InputFeelMetricsSnapshot\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);

    expect(updateMethod).toContain("this.updateInputResponseBadge();");
    expect(updateMethod.indexOf("this.updateInputResponseBadge();")).toBeGreaterThan(
      updateMethod.indexOf("this.updateResolveReadyPulse();")
    );
    expect(updateBadgeMethod).toContain("if (!this.inputResponseBadgeText.visible) {");
    expect(updateBadgeMethod).toContain("this.renderInputResponseBadge(this.inputFeelMetrics.snapshot(this.baseNowMs()));");
    expect(updateBadgeMethod).toContain("if (!this.inputResponseBadgeText.visible) {");
    expect(updateBadgeMethod).toContain("this.writePlayQaSnapshot();");
    expect(renderBadgeMethod).toContain("inputResponseBadgeState(inputFeel, this.compactLayout)");
    expect(renderBadgeMethod).toContain("this.clearInputResponseBadge();");
    expect(qaMethod).toContain("inputResponseBadgeText: this.inputResponseBadgeText.visible ? this.inputResponseBadgeText.text : undefined");
    expect(qaMethod).toContain("inputResponseBadgeTone: this.inputResponseBadgeText.visible ? this.inputResponseBadgeTone : undefined");
    expect(qaMethod).toContain("inputResponseBadgeRect: this.inputResponseBadgeText.visible ? this.inputResponseBadgeRect : undefined");
  });

  it("uses renderer-backed QA capture for transient input-response feedback", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const captureDecisionMethod = source.match(/private shouldUseRendererQaCapture\(\): boolean \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const transientMethod = source.match(/private hasTransientRendererQaFeedback\(\): boolean \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const signatureMethod = source.match(/private rendererQaCaptureSignature\(snapshot: GameQaSnapshot\): string \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);

    expect(captureDecisionMethod).toContain("if (!import.meta.env.DEV) {");
    expect(captureDecisionMethod).toContain("const frozenMotionCapture =");
    expect(captureDecisionMethod).toContain("return frozenMotionCapture || this.hasTransientRendererQaFeedback();");
    expect(transientMethod).toContain("this.inputResponseBadgeText?.visible === true");
    expect(transientMethod).toContain("this.cutCorrectionFeedbackRect !== undefined");
    expect(transientMethod).toContain("this.chainSwipeFeedbackRect !== undefined");
    expect(transientMethod).toContain("this.noCutFeedbackText?.visible === true");
    expect(transientMethod).toContain("this.textCutImpactGhost?.active === true");
    expect(transientMethod).toContain("this.clearCutFeedbackRect !== undefined");
    expect(transientMethod).toContain("this.resolveCommitGraphics?.visible === true");
    expect(transientMethod).toContain("this.currentHudImpactState(this.nowMs()).active");
    expect(transientMethod).toContain("this.promptAcquisitionText?.visible === true");
    expect(signatureMethod).toContain("snapshot.state?.inputResponseBadgeText");
    expect(signatureMethod).toContain("snapshot.state?.inputResponseBadgeTone");
    expect(signatureMethod).toContain("snapshot.state?.promptAcquisitionActive");
    expect(signatureMethod).toContain("snapshot.state?.promptAcquisitionProgress");
    expect(signatureMethod).toContain("snapshot.state?.cutCorrectionFeedbackActive");
    expect(signatureMethod).toContain("snapshot.state?.chainSwipeFeedbackActive");
    expect(signatureMethod).toContain("snapshot.state?.noCutFeedbackActive");
    expect(signatureMethod).toContain("snapshot.state?.textCutImpactActive");
    expect(signatureMethod).toContain("snapshot.state?.hudImpactDeltaText");
    expect(qaMethod).toContain("rendererQaCapture: useRendererCapture");
    expect(qaMethod).toContain("const captureCanvas = options.captureCanvas === true || this.qaControls.canvasCapture === true;");
    expect(qaMethod).toContain("writeGameQaSnapshot(snapshot, { captureCanvas: captureCanvas && !useRendererCapture });");
    expect(qaMethod).toContain("if (captureCanvas && useRendererCapture)");
  });

  it("keeps active pointer sampling cheap by reusing slots and avoiding per-preview QA writes", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);
    const previewMethod = source.match(
      /private renderArmedCutPreview\(point: Point, options: \{ trackGesturePreview\?: boolean; slots\?: BoundarySlot\[\] \} = \{\}\): void \{[\s\S]+?\n  \}/
    )?.[0] ?? "";

    expect(source).toContain("const POINTER_SAMPLE_MIN_DISTANCE_PX = 1.75;");
    expect(sampleMethod).toContain("distanceSquared(point, this.lastPointerPoint) < POINTER_SAMPLE_MIN_DISTANCE_PX ** 2");
    expect(sampleMethod).toContain("const showSlotHints = this.shouldShowSlotHints();");
    expect(sampleMethod).toContain("const slots = this.swipe.buildPlayableSlots(bounds, this.currentFixture.text, showSlotHints);");
    expect(sampleMethod).toContain("hinted: showSlotHints,");
    expect(sampleMethod).toContain("playableSlots: slots");
    expect(sampleMethod).toContain("this.renderArmedCutPreview(point, { slots });");
    expect(previewMethod).toContain("const slots = options.slots ?? this.swipe.buildPlayableSlots");
    expect(previewMethod).not.toContain("this.writePlayQaSnapshot();");
  });

  it("plays a prompt acquisition beat on each new round and clears it before review or exit", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const startRoundMethod = source.match(/private startRound\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const updateMethod = source.match(/  update\(time: number\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const startBeatMethod = source.match(/private startPromptAcquisitionBeat\(time: number\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const updateBeatMethod = source.match(/private updatePromptAcquisitionBeat\(time: number\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const drawBeatMethod = source.match(/private drawPromptAcquisitionBeat\(time: number\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearBeatMethod = source.match(/private clearPromptAcquisitionBeat\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const applyPointerCutSampleMethod = source.match(/private applyPointerCutSample\(point: Point[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);
    const qaSystemSource = readRepoFile("src/game/systems/PlaySceneQaSystem.ts");

    expect(source).toContain("PromptAcquisitionSystem");
    expect(source).toContain("private promptAcquisitionGraphics!");
    expect(source).toContain("private promptAcquisitionStartedAt?: number;");
    expect(startRoundMethod.indexOf("this.clearPromptAcquisitionBeat();")).toBeLessThan(
      startRoundMethod.indexOf("this.startPromptAcquisitionBeat(startedAt);")
    );
    expect(startRoundMethod.indexOf("this.updateSentenceMotion(now);")).toBeLessThan(
      startRoundMethod.indexOf("this.startPromptAcquisitionBeat(startedAt);")
    );
    expect(updateMethod).toContain("this.updatePromptAcquisitionBeat(now);");
    expect(startBeatMethod).toContain("this.promptAcquisitionStartedAt = time;");
    expect(startBeatMethod).toContain("this.drawPromptAcquisitionBeat(time);");
    expect(startBeatMethod).toContain("this.writePlayQaSnapshot();");
    expect(updateBeatMethod).toContain("this.drawPromptAcquisitionBeat(time);");
    expect(drawBeatMethod).toContain("const state = this.currentPromptAcquisitionState(time);");
    expect(source).toContain("return promptAcquisitionVisualState({");
    expect(drawBeatMethod).toContain("this.clearPromptAcquisitionBeat();");
    expect(drawBeatMethod).toContain("this.writePlayQaSnapshot();");
    expect(drawBeatMethod).toContain("state.labelText");
    expect(clearBeatMethod).toContain("this.promptAcquisitionStartedAt = undefined;");
    expect(clearBeatMethod).toContain("this.promptAcquisitionGraphics?.setVisible(false);");
    expect(clearBeatMethod).toContain("this.promptAcquisitionText?.setVisible(false);");
    expect(applyPointerCutSampleMethod.indexOf("this.clearPromptAcquisitionBeat();")).toBeGreaterThan(
      applyPointerCutSampleMethod.indexOf("this.swipe.pointInsideCutBand(slots, point)")
    );
    expect(applyPointerCutSampleMethod.indexOf("this.clearPromptAcquisitionBeat();")).toBeLessThan(
      applyPointerCutSampleMethod.indexOf("this.addTrailPoint(point.x, point.y);")
    );
    expect(resolveMethod).toContain("this.clearPromptAcquisitionBeat();");
    expect(qaMethod).toContain("promptAcquisitionActive: promptAcquisitionState.active");
    expect(qaMethod).toContain("promptAcquisitionProgress: promptAcquisitionState.progress");
    expect(qaMethod).toContain("promptAcquisitionText: this.promptAcquisitionText.visible ? this.promptAcquisitionText.text : undefined");
    expect(qaSystemSource).toContain("promptAcquisitionActive");
    expect(qaSystemSource).toContain('id: "promptAcquisition"');
    expect(startBeatMethod).not.toContain("this.scoring.scoreRound");
    expect(drawBeatMethod).not.toContain("this.scoring.scoreRound");
    expect(drawBeatMethod).not.toContain("this.setRobotComment");
  });

  it("pauses active round timing on browser focus loss without changing scoring or speech", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const pauseMethod = source.match(/private pauseActiveRoundForFocusLoss\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const resumeMethod = source.match(/private resumeActiveRoundAfterFocusReturn\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const cancelMethod = source.match(/private cancelTransientGestureStateForFocusLoss\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const startRoundMethod = source.match(/private startRound\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const shutdownMethod = source.match(/private shutdownScene\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(source).toContain("private focusPauseRequested = false;");
    expect(source).toContain('globalThis.document?.addEventListener("visibilitychange", this.handleVisibilityChange);');
    expect(source).toContain('this.browserWindow()?.addEventListener("blur", this.handleWindowBlur);');
    expect(source).toContain('this.browserWindow()?.addEventListener("focus", this.handleWindowFocus);');
    expect(source).toContain('globalThis.document?.removeEventListener("visibilitychange", this.handleVisibilityChange);');
    expect(source).toContain('this.browserWindow()?.removeEventListener("blur", this.handleWindowBlur);');
    expect(source).toContain('this.browserWindow()?.removeEventListener("focus", this.handleWindowFocus);');
    expect(pauseMethod).toContain("this.focusPauseRequested = true;");
    expect(pauseMethod).toContain("this.motion.pause(this.sentenceMotion, now)");
    expect(pauseMethod).toContain("this.cancelTransientGestureStateForFocusLoss();");
    expect(pauseMethod).toContain("this.updateHud(now);");
    expect(pauseMethod).toContain("this.updateTimerVisual(now);");
    expect(pauseMethod).toContain("this.writePlayQaSnapshot();");
    expect(resumeMethod).toContain("this.focusPauseRequested = false;");
    expect(resumeMethod).toContain("this.motion.resume(this.sentenceMotion, now)");
    expect(startRoundMethod).toContain("this.focusPauseRequested = globalThis.document?.hidden ?? false;");
    expect(startRoundMethod).toContain("this.pauseActiveRoundForFocusLoss();");
    expect(cancelMethod).toContain("this.cutInput.endGesture();");
    expect(cancelMethod).toContain("this.lastPointerPoint = undefined;");
    expect(cancelMethod).toContain("this.gestureAddedCuts.clear();");
    expect(cancelMethod).toContain("this.gestureReleaseSampleCuts.clear();");
    expect(cancelMethod).toContain("this.gestureTouchedExistingCuts.clear();");
    expect(cancelMethod).toContain("this.clearTrail();");
    expect(cancelMethod).not.toContain("this.currentCuts = []");
    expect(pauseMethod).not.toContain("this.scoring.scoreRound");
    expect(pauseMethod).not.toContain("this.setRobotComment");
    expect(resumeMethod).not.toContain("this.scoring.scoreRound");
    expect(resumeMethod).not.toContain("this.setRobotComment");
    expect(shutdownMethod.indexOf("this.unregisterFocusPauseListeners();")).toBeGreaterThan(-1);
    expect(shutdownMethod.indexOf("this.focusPauseRequested = false;")).toBeGreaterThan(
      shutdownMethod.indexOf("this.unregisterFocusPauseListeners();")
    );
  });

  it("keeps transient swipe trails out of review evidence", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(resolveMethod.indexOf("this.resolving = true;")).toBeGreaterThan(-1);
    expect(resolveMethod.indexOf("this.lastPointerPoint = this.cutInput.endGesture();")).toBeGreaterThan(
      resolveMethod.indexOf("this.resolving = true;")
    );
    expect(resolveMethod.indexOf("this.hideActiveTrail();")).toBeGreaterThan(
      resolveMethod.indexOf("this.lastPointerPoint = this.cutInput.endGesture();")
    );
    expect(source).toContain("if (this.resolving) {\n      this.hideActiveTrail();\n      return;\n    }\n\n    this.trailFadeTween?.stop();");
    expect(source).toContain("this.trailPoints = appendTrailPoint");
    expect(source).toContain("duration: SWIPE_TRAIL_FADE_MS");
    expect(source).toContain("this.clearTrail();\n    this.trailGraphics?.setVisible(false);");
    const startRoundMethod = source.match(/private startRound\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    expect(startRoundMethod.indexOf("this.currentCuts = [];")).toBeGreaterThan(-1);
    expect(startRoundMethod.indexOf("this.resolving = false;")).toBeGreaterThan(
      startRoundMethod.indexOf("this.currentCuts = [];")
    );
    expect(startRoundMethod.indexOf("this.showActiveTrail();")).toBeGreaterThan(
      startRoundMethod.indexOf("this.resolving = false;")
    );
  });

  it("stages review evidence before feedback and tutorial advancement", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(resolveMethod).toContain("this.hideRobotToast();");
    expect(resolveMethod).toContain("const reviewSequence = reviewPanelSequence({");
    expect(resolveMethod).toContain("const pendingReviewReveal: PendingReviewReveal = {");
    expect(resolveMethod).toContain("this.pendingReviewReveal = pendingReviewReveal;");
    expect(resolveMethod).toContain("this.scheduleReviewReveal(reviewSequence.evidenceDelayMs");
    expect(resolveMethod).toContain("this.revealReviewEvidence(pendingReviewReveal);");
    expect(resolveMethod).toContain("this.scheduleReviewReveal(Math.max(reviewSequence.feedbackDelayMs, reviewSequence.speechDelayMs)");
    expect(resolveMethod).toContain("this.revealReviewFeedback(pendingReviewReveal);");
    expect(resolveMethod).toContain("this.time.delayedCall(reviewSequence.reviewDelayMs");
  });

  it("services pending review reveals during resolving frames so compact review cannot stall hidden", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const updateMethod = source.match(/update\(time: number\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const fallbackMethod = source.match(/private updatePendingReviewReveal\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const evidenceMethod = source.match(/private revealReviewEvidence\(pending: PendingReviewReveal\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const feedbackMethod = source.match(/private revealReviewFeedback\(pending: PendingReviewReveal\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(source).toContain("interface PendingReviewReveal");
    expect(source).toContain("private pendingReviewReveal?: PendingReviewReveal;");
    expect(updateMethod).toContain("if (this.resolving) {\n      this.updatePendingReviewReveal();\n      this.updateSegmentationEvidenceReveal();\n      this.updateTutorialReviewReady();\n      return;\n    }");
    expect(fallbackMethod).toContain("now >= pending.evidenceAtMs");
    expect(fallbackMethod).toContain("this.revealReviewEvidence(pending);");
    expect(fallbackMethod).toContain("now >= pending.feedbackAtMs");
    expect(fallbackMethod).toContain("this.revealReviewFeedback(pending);");
    expect(evidenceMethod).toContain("this.showTokenStrip(pending.fixture, pending.score);");
    expect(feedbackMethod.indexOf("this.revealReviewEvidence(pending);")).toBeLessThan(
      feedbackMethod.indexOf("this.feedbackCard.show(pending.summary);")
    );
    expect(feedbackMethod.indexOf("this.scheduleTutorialReviewReady();")).toBeLessThan(
      feedbackMethod.indexOf("this.setRobotComment(pending.resolutionLine, {")
    );
    expect(feedbackMethod).toContain("this.pendingReviewReveal = undefined;");
  });

  it("clears stale token-split evidence text before a new active round starts", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const startRoundMethod = source.match(/private startRound\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(startRoundMethod.indexOf("this.tokenStripText.setVisible(false);")).toBeGreaterThan(-1);
    expect(startRoundMethod.indexOf('this.tokenStripText.setText("");')).toBeGreaterThan(
      startRoundMethod.indexOf("this.tokenStripText.setVisible(false);")
    );
    expect(startRoundMethod.indexOf("this.clearSegmentationEvidenceReveal();")).toBeGreaterThan(
      startRoundMethod.indexOf('this.tokenStripText.setText("");')
    );
    expect(startRoundMethod.indexOf("this.tokenEvidenceChrome.clear();")).toBeGreaterThan(
      startRoundMethod.indexOf("this.clearSegmentationEvidenceReveal();")
    );
  });

  it("stores token-split review data hidden while the feedback card owns visible review", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const showTokenStripMethod = source.match(/private showTokenStrip\(fixture: TokenFixture, score\?: RoundScoreResult\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const updateRevealMethod = source.match(/private updateSegmentationEvidenceReveal\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);

    expect(source).toContain("private segmentationEvidenceRevealStartedAt?: number;");
    expect(source).toContain("score: RoundScoreResult;");
    expect(resolveMethod).toContain("score,");
    expect(showTokenStripMethod).toContain("this.tokenStripText.setVisible(false);");
    expect(showTokenStripMethod).toContain("this.segmentationEvidenceRevealStartedAt = undefined;");
    expect(showTokenStripMethod).toContain("this.tokenEvidenceChrome?.clear();");
    expect(showTokenStripMethod).toContain("this.tokenEvidenceRect = undefined;");
    expect(showTokenStripMethod).toContain("submittedCutCount: this.currentCuts.length");
    expect(showTokenStripMethod).toContain("truthBoundaryCount: fixture.boundary_positions.length");
    expect(showTokenStripMethod).toContain("correctCutCount: score?.correctCuts.length");
    expect(showTokenStripMethod).toContain("missedCutCount: score?.missedCuts.length");
    expect(showTokenStripMethod).toContain("falseCutCount: score?.falseCuts.length");
    expect(updateRevealMethod).toContain("this.currentSegmentationEvidenceRevealState();");
    expect(updateRevealMethod).toContain("this.layoutSegmentationEvidence();");
    expect(updateRevealMethod).toContain("this.segmentationEvidenceRevealStartedAt = undefined;");
    expect(qaMethod).toContain("segmentationEvidenceRevealActive: this.currentSegmentationEvidenceRevealState().active");
    expect(qaMethod).toContain("segmentationEvidenceRevealProgress: this.currentSegmentationEvidenceRevealState().progress");
    expect(showTokenStripMethod).not.toContain("this.scoring.scoreRound");
    expect(updateRevealMethod).not.toContain("this.scoring.scoreRound");
  });

  it("keeps falling split pieces below actual-tokenization evidence", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const splitMethod = source.match(/private animateResolvedTextPieces\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(source).toContain("const FALLING_TEXT_PIECE_DEPTH = 7.4;");
    expect(source).toContain("this.tokenEvidenceChrome = this.add.graphics().setDepth(7.8)");
    expect(source).toContain("}).setOrigin(0.5).setDepth(8).setVisible(false);");
    expect(splitMethod).toContain("setDepth(FALLING_TEXT_PIECE_DEPTH)");
    expect(splitMethod).not.toContain("setDepth(15)");
  });

  it("uses the submitted-cut piece plan for resolve fall motion", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const splitMethod = source.match(/private animateResolvedTextPieces\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(splitMethod).toContain("x: piece.x + plan.fallXOffset");
    expect(splitMethod).toContain("angle: plan.rotationDeg");
    expect(splitMethod).toContain("delay: plan.delayMs");
    expect(splitMethod).toContain("duration: plan.durationMs");
    expect(splitMethod).not.toContain("piecePlans.length - 1");
  });

  it("destroys falling split pieces after their visual fall completes", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const splitMethod = source.match(/private animateResolvedTextPieces\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(splitMethod).toContain("onComplete: () => {");
    expect(splitMethod).toContain("this.fallingTextPieces = this.fallingTextPieces.filter");
    expect(splitMethod).toContain("piece.destroy();");
    expect(splitMethod).toContain("this.writePlayQaSnapshot();");
    expect(splitMethod.match(/this\.writePlayQaSnapshot\(\);/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps an unsliced prompt visible when resolution has no submitted cut pieces", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const splitMethod = source.match(/private animateResolvedTextPieces\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(splitMethod.indexOf("const piecePlans = buildSubmittedCutTextPieces")).toBeGreaterThan(-1);
    expect(splitMethod.indexOf("if (piecePlans.length === 0) {")).toBeGreaterThan(
      splitMethod.indexOf("const piecePlans = buildSubmittedCutTextPieces")
    );
    expect(splitMethod.indexOf("this.textObject.setVisible(true);")).toBeGreaterThan(
      splitMethod.indexOf("if (piecePlans.length === 0) {")
    );
    expect(splitMethod).toContain("if (piecePlans.length === 0) {\n      this.textObject.setVisible(true);\n      return;\n    }");
    expect(splitMethod.indexOf("this.textObject.setVisible(false);")).toBeGreaterThan(
      splitMethod.indexOf("if (piecePlans.length === 0) {")
    );
  });

  it("plays cut impact as a disposable ghost after marker geometry is rendered", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);
    const impactMethod = source.match(/private playTextCutImpact\(addedCutCount: number\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(sampleMethod.indexOf("this.renderPlayerCuts();")).toBeGreaterThan(-1);
    expect(sampleMethod.indexOf("this.updateResolveButtonState();")).toBeGreaterThan(
      sampleMethod.indexOf("this.renderPlayerCuts();")
    );
    expect(sampleMethod.indexOf("this.playTextCutImpact(Math.max(1, responseCutCount));")).toBeGreaterThan(
      sampleMethod.indexOf("this.renderPlayerCuts();")
    );
    expect(impactMethod).toContain("const ghost = this.add.text");
    expect(impactMethod).toContain("this.textCutImpactGhost = ghost;");
    expect(impactMethod).toContain("targets: ghost");
    expect(impactMethod).not.toContain("targets: this.textObject");
    expect(resolveMethod).toContain("this.clearTextCutImpact();");
  });

  it("pulses Resolve only when staged cuts first make resolution available", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);
    const startRoundMethod = source.match(/private startRound\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearMethod = source.match(/private clearPlayerCuts\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const applyResolveMethod = source.match(/private applyResolveButtonVisualState\(hovered: boolean, pressed = false\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const updatePulseMethod = source.match(/private updateResolveReadyPulse\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);

    expect(source).toContain("private resolveReadyPulseStartedAt?: number;");
    expect(source).toContain("RESOLVE_READY_PULSE_MS");
    expect(sampleMethod).toContain("const previousCutCount = this.currentCuts.length;");
    expect(sampleMethod).toContain("if (previousCutCount === 0 && this.currentCuts.length > 0) {");
    expect(sampleMethod).toContain("this.startResolveReadyPulse();");
    expect(sampleMethod).toContain("} else if (this.currentCuts.length === 0) {");
    expect(sampleMethod).toContain("this.resolveReadyPulseStartedAt = undefined;");
    expect(startRoundMethod).toContain("this.resolveReadyPulseStartedAt = undefined;");
    expect(resolveMethod.indexOf("this.resolveReadyPulseStartedAt = undefined;")).toBeLessThan(
      resolveMethod.indexOf("this.updateResolveButtonState();")
    );
    expect(clearMethod.indexOf("this.resolveReadyPulseStartedAt = undefined;")).toBeLessThan(
      clearMethod.indexOf("this.updateResolveButtonState();")
    );
    expect(source).toContain("private resolveDeadlinePressureWasActive = false;");
    expect(startRoundMethod).toContain("this.resolveDeadlinePressureWasActive = false;");
    expect(source).toContain("private updateResolveDeadlinePressure(): void");
    expect(source).toContain("private resolveDeadlinePressure(): number");
    expect(source).toContain("this.updateResolveDeadlinePressure();");
    expect(applyResolveMethod).toContain("this.resolveReadyPulseStartedAt === undefined ? undefined : this.baseNowMs() - this.resolveReadyPulseStartedAt");
    expect(applyResolveMethod).toContain("const deadlinePressure = this.resolveDeadlinePressure();");
    expect(applyResolveMethod).toContain("deadlinePressure");
    expect(applyResolveMethod).toContain("this.resolveButton?.setStrokeStyle(state.strokeWidth, state.strokeColor, state.strokeAlpha);");
    expect(updatePulseMethod).toContain("this.baseNowMs() - this.resolveReadyPulseStartedAt >= RESOLVE_READY_PULSE_MS");
    expect(updatePulseMethod).toContain("this.updateResolveButtonState();");
    expect(source).toContain("private resolveButtonActionable(): boolean");
    expect(qaMethod).toContain("resolveButtonActionable: this.resolveButtonActionable()");
    expect(qaMethod).toContain("resolveButtonReady: !this.resolving && this.currentCuts.length > 0");
    expect(qaMethod).toContain("resolveButtonReadyPulse: this.resolveReadyPulseStartedAt === undefined");
    expect(qaMethod).toContain("resolveButtonDeadlinePressure: this.resolveDeadlinePressure()");
  });

  it("renders staged-cut status as an active-play badge and clears it before review evidence", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const startRoundMethod = source.match(/private startRound\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const statusMethod = source.match(/private renderCutStatus\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);

    expect(source).toContain("private cutStatusBadgeGraphics!: Phaser.GameObjects.Graphics;");
    expect(source).toContain("private cutStatusBadgeRect?: GameQaRect;");
    expect(source).toContain("activeCutStatusBadgeStyle(cutCount, this.compactLayout, pulseAge)");
    expect(statusMethod).toContain("this.cutStatusText.setStyle");
    expect(statusMethod).toContain("this.drawCutStatusBadge(style);");
    expect(startRoundMethod).toContain("this.cutStatusBadgeGraphics.clear();");
    expect(startRoundMethod).toContain("this.cutStatusBadgeRect = undefined;");
    expect(resolveMethod.indexOf("this.cutStatusText.setVisible(false);")).toBeGreaterThan(-1);
    expect(resolveMethod.indexOf("this.cutStatusBadgeGraphics.clear();")).toBeGreaterThan(
      resolveMethod.indexOf("this.cutStatusText.setVisible(false);")
    );
    expect(qaMethod).toContain("cutStatusVisible: this.cutStatusText.visible && !this.resolving");
    expect(qaMethod).toContain("cutStatusFontSize: this.gameTextFontSize(this.cutStatusText)");
    expect(qaMethod).toContain("cutStatusRect: this.cutStatusBadgeRect ?? this.qaRectFromBounds(this.cutStatusText.getBounds())");
  });

  it("exposes active and resolved cut-label geometry without a duplicate floating audit badge", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const renderMethod = source.match(/private renderPlayerCuts\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const drawCutsMethod = source.match(/private drawCuts\([\s\S]+?\n  \}/)?.[0] ?? "";
    const clearMarkersMethod = source.match(/private clearCutMarkers\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);

    expect(source).toContain("private resolvedCutLabelRects: Array<{ text: string; rect: GameQaRect }> = [];");
    expect(source).toContain("private resolutionAuditLegendRect?: GameQaRect;");
    expect(source).toContain('private resolutionAuditLegendText = "";');
    expect(renderMethod).toContain("activeCutLabelsHaveRoom(cuts.map((cut) => cut.x), activeCutLabelMinGap(this.compactLayout))");
    expect(qaMethod).toContain("activeCutLabelRects: this.activeCutLabels.map((entry) => ({");
    expect(qaMethod).toContain("text: entry.label.text");
    expect(qaMethod).toContain("rect: this.qaRectFromBounds(entry.label.getBounds())");
    expect(qaMethod).toContain("resolvedCutLabelRects: this.resolvedCutLabelRects");
    expect(qaMethod).toContain("resolutionAuditLegendRect: this.resolutionAuditLegendRect");
    expect(qaMethod).toContain("resolutionAuditLegendText: this.resolutionAuditLegendText");
    expect(source).not.toContain("this.drawResolutionAuditLegend(groups, labelMode);");
    expect(source).not.toContain("private drawResolutionAuditLegend(");
    expect(drawCutsMethod).toContain("this.resolvedCutLabelRects.push({");
    expect(drawCutsMethod).toContain("text: label");
    expect(drawCutsMethod).toContain("rect: this.qaRectFromBounds(tag.getBounds())");
    expect(drawCutsMethod).toContain("this.writePlayQaSnapshot();");
    expect(clearMarkersMethod).toContain("this.resolvedCutLabelRects = [];");
    expect(clearMarkersMethod).toContain("this.resolutionAuditLegendRect = undefined;");
    expect(clearMarkersMethod).toContain('this.resolutionAuditLegendText = "";');
  });

  it("plays a visual release when Clear removes staged cuts without adding speech or scoring side effects", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const clearMethod = source.match(/private clearPlayerCuts\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearFeedbackMethod = source.match(/private playClearCutFeedback\(cuts: number\[\]\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const releaseMethod = source.match(/private playCutReleaseFeedback\(cuts: number\[\], style: ClearCutFeedbackStyle \| null\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(clearMethod.indexOf("this.playClearCutFeedback(this.currentCuts);")).toBeGreaterThan(-1);
    expect(clearMethod).toContain("const clearedCutCount = this.currentCuts.length;");
    expect(clearMethod).toContain('this.haptics.play("clear", this.inputModality);');
    expect(clearMethod.indexOf("this.currentCuts = [];")).toBeGreaterThan(
      clearMethod.indexOf("this.playClearCutFeedback(this.currentCuts);")
    );
    expect(clearMethod).toContain("this.clearActiveCutMarkers();");
    expect(clearMethod.indexOf("this.updateResolveButtonState();")).toBeGreaterThan(
      clearMethod.indexOf("this.currentCuts = [];")
    );
    expect(clearMethod).not.toContain("this.setRobotComment");
    expect(clearMethod).not.toContain("this.scoring.scoreRound");
    expect(clearMethod).toContain('this.audio.play("clear");');
    expect(clearMethod).not.toContain('this.audio.play("ui");');
    expect(clearFeedbackMethod).toContain("const style = clearCutFeedbackStyle(cuts.length, this.compactLayout);");
    expect(clearFeedbackMethod).toContain("this.playCutReleaseFeedback(cuts, style);");
    expect(releaseMethod).toContain("this.clearCutFeedbackRect = {");
    expect(releaseMethod).toContain("targets: this.clearCutFeedbackGraphics");
    expect(releaseMethod).toContain("this.clearCutFeedbackRect = undefined;");
  });

  it("shows a visual release for cuts automatically removed by gesture cleanup without speech or scoring side effects", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);
    const autoReleaseMethod = source.match(/private playAutoRemovedCutFeedback\(cuts: number\[\]\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const releaseMethod = source.match(/private playCutReleaseFeedback\(cuts: number\[\], style: ClearCutFeedbackStyle \| null\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(source).toContain("autoReleaseCutFeedbackStyle");
    expect(sampleMethod.indexOf("this.forgetActiveCutPulses(result.removedCuts);")).toBeGreaterThan(-1);
    expect(sampleMethod.indexOf("this.playAutoRemovedCutFeedback(feedbackRemovedCuts);")).toBeGreaterThan(
      sampleMethod.indexOf("this.forgetActiveCutPulses(result.removedCuts);")
    );
    expect(sampleMethod.indexOf("this.playAutoRemovedCutFeedback(feedbackRemovedCuts);")).toBeLessThan(
      sampleMethod.indexOf("const touchedExistingCuts = existingCutTouches")
    );
    expect(sampleMethod).toContain('this.haptics.play("clear", this.inputModality);');
    expect(sampleMethod.indexOf('this.haptics.play("clear", this.inputModality);')).toBeGreaterThan(
      sampleMethod.indexOf("this.playAutoRemovedCutFeedback(feedbackRemovedCuts);")
    );
    expect(autoReleaseMethod).toContain("const style = autoReleaseCutFeedbackStyle(cuts.length, this.compactLayout);");
    expect(autoReleaseMethod).toContain("this.playCutReleaseFeedback(cuts, style);");
    expect(autoReleaseMethod).not.toContain("this.audio.play");
    expect(autoReleaseMethod).not.toContain("this.haptics.play");
    expect(autoReleaseMethod).not.toContain("this.setRobotComment");
    expect(autoReleaseMethod).not.toContain("this.scoring.scoreRound");
    expect(releaseMethod).toContain("this.clearClearCutFeedback();");
    expect(releaseMethod).toContain("this.clearCutFeedbackRect = {");
  });

  it("gives bottom controls immediate pressed-state feedback before release actions", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const createMethod = source.match(/create\(data: PlaySceneData\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const resolveStateMethod = source.match(/private applyResolveButtonVisualState\(hovered: boolean, pressed = false\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearStateMethod = source.match(/private applyClearButtonVisualState\(hovered: boolean, pressed = false\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearActionableMethod = source.match(/private clearButtonActionable\(\): boolean \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearMethod = source.match(/private clearPlayerCuts\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const advanceReviewMethod = source.match(/private advanceTutorialReview\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const canAdvanceReviewMethod = source.match(/private tutorialReviewCanAdvance\(\): boolean \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const markReviewMethod = source.match(/private markTutorialReviewReady\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const scheduleReviewMethod = source.match(/private scheduleTutorialReviewReady\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const updateReviewMethod = source.match(/private updateTutorialReviewReady\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);

    expect(createMethod).toContain('this.resolveButton.on("pointerdown", () => this.handleResolvePointerDown());');
    expect(createMethod).toContain('this.resolveButton.on("pointerup", () => this.handleResolvePointerUp());');
    expect(createMethod).toContain('this.clearButton.on("pointerdown", () => this.applyClearButtonVisualState(true, true));');
    expect(createMethod).toContain('this.muteButton.on("pointerdown", () => this.muteButton.setFillStyle(buttonVisual.pressFill, buttonVisual.pressAlpha));');
    expect(createMethod).toContain('this.exitButton.on("pointerdown", () => this.exitButton.setFillStyle(buttonVisual.pressFill, buttonVisual.pressAlpha));');
    expect(resolveStateMethod).toContain("const ready = this.tutorialReviewCanAdvance();");
    expect(resolveStateMethod).toContain('ready ? finalRound ? "Finish" : "Continue" : "Review"');
    expect(resolveStateMethod).toContain("resolveButtonVisualState(");
    expect(resolveStateMethod).toContain("ready,");
    expect(resolveStateMethod).toContain("pressed,");
    expect(resolveStateMethod).toContain("this.currentCuts.length");
    expect(advanceReviewMethod).toContain("if (!this.tutorialReviewCanAdvance())");
    expect(source).toContain("private resolvePointerDownCanAdvanceReview = true;");
    expect(source).toContain("private tutorialReviewReadyAtMs: number | null = null;");
    expect(source).toContain("TUTORIAL_REVIEW_CONTINUE_DWELL_MS");
    expect(source).toContain("private handleResolvePointerDown(): void {");
    expect(source).toContain("this.resolvePointerDownCanAdvanceReview =\n      !this.tutorialMode || !this.resolving || this.tutorialReviewCanAdvance();");
    expect(source).toContain("private handleResolvePointerUp(): void {");
    expect(source).toContain("this.handleResolveButton({ canAdvanceReview });");
    expect(source).toContain("if (options.canAdvanceReview === false) {\n        this.updateResolveButtonState();\n        return;\n      }");
    expect(scheduleReviewMethod).toContain("this.tutorialReviewReady = false;");
    expect(scheduleReviewMethod).toContain("this.tutorialReviewReadyAtMs = this.baseNowMs() + TUTORIAL_REVIEW_CONTINUE_DWELL_MS;");
    expect(updateReviewMethod).toContain("this.baseNowMs() < this.tutorialReviewReadyAtMs");
    expect(updateReviewMethod).toContain("this.markTutorialReviewReady();");
    expect(markReviewMethod).toContain("this.writePlayQaSnapshot();");
    expect(canAdvanceReviewMethod).toContain("this.updateTutorialReviewReady();");
    expect(canAdvanceReviewMethod).toContain("return this.tutorialReviewReady;");
    expect(canAdvanceReviewMethod).not.toContain("feedbackCard.isVisible()");
    expect(qaMethod).toContain("tutorialReviewReady: this.tutorialReviewCanAdvance()");
    expect(qaMethod).toContain("tutorialReviewDwellRemainingMs");
    expect(qaMethod).toContain("clearButtonActionable: this.clearButtonActionable()");
    expect(clearActionableMethod).toContain("return !this.resolving && this.currentCuts.length > 0;");
    expect(clearStateMethod).toContain("const canClear = this.clearButtonActionable();");
    expect(clearStateMethod).toContain("clearButtonVisualState(canClear, hovered, pressed)");
    expect(clearStateMethod).toContain('this.clearButton.input.cursor = canClear ? "pointer" : false;');
    expect(clearStateMethod).toContain("this.input.resetCursor();");
    expect(clearMethod).toContain("if (this.resolving || this.currentCuts.length === 0)");
    expect(clearMethod).toContain("this.updateClearButtonState();");
  });

  it("maps keyboard controls to existing bottom-row actions without adding scoring paths", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const createMethod = source.match(/create\(data: PlaySceneData\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const shutdownMethod = source.match(/private shutdownScene\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const resolveKeyMethod = source.match(/private handleKeyboardResolve\(event: KeyboardEvent\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearKeyMethod = source.match(/private handleKeyboardClear\(event: KeyboardEvent\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const muteKeyMethod = source.match(/private handleKeyboardMute\(event: KeyboardEvent\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const exitKeyMethod = source.match(/private handleKeyboardExit\(event: KeyboardEvent\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const consumeMethod = source.match(/private consumeKeyboardControl\(event: KeyboardEvent\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(createMethod).toContain('this.input.keyboard?.on("keydown-ENTER", this.handleKeyboardResolve, this);');
    expect(createMethod).toContain('this.input.keyboard?.on("keydown-SPACE", this.handleKeyboardResolve, this);');
    expect(createMethod).toContain('this.input.keyboard?.on("keydown-BACKSPACE", this.handleKeyboardClear, this);');
    expect(createMethod).toContain('this.input.keyboard?.on("keydown-DELETE", this.handleKeyboardClear, this);');
    expect(createMethod).toContain('this.input.keyboard?.on("keydown-M", this.handleKeyboardMute, this);');
    expect(createMethod).toContain('this.input.keyboard?.on("keydown-ESC", this.handleKeyboardExit, this);');
    expect(shutdownMethod).toContain('this.input.keyboard?.off("keydown-ENTER", this.handleKeyboardResolve, this);');
    expect(shutdownMethod).toContain('this.input.keyboard?.off("keydown-SPACE", this.handleKeyboardResolve, this);');
    expect(shutdownMethod).toContain('this.input.keyboard?.off("keydown-BACKSPACE", this.handleKeyboardClear, this);');
    expect(shutdownMethod).toContain('this.input.keyboard?.off("keydown-DELETE", this.handleKeyboardClear, this);');
    expect(shutdownMethod).toContain('this.input.keyboard?.off("keydown-M", this.handleKeyboardMute, this);');
    expect(shutdownMethod).toContain('this.input.keyboard?.off("keydown-ESC", this.handleKeyboardExit, this);');
    expect(resolveKeyMethod).toContain("this.consumeKeyboardControl(event);");
    expect(resolveKeyMethod).toContain("if (event.repeat) {");
    expect(resolveKeyMethod).toContain("this.handleResolveButton();");
    expect(clearKeyMethod).toContain("this.clearPlayerCuts();");
    expect(muteKeyMethod).toContain("this.toggleMute();");
    expect(exitKeyMethod).toContain("this.exitToMenu();");
    expect(consumeMethod).toContain("event.preventDefault();");
    expect(consumeMethod).toContain("event.stopPropagation();");
    expect(resolveKeyMethod).not.toContain("this.scoring.scoreRound");
    expect(clearKeyMethod).not.toContain("this.scoring.scoreRound");
  });

  it("renders mouse and pen hover snap previews without staging input or seeding release feedback", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const pointerMethod = source.match(/private handlePointer\(pointer: Phaser\.Input\.Pointer\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const hoverMethod = source.match(/private renderHoverCutPreview\(point: Point, modality: PlaytestInputModality\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const previewMethod = source.match(/private renderArmedCutPreview\(point: Point, options: \{ trackGesturePreview\?: boolean; slots\?: BoundarySlot\[\] \} = \{\}\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(pointerMethod).toContain("const observedModality = inputModalityFromPointer(pointer);");
    expect(pointerMethod).toContain("this.inputModality = mergeInputModality(this.inputModality, observedModality);");
    expect(pointerMethod.indexOf("if (!pointer.isDown) {")).toBeGreaterThan(
      pointerMethod.indexOf("const point = { x: pointer.x, y: pointer.y };")
    );
    expect(pointerMethod).toContain("this.renderHoverCutPreview(point, observedModality);");
    expect(pointerMethod).toContain("this.applyPointerCutSample(point);");
    expect(pointerMethod.indexOf("this.renderHoverCutPreview(point, observedModality);")).toBeLessThan(
      pointerMethod.indexOf("this.applyPointerCutSample(point);")
    );
    expect(hoverMethod).toContain('if (modality === "mouse" || modality === "pen") {');
    expect(hoverMethod).toContain("this.renderArmedCutPreview(point, { trackGesturePreview: false });");
    expect(hoverMethod).toContain("this.clearArmedCutPreview();");
    expect(hoverMethod).not.toContain("this.inputModality =");
    expect(hoverMethod).not.toContain("this.currentCuts =");
    expect(hoverMethod).not.toContain("this.cutInput.applySample");
    expect(hoverMethod).not.toContain("this.gestureNoCutPreview =");
    expect(hoverMethod).not.toContain("this.haptics.play");
    expect(source).toContain("private renderArmedCutPreview(point: Point, options: { trackGesturePreview?: boolean; slots?: BoundarySlot[] } = {})");
    expect(source).toContain("slot && style && style.strength > 0 && options.trackGesturePreview !== false");
    expect(previewMethod).toContain("const snapDistance = this.swipe.snapDistanceForViewport(this.scale.width);");
    expect(previewMethod).toContain("armedCutPreviewStyle(Math.abs(point.x - slot.x), previewDistance, this.compactLayout, snapDistance)");
    expect(previewMethod).toContain("this.armedPreviewReady = style?.snapReady ?? false;");
    expect(previewMethod).toContain("const previewColor = preview.snapReady ? uiPalette.amber : uiPalette.blueGrey;");
    expect(previewMethod).toContain("const targetColor = preview.snapReady ? uiPalette.amber : uiPalette.blueGrey;");
    expect(previewMethod).toContain("if (preview.snapReady && preview.latchLength > 0) {");
    expect(previewMethod).toContain("preview.latchWidth + 2");
    expect(previewMethod).toContain("uiPalette.amberLight");
    expect(previewMethod).toContain("preview.latchAlpha");
    expect(previewMethod).toContain("uiPalette.amber");
  });

  it("uses audio and touch haptics as immediate punctuation without changing cut logic", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);
    const noCutMethod = source.match(/private playNoCutFeedback\(point\?: Point, preview\?: NoCutPreviewSnapshot\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const toggleMethod = source.match(/private toggleMute\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(source).toContain('import { HapticFeedbackSystem } from "../systems/HapticFeedbackSystem";');
    expect(source).toContain("private readonly haptics = new HapticFeedbackSystem(this.audio.isMuted());");
    expect(sampleMethod).toContain('this.audio.play("ui");');
    expect(sampleMethod).toContain('this.haptics.play("confirm", this.inputModality);');
    expect(sampleMethod.indexOf('this.haptics.play("confirm", this.inputModality);')).toBeGreaterThan(
      sampleMethod.indexOf('this.audio.play("ui");')
    );
    expect(sampleMethod).toContain("const feedbackAddedCuts = result.replacedCuts.length > 0 ? [] : result.addedCuts;");
    expect(sampleMethod).toContain("const correctionCutCount = result.replacedCuts.length > 0 ? result.addedCuts.length : 0;");
    expect(sampleMethod).toContain("const responseCutCount = feedbackAddedCuts.length + correctionCutCount;");
    expect(sampleMethod).toContain("this.audio.playSequence(cutConfirmationAudioCues(responseCutCount), CUT_CONFIRMATION_CUE_SPACING_MS);");
    expect(sampleMethod).toContain("this.haptics.playCutBurst(responseCutCount, this.inputModality);");
    expect(sampleMethod).toContain('this.haptics.play("clear", this.inputModality);');
    expect(sampleMethod.indexOf("this.haptics.playCutBurst(responseCutCount, this.inputModality);")).toBeGreaterThan(
      sampleMethod.indexOf("this.audio.playSequence(cutConfirmationAudioCues(responseCutCount), CUT_CONFIRMATION_CUE_SPACING_MS);")
    );
    expect(sampleMethod.indexOf('this.haptics.play("clear", this.inputModality);')).toBeGreaterThan(
      sampleMethod.indexOf("this.playAutoRemovedCutFeedback(feedbackRemovedCuts);")
    );
    expect(sampleMethod).not.toContain('this.audio.play("cut");');
    expect(sampleMethod).not.toContain('this.audio.play("clear");');
    expect(noCutMethod).toContain('this.audio.play("miss");');
    expect(noCutMethod).toContain('this.haptics.play("miss", this.inputModality);');
    expect(noCutMethod.indexOf('this.haptics.play("miss", this.inputModality);')).toBeGreaterThan(
      noCutMethod.indexOf('this.audio.play("miss");')
    );
    expect(noCutMethod).not.toContain("this.scoring.scoreRound");
    expect(toggleMethod).toContain("this.haptics.setMuted(muted);");
  });

  it("acknowledges same-gesture adjacent-slot corrections without adding pet speech or scoring", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);

    expect(sampleMethod).toContain("const correctionCutCount = result.replacedCuts.length > 0 ? result.addedCuts.length : 0;");
    expect(sampleMethod).toContain("const responseCutCount = feedbackAddedCuts.length + correctionCutCount;");
    expect(sampleMethod).toContain("cutCount: responseCutCount");
    expect(sampleMethod).toContain("correction: correctionCutCount > 0");
    expect(sampleMethod.indexOf("this.inputFeelMetrics.recordCutsAdded({")).toBeLessThan(
      sampleMethod.indexOf("if (feedbackAddedCuts.length > 0) {")
    );
    expect(sampleMethod).toContain("this.playCutCorrectionFeedback(result.replacedCuts, result.addedCuts);");
    expect(sampleMethod).toContain("if (correctionCutCount > 0) {");
    expect(sampleMethod).toContain('this.haptics.play("confirm", this.inputModality);');
    expect(sampleMethod).toContain("this.audio.playSequence(cutConfirmationAudioCues(responseCutCount), CUT_CONFIRMATION_CUE_SPACING_MS);");
    expect(sampleMethod).toContain("this.playTextCutImpact(Math.max(1, responseCutCount));");
    expect(sampleMethod.indexOf("this.playPetReaction(wienerCutReaction(feedbackAddedCuts.length));")).toBeGreaterThan(
      sampleMethod.indexOf("if (feedbackAddedCuts.length > 0) {")
    );
    expect(sampleMethod.indexOf("this.playPetReaction(wienerCutReaction(feedbackAddedCuts.length));")).toBeLessThan(
      sampleMethod.indexOf("this.audio.playSequence(cutConfirmationAudioCues(responseCutCount), CUT_CONFIRMATION_CUE_SPACING_MS);")
    );
    expect(sampleMethod).not.toContain("wienerCutReaction(responseCutCount)");
    expect(sampleMethod).not.toContain("this.scoring.scoreRound");
  });

  it("renders same-gesture adjacent-slot corrections as a bridge without changing cut rules", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);
    const correctionMethod = source.match(/private playCutCorrectionFeedback\(fromCuts: number\[\], toCuts: number\[\]\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearMethod = source.match(/private clearClearCutFeedback\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);

    expect(source).toContain("cutCorrectionFeedbackStyle");
    expect(source).toContain("private cutCorrectionFeedbackRect?: GameQaRect;");
    expect(sampleMethod).toContain("this.playCutCorrectionFeedback(result.replacedCuts, result.addedCuts);");
    expect(sampleMethod.indexOf("this.playCutCorrectionFeedback(result.replacedCuts, result.addedCuts);")).toBeLessThan(
      sampleMethod.indexOf('this.haptics.play("confirm", this.inputModality);')
    );
    expect(correctionMethod).toContain("const pairCount = Math.min(fromCuts.length, toCuts.length);");
    expect(correctionMethod).toContain("cutCorrectionFeedbackStyle(pairCount, this.compactLayout)");
    expect(correctionMethod).toContain("const bridgeY = bounds.centerY + bounds.height / 2");
    expect(correctionMethod).toContain("this.clearCutFeedbackGraphics.lineBetween(pair.fromX, bridgeY, pair.toX, bridgeY);");
    expect(correctionMethod).toContain("this.cutCorrectionFeedbackRect = {");
    expect(correctionMethod).toContain("this.writePlayQaSnapshot();");
    expect(correctionMethod).not.toContain("this.currentCuts =");
    expect(correctionMethod).not.toContain("this.scoring.scoreRound");
    expect(correctionMethod).not.toContain("this.setRobotComment");
    expect(clearMethod).toContain("this.cutCorrectionFeedbackRect = undefined;");
    expect(qaMethod).toContain("cutCorrectionFeedbackActive: this.cutCorrectionFeedbackRect !== undefined");
    expect(qaMethod).toContain("cutCorrectionFeedbackRect: this.cutCorrectionFeedbackRect");
  });

  it("renders chained multi-cut swipes as a transient rail without changing cut rules", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);
    const endMethod = source.match(/private handlePointerGestureEnd\(pointer\?: Phaser\.Input\.Pointer\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const chainMethod = source.match(/private playChainSwipeFeedback\(cuts: number\[\]\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearMethod = source.match(/private clearChainSwipeFeedback\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);

    expect(source).toContain("chainSwipeFeedbackStyle");
    expect(source).toContain("private chainSwipeFeedbackGraphics!: Phaser.GameObjects.Graphics;");
    expect(source).toContain("private chainSwipeFeedbackRect?: GameQaRect;");
    expect(sampleMethod).toContain("if (feedbackAddedCuts.length >= 2) {");
    expect(sampleMethod).toContain("this.playChainSwipeFeedback(feedbackAddedCuts);");
    expect(endMethod).toContain("if (!this.resolving && releasePulseCuts.length >= 2) {\n      this.playChainSwipeFeedback(releasePulseCuts);\n    }");
    expect(endMethod.indexOf("this.playChainSwipeFeedback(releasePulseCuts);")).toBeGreaterThan(
      endMethod.indexOf("this.inputFeelMetrics.endGesture();")
    );
    expect(endMethod.indexOf("this.playChainSwipeFeedback(releasePulseCuts);")).toBeLessThan(
      endMethod.indexOf("this.trailFadeTween?.stop();")
    );
    expect(sampleMethod.indexOf("this.playChainSwipeFeedback(feedbackAddedCuts);")).toBeGreaterThan(
      sampleMethod.indexOf("this.playPetReaction(wienerCutReaction(feedbackAddedCuts.length));")
    );
    expect(sampleMethod.indexOf("this.playChainSwipeFeedback(feedbackAddedCuts);")).toBeLessThan(
      sampleMethod.indexOf("this.audio.playSequence(cutConfirmationAudioCues(responseCutCount), CUT_CONFIRMATION_CUE_SPACING_MS);")
    );
    expect(chainMethod).toContain("const style = chainSwipeFeedbackStyle(cuts.length, this.compactLayout);");
    expect(chainMethod).toContain("this.swipe.boundaryX(bounds, this.currentFixture!.text, cut)");
    expect(chainMethod).toContain("this.chainSwipeFeedbackGraphics.lineBetween(minX, bridgeY, maxX, bridgeY);");
    expect(chainMethod).toContain("this.chainSwipeFeedbackRect = {");
    expect(chainMethod).toContain("targets: this.chainSwipeFeedbackGraphics");
    expect(chainMethod).toContain("this.writePlayQaSnapshot();");
    expect(chainMethod).not.toContain("this.currentCuts =");
    expect(chainMethod).not.toContain("this.scoring.scoreRound");
    expect(chainMethod).not.toContain("this.setRobotComment");
    expect(clearMethod).toContain("this.chainSwipeFeedbackTween?.stop();");
    expect(clearMethod).toContain("this.chainSwipeFeedbackRect = undefined;");
    expect(qaMethod).toContain("chainSwipeFeedbackActive: this.chainSwipeFeedbackRect !== undefined");
    expect(qaMethod).toContain("chainSwipeFeedbackRect: this.chainSwipeFeedbackRect");
  });

  it("gives the endless timer warning a tactile cue without changing timer logic", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const warningMethod = source.match(/private maybePlayTimeWarning\(time: number\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(warningMethod).toContain("shouldPlayTimeWarning({");
    expect(warningMethod).toContain('this.audio.play("warning");');
    expect(warningMethod).toContain('this.haptics.play("warning", this.inputModality);');
    expect(warningMethod.indexOf('this.haptics.play("warning", this.inputModality);')).toBeGreaterThan(
      warningMethod.indexOf('this.audio.play("warning");')
    );
    expect(warningMethod).not.toContain("this.scoring.scoreRound");
  });

  it("plays one tactile outcome cue when resolution commits without changing scoring", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(resolveMethod).toContain("const score = this.scoring.scoreRound({");
    expect(resolveMethod).toContain("const resolutionFeedbackInput = {");
    expect(resolveMethod).toContain("this.audio.playSequence(this.resolutionFeedback.audioCues(resolutionFeedbackInput));");
    expect(resolveMethod).toContain("this.haptics.play(this.resolutionFeedback.hapticCue(resolutionFeedbackInput), this.inputModality);");
    expect(resolveMethod.indexOf("this.haptics.play(this.resolutionFeedback.hapticCue(resolutionFeedbackInput), this.inputModality);")).toBeGreaterThan(
      resolveMethod.indexOf("this.audio.playSequence(this.resolutionFeedback.audioCues(resolutionFeedbackInput));")
    );
    expect(resolveMethod.match(/this\.scoring\.scoreRound/g)?.length).toBe(1);
  });

  it("plays and clears a labelled resolve commit beat for submitted and empty resolves without changing scoring", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const commitMethod = source.match(/private playResolveCommitBeat\(cuts: number\[\], trigger: RoundResolveTrigger\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearMethod = source.match(/private clearResolveCommitBeat\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);

    expect(source).toContain("private resolveCommitGraphics!: Phaser.GameObjects.Graphics;");
    expect(source).toContain("private resolveCommitText!: Phaser.GameObjects.Text;");
    expect(source).toContain("this.resolveCommitGraphics = this.add.graphics().setDepth(7.35).setVisible(false);");
    expect(source).toContain("this.resolveCommitText = this.add.text");
    expect(source).toContain("resolutionCommitBeatLabel(cutXs.length, trigger)");
    expect(resolveMethod).toContain("this.lastResolveTrigger = trigger;");
    expect(resolveMethod.indexOf("this.playResolveCommitBeat(this.currentCuts, trigger);")).toBeGreaterThan(
      resolveMethod.indexOf("this.renderResolvedCuts(score);")
    );
    expect(resolveMethod.indexOf("this.animateResolvedTextPieces();")).toBeGreaterThan(
      resolveMethod.indexOf("this.playResolveCommitBeat(this.currentCuts, trigger);")
    );
    expect(commitMethod).toContain("resolutionCommitBeatStyle(cuts.length, this.compactLayout, trigger)");
    expect(commitMethod).toContain("trigger === \"deadline\" ? uiPalette.warning : uiPalette.amber");
    expect(commitMethod).toContain("this.clearResolveCommitBeat();");
    expect(commitMethod).toContain("this.swipe.boundaryX(bounds, this.currentFixture!.text, cut)");
    expect(commitMethod).toContain("const hasCutLines = cutXs.length > 0;");
    expect(commitMethod).toContain("this.resolveCommitText.setText(resolutionCommitBeatLabel(cutXs.length, trigger));");
    expect(commitMethod).toContain("this.resolveCommitText.setPosition");
    expect(commitMethod).toContain("this.resolveCommitText.setVisible(true);");
    expect(commitMethod).toContain("this.resolveCommitGraphics.fillRoundedRect");
    expect(commitMethod).toContain("this.resolveCommitGraphics.lineBetween(left, scanY, right, scanY)");
    expect(commitMethod).toContain("this.resolveCommitTween = this.tweens.add");
    expect(commitMethod).toContain("targets: [this.resolveCommitGraphics, this.resolveCommitText]");
    expect(commitMethod).not.toContain("this.scoring.scoreRound");
    expect(commitMethod).not.toContain("this.currentCuts.push");
    expect(commitMethod).not.toContain("this.setRobotComment");
    expect(clearMethod).toContain("this.resolveCommitTween?.stop();");
    expect(clearMethod).toContain("this.resetResolveCommitGraphics();");
    expect(source).toContain("this.resolveCommitText?.setVisible(false);");
    expect((source.match(/this\.clearResolveCommitBeat\(\);/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(qaMethod).toContain("resolveCommitBeatActive: this.resolveCommitGraphics?.visible ?? false");
    expect(qaMethod).toContain("resolveCommitBeatRect: this.resolveCommitGraphics?.visible ? this.resolveCommitRect : undefined");
    expect(qaMethod).toContain("resolveCommitBeatText: this.resolveCommitText?.visible ? this.resolveCommitText.text : undefined");
    expect(qaMethod).toContain("resolveCommitBeatTextRect: this.resolveCommitText?.visible ? this.qaRectFromBounds(this.resolveCommitText.getBounds()) : undefined");
    expect(qaMethod).toContain("resolutionTrigger: this.lastResolveTrigger");
    expect(resolveMethod.match(/this\.scoring\.scoreRound/g)?.length).toBe(1);
  });

  it("marks timer-owned round completion as a deadline resolve without changing manual resolve", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const updateMethod = source.match(/update\(time: number\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const buttonMethod = source.match(/private handleResolveButton\(options: \{ canAdvanceReview\?: boolean \} = \{\}\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const startRoundMethod = source.match(/private startRound\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(updateMethod).toContain("this.resolveRound(\"deadline\");");
    expect(buttonMethod).toContain("this.resolveRound(\"manual\");");
    expect(startRoundMethod).toContain("this.lastResolveTrigger = null;");
    expect(source).not.toContain("this.setRobotComment(\"deadline");
  });

  it("acknowledges cut-band gestures that release without staging a boundary", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const feedbackSource = readRepoFile("src/game/systems/ActiveCutFeedbackSystem.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);
    const endMethod = source.match(/private handlePointerGestureEnd\(pointer\?: Phaser\.Input\.Pointer\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const noCutMethod = source.match(/private playNoCutFeedback\(point\?: Point, preview\?: NoCutPreviewSnapshot\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(source).toContain("interface NoCutPreviewSnapshot");
    expect(source).toContain("private gestureNoCutPreview?: NoCutPreviewSnapshot;");
    expect(source).toContain("private noCutFeedbackDirection?: NoCutFeedbackDirection;");
    expect(sampleMethod).toContain("this.gestureTouchedCutBand = true;");
    expect(sampleMethod).toContain("this.gestureHadCut = true;");
    expect(source).toContain("shouldAcknowledgeNoCutGesture");
    expect(endMethod).toContain("touchedCutBand: this.gestureTouchedCutBand");
    expect(endMethod).toContain("hadCut: this.gestureHadCut");
    expect(endMethod).toContain("trailPointCount: this.trailPoints.length");
    expect(endMethod).toContain("hadPreviewTarget: noCutPreview !== undefined");
    expect(endMethod).toContain("const noCutPreview = this.gestureNoCutPreview;");
    expect(endMethod).toContain("this.playNoCutFeedback(releasePoint, noCutPreview);");
    expect(feedbackSource).toContain('NO_CUT_FEEDBACK_LABEL = "NO SLOT"');
    expect(feedbackSource).toContain('NO_CUT_FEEDBACK_AIM_LABEL = "AIM CLOSER"');
    expect(feedbackSource).toContain('NO_CUT_FEEDBACK_AIM_LEFT_LABEL = "AIM LEFT"');
    expect(feedbackSource).toContain('NO_CUT_FEEDBACK_AIM_RIGHT_LABEL = "AIM RIGHT"');
    expect(feedbackSource).toContain("export function shouldAcknowledgeNoCutGesture");
    expect(feedbackSource).toContain('export function noCutFeedbackReason');
    expect(feedbackSource).toContain('export function noCutFeedbackDirection');
    expect(feedbackSource).toContain('export function noCutFeedbackLabel');
    expect(noCutMethod).toContain("if (preview) {");
    expect(noCutMethod).toContain("style.snapGuideWidth");
    expect(noCutMethod).toContain("style.snapLineAlpha");
    expect(noCutMethod).toContain("style.snapTickLength");
    expect(noCutMethod).toContain("const direction = preview ? noCutFeedbackDirection(x, preview.x) : \"center\";");
    expect(noCutMethod).toContain("this.noCutFeedbackDirection = direction;");
    expect(noCutMethod).toContain("style.correctionArrowLength");
    expect(noCutMethod).toContain("style.correctionArrowAlpha");
    expect(noCutMethod).toContain("direction !== \"center\"");
    expect(noCutMethod).toContain("const reason = noCutFeedbackReason(preview !== undefined);");
    expect(noCutMethod).toContain("const style = noCutFeedbackStyle(this.compactLayout, reason);");
    expect(noCutMethod.indexOf("const style = noCutFeedbackStyle(this.compactLayout, reason);")).toBeGreaterThan(
      noCutMethod.indexOf("const reason = noCutFeedbackReason(preview !== undefined);")
    );
    expect(noCutMethod).toContain("this.noCutFeedbackReason = reason;");
    expect(noCutMethod).toContain("this.noCutFeedbackText.setText(noCutFeedbackLabel(reason, direction));");
    expect(noCutMethod).toContain("this.noCutFeedbackGraphics.lineBetween");
    expect(noCutMethod).toContain("uiPalette.warning");
    expect(noCutMethod).toContain("targets: this.noCutFeedbackText");
    expect(noCutMethod).toContain("this.noCutFeedbackScuffTween = this.tweens.add");
    expect(noCutMethod).toContain("targets: this.noCutFeedbackGraphics");
    expect(noCutMethod).toContain('this.audio.play("miss");');
    expect(noCutMethod).not.toContain('this.audio.play("cut")');
    expect(noCutMethod).not.toContain('this.audio.play("clear")');
    expect(noCutMethod).not.toContain('this.audio.play("resolve")');
    expect(noCutMethod).not.toContain("this.setRobotComment");
    expect(noCutMethod).not.toContain("this.scoring.scoreRound");
    expect(source).toContain("noCutFeedbackDirection: this.noCutFeedbackText?.visible ? this.noCutFeedbackDirection : undefined");
  });

  it("refreshes the staged-cut pulse on release so successful swipes settle visibly", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);
    const endMethod = source.match(/private handlePointerGestureEnd\(pointer\?: Phaser\.Input\.Pointer\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(source).toContain("private gestureAddedCuts = new Set<number>();");
    expect(source).toContain("private gestureReleaseSampleCuts = new Set<number>();");
    expect(sampleMethod).toContain("result.replacedCuts.forEach((cut) => this.gestureAddedCuts.delete(cut));");
    expect(sampleMethod).toContain("result.replacedCuts.forEach((cut) => this.gestureReleaseSampleCuts.delete(cut));");
    expect(sampleMethod).toContain("result.addedCuts.forEach((cut) => this.gestureAddedCuts.add(cut));");
    expect(sampleMethod).toContain("if (options.releaseSample) {");
    expect(sampleMethod).toContain("result.addedCuts.forEach((cut) => this.gestureReleaseSampleCuts.add(cut));");
    expect(endMethod).toContain("const currentCutSet = new Set(this.currentCuts);");
    expect(endMethod).toContain("const releasePulseCuts = [...this.gestureAddedCuts].filter((cut) => currentCutSet.has(cut));");
    expect(endMethod).toContain("const releaseSamplePulseCuts = [...this.gestureReleaseSampleCuts].filter((cut) => currentCutSet.has(cut));");
    expect(endMethod).toContain("const normalReleasePulseCuts = releasePulseCuts.filter((cut) => !this.gestureReleaseSampleCuts.has(cut));");
    expect(endMethod).toContain("this.noteActiveCutPulses(normalReleasePulseCuts);");
    expect(endMethod).toContain('this.noteActiveCutPulses(releaseSamplePulseCuts, "release");');
    expect(endMethod).toContain("this.renderPlayerCuts();");
    expect(endMethod).toContain("this.gestureAddedCuts.clear();");
    expect(endMethod).toContain("this.gestureReleaseSampleCuts.clear();");
    expect(endMethod).not.toContain("this.audio.play");
    expect(endMethod).not.toContain("this.setRobotComment");
    expect(endMethod).not.toContain("this.scoring.scoreRound");
  });

  it("treats swipes across already staged cuts as audible confirmation rather than failed gestures", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const sampleMethod = applyPointerCutSampleMethod(source);
    const endMethod = source.match(/private handlePointerGestureEnd\(pointer\?: Phaser\.Input\.Pointer\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const existingTouchMethod = source.match(/private existingCutsTouchedByPointer\([\s\S]+?\n  \}/)?.[0] ?? "";
    const clearMethod = source.match(/private clearPlayerCuts\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(source).toContain("private gestureTouchedExistingCuts = new Set<number>();");
    expect(source).toContain("kind: ActiveCutPulseKind");
    expect(source).toContain('function activeCutLabelText(kind: ActiveCutPulseKind | undefined): string');
    expect(source).toContain('return "HELD";');
    expect(source).toContain('return "SET";');
    expect(source).toContain('return "CUT";');
    expect(source).toContain('pulse?.kind === "confirm"');
    expect(source).toContain('pulse?.kind === "release"');
    expect(source).toContain("uiPalette.amberLight");
    expect(source).toContain("const labelText = activeCutLabelText(this.activeCutPulseStartedAt.get(cut.boundary)?.kind);");
    expect(source).toContain("label.setText(labelText);");
    expect(source).toContain("private activeCutPulseKindsForQa(): ActiveCutPulseKind[]");
    expect(source).toContain("activeCutPulseKinds: this.activeCutPulseKindsForQa(),");
    expect(sampleMethod).toContain("const existingCutTouches = this.existingCutsTouchedByPointer");
    expect(sampleMethod).toContain("const touchedExistingCuts = existingCutTouches");
    expect(sampleMethod).toContain(".filter((cut) => !this.gestureAddedCuts.has(cut))");
    expect(sampleMethod).toContain(".filter((cut) => !this.gestureTouchedExistingCuts.has(cut));");
    expect(sampleMethod).toContain("this.gestureHadCut = true;");
    expect(sampleMethod).toContain("touchedExistingCuts.forEach((cut) => this.gestureTouchedExistingCuts.add(cut));");
    expect(sampleMethod).toContain('this.noteActiveCutPulses(touchedExistingCuts, "confirm");');
    expect(sampleMethod).toContain("this.renderPlayerCuts();");
    expect(sampleMethod).toContain('this.audio.play("ui");');
    expect(existingTouchMethod).toContain("this.swipe.nearestBoundary(slots, point, snapDistance)");
    expect(existingTouchMethod).toContain("this.swipe.boundariesCrossedBySegment(slots, lastPoint, point, snapDistance)");
    expect(existingTouchMethod).toContain("return [...touchedCuts].sort((a, b) => a - b);");
    expect(endMethod).toContain("this.gestureTouchedExistingCuts.clear();");
    expect(clearMethod).toContain("this.gestureReleaseSampleCuts.clear();");
    expect(clearMethod).toContain("this.gestureTouchedExistingCuts.clear();");
    expect(resolveMethod).toContain("this.gestureReleaseSampleCuts.clear();");
    expect(resolveMethod).toContain("this.gestureTouchedExistingCuts.clear();");
    expect(sampleMethod).not.toContain('this.audio.play("miss");\n      this.haptics.play("confirm"');
    expect(sampleMethod).not.toContain("this.scoring.scoreRound");
    expect(sampleMethod).not.toContain("this.setRobotComment");
  });

  it("ties the touch aim loupe accent to snap-ready preview state without changing cuts", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const previewMethod = source.match(/private renderArmedCutPreview\(point: Point[\s\S]+?\n  \}/)?.[0] ?? "";
    const loupeMethod = source.match(/private renderTouchAimLoupe\(state: TouchAimLoupeState\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearMethod = source.match(/private clearArmedCutPreview\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const qaMethod = writePlayQaSnapshotMethod(source);

    expect(source).toContain("private touchAimLoupeSnapReady = false;");
    expect(source).toContain("private touchAimLoupePointerClearancePx: number | null = null;");
    expect(source).toContain('private touchAimLoupePlacement: TouchAimLoupePlacement = "hidden";');
    expect(previewMethod).toContain("snapReady: style?.snapReady ?? false");
    expect(loupeMethod).toContain("this.touchAimLoupeSnapReady = state.snapReady;");
    expect(loupeMethod).toContain("this.touchAimLoupePointerClearancePx = state.pointerClearancePx;");
    expect(loupeMethod).toContain("this.touchAimLoupePlacement = state.placement;");
    expect(loupeMethod).toContain("this.inputFeelMetrics.recordTouchAimLoupe({");
    expect(loupeMethod).toContain("const accentColor = state.snapReady ? uiPalette.amber : uiPalette.blueGrey;");
    expect(loupeMethod).toContain("const style = touchAimLoupeVisualStyle(state.snapReady);");
    expect(loupeMethod).toContain("style.centerLineWidth");
    expect(loupeMethod).toContain("style.railAlpha");
    expect(loupeMethod).toContain("if (state.snapReady) {");
    expect(loupeMethod).not.toContain("this.currentCuts");
    expect(loupeMethod).not.toContain("this.scoring.scoreRound");
    expect(clearMethod).toContain("this.touchAimLoupeSnapReady = false;");
    expect(clearMethod).toContain("this.touchAimLoupePointerClearancePx = null;");
    expect(clearMethod).toContain('this.touchAimLoupePlacement = "hidden";');
    expect(qaMethod).toContain("touchAimLoupeSnapReady: this.touchAimLoupeSnapReady");
    expect(qaMethod).toContain("touchAimLoupePointerClearancePx: this.touchAimLoupePointerClearancePx");
    expect(qaMethod).toContain("touchAimLoupePlacement: this.touchAimLoupePlacement");
  });

  it("clears cut-release feedback across resolve and scene lifecycle boundaries", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");

    expect(source).toContain("private clearClearCutFeedback(): void");
    expect(source.match(/this\.clearClearCutFeedback\(\);/g)?.length).toBeGreaterThanOrEqual(5);
    expect(source).toContain("this.clearCutFeedbackTween?.stop();");
    expect(source).toContain("this.clearCutFeedbackGraphics?.clear();");
  });

  it("clears no-cut feedback across resolve and scene lifecycle boundaries", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");

    expect(source).toContain("private clearNoCutFeedback(): void");
    expect(source.match(/this\.clearNoCutFeedback\(\);/g)?.length).toBeGreaterThanOrEqual(5);
    expect(source).toContain("this.noCutFeedbackTween?.stop();");
    expect(source).toContain("this.noCutFeedbackScuffTween?.stop();");
    expect(source).toContain("this.noCutFeedbackGraphics?.clear();");
    expect(source).toContain("this.noCutFeedbackGraphics?.setPosition(0, 0);");
    expect(source).toContain("this.noCutFeedbackText?.setVisible(false);");
    expect(source).toContain("this.noCutFeedbackReason = undefined;");
    expect(source).toContain("this.noCutFeedbackDirection = undefined;");
    expect(source.match(/this\.gestureNoCutPreview = undefined;/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("anchors the pet idle bob to current layout so review placement cannot drift into feedback", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const layoutPetMethod = source.match(/private layoutPetWiener\(layout: ReturnType<typeof computePlayLayout>\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const restartBobMethod = source.match(/private restartPetIdleBob\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const showTokenStripMethod = source.match(/private showTokenStrip\(fixture: TokenFixture, score\?: RoundScoreResult\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const shutdownMethod = source.match(/private shutdownScene\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(source).toContain("private petIdleTween?: Phaser.Tweens.Tween;");
    expect(source).toContain("private petWienerBaseY = 0;");
    expect(source).toContain("private petWienerBaseScaleX = 1;");
    expect(source).toContain("private petWienerBaseScaleY = 1;");
    expect(source).toContain("private petReactionKind: WienerReactionKind | null = null;");
    expect(source).toContain("private petReactionPeakScaleX = 1;");
    expect(source).toContain("private petReactionPeakScaleY = 1;");
    expect(source).not.toContain('y: "-=5"');
    expect(layoutPetMethod).toContain("const evidenceTop = this.tokenEvidenceRect");
    expect(layoutPetMethod).toContain("evidenceTop - 12 - petHeight / 2");
    expect(layoutPetMethod).toContain("feedbackTop - 10 - petHeight / 2");
    expect(layoutPetMethod).toContain("this.petWienerBaseY = petY;");
    expect(layoutPetMethod.indexOf("this.petWiener.setPosition(layout.assistantPanel.x, petY);")).toBeGreaterThan(
      layoutPetMethod.indexOf("this.petWienerBaseY = petY;")
    );
    expect(layoutPetMethod).toContain("sizeWienerImage(this.petWiener, layout.assistantPanel.height);");
    expect(layoutPetMethod).toContain("this.petWienerBaseScaleX = this.petWiener.scaleX;");
    expect(layoutPetMethod).toContain("this.petWienerBaseScaleY = this.petWiener.scaleY;");
    expect(layoutPetMethod).toContain("this.restartPetIdleBob();");
    expect(showTokenStripMethod.indexOf("this.tokenEvidenceRect = undefined;")).toBeLessThan(
      showTokenStripMethod.indexOf("this.layoutPetWiener(computePlayLayout({ width: this.scale.width, height: this.scale.height }));")
    );
    expect(showTokenStripMethod).toContain("this.layoutRobotToast();");
    expect(restartBobMethod).toContain("this.petIdleTween?.stop();");
    expect(restartBobMethod).toContain("this.petWiener.setY(this.petWienerBaseY);");
    expect(restartBobMethod).toContain("y: this.petWienerBaseY - 5");
    expect(shutdownMethod).toContain("this.clearPetIdleBob();");
  });

  it("clears stale prompt speech before review evidence appears", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const resolveMethod = source.match(/private resolveRound\(trigger: RoundResolveTrigger = "manual"\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const revealFeedbackMethod = source.match(/private revealReviewFeedback\(pending: PendingReviewReveal\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(resolveMethod).toContain("this.hideTutorialPopup();");
    expect(resolveMethod).toContain("this.hideRobotToast();");
    expect(resolveMethod.indexOf("this.hideRobotToast();")).toBeGreaterThan(
      resolveMethod.indexOf("this.hideTutorialPopup();")
    );
    expect(resolveMethod.indexOf("this.hideRobotToast();")).toBeLessThan(
      resolveMethod.indexOf("this.scheduleReviewReveal(reviewSequence.evidenceDelayMs")
    );
    expect(revealFeedbackMethod).toContain("this.setRobotComment(pending.resolutionLine");
  });

  it("applies Wiener reaction squash relative to layout scale and resets it", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");
    const reactionMethod = source.match(/private playPetReaction\(plan: WienerReactionPlan \| null\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";
    const clearReactionMethod = source.match(/private clearPetReaction\(\): void \{[\s\S]+?\n  \}/)?.[0] ?? "";

    expect(reactionMethod).toContain("const baseScaleX = this.petWienerBaseScaleX;");
    expect(reactionMethod).toContain("const baseScaleY = this.petWienerBaseScaleY;");
    expect(reactionMethod).toContain("this.petWiener.setScale(baseScaleX, baseScaleY);");
    expect(reactionMethod).toContain("this.petReactionKind = plan.kind;");
    expect(reactionMethod).toContain("this.petReactionPeakScaleX = plan.scaleX;");
    expect(reactionMethod).toContain("this.petReactionPeakScaleY = plan.scaleY;");
    expect(reactionMethod).toContain("scaleX: baseScaleX * plan.scaleX");
    expect(reactionMethod).toContain("scaleY: baseScaleY * plan.scaleY");
    expect(reactionMethod).toContain("this.petWiener.setScale(baseScaleX, baseScaleY);");
    expect(reactionMethod.match(/this\.writePlayQaSnapshot\(\);/g)?.length).toBeGreaterThanOrEqual(2);
    expect(clearReactionMethod).toContain("this.petWiener.setScale(this.petWienerBaseScaleX, this.petWienerBaseScaleY);");
    expect(clearReactionMethod).toContain("this.petReactionKind = null;");
    expect(clearReactionMethod).toContain("this.petReactionPeakScaleX = 1;");
    expect(clearReactionMethod).toContain("this.petReactionPeakScaleY = 1;");
    expect(reactionMethod).not.toContain("displayHeight");
    expect(clearReactionMethod).not.toContain("displayHeight");
  });

  it("cancels staged review reveals on round reset, exit, session end, and shutdown", () => {
    const source = readRepoFile("src/game/scenes/PlayScene.ts");

    expect(source).toContain("private clearReviewRevealTimers(): void");
    expect(source.match(/this\.clearReviewRevealTimers\(\);/g)?.length).toBeGreaterThanOrEqual(5);
    expect(source).toContain("this.reviewRevealTimers.forEach((timer) => timer.remove(false));");
    expect(source).toContain("this.reviewRevealTimers = [];");
  });
});
