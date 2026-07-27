# Tokenizer Training Mobile Device Validation

Use this document for the final physical-device pass before calling the mobile port complete. It does not replace browser QA, simulator QA, or the five-user playtest protocol. Its job is narrower: prove that the mobile version is playable, readable, and faithful to the browser game on real touchscreen hardware.

## Required Targets

- iPhone SE/small phone portrait.
- Standard portrait phone.
- Large phone portrait.
- Desktop browser harness.

Run the mobile phone targets on real hardware when possible. Simulator screenshots can prove shell layout and safe-area behavior, but they do not prove finger occlusion, thumb reach, perceived touch latency, or audible output.

## Preflight

Before device validation, run:

```sh
npm run mobile:preflight
```

`npm run mobile:preflight` expands to fixture generation, the full test suite, browser build, iOS web-asset build, and `npm run mobile:crossref`. It proves the local browser/mobile evidence is coherent before the physical-device pass starts.

Run `npm run mobile:capture` from a normal terminal when you need to refresh `.qa/iab-surface-compare/latest`, `.qa/mobile-port-audit/latest`, and `.qa/mobile-runtime/latest` from live browser routes. In the managed Codex shell, browser subprocesses can be blocked; use the Codex in-app browser with the same routes in `docs/mobile_shell.md`, then run the validators below.

Run `npm run mobile:crossref` directly when you only need to validate already-captured browser/mobile evidence. This is the local browser/mobile interface parity gate; it does not replace physical-device touch, occlusion, latency, or audio observations.

`npm run mobile:crossref` wraps the lower-level `npm run mobile:surface` and `npm run mobile:runtime` evidence checks. Run those directly only when narrowing a surface artifact failure from a runtime artifact failure.

Run `npm run mobile:freshness` after refreshing browser/mobile or simulator evidence. This verifies that the current screenshots and QA JSON are newer than the UI, layout, shell, and generated iOS web-asset files they claim to prove. If it fails, recapture the named stale artifact group before treating browser/mobile parity as current.

Run `npm run mobile:simulator` after refreshing `.qa/ios-simulator/latest` through XcodeBuildMCP. This proves shell boot, the documented live routes loading, active canvas rendering, and visible safe-area/layout state in Simulator. Tutorial-complete copy is part of simulator freshness provenance, so changing its `Start Training` action makes the saved native evidence stale until that route is recaptured. Simulator evidence does not prove fixture pinning, frozen timing, physical touch behavior, audio behavior, or browser/native pixel parity.

Run `npm run mobile:local` when you need the one-command local comparison gate. It runs browser/mobile cross-reference, native simulator evidence check, and freshness check in sequence. Passing this command means the saved local artifacts are coherent and current; it still does not mean the real-device pass is complete.

Run `npm run mobile:physical` before the phone pass. It summarizes whether local browser/mobile, simulator, and freshness evidence are ready, then prints the exact physical targets, checks, artifact inventory, and commands still needed. It can report "ready for physical device pass" while physical validation is still incomplete; that is not a completion claim.

Run `npm run mobile:device-probe` after connecting hardware. It checks whether `xcrun xcdevice list` can see an available physical iPhone or iPad. Passing the probe does not replace the physical checklist, but failing it means this machine cannot perform the native phone pass yet.

If the probe lists a physical iPhone/iPad as unavailable, treat that as a different failure from no device being connected: unlock the device, trust this Mac, enable Developer Mode if required, resolve any Xcode pairing prompt, and rerun `npm run mobile:device-probe` before collecting native evidence.

Run `npm run mobile:status` when you need a non-destructive summary of the current port state. It reports local browser/mobile/simulator readiness, physical iPhone/iPad visibility, physical evidence completion, and the final completion gate without treating the expected missing-device state as a command failure.

For browser cross-reference, run `npm run playtest:serve` and use the QA routes in `docs/mobile_shell.md`. The required desktop baseline is the pinned endless browser route at `1280x720` with `qaFixtureId=simple_001`, normally captured as `desktop-pinned-fixture.png`: `?mode=endless&playtestReset=1&qaViewport=1280x720&qaFreezeElapsedMs=6200&qaFixtureId=simple_001`. For the native shell, use the `TokenizerTraining` Xcode scheme and the launch arguments documented in `docs/mobile_shell.md`.

Run `npm run mobile:desktop-evidence` after `npm run mobile:local` if the desktop browser harness artifact has already been refreshed. It copies the locally validated pinned desktop fixture from `.qa/mobile-port-audit/latest/browser-desktop-endless-pinned-simple-001.png` into `docs/mobile_device_evidence/desktop-pinned-fixture.png` and fills only the desktop browser harness rows in `docs/mobile_device_validation_completed.md`. It does not mark phone targets, physical touch checks, audio checks, or the final decision as passed.

## Preserve

The device pass must preserve:

- tokenizer fixtures and token evidence
- scoring economics, verified credits, rework, net credits, remaining credits, rank
- swipe/cut detection and staged-cut recovery
- tutorial and endless session flow, presented to players as uncapped Training
- high-score persistence, presented to players as Best Rank
- mute persistence and no boot-time audio, presented to players as `Sound: Off`
- Wiener as the only character voice
- feedback card as the canonical token/cut/result evidence surface

Safe to adapt or refactor:

- safe-area layout
- menu density and mobile typography
- touch-target spacing
- QA launch hooks
- shell/platform loading
- browser-vs-mobile visual comparison tooling

Do not reintroduce hidden side panels, footer panels, assistant panels, detached tutorial popups, separate token-strip review UI, robot/overseer surfaces, or old `Manual Tokenization Training` naming.

## Physical Pass/Fail Checklist

Record a photo, screen recording, or explicit observer note for every failure. Mark the pass only when the actual device, not only a simulator, satisfies the item.

Obsolete menu labels such as `Best Record`, `Begin Tutorial`, and `Endless Training` do not satisfy the current contract. `Start Endless Training` is also retired visible copy anywhere in current physical evidence. When evidence includes the Tutorial Cleared handoff, its visible primary action must be `Start Training`. Lowercase internal `endless`, `mode=endless`, route or QA IDs, and stable artifact filenames such as `standard-endless-five-rounds.mov` remain valid provenance rather than player-facing claims.

- Menu: WienerWorks, Wiener, `Tokenizer Training`, visible `Best Rank`, and the `Tutorial`, `Training`, `Token Log`, and `Settings` actions are readable without overlap or clipping. The menu has no Sound control.
- Safe areas: the Dynamic Island/notch and home indicator do not cover HUD, playfield, feedback card, or bottom controls.
- Tutorial slicing: a first-time player can stage cuts with a finger without edge-swipe conflicts or accidental browser/app gestures.
- Tutorial review: feedback card shows clean segmentation, token split, verified/rework/net credits, and boundary audit without needing a separate token-strip surface.
- Training observation sample: play at least five consecutive rounds within one uncapped Training run and observe the transition from round five into another round while Token Credits remain. Five rounds is the minimum observation window, not a mode, completion condition, or Results boundary.
- Play-screen thumb reach: `Sound`/`Muted`, `Clear`, `Exit`, and the primary `Resolve` control, including Training's `Next` and the tutorial's `Continue` and `Finish` states, are reachable one-handed on the small phone target.
- Results thumb reach: `Review Token Log`, `Run Training Again`, and `Return to Menu` are reachable one-handed on the small phone target.
- Finger occlusion: the player can see the prompt, cut markers, and feedback while slicing; the finger does not hide the decision point for ordinary short prompts.
- Touch latency: cuts feel immediate enough that the player trusts the staged markers; missed/false cuts are attributable to the game state, not lag.
- Input-feel metrics: copied summary or observer trace records first-cut latency, no-cut acknowledgements, touch-loupe clearance, cut batch or owned-swipe behavior, and resolve timing or hesitation. This is the physical-device check tied to the Swink/game-feel notes and `docs/game_design_concepts/02_text_cutting_game_feel.md`.
- Best Rank persistence: complete a Training result, fully terminate the native app, and launch it normally without a QA route override. The default menu must show the same `Best Rank` and rounds after relaunch; a seeded route or QA metadata is not physical persistence proof.
- Audio: app launches silently; after a user action, sound plays when enabled; no sound plays while `Sound: Off` is active.
- Sound Off persistence: open Settings and set `Sound: Off` before fully terminating the native app. After a normal full relaunch, open Settings again and show `Sound: Off`. A menu capture or QA metadata does not prove this requirement.
- Visual tone: WienerWorks reads as obsolete, hostile, degraded training software rather than cute SaaS, neon cyberpunk, or generic beige OS.
- Desktop harness: the pinned desktop browser route `?mode=endless&playtestReset=1&qaViewport=1280x720&qaFreezeElapsedMs=6200&qaFixtureId=simple_001` still presents the browser layout and does not inherit mobile-only bottom-docked assumptions.

## Evidence To Save

Minimum evidence for completion:

- small-phone portrait menu screenshot or photo
- small-phone portrait active tutorial screenshot or photo after at least one staged cut
- small-phone portrait review screenshot or photo showing the feedback card
- standard-phone uncapped Training recording, normally `standard-endless-five-rounds.mov`, showing at least five consecutive resolved rounds and the transition beyond round five while Token Credits remain
- large-phone portrait menu and active-play screenshots or photos
- `native-relaunch-best-record.jpg` showing the persisted `Best Rank` on the default menu after a normal full relaunch
- `native-relaunch-sound-off.jpg` showing `Sound: Off` in Settings after a normal full relaunch, paired with an observer note or recording that confirms `Sound: Off` was set in Settings before termination
- observer note covering the exact play-screen and Results thumb-reach actions, finger occlusion, touch latency, audio output, and the pre-termination `Sound: Off` step
- input-feel copied summary or trace showing first-cut latency, no-cut acknowledgement behavior, touch-loupe clearance, cut batch/owned-swipe behavior, and resolve timing
- desktop browser harness screenshot for the pinned `1280x720` endless `qaFixtureId=simple_001` fixture route used in mobile comparison, normally saved as `desktop-pinned-fixture.png`

After the physical pass, create the completed evidence file from `docs/mobile_device_validation_completed_template.md`, fill every row, then validate it:

```sh
npm run mobile:prepare
npm run mobile:local
npm run mobile:desktop-evidence
npm run mobile:physical
npm run mobile:device-probe
npm run mobile:status
npm run mobile:validate
npm run mobile:freshness
npm run mobile:completion
```

`npm run mobile:prepare` also creates `docs/mobile_device_validation_completed.md` and `docs/mobile_device_evidence/`; both are ignored by Git because they are local physical-test artifacts that can include private device captures and observer notes. It seeds `docs/mobile_device_evidence/observer-note.md` from `docs/mobile_device_observer_note_template.md` and `docs/mobile_device_evidence/input-feel-summary.md` from `docs/mobile_device_input_feel_summary_template.md` if those files do not already exist. If those note files exist but are still blank template-shaped files from an older run, it refreshes them to the current template; it keeps any file with filled observations. Reference artifact filenames from that directory in `docs/mobile_device_validation_completed.md`; `npm run mobile:validate` checks that every referenced `.png`, `.jpg`, `.mov`, `.mp4`, or `.md` file exists and is structurally plausible. When validation is incomplete, it first prints a grouped `Next evidence to complete` summary for target rows, physical checklist rows, inventory entries, missing artifact files, and the final decision, then keeps the full row-level issue list. Image artifacts must be real PNG/JPEG files, video artifacts must look like MP4/QuickTime recordings, observer-note markdown must include substantive touch/audio observations, and input-feel markdown must include the required metric families. Pure observer notes may remain textual, but named artifact evidence must be saved locally.

`npm run mobile:desktop-evidence` is safe to rerun for the desktop harness; pass `-- --overwrite` only when you intentionally want to replace an existing local desktop harness artifact or desktop rows. It is not a substitute for the physical phone pass.

The observer note, whether saved as `observer-note.md` or written directly into the completed validation file, must cover play-screen thumb reach, Results thumb reach, finger/hand occlusion, touch latency or trust, audio/boot behavior, and setting `Sound: Off` in Settings before termination. `npm run mobile:validate` fails when any required observation family is missing.

The input-feel evidence, preferably saved as `input-feel-summary.md`, must record first-cut latency, no-cut acknowledgement behavior, touch-loupe clearance or finger visibility, cut batch/owned-swipe behavior, and resolve timing or hesitation. If the tester uses the copied game summary, paste the `Input feel trace` section with its `Input feel fields:` legend so the compact metric labels remain interpretable. This turns the game-feel requirement into checkable evidence rather than a general impression.

Use `docs/mobile_device_evidence_manifest.md` for the preferred artifact filenames and the required content of each capture.

## Completion Rule

The mobile port is not complete if `npm run mobile:validate`, `npm run mobile:freshness`, or `npm run mobile:completion` fails, or if any required target has unreadable text, clipped safe-area UI, unreachable Play or Results controls, untrusted slicing, missing feedback-card evidence, broken persistence, audible boot-time sound, stale cross-reference artifacts, or a mismatch with the preserved browser mechanics. A five-round recording that does not establish uncapped continuation, a `Best Rank` capture outside the default menu after full relaunch, or `Sound: Off` evidence based only on the menu or QA metadata must fail closed.
