# Tokenizer Training Mobile Shell

Tokenizer Training ships to iOS as a narrow SwiftUI/WKWebView shell around the existing Phaser/Vite game. The shell owns only app container concerns: bundled asset loading, safe-area/fullscreen hosting, WebKit lifecycle, and simulator/device launch. Tokenizer fixtures, scoring economics, swipe/cut detection, difficulty/rank progression, session/results flow, high score persistence, tutorial/endless structure, and the visible game contract remain owned by the web game.

## Build Flow

The `TokenizerTraining` Xcode target runs `npm run build:ios-web` before copying resources. That command type-checks the web repo and builds Vite assets with `--base ./` into `ios/TokenizerTraining/WebAssets/`. The generated folder is ignored by Git; source changes belong in `src/`, tests, or the iOS shell files.

The shell serves `WebAssets` through the custom `tokenizertraining://app/` scheme instead of `file://`. This keeps Vite module paths predictable in WKWebView while preserving browser-local APIs such as canvas, touch input, audio unlock behavior, and local storage.

The browser build renders the finite sound-cue set through Web Audio. The iOS shell mirrors the same cue names through a private, origin-bound native audio bridge and uses Web Audio only as a fallback when that bridge is absent. Mute state, cue timing, and gameplay call sites remain web-owned; the shell owns only reliable iOS output routing.

The iOS shell loads `index.html?surface=mobile` by default. Browser builds default to the `browser` surface unless a QA URL explicitly supplies `surface=mobile` or `ttSurface=mobile`. Surface profiles are interface contracts only; they must not fork tokenizer fixtures, scoring, swipe/cut detection, difficulty progression, session flow, or high-score storage.

The SwiftUI container is full-screen, so the web game owns safe-area layout. Keep `viewport-fit=cover` in `index.html`, keep the CSS `env(safe-area-inset-*)` custom properties in `src/styles/global.css`, and pass those insets through the game layout systems. Do not zero the mobile surface insets: that places the HUD under the Dynamic Island even though the shell itself is full-height.

For simulator cross-reference only, the shell accepts a launch argument named `--tt-query`. The value must be a query string, not a URL or path; the shell always prefixes `surface=mobile` and rejects path-like input. This lets the simulator open live game routes for structural shell checks without creating a second app target or changing normal app launch behavior. Production iOS WebAssets do not apply the browser-development fixture or timer controls, so these launches are not deterministic fixture captures.

The shell also accepts `--tt-muted true|false` for simulator QA. It seeds the existing `tokenizer-training.muted` localStorage key before the web game boots, so mute persistence can be checked through the normal `Sound: On/Off` control in Settings after app termination/relaunch. Do not use it as a gameplay shortcut; it exists to make the native storage path inspectable without depending on canvas interaction.

Menu, results, Tutorial Cleared/Failed, read-only Token Log, and non-gameplay
Settings publish a shared DOM semantic counterpart beside the canvas. For
simulator inspection only, append
`semanticUi=visible` through `--tt-query` to reveal that otherwise clipped
surface. This exposes the exact semantic projection for inspection inside
WKWebView; it is not a gameplay mode and must not appear in normal app launches.
Token slicing remains canvas-only. Visible semantic rendering is not a WCAG
conformance claim or proof of whole-app VoiceOver or Larger Text support.

The target declares `UILaunchStoryboardName=LaunchScreen` and includes `LaunchScreen.storyboard` in the app resources. Keep that wiring in place: without a launch screen, modern iPhone simulators can run the WKWebView in a legacy letterboxed frame, leaving black bands above and below the game even though the web canvas itself works.

## Browser/Mobile Cross-Reference

`scripts/capture-mobile-cross-reference.ts` is the route and file authority for this handoff. The manual manifest below mirrors that script so an operator can recover evidence when Playwright cannot launch; if the script and this document disagree, stop and correct the document rather than improvising a route or filename.

From a normal terminal outside the managed Codex shell, the repo capture command can refresh the same evidence:

```sh
npm run mobile:capture
```

`npm run mobile:capture` starts Vite, launches Playwright Chromium, captures desktop browser, compact browser, and `surface=mobile` routes, saves screenshots plus dev-only `tokenizer-training-qa` JSON, and then runs the browser/mobile cross-reference evaluator. Its browser contexts explicitly set `deviceScaleFactor: 1`, reduced motion, and mobile/touch emulation for routes marked as mobile input. The managed Codex shell can block browser subprocesses; when that happens, use the controlled-browser fallback below rather than treating the game as broken.

### Canonical Browser Artifacts

Fresh menu captures belong in `.qa/iab-surface-compare/latest/` with exactly these names:

- `comparison.json`
- `browser-desktop-menu.png`
- `browser-compact-menu.png`
- `mobile-surface-menu.png`
- `mobile-surface-menu-tall.png`

Surface captures belong in `.qa/mobile-port-audit/latest/`. Each route has one PNG and one same-stem JSON record:

- `browser-desktop-tutorial-active-fresh.png` and `browser-desktop-tutorial-active-fresh.json`
- `mobile-surface-tutorial-active-small-fresh.png` and `mobile-surface-tutorial-active-small-fresh.json`
- `mobile-surface-tutorial-active-large-after.png` and `mobile-surface-tutorial-active-large-after.json`
- `browser-desktop-endless-pinned-simple-001.png` and `browser-desktop-endless-pinned-simple-001.json`
- `mobile-surface-endless-pinned-simple-001.png` and `mobile-surface-endless-pinned-simple-001.json`
- `mobile-surface-results-small-after.png` and `mobile-surface-results-small-after.json`

Interaction-derived runtime captures belong in `.qa/mobile-runtime/latest/` with exactly these names:

- `cua-flow-result.json`, `cua-flow-review.png`, and `cua-flow-review.json`
- `cua-endless-flow-clean-result.json`, `cua-endless-review-clean.png`, and `cua-endless-review-clean.json`
- `cua-endless-auto-check-result.json`, `cua-endless-auto-check-next-round.png`, and `cua-endless-auto-check-next-round.json`
- `cua-endless-review-held-tight-result.json`, `cua-endless-review-held-tight.png`, and `cua-endless-review-held-tight.json`
- `cua-feedback-card-readable-phone-result.json`, `cua-feedback-card-readable-phone.png`, and `cua-feedback-card-readable-phone.json`

After a capture-only or manual refresh, run:

```sh
npm run mobile:crossref
npm run mobile:freshness
```

When moving between Codex chats or tool surfaces, run:

```sh
npm run mobile:crossref:status
```

That command is the autonomy check: it verifies that the repo still has the capture/evaluation wiring, that the current browser/mobile artifacts satisfy the contract, and that those artifacts are fresh enough to use as evidence. If it reports stale evidence, refresh with `npm run mobile:capture` from a normal terminal or use the controlled Chrome QA routes in this section when browser subprocess capture is blocked.

### Controlled-Browser Fallback

Use this fallback when `npm run mobile:capture` fails because the managed Codex shell cannot launch Playwright Chromium, especially with a `MachPortRendezvousServer` or browser-process permission error. It uses the same route and artifact contract and must end with the same validators, but its evidentiary scope is narrower than the scripted Playwright path.

1. Start the local game server:

```sh
npm run playtest:serve -- --host 127.0.0.1 --port 5173
```

2. Load the active Chrome control runtime, select the Chrome extension browser,
   and read its complete control documentation before navigating. Resolve the
   current `chrome:control-chrome` skill root from the active Codex skill list
   and stop if its `scripts/browser-client.mjs` is unavailable. Do not record a
   machine-specific plugin cache path in this repository.

3. Capture the route manifest below into `.qa/iab-surface-compare/latest/`, `.qa/mobile-port-audit/latest/`, and `.qa/mobile-runtime/latest/`. Keep every filename and JSON sidecar exactly as listed above.

4. Perform the in-page interactions described below for review and round-two evidence. A direct URL only selects the initial active state.

5. Stop the local server after capture, then validate the refreshed evidence:

```sh
npm run mobile:crossref
npm run mobile:freshness
npm run mobile:crossref:status
```

If controlled Chrome cannot navigate a route, perform the required interaction, extract the exact QA JSON, or save the intended artifact, fail closed. For a menu or surface route, save `<route-id>.failure.json` plus a best-effort `<route-file-stem>.failure.png` in the intended directory, including the URL, viewport, params, error, and last QA snapshot available. Do not copy old artifacts, rename near matches, touch timestamps, synthesize sidecars, or weaken a validator. A failure artifact is diagnostic only: leave the canonical success evidence unproven and report the validators as failed.

Opening the same URL manually does not reproduce Playwright browser-context options. Unless the controlling tool independently reports them, controlled Chrome/manual capture cannot claim touch emulation, DPR=1, reduced-motion, or physical touch evidence. Mouse or pointer-driven in-page QA interactions are structural browser evidence, not proof of a finger gesture, thumb reach, occlusion, touch latency, or device behavior. Passing a screenshot or JSON validator does not expand that claim.

`npm run mobile:crossref` validates the menu comparison, `.qa/mobile-port-audit/latest`, and `.qa/mobile-runtime/latest` together. It checks shared product identity across browser and mobile, intentional mobile menu adaptation on short and tall mobile captures, active-play surface parity, feedback evidence, touch-target status, pinned-fixture runtime behavior, and endless auto-advance.

`npm run mobile:freshness` is the provenance gate for autonomous cross-reference. It compares the latest menu, active/results surface, tutorial/endless runtime, and iOS simulator artifacts against the source files and generated iOS web assets they claim to prove. If a UI/platform source file is newer than the screenshot or QA JSON, the evidence is stale and must be recaptured before `npm run mobile:completion` can pass. This gate is intentionally separate from `npm run mobile:preflight` so normal source edits can still run the local build/test path before new screenshots exist.

The menu screenshot files may contain PNG or JPEG bytes, regardless of their extension, but they must be real image evidence at the expected viewport dimensions: `1280x720` for desktop browser, `368x552` for compact browser and short mobile, and `368x800` for tall mobile. Placeholder files or stale captures with the wrong dimensions fail `npm run mobile:crossref`.

### Browser Capture Route Manifest

These are the current script-owned entry routes. They can also be opened manually while `npm run playtest:serve` is running:

- `browser-desktop-menu`: `http://127.0.0.1:5173/?playtestReset=1&qaViewport=1280x720` -> `.qa/iab-surface-compare/latest/browser-desktop-menu.png`.
- `browser-compact-menu`: `http://127.0.0.1:5173/?playtestReset=1&qaViewport=368x552` -> `.qa/iab-surface-compare/latest/browser-compact-menu.png`.
- `mobile-surface-menu`: `http://127.0.0.1:5173/?surface=mobile&playtestReset=1&qaViewport=368x552` -> `.qa/iab-surface-compare/latest/mobile-surface-menu.png`.
- `mobile-surface-menu-tall`: `http://127.0.0.1:5173/?surface=mobile&playtestReset=1&qaViewport=368x800` -> `.qa/iab-surface-compare/latest/mobile-surface-menu-tall.png`.
- `browser-desktop-tutorial-active-fresh`: `http://127.0.0.1:5173/?mode=tutorial&playtestReset=1&qaViewport=1280x720&qaFreezeElapsedMs=6200&qaCanvasCapture=1` -> `.qa/mobile-port-audit/latest/browser-desktop-tutorial-active-fresh.png`.
- `mobile-surface-tutorial-active-small-fresh`: `http://127.0.0.1:5173/?surface=mobile&mode=tutorial&playtestReset=1&qaViewport=368x552&qaFreezeElapsedMs=6200&qaCanvasCapture=1` -> `.qa/mobile-port-audit/latest/mobile-surface-tutorial-active-small-fresh.png`.
- `mobile-surface-tutorial-active-large-after`: `http://127.0.0.1:5173/?surface=mobile&mode=tutorial&playtestReset=1&qaViewport=390x844&qaFreezeElapsedMs=6200&qaCanvasCapture=1` -> `.qa/mobile-port-audit/latest/mobile-surface-tutorial-active-large-after.png`.
- `browser-desktop-endless-pinned-simple-001`: `http://127.0.0.1:5173/?mode=endless&playtestReset=1&qaViewport=1280x720&qaFreezeElapsedMs=6200&qaFixtureId=simple_001&qaCanvasCapture=1` -> `.qa/mobile-port-audit/latest/browser-desktop-endless-pinned-simple-001.png`.
- `mobile-surface-endless-pinned-simple-001`: `http://127.0.0.1:5173/?surface=mobile&mode=endless&playtestReset=1&qaViewport=368x552&qaFreezeElapsedMs=6200&qaFixtureId=simple_001&qaCanvasCapture=1` -> `.qa/mobile-port-audit/latest/mobile-surface-endless-pinned-simple-001.png`.
- `mobile-surface-results-small-after`: `http://127.0.0.1:5173/?surface=mobile&mode=protocol-results&playtestReset=1&qaViewport=368x552` -> `.qa/mobile-port-audit/latest/mobile-surface-results-small-after.png`.
- Held-review runtime entry: `http://127.0.0.1:5173/?surface=mobile&mode=endless&playtestReset=1&qaViewport=368x552&qaFreezeElapsedMs=6200&qaFixtureId=simple_001&qaHoldReview=1&qaCanvasCapture=1` -> `.qa/mobile-runtime/latest/cua-endless-review-held-tight.png`.

The current visible menu identity is `Welcome to WienerWorks`, `Tokenizer Training`, `Best Rank`, `Tutorial`, `Training`, `Token Log`, and `Settings`. Cross-reference those visible labels and their order across browser and mobile layouts; layout adaptation is intentional, so do not require pixel parity.

For active play, cross-reference HUD, timer, prompt lane, Wiener/speech, feedback card, and bottom controls. The browser compact surface may keep the emergency top control row on very short viewports; the mobile surface must bottom-dock controls for thumb reach and measure feedback-card clearance against that bottom row.

Use `qaFixtureId` only for internal PlayScene QA. It is dev-only, applies to endless/main mode after tutorial selection has been ruled out, and fails loudly if a requested fixture ID is missing. This prevents mobile/browser comparisons from silently drifting onto different random fixtures.

Use `qaHoldReview=1` only when capturing internal endless review screenshots. It does not deep-link to review: stage the five target cuts at boundaries `3`, `7`, `11`, `14`, and `18`, then activate Resolve. The flag only suppresses endless auto-advance after the review read window so the feedback card can be captured without racing the timer. Treat it as stable feedback-card/token evidence only; normal tutorial/endless review captures remain responsible for proving Wiener speech. It must not be used for tester sessions or production behavior claims.

Review and round-two states require in-page QA interactions rather than direct URLs. For tutorial review, stage the target cuts and activate Resolve. For endless clean review, do the same without `qaHoldReview`, capture during the normal review window, then wait for normal auto-advance into round two. A held-review route cannot prove round-two auto-advance, and an active-entry screenshot cannot stand in for review evidence.

After capturing the browser/mobile runtime artifacts, run:

```sh
npm run mobile:surface
npm run mobile:runtime
```

`npm run mobile:surface` validates `.qa/mobile-port-audit/latest` plus the source-level menu QA snapshot. It checks that the desktop browser and mobile surface share the current product identity, prompt fixture, HUD/playfield/Wiener/control contract, and results evidence while preserving intentional mobile differences such as compact copy and larger touch controls.

`npm run mobile:runtime` validates `.qa/mobile-runtime/latest` against the gameplay cross-reference contract: tutorial staged cuts and review feedback, endless pinned `simple_001` boundaries, feedback-card token/ledger/cut evidence, the targeted short-phone readable-card capture, touch-target status, review screenshots, and normal endless auto-advance into round 2. The receipt must expose `RESOLVED TOKENS`, `VERIFIED`, `REWORK`, `NET`, and the `OK` / `MISS` / `FALSE` audit without duplicating HUD Token Credits. These are local browser/mobile evidence gates, not replacements for simulator screenshots or physical-device validation.

Runtime capture must also include active touch-assist evidence before cuts are submitted. The `loupePreview` state now proves the rejected detached loupe stays hidden while the inline armed-preview slot records the armed boundary and snap-ready state. Runtime screenshots must keep sibling QA JSON sidecars, and the short-phone readable feedback artifact should use the same held-review frame as the speech/feedback evidence so Wiener speech cannot disappear between sequential screenshot samples.

Simulator screenshots belong in `.qa/ios-simulator/latest/`:

- `manifest.json`
- `default-menu.jpg`
- `tutorial-active.jpg`
- `endless-active.jpg`
- `results.jpg`
- `settings.jpg`
- `settings-reset-confirm.jpg`
- `token-log.jpg`
- `tutorial-complete.jpg`
- `tutorial-failed.jpg`
- `semantic-menu.jpg`
- `semantic-results.jpg`
- `semantic-tutorial-complete.jpg`
- `semantic-tutorial-failed.jpg`
- `semantic-token-log.jpg`
- `semantic-settings.jpg`
- `semantic-settings-reset-confirm.jpg`
- `semantic-token-log-bottom.jpg` (interaction-derived supporting frame)

The sixteen route frames are required by `npm run mobile:simulator`.
`semantic-token-log-bottom.jpg` additionally records that the WKWebView scroll
area reaches the last ordered mapping and Back control; the automated evaluator
does not infer that interaction from a static image.

After refreshing those screenshots through XcodeBuildMCP, run:

```sh
npm run mobile:simulator
```

`npm run mobile:simulator` validates that the native shell built successfully,
loaded nine ordinary/direct canvas routes and rendered the seven required
semantic QA routes. The automated gate validates declared route metadata, image format,
dimensions, encoded variation, and that no route reuses identical encoded image
bytes. It does not recognize screen content, so the visible route/content claim
requires inspection of every captured frame. Even after inspection, this
evidence does not prove fixture pinning, frozen timing, touch behavior, audio
behavior, VoiceOver activation, or browser/native pixel parity. Simulator
screenshots must be real PNG/JPEG images whose dimensions match the screen size
recorded in `.qa/ios-simulator/latest/manifest.json`.

The reset-confirmation frame uses
`mode=settings-reset-confirm&playtestReset=1`. It proves the bundled web runtime
can render the modal inside the native safe area. Because the WKWebView remains
one scroll area with no actionable canvas descendants, the manifest must keep
`resetPointerActivationProven` false. The separate state-machine tests prove that
the real first activation only requests confirmation; neither source tests nor
the direct route count as a physical tap, Cancel, or confirmed-deletion trial.

The semantic Settings frames use `mode=settings&semanticUi=visible` and
`mode=settings-reset-confirm&semanticUi=visible`. Manual inspection records that
the bundled projection, switch/status rows, and alert-dialog layout render inside
the native safe area. The automated gate verifies file structure, not visible
copy; the manifest must keep automatic visual proof, semantic Settings keyboard
activation, and VoiceOver activation false.

Use the same route query in the native simulator with XcodeBuildMCP launch arguments:

```json
{
  "launchArgs": [
    "--tt-query",
    "mode=endless&playtestReset=1"
  ]
}
```

Use the same native storage path for mute persistence checks:

```json
{
  "launchArgs": [
    "--tt-muted",
    "true"
  ]
}
```

Useful simulator cross-reference routes:

- Native mobile menu: no launch arguments.
- Native mobile endless active route: `--tt-query mode=endless&playtestReset=1`
- Native mobile results: `--tt-query mode=protocol-results&playtestReset=1`
- Native mobile tutorial active route: `--tt-query mode=tutorial&playtestReset=1`
- Native mobile settings: `--tt-query mode=settings&playtestReset=1`
- Native mobile token log: `--tt-query mode=token-log&playtestReset=1`
- Native mobile tutorial cleared: `--tt-query mode=tutorial-complete&playtestReset=1`
- Native mobile tutorial failed: `--tt-query mode=tutorial-failed&playtestReset=1`
- Native mobile muted menu seed: `--tt-muted true`
- Native semantic menu QA: `--tt-query semanticUi=visible&playtestReset=1`
- Native semantic results QA: `--tt-query mode=protocol-results&semanticUi=visible&playtestReset=1`
- Native semantic tutorial-cleared QA: `--tt-query mode=tutorial-complete&semanticUi=visible&playtestReset=1`
- Native semantic tutorial-failed QA: `--tt-query mode=tutorial-failed&semanticUi=visible&playtestReset=1`
- Native semantic Token Log QA: `--tt-query mode=token-log&semanticUi=visible&playtestReset=1`
- Native semantic Settings QA: `--tt-query mode=settings&semanticUi=visible&playtestReset=1`
- Native semantic Settings confirmation QA: `--tt-query mode=settings-reset-confirm&semanticUi=visible&playtestReset=1`

Do not append `qaFixtureId`, `qaFreezeElapsedMs`, `qaHoldReview`, `qaCanvasCapture`, or `qaViewport` to native production-shell launches. Those are browser-development controls and are not evidence of applied native state. In particular, the native tutorial example above intentionally uses only `mode=tutorial&playtestReset=1`.

These simulator routes prove shell boot, live route loading, active canvas rendering, and visible safe-area/layout state. They do not prove fixture pinning, frozen timing, touch behavior, audio behavior, or browser/native pixel parity, and they do not replace browser `qaViewport` captures because the production iOS bundle does not expose the dev-only QA snapshot.

The current XcodeBuildMCP UI snapshot collapses WKWebView descendants into one scroll container. This remained true when ordinary HTML headings and buttons were visibly rendered by the `semanticUi=visible` QA route, so a zero-target snapshot is a tooling boundary rather than evidence that the DOM counterpart is absent. Native autonomous comparison can prove bundled semantic rendering for captured routes, but it cannot claim VoiceOver discovery or activation. That requires a physical-device/manual accessibility pass or a future simulator tool that exposes WKWebView descendants. Browser QA remains the source for deterministic fixture/timer captures, fine-grained cut staging, feedback text, QA JSON, and keyboard DOM behavior. No whole-app VoiceOver, WCAG, or Larger Text claim is permitted while the slicing loop remains canvas-only and unverified.

The shared web runtime also observes `prefers-reduced-motion` inside WKWebView.
Settings reports the effective system state. The reduced policy stops Wiener idle
and reaction movement, dissolves resolved pieces in place, and removes cut-impact
scaling while preserving the falling sentence clock and every logical timer.
Evidence for Loop 7 is under `.qa/ios-simulator/loop-7-reduced-motion/`. The app
and iOS Settings currently prove the off-state signal path. XcodeBuildMCP renders
but does not expose the native Reduce Motion switch as an actionable target, so
the enabled treatment remains a manual simulator/device gate and must not be
claimed from source tests alone.

The shell also owns a finite `tokenizerTrainingHaptics` message bridge. At
document start it injects the result of
`CHHapticEngine.capabilitiesForHardware().supportsHaptics`; the web runtime uses
that flag plus handler presence before selecting native output. The handler
accepts only the five game-owned cue names and bounded cut repeats from the main
frame at `tokenizertraining://app`, rate-limits messages, ignores background
state, and is removed when the web view is dismantled. UIKit feedback generators
produce the discrete cues; Core Haptics is not used for custom playback.

Simulator Settings must show `Haptics: Unavailable`. This proves capability
truth and bridge integration, not tactile output, because Simulator has no
haptic interface. Loop 8 evidence is in
`.qa/ios-simulator/loop-8-haptics/`. A supported physical iPhone remains required
to validate output, latency, cue mapping, mute behavior, lifecycle recovery, and
comfort during repeated slicing.

The web runtime owns a versioned haptics preference; the native shell does not
duplicate it. On capable hardware Settings shows `Haptics: On` or `Haptics: Off`.
The first capable run derives the default from the existing Sound preference so
previously muted players are not surprised, then Sound and Haptics remain
independent. An unavailable route shows `Haptics: Unavailable` without erasing
the stored value. Loop 9 Simulator evidence is under
`.qa/ios-simulator/loop-9-haptic-preference/`; it proves the unavailable layout
and current bundle only, not the capable toggle or tactile output.

## Validation

Run the web gates before simulator/device QA:

```sh
npm run mobile:preflight
```

`npm run mobile:preflight` expands to fixture generation, the full test suite, browser build, iOS web-asset build, and `npm run mobile:crossref`. The cross-reference command includes the menu comparison plus the surface/runtime evidence gates.

After any UI, layout, shell, safe-area, or generated iOS web-asset change, refresh the relevant screenshots/QA JSON and run:

```sh
npm run mobile:freshness
```

When full Xcode is selected, use the shared `TokenizerTraining` scheme against at least:

- iPhone SE/small phone portrait
- Standard portrait phone
- Large phone portrait
- Desktop browser harness

Use `docs/mobile_device_validation.md` for the physical-device pass/fail checklist, then run `npm run mobile:validate` against the completed evidence file. After the evidence file passes, run `npm run mobile:freshness` and `npm run mobile:completion` as the final fail-closed audit. Simulator screenshots can prove shell and safe-area behavior; they do not prove thumb reach, finger occlusion, perceived touch latency, or physical audio output.

Simulator pass/fail criteria:

- The app launches directly into Tokenizer Training with no missing-assets fallback.
- The game background fills the simulator frame rather than appearing inside black compatibility letterbox bands.
- The default mobile menu shows `Best Rank` after a saved result survives app termination/relaunch.
- HUD, prompt/playfield, Wiener, speech bubble, feedback card, and bottom controls stay inside safe areas.
- Touch slicing produces the same cut staging, resolve flow, evidence card, and scoring behavior as the desktop browser harness.
- High score persists across app termination/relaunch.
- Audio remains muted/unmuted according to existing storage state and does not autoplay before user interaction.
