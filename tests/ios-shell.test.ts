import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  menuCaptureRoutes,
  surfaceCaptureRoutes,
  type CaptureRoute
} from "../scripts/capture-mobile-cross-reference";

const infoPlist = readFileSync("ios/TokenizerTraining/Info.plist", "utf8");
const project = readFileSync("ios/TokenizerTraining.xcodeproj/project.pbxproj", "utf8");
const launchScreen = readFileSync("ios/TokenizerTraining/LaunchScreen.storyboard", "utf8");
const webGameView = readFileSync("ios/TokenizerTraining/App/WebGameView.swift", "utf8");
const mobileShell = readFileSync("docs/mobile_shell.md", "utf8");

const captureBaseUrl = "http://127.0.0.1:5173/";

function captureUrl(route: Pick<CaptureRoute, "params">): string {
  const url = new URL(captureBaseUrl);
  for (const [key, value] of Object.entries(route.params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function sectionBetween(source: string, start: string, end: string): string {
  const sectionStart = source.indexOf(start);
  const sectionEnd = source.indexOf(end, sectionStart + start.length);
  expect(sectionStart).toBeGreaterThanOrEqual(0);
  expect(sectionEnd).toBeGreaterThan(sectionStart);
  return source.slice(sectionStart, sectionEnd);
}

describe("iOS shell", () => {
  it("declares a launch screen so modern iPhones do not run the web game letterboxed", () => {
    expect(infoPlist).toContain("<key>UILaunchStoryboardName</key>");
    expect(infoPlist).toContain("<string>LaunchScreen</string>");
    expect(project).toContain("LaunchScreen.storyboard in Resources");
    expect(project).toContain("lastKnownFileType = file.storyboard; path = LaunchScreen.storyboard;");
    expect(launchScreen).toContain('launchScreen="YES"');
  });

  it("defaults the native shell to the mobile surface", () => {
    expect(webGameView).toContain('private let defaultGameQuery = "surface=mobile"');
    expect(webGameView).toContain("ProcessInfo.processInfo.arguments");
    expect(webGameView).toContain("index.html?\\(gameQuery)");
  });

  it("allows simulator launch arguments for structural mobile/browser cross-reference routes", () => {
    expect(webGameView).toContain('private let launchQueryArgumentName = "--tt-query"');
    expect(webGameView).toContain("static func gameLaunchQuery(arguments: [String]) -> String");
    expect(webGameView).toContain('return "\\(defaultGameQuery)&\\(trimmed)"');
  });

  it("keeps QA launch queries DEBUG-only while preserving ordinary query handling", () => {
    expect(webGameView).toContain("#if DEBUG");
    expect(webGameView).toContain("private let qaLaunchQueriesEnabled = true");
    expect(webGameView).toContain("private let qaLaunchQueriesEnabled = false");
    expect(webGameView).toContain("containsQaLaunchControl(trimmed)");
    expect(webGameView).toContain("$0.name.hasPrefix(\"qa\")");
  });

  it("rejects path-like launch queries so QA cannot redirect the native shell", () => {
    expect(webGameView).toContain('let blockedFragments = ["://", "?", "#", "/", "\\\\"]');
    expect(webGameView).toContain("query.rangeOfCharacter(from: .whitespacesAndNewlines) == nil");
    expect(webGameView).toContain("components.path == \"/index.html\"");
  });

  it("allows simulator mute seeding through the same storage key as the web game", () => {
    expect(webGameView).toContain('private let launchMutedArgumentName = "--tt-muted"');
    expect(webGameView).toContain('private let mutedStorageKey = "tokenizer-training.muted"');
    expect(webGameView).toContain("static func launchMutedOverride(arguments: [String]) -> Bool?");
    expect(webGameView).toContain("window.localStorage.setItem('\\(mutedStorageKey)', '\\(mutedValue)');");
    expect(webGameView).toContain("injectionTime: .atDocumentStart");
  });

  it("exposes hardware-aware haptic capability without claiming Simulator output", () => {
    expect(webGameView).toContain("CHHapticEngine.capabilitiesForHardware().supportsHaptics");
    expect(webGameView).toContain('private let nativeCapabilitiesGlobalName = "__TOKENIZER_TRAINING_NATIVE_CAPABILITIES__"');
    expect(webGameView).toContain("Object.freeze({ haptics: \\(availableValue), qa: \\(qaValue) })");
    expect(webGameView).toContain("qaAvailable: qaLaunchQueriesEnabled");
    expect(webGameView).toContain("forMainFrameOnly: true");
  });

  it("keeps the native haptic bridge cue-only, origin-bound, rate-limited, and removable", () => {
    expect(webGameView).toContain('private let nativeHapticMessageHandlerName = "tokenizerTrainingHaptics"');
    expect(webGameView).toContain("private let maxNativeHapticRepeats = 4");
    expect(webGameView).toContain("Set(payload.keys) == Set([\"cue\", \"repeats\"])");
    expect(webGameView).toContain("message.frameInfo.isMainFrame");
    expect(webGameView).toContain("message.frameInfo.securityOrigin.protocol == webAssetScheme");
    expect(webGameView).toContain("message.frameInfo.securityOrigin.host == webAssetHost");
    expect(webGameView).toContain("recentMessageTimes.count < 16");
    expect(webGameView).toContain("cue == .cut || repeats == 1");
    expect(webGameView).toContain("removeScriptMessageHandler(forName: nativeHapticMessageHandlerName)");
    expect(webGameView).toContain("static func dismantleUIView(_ webView: WKWebView, coordinator: NativeFeedbackCoordinator)");
  });

  it("routes the finite game cue set through a lifecycle-owned native audio bridge", () => {
    expect(webGameView).toContain("import AVFAudio");
    expect(webGameView).toContain('private let nativeAudioMessageHandlerName = "tokenizerTrainingAudio"');
    expect(webGameView).toContain("final class NativeAudioBridge: NSObject, WKScriptMessageHandler");
    expect(webGameView).toContain("Set(payload.keys) == Set([\"cue\"])");
    expect(webGameView).toContain("let cue = NativeAudioCue(rawValue: rawCue)");
    expect(webGameView).toContain("message.frameInfo.securityOrigin.protocol == webAssetScheme");
    expect(webGameView).toContain("message.frameInfo.securityOrigin.host == webAssetHost");
    expect(webGameView).toContain("recentMessageTimes.count < 32");
    expect(webGameView).toContain("try session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])");
    expect(webGameView).toContain("player.scheduleBuffer(buffer, at: nil, options: .interrupts)");
    expect(webGameView).toContain("if cue == .cut");
    expect(webGameView).toContain("(noise - previousNoise) * 0.9");
    expect(webGameView).toContain(
      "NativeAudioCueShape(startFrequency: 760, endFrequency: 180, duration: 0.058, toneGain: 0.06, noiseGain: 0.16)"
    );
    expect(webGameView).toContain("removeScriptMessageHandler(forName: nativeAudioMessageHandlerName)");
  });

  it("forwards native app suspension through the web gameplay pause contract", () => {
    expect(webGameView).toContain("final class NativeAppLifecycleBridge");
    expect(webGameView).toContain("UIApplication.willResignActiveNotification");
    expect(webGameView).toContain("UIApplication.didBecomeActiveNotification");
    expect(webGameView).toContain('private let nativeAppPauseEventName = "tokenizertraining:native-pause"');
    expect(webGameView).toContain('private let nativeAppResumeEventName = "tokenizertraining:native-resume"');
    expect(webGameView).toContain("context.coordinator.attach(to: webView)");
    expect(webGameView).toContain("lifecycleBridge.remove()");
  });
});

describe("manual browser QA handoff", () => {
  it("mirrors the capture authority route list, including canvas and held-review controls", () => {
    const manifest = sectionBetween(
      mobileShell,
      "### Browser Capture Route Manifest",
      "For active play, cross-reference"
    );
    const documentedUrls = Array.from(
      manifest.matchAll(/`(http:\/\/127\.0\.0\.1:5173\/\?[^`]+)`/g),
      (match) => match[1]
    );
    const heldReviewUrl = captureUrl({
      params: {
        surface: "mobile",
        mode: "endless",
        playtestReset: "1",
        qaViewport: "368x552",
        qaFreezeElapsedMs: "6200",
        qaFixtureId: "simple_001",
        qaHoldReview: "1",
        qaCanvasCapture: "1"
      }
    });

    expect(mobileShell).toContain(
      "`scripts/capture-mobile-cross-reference.ts` is the route and file authority for this handoff."
    );
    expect(documentedUrls).toEqual([
      ...menuCaptureRoutes.map(captureUrl),
      ...surfaceCaptureRoutes.map(captureUrl),
      heldReviewUrl
    ]);
    for (const route of menuCaptureRoutes) {
      expect(manifest).toContain(
        `\`${captureUrl(route)}\` -> \`.qa/iab-surface-compare/latest/${route.file}\`.`
      );
    }
    for (const route of surfaceCaptureRoutes) {
      expect(manifest).toContain(
        `\`${captureUrl(route)}\` -> \`.qa/mobile-port-audit/latest/${route.file}\`.`
      );
    }
    expect(manifest).toContain(
      `\`${heldReviewUrl}\` -> \`.qa/mobile-runtime/latest/cua-endless-review-held-tight.png\`.`
    );
    expect(documentedUrls).toContain(
      "http://127.0.0.1:5173/?surface=mobile&playtestReset=1&qaViewport=368x800"
    );

    const activeUrls = documentedUrls.filter((routeUrl) => {
      const mode = new URL(routeUrl).searchParams.get("mode");
      return mode === "tutorial" || mode === "endless";
    });
    expect(activeUrls).not.toHaveLength(0);
    for (const routeUrl of activeUrls) {
      expect(new URL(routeUrl).searchParams.get("qaCanvasCapture")).toBe("1");
    }

    const resultsUrl = documentedUrls.find((routeUrl) => {
      const mode = new URL(routeUrl).searchParams.get("mode");
      return mode?.includes("results");
    });
    expect(new URL(resultsUrl ?? captureBaseUrl).searchParams.get("mode")).toBe("protocol-results");
    expect(
      documentedUrls.some((routeUrl) => new URL(routeUrl).searchParams.get("mode") === "results")
    ).toBe(false);
    expect(mobileShell).toContain(
      "Review and round-two states require in-page QA interactions rather than direct URLs."
    );
    expect(mobileShell).toContain(
      "controlled Chrome/manual capture cannot claim touch emulation, DPR=1, reduced-motion, or physical touch evidence."
    );
    expect(mobileShell).toContain(
      "Do not copy old artifacts, rename near matches, touch timestamps, synthesize sidecars, or weaken a validator."
    );
  });

  it("locks the current visible menu identity without retired desktop copy", () => {
    const manifest = sectionBetween(
      mobileShell,
      "### Browser Capture Route Manifest",
      "For active play, cross-reference"
    );

    expect(manifest).toContain(
      "The current visible menu identity is `Welcome to WienerWorks`, `Tokenizer Training`, `Best Rank`, `Tutorial`, `Training`, `Token Log`, and `Settings`."
    );
    expect(manifest).not.toMatch(/module\/premise\/best-record|Best Record|Begin Tutorial|Endless Training/);
  });
});
