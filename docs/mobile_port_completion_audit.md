# Tokenizer Training Mobile Port Completion Audit

Status: not complete. Simulator evidence is current; active/results and runtime browser evidence is stale, and physical-device validation remains open.

This audit maps the mobile-port objective to current evidence. It is stricter than a feature checklist: the simulator/browser goal is complete only when the full tutorial and endless game run on the mobile platform shell, stay faithful to the browser mechanics, read well in the available mobile simulator surfaces, and pass the final local evidence gates.

## Requirement Map

| Objective requirement | Current evidence | Status |
| --- | --- | --- |
| Port the full game to mobile | iOS shell exists under `ios/TokenizerTraining.xcodeproj`; `npm run build:ios-web` bundles the Phaser/Vite game into WKWebView; simulator launches menu, tutorial, endless, results, settings, token log, tutorial-cleared, and tutorial-failed routes. | Locally satisfied |
| Include tutorial and main/endless mode | Browser mobile runtime evidence covers tutorial cut staging, tutorial review, Continue, endless pinned fixture, endless review, and endless auto-advance. Native simulator route launch covers default menu, results, and live endless active shell loading/rendering; it does not prove native fixture pinning or frozen timing. | Locally satisfied; physical device unproven |
| Preserve tokenizer fixtures | `npm run generate:fixtures` regenerates 200 `cl100k_base` fixtures; `npm run test` covers exact 30/30/20/20 content mix, uniqueness, mobile line length, fixture validity, and whole-quota selection. No mobile surface forks fixture data. | Satisfied |
| Preserve scoring economics, difficulty, rank, session/results flow | Tests cover economy, scoring, difficulty, rank, session flow, results, and storage. Mobile changes are layout/shell/QA glue, not scoring model changes. | Satisfied |
| Preserve swipe/cut detection model | Existing swipe/cut and input lifecycle tests pass; mobile browser runtime staged the expected `simple_001` cut boundaries. | Locally satisfied; physical touch latency and finger occlusion unproven |
| Preserve high-score and mute persistence | XcodeBuildMCP simulator relaunch evidence shows `Best Rank: Junior Boundary Clerk / 7 rounds` after a seeded result and `Sound: Off` after muted relaunch. Unit tests cover storage and lazy audio context creation. | Simulator validated |
| Keep visible UI contract conceptually intact | Mobile menu, HUD, playfield, Wiener, active/review Wiener speech bubble, feedback card, bottom controls, and results screen are documented in `docs/mobile_optimization_report.md`; screenshots and tests cover safe areas, speech geometry, feedback geometry, and layout. Budget results evidence now includes the reduced result set: run, cuts, accuracy, and rank. | Locally satisfied |
| Avoid banned old surfaces/naming | Mobile docs and tests preserve Tokenizer Training naming, Wiener-only character voice, feedback-card evidence, and ban side/footer/assistant panels, detached tutorial popups, separate token-strip review UI, robot/overseer surfaces, and old `Manual Tokenization Training` public naming. | Satisfied |
| Optimize for mobile play | Mobile surface bottom-docks controls, consumes safe-area insets, exposes touch-target checks, keeps compact `Best Rank`, uses the approved WienerWorks menu card with `Tutorial`, `Training`, `Token Log`, and `Settings`, suppresses the detached touch loupe in favor of inline armed-preview evidence, gives compact results rank a full-width card, and avoids Dynamic Island overlap. | Locally strong; physical thumb reach/finger occlusion unproven |
| Stay in tune with browser version | `surface=mobile` is a layout/profile contract; `docs/mobile_shell.md` defines browser/mobile cross-reference routes and simulator launch arguments. Browser/mobile evidence can be regenerated through the documented capture workflow where local-browser policy allows it. `npm run mobile:crossref` validates the captured contract, `npm run mobile:freshness` rejects stale captures after source edits, and `npm run mobile:crossref:status` reports whether Codex can autonomously trust the current comparison. Desktop browser harness remains a required validation target. | Contract wired; active/results and runtime browser artifacts currently stale |
| Address visual artifacts and confusing/suboptimal UI | Letterboxing and Dynamic Island HUD overlap were fixed; the mobile menu now follows the approved reference, removes the old status-line filler, uses `Best Rank`, and gives `Settings` the same button treatment as other menu actions. The detached touch loupe is hidden while inline armed-preview evidence remains measurable. Mobile feedback-card crowding was tightened by removing the duplicate diagnosis headline from the visible card while keeping Wiener review speech; Token Credit depletion results use four larger metrics and omit the redundant zero-credit card. Active/review speech layout and reduced depletion-results metric evidence are now part of surface provenance, so stale screenshots fail closed. | Locally improved; physical pass still separate |
| Return final report with next-step proposals | `docs/mobile_optimization_report.md` contains recommendation, working evidence, remaining gaps, and next optimization proposals. | Satisfied |

## Authoritative Commands

These gates must pass before physical-device validation:

```sh
npm run mobile:preflight
```

`npm run mobile:preflight` expands to fixture generation, the full test suite, browser build, iOS web-asset build, and `npm run mobile:crossref`.

`npm run mobile:capture` starts Vite, captures the browser desktop, browser compact, and `surface=mobile` QA routes, writes `.qa/iab-surface-compare/latest`, `.qa/mobile-port-audit/latest`, and `.qa/mobile-runtime/latest`, then runs the cross-reference evaluator. It is a normal-terminal helper; in the managed Codex shell, use the in-app browser for capture when browser subprocess launch is denied.

`npm run mobile:surface` validates the current `.qa/mobile-port-audit/latest` browser/mobile surface evidence plus the source-level menu QA snapshot. It checks the shared product identity, desktop-vs-mobile menu contract, prompt fixture parity, HUD/playfield/Wiener/speech/control surfaces, mobile touch targets, reduced Token Credit depletion metric evidence including cuts, accuracy, and rank, absence of a redundant zero-credit card, and the copied-summary input-feel trace legend required for the physical-device evidence packet.

`npm run mobile:runtime` validates the current `.qa/mobile-runtime/latest` browser/mobile evidence. It checks tutorial cut staging and review, endless pinned `simple_001` boundaries, feedback-card evidence, short-phone readable-card evidence, touch-target status, required screenshots, and endless auto-advance. It is intentionally separate from the final physical-device gate.

`npm run mobile:crossref` validates the current menu comparison in `.qa/iab-surface-compare/latest` plus the same surface/runtime evidence. It is the preferred local answer to "does the mobile interface still match the browser game contract?"

`npm run mobile:crossref:status` is the preferred diagnostic for "can Codex autonomously cross-reference browser and mobile right now?" It checks the capture/evaluator package-script wiring, the documentation route handoff, the current browser/mobile contract evidence, and evidence freshness. If it fails only on stale artifacts, refresh with `npm run mobile:capture` from a normal terminal or the Codex in-app browser QA routes in `docs/mobile_shell.md`, then rerun `npm run mobile:crossref` and `npm run mobile:freshness`.

`npm run mobile:freshness` validates whether the current browser/mobile and iOS simulator artifacts are fresh enough to be used as evidence. It compares menu, active/results surface, tutorial/endless runtime, and simulator screenshots/QA JSON against the UI/platform source files and generated iOS web assets they claim to prove. It is the preferred local answer to "am I looking at the current version or an old capture?"

`npm run mobile:simulator` validates the current native iOS simulator screenshots in `.qa/ios-simulator/latest`: default menu, tutorial active route, live `endless-active` route, results route, settings, token log, tutorial cleared, and tutorial failed. It requires real PNG/JPEG screenshot evidence whose dimensions match the manifest screen size. It proves shell boot, live route loading, active canvas rendering, and visible safe-area/layout state on Simulator. It does not prove fixture pinning, frozen timing, touch behavior, audio behavior, or browser/native pixel parity.

`npm run mobile:local` is the preferred local comparison gate after browser/mobile evidence has been refreshed. It runs `npm run mobile:crossref`, `npm run mobile:simulator`, and `npm run mobile:freshness` in sequence, so Codex can check parity, validate native shell evidence, and check evidence currency without relying on memory or screenshots alone.

`npm run mobile:physical` is the readiness packet for the remaining real-device pass. It requires local/simulator/freshness evidence to be ready, then prints the physical targets, checks, artifact inventory, and next commands. It does not mark physical validation complete.

`npm run mobile:device-probe` checks whether Xcode can currently see an available physical iPhone or iPad through `xcrun xcdevice list`. It is a hardware-visibility diagnostic only: a passing probe does not replace real-device evidence, and a failing probe explains why the native physical pass cannot be run from this machine yet. If a physical iPhone or iPad is visible but unavailable, the next action is to unlock the device, trust this Mac, enable Developer Mode if required, or resolve the Xcode pairing prompt before collecting native evidence.

`npm run mobile:status` is the non-destructive status summary for handoff work. It reports whether local parity is ready, whether the desktop browser harness has been seeded, whether a physical iPhone/iPad is visible, whether the physical evidence packet is complete, and whether the final completion gate is closed.

The final mobile completion gate is:

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

`npm run mobile:prepare` creates the ignored local file `docs/mobile_device_validation_completed.md` from the template without overwriting existing evidence, creates the ignored local directory `docs/mobile_device_evidence/` for physical artifacts, seeds `docs/mobile_device_evidence/observer-note.md` from `docs/mobile_device_observer_note_template.md`, and seeds `docs/mobile_device_evidence/input-feel-summary.md` from `docs/mobile_device_input_feel_summary_template.md` if absent. If either note file is present but still a blank template-shaped file from an older run, the command refreshes it to the current template while preserving any file with filled observations. `npm run mobile:desktop-evidence` can then seed the locally provable desktop browser harness artifact and desktop rows from the refreshed `.qa/mobile-port-audit/latest/browser-desktop-endless-pinned-simple-001.png` capture; it does not mark physical phone targets or the final decision as complete. `docs/mobile_device_evidence_manifest.md` defines the preferred artifact names. `npm run mobile:validate` must fail until that local file exists, every named artifact exists under the evidence root, image/video/markdown artifacts are structurally plausible, required inventory items reference saved artifacts, input-feel evidence records first-cut latency/no-cut acknowledgements/touch-loupe clearance/cut batch ownership/resolve timing, and the small-phone, standard-phone, large-phone, and desktop-browser targets are proven with substantive physical-device evidence. Its incomplete output begins with a grouped `Next evidence to complete` summary, but the full row-level issue list remains the authority. `npm run mobile:freshness` must pass after browser/mobile/simulator artifacts are refreshed against the latest source/build outputs. `npm run mobile:completion` must fail until local mobile evidence, freshness evidence, physical-device evidence, the final report, and this completion audit all agree that the port is complete.

## Current Blocker

The remaining completion blockers are physical-device evidence gates, not known gameplay breakage:

- real-device touch slicing, thumb reach, finger occlusion, and perceived latency
- input-feel trace evidence for first-cut latency, no-cut acknowledgement, touch-loupe clearance, cut batch ownership, and resolve timing
- physical audio output after user interaction, plus no boot-time sound
- no available physical iPhone or iPad is currently visible to `npm run mobile:device-probe`
- completed evidence file at `docs/mobile_device_validation_completed.md`
- saved photos, recordings, screenshots, or observer notes under `docs/mobile_device_evidence/`
- artifact names matching or updating `docs/mobile_device_evidence_manifest.md`
- passing `npm run mobile:validate`
- passing `npm run mobile:completion`

The current build, tests, and simulator evidence are functional, but browser active/results and runtime parity artifacts still need an allowed refresh path. Physical-device evidence also remains required before the full device-validation gate can close.
