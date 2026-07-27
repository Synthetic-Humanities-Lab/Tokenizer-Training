import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const doc = readFileSync("docs/mobile_device_validation.md", "utf8");
const audit = readFileSync("docs/mobile_port_completion_audit.md", "utf8");
const manifest = readFileSync("docs/mobile_device_evidence_manifest.md", "utf8");
const observerTemplate = readFileSync("docs/mobile_device_observer_note_template.md", "utf8");
const inputFeelTemplate = readFileSync("docs/mobile_device_input_feel_summary_template.md", "utf8");
const gitignore = readFileSync(".gitignore", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts?: Record<string, string> };

describe("mobile device validation protocol", () => {
  it("names every required viewport/device target", () => {
    expect(doc).toContain("iPhone SE/small phone portrait");
    expect(doc).toContain("Standard portrait phone");
    expect(doc).toContain("Large phone portrait");
    expect(doc).toContain("Desktop browser harness");
  });

  it("keeps the mobile port boundary explicit", () => {
    for (const required of [
      "tokenizer fixtures and token evidence",
      "scoring economics, verified credits, rework, net credits, remaining credits, rank",
      "swipe/cut detection and staged-cut recovery",
      "tutorial and endless session flow",
      "high-score persistence",
      "mute persistence and no boot-time audio",
      "Wiener as the only character voice",
      "feedback card as the canonical token/cut/result evidence surface"
    ]) {
      expect(doc).toContain(required);
    }

    for (const banned of [
      "hidden side panels",
      "footer panels",
      "assistant panels",
      "detached tutorial popups",
      "separate token-strip review UI",
      "robot/overseer surfaces",
      "Manual Tokenization Training"
    ]) {
      expect(doc).toContain(banned);
    }
  });

  it("requires physical evidence for touch, audio, persistence, and browser parity", () => {
    for (const evidence of [
      "finger occlusion",
      "thumb reach",
      "touch latency",
      "input-feel copied summary or trace",
      "Audio: app launches silently",
      "Best Record",
      "Sound: Off",
      "desktop browser harness screenshot",
      "qaViewport=1280x720",
      "qaFixtureId=simple_001",
      "npm run mobile:preflight",
      "npm run mobile:capture",
      "npm run mobile:completion",
      "npm run mobile:crossref",
      "npm run mobile:freshness",
      "npm run mobile:simulator",
      "npm run mobile:surface",
      "npm run mobile:runtime",
      "npm run mobile:physical",
      "npm run mobile:device-probe",
      "unavailable",
      "resolve any Xcode pairing prompt",
      "npm run mobile:status",
      "npm run mobile:desktop-evidence",
      "docs/mobile_device_evidence",
      "referenced `.png`, `.jpg`, `.mov`, `.mp4`, or `.md` file exists",
      "docs/mobile_device_evidence_manifest.md",
      "docs/mobile_device_observer_note_template.md",
      "docs/mobile_device_input_feel_summary_template.md",
      "docs/mobile_device_validation_completed_template.md",
      "npm run mobile:prepare",
      "blank template-shaped files",
      "npm run mobile:validate"
    ]) {
      expect(doc).toContain(evidence);
    }

    expect(doc).toContain(
      "not complete if `npm run mobile:validate`, `npm run mobile:freshness`, or `npm run mobile:completion` fails"
    );
  });

  it("documents preferred physical evidence artifact filenames", () => {
    for (const artifact of [
      "small-phone-menu.jpg",
      "small-tutorial-cut.mov",
      "small-review-feedback.jpg",
      "standard-endless-five-rounds.mov",
      "large-menu.png",
      "large-active.png",
      "native-relaunch-best-record.jpg",
      "native-relaunch-sound-off.jpg",
      "observer-note.md",
      "input-feel-summary.md",
      "desktop-pinned-fixture.png"
    ]) {
      expect(manifest).toContain(artifact);
    }

    expect(manifest).toContain("docs/mobile_device_evidence/");
    expect(manifest).toContain("docs/mobile_device_observer_note_template.md");
    expect(manifest).toContain("docs/mobile_device_input_feel_summary_template.md");
    expect(manifest).toContain("npm run mobile:validate");
  });

  it("keeps completed physical validation evidence local and ignored by Git", () => {
    expect(gitignore).toContain("docs/mobile_device_evidence/");
    expect(gitignore).toContain("docs/mobile_device_validation_completed.md");
    expect(doc).toContain("both are ignored by Git");
    expect(doc).toContain("private device captures and observer notes");
    expect(audit).toContain("ignored local file `docs/mobile_device_validation_completed.md`");
  });

  it("keeps the input-feel summary template focused on game-feel metrics", () => {
    for (const required of [
      "First-cut latency observed/reported",
      "No-cut acknowledgement behavior",
      "Touch-loupe clearance / finger visibility",
      "Cut batch ownership / broad swipe behavior",
      "Resolve timing / hesitation"
    ]) {
      expect(inputFeelTemplate).toContain(required);
    }

    expect(inputFeelTemplate).toContain("Do not mark `Input-feel metrics captured` as pass");
    expect(inputFeelTemplate).toContain("real phone run");
  });

  it("keeps the observer-note template focused on physical touch and audio evidence", () => {
    for (const heading of [
      "## Thumb Reach",
      "## Finger Occlusion",
      "## Touch Latency And Trust",
      "## Input-Feel Metrics",
      "## Audio And Mute",
      "## Visual Tone"
    ]) {
      expect(observerTemplate).toContain(heading);
    }

    expect(observerTemplate).toContain("Do not mark an item pass");
    expect(observerTemplate).toContain("Unreachable or awkward controls");
    expect(observerTemplate).toContain("no boot audio");
  });

  it("keeps the mobile validation command wired", () => {
    expect(packageJson.scripts?.["mobile:preflight"]).toBe(
      "npm run generate:fixtures && npm run test && npm run build && npm run build:ios-web && npm run mobile:crossref"
    );
    expect(packageJson.scripts?.["mobile:completion"]).toBe("tsx scripts/evaluate-mobile-completion.ts");
    expect(packageJson.scripts?.["mobile:capture"]).toBe("tsx scripts/capture-mobile-cross-reference.ts");
    expect(packageJson.scripts?.["mobile:crossref"]).toBe("tsx scripts/evaluate-mobile-cross-reference.ts");
    expect(packageJson.scripts?.["mobile:freshness"]).toBe("tsx scripts/evaluate-mobile-evidence-freshness.ts");
    expect(packageJson.scripts?.["mobile:simulator"]).toBe("tsx scripts/evaluate-ios-simulator-evidence.ts");
    expect(packageJson.scripts?.["mobile:surface"]).toBe("tsx scripts/evaluate-mobile-surface-evidence.ts");
    expect(packageJson.scripts?.["mobile:runtime"]).toBe("tsx scripts/evaluate-mobile-runtime-evidence.ts");
    expect(packageJson.scripts?.["mobile:prepare"]).toBe("tsx scripts/prepare-mobile-device-validation.ts");
    expect(packageJson.scripts?.["mobile:desktop-evidence"]).toBe("tsx scripts/seed-mobile-desktop-harness-evidence.ts");
    expect(packageJson.scripts?.["mobile:physical"]).toBe("tsx scripts/report-mobile-physical-readiness.ts");
    expect(packageJson.scripts?.["mobile:status"]).toBe("tsx scripts/report-mobile-status.ts");
    expect(packageJson.scripts?.["mobile:validate"]).toBe("tsx scripts/evaluate-mobile-device-validation.ts");
    expect(packageJson.scripts?.["build:ios-web"]).toBe(
      "tsc --noEmit && vite build --base ./ --outDir ios/TokenizerTraining/WebAssets --emptyOutDir"
    );
  });

  it("keeps a mobile-port completion audit tied to the active objective", () => {
    expect(audit).toContain("Status: not complete.");
    expect(audit).toContain("Simulator evidence is current");
    expect(audit).toContain("active/results and runtime browser evidence is stale");
    expect(audit).toContain("physical-device validation remains open");
    for (const requirement of [
      "Port the full game to mobile",
      "Include tutorial and main/endless mode",
      "Preserve tokenizer fixtures",
      "Preserve scoring economics, difficulty, rank, session/results flow",
      "Preserve swipe/cut detection model",
      "Keep visible UI contract conceptually intact",
      "Optimize for mobile play",
      "Stay in tune with browser version",
      "Return final report with next-step proposals"
    ]) {
      expect(audit).toContain(requirement);
    }

    expect(audit).toContain("npm run mobile:preflight");
    expect(audit).toContain("npm run mobile:capture");
    expect(audit).toContain("npm run mobile:crossref");
    expect(audit).toContain("npm run mobile:freshness");
    expect(audit).toContain("npm run mobile:simulator");
    expect(audit).toContain("npm run mobile:completion");
    expect(audit).toContain("npm run mobile:prepare");
    expect(audit).toContain("npm run mobile:desktop-evidence");
    expect(audit).toContain("npm run mobile:physical");
    expect(audit).toContain("npm run mobile:status");
    expect(audit).toContain("npm run mobile:validate");
    expect(audit).toContain("desktop browser harness has been seeded");
    expect(audit).toContain("visible but unavailable");
    expect(audit).toContain("blank template-shaped file");
    expect(audit).toContain("the mobile menu now follows the approved reference");
    expect(audit).toContain("Settings` the same button treatment");
    expect(audit).toContain("The detached touch loupe is hidden");
    expect(audit).toContain("Token Credit depletion results use four larger metrics");
    expect(audit).toContain("reduced Token Credit depletion metric evidence including cuts, accuracy, and rank");
    expect(audit).toContain("Wiener/speech/control surfaces");
    expect(audit).toContain("remaining completion blockers are physical-device evidence gates");
    expect(audit).toContain("real-device touch slicing, thumb reach, finger occlusion, and perceived latency");
    expect(audit).toContain("physical audio output after user interaction");
    expect(audit).toContain("docs/mobile_device_validation_completed.md");
  });
});
