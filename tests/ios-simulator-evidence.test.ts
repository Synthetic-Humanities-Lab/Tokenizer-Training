import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateIosSimulatorEvidence,
  parseIosSimulatorEvidenceArgs,
  renderIosSimulatorEvidenceEvaluation
} from "../scripts/evaluate-ios-simulator-evidence";

describe("iOS simulator evidence evaluator", () => {
  it("accepts structurally valid native artifacts for canvas and required semantic routes", () => {
    const directory = writeSimulatorEvidence();
    const evaluation = evaluateIosSimulatorEvidence(directory);

    expect(evaluation.ready).toBe(true);
    expect(evaluation.issues).toEqual([]);
    expect(evaluation.checkedFiles).toContain(join(directory, "manifest.json"));
    expect(evaluation.checkedFiles).toContain(join(directory, "endless-active.jpg"));
    expect(evaluation.checkedFiles).toContain(join(directory, "settings-reset-confirm.jpg"));
    expect(evaluation.checkedFiles).toContain(join(directory, "token-log.jpg"));
    expect(evaluation.checkedFiles).toContain(join(directory, "tutorial-failed.jpg"));
    expect(evaluation.checkedFiles).toContain(join(directory, "semantic-token-log.jpg"));
    expect(evaluation.checkedFiles).toContain(join(directory, "semantic-settings.jpg"));
    expect(evaluation.checkedFiles).toContain(join(directory, "semantic-settings-reset-confirm.jpg"));
  });

  it("rejects missing screenshots and route drift", () => {
    const directory = writeSimulatorEvidence({
      skipScreenshot: "results.jpg",
      endlessLaunchArgs: ["--tt-query", "playtestReset=1"]
    });
    const evaluation = evaluateIosSimulatorEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(`iOS simulator screenshot image is missing: ${join(directory, "results.jpg")}.`);
    expect(evaluation.issues).toContain("endless-active launchArgs: expected mode=endless.");
  });

  it("requires the dedicated confirmation layout route", () => {
    const directory = writeSimulatorEvidence({
      settingsResetLaunchArgs: ["--tt-query", "mode=settings&playtestReset=1"]
    });

    expect(evaluateIosSimulatorEvidence(directory).issues).toContain(
      "settings-reset-confirm launchArgs: expected mode=settings-reset-confirm."
    );
  });

  it.each([
    ["qaFixtureId", "simple_001"],
    ["qaFreezeElapsedMs", "2000"],
    ["qaHoldReview", "1"],
    ["qaCanvasCapture", "1"],
    ["qaViewport", "368x800"]
  ])("rejects browser-only QA parameter %s in native launch metadata", (name, value) => {
    const directory = writeSimulatorEvidence({
      endlessLaunchArgs: ["--tt-query", `mode=endless&playtestReset=1&${name}=${value}`]
    });
    const evaluation = evaluateIosSimulatorEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `endless-active launchArgs: browser-only QA parameter ${name} is forbidden in native simulator evidence.`
    );
  });

  it("matches launch parameter names rather than incidental prose in values", () => {
    const directory = writeSimulatorEvidence({
      endlessLaunchArgs: [
        "--tt-query",
        "mode=endless&playtestReset=1&note=qaFixtureId%3Dsimple_001%20qaFreezeElapsedMs%3D2000"
      ]
    });

    expect(evaluateIosSimulatorEvidence(directory).ready).toBe(true);
  });

  it("rejects contradictory duplicate native modes", () => {
    const directory = writeSimulatorEvidence({
      endlessLaunchArgs: ["--tt-query", "mode=endless&mode=tutorial&playtestReset=1"]
    });

    expect(evaluateIosSimulatorEvidence(directory).issues).toContain(
      "endless-active launchArgs: expected mode=endless."
    );
  });

  it("rejects screenshot artifacts that are not real simulator images", () => {
    const directory = writeSimulatorEvidence({
      screenshotBytes: {
        "default-menu.jpg": Buffer.from("not an image", "utf8")
      }
    });
    const evaluation = evaluateIosSimulatorEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `iOS simulator screenshot must be PNG or JPEG image evidence: ${join(directory, "default-menu.jpg")}.`
    );
  });

  it("rejects simulator screenshots that do not match the recorded screen size", () => {
    const directory = writeSimulatorEvidence({
      screenshotBytes: {
        "tutorial-active.jpg": jpegEvidence(320, 568)
      }
    });
    const evaluation = evaluateIosSimulatorEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("iOS simulator screenshot image width: expected 368, got 320.");
    expect(evaluation.issues).toContain("iOS simulator screenshot image height: expected 800, got 568.");
  });

  it("rejects one encoded screenshot reused for multiple declared routes", () => {
    const duplicate = jpegEvidence(368, 800, 99);
    const directory = writeSimulatorEvidence({
      screenshotBytes: {
        "default-menu.jpg": duplicate,
        "semantic-token-log.jpg": duplicate
      }
    });
    const evaluation = evaluateIosSimulatorEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "iOS simulator route screenshots reuse identical encoded image bytes: default-menu.jpg, semantic-token-log.jpg."
    );
  });

  it("requires simulator evidence to keep physical proof claims false", () => {
    const directory = writeSimulatorEvidence({
      physicalTouchProven: true,
      resetPointerActivationProven: true,
      resetCancelPointerActivationProven: true,
      resetConfirmedDeletionPointerActivationProven: true,
      resetFailureStateVisuallyObserved: true
    });
    const evaluation = evaluateIosSimulatorEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("limitations.physicalTouchProven: simulator evidence must explicitly remain false.");
    expect(evaluation.issues).toContain(
      "limitations.resetPointerActivationProven: direct-route layout evidence must explicitly remain false."
    );
    expect(evaluation.issues).toContain(
      "limitations.resetCancelPointerActivationProven: direct-route layout evidence must explicitly remain false."
    );
    expect(evaluation.issues).toContain(
      "limitations.resetConfirmedDeletionPointerActivationProven: direct-route layout evidence must explicitly remain false."
    );
    expect(evaluation.issues).toContain(
      "limitations.resetFailureStateVisuallyObserved: direct-route layout evidence must explicitly remain false."
    );
  });

  it("requires semantic route metadata and keeps VoiceOver activation unproven", () => {
    const directory = writeSimulatorEvidence({
      semanticTokenLogLaunchArgs: ["--tt-query", "mode=token-log&playtestReset=1"],
      voiceOverActivationProven: true
    });
    const evaluation = evaluateIosSimulatorEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "semantic-token-log launchArgs: expected semanticUi=visible."
    );
    expect(evaluation.issues).toContain(
      "limitations.voiceOverActivationProven: simulator evidence must explicitly remain false."
    );
  });

  it("requires both semantic Settings routes and bounded proof claims", () => {
    const directory = writeSimulatorEvidence({
      semanticSettingsLaunchArgs: ["--tt-query", "mode=settings&playtestReset=1"],
      semanticSettingsResetLaunchArgs: [
        "--tt-query",
        "mode=settings&semanticUi=visible&playtestReset=1"
      ],
      settingsSemanticVisualContentAutomaticallyProven: true,
      settingsSemanticKeyboardActivationProven: true,
      settingsSemanticVoiceOverActivationProven: true
    });
    const evaluation = evaluateIosSimulatorEvidence(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("semantic-settings launchArgs: expected semanticUi=visible.");
    expect(evaluation.issues).toContain(
      "semantic-settings-reset-confirm launchArgs: expected mode=settings-reset-confirm."
    );
    expect(evaluation.issues).toContain(
      "limitations.settingsSemanticVisualContentAutomaticallyProven: image structure cannot prove route-specific content."
    );
    expect(evaluation.issues).toContain(
      "limitations.settingsSemanticKeyboardActivationProven: screenshot evidence must explicitly remain false."
    );
    expect(evaluation.issues).toContain(
      "limitations.settingsSemanticVoiceOverActivationProven: screenshot evidence must explicitly remain false."
    );
  });

  it("parses CLI arguments and renders command-line output", () => {
    expect(parseIosSimulatorEvidenceArgs(["--dir", ".qa/custom-sim"])).toBe(".qa/custom-sim");
    expect(parseIosSimulatorEvidenceArgs(["--dir=.qa/inline-sim"])).toBe(".qa/inline-sim");
    expect(parseIosSimulatorEvidenceArgs([".qa/positional-sim"])).toBe(".qa/positional-sim");

    const output = renderIosSimulatorEvidenceEvaluation(evaluateIosSimulatorEvidence("/missing/sim"));

    expect(output).toContain("Tokenizer Training iOS simulator evidence");
    expect(output).toContain("Decision: iOS simulator evidence incomplete");
    expect(output).toContain("Issues:");
  });
});

interface SimulatorEvidenceOverrides {
  skipScreenshot?: string;
  endlessLaunchArgs?: string[];
  physicalTouchProven?: boolean;
  voiceOverActivationProven?: boolean;
  semanticTokenLogLaunchArgs?: string[];
  semanticSettingsLaunchArgs?: string[];
  semanticSettingsResetLaunchArgs?: string[];
  settingsResetLaunchArgs?: string[];
  resetPointerActivationProven?: boolean;
  resetCancelPointerActivationProven?: boolean;
  resetConfirmedDeletionPointerActivationProven?: boolean;
  resetFailureStateVisuallyObserved?: boolean;
  settingsSemanticVisualContentAutomaticallyProven?: boolean;
  settingsSemanticKeyboardActivationProven?: boolean;
  settingsSemanticVoiceOverActivationProven?: boolean;
  screenshotBytes?: Partial<Record<string, Buffer>>;
}

function writeSimulatorEvidence(overrides: SimulatorEvidenceOverrides = {}): string {
  const directory = mkdtempSync(join(tmpdir(), "tt-ios-sim-evidence-"));
  mkdirSync(directory, { recursive: true });

  const screenshots = [
    "default-menu.jpg",
    "tutorial-active.jpg",
    "endless-active.jpg",
    "results.jpg",
    "settings.jpg",
    "settings-reset-confirm.jpg",
    "token-log.jpg",
    "tutorial-complete.jpg",
    "tutorial-failed.jpg",
    "semantic-menu.jpg",
    "semantic-results.jpg",
    "semantic-tutorial-complete.jpg",
    "semantic-tutorial-failed.jpg",
    "semantic-token-log.jpg",
    "semantic-settings.jpg",
    "semantic-settings-reset-confirm.jpg"
  ];
  for (const [index, file] of screenshots.entries()) {
    if (file !== overrides.skipScreenshot) {
      writeFileSync(
        join(directory, file),
        overrides.screenshotBytes?.[file] ?? jpegEvidence(368, 800, index + 1)
      );
    }
  }

  writeFileSync(
    join(directory, "manifest.json"),
    JSON.stringify({
      build: {
        status: "SUCCEEDED"
      },
      app: {
        projectPath: "ios/TokenizerTraining.xcodeproj",
        scheme: "TokenizerTraining",
        bundleId: "com.wienerworks.TokenizerTraining"
      },
      simulator: {
        name: "iPhone 17",
        screen: { width: 368, height: 800 }
      },
      routes: [
        {
          id: "default-menu",
          launchArgs: [],
          screenshot: "default-menu.jpg"
        },
        {
          id: "tutorial-active",
          launchArgs: ["--tt-query", "mode=tutorial&playtestReset=1"],
          screenshot: "tutorial-active.jpg"
        },
        {
          id: "endless-active",
          launchArgs: overrides.endlessLaunchArgs ?? [
            "--tt-query",
            "mode=endless&playtestReset=1"
          ],
          screenshot: "endless-active.jpg"
        },
        {
          id: "results",
          launchArgs: ["--tt-query", "mode=protocol-results&playtestReset=1"],
          screenshot: "results.jpg"
        },
        {
          id: "settings",
          launchArgs: ["--tt-query", "mode=settings&playtestReset=1"],
          screenshot: "settings.jpg"
        },
        {
          id: "settings-reset-confirm",
          launchArgs: overrides.settingsResetLaunchArgs ?? [
            "--tt-query",
            "mode=settings-reset-confirm&playtestReset=1"
          ],
          screenshot: "settings-reset-confirm.jpg"
        },
        {
          id: "token-log",
          launchArgs: ["--tt-query", "mode=token-log&playtestReset=1"],
          screenshot: "token-log.jpg"
        },
        {
          id: "tutorial-complete",
          launchArgs: ["--tt-query", "mode=tutorial-complete&playtestReset=1"],
          screenshot: "tutorial-complete.jpg"
        },
        {
          id: "tutorial-failed",
          launchArgs: ["--tt-query", "mode=tutorial-failed&playtestReset=1"],
          screenshot: "tutorial-failed.jpg"
        },
        {
          id: "semantic-menu",
          launchArgs: ["--tt-query", "semanticUi=visible&playtestReset=1"],
          screenshot: "semantic-menu.jpg"
        },
        {
          id: "semantic-results",
          launchArgs: ["--tt-query", "mode=protocol-results&semanticUi=visible&playtestReset=1"],
          screenshot: "semantic-results.jpg"
        },
        {
          id: "semantic-tutorial-complete",
          launchArgs: ["--tt-query", "mode=tutorial-complete&semanticUi=visible&playtestReset=1"],
          screenshot: "semantic-tutorial-complete.jpg"
        },
        {
          id: "semantic-tutorial-failed",
          launchArgs: ["--tt-query", "mode=tutorial-failed&semanticUi=visible&playtestReset=1"],
          screenshot: "semantic-tutorial-failed.jpg"
        },
        {
          id: "semantic-token-log",
          launchArgs: overrides.semanticTokenLogLaunchArgs ?? [
            "--tt-query",
            "mode=token-log&semanticUi=visible&playtestReset=1"
          ],
          screenshot: "semantic-token-log.jpg"
        },
        {
          id: "semantic-settings",
          launchArgs: overrides.semanticSettingsLaunchArgs ?? [
            "--tt-query",
            "mode=settings&semanticUi=visible&playtestReset=1"
          ],
          screenshot: "semantic-settings.jpg"
        },
        {
          id: "semantic-settings-reset-confirm",
          launchArgs: overrides.semanticSettingsResetLaunchArgs ?? [
            "--tt-query",
            "mode=settings-reset-confirm&semanticUi=visible&playtestReset=1"
          ],
          screenshot: "semantic-settings-reset-confirm.jpg"
        }
      ],
      limitations: {
        physicalTouchProven: overrides.physicalTouchProven ?? false,
        physicalAudioProven: false,
        voiceOverActivationProven: overrides.voiceOverActivationProven ?? false,
        resetPointerActivationProven: overrides.resetPointerActivationProven ?? false,
        resetCancelPointerActivationProven: overrides.resetCancelPointerActivationProven ?? false,
        resetConfirmedDeletionPointerActivationProven:
          overrides.resetConfirmedDeletionPointerActivationProven ?? false,
        resetFailureStateVisuallyObserved: overrides.resetFailureStateVisuallyObserved ?? false,
        settingsSemanticProjectionObserved: true,
        settingsSemanticVisualContentAutomaticallyProven:
          overrides.settingsSemanticVisualContentAutomaticallyProven ?? false,
        settingsSemanticKeyboardActivationProven:
          overrides.settingsSemanticKeyboardActivationProven ?? false,
        settingsSemanticVoiceOverActivationProven:
          overrides.settingsSemanticVoiceOverActivationProven ?? false
      }
    }, null, 2),
    "utf8"
  );

  return directory;
}

function jpegEvidence(width: number, height: number, seed = 0): Buffer {
  const bytes = Buffer.alloc(12_000, 0);
  fillEncodedPayload(bytes, seed);
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

function fillEncodedPayload(bytes: Buffer, seed = 0): void {
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = (index * 37 + 19 + seed * 17) % 256;
  }
}
