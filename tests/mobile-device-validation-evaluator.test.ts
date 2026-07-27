import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateMobileDeviceValidation,
  parseMobileDeviceValidationArgs,
  renderMobileDeviceValidationEvaluation,
  summarizeMobileDeviceValidationIssues
} from "../scripts/evaluate-mobile-device-validation";

const completedValidation = `# Tokenizer Training Mobile Device Validation Completed

## Validation Metadata

- Date: 2026-06-30
- Build or commit: local mobile validation build
- Validator: QA operator
- Browser/server URL: http://192.168.1.20:5173/?surface=mobile&playtestReset=1
- Native build: TokenizerTraining Debug on iPhone 17 hardware
- Notes: Physical validation pass after simulator shell checks. Tutorial Cleared handoff showed Start Training. Internal provenance remained lowercase endless with mode=endless, the endless-active ID, and stable standard-endless-five-rounds.mov filename.

## Target Evidence

| Target | Device / Browser | Evidence File Or Note | Verdict |
| --- | --- | --- | --- |
| iPhone SE/small phone portrait | iPhone SE 3rd gen Safari and native shell | photo small-phone-menu.jpg shows Best Rank, Tutorial, Training, Token Log, and Settings; observer note confirms no clipping, acceptable thumb reach, and acceptable finger occlusion during staged cuts. | pass |
| Standard portrait phone | iPhone 15 Safari and native shell | screen recording standard-endless-five-rounds.mov samples five consecutive rounds within an uncapped Training session, including feedback cards and audio after user action. | pass |
| Large phone portrait | iPhone 15 Pro Max Safari and native shell | screenshot large-menu.png shows Best Rank, Tutorial, Training, Token Log, and Settings; large-active.png shows safe areas, HUD, Wiener speech, and bottom controls clear. | pass |
| Desktop browser harness | Chrome desktop browser 1280x720 | screenshot desktop-pinned-fixture.png for mode=endless qaFixtureId=simple_001 pinned fixture route confirms browser layout remains desktop. | pass |

## Physical Checklist

| Check | Evidence | Verdict |
| --- | --- | --- |
| Menu readable | photo small-phone-menu.jpg shows the menu with WienerWorks, Tokenizer Training, Best Rank, Tutorial, Training, Token Log, and Settings readable. | pass |
| Safe areas clear | large-active.png and small-phone-menu.jpg show notch/home indicator clear of HUD, feedback, and controls. | pass |
| Tutorial slicing works by touch | screen recording small-tutorial-cut.mov shows first staged cut by finger without edge gesture conflict. | pass |
| Tutorial review feedback card readable | photo small-review-feedback.jpg shows clean segmentation, token split, verified/rework/net credits, and boundary audit. | pass |
| Training observation sample covers at least five rounds | screen recording standard-endless-five-rounds.mov shows five consecutive rounds sampled within an uncapped Training session, then continues beyond round five while Token Credits remain. | pass |
| Play-screen thumb reach acceptable | observer note: one-handed small phone reached Sound, Clear, Exit, Resolve, Next, Continue, and Finish. | pass |
| Results thumb reach acceptable | observer note: on the Results screen, one-handed small phone reached Review Token Log, Run Training Again, and Return to Menu. | pass |
| Finger occlusion acceptable | observer note: finger did not hide ordinary short-prompt decision points or cut markers. | pass |
| Touch latency acceptable | observer note: staged markers appeared immediately enough that player trusted cuts; no lag complaints. | pass |
| Input-feel metrics captured | input-feel-summary.md records first-cut latency, no-cut acknowledgements, touch-loupe clearance, cut batch ownership, and resolve timing. | pass |
| Best Rank persistence visible after relaunch | photo native-relaunch-best-record.jpg shows the default menu with Best Rank after app termination and full relaunch. | pass |
| Audio silent on boot and plays after user action | observer note and screen recording audio-output.mov: no boot sound, UI cue after tap with sound enabled. | pass |
| Sound persistence visible in Settings after relaunch | photo native-relaunch-sound-off.jpg shows Settings with Sound: Off before app termination and again shows Settings with Sound: Off after full relaunch. | pass |
| WienerWorks visual tone intentional | observer note: tester described obsolete training software, not cute SaaS or neon cyberpunk. | pass |
| Desktop browser harness still matches browser contract | screenshot desktop-pinned-fixture.png from the desktop 1280x720 mode=endless qaFixtureId=simple_001 route shows wide HUD, browser menu density, and no mobile bottom-dock leak. | pass |

## Evidence Inventory

- Small-phone menu: small-phone-menu.jpg photo shows menu card with Best Rank, Tutorial, Training, Token Log, and Settings.
- Small-phone active tutorial after at least one staged cut: small-tutorial-cut.mov screen recording shows one staged cut and prompt visibility.
- Small-phone review feedback card: small-review-feedback.jpg photo shows feedback card evidence.
- Standard-phone Training observation sample: standard-endless-five-rounds.mov records five consecutive rounds sampled within an uncapped Training session and continuation beyond round five while Token Credits remain.
- Large-phone menu: large-menu.png screenshot shows the large portrait safe-area menu with Best Rank, Tutorial, Training, Token Log, and Settings.
- Large-phone active play: large-active.png screenshot shows HUD, prompt, Wiener speech, and bottom controls.
- Native relaunch persisted Best Rank: native-relaunch-best-record.jpg photo shows the default menu with Best Rank after app termination and full relaunch.
- Native relaunch persisted Sound Off in Settings: native-relaunch-sound-off.jpg photo shows Settings with Sound: Off before app termination and again shows Settings with Sound: Off after full relaunch.
- Observer note on thumb reach, finger occlusion, touch latency, and audio output: observer-note.md records thumb reach, finger occlusion, touch latency, no boot audio, and user-action audio.
- Input-feel copied summary or trace: input-feel-summary.md records first-cut latency, no-cut acknowledgement behavior, touch-loupe clearance, broad swipe cut batch ownership, and resolve timing.
- Desktop browser pinned fixture: desktop-pinned-fixture.png screenshot uses desktop 1280x720 mode=endless qaFixtureId=simple_001 pinned fixture route.

## Final Decision

- Mobile device validation passed: yes
- Required changes before completion: none
`;

describe("mobile device validation evaluator", () => {
  it("accepts completed physical-device evidence only when every target and check passes", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const evaluation = evaluateMobileDeviceValidation(completedValidation, "completed.md", { evidenceRoot });

    expect(evaluation.ready).toBe(true);
    expect(evaluation.issues).toEqual([]);
  });

  it("rejects the blank completed-validation template", () => {
    const template = readFileSync("docs/mobile_device_validation_completed_template.md", "utf8");
    const evaluation = evaluateMobileDeviceValidation(template, "template.md");

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("iPhone SE/small phone portrait: device/browser field is missing or generic.");
    expect(evaluation.issues).toContain("Menu readable: evidence is missing or generic.");
    expect(evaluation.issues).toContain("Evidence inventory missing: Small-phone menu.");
    expect(evaluation.issues).toContain("Evidence inventory missing: Large-phone active play.");
    expect(evaluation.issues).toContain("Evidence inventory missing: Native relaunch persisted Sound Off in Settings.");
    expect(evaluation.issues).toContain("Final decision must mark Mobile device validation passed as yes/pass/met.");
  });

  it("summarizes missing target, checklist, inventory, and final-decision evidence", () => {
    const template = readFileSync("docs/mobile_device_validation_completed_template.md", "utf8");
    const evaluation = evaluateMobileDeviceValidation(template, "template.md");
    const summary = summarizeMobileDeviceValidationIssues(evaluation.issues);

    expect(summary.targetEvidence).toContain("iPhone SE/small phone portrait");
    expect(summary.physicalChecks).toContain("Tutorial slicing works by touch");
    expect(summary.evidenceInventory).toContain("Small-phone menu");
    expect(summary.finalDecision).toContain("Final decision must mark Mobile device validation passed as yes/pass/met");
  });

  it("rejects generic positive evidence that does not name artifacts or observed mobile behavior", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const thin = completedValidation
      .replace("photo small-phone-menu.jpg shows Best Rank, Tutorial, Training, Token Log, and Settings; observer note confirms no clipping, acceptable thumb reach, and acceptable finger occlusion during staged cuts.", "looks good")
      .replace("photo small-phone-menu.jpg shows the menu with WienerWorks, Tokenizer Training, Best Rank, Tutorial, Training, Token Log, and Settings readable.", "pass");
    const evaluation = evaluateMobileDeviceValidation(thin, "thin.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("iPhone SE/small phone portrait: evidence file or note is missing or generic.");
    expect(evaluation.issues).toContain("Menu readable: evidence is missing or generic.");
  });

  it("requires current menu labels in checklist and small/large menu inventory evidence", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const unnamedMenus = completedValidation
      .replace(
        "photo small-phone-menu.jpg shows the menu with WienerWorks, Tokenizer Training, Best Rank, Tutorial, Training, Token Log, and Settings readable.",
        "photo small-phone-menu.jpg shows Tokenizer Training and every menu control readable."
      )
      .replace(
        "- Small-phone menu: small-phone-menu.jpg photo shows menu card with Best Rank, Tutorial, Training, Token Log, and Settings.",
        "- Small-phone menu: small-phone-menu.jpg photo shows every menu control readable."
      )
      .replace(
        "- Large-phone menu: large-menu.png screenshot shows the large portrait safe-area menu with Best Rank, Tutorial, Training, Token Log, and Settings.",
        "- Large-phone menu: large-menu.png screenshot shows every menu control readable."
      );
    const evaluation = evaluateMobileDeviceValidation(unnamedMenus, "unnamed-menus.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    for (const evidenceLabel of ["Menu readable", "Small-phone menu", "Large-phone menu"]) {
      for (const menuLabel of ["Best Rank", "Tutorial", "Training", "Token Log", "Settings"]) {
        expect(evaluation.issues).toContain(`${evidenceLabel}: menu evidence must mention ${menuLabel}.`);
      }
    }
  });

  it("requires current menu copy to be affirmative and tied to the menu surface", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const negatedMenu = completedValidation.replace(
      "photo small-phone-menu.jpg shows the menu with WienerWorks, Tokenizer Training, Best Rank, Tutorial, Training, Token Log, and Settings readable.",
      "photo small-phone-menu.jpg shows the menu with Best Rank, Tutorial, Token Log, and Settings readable; on the menu, Training was not visible."
    );
    const wrongSurfaceMenu = completedValidation.replace(
      "photo small-phone-menu.jpg shows the menu with WienerWorks, Tokenizer Training, Best Rank, Tutorial, Training, Token Log, and Settings readable.",
      "photo large-active.png shows the Results screen with Best Rank, Tutorial, Training, Token Log, and Settings readable."
    );

    expect(evaluateMobileDeviceValidation(negatedMenu, "negated-menu.md", { evidenceRoot }).issues).toContain(
      "Menu readable: menu evidence must mention Training."
    );
    expect(evaluateMobileDeviceValidation(wrongSurfaceMenu, "wrong-surface-menu.md", { evidenceRoot }).issues).toContain(
      "Menu readable: menu evidence must mention Training."
    );
  });

  it("rejects retired spaced menu claims even when their artifact exists", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const retiredMenu = completedValidation.replace(
      "photo small-phone-menu.jpg shows the menu with WienerWorks, Tokenizer Training, Best Rank, Tutorial, Training, Token Log, and Settings readable.",
      "photo small-phone-menu.jpg shows WienerWorks, Tokenizer Training, Best Record, Begin Tutorial, Endless Training, Token Log, and Settings readable."
    );
    const evaluation = evaluateMobileDeviceValidation(retiredMenu, "retired-menu.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Retired visible claim is not valid current evidence: Best Record.");
    expect(evaluation.issues).toContain("Retired visible claim is not valid current evidence: Begin Tutorial.");
    expect(evaluation.issues).toContain("Retired visible claim is not valid current evidence: Endless Training.");
    expect(summarizeMobileDeviceValidationIssues(evaluation.issues).missingArtifacts).toEqual([]);
  });

  it("rejects Start Endless Training as retired visible copy outside menu evidence", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const retiredTutorialHandoff = completedValidation.replace(
      "Tutorial Cleared handoff showed Start Training.",
      "Tutorial Cleared handoff showed Start Endless Training."
    );
    const evaluation = evaluateMobileDeviceValidation(retiredTutorialHandoff, "retired-tutorial-handoff.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "Retired visible claim is not valid current evidence: Start Endless Training."
    );
  });

  it("requires Start Training when physical evidence claims the tutorial handoff", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const unnamedTutorialHandoff = completedValidation.replace(
      "Tutorial Cleared handoff showed Start Training.",
      "Tutorial Cleared handoff screenshot showed the visible primary action."
    );
    const evaluation = evaluateMobileDeviceValidation(unnamedTutorialHandoff, "unnamed-tutorial-handoff.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "Tutorial handoff evidence must mention Start Training as the visible primary action."
    );
  });

  it("rejects a negated tutorial action even when Start Training appears on another surface", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const negatedTutorialHandoff = completedValidation.replace(
      "Tutorial Cleared handoff showed Start Training.",
      "Tutorial Cleared handoff did not show Start Training. The menu showed Start Training."
    );
    const evaluation = evaluateMobileDeviceValidation(negatedTutorialHandoff, "negated-tutorial-handoff.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "Tutorial handoff evidence must mention Start Training as the visible primary action."
    );
  });

  it("accepts Start Training handoff evidence without rejecting internal endless provenance", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const evaluation = evaluateMobileDeviceValidation(completedValidation, "current-tutorial-handoff.md", { evidenceRoot });

    expect(evaluation.ready).toBe(true);
    expect(evaluation.issues).toEqual([]);
  });

  it("rejects retired tutorial handoff copy in referenced markdown evidence", () => {
    const evidenceRoot = writeEvidenceArtifacts({
      override: {
        "observer-note.md": Buffer.from(
          "Observer note: thumb reach acceptable, finger occlusion acceptable, touch latency acceptable, no boot audio, and user-action sound confirmed. Tutorial Cleared handoff showed Start Endless Training.",
          "utf8"
        )
      }
    });
    const evaluation = evaluateMobileDeviceValidation(completedValidation, "retired-artifact-copy.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "Retired visible claim is not valid current evidence: Start Endless Training."
    );
  });

  it("requires Best Rank persistence evidence to name a full relaunch", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const partialRelaunch = completedValidation
      .replace(
        "photo native-relaunch-best-record.jpg shows the default menu with Best Rank after app termination and full relaunch.",
        "photo native-relaunch-best-record.jpg shows Best Rank after returning to the menu."
      )
      .replace(
        "native-relaunch-best-record.jpg photo shows the default menu with Best Rank after app termination and full relaunch.",
        "native-relaunch-best-record.jpg photo shows Best Rank after returning to the menu."
      );
    const evaluation = evaluateMobileDeviceValidation(partialRelaunch, "partial-relaunch.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Best Rank persistence visible after relaunch: persistence evidence must mention a full relaunch.");
    expect(evaluation.issues).toContain("Native relaunch persisted Best Rank: persistence evidence must mention a full relaunch.");
  });

  it("requires Best Rank persistence evidence on the visible default menu", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const wrongSurface = completedValidation
      .replace(
        "photo native-relaunch-best-record.jpg shows the default menu with Best Rank after app termination and full relaunch.",
        "photo native-relaunch-best-record.jpg shows Settings with Best Rank after app termination and full relaunch."
      )
      .replace(
        "native-relaunch-best-record.jpg photo shows the default menu with Best Rank after app termination and full relaunch.",
        "native-relaunch-best-record.jpg photo shows Settings with Best Rank after app termination and full relaunch."
      );
    const evaluation = evaluateMobileDeviceValidation(wrongSurface, "wrong-best-rank-surface.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Best Rank persistence visible after relaunch: persistence evidence must show Best Rank on the visible default menu, not another surface or QA metadata.");
    expect(evaluation.issues).toContain("Native relaunch persisted Best Rank: persistence evidence must show Best Rank on the visible default menu, not another surface or QA metadata.");
  });

  it("requires the five-round sample to prove uncapped continuation with Token Credits remaining", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const boundedSample = completedValidation
      .replace(
        "screen recording standard-endless-five-rounds.mov shows five consecutive rounds sampled within an uncapped Training session, then continues beyond round five while Token Credits remain.",
        "screen recording standard-endless-five-rounds.mov shows five consecutive rounds sampled within a Training session."
      )
      .replace(
        "standard-endless-five-rounds.mov records five consecutive rounds sampled within an uncapped Training session and continuation beyond round five while Token Credits remain.",
        "standard-endless-five-rounds.mov records five consecutive rounds sampled within a Training session."
      );
    const evaluation = evaluateMobileDeviceValidation(boundedSample, "bounded-sample.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Training observation sample covers at least five rounds: observation evidence must show continuation beyond round five.");
    expect(evaluation.issues).toContain("Training observation sample covers at least five rounds: observation evidence must state that Token Credits remain at continuation.");
    expect(evaluation.issues).toContain("Standard-phone Training observation sample: observation evidence must show continuation beyond round five.");
  });

  it("requires separate Play and Results reach evidence to name their controls", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const genericReach = completedValidation
      .replace(
        "observer note: one-handed small phone reached Sound, Clear, Exit, Resolve, Next, Continue, and Finish.",
        "observer note: one-handed thumb reach was acceptable."
      )
      .replace(
        "observer note: on the Results screen, one-handed small phone reached Review Token Log, Run Training Again, and Return to Menu.",
        "observer note: one-handed thumb reach was acceptable."
      );
    const evaluation = evaluateMobileDeviceValidation(genericReach, "generic-reach.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Play-screen thumb reach acceptable: reach evidence must mention Resolve.");
    expect(evaluation.issues).toContain("Play-screen thumb reach acceptable: reach evidence must mention Finish.");
    expect(evaluation.issues).toContain("Results thumb reach acceptable: reach evidence must mention Review Token Log.");
    expect(evaluation.issues).toContain("Results thumb reach acceptable: reach evidence must mention Return to Menu.");
  });

  it("rejects a negated Results action even when the same copy appears on the menu", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const negatedResultsAction = completedValidation.replace(
      "observer note: on the Results screen, one-handed small phone reached Review Token Log, Run Training Again, and Return to Menu.",
      "observer note: on the Results screen, one-handed small phone reached Review Token Log and Return to Menu; on Results, Run Training Again was not visible. The menu showed Run Training Again."
    );
    const evaluation = evaluateMobileDeviceValidation(negatedResultsAction, "negated-results-action.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      "Results thumb reach acceptable: reach evidence must mention Run Training Again."
    );
  });

  it("accepts explicit absence of retired menu and tutorial handoff copy", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const retiredCopyAbsent = completedValidation
      .replace(
        "photo small-phone-menu.jpg shows the menu with WienerWorks, Tokenizer Training, Best Rank, Tutorial, Training, Token Log, and Settings readable.",
        "photo small-phone-menu.jpg shows the menu with WienerWorks, Tokenizer Training, Best Rank, Tutorial, Training, Token Log, and Settings readable; Best Record and Begin Tutorial were absent, and Endless Training was not displayed."
      )
      .replace(
        "Tutorial Cleared handoff showed Start Training.",
        "Tutorial Cleared handoff showed Start Training; Start Endless Training was not displayed."
      );
    const evaluation = evaluateMobileDeviceValidation(retiredCopyAbsent, "retired-copy-absent.md", { evidenceRoot });

    expect(evaluation.ready).toBe(true);
    expect(evaluation.issues).toEqual([]);
  });

  it("rejects menu-only Sound Off persistence despite a saved relaunch artifact", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const menuOnlySound = completedValidation
      .replace(
        "photo native-relaunch-sound-off.jpg shows Settings with Sound: Off before app termination and again shows Settings with Sound: Off after full relaunch.",
        "photo native-relaunch-sound-off.jpg shows Sound: Off on the main menu before app termination and after full relaunch; the Settings button is visible."
      )
      .replace(
        "native-relaunch-sound-off.jpg photo shows Settings with Sound: Off before app termination and again shows Settings with Sound: Off after full relaunch.",
        "native-relaunch-sound-off.jpg photo shows Sound: Off on the main menu before app termination and after full relaunch; the Settings button is visible."
      );
    const evaluation = evaluateMobileDeviceValidation(menuOnlySound, "menu-only-sound.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Sound persistence visible in Settings after relaunch: sound persistence evidence must show Sound: Off in the visible Settings view, not menu-only or QA metadata.");
    expect(evaluation.issues).toContain("Native relaunch persisted Sound Off in Settings: sound persistence evidence must show Sound: Off in the visible Settings view, not menu-only or QA metadata.");
    expect(summarizeMobileDeviceValidationIssues(evaluation.issues).missingArtifacts).toEqual([]);
  });

  it("rejects QA metadata as Sound Off persistence evidence", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const metadataOnlySound = completedValidation
      .replace(
        "photo native-relaunch-sound-off.jpg shows Settings with Sound: Off before app termination and again shows Settings with Sound: Off after full relaunch.",
        "photo native-relaunch-sound-off.jpg contains QA metadata for Settings reporting Sound: Off before app termination and after full relaunch."
      )
      .replace(
        "native-relaunch-sound-off.jpg photo shows Settings with Sound: Off before app termination and again shows Settings with Sound: Off after full relaunch.",
        "native-relaunch-sound-off.jpg contains QA metadata for Settings reporting Sound: Off before app termination and after full relaunch."
      );
    const evaluation = evaluateMobileDeviceValidation(metadataOnlySound, "metadata-only-sound.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Sound persistence visible in Settings after relaunch: sound persistence evidence must show Sound: Off in the visible Settings view, not menu-only or QA metadata.");
    expect(evaluation.issues).toContain("Native relaunch persisted Sound Off in Settings: sound persistence evidence must show Sound: Off in the visible Settings view, not menu-only or QA metadata.");
  });

  it("rejects named artifact evidence when the local file is missing", () => {
    const evidenceRoot = writeEvidenceArtifacts({ omit: ["small-review-feedback.jpg"] });
    const evaluation = evaluateMobileDeviceValidation(completedValidation, "completed.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain(
      `Small-phone review feedback card: referenced evidence artifact is missing: small-review-feedback.jpg (looked in ${join(evidenceRoot, "small-review-feedback.jpg")}).`
    );
    expect(summarizeMobileDeviceValidationIssues(evaluation.issues).missingArtifacts).toContain("small-review-feedback.jpg");
  });

  it("rejects named image or video evidence that is only a placeholder file", () => {
    const evidenceRoot = writeEvidenceArtifacts({
      override: {
        "small-phone-menu.jpg": Buffer.from("placeholder image", "utf8"),
        "standard-endless-five-rounds.mov": Buffer.from("placeholder video", "utf8")
      }
    });
    const evaluation = evaluateMobileDeviceValidation(completedValidation, "completed.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Small-phone menu: small-phone-menu.jpg must be PNG or JPEG image evidence: " + join(evidenceRoot, "small-phone-menu.jpg") + ".");
    expect(evaluation.issues).toContain("Standard-phone Training observation sample: video artifact is too small to be useful: standard-endless-five-rounds.mov (17 bytes).");
    expect(evaluation.issues).toContain("Standard-phone Training observation sample: video artifact must look like an MP4/QuickTime recording: standard-endless-five-rounds.mov.");
  });

  it("rejects an observer note artifact without physical touch or audio observations", () => {
    const evidenceRoot = writeEvidenceArtifacts({
      override: {
        "observer-note.md": Buffer.from("The screen looked acceptable.", "utf8")
      }
    });
    const evaluation = evaluateMobileDeviceValidation(completedValidation, "completed.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Observer note on thumb reach, finger occlusion, touch latency, and audio output: markdown evidence artifact is too short to be useful: observer-note.md.");
    expect(evaluation.issues).toContain("Observer note on thumb reach, finger occlusion, touch latency, and audio output: markdown evidence artifact observer-note.md must mention thumb reach.");
    expect(evaluation.issues).toContain("Observer note on thumb reach, finger occlusion, touch latency, and audio output: markdown evidence artifact observer-note.md must mention finger occlusion.");
    expect(evaluation.issues).toContain("Observer note on thumb reach, finger occlusion, touch latency, and audio output: markdown evidence artifact observer-note.md must mention touch latency.");
    expect(evaluation.issues).toContain("Observer note on thumb reach, finger occlusion, touch latency, and audio output: markdown evidence artifact observer-note.md must mention audio or mute behavior.");
  });

  it("rejects text-only observer inventory that skips latency or audio observations", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const thinObserver = completedValidation.replace(
      "- Observer note on thumb reach, finger occlusion, touch latency, and audio output: observer-note.md records thumb reach, finger occlusion, touch latency, no boot audio, and user-action audio.",
      "- Observer note on thumb reach, finger occlusion, touch latency, and audio output: observer note records thumb reach and finger occlusion."
    );
    const evaluation = evaluateMobileDeviceValidation(thinObserver, "thin-observer.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Observer note on thumb reach, finger occlusion, touch latency, and audio output: observer evidence must mention touch latency.");
    expect(evaluation.issues).toContain("Observer note on thumb reach, finger occlusion, touch latency, and audio output: observer evidence must mention audio or mute behavior.");
  });

  it("rejects input-feel artifacts that omit required game-feel metrics", () => {
    const evidenceRoot = writeEvidenceArtifacts({
      override: {
        "input-feel-summary.md": Buffer.from("Input feel looked acceptable during the run.", "utf8")
      }
    });
    const evaluation = evaluateMobileDeviceValidation(completedValidation, "completed.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Input-feel copied summary or trace: markdown evidence artifact is too short to be useful: input-feel-summary.md.");
    expect(evaluation.issues).toContain("Input-feel copied summary or trace: markdown evidence artifact input-feel-summary.md must mention first-cut latency.");
    expect(evaluation.issues).toContain("Input-feel copied summary or trace: markdown evidence artifact input-feel-summary.md must mention no-cut acknowledgement.");
    expect(evaluation.issues).toContain("Input-feel copied summary or trace: markdown evidence artifact input-feel-summary.md must mention touch-loupe clearance.");
    expect(evaluation.issues).toContain("Input-feel copied summary or trace: markdown evidence artifact input-feel-summary.md must mention cut batch or ownership.");
    expect(evaluation.issues).toContain("Input-feel copied summary or trace: markdown evidence artifact input-feel-summary.md must mention resolve timing.");
  });


  it("requires saved artifact references in the evidence inventory for visual and run evidence", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const thinInventory = completedValidation.replace(
      "- Small-phone menu: small-phone-menu.jpg photo shows menu card with Best Rank, Tutorial, Training, Token Log, and Settings.",
      "- Small-phone menu: observer note says the menu looked readable."
    );
    const evaluation = evaluateMobileDeviceValidation(thinInventory, "thin-inventory.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Small-phone menu: evidence inventory must reference a saved artifact file.");
  });

  it("rejects desktop browser harness evidence that does not name the pinned cross-reference fixture", () => {
    const evidenceRoot = writeEvidenceArtifacts();
    const driftedDesktopHarness = completedValidation
      .replace(
        "screenshot desktop-pinned-fixture.png for mode=endless qaFixtureId=simple_001 pinned fixture route confirms browser layout remains desktop.",
        "screenshot desktop-pinned-fixture.png confirms browser layout remains desktop."
      )
      .replace(
        "screenshot desktop-pinned-fixture.png from the desktop 1280x720 mode=endless qaFixtureId=simple_001 route shows wide HUD, browser menu density, and no mobile bottom-dock leak.",
        "screenshot desktop-pinned-fixture.png shows wide HUD, browser menu density, and no mobile bottom-dock leak."
      )
      .replace(
        "- Desktop browser pinned fixture: desktop-pinned-fixture.png screenshot uses desktop 1280x720 mode=endless qaFixtureId=simple_001 pinned fixture route.",
        "- Desktop browser pinned fixture: desktop-pinned-fixture.png screenshot uses a desktop browser route."
      );
    const evaluation = evaluateMobileDeviceValidation(driftedDesktopHarness, "drifted-desktop.md", { evidenceRoot });

    expect(evaluation.ready).toBe(false);
    expect(evaluation.issues).toContain("Desktop browser harness: desktop harness evidence must mention endless mode.");
    expect(evaluation.issues).toContain("Desktop browser harness: desktop harness evidence must mention simple_001 pinned fixture.");
    expect(evaluation.issues).toContain("Desktop browser harness still matches browser contract: desktop harness evidence must mention endless mode.");
    expect(evaluation.issues).toContain("Desktop browser pinned fixture: desktop harness evidence must mention simple_001 pinned fixture.");
  });

  it("renders command-line output with issues", () => {
    const output = renderMobileDeviceValidationEvaluation(
      evaluateMobileDeviceValidation(readFileSync("docs/mobile_device_validation_completed_template.md", "utf8"))
    );

    expect(output).toContain("Tokenizer Training mobile device validation");
    expect(output).toContain("Evidence root: docs/mobile_device_evidence");
    expect(output).toContain("Decision: mobile device validation incomplete");
    expect(output).toContain("Next evidence to complete:");
    expect(output).toContain("Target evidence: iPhone SE/small phone portrait; Standard portrait phone; Large phone portrait; Desktop browser harness.");
    expect(output).toContain("Physical checklist: Menu readable; Safe areas clear; Tutorial slicing works by touch;");
    expect(output).toContain("Issues:");
  });

  it("parses validation file and evidence-root command-line arguments", () => {
    expect(parseMobileDeviceValidationArgs(["--file", "docs/custom.md", "--evidence-root", "/tmp/evidence"])).toEqual({
      file: "docs/custom.md",
      evidenceRoot: "/tmp/evidence"
    });
    expect(parseMobileDeviceValidationArgs(["docs/positional.md", "--evidence-root=/tmp/inline"])).toEqual({
      file: "docs/positional.md",
      evidenceRoot: "/tmp/inline"
    });
  });
});

function writeEvidenceArtifacts(options: { omit?: string[]; override?: Record<string, Buffer> } = {}): string {
  const evidenceRoot = mkdtempSync(join(tmpdir(), "tt-mobile-device-evidence-"));
  const omit = new Set(options.omit ?? []);
  for (const artifact of [
    "small-phone-menu.jpg",
    "standard-endless-five-rounds.mov",
    "large-menu.png",
    "large-active.png",
    "desktop-pinned-fixture.png",
    "small-tutorial-cut.mov",
    "small-review-feedback.jpg",
    "native-relaunch-best-record.jpg",
    "audio-output.mov",
    "native-relaunch-sound-off.jpg",
    "observer-note.md",
    "input-feel-summary.md"
  ]) {
    if (!omit.has(artifact)) {
      writeFileSync(join(evidenceRoot, artifact), options.override?.[artifact] ?? artifactEvidence(artifact));
    }
  }

  return evidenceRoot;
}

function artifactEvidence(artifact: string): Buffer {
  if (/\.(?:png|jpe?g)$/i.test(artifact)) {
    return jpegEvidence(368, 800);
  }
  if (/\.(?:mov|mp4)$/i.test(artifact)) {
    return videoEvidence();
  }
  if (/\.md$/i.test(artifact)) {
    if (artifact === "input-feel-summary.md") {
      return Buffer.from(
        "Input-feel trace: first-cut latency 80ms; no-cut acknowledgement near-slot count 1; touch-loupe clearance 36px with finger visibility; broad swipe owned as cut batch 2; resolve timing after last cut 900ms with no hesitation.",
        "utf8"
      );
    }
    return Buffer.from(
      "Observer note: thumb reach acceptable, finger occlusion acceptable, touch latency acceptable, no boot audio, and user-action sound confirmed.",
      "utf8"
    );
  }
  return Buffer.from(artifact, "utf8");
}

function jpegEvidence(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(12_000, 0);
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

function videoEvidence(): Buffer {
  const bytes = Buffer.alloc(12_000, 0);
  bytes.writeUInt32BE(24, 0);
  bytes.write("ftyp", 4, "ascii");
  bytes.write("qt  ", 8, "ascii");
  return bytes;
}
