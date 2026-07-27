# Optimization Experiment Log

## Loop 1 - Numerical Tokenization

Status: keep after bounded validation

### Hypothesis

Progressively disclosing real token IDs after resolution will improve the
player's mental model of tokenization without degrading the precision or
readability of the slicing phase.

### Candidate Treatments

1. Review feedback maps resolved token strings to IDs: selected.
2. Token Log provides persistent text/token/ID inspection: selected.
3. Falling resolved fragments carry IDs: rejected because fragments reflect
   submitted cuts and are not canonical tokens on imperfect rounds.

### Pass Criteria

- No token ID appears before resolution.
- Every displayed ID matches its fixture token string by index.
- Leading spaces and Unicode remain represented truthfully.
- Mobile prompt, speech, feedback, and controls do not overlap.
- Players can distinguish token count, token text, and token ID.
- Existing mechanics, scoring, timing, and persistence remain unchanged.

### Fail Criteria

- IDs read as score, cut order, or universal vocabulary numbers.
- Falling labels obscure fragments or make review harder to scan.
- The treatment duplicates or competes with the feedback card.
- Any tokenizer, scoring, input, progression, or storage behavior changes.

### Evidence

- All three research/audit agents recommend stable post-resolution evidence and
  reject moving labels.
- Code audit proved that falling-fragment/token-ID alignment is undefined on
  missed or false cuts.
- Shared formatter rejects mismatched, negative, fractional, and unsafe IDs;
  exact fixture regeneration must equal checked-in fixture data.
- Prediction-facing cut, hint, input-session, and fragment-animation sources are
  guarded against `token_ids` and the mapping formatter.
- Review displays one space-bearing mapping when available; Token Log displays
  complete ordered mappings and makes leading spaces visible as `␠`.
- Focused validation passed 69 tests. Full validation passed 95 files and 801
  tests. Fixture generation, browser build, and iOS web build passed.
- XcodeBuildMCP built and ran the current native shell. Menu and Token Log are
  clear of safe areas at 368x800. The first 11px mapping treatment was revised
  to 12px after visual inspection; the 320x568 line-budget test remains green.
- Browser screenshot refresh is still blocked by local browser policy/process
  sandboxing. `mobile:crossref:status` correctly remains red on stale evidence.

### Implementation

- `TokenDisplaySystem`: shared visible-space and encoding-qualified ID formatter.
- `FeedbackSystem`: complete token split plus one resolved ID example.
- `TokenLogSystem` and `TokenLogScene`: three persistent complete mappings.
- `TutorialSystem` and copy deck: canonical `review record` terminology and
  explicit `cl100k_base` teaching copy.
- Tests cover formatter truth, regenerated fixture equality, prediction-surface
  exclusion, compact wrapping, Token Log geometry, and tutorial copy fit.

### Decision

Keep treatments 1 and 2. Reject treatment 3 permanently under the current
fragment model. The mapping type revision passed; no mechanics or economics
changed.

### Remaining Risk

- Automated checks prove truth and fit, not player comprehension.
- The review sample may still need a small explanatory label or tutorial timing
  adjustment after observation.
- Token Log is currently a three-example static reference, not a record of the
  player's encountered prompts.
- Current browser/mobile evidence cannot be certified until stale screenshots
  and sidecars are refreshed.

### Next Experiment

Compare a recently-seen Token Log against the current static reference using a
reversible data-source change. Define success as faster recovery of a surprising
resolved example without adding a scored mode, tracking, or a new panel during
play.

## Loop 2 - Recently Reviewed Token Log

Status: keep after native validation

### Hypothesis

Replacing static-only rows with the three most recently resolved unique fixtures,
while retaining curated fallback rows, will make surprising feedback recoverable
without changing play or turning Token Log into another game mode.

### Treatment

- Versioned local record with at most three fixture IDs, newest first.
- Record after resolved feedback formats; include Tutorial and Training.
- Repeats move to the front; unknown IDs are skipped at display time.
- Empty slots use explicit curated references and are labelled `REFERENCE`;
  persisted rows are labelled `RECENT`.
- Correct faint metadata contrast. Keep the current three-row layout.

### Pass Criteria

- Abandoned/unresolved prompts never enter history.
- Stored data contains only valid fixture IDs and survives malformed, oversized,
  unavailable, and unsupported-version storage without blocking play.
- Existing high-score, mute, reset-best, fixture selection, score, input,
  progression, session, and iOS-shell behavior are unchanged.
- Playtest reset clears history; Reset Best Rank does not.
- 320x568, standard portrait, large portrait, and desktop layout tests pass.
- Current iOS bundle opens the recent/reference Token Log clear of safe areas.

### Fail Criteria

- Logging occurs at prompt start or alters fixture selection.
- Full fixture data, performance, timestamps, or player-entered content is stored.
- Search, scrolling, tabs, badges, or a new scored interaction appears.
- The archive is described as mastery or retrieval-practice evidence.
- Metadata remains below the normal-text contrast target.

### Rejected Treatments

- Searchable 78-fixture catalog: excessive input, focus, scrolling, and
  whitespace-query complexity.
- Session-only global registry: loses restart recovery and creates more scene
  coupling than a bounded local record.
- Full persisted feedback/round traces: unnecessary duplication and privacy
  surface.
- Answer-before-reveal microcheck: potentially useful, but a separate experiment.

### Implementation

- `StorageSystem`: versioned, capped, ID-only archive with fail-soft parsing,
  future-version preservation, explicit clear, and playtest-reset integration.
- `PlayScene`: one post-summary write at canonical resolution.
- `TokenLogSystem`: recent-first current-fixture resolution plus curated fallback,
  source summary, and compact metadata formatting.
- `TokenLogScene`: local history loading, row/source labels, higher contrast,
  11px secondary text, 12px mappings, and expanded QA state.
- Mobile freshness sources now include Token Log scene/system/storage provenance.

### Evidence

- 78 fixtures regenerated without unexplained drift.
- 95 test files and 817 tests passed; browser and iOS web production builds
  passed; `git diff --check` passed.
- iPhone 17 simulator at 368x800 built and launched the current bundle.
- A resolved prompt survived app termination and appeared first in Token Log as
  `RECENT`; two explicit references filled the remaining rows.
- All eight current simulator screenshots plus manifest pass
  `npm run mobile:simulator`.
- Active/results and runtime browser evidence remains stale and is not claimed.

### Decision

Keep the bounded archive. It converts Token Log from a static appendix into
recoverable residue of play without changing scoring, fixture selection, input,
progression, rank, results, audio, high-score persistence, or iOS shell behavior.

### Remaining Risk

- Three rows may expire surprising examples too quickly; do not increase depth
  without observed recovery need.
- Browser and custom-scheme histories are intentionally separate and do not sync.
- This proves recoverability and truthful rendering, not learner comprehension.
- Canvas semantics and 200% text enlargement remain accessibility work.

## Loop 3 - Results Outcome Hierarchy

Status: keep after native validation; browser evidence gate remains open

### Hypothesis

Making the existing budget/suspension distinction explicit in QA, while raising
compact metric readability, will improve end-state comprehension without
reintroducing the discarded visible economics ledger or changing live results.

### Treatment

- Convert the deterministic protocol-results route into a coherent budget
  outcome with zero balance and canonical cut accuracy.
- Keep exactly four visible cards for budget exhaustion and five for voluntary
  suspension, where the fifth card is remaining balance.
- Raise compact metric labels from 9px faint text to at least 11px muted text.
- Adjust compact card geometry only as required to prevent text and action
  collisions.

### Pass Criteria

- Budget: exact `run`, `cuts`, `accuracy`, and `rank` cards; no balance or visible
  pay/cost/net/efficiency; title and summary communicate closure at zero.
- Suspended: same core cards plus truthful remaining balance.
- The protocol seed satisfies both cut-count and economy arithmetic.
- All metric cards remain at least 40px high for budget and readable for the
  five-card compact state at small, standard, large, and desktop targets.
- Full browser/iOS builds, tests, validators, and current simulator captures pass.

### Fail Criteria

- Live scoring, rank thresholds, result routing, persistence, or action order
  changes.
- A zero balance returns as a redundant budget metric or detailed economics
  return to the visible results surface.
- The longest rank wraps into another card or any card overlaps summary/actions.
- The evidence validator accepts a voluntary-exit screenshot as budget evidence.

### Rejected Treatments

- A promoted unboxed rank row and reordered actions: broader than the defect and
  conflicts with the approved four-box budget direction.
- A visible Money block: detailed economics remain recoverable through Copy
  Summary and are not the primary learning signal on this screen.
- Aggregate token totals: current results do not have a stable pedagogical use
  for that number and it would add another competing metric.

### Implementation

- `ResultsProtocolSystem`: pure, coherent deterministic budget seed.
- `BootScene`: protocol route delegates to the seed instead of embedding stale
  arithmetic and a quit outcome.
- `ResultsScene` and `ResultsLayoutSystem`: 11px muted labels, larger compact
  cards, and bounded value typography without changing metric policy or actions.
- `evaluate-mobile-surface-evidence`: exact budget outcome, copy, metric-set,
  rank, viewport, and minimum-card-height enforcement.

### Evidence

- 78 fixtures regenerated; 96 files and 831 tests passed. Browser and iOS web
  builds passed; `git diff --check` passed.
- Focused protocol, results, responsive, and surface-evidence suites passed 71
  tests before the full run.
- XcodeBuildMCP built and launched the current app on the iPhone 17 simulator.
  Both budget and voluntary-exit captures are visually clear at 368x800.
- The full eight-route screenshot set plus manifest passes
  `npm run mobile:simulator`; native freshness passes.
- Automated browser capture remains blocked by the managed-shell Mach-port
  denial. The in-app browser separately rejects localhost, so active/results
  and runtime browser evidence correctly remain stale.

### Decision

Keep the repair. The visible distinction is now truthful and readable, while
the detailed economy remains available only through Copy Summary. No scoring,
rank, input, progression, tokenizer, persistence, or live session behavior
changed.

### Remaining Risk

- Canvas fitting uses a conservative width estimate; current simulator evidence
  covers `Junior Boundary Clerk`, while the longest rank is geometry-tested.
- Browser screenshots and runtime sidecars still describe the old result and
  feedback states and must not be cited as current parity evidence.
- The protocol seed owns a QA starting-balance constant; a future economy change
  must update both live start state and the explicit QA contract.

### Next Experiment

Audit native QA determinism. The manifest claims a pinned fixture, but production
Vite removes the existing dev-only fixture/freeze controls. Prefer a native-shell
test-only launch bridge or revise the evidence claim; do not expose unrestricted
QA controls in ordinary browser/mobile production launches.

## Loop 4 - Native QA Determinism

Status: keep after native validation; browser evidence gate remains open

### Question

What is the smallest truthful way to make the simulator's `endless-pinned`
evidence deterministic when the iOS shell embeds production Vite assets that
compile out the existing general QA query controls?

### Hard Boundary

Ordinary production browser/mobile launches must not gain arbitrary fixture,
timer, or review-state controls. A valid solution must be allowlisted,
build-scoped or evidence-specific, testable, and honest about what the resulting
screenshot proves.

### Candidate Treatments

1. Debug/native-test-only bridge that enables the existing controls.
2. Dedicated allowlisted evidence launch mode with fixed fixture/time behavior.
3. Remove the pinning claim and validate only the nondeterministic active state.

### Selected Treatment

Treatment 3. Rename the native route/file to `endless-active`, remove ignored
browser QA parameters from native launch metadata, and make the native validator
reject those parameters. Preserve browser dev-server pinning unchanged.

### Rationale

The current image is useful structural evidence but false determinism evidence.
A second Xcode scheme and runtime attestation bridge could make a fixed frame
truthful, but adds a second build surface and receipt pipeline without improving
the present safe-area question. Correcting the claim is the smaller coherent
change.

### Pass Criteria

- Simulator metadata uses only production-effective launch parameters.
- `endless-active` is recaptured rather than merely renaming the old image.
- Validator negative tests reject fixture, freeze, hold-review, canvas-capture,
  and viewport QA parameters in native production routes.
- Browser pinned routes and their tests remain unchanged.
- Full tests/builds and native simulator/freshness validation pass.

### Fail Criteria

- Manifest strings alone can imply an applied fixture or timer override.
- Browser-development QA controls are weakened or removed.
- A fixed or arbitrary gameplay-control path becomes available in normal release
  launches.

### Implementation

- Renamed the native simulator route/file to `endless-active`.
- Removed inert fixture/freeze metadata from native tutorial and endless launches.
- Made the native evaluator parse launch parameters structurally and reject all
  browser-only QA controls, duplicate mode values, and incidental-string tricks.
- Added source invariants that keep the real browser QA controls dev-only.

### Evidence

- 78 fixtures regenerated; 96 files and 839 tests passed. Browser and iOS web
  builds and `git diff --check` passed.
- XcodeBuildMCP rebuilt and launched the current app on the iPhone 17 simulator.
  All eight routes were recaptured after the embedded web build.
- `npm run mobile:simulator` passes. Native and menu freshness groups pass.
- Browser active/results and runtime evidence remains stale and fails closed;
  managed Chromium and the in-app localhost policy still block recapture.

### Decision

Keep the truthful structural-evidence contract. It proves only native shell boot,
live route loading, canvas rendering, and visible safe-area/layout state. It does
not claim fixture identity, frozen timing, touch behavior, audio behavior, or
browser/native pixel parity.

### Remaining Risk

- A future fixed-frame native experiment will require a Debug-only bridge plus an
  applied-state receipt; manifest strings are not sufficient evidence.
- Browser parity remains an explicit stale evidence gate until capture can run in
  an allowed localhost-capable browser environment.

### Next Experiment

Audit result-copy persistence truth. A failed local-storage write must not produce
copy that says a new best was saved. Preserve rank thresholds, storage format,
and successful-write behavior; distinguish achievement from persistence with a
small explicit return contract and failure-path tests.

## Loop 5 - Result Persistence Truth

Status: keep after native validation; browser evidence gate remains open

### Hypothesis

Separating achieved and persisted best records will eliminate false `Best saved`
claims under storage failure without changing successful result copy, high-score
ordering, or any game mechanic.

### Treatment

- Change high-score save output to an explicit `saved`, `kept`, or `unavailable`
  result carrying achieved and persisted records.
- Preserve prior persistence when a better replacement write fails.
- Make valid legacy-record migration best effort rather than coupling read success
  to canonical-key write success.
- Keep successful result copy unchanged. Add failure-only achieved/saved lines and
  a truthful `none yet` state for zero-round/no-record results.

### Pass Criteria

- Storage tests cover successful first/replacement writes, equal/lower no-write,
  first-write failure, replacement failure with prior-record retention,
  unavailable storage, and legacy migration write failure.
- Session-copy tests prove unchanged success, truthful failure with and without a
  prior saved best, and no fabricated zero-round saved record.
- Menu, HUD, Settings, visible result cards, result actions, ranking, economics,
  scoring, and stored JSON remain unchanged.
- Full fixtures/tests/builds and the regenerated iOS web bundle pass.

### Fail Criteria

- A failed candidate is labeled or returned as persisted.
- An existing saved best is lost after a failed replacement.
- Successful copied-summary or mobile QA text changes.
- Clipboard/download status is conflated with high-score persistence.
- The treatment changes rank/scoring or adds a second persistence system.

### Rejected Treatments

- Returning only a nullable record: this cannot distinguish no prior record,
  failed persistence, and an intentional no-write keep.
- A visible warning card in the four-metric result layout: the visible screen does
  not currently claim save success, and the card would compete with the approved
  outcome hierarchy.
- Native-only storage: it would fork browser/mobile behavior and require migration
  and synchronization policy beyond this defect.

### Implementation

- `StorageSystem`: discriminated save result plus best-effort legacy migration.
- `ResultsScene`: keeps the complete save result as one state object and separates
  the no-save persisted load.
- `SessionFlowSystem`: unchanged success copy; failure-only achieved/saved/error
  lines; truthful no-record state.
- `copy_deck.md`: documents saved/kept, failed replacement, failed first save, and
  no-attempt/no-record states.

### Evidence

- 78 fixtures regenerated; 96 files and 847 tests passed. Browser and iOS web
  builds and `git diff --check` passed.
- Focused storage/session/results tests passed 55 tests before the full run.
- XcodeBuildMCP rebuilt the iPhone 17 app. A seven-round protocol result remained
  visible as the best rank after an explicit app stop and relaunch.
- All eight simulator routes were recaptured after the embedded web build and
  pass `npm run mobile:simulator`; native freshness passes.
- Browser active/results and runtime evidence remains stale and fails closed due
  the managed Chromium Mach-port denial and in-app localhost policy.

### Decision

Keep the repair. Achievement and persistence are now separate facts, prior saved
state survives failed replacement, and successful user-visible behavior remains
unchanged. No tokenizer, input, progression, rank, scoring, economy, result-card,
or native-shell behavior changed.

### Remaining Risk

- A successful Web Storage write is device-local best-effort persistence, not a
  durability guarantee; copy intentionally avoids `permanently saved`.
- The save failure is truthful in detailed copy but is not yet exposed through a
  semantic status surface. That belongs to the bounded canvas-accessibility loop.
- The native harness proves the successful path; deliberate write failure remains
  unit-test evidence because the production simulator route cannot safely inject
  a storage exception.

### Next Experiment

Audit canvas accessibility and specify the smallest semantic counterpart for
menu controls, results outcome/actions, Wiener speech, prompt, and feedback. Keep
the canvas visual/gameplay authority and avoid broad DOM duplication until focus,
screen-reader, keyboard, status-message, reduced-motion, and text-resize gaps are
measured.

## Loop 6 - Menu And Results Semantic Bridge

Status: selected bounded treatment

### Hypothesis

A single game-level semantic runtime can make the complete menu and results tasks
programmatically operable without changing canvas visuals or creating a second
game state authority.

### Treatment

- Add a typed DOM surface with heading, persistent text, native actions, and
  polite/assertive live regions.
- Route canvas and semantic controls through the same MenuScene and ResultsScene
  command methods.
- Scope scene ownership through disposable epochs and reject stale updates/actions.
- Keep the unfocused surface visually hidden; reveal it with a visible focus
  treatment for sighted keyboard users.

### Pass Criteria

- Exact menu/result text and actions are projection-tested.
- Runtime lifecycle and duplicate/stale command behavior are unit-tested.
- Source/DOM checks prove native headings/buttons/live regions and visible focus.
- XcodeBuildMCP exposes the semantic menu/results hierarchy inside WKWebView and
  one semantic activation navigates exactly once.
- Existing game, storage, tokenizer, scoring, input, layout, QA, build, and native
  screenshot gates remain intact.

### Fail Criteria

- DOM state can outlive or command an inactive Phaser scene.
- Semantic and canvas action paths diverge or a keyboard activation fires twice.
- The unfocused DOM changes approved screenshots or safe-area layout.
- QA JSON, timer frames, or decorative animation flood a live region.
- The implementation claims nonvisual slicing or full accessibility.

### Rejected Treatments

- Full canvas DOM reconstruction: duplicates presentation and creates parity risk.
- Scene-local DOM adapters: duplicate focus, rendering, and cleanup logic.
- Phaser global plugin: larger engine coupling than this bounded bridge requires.
- SwiftUI controls: forks browser/mobile behavior despite the shared WKWebView.

### Implementation

- `SemanticRuntime` / `SemanticCoordinator`: one registry-owned runtime with
  immutable snapshot copies, epoch leases, current render tokens, duplicate
  consumption guards, focus restoration, and idempotent teardown.
- `SemanticDomSurface`: one named region with native heading, summary, details,
  buttons, and polite/assertive live regions. Ordinary play remains clipped;
  keyboard focus reveals a safe-area-aware panel.
- `MenuSemanticSystem` / `MenuScene`: exact menu projection and shared guarded
  Tutorial, Training, Token Log, and Settings commands.
- `ResultsSemanticSystem` / `ResultsScene`: exact outcome/metric/action projection,
  one stable outcome announcement, copy-label republishing, repeatable copy, and
  guarded retry/menu navigation.
- `semanticUi=visible`: explicit simulator QA projection only. It does not alter
  the default app route or claim that the core slicing task is accessible.

### Evidence

- 78 fixtures regenerated; 100 files and 863 tests pass. Browser and iOS web
  builds and `git diff --check` pass.
- Projection and lifecycle tests cover exact menu/results content, stale and
  duplicate actions, disabled actions, focus preservation, copy-state updates,
  shutdown disposal, and Phaser scene reuse.
- XcodeBuildMCP rebuilt the final iOS bundle. Both semantic QA projections render
  inside WKWebView, and all eight normal simulator routes were recaptured only
  after a 1.5-second settled-paint gate. `npm run mobile:simulator` passes.
- XcodeBuildMCP does not expose the visible WKWebView headings/buttons as targets:
  the snapshot remains 17 elements, zero targets, and one scroll container. Tab
  and Enter injection also did not activate the focused DOM command. Automated
  VoiceOver discovery/activation therefore failed its evidence criterion.
- Native freshness passes. Browser comparison/runtime artifacts remain stale and
  fail closed because both managed Chromium and the in-app browser prohibit the
  required localhost capture path in this environment.

### Decision

Keep with a qualified result. The runtime/scene contract and native rendering are
sound, normal visuals and mechanics are unchanged, and the treatment creates a
maintainable accessibility boundary. The Xcode hierarchy/activation criterion is
not met, so no VoiceOver or full keyboard-accessibility claim is permitted.

### Remaining Risk

- The core cut-prediction task remains pointer/touch-only; exposing menu/results
  does not make a complete session nonvisually operable.
- Screen-reader order, announcements, rotor behavior, and activation require a
  real VoiceOver pass. Source semantics and visible QA projection are not enough.
- The keyboard overlay needs browser interaction evidence when an allowed local
  browser surface becomes available.

### Next Experiment

Audit reduced-motion truth. Replace the currently unsupported `Reduced Motion:
System` claim with an actual game-level media-query policy or revise the label.
First classify essential instructional motion versus ornament; preserve clocks,
cut detection, scoring, review timing, and routing.

## Loop 7 - System Reduced Motion

Status: qualified keep

### Hypothesis

One shared media-query runtime can make the Settings claim truthful and remove
the most problematic nonessential motion without changing game timing, state,
instructional evidence, or normal presentation.

### Treatment

- Read and observe `prefers-reduced-motion` once per game lifetime.
- Keep the sentence clock and every logical delay unchanged.
- Under reduction, stop Wiener idle/reaction movement, dissolve resolved pieces
  in place, and make cut impact opacity-only.
- Expose the effective state in Settings and QA.

### Pass Criteria

- Runtime lifecycle/fallback/change behavior is fully unit-tested.
- Essential timers and mechanics remain on their existing code paths.
- Normal and reduced treatments are explicit and QA-observable.
- Full web/iOS gates and current native screenshots pass.
- Native enabled-state evidence is either captured or marked unproven.

### Fail Criteria

- Any score, timer, sentence completion, review sequence, input, route, storage,
  or economy behavior changes.
- Reduced motion removes canonical feedback or creates a blank/ambiguous state.
- Settings continues to claim system behavior without reading the system.
- Simulator evidence is inferred from source tests or an off-state screenshot.

### Implementation

- `MotionPreferenceSystem`: one registry-owned observable runtime and explicit
  treatment policy.
- `Game`: install/destroy the runtime beside the semantic runtime.
- `SettingsScene`: effective label, live subscription, QA state, shutdown cleanup.
- `PlayScene`: bounded ornament adaptation, live cleanup, QA state, no clock or
  mechanics changes.
- `PlaySceneQaSystem`: preference/treatment evidence.

### Evidence

- 78 fixtures regenerated; 102 test files / 872 tests pass. Browser and iOS web
  builds and `git diff --check` pass.
- XcodeBuildMCP build/run succeeded on iPhone 17 / iOS 26.5. The app and iOS
  Settings agreed on the off state. All eight normal route images were refreshed;
  `npm run mobile:simulator` passes.
- `mobile:freshness` passes the native group and still fails the three known stale
  browser groups. `mobile:crossref:status` likewise rejects old result/feedback
  artifacts; those failures were not weakened or relabelled.
- XcodeBuildMCP does not expose the visible native Reduce Motion switch as an
  actionable target, and shell `simctl` is sandboxed. Enabled-state native proof
  is absent and recorded in `.qa/ios-simulator/loop-7-reduced-motion/manifest.json`.

### Decision

Keep with a qualified native result. The treatment is truthful, reversible,
tested, and mechanics-preserving. Do not declare App Store Reduced Motion support
until a paired enabled-state simulator or physical-device pass is available.

### Remaining Risk

- The essential falling sentence remains motion by design; players who cannot
  tolerate it may require a separately approved timing/presentation experiment.
- Several small opacity/pulse effects remain because they communicate cut,
  pressure, or resolution state; a later audit may replace them only with an
  equally clear static alternative.
- Enabled-state visual treatment and live device toggling remain manual evidence
  gates.

### Next Experiment

Audit haptic capability and replace the developer-facing Settings placeholder
with a truthful consumer state. Compare omission, capability reporting, and a
strict cue-only native bridge before changing native glue.

## Loop 8 - Native Haptic Capability Truth

Status: keep after native compile/visual validation; physical output remains open

### Hypothesis

A hardware-qualified, cue-only UIKit bridge can make iPhone haptics real and
replace developer placeholder copy without changing gameplay or exposing an
arbitrary JavaScript-to-native command channel.

### Treatment

- Prefer a native route only when the shell injects `supportsHaptics: true` and
  the named message handler exists; otherwise retain browser vibration fallback.
- Send only one of five existing cue names plus an integer repeat count. Only
  cut bursts repeat, with the existing cap of four.
- Map cut/confirm/clear to bounded impacts and miss/warning to system
  notification feedback.
- Report `Available` or `Unavailable` in Settings and QA.
- Keep Sound coupling, cue call sites, timing, modality gates, and mechanics.

### Pass Conditions

- Consumer UI contains no `pending` implementation copy.
- Native bridge is main-frame/custom-origin/schema/rate/lifecycle bounded.
- Simulator reports unavailable and no physical-output claim is made.
- Existing browser fallback and every mechanics/persistence contract pass.

### Fail Conditions

- Arbitrary page payloads can select patterns, intensity, native methods, or
  unbounded repeats.
- Subframes, wrong origins, background state, or torn-down views can emit cues.
- Simulator compile/launch is described as felt output.
- Sound behavior, scoring, timing, input, routing, or persistence changes.

### Implementation

- `HapticFeedbackSystem`: typed environment/capability, native preference,
  fixed cue messages, browser fallback, and consumer labels.
- `SettingsScene`: availability text plus QA element/state.
- `WebGameView`: immutable capability injection, UIKit bridge, validation/rate
  limits, foreground gate, delayed-output guard, and explicit teardown.
- Tests cover the web route, Settings integration, and required shell guards.

### Evidence

- 78 fixtures regenerated; 103 test files / 879 tests pass. Browser and iOS web
  builds and `git diff --check` pass.
- XcodeBuildMCP build/run succeeded on iPhone 17 / iOS 26.5. Settings showed
  `Haptics: Unavailable`, accurately reflecting Simulator hardware.
- Ten current native route screenshots were rebuilt and visually inspected;
  `npm run mobile:simulator` passes. Loop evidence is under
  `.qa/ios-simulator/loop-8-haptics/`.
- Native freshness passes. Three browser evidence groups remain stale under the
  recorded localhost-capture restriction and continue to fail closed.

### Decision

Keep with qualified native evidence. The implementation is finite, reversible,
and truthful; only a supported physical iPhone can validate felt output and cue
quality.

### Remaining Risk

- UIKit mappings are reasoned from system meanings but not yet felt or compared
  on hardware.
- Sound still suppresses haptics. Apple guidance supports independence, but the
  default/migration and Settings behavior require their own experiment.
- A browser may expose `navigator.vibrate` while a particular device cannot
  produce useful tactile output; browser fallback remains best effort.

### Next Experiment

Audit the Sound/Haptics preference boundary. Choose a migration-safe optional
control or deliberately retain one mute contract; do not change storage/UI until
unavailable-device behavior and physical-device evidence are explicit.

## Loop 9 - Independent Haptics Preference

Status: keep after web/native unavailable-state validation; physical feel open

### Hypothesis

A persistent haptics control can let players retain tactile feedback with Sound
off without surprising already-muted players or creating browser/iOS divergence.

### Treatments Compared

- Keep permanent Sound coupling: smallest code change, but prevents useful
  multimodal feedback and conflates two player choices.
- Session-only haptics control: reversible but unreliable after relaunch.
- Versioned independent preference: selected, with one-time Sound-derived
  migration and fail-closed future-schema handling.

### Pass Conditions

- Existing muted players migrate Off; unmuted/fresh players migrate On only when
  a capable route exists. Subsequent Sound changes do not change haptics.
- Unavailable hardware shows a truthful noninteractive state and preserves data.
- Storage failures cannot block play; future records are not overwritten.
- Cue call sites, timing, modality gates, mechanics, economics, and routing remain
  unchanged. Settings fits required phone/desktop geometries.

### Implementation

- `StorageSystem`: strict version-1 haptics record, QA state, and playtest reset.
- `HapticPreferenceSystem`: lazy shared migration/persistence runtime with
  recoverable and future-version policies.
- `Game`, `SettingsScene`, and `PlayScene`: registry ownership, capable On/Off
  control, unavailable presentation, and independent playback gate.
- All six audio-owning scenes reload Sound on `create()` to prevent stale state.
- `SettingsLayoutSystem`: pure safe-area-aware geometry for the new control.

### Evidence

- 78 fixtures regenerated; 105 test files / 911 tests pass. Browser and iOS web
  builds and `git diff --check` pass.
- XcodeBuildMCP build/run succeeded on iPhone 17 / iOS 26.5. Ten current native
  screenshots were recaptured and visually inspected; `npm run mobile:simulator`
  passes. Settings shows `Haptics: Unavailable` with no overlap.
- `mobile:freshness` passes the iOS group. Browser capture fails at the known
  Chromium Mach-port sandbox boundary; stale browser groups remain failed.
- Device probe found no physical iPhone/iPad. Capable-state interaction, tactile
  output, latency, fatigue, and the four Sound/Haptics combinations are open.

### Decision

Keep with qualified evidence. The preference contract and unavailable-state UI
are sound and mechanics-preserving. Do not claim haptic quality or full device
validation until a supported iPhone completes the physical matrix.

### Next Experiment

Return to the numerical-tokenization objective. Audit whether the current review
sample and Token Log mapping produce a clear mental model; prefer one anchored
tutorial explanation over falling numbers unless fragment-to-token identity is
truthful after an incorrect cut.

## Loop 10 - Anchored Numerical Token Explanation

Status: keep after web tests and qualified native validation

### Hypothesis

One encoding-qualified explanation at the first review-label lesson will connect
visible chunks to numeric model input more accurately than either no change or
moving IDs attached to submitted fragments.

### Treatments Compared

- No change: preserves density but leaves the ID sample unexplained in live
  tutorial flow.
- One review-pause explanation: selected; immediate, bounded, and anchored to the
  canonical evidence surface.
- Falling fragment IDs: rejected because submitted pieces are not guaranteed to
  be true tokens and moving labels compete with correction evidence.

### Pass Conditions

- IDs remain hidden during prediction and absent from falling animation plans.
- Review explicitly labels one real mapping as a sample; Token Log maps all
  displayed chunks.
- Round-two clean, mixed, and failed outcomes all receive the same concise Wiener
  explanation, within the compact speech budget.
- Fixtures, scoring, economy, input, timing, progression, routing, persistence,
  and animation behavior remain unchanged.
- Full web builds/tests and production iOS build/run pass; native claims stay
  bounded to frames actually observed.

### Implementation

- `TokenDisplaySystem`: changed only the sampled mapping qualifier.
- `TutorialSystem`: one exported round-two review line shared by all outcomes.
- Tests: exact copy/branch/length assertions, mapping distinction, no-animation-ID
  assertion, and all-fixture compact feedback-card layout coverage.

### Evidence

- 78 fixtures regenerated; 105 test files / 912 tests passed. Browser and iOS web
  builds passed; focused 58-test coverage and all 78 compact layout cases passed.
- XcodeBuildMCP rebuilt/launched the iPhone 17 production shell. Live tutorial
  review showed the sample label, and Token Log showed complete mappings at
  368x800. Captures are in `.qa/ios-simulator/loop-10-token-ids/`.
- All ten approved native routes were refreshed and inspected. The simulator
  evaluator and iOS freshness group pass.
- The Xcode semantic snapshot exposes the WKWebView but no Phaser controls. A live
  round-two speech screenshot remains unproven; the three branch paths and layout
  budget are tested directly.
- Browser screenshot refresh was blocked by the in-app browser localhost policy;
  stale browser validators were not changed. Cross-reference status continues to
  reject the old result and feedback-card evidence.

### Decision

Keep with qualified native evidence. The numerical dimension is now taught as an
encoding-specific identifier at the moment of resolved evidence, not as a reward
number or an animation ornament.

### Remaining Risk

- Passing source/copy/layout tests does not establish learner comprehension.
- The one-sample review may be too terse or too technical for first-time players;
  only a retrieval/transfer evaluation can decide that.
- The exact round-two native frame and physical-device legibility remain open.

### Next Experiment

Design a comprehension evaluation before adding more UI. Compare a post-tutorial
retrieval question, a transfer fixture, and a non-code playtest protocol; select
the smallest method that distinguishes learned concepts from route imitation.

## Loop 11 - External Numerical Token Comprehension Probe

Status: protocol prepared and tokenizer-verified; participant evidence pending

### Hypothesis

A separate unscored near-transfer probe can distinguish the three intended
numerical-token concepts from successful tutorial imitation without changing the
game route or confounding results with touch skill, time pressure, and economy.

### Treatments Compared

- Infer comprehension from tutorial cut accuracy: rejected as multiply
  confounded and partly hint-assisted.
- Add an in-game quiz or scored transfer fixture: rejected as a surprise compact
  handoff burden and a mechanics/progression change.
- Run a dedicated post-tutorial probe: selected; three unseen items, first-answer
  reasons, and confidence recorded outside game scoring.

### Pass Conditions

- Both forms use exact real tokenizer chunks and encoding-qualified IDs.
- Each item has a predeclared pass/ambiguous/fail rubric and requires a reason.
- The main handoff study remains uncontaminated and no game route is gated.
- Retain Loop 10 only if 4/5 novices pass each claim and 4/5 pass all three.
- Do not claim learning efficacy before participant evidence exists.

### Implementation

- Added `docs/token_comprehension_probe.md` with two alternating forms, facilitator
  boundary, rubric, participant record, threshold, and evidence basis.
- Linked the probe from `docs/user_playtest_protocol.md` and added Gate 8 to the
  game-design playtest gates.
- Added exact `js-tiktoken` form verification and documentation-contract tests.
- No runtime, fixture, scoring, input, timing, progression, storage, or route code
  changed in this loop.

### Evidence

- Google Drive and local status show an existing protocol but zero completed
  sessions and no rollup.
- 78 fixtures regenerated; 106 test files / 916 tests pass; browser and iOS web
  builds pass.
- XcodeBuildMCP rebuilt/launched the iPhone 17 shell. All ten native routes were
  recaptured; `mobile:simulator` and native freshness pass.
- Local playtest-package audit passes. Three browser screenshot groups remain
  stale and failed. No participant result exists.

### Decision

Keep the protocol and leave the Loop 10 treatment provisional. The experiment is
ready to run but has not yet produced an educational result.

### Remaining Risk

- Five novices support a bounded product decision, not a general causal claim.
- Facilitator phrasing or exposure to Token Log before the probe would invalidate
  the intended observation.
- The main mobile/touch and browser-freshness evidence gaps remain independent of
  this protocol.

### Next Experiment

Prove the tutorial call graph and remove or isolate unreachable explanatory
scaffolding. Preserve live Wiener speech and every mechanic; accept cleanup only
if tests describe the production path more truthfully afterward.

## Loop 12 - Tutorial Runtime Contract Cleanup

Status: kept after full web and native validation

### Hypothesis

Removing unreachable tutorial explanations, timers, and compatibility APIs will
make the teaching contract auditable without altering any player-visible speech,
mechanic, timing, route, or evidence surface.

### Pass Conditions

- Preserve ten-round fixture order, hint withdrawal, 32-second duration,
  progression, active instructions, outcome reviews, and round-two ID teaching.
- Preserve live Wiener sticky/timer behavior, review reveal and dwell, feedback
  advancement, QA fields, scoring, input, economy, storage, and routing.
- Production tests describe only callable paths; useful educational concepts
  survive in content documentation rather than dead runtime APIs.
- Full web/iOS gates and current native active/review screenshots pass.

### Implementation

- Reduced `TutorialSystem.ts` from 727 to 195 lines by retaining only production
  round data and the five live public operations.
- Removed seven never-assigned tutorial timers, no-op cleanup calls, and the dead
  `tutorialIntroPrompt()` wrapper from `PlayScene`.
- Rewrote tutorial and Wiener speech tests around production behavior and moved
  unique educational requirements into the current surface contract/copy deck.

### Evidence

- Three independent audits agreed on reachability and the preserve boundary.
- 78 fixtures regenerated; 106 files / 910 tests pass; browser and iOS web builds,
  local audit, simulator evaluator, native freshness, and diff check pass.
- XcodeBuildMCP rebuilt/launched the iPhone 17 shell. Clean active and timed-out
  review frames plus all ten approved native routes were captured and inspected.
- Three browser screenshot groups remain stale/failed. No validator was weakened.

### Decision

Keep. The change removes misleading architecture and test coverage while leaving
the observed tutorial unchanged.

### Remaining Risk

- Physical-device touch and legibility evidence remains absent.
- The external numerical-token comprehension probe has 0/5 participant sessions.
- Browser comparison artifacts remain stale even though the desktop harness tests
  and build pass.

### Next Experiment

Audit the legacy Wiener speech renderer: the unused `showToast` branch,
`wienerSpeechLabel`, and test-only `computeWienerSpeechLayout()`. Delete only what
is proven unreachable; preserve the visible pet panel, timing, copy, QA fields,
and layout behavior.

## Loop 13 - Legacy Wiener Speech Renderer Cleanup

Status: kept after full web and native validation

### Hypothesis

Deleting renderer objects and geometry used only by obsolete toast tests will
reduce false architectural surface without changing a visible frame or QA
contract.

### Pass Conditions

- No `wienerSpeechLabel`, `showToast`, or `computeWienerSpeechLayout` references
  remain in `src` or `tests`.
- Live pet layout, copy normalization, clipping, timing, sticky review behavior,
  hide/reveal order, chrome/tail/text, and QA projection remain unchanged.
- Compact copy-wrap coverage uses production geometry.
- Full web/iOS gates and fresh native active/review evidence pass.

### Implementation

- Removed the never-rendered label object and its visibility writes.
- Simplified `setWienerSpeech()` to unconditional delegation while retaining its
  two-call production cadence.
- Removed centered toast geometry and its unused label return data; migrated the
  useful wrap-capacity test to `computePetSpeechLayout()` and deleted three
  obsolete layout assertions.

### Evidence

- Three independent audits agreed on reachability and the preserve boundary.
- Focused 9-file / 169-test suite passed. Full gates passed with 78 fixtures and
  106 files / 907 tests; both builds, local audit, and diff check passed.
- XcodeBuildMCP rebuilt/launched the iPhone 17 shell. Active and natural-timeout
  review frames show one unchanged pet bubble and no label. All ten native routes
  were recaptured; simulator evaluation and native freshness pass.
- Browser capture remains blocked at both managed Chromium launch and local-target
  in-app policy. Three stale groups remain failed.

### Decision

Keep. The removed API described a UI that production did not render.

### Remaining Risk

- Structured old compact evidence reveals a pre-existing active bubble/timer
  collision at `368x552`; this cleanup neither caused nor fixed it.
- Physical-device touch/legibility and the 0/5 comprehension probe remain open.
- Browser parity evidence is still stale despite passing source/layout tests.

### Next Experiment

Reproduce and correct the compact active speech/timer overlap. Select a geometry
rule only after comparing speech movement, timer movement, and explicit reserved
clearance across all supported viewport classes.

## Loop 14 - Compact Active Speech/Timer Clearance

Status: kept after full web and native validation

### Hypothesis

Treating the active timer as a local obstacle for Wiener speech will remove the
short-phone collision without shifting review or already-clear profiles.

### Treatments Compared

- Move the timer rail: rejected because it changes the stable timing hierarchy.
- Move all speech: rejected because most profiles are already clear.
- Reserve active-only timer clearance: selected as the narrow fault-based rule.

### Pass Conditions

- At least 8px between active speech and timer on supported viewport classes.
- Preserve pet, prompt, feedback, controls, safe-area, and viewport clearances.
- Review and already-clear standard/desktop geometry remain unchanged.
- No mechanic, timing, copy, input, economy, progression, storage, or route change.

### Implementation

- Added optional rendered timer bounds to `computePetSpeechLayout()`.
- Added a nearest-feasible above/below solver with an 8px active clearance.
- Passed timer bounds only while `PlayScene.resolving` is false.
- Extended geometry, scene-contract, and mobile-evidence tests.

### Evidence

- Two independent audits converged; one additional audit did not return.
- 78 fixtures regenerated; 106 test files / 917 tests pass; both builds, local
  audit, simulator evaluator, native freshness, and diff check pass.
- Fresh native active/review frames and all ten route captures were visually
  inspected. No iPhone SE-class simulator is installed.
- Browser screenshot groups remain stale and failed due environment restrictions.

### Decision

Keep. The observed compact collision is fixed without broad layout movement.

### Remaining Risk

- Physical-device touch/legibility evidence remains absent.
- Browser comparison artifacts remain stale.
- The external numerical-token comprehension probe remains at 0/5 participants.

### Next Experiment

Reconcile verification documentation with the current runtime. Preserve dated
historical evidence, but stop obsolete popup, token-strip, overseer, naming,
metric, or round-count claims from masquerading as current requirements.

## Loop 15 - Verification Document Truth

Status: kept after full web and native validation

### Hypothesis

Separating a concise current contract from dated evidence will prevent obsolete
surfaces from re-entering implementation while retaining the provenance needed
to understand earlier decisions and regressions.

### Pass Conditions

- Current guidance names only the shared runtime, current HUD variants, Wiener
  speech, feedback-card evidence, controls, and current results contract.
- Dated June observations remain intact but carry an explicit historical scope.
- Current mobile evidence rejects retired IDs and review evidence without Wiener
  speech; local readiness does not promote old PNGs to current proof.
- No runtime or gameplay behavior changes.

### Implementation

- Added a dated current snapshot and provenance boundary to the verification
  matrix, Phase 2 audit, and June browser records.
- Reconciled active design principles with Wiener speech and the feedback card.
- Added fail-closed retired-ID checks to both mobile evidence evaluators and a
  review-speech requirement to runtime sidecars.
- Replaced historical PNG prerequisites with current contracts, manifests,
  templates, and evaluator sources in the local readiness audit.
- Added scope-aware documentation tests rather than deleting historical terms.

### Evidence

- Three audits and four disjoint implementation workers converged on the same
  current-versus-historical boundary.
- Focused 5-file / 76-test verification passed. Full gates passed with 78
  fixtures and 106 files / 941 tests; both builds, local audit, and diff check
  pass.
- XcodeBuildMCP rebuilt/launched the iPhone 17 shell. All ten native routes were
  recaptured and inspected; `mobile:simulator` and native freshness pass.
- Three browser groups remain stale/failed, and the old surface/runtime evidence
  continues to fail its substantive current-contract checks.

### Decision

Keep. The documentation and QA interfaces now describe current reality without
rewriting history or changing the game.

### Remaining Risk

- Legacy public-name acceptance and five-round sample language remain outside
  this loop and may still mislead future playtest operators.
- The mobile optimization report contains volatile status/count prose.
- Physical-device touch/legibility and the 0/5 comprehension probe remain open.

### Next Experiment

Audit evidence identity and progression wording. Require explicit historical
scope for legacy naming, distinguish an observation sample from an Endless mode,
and remove or derive volatile status/count claims without changing gameplay.

## Loop 16 - Evidence Identity, Progression, and Report Truth

Status: kept after full web and native validation

### Hypothesis

Canonical current-evidence identity, explicit sample language, and derived live
status authority will prevent future agents from treating legacy naming,
five-round observation scope, or stale report prose as product behavior.

### Pass Conditions

- Current playtest notes and rollups require Tokenizer Training identity and
  canonical run IDs while dated history remains intact.
- Five completed Endless rounds are described as an observation sample, and a
  direct test proves round five is not a terminal mode boundary.
- The mobile report contains no hard-coded test totals, mutable pass claim, or
  temporary machine path; completion validation rejects those regressions.
- No gameplay, scoring, progression, persistence, fixture, or route change.

### Implementation

- Tightened playtest note, copied-summary, and rollup identity checks.
- Renamed the five-round physical QA row and added round-five continuation
  coverage for Endless Training.
- Split the mobile report into historical implementation record and live status
  authority; added fail-closed report-shape and volatility checks.

### Evidence

- Three audits and three disjoint workers converged on the same authority
  boundaries. Focused integration passed 8 files / 117 tests.
- Full gates pass with 78 fixtures and 106 files / 960 tests; both builds, local
  audit, simulator evaluation, native freshness, and diff check pass.
- Ten iPhone 17 routes were rebuilt, recaptured, and visually inspected. Three
  browser groups remain stale/failed because current local capture is blocked.
- Playtest readiness remains 0/5 and physical-device validation remains failed;
  no external outcome is claimed.

### Decision

Keep. Current evidence now identifies the product and progression truthfully,
and the report cannot masquerade as live verification.

### Remaining Risk

- Physical-device docs and evidence inventory still name retired menu surfaces.
- Browser comparison artifacts remain stale.
- The numerical-token comprehension probe remains 0/5 participants.

### Next Experiment

Align the physical-device evidence contract with the current menu and Settings
surfaces while preserving actual-device requirements and stable artifact names.

## Loop 17 - Physical-Device Evidence Contract Truth

Status: kept after full web and native validation

### Hypothesis

Replacing retired labels with semantically checked current-screen evidence will
make the phone gate actionable without allowing old screenshots, filenames, or
QA metadata to stand in for real touch and persistence proof.

### Pass Conditions

- Menu proof names Best Rank and all four current actions; no menu Sound.
- Five rounds is an observation sample and evidence shows continuation beyond
  round five while funds remain.
- Play and Results reach are separate and name the controls exercised.
- Best Rank is visible on the default menu after full relaunch; Sound Off is
  visible in Settings before termination and after full relaunch.
- Stable filenames remain valid; absent physical evidence still fails closed.
- No runtime, mechanic, fixture, score, timing, progression, or storage change.

### Implementation

- Reconciled the checklist, manifest, completed template, evaluator, and tests.
- Added semantic menu, continuation, reach, Best Rank surface, and Sound surface
  checks plus negative evidence fixtures.
- Migrated only labels in the local incomplete evidence file; retained its
  existing desktop evidence and every blank physical row.

### Evidence

- Three audits, two disjoint workers, and one central integration review.
- Focused integration: 4 files / 40 tests. Full gates: 78 fixtures; 106 files /
  969 tests; browser and iOS web builds; local audit; simulator evaluation; native
  freshness; and diff check.
- Ten fresh iPhone 17 route captures are stored under
  `.qa/ios-simulator/loop-17-physical-contract/` and were visually inspected.
- No physical device is connected. Physical validation and final completion stay
  failed; three browser artifact groups also remain stale.

### Decision

Keep. The evidence contract now matches the game and remains honestly blocked on
real hardware rather than documentation drift.

### Remaining Risk

- Screenshot content is not OCR-verified; captions and artifact shape are
  semantically checked, while the physical operator remains responsible for the
  actual visible frame.
- Browser comparison/runtime artifacts remain stale.
- The numerical-token comprehension probe remains 0/5 participants.

### Next Experiment

Use Chrome control to refresh all browser evidence groups from current routes.
Keep every substantive surface/runtime/freshness gate intact.

## Loop 18 - Browser Evidence Recovery Contract

Status: kept after full web and native validation; browser capture remains blocked

### Hypothesis

A script-derived manual handoff plus structural screenshot and sidecar freshness
checks will make browser evidence recoverable on an allowed control surface without
letting placeholders, copied artifacts, or incomplete sidecars masquerade as a pass.

### Pass Conditions

- Every canonical route, viewport, parameter, filename, interaction step, and
  evidentiary limitation is explicit and checked against the capture script.
- Surface screenshots must be real, correctly sized, nontrivial image evidence.
- Each runtime screenshot's QA sidecar participates in freshness.
- Browser gates stay failed if current capture cannot be performed.
- No gameplay or production runtime behavior changes.

### Implementation

- Reconciled the browser/mobile handoff with the current capture script and menu.
- Added structural validation to all six surface screenshots.
- Added five same-stem runtime QA sidecars to the freshness artifact set.
- Reused real tokenizer instances in tests after full-suite load exposed redundant
  initialization; kept all assertions and generation defaults intact.

### Evidence

- Chrome attached but local navigation was policy-blocked; no prohibited fallback
  was attempted and no success artifacts were fabricated.
- Three audits enumerated the 32-file contract and two disjoint workers implemented
  the documentation and evaluator changes.
- Focused integration passes 3 files / 54 tests. Final verification passes 78
  fixtures, 106 files / 975 tests, both builds, and local package audit.
- Ten iPhone 17 routes were rebuilt, recaptured, and visually inspected; simulator
  and native freshness pass. Three browser groups remain stale and failed.

### Decision

Keep. The recovery path is now exact and fail-closed, while the unavailable Chrome
navigation remains an honest external boundary.

### Remaining Risk

- Canonical browser screenshots and QA sidecars still require an allowed local
  browser process/control surface.
- Physical phone, VoiceOver, audio, haptic, touch-latency, and comprehension gates
  remain unproven.
- Public mode copy still mixes `Training` and `Endless Training`.

### Next Experiment

Audit player-facing mode terminology and select one public vocabulary without
renaming the internal route or changing uncapped progression.

## Loop 19 - Public Training Vocabulary

Status: kept after full web and native validation

### Hypothesis

Using one player-facing mode name across Menu, tutorial handoff, Results, and
operator evidence will reduce avoidable decision friction without obscuring the
uncapped-until-zero progression rule.

### Pass Conditions

- Current visible copy is `Training`, `Start Training`, and `Run Training Again`.
- Retired handoff wording cannot satisfy current playtest or physical evidence.
- Internal `endless` routes, QA IDs, filenames, and historical records remain
  stable; no gameplay or deep-link behavior changes.
- Current contracts explain that Training is uncapped while funds remain and
  terminates at zero balance.

### Implementation

- Changed Tutorial Cleared primary copy to `Start Training`.
- Reconciled current copy/design contracts, playtest protocol and templates,
  operator links, physical-device requirements, and associated evaluators.
- Added concrete-evidence checks that require started/starts Training or clicked
  Start Training plus unprompted timing/coaching evidence.
- After adversarial review, required the tutorial-complete surface and affirmative
  action in the same evidence clause, added polarity-aware physical-copy checks,
  and removed dormant visible `Endless` prose from Wiener speech data and README.
- Added tutorial-complete content to simulator freshness provenance.

### Evidence

- Three audits, four initial workers, one adversarial verifier, three corrective
  workers, and central integration review.
- Focused verification: 13 files / 178 tests. Full verification: 78 fixtures;
  106 files / 1,014 tests; browser and iOS web builds; local audit.
- XcodeBuildMCP rebuilt/launched the iPhone 17 app. Ten final routes are archived
  under `.qa/ios-simulator/loop-19-training-vocabulary/`; the visible handoff and
  semantic surfaces use the approved vocabulary. Simulator and native freshness
  pass.
- Human playtests remain 0/5, physical-device evidence is absent, and the three
  browser evidence groups remain stale/failed.

### Decision

Keep. `Endless` was internal vocabulary without a distinct player rule. The
public flow is now coherent and mechanics are unchanged.

### Remaining Risk

- `?mode=training` is a legacy tutorial alias. Changing it could break existing
  deep links, so it remains explicitly outside this copy-only loop.
- No participant has yet demonstrated same-mode comprehension across the three
  surfaces.
- Browser and physical-device evidence remain incomplete.

### Next Experiment

Audit Tutorial Failed framing and retry clarity against learning-science,
consumer-onboarding, compact-layout, and WienerWorks tone requirements before
changing runtime copy.

## Loop 20 - Tutorial Failure Diagnosis and Retry

Status: kept after full web and native validation

### Hypothesis

A concise result/criterion/correction/retry sequence will make tutorial failure
more actionable without weakening WienerWorks tone or changing the tutorial.

### Pass Conditions

- The failed surface exposes actual floored boundary accuracy and the 70%
  readiness requirement.
- Complete cut audits select missed-boundary, false-cut, or tied correction;
  incomplete audit data receives a truthful fallback.
- A failing score never displays as 70%.
- Title, chrome, actions, threshold, score formula, routing, and layout remain
  unchanged; compact portrait remains clear.

### Implementation

- Kept `Tutorial Failed`, `Retry Tutorial`, and `Return to Menu`.
- Replaced the generic paragraph with a dynamic bounded summary ending in
  `Payroll remains unconvinced.`
- Used canonical `missed boundaries` and `false cuts` terminology.
- Updated the copy deck, current surface contract, content tests, and exact QA
  parity tests; added no card, popup, semantic surface, or dependency.

### Evidence

- Three research/audit agents, one bounded implementation worker, and central
  copy/integration review.
- Focused verification: 4 files / 49 tests. Full verification: 78 fixtures; 106
  files / 1,017 tests; browser and iOS web builds; local audit; diff check.
- Ten final iPhone 17 routes are archived under
  `.qa/ios-simulator/loop-20-tutorial-failure-diagnostic/`. The changed frame is
  readable in five lines and clears both 46px actions. Simulator and native
  freshness pass.
- Browser, physical-device, and participant evidence remain incomplete.

### Decision

Keep. The treatment adds task-specific instructional information without
altering mechanics or diluting the product voice.

### Remaining Risk

- No participant has demonstrated faster or clearer retry; retention and
  learning effects remain hypotheses.
- Tutorial outcome remains canvas-only, and QA summary bounds still use a fixed
  line-height estimate rather than rendered wrapping.
- Three browser evidence groups and all physical-device gates remain open.

### Next Experiment

Audit a narrow Tutorial Cleared/Failed semantic counterpart and content-aware QA
text bounds using the existing Menu/Results semantic patterns. Preserve the
explicit partial-accessibility boundary.

## Loop 21 - Tutorial Outcome Semantic Bridge and Rendered QA Bounds

Status: kept after adversarial correction and native validation

### Hypothesis

Projecting the exact Tutorial Cleared/Failed copy and actions through the
existing semantic runtime, while publishing actual rendered text bounds, will
make the outcome task programmatically available and QA geometry truthful
without changing the canvas experience or implying accessible slicing.

### Pass Conditions

- Cleared and failed outcomes expose one heading, full canonical summary, and
  exactly two native actions in visible order.
- Canvas and semantic actions share one guarded command path and preserve all
  route payloads; stale or repeated actions cannot start a second transition.
- Summary QA geometry comes from rendered Phaser bounds at runtime, stays clear
  of title/actions in tested 320x568, safe-area 368x800, and 1280x720 profiles,
  and never returns to a fixed line multiplier.
- No visual, copy, tutorial threshold, score, timing, progression, persistence,
  fixture, economy, or slicing-input change occurs.
- Evidence language remains screen-specific; no VoiceOver, Larger Text, WCAG,
  physical-device, or whole-app accessibility pass is inferred.

### Implementation

- Added `tutorial-complete` to the shared semantic scene type and a pure
  `TutorialCompleteCopy` projection with a polite outcome announcement.
- Mounted/disposed one lease in `TutorialCompleteScene`, reset the navigation
  guard on reuse, and routed DOM/canvas actions through shared commands.
- Replaced the fixed summary QA rectangle with converted `Text.getBounds()`;
  added small/tall/desktop QA links and geometry tests.
- Removed the empty semantic details rail when `hidden`.
- Hardened deferred QA canvas capture so callbacks only write while their source
  snapshot is still current.

### Evidence

- Adversarial findings were corrected and rechecked: stale capture, 320 title
  clearance, coordinate conversion, and shutdown-callback scope all pass.
- 78 fixtures regenerated; 107 files / 1,028 tests pass. Browser and iOS web
  builds, local package audit, and diff check pass.
- Final iPhone 17 evidence is under
  `.qa/ios-simulator/loop-21-tutorial-outcome-semantics/`: eight required routes,
  semantic Menu/Results, and semantic cleared/failed outcomes. Native simulator
  and freshness groups pass.
- Three canonical browser groups remain stale/failed. No participant, physical
  device, VoiceOver, or Larger Text result exists.

### Decision

Keep. The outcome screen is now a bounded semantic task and QA records the text
Phaser actually rendered. The slicing loop remains canvas-only.

### Remaining Risk

- The 320x568 rendered summary size remains fixture-based until an allowed live
  browser capture exists.
- Scene lifecycle integration is source-contracted rather than exercised through
  a full Phaser scene harness.
- Simulator-visible semantic controls do not prove VoiceOver discovery or
  activation inside WKWebView.

### Next Experiment

Audit the semantic journey from Menu into Token Log and Settings. Select the
smallest complete destination, favoring read-only Token Log mappings before
mutable Settings controls unless evidence shows a stronger user need.

## Loop 22 - Structured Semantic Token Log

Status: kept with explicit external validation gaps

### Hypothesis

Exposing the existing recent/reference Token Log as sentence groups with ordered
token-text-to-ID pairs will make the game's numerical tokenizer dimension easier
to inspect without contaminating prediction with IDs or changing gameplay.

### Pass Conditions

- Semantic content uses the same entries, source summary, metadata, raw token
  strings, and IDs as the canvas Token Log; no flattened display string is
  reparsed.
- Each sentence exposes ordered atomic token-text/ID pairs, explicit whitespace
  descriptions, one Back action, and no live announcement.
- Semantic entry focuses the heading; semantic Back restores the Menu Token Log
  launcher. Canvas and semantic navigation share one guarded audio/transition
  command and reject duplicate or stale activation.
- Structured content reflows vertically at the small-phone contract without
  horizontal overflow; ordinary canvas Token Log visuals remain unchanged.
- Tokenizer fixtures, slicing, scoring, economy, rank, progression, persistence,
  and all gameplay routes remain unchanged.
- Browser source/unit/build evidence and fresh iPhone simulator rendering pass.
  Simulator rendering alone does not satisfy VoiceOver, Larger Text, physical
  input, or participant comprehension gates.

### Implementation

- Added structured sentence groups and ordered token-text/ID mappings to the
  one shared semantic runtime. Source and token text use bidirectional isolation;
  mapping labels contain audible punctuation and a clear numeric value label.
- Token Log entries retain immutable raw token/ID pairs from fixture arrays.
  Visible mappings remain unchanged, while semantic descriptions expose SPACE,
  TAB, LINE FEED, carriage return, no-break space, and any other Unicode
  White_Space code point explicitly.
- Menu-to-Token-Log entry focuses the heading only for the semantic route;
  semantic Back restores the Menu Token Log launcher. Pointer and semantic Back
  share one guarded audio/navigation command.
- Expanded QA links and native evidence requirements. The simulator gate now
  requires all five semantic screens, rejects exact screenshot reuse, and keeps
  VoiceOver activation false.
- Added an optional post-probe Token Log reference-use check; it is not a game
  mode, score, or efficacy claim.

### Evidence

- Adversarial review found no concrete defect in pairing, DOM order, focus
  handoff, stale activation protection, or gameplay preservation. Its evidence
  and Unicode findings were corrected before the final build.
- Full verification: 78 generated fixtures; 109 files / 1,045 tests; browser
  build; iOS web build; local audit; diff check.
- XcodeBuildMCP rebuilt the iPhone 17 shell. Thirteen required route frames and
  one scrolled bottom-state frame were visually inspected under
  `.qa/ios-simulator/loop-22-structured-token-log/`. The final Back control is
  reachable through the WKWebView scroll area.
- `npm run mobile:simulator` and the native freshness group pass. Three old
  browser evidence groups remain stale and failed.

### Decision

Keep as a bounded numerical-reference and navigation treatment. It communicates
token IDs where their source is truthful without adding numbers to player-cut
fragments or changing mechanics.

### Remaining Risk

- The 320-CSS-pixel and 200% text-resize routes are prepared but have not been
  live-rendered in an allowed browser environment. CSS source assertions are not
  counted as reflow evidence.
- Simulator visibility and scrolling do not prove VoiceOver discovery,
  activation, reading order, or physical-device behavior.
- No participant has passed the new reference-use gate; educational benefit
  remains a hypothesis.

### Next Experiment

Audit Settings reset truthfulness and destructive-action recovery before adding
Settings to the semantic form. Make `clearHighScore` report storage success or
failure, design one confirmation flow shared by pointer and semantic controls,
and preserve recent Token Log history, Sound, motion status, and Haptics state.

## Loop 23 - Verified Best Rank Reset Confirmation

Status: kept with explicit pointer and semantic gaps

### Hypothesis

A two-step confirmation backed by complete storage readback will prevent
accidental rank loss and eliminate false success claims without adding routine
friction to gameplay or changing any progression rule.

### Pass Conditions

- The first activation cannot call storage; Cancel cannot call storage; Confirm
  can call it once.
- Success requires readable post-delete absence across the canonical and every
  legacy high-score key. Partial writes and failed readback remain failures.
- Failure copy never substitutes the zero-rank default for an unverified result.
- Token Log, Sound, Haptics, motion reporting, rank thresholds, scoring,
  progression, and gameplay remain unchanged.
- Dialog title, concise consequence copy, Cancel, and Reset Rank fit all supported
  phone/desktop contracts and the current iPhone simulator safe area.

### Implementation

- Added `HighScoreClearResult` and per-key before/after verification, including
  fallback storage without `removeItem` and surviving-record reporting.
- Added one reusable `BestRankResetSystem` for request, cancel, confirm, outcome,
  and truthful status copy. The scene no longer calls storage directly.
- Added a contained WienerWorks confirmation panel with a blocking backdrop,
  neutral Cancel, destructive Reset Rank, QA phase/outcome state, and rendered
  status bounds.
- Added `mode=settings-reset-confirm` solely for native layout evidence. The
  manifest must keep `resetPointerActivationProven` false.
- Expanded simulator evidence/freshness provenance to the new route, scene,
  layout, reset system, launch parser, and storage contract.

### Evidence

- Focused reset/storage/layout/launch/evaluator integration passes 6 files / 91
  tests. The final full-suite count is recorded after the closing regression run.
- XcodeBuildMCP build/run succeeded on iPhone 17 / iOS 26.5. Fourteen fresh
  route images were inspected; the normal Settings and confirmation states are
  readable and unobstructed. `npm run mobile:simulator` passes 15 checked files.
- Source and state-machine evidence do not prove a real pointer opening, Cancel,
  confirmed deletion, failure rendering, VoiceOver, or physical-device behavior.

### Decision

Keep. The destructive boundary is now deliberate and the result is evidence-led.
No tokenizer, fixture, slicing, score, economy, timing, rank, progression,
session, result, or persistence schema changed.

### Remaining Risk

- Settings remains canvas-only. The modal lacks keyboard focus containment,
  Escape handling, and assistive-technology semantics.
- Storage-failure visual copy is unit-tested but has not been induced in WKWebView.
- Participant accidental-touch and comprehension criteria remain unmeasured.
- Three canonical browser evidence groups remain stale.

### Next Experiment

Project the complete Settings task through the existing semantic runtime now that
reset request, confirmation, and storage outcomes have one reusable authority.

### Adversarial Correction

- Required the same pointer to press and release a Settings control; sliding a
  press from Cancel or the backdrop onto Reset Rank can no longer confirm.
- High-score loading now skips empty/invalid canonical residue and recovers a
  valid surviving legacy record after a partial fallback clear.
- The simulator evaluator now rejects positive claims for reset Cancel,
  confirmed deletion, and failure rendering when evidence comes only from the
  direct layout route.
- Final corrected evidence: 112 files / 1,077 tests; iOS web build; fresh
  XcodeBuildMCP iPhone 17 run; fourteen inspected frames under
  `.qa/ios-simulator/loop-23-truthful-best-rank-reset-v2/`; simulator and
  native freshness pass. Three historical browser groups remain stale.

## Loop 24 - Complete Semantic Settings

Status: keep after bounded structural and native validation

### Hypothesis

A typed semantic Settings projection with idempotent shared commands and a real
alert-dialog contract will let keyboard and assistive-technology users complete
every non-gameplay Settings task without creating a second state authority or
changing the canvas UI.

### Pass Conditions

- Semantic Settings exposes stable-name Sound and capable Haptics switches,
  static unavailable Haptics, effective system motion status, truthful rank/reset
  status, Reset Best Rank, and Back in visual order.
- Canvas and semantic controls share target-setting commands. One activation
  produces at most one preference write or navigation; stale/double activation
  cannot invert state twice.
- Reset opens a labelled alert dialog, makes background content inert, focuses
  Cancel, contains Tab/Shift+Tab, routes Escape through Cancel, and returns focus
  to Reset Best Rank after Cancel or Confirm.
- Reset outcomes announce exactly once with polite success/already-clear and
  assertive unavailable copy. Resize and unrelated rerender do not reannounce.
- Semantic entry focuses Settings; semantic Back restores the Menu Settings
  launcher. Pointer navigation does not move semantic focus.
- DOM/unit/build/native rendering pass while VoiceOver, physical device behavior,
  and canvas slicing accessibility remain explicitly unproven.

### Implementation

- Added typed semantic switches, static status rows, and a modal alert-dialog
  descriptor to the shared runtime and DOM surface.
- Added a pure Settings projection for Sound, Reset Best Rank, effective Reduced
  Motion, capability-aware Haptics, and Back. During confirmation the runtime
  exposes only Cancel and Reset Rank.
- Removed Settings' local Haptics fallback. Canvas and semantic controls now
  share target-setting commands and the verified reset state machine; Back is
  guarded and restores Menu Settings focus only for semantic navigation.
- Added focus containment/Escape/return-focus helpers, inert background content,
  one-shot motion/reset status announcements, and focused integration tests.
- Extended native evidence and freshness contracts with semantic Settings and
  semantic Settings confirmation routes plus explicit false keyboard/VoiceOver
  activation claims.

### Native Evidence

- The first capture batch was rejected after a delayed worker landed a safer
  render-state target capture. The web bundle and shell were rebuilt, and all
  routes were recaptured rather than reusing stale images.
- Sixteen final iPhone 17 / iOS 26.5 frames under
  `.qa/ios-simulator/loop-24-semantic-settings-v3/` were inspected. Settings
  switch/status rows and the alert dialog fit 368x800 without overlap.
- `npm run mobile:simulator` passes 17 checked files. Native freshness passes;
  the three browser comparison groups remain honestly stale.

### Evidence Boundary

- Unit/structural tests support command sharing, target-state idempotence,
  lifecycle, dialog action restriction, focus cycling, Escape, and announcement
  dedupe. They do not prove an end-to-end browser keyboard task.
- Simulator screenshots prove bundled rendering only. VoiceOver discovery and
  activation, semantic keyboard activation inside WKWebView, physical touch and
  haptics, reset failure rendering, 200% text, and participant comprehension
  remain unproven.

### Adversarial Correction

- Limited `aria-modal` to semantic-origin confirmation, where Cancel receives
  focus and sibling canvas content becomes inert. Pointer-origin confirmation
  keeps a nonmodal hidden mirror and does not move semantic focus.
- Forwarded native checkbox checked state through the DOM/coordinator boundary;
  Sound and Haptics commands now receive the request rather than invert current
  state. Added a same-pointer guard to Menu actions.
- Moved reset announcements to a one-shot scene queue so later Reduced Motion
  changes are not suppressed by a persistent reset outcome.
- Replaced the simulator gate's self-attested visible-content requirement with
  an explicit false automatic-proof requirement, and added direct Settings
  dependencies to freshness provenance.
- The first two capture sets were invalidated by intervening source corrections.
  The final v3 set was built and captured after all six fixes; a second reviewer
  pass found no remaining actionable code issue.

### Final Validation

- `npm run generate:fixtures` regenerated all 78 fixtures without drift.
- The full suite passes 115 files / 1,115 tests. TypeScript, the browser build,
  the iOS web build, the local playtest audit, and `git diff --check` pass.
- The final iOS web assets are byte-identical to a clean production build made
  after fixture regeneration. XcodeBuildMCP built and launched that bundle on
  iPhone 17 / iOS 26.5 before the v3 capture set was recorded.
- `npm run mobile:simulator` passes all 17 required files. Native freshness
  passes. Active/results and runtime browser evidence remain stale and failed;
  no timestamp or manifest field was used to waive those three gates.

### Decision

Keep with a bounded claim. Settings now has one shared semantic task model and
a truthful alert-dialog contract, while the visual canvas treatment remains
unchanged. This does not establish VoiceOver operability, physical-device
behavior, 200% text support, or accessible slicing.

### Remaining Risk

- Results, Tutorial Complete, and Token Log still use release-triggered canvas
  buttons without the same-pointer activation guard now used by Menu and
  Settings.
- End-to-end keyboard and VoiceOver operation in WKWebView remains unobserved.
- Physical touch, haptics, storage-failure rendering, large text, and participant
  outcomes remain open.
- Three canonical browser evidence groups remain stale.

### Next Experiment

Audit and normalize pointer activation for every non-play canvas action. Require
the same pointer to press and release a control, cancel on release outside, keep
immediate pressed-state feedback, and preserve all action order, navigation,
semantic commands, mechanics, and visual layout.

## Loop 25 - Trustworthy Non-Play Pointer Activation

Status: keep after bounded structural and native validation

### Hypothesis

A single per-control activation contract that tracks the owning pointer and
gesture, completes only on a valid release, and cancels terminal touch states
will reduce accidental mobile navigation without changing the game's verbs,
screens, or semantic command model.

### Pass Conditions

- Menu, Settings, Results, Tutorial Complete/Failed, and Token Log use one shared
  canvas-button binding; release over a control without its press cannot act.
- Moving the owner outside, releasing outside the canvas, leaving the canvas,
  reusing a stale pointer ID, or receiving a canceled touch cannot activate.
- One finger owns each control. Other fingers cannot alter its visual state or
  act through it. Right and middle mouse clicks cannot act. Rest/hover feedback
  is applied before the command runs.
- Rerender and shutdown remove scene-input listeners. Semantic actions retain
  exact command routes and remain independent of canvas pointer ownership.
- PlayScene input and all mechanics, economics, progression, persistence,
  Copy Summary labels/fallback flow, layout, and visible text remain unchanged.

### Implementation

- `PointerActivationGuard` now records one pointer/gesture owner, distinguishes
  activate/cancel/ignore releases, rejects canceled touches, and supports scene
  cancellation.
- `CanvasButtonActivationSystem` binds Game Object events plus the correct Scene
  Input Plugin outside/game-exit events, accepts touch or primary mouse input,
  and removes all listeners when the button is destroyed.
- All five non-play scenes delegate their existing visuals and commands to that
  binding. Direct, ineffective Game Object `pointerupoutside` listeners are gone.
- Results rejects overlapping Copy Summary commands and uses monotonic lifecycle
  and operation tokens so a stale clipboard completion cannot mutate a recreated
  Results scene or clear a newer operation, while preserving its copy/save flow.
- Behavioral tests cover valid mouse/touch activation, release-without-press,
  pointer-out, outside-canvas release, game exit, canceled touch, multi-touch
  visual ownership, non-primary mouse clicks, stale gesture reuse, action
  ordering, and listener cleanup.

### Evidence Boundary

Source and emitter tests can establish state-machine behavior and lifecycle
cleanup, not physical finger feel or an end-to-end WebKit event sequence. The
intervention is aligned with pointer-cancellation guidance but does not by itself
establish WCAG conformance. PlayScene controls remain outside this loop.

### Adversarial Findings Resolved

- Phaser touch ordering can emit `pointerover` after `pointerdown`; owner hover
  now preserves pressed feedback and an emitter test fixes that sequence.
- Results Copy Summary now uses an executable lifecycle/operation gate. A
  deferred race test proves that copy A cannot mutate a recreated Results scene
  or release copy B after A completes late.
- Touch and primary mouse input can activate; right and middle mouse buttons
  cannot. Focused tests cover both rejected button values.
- Browser surface and native freshness provenance includes both shared pointer
  files and the Results copy gate, so later behavior changes invalidate evidence.

### Final Evidence And Decision

- Fixture regeneration produced 78 fixtures. The final suite passes 117 files /
  1,139 tests; TypeScript, browser production build, iOS web build, local
  playtest audit, and diff check pass.
- XcodeBuildMCP built, installed, and launched the final bundle on iPhone 17 /
  iOS 26.5. Sixteen fresh routes in
  `.qa/ios-simulator/loop-25-pointer-activation-v3/` passed the 17-file gate and
  were promoted to `.qa/ios-simulator/latest/` after representative inspection.
- Native freshness passes. The menu, active/results, and runtime browser groups
  remain stale and fail honestly; no physical touch or pointer-cancellation
  claim is made.
- Keep Loop 25. It changes platform/UI glue only and preserves tokenizer truth,
  slicing mechanics, score/economy, progression, storage, session flow, layout,
  labels, and semantic commands.

### Next Experiment

Audit PlayScene bottom controls as a separate mechanic-sensitive boundary.
Determine whether press/release origin, touch cancellation, or multiple pointers
can trigger Sound, Clear, Exit, or Resolve while sharing the slicing stream.
Preserve all slicing thresholds and gameplay outcomes until the event flow is
proven and a narrow contract is specified.

## Loop 26 - Single-Owner Play Input Routing

Status: keep after adversarial correction and bounded native validation

### Hypothesis

One PlayScene-specific owner across slicing and bottom controls will prevent
accidental commands, canceled-touch actions, control-origin cuts, and
multi-pointer gesture corruption without changing the established slice model or
any gameplay outcome.

### Pass Conditions

- A control activates only after the same pointer and gesture pressed that same
  control, remained armed, and released without cancellation.
- A slice released over a control remains a slice only. A control press dragged
  away remains blocked from slicing and performs no command.
- Right, middle, Ctrl-click, stale gestures, cross-control release, touch cancel,
  and secondary pointers cannot act or terminate the owner.
- Gameout and outside release clean up deterministically without reading invalid
  coordinates or creating a final cut sample.
- Existing slice sampling, snap/cut thresholds, staged cuts, resolution, Clear,
  Sound, Exit, tutorial dwell, keyboard commands, labels, layout, QA IDs,
  scoring, economics, progression, and persistence remain unchanged.

### Evidence Boundary

Pure router/emitter tests can prove event-state transitions; source integration
tests can prove the PlayScene wiring. Simulator frames and gestures remain needed
for current WebKit rendering and event-flow confidence. None of these alone prove
physical-device touch feel or accessibility conformance.

### Implementation

- `PlayInputRoutingSystem` owns exactly one slice or named control by pointer ID
  plus down time. `PlayControlActivationSystem` supplies release activation,
  pointer-out disarming, cancellation, pressed feedback, and listener disposal
  for Sound, Clear, Exit, and Resolve.
- PlayScene starts slices only on pointer down, continues only a matching owner
  on pointer move, applies the final release sample only to a valid slice, and
  treats outside release, touch cancel, and game exit as cancellation.
- A shared transient-slice reset closes the cut session and clears all gesture
  fields on focus interruption, round start, Clear, and shutdown. Accepted
  owners alone update input modality.

### Adversarial Corrections

- Prevented a canceled control drag from becoming a slice after canvas re-entry.
- Prevented keyboard Clear from clearing and then re-staging on pointer release.
- Removed stale cut-session state across PlayScene shutdown/reuse.
- Prevented a rejected second finger from changing modality, haptic behavior, or
  session evidence.
- Independent re-review reproduced each original failure and passed each exact
  sequence after correction.

### Final Evidence And Decision

- Final checks pass 78 generated fixtures, TypeScript, 120 files / 1,163 tests,
  browser production build, iOS web build, local audit, and diff check.
- XcodeBuildMCP launched the corrected iPhone 17 / iOS 26.5 bundle before the
  sixteen-route `.qa/ios-simulator/loop-26-play-input-routing/` capture. The
  17-file simulator gate and native freshness pass.
- Three browser evidence groups remain stale and fail honestly. No physical
  touch, end-to-end WebKit gesture, audio/haptic, VoiceOver, or WCAG claim is
  made.
- Keep Loop 26. It changes platform/input glue only; cut thresholds, fixtures,
  scoring economics, rank progression, tutorial/training/results flow,
  persistence, labels, and geometry remain intact.

### Next Experiment

Compare progressive-disclosure treatments for the fixtures' real token IDs:
resolved feedback evidence, Token Log text-to-ID mappings, and post-resolution
fragment labels. Keep IDs hidden during prediction and reject falling labels if
they reduce legibility or comprehension.

## Loop 27 - Economy Escalation, Recoverable Mastery, And Persistent Quota

Status: keep after deterministic stress testing and multi-simulator review

### Hypothesis

A finite 200-sentence work quota, recoverable Token Log status, and cost-only
pressure escalation will give Training a legible long-term goal while preserving
the joke that sustained manual tokenization becomes economically inhuman.

### Pass Conditions

- Training exposes one persistent `QUOTA n/200` goal without displacing balance,
  time, best run, current run, Wiener speech, or the canonical feedback ledger.
- Every run avoids successful-prompt repetition until all eligible unseen
  sentences are exhausted. Failed sentences wait at least 20 resolutions before
  retry eligibility.
- A later correct retry restores a sentence from `REVIEW` to `CORRECT` while
  retaining attempt history.
- Difficulty raises company debit without inflating player pay. Perfect play can
  complete 200 rounds; a materially error-prone strategy reaches budget failure.
- Review does not display a frozen prediction countdown.

### Implementation

- Expanded the factual `cl100k_base` corpus to 200 unique, single-line phone
  prompts in the requested 60/60/40/40 prose, punctuation/informal, code/web, and
  multilingual/symbolic grouping. A final copy audit replaced four malformed or
  real-product-adjacent lines and one near-duplicate while preserving IDs and
  category weights.
- Split scoring's fixture difficulty from the progressive penalty scale:
  fixture weight still affects work value, while escalation now affects company
  debit only. A 200-round regression envelope protects both failure pressure and
  perfect-run viability.
- Token Log schema v4 records the latest outcome separately from cumulative
  attempts, with a bounded v3 migration. Training writes quota progress only
  after resolution and seeds it from tutorial encounters.
- The mobile HUD labels persistent progress as `QUOTA n/200`; tutorial retains
  lesson progress. Review now reports `STATUS / AUDIT` instead of a stale time.

### Evidence And Decision

- Fixture generation produces 200 records. The final suite passes 123 files /
  1,240 tests; TypeScript, browser production build, iOS web build, local package
  audit, and diff check pass.
- XcodeBuildMCP built and launched the final shell on iPhone 17e, iPhone 17, and
  iPhone 17 Pro Max simulators. Long prompts remain one line; menu, active play,
  clean review, Token Log, settings confirmation, and four-metric Budget
  Exhausted layouts remain clear.
- Sixteen fresh iPhone 17 routes in `.qa/ios-simulator/latest/` pass the 17-file
  simulator evidence gate. Native evidence freshness passes.
- Keep Loop 27. It gives Training a finite objective and repairs two mechanics
  that contradicted that objective without changing tokenizer truth, cut
  thresholds, rank gates, tutorial routing, or the feedback-card evidence model.

### Remaining Risk

- Browser comparison/runtime artifacts remain stale and are not waived.
- Physical touch latency, finger occlusion, haptics, audible cue quality,
  VoiceOver activation, and large-text behavior still require a real iPhone.
