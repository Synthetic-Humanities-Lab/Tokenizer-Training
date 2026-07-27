import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateMobileRuntimeEvidence,
  parseMobileRuntimeEvidenceArgs,
  renderMobileRuntimeEvidenceEvaluation
} from "../scripts/evaluate-mobile-runtime-evidence";

describe("mobile runtime evidence evaluator", () => {
  it("accepts browser/mobile QA evidence that proves tutorial and endless parity", () => {
    const directory = writeCompleteRuntimeEvidence();
    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(true);
    expect(evaluation.issues).toEqual([]);
    expect(evaluation.checkedFiles).toContain(join(directory, "cua-flow-result.json"));
  });

  it("accepts compact mobile audit copy when token, economy, and cut evidence remain present", () => {
    const directory = writeCompleteRuntimeEvidence({
      readableFeedbackOverrides: {
        feedbackText: compactFeedbackText()
      }
    });
    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(true);
    expect(evaluation.issues).toEqual([]);
  });

  it("rejects runtime evidence that does not prove hidden touch assist and armed preview state", () => {
    const baselineLoupe = loupePreviewEvidence().touchAimLoupe as Record<string, unknown>;
    const unsafeLoupe = loupePreviewEvidence({
      touchAimLoupe: {
        ...baselineLoupe,
        visible: true,
        rect: { x: 177, y: 224, width: 128, height: 42 },
        armedPreviewReady: false
      }
    });
    const directory = writeCompleteRuntimeEvidence({
      tutorialOverrides: {
        loupePreview: null
      },
      endlessCleanOverrides: {
        loupePreview: unsafeLoupe
      }
    });
    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("tutorial touch assist preview: missing active touch assist preview evidence.");
    expect(evaluation.issues).toContain("endless touch assist preview floating loupe hidden: expected false, got true.");
    expect(evaluation.issues).toContain("endless touch assist preview armed preview ready: expected true, got false.");
    expect(evaluation.issues).toContain("endless touch assist preview floating loupe rect: expected no detached rect, got 128x42.");
  });

  it("rejects missing screenshots and missing evidence fields", () => {
    const directory = mkdtempSync(join(tmpdir(), "tt-mobile-runtime-thin-"));
    writeFileSync(
      join(directory, "cua-flow-result.json"),
      JSON.stringify({
        targetSlots: [],
        afterCuts: { cutCount: 1, resolveReady: false },
        afterResolve: { feedbackVisible: false, feedbackText: "" }
      }),
      "utf8"
    );

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(`cua-flow-review.png screenshot image is missing: ${join(directory, "cua-flow-review.png")}.`);
    expect(evaluation.issues).toContain(`Evidence JSON is missing: ${join(directory, "cua-endless-flow-clean-result.json")}.`);
    expect(evaluation.issues).toContain("tutorial target slots: expected 5 staged target slots.");
    expect(evaluation.issues).toContain("tutorial afterCuts cutCount: expected 5, got 1.");
  });

  it("rejects placeholder runtime screenshots that are not real image evidence", () => {
    const directory = writeCompleteRuntimeEvidence();
    writeFileSync(join(directory, "cua-feedback-card-readable-phone.png"), "placeholder", "utf8");

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `cua-feedback-card-readable-phone.png screenshot must be PNG or JPEG image evidence: ${join(directory, "cua-feedback-card-readable-phone.png")}.`
    );
  });

  it("rejects runtime screenshots captured at the wrong viewport size", () => {
    const directory = writeCompleteRuntimeEvidence();
    writeFileSync(join(directory, "cua-flow-review.png"), jpegEvidence(390, 844));

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("cua-flow-review.png screenshot image width: expected 368, got 390.");
    expect(evaluation.issues).toContain("cua-flow-review.png screenshot image height: expected 552, got 844.");
  });

  it("rejects listed runtime screenshots without QA sidecar geometry", () => {
    const directory = writeCompleteRuntimeEvidence();
    writeFileSync(join(directory, "cua-endless-review-clean.json"), "{}", "utf8");

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `endless clean artifacts: ${join(directory, "cua-endless-review-clean.png")} sidecar must include QA element geometry.`
    );
  });

  it("rejects listed review screenshots whose sidecars omit feedback evidence geometry", () => {
    const directory = writeCompleteRuntimeEvidence();
    writeFileSync(join(directory, "cua-endless-review-held-tight.json"), qaSidecarJson({ omit: ["feedbackTokenSplit"] }), "utf8");

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `endless held artifacts: ${join(directory, "cua-endless-review-held-tight.png")} sidecar is missing feedbackTokenSplit geometry.`
    );
  });

  it("rejects listed runtime sidecars with undersized mobile controls", () => {
    const directory = writeCompleteRuntimeEvidence();
    writeFileSync(
      join(directory, "cua-endless-auto-check-next-round.json"),
      qaSidecarJson({ phase: "active", rectOverrides: { resolveButton: { width: 40 } } }),
      "utf8"
    );

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `endless auto artifacts: ${join(directory, "cua-endless-auto-check-next-round.png")} sidecar resolveButton: touch target must be at least 44px wide and high.`
    );
  });

  it("rejects listed review sidecars with blank semantic feedback regions", () => {
    const directory = writeCompleteRuntimeEvidence();
    writeFileSync(
      join(directory, "cua-endless-review-held-tight.json"),
      qaSidecarJson({ textOverrides: { feedbackCard: "", feedbackTokenSplit: "" } }),
      "utf8"
    );

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `endless held artifacts: ${join(directory, "cua-endless-review-held-tight.png")} sidecar feedbackCard: missing feedback evidence text.`
    );
    expect(evaluation.issues).toContain(
      `endless held artifacts: ${join(directory, "cua-endless-review-held-tight.png")} sidecar feedbackTokenSplit: missing visible token split text.`
    );
  });

  it("rejects listed review sidecars without current Wiener review speech", () => {
    const directory = writeCompleteRuntimeEvidence();
    writeFileSync(
      join(directory, "cua-endless-review-clean.json"),
      qaSidecarJson({
        mode: "endless",
        phase: "review",
        omit: ["petSpeechBubble"]
      }),
      "utf8"
    );

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `endless clean artifacts: ${join(directory, "cua-endless-review-clean.png")} sidecar is missing petSpeechBubble geometry.`
    );
  });

  it("does not require review speech from active next-round sidecars", () => {
    const directory = writeCompleteRuntimeEvidence();
    writeFileSync(
      join(directory, "cua-endless-auto-check-next-round.json"),
      qaSidecarJson({
        mode: "endless",
        phase: "active",
        omit: ["petSpeechBubble"]
      }),
      "utf8"
    );

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(true);
    expect(evaluation.issues).toEqual([]);
  });

  it.each([
    "brandPanel",
    "assistantPanel",
    "footerPanel",
    "overseer",
    "tutorialPopup",
    "tokenStrip",
    "segmentationEvidence"
  ])("rejects retired runtime sidecar element ID %s", (retiredId) => {
    const directory = writeCompleteRuntimeEvidence();
    const sidecar = JSON.parse(qaSidecarJson()) as { elements: QaSidecarElement[] };
    sidecar.elements.push(element(retiredId, 184, 240, 120, 44));
    writeFileSync(join(directory, "cua-endless-review-clean.json"), JSON.stringify(sidecar), "utf8");

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `endless clean artifacts: ${join(directory, "cua-endless-review-clean.png")} sidecar includes retired element ID ${retiredId}.`
    );
  });

  it("rejects review sidecars where the feedback card crowds the bottom controls", () => {
    const directory = writeCompleteRuntimeEvidence();
    writeFileSync(
      join(directory, "cua-feedback-card-readable-phone.json"),
      qaSidecarJson({
        rectOverrides: {
          feedbackCard: { y: 430, height: 132 }
        }
      }),
      "utf8"
    );

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `cua-feedback-card-readable-phone.png screenshot: cua-feedback-card-readable-phone.png sidecar: feedbackCard must leave at least 8px above bottom controls, got 0px.`
    );
  });

  it("rejects endless evidence when the mobile route drifts off the pinned browser fixture", () => {
    const directory = writeCompleteRuntimeEvidence({
      endlessCleanOverrides: {
        targetBoundaries: [2, 5],
        initial: {
          mode: "endless",
          phase: "active",
          round: 1,
          fixtureId: "other_fixture",
          viewport: { width: 390, height: 844 }
        }
      }
    });

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("endless target boundaries: expected [3, 7, 11, 14, 18].");
    expect(evaluation.issues).toContain("endless initial fixture: expected simple_001, got other_fixture.");
    expect(evaluation.issues).toContain("endless initial viewport width: expected 368, got 390.");
  });

  it("rejects stale readable-feedback evidence from the old ultra-tight mobile card", () => {
    const directory = writeCompleteRuntimeEvidence({
      readableFeedbackOverrides: {
        feedbackCard: { width: 336, height: 104 }
      }
    });

    const evaluation = evaluateMobileRuntimeEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "readable feedback card: height must be at least 132px so mobile evidence copy is readable."
    );
  });

  it("parses CLI arguments and renders command-line output", () => {
    expect(parseMobileRuntimeEvidenceArgs(["--dir", ".qa/custom"])).toBe(".qa/custom");
    expect(parseMobileRuntimeEvidenceArgs(["--dir=.qa/inline"])).toBe(".qa/inline");
    expect(parseMobileRuntimeEvidenceArgs([".qa/positional"])).toBe(".qa/positional");

    const output = renderMobileRuntimeEvidenceEvaluation(evaluateMobileRuntimeEvidence("/missing/mobile-runtime"));

    expect(output).toContain("Tokenizer Training mobile runtime evidence");
    expect(output).toContain("Decision: browser/mobile runtime evidence incomplete");
    expect(output).toContain("Issues:");
  });
});

interface RuntimeEvidenceOverrides {
  tutorialOverrides?: Record<string, unknown>;
  endlessCleanOverrides?: Record<string, unknown>;
  readableFeedbackOverrides?: Record<string, unknown>;
}

interface QaSidecarElement {
  id: string;
  rect: { x: number; y: number; width: number; height: number };
  text: string;
}

function writeCompleteRuntimeEvidence(overrides: RuntimeEvidenceOverrides = {}): string {
  const directory = mkdtempSync(join(tmpdir(), "tt-mobile-runtime-"));
  const artifacts = [
    { name: "cua-flow-review", mode: "tutorial", phase: "review" },
    { name: "cua-endless-review-clean", mode: "endless", phase: "review" },
    { name: "cua-endless-auto-next-round", mode: "endless", phase: "active" },
    { name: "cua-endless-review-held-tight", mode: "endless", phase: "review" },
    { name: "cua-endless-auto-check-next-round", mode: "endless", phase: "active" },
    { name: "cua-feedback-card-readable-phone", mode: "endless", phase: "review" }
  ] as const;
  for (const artifact of artifacts) {
    writeFileSync(join(directory, `${artifact.name}.png`), jpegEvidence(368, 552));
    writeFileSync(
      join(directory, `${artifact.name}.json`),
      qaSidecarJson({ mode: artifact.mode, phase: artifact.phase }),
      "utf8"
    );
  }

  writeJson(directory, "cua-flow-result.json", {
    ...tutorialEvidence(),
    ...overrides.tutorialOverrides
  });
  writeJson(directory, "cua-endless-flow-clean-result.json", {
    ...endlessCleanEvidence(directory),
    ...overrides.endlessCleanOverrides
  });
  writeJson(directory, "cua-endless-review-held-tight-result.json", endlessHeldEvidence(directory));
  writeJson(directory, "cua-endless-auto-check-result.json", endlessAutoEvidence(directory));
  writeJson(directory, "cua-feedback-card-readable-phone-result.json", {
    ...readableFeedbackEvidence(),
    ...overrides.readableFeedbackOverrides
  });

  return directory;
}

function readableFeedbackEvidence(): Record<string, unknown> {
  return {
    url: "http://127.0.0.1:5173/?surface=mobile&mode=endless&playtestReset=1&qaViewport=368x552&qaFixtureId=simple_001&qaHoldReview=1",
    browserViewport: { width: 368, height: 552 },
    phase: "review",
    cutCount: 3,
    feedbackCard: { width: 336, height: 140 },
    feedbackText: feedbackText(),
    feedbackTokenSplit: { width: 297, height: 24 },
    limitations: {
      partialCutRun: true,
      purpose: "targeted mobile feedback-card readability geometry after source layout change"
    }
  };
}

function writeJson(directory: string, filename: string, value: unknown): void {
  writeFileSync(join(directory, filename), JSON.stringify(value, null, 2), "utf8");
}

function tutorialEvidence(): Record<string, unknown> {
  return {
    targetSlots: Array.from({ length: 5 }, (_, index) => ({ width: 52, height: 73, x: 90 + index * 40, y: 316 })),
    loupePreview: loupePreviewEvidence(),
    afterCuts: {
      cutCount: 5,
      resolveReady: true
    },
    afterResolve: {
      scene: "PlayScene",
      phase: "review",
      cutCount: 5,
      feedbackVisible: true,
      feedbackCard: { width: 336, height: 104 },
      feedbackText: feedbackText(),
      state: {
        allPlayControlTouchTargetsOk: true
      }
    }
  };
}

function endlessCleanEvidence(directory: string): Record<string, unknown> {
  return {
    url: "http://127.0.0.1:5173/?surface=mobile&mode=endless&playtestReset=1&qaViewport=368x552&qaFixtureId=simple_001",
    targetBoundaries: [3, 7, 11, 14, 18],
    initial: {
      mode: "endless",
      phase: "active",
      round: 1,
      fixtureId: "simple_001",
      viewport: { width: 368, height: 552 }
    },
    loupePreview: loupePreviewEvidence(),
    afterCuts: endlessAfterCuts(),
    review: {
      ...endlessReview(),
      rendererQaCapture: true,
      rendererQaCaptureStatus: "ok",
      canvasCapture: {
        chunkCount: 12,
        dataUrlLength: 20000,
        dataUrlHash: "abcd1234"
      }
    },
    autoNext: autoNext(),
    artifacts: [
      join(directory, "cua-endless-review-clean.png"),
      join(directory, "cua-endless-review-clean.json"),
      join(directory, "cua-endless-auto-next-round.png"),
      join(directory, "cua-endless-auto-next-round.json")
    ]
  };
}

function endlessHeldEvidence(directory: string): Record<string, unknown> {
  const review = endlessReview();

  return {
    url: "http://127.0.0.1:5173/?surface=mobile&mode=endless&qaFixtureId=simple_001&qaHoldReview=1",
    afterCuts: endlessAfterCuts(),
    review: {
      ...review,
      feedbackTokenSplit: { width: 274, height: 22 }
    },
    artifacts: [join(directory, "cua-endless-review-held-tight.png"), join(directory, "cua-endless-review-held-tight.json")]
  };
}

function endlessAutoEvidence(directory: string): Record<string, unknown> {
  return {
    url: "http://127.0.0.1:5173/?surface=mobile&mode=endless&qaFixtureId=simple_001",
    afterCuts: endlessAfterCuts(),
    reviewWindow: {
      scene: "PlayScene",
      phase: "review",
      feedbackVisible: true,
      feedbackText: feedbackText()
    },
    autoNext: autoNext(),
    artifacts: [
      join(directory, "cua-endless-auto-check-next-round.png"),
      join(directory, "cua-endless-auto-check-next-round.json")
    ]
  };
}

function loupePreviewEvidence(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    scene: "PlayScene",
    mode: "tutorial",
    phase: "active",
    round: 1,
    fixtureId: "simple_001",
    cutCount: 0,
    inputModality: "mouse",
    inputFeelCutCount: 0,
    resolveReady: false,
    allTouchTargetsOk: true,
    feedbackVisible: false,
    viewport: { width: 368, height: 552 },
    state: {
      touchAimLoupeVisible: false,
      touchAimLoupeBoundary: null,
      touchAimLoupeSnapReady: false,
      touchAimLoupePointerClearancePx: null,
      touchAimLoupeOcclusionSafe: false,
      touchAimLoupePlacement: "hidden",
      armedPreviewBoundary: 3,
      armedPreviewReady: true
    },
    touchAimLoupe: {
      visible: false,
      boundary: null,
      snapReady: false,
      pointerClearancePx: null,
      occlusionSafe: false,
      placement: "hidden",
      text: "",
      rect: null,
      armedPreviewBoundary: 3,
      armedPreviewReady: true,
      armedPreviewStrength: 1,
      armedPreviewRect: { x: 105, y: 300, width: 56, height: 73 }
    },
    resolveButton: { x: 313, y: 518, width: 78, height: 44 },
    activeLabels: [],
    ...overrides
  };
}

function endlessAfterCuts(): Record<string, unknown> {
  return {
    mode: "endless",
    phase: "active",
    round: 1,
    fixtureId: "simple_001",
    cutCount: 5,
    inputFeelCutCount: 5,
    resolveReady: true,
    allTouchTargetsOk: true
  };
}

function endlessReview(): Record<string, unknown> {
  return {
    scene: "PlayScene",
    mode: "endless",
    phase: "review",
    round: 1,
    fixtureId: "simple_001",
    cutCount: 5,
    feedbackVisible: true,
    feedbackText: feedbackText(),
    feedbackCard: { width: 336, height: 104 },
    allTouchTargetsOk: true
  };
}

function autoNext(): Record<string, unknown> {
  return {
    scene: "PlayScene",
    mode: "endless",
    phase: "active",
    round: 2,
    fixtureId: "simple_001",
    cutCount: 0,
    feedbackVisible: false,
    allTouchTargetsOk: true
  };
}

function feedbackText(): string {
  return "RESOLVED TOKENS 6\nthe │ ␠cat │ ␠sat │ ␠on │ ␠the │ ␠mat\nVERIFIED +6 TC   REWORK -0 TC\nNET +6 TC\nOK 5          MISS 0          FALSE 0";
}

function compactFeedbackText(): string {
  return feedbackText();
}

function qaSidecarJson(options: {
  mode?: "tutorial" | "endless";
  phase?: "active" | "review";
  omit?: string[];
  rectOverrides?: Record<string, Partial<QaSidecarElement["rect"]>>;
  textOverrides?: Record<string, string>;
} = {}): string {
  const mode = options.mode ?? "endless";
  const phase = options.phase ?? "review";
  const omitted = new Set(options.omit ?? []);
  const elements = [
    element("hud", 184, 68, 344, 112),
    element("playfield", 184, 316, 344, 260),
    element("textPanel", 184, 280, 336, 96),
    element("text", 184, 280, 251, 18),
    element("resolveButton", 313, 518, 78, 44),
    element("clearButton", 141, 518, 78, 44),
    element("muteButton", 55, 518, 78, 44),
    element("exitButton", 227, 518, 78, 44),
    element("cutStatus", 184, 319, 65, 17),
    element("petWiener", 314, 156, 48, 62),
    element("feedbackCard", 184, 414, 336, 140),
    ...(phase === "review"
      ? [
          element("feedbackTokenSplit", 184, 390, 297, 42),
          element("petSpeechBubble", 160, 157, 240, 58)
        ]
      : [])
  ].filter((item) => !omitted.has(item.id)).map((item) => ({
    ...item,
    rect: { ...item.rect, ...options.rectOverrides?.[item.id] },
    text: options.textOverrides?.[item.id] ?? item.text
  }));
  return JSON.stringify({
    scene: "PlayScene",
    compact: true,
    state: { mode, phase },
    elements
  });
}

function element(id: string, x: number, y: number, width: number, height: number): QaSidecarElement {
  const textById: Record<string, string> = {
    text: "the cat sat on the mat",
    cutStatus: "NO CUTS",
    resolveButton: "Review",
    clearButton: "Clear",
    muteButton: "Sound",
    exitButton: "Exit",
    feedbackCard: compactFeedbackText(),
    feedbackTokenSplit: "RESOLVED TOKENS 6\nthe │ ␠cat │ ␠sat │ ␠on │ ␠the │ ␠mat",
    petSpeechBubble: "The prompt was handled without incident."
  };

  return {
    id,
    rect: { x, y, width, height },
    text: textById[id] ?? ""
  };
}

function jpegEvidence(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(4_000, 0);
  fillEncodedPayload(bytes);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  bytes[3] = 0xc0;
  bytes.writeUInt16BE(17, 4);
  bytes[6] = 8;
  bytes.writeUInt16BE(height, 7);
  bytes.writeUInt16BE(width, 9);
  bytes[bytes.length - 2] = 0xff;
  bytes[bytes.length - 1] = 0xd9;
  return bytes;
}

function fillEncodedPayload(bytes: Buffer): void {
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = (index * 37 + 19) % 256;
  }
}
