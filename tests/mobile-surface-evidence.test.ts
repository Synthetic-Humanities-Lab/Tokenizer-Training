import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  evaluateMobileSurfaceEvidence,
  parseMobileSurfaceEvidenceArgs,
  renderMobileSurfaceEvidenceEvaluation
} from "../scripts/evaluate-mobile-surface-evidence";

const retiredQaElementIds = [
  "brandPanel",
  "assistantPanel",
  "footerPanel",
  "overseer",
  "tutorialPopup",
  "tokenStrip",
  "segmentationEvidence"
] as const;

const screenshotArtifacts = [
  { file: "browser-desktop-tutorial-active-fresh.png", width: 1280, height: 720 },
  { file: "mobile-surface-tutorial-active-small-fresh.png", width: 368, height: 552 },
  { file: "mobile-surface-tutorial-active-large-after.png", width: 390, height: 844 },
  { file: "browser-desktop-endless-pinned-simple-001.png", width: 1280, height: 720 },
  { file: "mobile-surface-endless-pinned-simple-001.png", width: 368, height: 552 },
  { file: "mobile-surface-results-small-after.png", width: 368, height: 552 }
] as const;

describe("mobile surface evidence evaluator", () => {
  it("accepts desktop/mobile surface evidence when browser contract and mobile optimization both hold", () => {
    const directory = writeCompleteSurfaceEvidence();
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(true);
    expect(evaluation.issues).toEqual([]);
    expect(evaluation.checkedFiles).toContain(join(directory, "browser-desktop-tutorial-active-fresh.json"));
    expect(evaluation.checkedFiles).toContain(join(directory, "browser-desktop-tutorial-active-fresh.png"));
    expect(evaluation.checkedFiles).toHaveLength(12);
  });

  it("rejects text placeholders presented as screenshot evidence", () => {
    const directory = writeCompleteSurfaceEvidence();
    const path = join(directory, "mobile-surface-tutorial-active-small-fresh.png");
    writeFileSync(path, "png", "utf8");

    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `mobile-surface-tutorial-active-small-fresh.png screenshot must be PNG or JPEG image evidence: ${path}.`
    );
  });

  it("rejects screenshot evidence captured at the wrong route dimensions", () => {
    const directory = writeCompleteSurfaceEvidence();
    const path = join(directory, "mobile-surface-tutorial-active-small-fresh.png");
    writeFileSync(path, pngEvidence(367, 552, true));

    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "mobile-surface-tutorial-active-small-fresh.png screenshot image width: expected 368, got 367."
    );
  });

  it("rejects blank screenshot evidence with too little encoded visual variation", () => {
    const directory = writeCompleteSurfaceEvidence();
    const path = join(directory, "mobile-surface-tutorial-active-small-fresh.png");
    writeFileSync(path, pngEvidence(368, 552, false));

    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues.some((issue) => (
      issue.includes("mobile-surface-tutorial-active-small-fresh.png screenshot")
      && issue.includes("may be blank")
    ))).toBe(true);
  });

  it("rejects prompt drift between the desktop browser and mobile surface", () => {
    const directory = writeCompleteSurfaceEvidence({
      mobileTutorialText: "a different prompt"
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "tutorial active desktop/mobile prompt text parity: expected a different prompt, got the cat sat on the mat."
    );
  });

  it("rejects missing surface artifacts and non-mobile results geometry", () => {
    const directory = mkdtempSync(join(tmpdir(), "tt-mobile-surface-thin-"));
    writeJson(directory, "mobile-surface-results-small-after.json", resultsEvidence({ buttonHeight: 30 }));

    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `Evidence file is missing: ${join(directory, "browser-desktop-tutorial-active-fresh.json")}.`
    );
    expect(evaluation.issues).toContain("mobile results copyButton: touch target must be at least 44px wide and high.");
  });

  it("rejects mobile results summaries that omit copied input-feel evidence", () => {
    const directory = writeCompleteSurfaceEvidence({
      resultsSummaryText: "Tokenizer Training playtest summary\nBest saved: 7 rounds / Regex Intern"
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "mobile results copied summary: expected copySummaryPayload text to include Input feel trace:."
    );
    expect(evaluation.issues).toContain(
      "mobile results copied summary: expected copySummaryPayload text to include Input feel fields: first-cut latency."
    );
  });

  it("rejects mobile budget results metrics that regress to cramped cards", () => {
    const directory = writeCompleteSurfaceEvidence({
      resultsMetricHeight: 28
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("mobile results metric-rank: expected height at least 40px, got 28px.");
  });

  it("rejects a quit outcome presented as budget evidence", () => {
    const directory = writeCompleteSurfaceEvidence({
      resultsOutcome: "quit"
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("mobile results outcome: expected budget, got quit.");
  });

  it.each(["credits", "verified", "rework", "net", "yield"])(
    "rejects a forbidden %s card in mobile budget results",
    (metricId) => {
      const directory = writeCompleteSurfaceEvidence({
        additionalResultsMetricIds: [metricId]
      });
      const evaluation = evaluateMobileSurfaceEvidence(directory);

      expect(evaluation.ready).toBe(false);
      expect(evaluation.issues).toContain(`mobile budget results: expected metric-${metricId} to be absent.`);
    }
  );

  it("rejects a rank card that disagrees with the QA state rank", () => {
    const directory = writeCompleteSurfaceEvidence({
      resultsRankMetricValue: "Junior Boundary Clerk"
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "mobile results rank card: expected RANK: Regex Intern, got RANK: Junior Boundary Clerk."
    );
  });

  it("rejects a summary that does not explain Token Credit depletion", () => {
    const directory = writeCompleteSurfaceEvidence({
      resultsOutcomeSummaryText: "Session closed by operator request."
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "mobile results summary: expected summary text to communicate Token Credit depletion and training closure."
    );
  });

  it("rejects any metric card outside the exact budget metric set", () => {
    const directory = writeCompleteSurfaceEvidence({
      additionalResultsMetricIds: ["debug"]
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "mobile budget results: expected metric IDs run, cuts, accuracy, rank, got run, cuts, accuracy, debug, rank."
    );
  });

  it("rejects mobile results evidence that drops required cut or rank metrics", () => {
    const directory = writeCompleteSurfaceEvidence({
      omitResultsMetrics: ["metric-cuts", "metric-rank"]
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("mobile results: missing metric-cuts QA element.");
    expect(evaluation.issues).toContain("mobile results: missing metric-rank QA element.");
  });

  it("rejects active play evidence without Wiener speech geometry", () => {
    const directory = writeCompleteSurfaceEvidence({
      omitMobileTutorialPetSpeechBubble: true
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("tutorial active desktop/mobile mobile: missing petSpeechBubble QA element.");
  });

  it("rejects active play evidence without substantive Wiener speech text", () => {
    const directory = writeCompleteSurfaceEvidence({
      mobileTutorialPetSpeechText: "  "
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "tutorial active desktop/mobile mobile Wiener speech: missing substantive petSpeechBubble text."
    );
  });

  it("rejects compact active play speech geometry that overlaps the HUD", () => {
    const directory = writeCompleteSurfaceEvidence({
      mobileTutorialPetSpeechRect: { x: 160, y: 124, width: 200, height: 60 }
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("tutorial active desktop/mobile mobile: petSpeechBubble must not overlap hud.");
  });

  it("rejects compact active play speech geometry that overlaps the timer", () => {
    const directory = writeCompleteSurfaceEvidence({
      mobileTutorialPetSpeechRect: { x: 160, y: 157, width: 240, height: 58 }
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("tutorial active desktop/mobile mobile: petSpeechBubble must not overlap timer.");
  });

  it.each(retiredQaElementIds)("rejects retired %s QA elements in active play evidence", (elementId) => {
    const directory = writeCompleteSurfaceEvidence({
      additionalMobileTutorialElementIds: [elementId]
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `mobile-surface-tutorial-active-small-fresh.json: retired QA element ${elementId} must be absent.`
    );
  });

  it.each(retiredQaElementIds)("rejects retired %s QA elements in current results evidence", (elementId) => {
    const directory = writeCompleteSurfaceEvidence({
      additionalResultsElementIds: [elementId]
    });
    const evaluation = evaluateMobileSurfaceEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `mobile-surface-results-small-after.json: retired QA element ${elementId} must be absent.`
    );
  });

  it("parses CLI arguments and renders command-line output", () => {
    expect(parseMobileSurfaceEvidenceArgs(["--dir", ".qa/custom-surface"])).toBe(".qa/custom-surface");
    expect(parseMobileSurfaceEvidenceArgs(["--dir=.qa/inline-surface"])).toBe(".qa/inline-surface");
    expect(parseMobileSurfaceEvidenceArgs([".qa/positional-surface"])).toBe(".qa/positional-surface");

    const output = renderMobileSurfaceEvidenceEvaluation(evaluateMobileSurfaceEvidence("/missing/mobile-surface"));

    expect(output).toContain("Tokenizer Training mobile surface evidence");
    expect(output).toContain("Decision: browser/mobile surface evidence incomplete");
    expect(output).toContain("Issues:");
  });
});

interface SurfaceEvidenceOverrides {
  mobileTutorialText?: string;
  mobileTutorialPetSpeechRect?: QaRect;
  mobileTutorialPetSpeechText?: string;
  omitMobileTutorialPetSpeechBubble?: boolean;
  additionalMobileTutorialElementIds?: string[];
  omitResultsMetrics?: string[];
  resultsMetricHeight?: number;
  resultsOutcome?: "budget" | "quit";
  resultsOutcomeSummaryText?: string;
  resultsRankMetricValue?: string;
  additionalResultsMetricIds?: string[];
  additionalResultsElementIds?: string[];
  resultsSummaryText?: string;
}

interface QaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function writeCompleteSurfaceEvidence(overrides: SurfaceEvidenceOverrides = {}): string {
  const directory = mkdtempSync(join(tmpdir(), "tt-mobile-surface-"));
  for (const artifact of screenshotArtifacts) {
    writeFileSync(join(directory, artifact.file), pngEvidence(artifact.width, artifact.height, true));
  }

  writeJson(
    directory,
    "browser-desktop-tutorial-active-fresh.json",
    playEvidence({
      compact: false,
      viewport: { width: 1280, height: 720 },
      mode: "tutorial",
      hudProgressLabel: "TUTORIAL",
      hudProgressCurrent: 1,
      hudProgressTarget: 10,
      promptText: "the cat sat on the mat"
    })
  );
  writeJson(
    directory,
    "mobile-surface-tutorial-active-small-fresh.json",
    playEvidence({
      compact: true,
      viewport: { width: 368, height: 552 },
      mode: "tutorial",
      hudProgressLabel: "TUTORIAL",
      hudProgressCurrent: 1,
      hudProgressTarget: 10,
      promptText: overrides.mobileTutorialText ?? "the cat sat on the mat",
      petSpeechText: overrides.mobileTutorialPetSpeechText,
      petSpeechRect: overrides.mobileTutorialPetSpeechRect,
      omitPetSpeechBubble: overrides.omitMobileTutorialPetSpeechBubble,
      additionalElementIds: overrides.additionalMobileTutorialElementIds
    })
  );
  writeJson(
    directory,
    "mobile-surface-tutorial-active-large-after.json",
    playEvidence({
      compact: true,
      viewport: { width: 390, height: 844 },
      mode: "tutorial",
      hudProgressLabel: "TUTORIAL",
      hudProgressCurrent: 1,
      hudProgressTarget: 10,
      promptText: "the cat sat on the mat"
    })
  );
  writeJson(
    directory,
    "browser-desktop-endless-pinned-simple-001.json",
    playEvidence({
      compact: false,
      viewport: { width: 1280, height: 720 },
      mode: "endless",
      hudProgressLabel: "SAMPLES",
      hudProgressCurrent: 0,
      hudProgressTarget: 200,
      promptText: "the cat sat on the mat"
    })
  );
  writeJson(
    directory,
    "mobile-surface-endless-pinned-simple-001.json",
    playEvidence({
      compact: true,
      viewport: { width: 368, height: 552 },
      mode: "endless",
      hudProgressLabel: "SAMPLES",
      hudProgressCurrent: 0,
      hudProgressTarget: 200,
      promptText: "the cat sat on the mat"
    })
  );
  writeJson(directory, "mobile-surface-results-small-after.json", resultsEvidence({
    omitMetrics: overrides.omitResultsMetrics,
    metricHeight: overrides.resultsMetricHeight,
    outcome: overrides.resultsOutcome,
    outcomeSummaryText: overrides.resultsOutcomeSummaryText,
    rankMetricValue: overrides.resultsRankMetricValue,
    additionalMetricIds: overrides.additionalResultsMetricIds,
    additionalElementIds: overrides.additionalResultsElementIds,
    summaryText: overrides.resultsSummaryText
  }));

  return directory;
}

function writeJson(directory: string, filename: string, value: unknown): void {
  writeFileSync(join(directory, filename), JSON.stringify(value, null, 2), "utf8");
}

function playEvidence(options: {
  compact: boolean;
  viewport: { width: number; height: number };
  mode: "tutorial" | "endless";
  hudProgressLabel: string;
  hudProgressCurrent: number;
  hudProgressTarget: number;
  promptText: string;
  petSpeechText?: string;
  petSpeechRect?: QaRect;
  omitPetSpeechBubble?: boolean;
  additionalElementIds?: string[];
}): Record<string, unknown> {
  return {
    summary: {
      scene: "PlayScene",
      compact: options.compact,
      viewport: options.viewport,
      state: {
        mode: options.mode,
        phase: "active",
        fixtureId: "simple_001",
        round: 1,
        cutCount: 0,
        legalSlotCount: 16,
        allPlayControlTouchTargetsOk: true,
        feedbackVisible: false,
        hudProgressLabel: options.hudProgressLabel,
        hudProgressCurrent: options.hudProgressCurrent,
        hudProgressTarget: options.hudProgressTarget
      }
    },
    pageCapture: {
      snapshot: {
        elements: playElements(options)
      }
    }
  };
}

function playElements(options: {
  compact: boolean;
  viewport: { width: number; height: number };
  mode: "tutorial" | "endless";
  promptText: string;
  petSpeechText?: string;
  petSpeechRect?: QaRect;
  omitPetSpeechBubble?: boolean;
  additionalElementIds?: string[];
}): Array<Record<string, unknown>> {
  const centerX = options.viewport.width / 2;
  const controlY = options.viewport.height - 34;
  const mobile = options.compact;
  const hudWidth = mobile ? 344 : 1240;
  const textWidth = mobile ? 251 : 476;
  const fontSize = mobile ? 19 : 36;

  const elements: Array<Record<string, unknown>> = [
    { id: "hud", rect: { x: centerX, y: mobile ? 68 : 54, width: hudWidth, height: mobile ? 112 : 84 } },
    { id: "brandMark", text: "WienerWorks", rect: { x: mobile ? 84 : 114, y: mobile ? 42 : 54, width: mobile ? 140 : 188, height: 40 } },
    { id: "logoWiener", rect: { x: mobile ? 32 : 38, y: mobile ? 42 : 54, width: 24, height: 30 } },
    { id: "playfield", rect: { x: centerX, y: mobile ? 316 : 344, width: mobile ? 344 : 1240, height: mobile ? 260 : 452 } },
    { id: "petWiener", rect: { x: mobile ? 314 : 1184, y: mobile ? 157 : 506, width: mobile ? 48 : 64, height: mobile ? 62 : 82 } },
    { id: "timer", rect: { x: centerX, y: mobile ? 178 : 104, width: mobile ? 312 : 1208, height: 8 } },
    { id: "textPanel", rect: { x: centerX, y: mobile ? 316 : 344, width: mobile ? 336 : 980, height: 96 } },
    { id: "text", text: options.promptText, fontSize, rect: { x: centerX, y: mobile ? 316 : 344, width: textWidth, height: mobile ? 18 : 33 } },
    { id: "cutStatus", text: "NO CUTS", rect: { x: centerX, y: mobile ? 355 : 383, width: mobile ? 67 : 75, height: mobile ? 17 : 20 } },
    { id: "resolveButton", text: "Resolve", rect: { x: mobile ? 313 : 1156, y: controlY, width: mobile ? 78 : 180, height: 44 } },
    { id: "clearButton", text: mobile ? "Clear" : "Clear Cuts", rect: { x: mobile ? 141 : 992, y: controlY, width: mobile ? 78 : 112, height: 44 } },
    { id: "muteButton", text: "Sound", rect: { x: mobile ? 55 : 712, y: controlY, width: mobile ? 78 : 112, height: 44 } },
    { id: "exitButton", text: mobile ? "Exit" : options.mode === "tutorial" ? "Exit Tutorial" : "Exit Training", rect: { x: mobile ? 227 : 852, y: controlY, width: mobile ? 78 : 132, height: 44 } }
  ];

  if (!options.omitPetSpeechBubble) {
    elements.splice(5, 0, {
      id: "petSpeechBubble",
      text: options.petSpeechText ?? (options.mode === "tutorial" ? "Swipe targets; pale guides mark slots; Resolve submits." : "Segmentation window available."),
      rect: options.petSpeechRect ?? { x: mobile ? 160 : 939, y: mobile ? 219 : 408, width: mobile ? 240 : 390, height: mobile ? 58 : 64 }
    });
  }

  elements.push(...(options.additionalElementIds ?? []).map((id) => ({ id })));

  return elements;
}

function resultsEvidence(options: {
  buttonHeight?: number;
  omitMetrics?: string[];
  metricHeight?: number;
  outcome?: "budget" | "quit";
  outcomeSummaryText?: string;
  rankMetricValue?: string;
  additionalMetricIds?: string[];
  additionalElementIds?: string[];
  summaryText?: string;
} = {}): Record<string, unknown> {
  const buttonHeight = options.buttonHeight ?? 44;
  const omittedMetrics = new Set(options.omitMetrics ?? []);
  const metricHeight = options.metricHeight ?? 42;
  const metricElements = [
    { id: "metric-run", text: "RUN: 7 rounds", rect: metricRect(110, 222, 140, metricHeight) },
    { id: "metric-cuts", text: "CUTS: OK 5 / M 3 / F 2", rect: metricRect(258, 222, 140, metricHeight) },
    { id: "metric-accuracy", text: "ACCURACY: 50%", rect: metricRect(110, 270, 140, metricHeight) },
    ...(options.additionalMetricIds ?? []).map((id) => ({
      id: `metric-${id}`,
      text: `${id.toUpperCase()}: QA ONLY`,
      rect: metricRect(184, 318, 288, metricHeight)
    })),
    {
      id: "metric-rank",
      text: `RANK: ${options.rankMetricValue ?? "Regex Intern"}`,
      rect: metricRect(258, 270, 140, metricHeight)
    }
  ].filter((element) => !omittedMetrics.has(element.id));

  return {
    summary: {
      scene: "ResultsScene",
      compact: true,
      viewport: { width: 368, height: 552 },
      state: {
        outcome: options.outcome ?? "budget",
        rank: "Regex Intern",
        rounds: 7
      }
    },
    pageCapture: {
      snapshot: {
        elements: [
          { id: "panel", rect: { x: 184, y: 276, width: 336, height: 508 } },
          { id: "title", text: "Token Credits Depleted", rect: { x: 184, y: 114, width: 300, height: 35 } },
          {
            id: "summary",
            text:
              options.outcomeSummaryText ??
              "Your account no longer contains enough Token Credits to correct your output. Training access revoked.",
            rect: { x: 184, y: 164, width: 264, height: 64 }
          },
          ...metricElements,
          {
            id: "copySummaryPayload",
            text: options.summaryText ?? [
              "Tokenizer Training playtest summary",
              "Outcome: token-credits-depleted",
              "Rounds: 7",
              "Accuracy: 50%",
              "Cuts: OK 5 / Missed 3 / False 2",
              "Input feel trace:",
              "Input feel fields: first-cut latency, resolve timing after first/last cut, cut batch ownership, release-sample/correction ownership, no-cut acknowledgements, touch-loupe clearance.",
              "1. samples 5 / responses 2 / first 32ms / resolve-first 420ms / resolve-last 180ms / commit 1 / batch 1 / release-latched 1 / last-source release / adjusted 0 / gesture-samples 5 / owned-cuts 2 / no-cut 0 / near 0 / off 0 / loupe 4 / ready 3 / low-clear 0 / min-clear 42px",
              "Verified: +21 TC",
              "Rework: -61 TC",
              "Net Credits: -40 TC",
              "Credits Remaining: 0 TC",
              "Rank: Regex Intern",
              "Best saved: 7 rounds / Regex Intern"
            ].join("\n")
          },
          { id: "copyButton", text: "Copy Summary", rect: { x: 184, y: 392, width: 280, height: buttonHeight } },
          { id: "againButton", text: "Run Training Again", rect: { x: 184, y: 444, width: 280, height: buttonHeight } },
          { id: "menuButton", text: "Return to Menu", rect: { x: 184, y: 496, width: 280, height: buttonHeight } },
          ...(options.additionalElementIds ?? []).map((id) => ({ id }))
        ]
      }
    }
  };
}

function metricRect(x: number, y: number, width = 140, height = 28): Record<string, number> {
  return { x, y, width, height };
}

function pngEvidence(width: number, height: number, varied: boolean): Buffer {
  const rowSize = width + 1;
  const scanlines = Buffer.alloc(rowSize * height);
  if (varied) {
    for (let y = 0; y < height; y += 1) {
      const rowOffset = y * rowSize;
      for (let x = 0; x < width; x += 1) {
        scanlines[rowOffset + x + 1] = (x * 13 + y * 29 + Math.floor(x / 7) * 11) % 256;
      }
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines, { level: varied ? 6 : 0 })),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return chunk;
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
