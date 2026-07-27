import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateMobileCrossReference,
  evaluateMobileMenuComparison,
  parseMobileCrossReferenceArgs,
  renderMobileCrossReferenceEvaluation
} from "../scripts/evaluate-mobile-cross-reference";
import {
  captureRouteFailureArtifactPaths,
  captureRouteFailureRecord,
  menuCaptureRoutes,
  parseMobileCrossReferenceCaptureArgs,
  surfaceCaptureRoutes
} from "../scripts/capture-mobile-cross-reference";

describe("mobile browser cross-reference evaluator", () => {
  it("accepts captured browser and mobile menu comparison artifacts", () => {
    const directory = writeCompleteMenuComparison();
    const evaluation = evaluateMobileMenuComparison(directory);

    expect(evaluation.ready).toBe(true);
    expect(evaluation.issues).toEqual([]);
    expect(evaluation.checkedFiles).toContain(join(directory, "comparison.json"));
    expect(evaluation.checkedFiles).toContain(join(directory, "mobile-surface-menu.png"));
    expect(evaluation.checkedFiles).toContain(join(directory, "mobile-surface-menu-tall.png"));
  });

  it("rejects stale mobile menu captures that drop record evidence or miss mobile routing", () => {
    const directory = writeCompleteMenuComparison({
      mobileUrl: "http://127.0.0.1:5173/?playtestReset=1&qaViewport=368x552",
      mobileBestRecordVisible: false
    });
    const evaluation = evaluateMobileMenuComparison(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("mobile surface menu url: expected surface=mobile.");
    expect(evaluation.issues).toContain("mobile surface menu best record: expected visible=true, got false.");
    expect(evaluation.issues).toContain(
      "mobile menu best record: mobile must not drop a record line visible in compact browser."
    );
  });

  it("rejects menu comparison artifacts that are not image evidence", () => {
    const directory = writeCompleteMenuComparison({
      mobileImageBytes: Buffer.from("not an image", "utf8")
    });
    const evaluation = evaluateMobileMenuComparison(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `mobile surface menu must be PNG or JPEG image evidence: ${join(directory, "mobile-surface-menu.png")}.`
    );
  });

  it("rejects product identity drift between desktop browser and mobile surface", () => {
    const directory = writeCompleteMenuComparison({
      mobileTitle: "Tokenizer Mobile"
    });
    const evaluation = evaluateMobileMenuComparison(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("mobile surface menu title: expected Tokenizer Training, got Tokenizer Mobile.");
    expect(evaluation.issues).toContain(
      "shared menu identity title: expected all surfaces to match, got desktop=Tokenizer Training, compact=Tokenizer Training, mobile=Tokenizer Mobile."
    );
  });

  it("rejects a tall mobile menu capture with an excessive record-to-action dead band", () => {
    const directory = writeCompleteMenuComparison({
      tallTutorialY: 618
    });
    const evaluation = evaluateMobileMenuComparison(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "tall mobile menu best record to tutorial button gap: expected 12-28px, got 224px."
    );
  });

  it("rejects a mobile menu capture that omits the token log action", () => {
    const directory = writeCompleteMenuComparison({
      tokenLogText: ""
    });
    const evaluation = evaluateMobileMenuComparison(directory);

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("mobile surface menu token log button: expected Token Log, got missing.");
  });

  it("parses directories and renders the combined evidence decision", () => {
    const menuDirectory = writeCompleteMenuComparison();
    const options = parseMobileCrossReferenceArgs([
      "--menu-dir",
      menuDirectory,
      "--surface-dir=.qa/missing-surface",
      "--runtime-dir",
      ".qa/missing-runtime"
    ]);
    const evaluation = evaluateMobileCrossReference(options);
    const output = renderMobileCrossReferenceEvaluation(evaluation);

    expect(options).toEqual({
      menuDirectory,
      surfaceDirectory: ".qa/missing-surface",
      runtimeDirectory: ".qa/missing-runtime"
    });
    expect(evaluation.ready).toBe(false);
    expect(output).toContain("Tokenizer Training browser/mobile cross-reference");
    expect(output).toContain("Menu comparison: passed");
    expect(output).toContain("Surface evidence: incomplete");
    expect(output).toContain("Runtime evidence: incomplete");
  });

  it("exposes the cross-reference command in package scripts", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["mobile:capture"]).toBe("tsx scripts/capture-mobile-cross-reference.ts");
    expect(packageJson.scripts?.["mobile:crossref"]).toBe("tsx scripts/evaluate-mobile-cross-reference.ts");
  });

  it("defines live capture routes for menu and active gameplay browser/mobile parity", () => {
    expect(menuCaptureRoutes.map((route) => route.id)).toEqual([
      "browser-desktop-menu",
      "browser-compact-menu",
      "mobile-surface-menu",
      "mobile-surface-menu-tall"
    ]);
    expect(surfaceCaptureRoutes.map((route) => route.id)).toEqual([
      "browser-desktop-tutorial-active-fresh",
      "mobile-surface-tutorial-active-small-fresh",
      "mobile-surface-tutorial-active-large-after",
      "browser-desktop-endless-pinned-simple-001",
      "mobile-surface-endless-pinned-simple-001",
      "mobile-surface-results-small-after"
    ]);
    expect(menuCaptureRoutes.find((route) => route.id === "mobile-surface-menu")?.params.surface).toBe("mobile");
    expect(surfaceCaptureRoutes.find((route) => route.id === "browser-desktop-endless-pinned-simple-001")?.params.qaFixtureId).toBe("simple_001");
  });

  it("parses capture options for autonomous evidence refresh", () => {
    expect(parseMobileCrossReferenceCaptureArgs([])).toEqual({
      baseUrl: undefined,
      port: 5173,
      outRoot: ".qa",
      skipRuntime: false
    });
    expect(parseMobileCrossReferenceCaptureArgs([
      "--base-url",
      "http://127.0.0.1:5180",
      "--port=5180",
      "--out-root",
      ".qa/custom",
      "--skip-runtime"
    ])).toEqual({
      baseUrl: "http://127.0.0.1:5180",
      port: 5180,
      outRoot: ".qa/custom",
      skipRuntime: true
    });
  });

  it("keeps runtime capture wired to sidecar and transient-review evidence", () => {
    const source = readFileSync("scripts/capture-mobile-cross-reference.ts", "utf8");

    expect(source).toContain("async function screenshotWithQaSidecar");
    expect(source).toContain('stateString(snapshot, "rendererQaCaptureStatus") === "ok"');
    expect(source).toContain('rectOf(snapshot, "feedbackTokenSplit") !== undefined');
    expect(source).toContain("copyFileSync(heldReviewPath, readableFeedbackPath)");
    expect(source).toContain("copyFileSync(qaSidecarPath(heldReviewPath), qaSidecarPath(readableFeedbackPath))");
  });

  it("records route-level failure artifacts for timed-out captures", () => {
    const route = menuCaptureRoutes.find((candidate) => candidate.id === "mobile-surface-menu");
    expect(route).toBeDefined();
    const paths = captureRouteFailureArtifactPaths("/tmp/mobile-capture", route!);
    const record = captureRouteFailureRecord({
      route: route!,
      url: "http://127.0.0.1:5173/?surface=mobile&playtestReset=1",
      error: new Error("Timed out waiting for mobile-surface-menu QA snapshot."),
      snapshot: {
        scene: "MenuScene",
        compact: true,
        state: {
          phase: "menu",
          round: 0,
          cutCount: 0
        }
      },
      screenshot: {
        path: paths.screenshot,
        bytes: 12_345
      }
    });

    expect(paths).toEqual({
      json: join("/tmp/mobile-capture", "mobile-surface-menu.failure.json"),
      screenshot: join("/tmp/mobile-capture", "mobile-surface-menu.failure.png")
    });
    expect(record).toMatchObject({
      routeCaptureFailure: true,
      id: "mobile-surface-menu",
      file: "mobile-surface-menu.png",
      mobileInput: true,
      error: "Timed out waiting for mobile-surface-menu QA snapshot.",
      snapshotSummary: {
        scene: "MenuScene",
        compact: true,
        phase: "menu",
        round: 0,
        cutCount: 0
      },
      screenshot: {
        path: join("/tmp/mobile-capture", "mobile-surface-menu.failure.png"),
        bytes: 12_345
      }
    });
  });
});

interface MenuComparisonOverrides {
  mobileUrl?: string;
  mobileBestRecordVisible?: boolean;
  mobileTitle?: string;
  tallTutorialY?: number;
  tokenLogText?: string;
  mobileImageBytes?: Buffer;
}

function writeCompleteMenuComparison(overrides: MenuComparisonOverrides = {}): string {
  const directory = mkdtempSync(join(tmpdir(), "tt-mobile-crossref-"));
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "browser-desktop-menu.png"), jpegEvidence(1280, 720));
  writeFileSync(join(directory, "browser-compact-menu.png"), jpegEvidence(368, 552));
  writeFileSync(join(directory, "mobile-surface-menu.png"), overrides.mobileImageBytes ?? jpegEvidence(368, 552));
  writeFileSync(join(directory, "mobile-surface-menu-tall.png"), jpegEvidence(368, 800));

  writeFileSync(
    join(directory, "comparison.json"),
    JSON.stringify([
      menuEntry({
        id: "browser-desktop-menu",
        url: "http://127.0.0.1:5173/?playtestReset=1&qaViewport=1280x720",
        width: 1280,
        height: 720,
        compact: false,
        title: "Tokenizer Training",
        secondaryCopyVisible: false,
        bestRecordVisible: true,
        buttonWidth: 174,
        buttonHeight: 46
      }),
      menuEntry({
        id: "browser-compact-menu",
        url: "http://127.0.0.1:5173/?playtestReset=1&qaViewport=368x552",
        width: 368,
        height: 552,
        compact: true,
        title: "Tokenizer Training",
        secondaryCopyVisible: false,
        bestRecordVisible: true,
        buttonWidth: 240,
        buttonHeight: 46
      }),
      menuEntry({
        id: "mobile-surface-menu",
        url: overrides.mobileUrl ?? "http://127.0.0.1:5173/?surface=mobile&playtestReset=1&qaViewport=368x552",
        width: 368,
        height: 552,
        compact: true,
        title: overrides.mobileTitle ?? "Tokenizer Training",
        secondaryCopyVisible: false,
        bestRecordVisible: overrides.mobileBestRecordVisible ?? true,
        buttonWidth: 304,
        buttonHeight: 54,
        tokenLogText: overrides.tokenLogText
      }),
      menuEntry({
        id: "mobile-surface-menu-tall",
        url: "http://127.0.0.1:5173/?surface=mobile&playtestReset=1&qaViewport=368x800",
        width: 368,
        height: 800,
        compact: true,
        title: "Tokenizer Training",
        secondaryCopyVisible: false,
        bestRecordVisible: true,
        buttonWidth: 304,
        buttonHeight: 54,
        positions: {
          companyMark: 150,
          title: 270,
          moduleLabel: 310,
          premise: 340,
          bestRecord: 356,
          tutorialButton: overrides.tallTutorialY ?? 409,
          trainingButton: (overrides.tallTutorialY ?? 409) + 68,
          tokenLogButton: (overrides.tallTutorialY ?? 409) + 136,
          settingsButton: (overrides.tallTutorialY ?? 409) + 204
        }
      })
    ], null, 2),
    "utf8"
  );

  return directory;
}

function menuEntry(options: {
  id: string;
  url: string;
  width: number;
  height: number;
  compact: boolean;
  title: string;
  secondaryCopyVisible: boolean;
  bestRecordVisible: boolean;
  buttonWidth: number;
  buttonHeight: number;
  positions?: Partial<Record<string, number>>;
  tokenLogText?: string;
}): Record<string, unknown> {
  const positions = options.positions ?? {};
  return {
    id: options.id,
    url: options.url,
    viewport: { width: options.width, height: options.height },
    snapshot: {
      compact: options.compact,
      elements: [
        element("companyMark", "Welcome to WienerWorks", true, undefined, undefined, positions.companyMark),
        element("title", options.title, true, undefined, undefined, positions.title),
        ...(options.secondaryCopyVisible
          ? [
              element("moduleLabel", "Human Segmentation Division", true, undefined, undefined, positions.moduleLabel),
              element("premise", "Predict token boundaries. Accuracy extends the shift.", true, undefined, undefined, positions.premise)
            ]
          : []),
        element("bestRecord", "BEST RANK\nRegex Intern\n0 rounds", options.bestRecordVisible, undefined, undefined, positions.bestRecord),
        element("tutorialButton", "Tutorial", true, options.buttonWidth, options.buttonHeight, positions.tutorialButton),
        element("trainingButton", "Training", true, options.buttonWidth, options.buttonHeight, positions.trainingButton),
        element("tokenLogButton", options.tokenLogText ?? "Token Log", true, options.buttonWidth, options.buttonHeight, positions.tokenLogButton),
        element("settingsButton", "Settings", true, options.buttonWidth, options.buttonHeight, positions.settingsButton)
      ]
    }
  };
}

function element(
  id: string,
  text: string,
  visible: boolean,
  width = 296,
  height = 22,
  y = 100
): Record<string, unknown> {
  return {
    id,
    text,
    visible,
    rect: { x: 184, y, width, height }
  };
}

function jpegEvidence(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(1_200, 0);
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
