# Tokenizer Training Mobile Optimization Report

## Current Recommendation

Keep the mobile version as a native iOS shell around the existing Phaser/Vite game. This preserves tokenizer fixtures, scoring economics, cut detection, progression, tutorial/endless flow, results, storage, and WienerWorks surface language while allowing the shell to own bundled assets, launch behavior, fullscreen hosting, safe-area policy, and simulator/device QA.

Do not fork the mechanics into a separate native game. The useful split is:

- Web game owns gameplay, evidence, sessions, copy, and browser QA.
- Mobile shell owns WebKit loading, launch-screen/fullscreen behavior, app lifecycle, and simulator/device packaging.
- `surface=mobile` owns layout/platform affordances only. It must not fork tokenizer or scoring behavior.

## Implemented Optimization Record

This section preserves the design and operations changes made during the mobile optimization work. It is historical implementation provenance, not a live assertion that generated assets are current, screenshots are fresh, or validation gates pass in the present checkout. Use the commands in [Live Status Authority](#live-status-authority) for current results.

- The iOS shell builds and launches through XcodeBuildMCP using `ios/TokenizerTraining.xcodeproj`, scheme `TokenizerTraining`, bundle id `com.wienerworks.TokenizerTraining`.
- The shell loads bundled Vite assets via `tokenizertraining://app/index.html?surface=mobile`.
- The shell now accepts a simulator QA `--tt-query` launch argument so native WebKit can open live game routes for structural simulator cross-reference. Production iOS launches do not apply the browser-development fixture or timer controls.
- The shell now accepts a simulator QA `--tt-muted true|false` launch argument that seeds the same localStorage mute key used by the web game, allowing native mute persistence checks without exposing a public debug UI.
- The previous iOS simulator letterbox artifact is fixed by `UILaunchStoryboardName=LaunchScreen` plus `LaunchScreen.storyboard` in target resources.
- Native fullscreen safe-area handling is owned by the web layout. Mobile no longer drops `env(safe-area-inset-*)` values, which keeps the active-play HUD below the Dynamic Island.
- The mobile menu now keeps a compact `Best Rank` line visible, preserving parity with the browser menu while leaving module/premise copy hidden for touch-first use.
- The tall-phone mobile menu action stack is lifted closer to the best-rank line instead of sitting after a large dead band. The approved menu now preserves brand, larger Wiener, serif `Tokenizer Training`, best-rank status, and four large stacked actions without restoring desktop premise copy.
- `docs/mobile_port_completion_audit.md` maps the active mobile-port objective to current evidence. `docs/mobile_device_validation.md`, `docs/mobile_device_validation_completed_template.md`, `docs/mobile_device_evidence_manifest.md`, `docs/mobile_device_observer_note_template.md`, `docs/mobile_device_input_feel_summary_template.md`, `npm run mobile:prepare`, `npm run mobile:desktop-evidence`, and `npm run mobile:validate` define the final physical-device pass/fail gate for small, standard, and large portrait phones plus the desktop browser harness. `npm run mobile:prepare` seeds the ignored local `docs/mobile_device_validation_completed.md` file, `observer-note.md` for touch/audio observations, and `input-feel-summary.md` for game-feel metrics; if those note files already exist but are still blank template-shaped files from an older run, it refreshes them while preserving any filled observations. `npm run mobile:desktop-evidence` seeds only the locally provable desktop browser harness artifact and desktop rows from fresh `.qa` evidence; it does not mark real-phone checks or the final decision as passed. `npm run mobile:validate` verifies that every named `.png`, `.jpg`, `.mov`, `.mp4`, or `.md` artifact exists under the evidence root and is structurally plausible, and now prints a grouped missing-evidence summary before the detailed failure list. The completed packet also requires an input-feel summary or trace covering first-cut latency, no-cut acknowledgements, touch-loupe clearance, cut batch/ownership, and resolve timing.
- `npm run mobile:preflight` now runs the full local mobile gate: fixture generation, full tests, browser build, iOS web-asset build, browser/mobile surface comparison, and browser/mobile runtime validation.
- `npm run mobile:capture` exists as a normal-terminal helper: it starts Vite, captures desktop browser, compact browser, and `surface=mobile` QA routes through Playwright, writes `.qa/iab-surface-compare/latest`, `.qa/mobile-port-audit/latest`, and `.qa/mobile-runtime/latest`, and then runs the cross-reference evaluator. In the managed Codex shell, browser subprocess launch is blocked, so `docs/mobile_shell.md` now documents the exact Codex in-app browser fallback against the same routes before running `npm run mobile:crossref`.
- `npm run mobile:crossref` now gives Codex a single browser/mobile comparison gate across the captured menu artifacts, including short and tall mobile menu captures, `.qa/mobile-port-audit/latest`, and `.qa/mobile-runtime/latest`. The menu capture gate now verifies PNG/JPEG image bytes, expected viewport dimensions, and encoded visual-content variation instead of accepting placeholder or header-only screenshot files.
- `npm run mobile:crossref:status` is the autonomous comparison diagnostic. It verifies that the repo still has the capture/evaluation package-script wiring, that `docs/mobile_shell.md` still documents the in-app-browser fallback path, that the current browser/mobile artifacts satisfy the contract, and that those artifacts are fresh enough to use as evidence.
- `npm run mobile:simulator` now validates native iOS simulator shell evidence from `.qa/ios-simulator/latest`: default menu, tutorial active route, live `endless-active` route, results route, real screenshot image bytes at the manifest screen size, encoded visual-content variation, and the explicit limitations of structural simulator evidence.
- `npm run mobile:freshness` now validates evidence provenance for autonomous browser/mobile cross-reference. It fails when menu, active/results surface, tutorial/endless runtime, or iOS simulator artifacts are older than the relevant UI/platform source files and generated iOS web assets they claim to prove. Menu-only layout changes are isolated to menu and simulator provenance rather than forcing unrelated active-play recaptures. Active speech layout and review feedback-card layout are included in surface provenance, so stale mobile screenshots cannot hide speech or review-evidence regressions.
- `npm run mobile:local` now runs the local browser/mobile/simulator contract gate: cross-reference, simulator evidence, and freshness in one command. It is the command to use after refreshing browser/mobile evidence when checking whether the current mobile interface is still in tune with the browser version before starting the physical-device pass.
- `npm run mobile:device-probe` now checks whether Xcode can see an available physical iPhone or iPad before the real-device pass. It separates "local artifacts are ready" from "hardware is connected and visible," and it distinguishes a visible-but-unavailable phone from no connected phone so the next action can be trust, Developer Mode, or Xcode pairing rather than recapturing browser evidence.
- `npm run mobile:status` was added as a non-destructive diagnostic across local parity, hardware visibility, physical evidence, and final completion. It recognizes the expected intermediate state where `npm run mobile:desktop-evidence` has seeded the desktop harness row but the phone evidence packet is still blank, reports `Desktop browser harness evidence: seeded`, and shows a concise physical-evidence summary instead of a long row-by-row phone failure list.
- `npm run mobile:completion` was added as the fail-closed completion authority. It requires local mobile evidence, evidence freshness, physical-device validation, the final optimization report, and the completion audit to agree before it returns complete.
- `npm run mobile:surface` now validates browser/mobile visual-surface parity from `.qa/mobile-port-audit/latest` plus the source-level menu QA snapshot: desktop menu copy, mobile menu Best Rank visibility, shared prompt fixture, HUD/playfield/Wiener/speech/control contract, compact speech text and HUD/pet/prompt clearance, mobile touch target size, reduced Token Credit depletion metric evidence including cuts, accuracy, and rank, absence of a redundant zero-credit card, and the copied-summary input-feel trace legend needed for physical-device evidence.
- `npm run mobile:runtime` now validates the local `.qa/mobile-runtime/latest` browser/mobile cross-reference evidence for tutorial cuts/review, endless pinned fixture boundaries, feedback-card evidence, short-phone feedback-card readability, touch-target status, screenshots, and endless auto-advance.
- `npm run mobile:runtime` now rejects placeholder runtime screenshots: the tutorial review, endless review, endless auto-next, and short-phone feedback-card artifacts must be real PNG/JPEG image evidence at the `368x552` mobile viewport dimensions with enough encoded visual variation to reject structurally valid but effectively blank captures. Required runtime screenshots and listed runtime screenshot artifacts must also have sibling QA JSON with named HUD, playfield, text, control, pet, and feedback geometry; those rects must stay inside the mobile viewport, listed controls must retain 44px touch targets, review feedback cards must leave at least 8px above the bottom controls, and named feedback regions must carry visible token-split, verified/rework/net-credit, and cut-audit text, so the saved image and UI-layer evidence stay paired.
- Runtime capture now records active touch-assist evidence before cuts are submitted in tutorial and pinned endless routes. The validator requires the detached touch loupe to stay hidden while the inline armed-preview rect proves snap-ready boundary evidence, so browser/mobile comparison covers the rejected floating-card artifact instead of only final review screenshots.
- `npm run mobile:capture` now leaves route-level failure artifacts for browser/menu/surface route failures: `<route-id>.failure.json` plus a best-effort `<route-file>.failure.png`. Failed captures still fail the command, but the artifact trail records the URL, route parameters, error text, last QA snapshot summary when one existed, and screenshot metadata.
- Mobile play controls bottom-dock on short phones under `surface=mobile`, while browser compact can still retain its emergency top-row layout for comparison.
- Compact active-play controls now use the same exit semantics across tutorial and endless: mobile tutorial changed from `Menu` to `Exit`, preserving the documented Sound / Clear / Exit / Resolve control contract and avoiding a misleading menu-surface label during live play.
- Feedback-card review geometry now receives the same safe-area and surface profile as play layout, so review evidence is measured against the actual mobile control row.
- Short-phone `surface=mobile` review now lifts only the review prompt to make room for a 140px feedback card at 368x552. That keeps token/credit/audit evidence in the canonical card while moving mobile audit copy from the old 104px ultra-tight layout to a compact form. Mobile can also use a compact diagnosis line for overlong technical headings; browser/desktop review cards keep the full boundary-audit and technical wording.
- Wiener review speech remains visible on compact review surfaces, while the feedback card carries token split, verified/rework/net-credit, and cut-audit evidence without a duplicate diagnosis headline.
- Compact mobile review HUD now uses `REVIEW` instead of the earlier `REVW` abbreviation, removing a typo-like label without changing review timing, scoring, or evidence.
- Compact mobile results now give the rank metric a full-width card and slightly larger metric text, improving ledger readability without adding a second results panel or changing rank/economy data.
- Layout tests now stress every generated tokenizer fixture against a worst-case compact mobile review stack on the 368x552 card, including missed cuts, false cuts, rework, and depleted-credit evidence. The mobile fixture-growth gate also requires token-split evidence to fit within two compact wrapped lines and rejects any single token evidence segment that exceeds the compact card's estimated line width.
- Compact touch aim now uses the inline armed preview instead of a detached loupe card while preserving the same preview slot, snap threshold, accepted cuts, and QA input-feel metrics.
- Internal visual QA now supports `qaFixtureId` for deterministic endless/main-mode browser-vs-mobile comparison without changing production fixture selection.
- Internal visual QA now supports `qaHoldReview=1` for stable endless review capture without changing normal endless auto-advance.
- Tutorial active play, cut staging, Resolve, review feedback, and Continue control were exercised through the mobile browser runtime using canvas-coordinate input.
- Endless active play, touch-style cut staging, Resolve, review feedback, and normal auto-advance into the next endless round were exercised through the mobile browser runtime.
- Desktop active play remains visually distinct: wide HUD, centered prompt lane, right-side Wiener/speech, and desktop bottom controls.

## Live Status Authority

This report is not a live status cache. Test totals, device availability, and screenshot freshness are deliberately not copied here because they change independently of the design record.

- Run `npm test` for the current automated test result. Its output, rather than a count embedded in this report, is authoritative for that run.
- Run `npm run mobile:status` for a non-destructive diagnostic summary. It is diagnostic only and cannot declare the mobile port complete.
- Run `npm run mobile:completion` for the fail-closed authority on completion. A complete decision requires current local evidence, freshness, physical-device validation, this report's contract, and the completion audit to agree.

Historical screenshots and observations below never prove the current layout or current freshness by themselves. The evaluators and manifests decide whether captured evidence is usable for the checkout being tested.

## Evidence

### Durable Validation Routes

`npm run mobile:preflight` retains the local build-and-cross-reference sequence:

```sh
npm run generate:fixtures
npm run test
npm run build
npm run build:ios-web
npm run mobile:crossref
```

Use the narrower operations when diagnosing or refreshing a specific evidence layer:

```sh
npm run mobile:capture
npm run mobile:runtime
npm run mobile:local
npm run mobile:crossref
npm run mobile:crossref:status
npm run mobile:simulator
npm run mobile:freshness
npm run mobile:prepare
npm run mobile:desktop-evidence
npm run mobile:physical
npm run mobile:device-probe
npm run mobile:validate
```

`npm run mobile:crossref` checks captured artifacts against the browser/mobile contract. `npm run mobile:freshness` separately checks whether those artifacts are new enough to be evidence for the relevant source and generated assets. Neither a saved screenshot nor an old successful command result substitutes for rerunning the applicable evaluator.

### Historical Capture Record

The relative artifacts below identify the capture families used during optimization. Paths ending in `latest` are mutable working pointers, not durable proof of freshness. Their manifests and sibling QA JSON carry the capture-specific provenance:

- `.qa/mobile-port-audit/latest/browser-desktop-tutorial-active-fresh.png`
- `.qa/mobile-port-audit/latest/mobile-surface-tutorial-active-small-fresh.png`
- `.qa/mobile-port-audit/latest/mobile-surface-tutorial-active-large-after.png`
- `.qa/mobile-port-audit/latest/mobile-surface-results-small-after.json`
- `.qa/mobile-runtime/latest/cua-flow-result.json`
- `.qa/mobile-runtime/latest/cua-endless-flow-clean-result.json`
- `.qa/mobile-runtime/latest/cua-endless-review-held-tight-result.json`
- `.qa/mobile-runtime/latest/cua-endless-auto-check-result.json`
- `.qa/mobile-runtime/latest/cua-feedback-card-readable-phone.png`
- `.qa/mobile-runtime/latest/cua-feedback-card-readable-phone-result.json`
- `.qa/iab-surface-compare/latest/comparison.json`
- `.qa/iab-surface-compare/latest/browser-desktop-menu.png`
- `.qa/iab-surface-compare/latest/browser-compact-menu.png`
- `.qa/iab-surface-compare/latest/mobile-surface-menu.png`
- `.qa/iab-surface-compare/latest/mobile-surface-menu-tall.png`
- `.qa/ios-simulator/latest/manifest.json`
- `.qa/ios-simulator/latest/default-menu.jpg`
- `.qa/ios-simulator/latest/tutorial-active.jpg`
- `.qa/ios-simulator/latest/endless-active.jpg`
- `.qa/ios-simulator/latest/results.jpg`

At the recorded simulator capture checkpoint, the route set included default menu, tutorial active, live endless active, and protocol results on an iPhone 17-sized `368x800` viewport after an iOS WebAssets build. The captured endless image established shell boot, route loading, canvas rendering, and the visible safe-area/layout state for that checkpoint only. It did not establish fixture pinning, frozen timing, touch behavior, audio behavior, browser/native pixel parity, or the current layout.

The historical route set also included `--tt-query mode=endless&playtestReset=1`, `--tt-query mode=protocol-results&playtestReset=1`, a terminate/relaunch observation where `Best Rank: Junior Boundary Clerk / 7 rounds` remained visible, and a terminate/relaunch observation where `Sound: Off` remained visible. These observations preserve the optimization history; current simulator authority remains `npm run mobile:simulator` plus `npm run mobile:freshness` as evaluated by `npm run mobile:completion`.

The recorded tutorial runtime observation staged five cuts, reached `resolveReady: true`, entered review with `feedbackVisible: true`, retained token split, verified/rework/net-credit, and compact cut-audit text, and recorded minimum touch-target evidence. The recorded pinned `simple_001` endless observation staged boundaries `3, 7, 11, 14, 18`, entered review, and observed a subsequent active round on the non-held route. The short-phone readability observation used a `368x552` viewport and a `336x140` feedback card at `y=414`. These are historical captured observations, not claims that the corresponding browser screenshots still match the current runtime.

Unit coverage was added for deferred `AudioContext` creation, and the mobile results QA payload was extended with the copied-summary `Input feel trace` and `Input feel fields:` legend. Run `npm test` to determine whether those contracts still hold in the current checkout.

## Durable Mobile Layout Contract

`docs/current_surface_contract.md` is the visible browser authority and `docs/mobile_shell.md` defines the browser/mobile QA routes. The summary below records the intended mobile invariants; it does not promote historical screenshots into proof of the current implementation.

- Menu: one WienerWorks card with `Welcome to WienerWorks`, Wiener,
  `Tokenizer Training`, `Best Rank`, and equal `Tutorial`, `Training`, `Token
  Log`, and `Settings` actions.
- Active play: the mobile HUD shows `CREDITS`, `TIME`, and `BEST RUN` / `CURRENT`; the timer rail,
  prompt/playfield, Wiener speech, and bottom controls remain separate.
- Review: Wiener retains one review speech bubble while token/ID, economy, and
  cut-audit evidence stays in the feedback card; no detached token strip returns.
- Results: `Token Credits Depleted` shows run, cuts, accuracy, and rank;
  `Training Suspended` may additionally show remaining Token Credits. Both keep three
  stacked actions in one audit panel.

## Historical Captured Visual QA Read

This table preserves the screenshot-level judgment made from the captured optimization evidence. It is historical context, not a claim that those browser surfaces remain fresh or still represent the current layout, and it is not a substitute for the physical phone pass. Use `npm run mobile:status` for diagnosis and `npm run mobile:completion` for current authority.

| Surface | Captured read | Follow-up trigger |
| --- | --- | --- |
| Desktop menu | The browser capture showed the fuller reference surface: division line, premise copy, horizontal actions, and wider enterprise-card pacing. | Recheck after any menu copy or brand hierarchy change. |
| Short mobile menu | The approved card was readable, kept WienerWorks, Wiener, serif `Tokenizer Training`, `Best Rank`, and four equal menu actions: `Tutorial`, `Training`, `Token Log`, and `Settings`. It dropped the old division/status line to stay close to the approved reference. | If physical testers still read the empty space as unfinished, tune card spacing before adding another gameplay mode. |
| Tall mobile menu | The captured action stack sat near the meaningful center rather than at the bottom. `Settings` appeared as a normal menu action, not a secondary detached box, and the menu omitted filler status copy. | If the large-phone target still feels padded rather than hostile/obsolete on device, tune the vertical rhythm and card height before adding any new surface. |
| Active mobile play | The short-phone capture showed HUD, timer rail, prompt lane, Wiener speech, playfield, and bottom controls. The HUD was dense but carried the required economy/session information. | Physical testing must decide whether the HUD height and speech bubble crowd the finger path or reduce prompt focus. Do not remove economy fields without replacing the information elsewhere. |
| Review feedback | The captured `368x552` feedback card kept token split, verified/rework/net credits, and cut audit inside the card while Wiener retained the review speech line. It was tight but legible in that screenshot. | If physical testers miss the token or credit evidence, improve card typography or review timing before adding a separate token-strip UI. |
| Results | The captured Token Credit depletion surface used four larger metric cards: run, cuts, accuracy, and rank. It omitted the redundant zero-credit card while keeping three actions in the same audit panel. | If physical readability still fails, increase metric contrast or spacing while keeping the single evidence panel. |

## Game Feel Alignment

The mobile pass uses the archived game-feel notes as a constraint, not a decorative reference. `docs/game_design_reading_notes/swink_game_feel.md` argues that the swipe is the player's only expressive verb; `docs/game_design_concepts/02_text_cutting_game_feel.md` translates that into concrete requirements: cuts register during pointer movement, staged markers persist until resolution, touch aim feedback must stay clear of the finger, mouse and touch share the same boundary logic, and review evidence must make the player accountable for submitted cuts.

The mobile design boundary preserves that relationship. The mobile shell and `surface=mobile` profile may adapt safe areas, density, and control placement, but they must not fork scoring, tokenizer truth, snap logic, tutorial/endless flow, or feedback-card evidence. The input-feel evidence contract exposes first-cut latency, release-sample cuts, no-cut acknowledgements, correction cuts, broad-swipe batch size, touch-assist samples, snap-ready samples, unsafe-clearance samples, and minimum pointer clearance. The intended touch aid is the inline armed-preview slot, not a detached loupe. The real-device pass must judge whether those signals feel trustworthy under a finger, not only whether a saved Simulator screen looks acceptable; `npm run mobile:validate` requires an input-feel trace or summary so that judgment is recorded as evidence.

## Remaining Gaps

- The optimization record contains no accepted real-device proof of finger occlusion, physical thumb reach, device WebKit latency, physical input feel, or audible output. Treat those requirements as open unless `npm run mobile:completion` reports complete. The physical checklist lives in `docs/mobile_device_validation.md`; saved artifacts belong in `docs/mobile_device_evidence/`; the packet must include `input-feel-summary.md` or equivalent; and `npm run mobile:validate` must accept it before the full device-validation gate can close.
- At the recorded checkpoint, the native simulator group had been refreshed while active/results and runtime browser artifacts were stale because the available Chromium paths could not capture them. That split is historical only. `npm run mobile:status` diagnoses the present state, and `npm run mobile:completion` decides whether freshness and completion requirements are met.
- A historical hardware probe found no visible physical iPhone or iPad. That observation is not machine state. Run `npm run mobile:device-probe` before a phone pass to distinguish no device from an unavailable device that needs trust, Developer Mode, or Xcode pairing.
- A simulator terminate/relaunch capture observed a seeded high score on the default menu, but no app-container inspection of WKWebView local storage was recorded. Revalidate the visible behavior and freshness before relying on that observation.
- Dev/browser menu QA was extended with a hidden flat storage state containing canonical high-score and muted storage keys, raw canonical values when present, and legacy-key presence flags. This was designed to give cross-reference captures storage evidence without adding a visible panel or changing gameplay; the current test result comes from `npm test`.
- Historical observations covered deferred audio-context creation and visible mute persistence, not perceived sound timing or first-interaction unlock on real hardware. Physical listening remains part of the device evidence contract.
- App-authored review-state canvas capture from the QA chunk path was observed to be unreliable after transient renderer capture. `qaHoldReview=1` provides a browser-surface hold route, but the chunked canvas path remains a lower-priority QA-hardening item.

## Next Optimization Proposals

1. Harden artifact capture across both browser surfaces.
   `npm run mobile:capture` is the normal-terminal capture route, and `docs/mobile_shell.md` records the exact Codex Browser fallback procedure for managed-shell sessions. The runtime evidence contract requires real images at the expected mobile dimensions with encoded visual-content variation, sibling QA geometry for named HUD/playfield/control/feedback elements, viewport containment, 44px controls, review feedback-card clearance above bottom controls, and semantic feedback-card/token-split text. Route-level failures leave JSON plus best-effort screenshot artifacts; remaining hardening should add region-level nonblank checks for the feedback-card rectangle if renderer captures keep regressing.

2. Harden QA canvas capture after review.
   Historical runs found the review-state JSON more reliable than the saved renderer PNG, which could miss lower review surfaces after transient capture. Capture should be triggered after feedback layout settles, then assert that the feedback card region is nonblank.

3. Stress-test long-token and loss-heavy review copy.
   The fixture-growth contract exercises generated fixtures against the `368x552` compact review card and rejects URL/code/tokenizer-string fixtures that exceed the two-line token-split envelope or introduce a single token evidence segment too wide for the card. Run `npm test` for the current result. If that gate fails, solve it by shortening generated playable examples or compacting the feedback-card token wording; do not add a separate token-strip surface.

4. Keep the capture plan aligned with the surface contract.
   The capture plan covers the four formal menu states and the active/results/runtime routes. When `docs/current_surface_contract.md` changes, update the capture routes and evaluator together so cross-reference evidence continues to cover HUD, playfield, pet Wiener, Wiener speech, feedback card, bottom controls, and results.

5. Add deeper simulator lifecycle checks.
   Browser/dev QA exposes canonical storage keys and raw values through the hidden menu snapshot. The remaining native lifecycle improvement is to expose the same readout in a native simulator test build or add a UI-test harness that can read WKWebView storage directly, beyond the historical visible high-score and mute relaunch observation.

6. Make the real-device game-feel pass metric-driven.
   Ground the phone pass in `docs/game_design_reading_notes/swink_game_feel.md` and `docs/game_design_concepts/02_text_cutting_game_feel.md`: record whether players trust staged cuts, whether the inline touch assist remains readable under a finger without a detached loupe, whether false cuts feel like misunderstanding rather than input imprecision, whether broad swipes feel owned as one gesture, and whether review evidence makes the submitted cut record legible before token truth. `npm run mobile:validate` requires copied-summary or trace evidence for first-cut latency, no-cut acknowledgements, touch-assist readability, cut batch/ownership, and resolve timing.

7. Run one real phone playtest before declaring mobile complete.
   Use `docs/mobile_device_validation.md`, run `npm run mobile:prepare`, run `npm run mobile:local`, run `npm run mobile:desktop-evidence` to seed the locally provable desktop harness rows, run `npm run mobile:physical`, run `npm run mobile:device-probe` after connecting a phone, use `npm run mobile:status` for the current-state summary, fill `docs/mobile_device_validation_completed.md`, refresh browser/mobile/simulator evidence if needed, run `npm run mobile:validate`, run `npm run mobile:freshness`, and then run `npm run mobile:completion`. Required observations: slice accuracy, finger occlusion, bottom-control thumb reach, feedback-card readability, Wiener speech readability, perceived latency, input-feel metrics, physical audio output, and whether the degraded WienerWorks style reads as intentional rather than broken.

## Completion Position

This report does not claim that the mobile port is complete. Historical work established the intended shell, layout, evidence, and validation paths, but those observations cannot establish current build health, screenshot freshness, hardware availability, or physical-device quality. Run `npm test` for the current automated suite, use `npm run mobile:status` as a diagnostic, and accept completion only when the fail-closed `npm run mobile:completion` authority returns complete.
