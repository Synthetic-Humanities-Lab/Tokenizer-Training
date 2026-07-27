# Tokenizer Training Optimization Brief

> Historical optimization record for loops 1-26. The next experience-first
> phase is governed by `experience_first_goal.md` and maintained in
> `experience_brief.md`, `experience_research_log.md`, and
> `experience_iteration_log.md`.

Last updated: 2026-07-18
Loop: 17 - physical-device evidence contract truth
Status: correction kept after full web/native validation; Loop 18 browser-evidence recovery selected

## Objective

Improve game feel, consumer clarity, educational effectiveness, accessibility,
and browser/mobile coherence through evidence-led, reversible experiments. Keep
one Phaser/Vite game and one iOS web-runtime shell.

## Invariants

- Preserve the checked-in tokenizer fixtures and real `cl100k_base` behavior.
- Preserve scoring economics, swipe/cut detection, difficulty/rank progression,
  tutorial/training/results flow, storage, and browser harness unless a proven
  bug is documented.
- Wiener is the only character voice. The feedback card is canonical resolved
  evidence.
- Keep IDs hidden during prediction. Never invent token numbers or imply that a
  model-specific ID is universal.
- Preserve WienerWorks: obsolete, bureaucratic, degraded, and faintly uncanny.
- Do not publish, add tracking, replace the tokenizer, add substantial
  dependencies, or change core economics without explicit approval.

## Current Evidence

- Fixtures already pair every `token_string` with a real `token_id`.
- The final Loop 17 iPhone 17 simulator build launched successfully on
  2026-07-18; all ten native routes were recaptured from that bundle.
- `npm run mobile:crossref:status` reports stale/incomplete evidence after
  recent feedback-card and budget-results changes. Refresh is required before
  parity claims; these messages are not yet proof of runtime regressions.
- Current `npm run test` (969 tests), `npm run build`, and
  `npm run build:ios-web` pass.
- Managed-shell Chromium capture is sandbox-blocked, and the in-app browser
  currently rejects localhost navigation. Browser evidence remains a gate, not
  a reason to stop research or bounded implementation.
- The worktree contains substantial pre-existing mobile-port changes. Agents
  must preserve unrelated edits and own disjoint files.

## Loop 1 Question

How should the game teach that tokens are numeric model inputs without
obstructing the boundary-prediction verb?

Compare:

1. token IDs in resolved-round feedback;
2. text-to-ID mappings in Token Log;
3. restrained labels attached to falling fragments after resolution.

Default hypothesis: progressive disclosure will teach the relationship more
clearly than persistent labels. Review and Token Log are primary; falling IDs
are an optional reinforcement and must be rejected if they reduce legibility.

## Required Research

- Learning science: worked examples, feedback timing, cognitive load, retrieval
  practice, and transfer.
- Tokenization pedagogy: what token IDs mean, model specificity, leading-space
  behavior, Unicode/byte caveats, and truthful visualization.
- Consumer/game feel: post-action payoff, readable reward bursts, mobile
  occlusion, pacing, and retention without manipulative engagement design.
- Current code/UX: identify the smallest interfaces that can expose token IDs
  while preserving QA contracts and mechanics.

Record sources and the decision they support in `research_log.md`. Separate
source findings from project-specific inference.

## Agent Contract

Every assignment must be narrow and non-overlapping. Research agents do not
edit code. Workers must list owned files, preserve concurrent changes, add
tests, and report uncertainty. The orchestrator reviews source quality, diffs,
tests, browser screenshots, and simulator evidence before accepting work.

## Validation Gates

- `npm run generate:fixtures`
- `npm run test`
- `npm run build`
- `npm run build:ios-web`
- refreshed mobile cross-reference/runtime evidence
- small, standard, and large phone portrait checks
- desktop browser harness check
- XcodeBuildMCP build/run plus current simulator screenshot

## Loop 1 Delivery

- Added one checked formatter for encoding-qualified text-to-ID evidence.
- Review now shows the complete resolved token split plus one representative
  `cl100k_base` ID mapping; Token Log shows complete mappings for three fixture
  examples. Leading spaces use the visible `␠` marker.
- Updated tutorial terminology from the obsolete `token strip` to the canonical
  feedback-card `review record`.
- Added exact regenerated-fixture equality, invalid-ID, alignment,
  prediction-surface exclusion, Token Log, compact feedback, and tutorial-copy
  tests.
- Simulator evidence is preserved in `.qa/optimization/loop-001/`: current menu,
  rejected 11px Token Log, and accepted 12px Token Log.
- Production iOS deliberately compiles out dev-only QA controls, so deterministic
  review holding remains a browser-harness responsibility. Do not claim native
  review-frame coverage from launch arguments.

## Next Assignments

1. Implement a versioned, fail-soft local record containing at most three unique
   recently resolved fixture IDs, newest first.
2. Keep the three-row Token Log; fill empty rows from an explicit curated
   reference list and label rows `RECENT` or `REFERENCE`.
3. Correct Token Log metadata contrast and preserve the 320x568 layout budget.
4. Refresh browser review evidence when localhost capture is available; verify
   the ID sample in the canonical feedback card at small, standard, large, and
   desktop viewports.
5. Resolve stale results-evidence expectations separately from the token-ID
   experiment; do not weaken validators merely to produce a green status.

## Loop 1 Decision

- Adopt stable, encoding-labelled text-to-ID evidence after resolution and in
  Token Log.
- Use an explicit visible-space marker; do not use underscore because literal
  underscores are valid token content.
- Reject IDs on falling fragments. Those fragments follow the player's
  submitted cuts, so imperfect rounds do not have a truthful one-fragment to
  one-token-ID mapping.
- Keep IDs neutral: they are vocabulary lookup keys, not score, rarity, cost,
  confidence, or meaning.
- Do not change the animation, input, score, economy, progression, storage, or
  Results surfaces in this experiment.
- Keep the treatment. Simulator review changed the Token Log mapping type from
  11px to 12px; the small-phone line-budget test still passes.

## Loop 2 Decision

- Prefer three recently resolved unique fixtures over a static-only Token Log.
  Use explicit curated references only to fill empty rows.
- Reject search, tabs, scrolling, a 78-item catalog, badges, streaks, and a new
  scored mode in this loop.
- Record at canonical resolution after feedback formats, never when a prompt
  appears. Tutorial and Training both qualify because both produce review.
- Approve one additive persistence exception: a versioned local record stores
  only fixture IDs. It must be capped, malformed-data tolerant, offline,
  origin-local, and cleared by playtest reset. Existing high-score/mute methods
  and Settings reset semantics must not change.
- Defer the proposed answer-before-reveal microcheck. It is a separate learning
  interaction and should not be bundled with the archive data-source test.

## Loop 2 Delivery

- Added a version-1, three-ID, newest-first local archive. Storage validates ID
  shape without importing the fixture corpus, preserves unsupported future
  versions, repairs malformed current data on the next valid write, and fails
  soft when storage is unavailable.
- `resolveRound` records only after canonical feedback formats. Prompt-start
  selection history remains separate and unchanged.
- Token Log resolves current fixture truth, skips unknown IDs, labels rows
  `RECENT` or `REFERENCE`, and uses explicit curated fallback IDs.
- Corrected subtitle/metadata contrast and raised compact secondary text to
  11px; 12px mappings remain unchanged. Compact metadata omits category so all
  78 fixtures remain one line at 320x568.
- Added storage, source-order, layout, safe-area, contrast, QA provenance,
  freshness-provenance, and resolution-boundary tests.
- Current validation: 78 fixtures regenerated; 95 files / 817 tests pass;
  browser build and iOS web build pass; XcodeBuildMCP build/run passes;
  `npm run mobile:simulator` passes all nine files.
- Native proof: one auto-resolved prompt persisted across app stop/relaunch and
  appeared as the first `RECENT` row. Evidence:
  `.qa/optimization/loop-002/ios-token-log-recent.jpg`.
- `mobile:freshness` now passes menu and iOS groups. Active/results and runtime
  groups remain stale because localhost browser capture is blocked.

## Loop 3 Candidates

1. Results information hierarchy: verify budget versus suspended summaries,
   four-metric contract, rank prominence, and removal of meaningless exhausted
   balance evidence.
2. Native QA determinism: the legacy `endless-pinned` launch argument is present
   in the manifest but production Vite compiles out fixture/freeze controls.
3. Canvas accessibility: define a bounded semantic counterpart strategy before
   attempting broad DOM duplication.

## Loop 3 Decision

- Keep the current product distinction: `Budget Exhausted` shows exactly four
  visible metric cards (`run`, `cuts`, `accuracy`, `rank`) and no balance;
  `Training Suspended` shows those four plus the remaining balance.
- Keep pay, cost, net, efficiency, round traces, and provenance in Copy Summary.
  Do not reintroduce a visible results ledger or aggregate token total.
- Do not change rank thresholds, result actions, action order, economics, or
  session outcomes in this loop.
- Repair the deterministic protocol-results route before judging screenshots.
  It currently emits a voluntary-exit outcome while the evidence validator
  treats it as budget exhaustion, and its seeded accuracy/balance arithmetic is
  inconsistent.
- Correct the compact metric-label accessibility defect: labels must be at
  least 11px and use the normal muted-text contrast treatment.

## Loop 3 Pass Criteria

- The budget protocol seed is internally coherent: 5 correct, 3 missed, 2 false,
  50% accuracy, $21.50 pay, $61.50 cost, and $0 balance from a $40 start.
- Budget evidence has the exact four-card contract and says why the run closed.
- Voluntary-exit evidence retains a truthful positive balance in a five-card
  layout.
- Metric labels and longest rank values fit at 320x568, 368x552, safe-area
  390x844, and 1280x720 without colliding with summary or actions.
- Full tests/builds and current iOS captures pass with no mechanics changes.

## Loop 3 Rejected Scope

- Unboxed or specially promoted rank treatment.
- Reordering the three result actions or demoting Copy Summary.
- Restoring visible pay/cost/net/efficiency cards.
- Treating the QA-route repair as a reason to change live scoring economics.

## Loop 3 Delivery

- Added a pure protocol-result seed derived from coherent trace totals. The QA
  route now emits 5 correct, 3 missed, 2 false, 50% accuracy, $21.50 pay,
  $61.50 cost, $0 balance, and `outcome: budget`.
- Kept the live budget/suspension policy: four budget cards and five suspension
  cards. No action, rank, economy, session, or persistence behavior changed.
- Raised metric labels to 11px muted text and enlarged compact card geometry.
  Bounded value typography covers `Temporary Sequence Specialist` at small,
  standard, safe-area large portrait, and desktop targets.
- Strengthened the surface validator so stale quit/economic-card evidence cannot
  masquerade as a budget result.
- Current validation: 78 fixtures regenerated; 96 files / 831 tests pass;
  browser and iOS web builds pass; `git diff --check` passes.
- XcodeBuildMCP built and launched the current shell. Fresh budget and suspension
  captures are in `.qa/optimization/loop-003/`; all eight current route images
  and the manifest pass `npm run mobile:simulator`.
- Native evidence freshness passes. Browser active/results and runtime groups
  remain stale: managed Chromium fails at Mach-port registration and the in-app
  browser security policy rejects localhost. These are open evidence gates, not
  waived checks or observed runtime failures.

## Loop 4 Candidates

1. Native QA determinism: make the checked-in `endless-pinned` route truthful in
   production iOS builds without exposing QA controls in ordinary launches.
2. Canvas accessibility: specify a bounded semantic counterpart for menus,
   results, speech, prompt, and feedback before duplicating the whole canvas UI.
3. Result-copy persistence truth: prevent “Best saved” wording after a failed
   local-storage write without changing ranking or storage format.

## Loop 4 Decision

- Rename the production simulator route and file from `endless-pinned` to
  `endless-active`. It proves native shell boot, endless routing, active canvas
  rendering, and safe-area/layout visibility only.
- Remove `qaFixtureId` and `qaFreezeElapsedMs` from native endless and tutorial
  launch metadata. They are compiled out of the production Vite assets and must
  not be recorded as applied controls.
- Make the simulator validator reject all browser-only QA parameters in native
  production route metadata rather than checking that inert strings are present.
- Preserve the genuine browser-development pinned routes. Their controls run
  under `import.meta.env.DEV` and remain useful for browser cross-reference.
- Defer a separate evidence Xcode scheme/native attestation bridge. It would be
  required for truly fixed native frames, but a structural smoke screenshot does
  not justify a second build surface and unproven receipt pipeline.

## Loop 4 Pass Criteria

- No native manifest route contains `qaFixtureId`, `qaFreezeElapsedMs`,
  `qaHoldReview`, `qaCanvasCapture`, or `qaViewport`.
- The native route/file is named `endless-active`; no checked simulator contract
  calls it pinned or deterministic.
- Fresh tutorial and endless images are captured using only live production
  launch parameters and pass the native evidence/freshness validators.
- Browser dev-only fixture/freeze controls and browser capture routes are
  unchanged.

## Loop 4 Delivery

- Renamed the native route and screenshot contract to `endless-active` and
  removed fixture/freeze arguments from tutorial and endless native launches.
- The native evaluator now rejects `qaFixtureId`, `qaFreezeElapsedMs`,
  `qaHoldReview`, `qaCanvasCapture`, and `qaViewport`, including duplicate or
  contradictory launch metadata.
- Browser development controls remain behind `import.meta.env.DEV`; their pinned
  capture routes and runtime contract are unchanged.
- Regenerated 78 fixtures; 96 test files / 839 tests pass; browser and iOS web
  builds pass; `git diff --check` passes.
- XcodeBuildMCP rebuilt the app and recaptured all eight iPhone 17 routes after
  the iOS web build. `npm run mobile:simulator` passes and native freshness
  passes.
- Browser active/results and runtime artifacts remain stale and fail closed.
  Managed Chromium cannot register its Mach port and the in-app browser policy
  rejects localhost, so no browser parity claim is made from old captures.

## Loop 5 Selection

Audit result-copy persistence truth. `StorageSystem.saveHighScore` may return a
candidate after a failed write, allowing the results surface to imply that a best
rank was saved when persistence did not succeed. Preserve rank thresholds,
storage format, and normal successful copy; separate "best achieved" from "best
persisted" with the smallest testable contract.

## Loop 5 Decision

- Make high-score writes return an explicit `saved`, `kept`, or `unavailable`
  result with separate achieved and persisted records.
- Keep the current serialized record, key, comparison order, rank thresholds,
  result metrics, and successful `Best saved` copy unchanged.
- On a failed better-record write, retain the previous persisted best and report
  the new achievement separately. Never return the failed candidate as persisted.
- Treat legacy-key migration as best effort: a readable valid legacy best remains
  readable even if copying it to the canonical key fails.
- For an immediate zero-round quit with no stored best, report `none yet`; do not
  fabricate a saved zero-round Regex Intern record.
- Do not add a visible warning card or native bridge in this loop. The visible
  results surface makes no save claim; failure truth belongs in the detailed copy
  payload until canvas status semantics are addressed separately.

## Loop 5 Pass Criteria

- New/better successful writes, equal/lower no-write cases, first-write failure,
  replacement failure, unavailable storage, and legacy migration failure have
  explicit tests.
- A failed replacement preserves the prior stored record on reload.
- Successful result ledger and copied-summary strings remain byte-for-byte
  compatible with current mobile evidence.
- Failure copy distinguishes achieved from saved and says the new best was not
  saved on this device; no-record copy says `Best saved: none yet`.
- Full tests/builds pass, the iOS web bundle is rebuilt, and current simulator
  evidence is refreshed only if source freshness requires it.

## Loop 5 Rejected Scope

- Changing high-score ordering, rank progression, economics, storage keys, or
  stored JSON shape.
- Promising permanent storage after a successful synchronous Web Storage write.
- Adding a second native persistence system or user account/cloud synchronization.
- Treating clipboard/download status as high-score save status.

## Loop 5 Delivery

- `StorageSystem.saveHighScore` now returns a discriminated result. `saved` and
  `kept` always carry a confirmed persisted record; only `unavailable` may carry
  no persisted record.
- Failed better-record writes retain any prior saved best. Valid legacy records
  remain readable when canonical-key migration cannot be written.
- Results copy keeps its successful strings unchanged. Failure-only copy names
  the achieved best, the prior saved best or `none yet`, and states that the new
  best was not saved on this device.
- Immediate zero-round quit with no prior record now says `Best saved: none yet`.
  Visible result cards, actions, ranks, scoring, economics, storage keys, and
  serialized records are unchanged.
- Regenerated 78 fixtures; 96 test files / 847 tests pass; browser and iOS web
  builds pass; `git diff --check` passes.
- XcodeBuildMCP rebuilt the current shell. A protocol result persisted
  `Boundary Clerk / 7 rounds` across a stopped/relaunched app process, and all
  eight current simulator screenshots pass `npm run mobile:simulator`.
- Native freshness passes. Browser active/results and runtime groups remain stale
  and fail closed because the allowed browser surfaces still cannot capture
  localhost in this environment.

## Loop 6 Selection

Audit canvas accessibility and define a bounded semantic-counterpart treatment.
Prioritize menu actions, results outcome/metrics/actions, Wiener speech, prompt,
and feedback evidence. Do not mirror every animated canvas object or alter the
visual/gameplay surface. First establish current keyboard, screen-reader, focus,
status-message, reduced-motion, and 200% text behavior plus a testable ownership
boundary between Phaser and the DOM/native shell.

## Loop 6 Decision

- Add one game-level typed semantic runtime and one DOM surface beside the canvas.
  Phaser remains the only visual and gameplay state authority.
- First slice: menu heading/best/actions and results outcome/summary/metrics/actions.
  Canvas and semantic buttons must invoke the same scene command methods.
- Use epoch-scoped scene leases so shutdown clears stale controls and late
  publishes or actions cannot affect a replacement scene.
- Render native headings and buttons plus polite/assertive live regions. Keep the
  semantic surface visually unobtrusive by default and reveal it on keyboard
  focus; do not use `role=application`.
- Preserve successful canvas screenshots and mechanics. The browser and WKWebView
  use the same DOM bridge; no Swift message bridge or native rebuild is needed.
- Do not claim full keyboard/VoiceOver game completion in this slice. Cut-boundary
  selection, play/review announcements, reduced motion, timing accommodation, and
  large-text behavior remain separately measured gaps.

## Loop 6 Pass Criteria

- Menu exposes one heading and exactly four named native buttons in visual order;
  each command transitions once and uses the same methods as canvas activation.
- Results exposes outcome, summary, exact visible metric rows, and three current
  actions; copy-button label changes update without stale controls.
- Runtime tests reject stale lease publishes/actions, duplicate consumption, and
  late disposal; scene shutdown removes the old semantic surface state.
- Native buttons retain ordinary Enter/Space semantics and keyboard focus is
  visibly discoverable without changing the unfocused game screenshot.
- XcodeBuildMCP accessibility snapshot exposes menu/results headings and buttons
  in WKWebView; an accessibility action can navigate at least one route.
- Full fixtures/tests/builds, current simulator captures, and mechanics-preserving
  mobile validators pass or fail only at already-recorded browser evidence gates.

## Loop 6 Rejected Scope

- Mirroring timer ticks, particle/tween positions, decorative Wiener motion, or
  QA JSON into live regions.
- Scene-local DOM implementations, a Phaser global plugin, or native SwiftUI
  gameplay controls.
- Hiding the incomplete play accessibility gap behind a blanket accessibility
  claim.
- Combining the semantic bridge with reduced motion, pause/extended timing,
  contrast, or global canvas text scaling in one patch.

## Loop 6 Delivery

- Added one typed semantic runtime with immutable snapshots, one delegated DOM
  action path, render-token deduplication, and epoch-scoped scene leases. Stale
  publishes, stale actions, duplicate activation, wrong-scene snapshots, and late
  disposal are rejected in tests.
- Menu exposes the product heading, WienerWorks/best-rank summary, and Tutorial,
  Training, Token Log, and Settings buttons. Results exposes the exact outcome,
  summary, visible metric rows, current Copy Summary label, retry, and menu action.
- Canvas and semantic controls now share scene command methods. Menu and results
  navigation guards reset on every Phaser scene reuse; copy remains repeatable.
- The ordinary semantic surface remains clipped and becomes a safe-area-aware
  visible panel on keyboard focus. `semanticUi=visible` is a simulator QA route,
  not a gameplay mode. It produced current native semantic-menu and
  semantic-results screenshots without changing normal canvas captures.
- Regenerated 78 fixtures; 100 test files / 863 tests pass; browser and iOS web
  builds and `git diff --check` pass. All eight settled iPhone 17 routes were
  rebuilt and recaptured, and `npm run mobile:simulator` passes.
- XcodeBuildMCP `snapshot_ui` still reports only the WKWebView scroll container,
  even when normal HTML headings and buttons are visibly rendered. Automated
  VoiceOver target discovery/activation therefore remains unproven and is logged
  as a tooling/manual-device gate rather than being inferred from source.
- Native freshness passes. Browser menu/surface/runtime evidence remains stale
  because the managed browser rejects the localhost target; no parity claim is
  made from those old artifacts.

## Loop 6 Decision

Keep the semantic bridge, but mark the Xcode accessibility-target criterion
unmet. The treatment improves the browser/WKWebView semantic contract without
altering mechanics or normal visuals, and the native QA projection proves the
bundled content. Do not claim VoiceOver support until an actual VoiceOver/manual
device pass or a simulator hierarchy tool exposes WKWebView descendants.

## Loop 7 Selection

Audit reduced-motion truth. Settings currently says `Reduced Motion: System`, but
the runtime does not read `prefers-reduced-motion`. Inventory every tween, falling
token treatment, trail, impact pulse, Wiener movement, and timed transition;
classify essential instructional/state feedback separately from ornamental
motion. Select one game-level policy that follows system changes without altering
round timing, cut detection, scoring, review duration, or scene routing. Do not
remove necessary state transitions or combine this with text scaling/contrast.

## Loop 7 Decision

- Add one game-owned runtime for `prefers-reduced-motion`, stored in the Phaser
  registry beside the semantic runtime. Scenes consume its immutable state;
  neither Settings nor Play owns a second media-query listener.
- Preserve the falling sentence, timer, deadline, cut evidence, review delays,
  Wiener speech duration, scoring, economics, and routing. Sentence position is
  the round clock and therefore essential gameplay motion.
- Under reduction, stop Wiener idle/reaction movement, replace resolved-piece
  falling/rotation with an in-place dissolve, and replace the cut-impact scale
  with an opacity-only response. Keep all static evidence and logical lifetimes.
- Report the effective state as `On (System)`, `Off (System)`, or `Unavailable`.
  Do not persist a second preference or add a global tween-speed multiplier.

## Loop 7 Pass Criteria

- Missing, throwing, modern, and legacy media-query paths are unit-tested;
  duplicate notifications and teardown are deterministic.
- A live system change updates Settings and the active Play scene without
  resetting the sentence clock or any gameplay/session state.
- QA exposes preference support, effective reduction, and the resolved-text
  treatment, while normal-motion output remains unchanged.
- Full fixtures/tests/builds and native screenshot validation pass. Simulator
  enabled-state proof is reported separately and must not be inferred from an
  `Off` screenshot or source tests.

## Loop 7 Rejected Scope

- Freezing or replacing the falling prompt, extending the round, changing review
  timing, or globally accelerating/zeroing Phaser tweens.
- Removing cut markers, trails during the gesture, feedback-card evidence,
  Wiener speech, timer pressure, or other instructional/state feedback.
- Adding a stored override, CSS-only treatment, native bridge, text scaling, or
  contrast changes in the same patch.

## Loop 7 Delivery

- Added `MotionPreferenceSystem`: one immediate/event-driven media-query reader,
  modern and legacy WebKit listeners, truthful unsupported fallback, immutable
  snapshots, deduplicated updates, and idempotent teardown.
- `Game` owns the runtime. Settings subscribes to the shared state and now shows
  the effective system value. Play subscribes and applies the bounded policy to
  Wiener ornament, resolved fragments, and the cut-impact ghost only.
- Reduced-motion state and treatment are present in Settings/Play QA. Source
  integration tests explicitly retain sentence completion, review-delay, and
  speech-duration paths.
- Regenerated 78 fixtures; 102 test files / 872 tests pass. Browser and iOS web
  builds and `git diff --check` pass.
- XcodeBuildMCP rebuilt the iPhone 17 shell. The app reported `Reduced Motion:
  Off (System)` while iOS Settings showed the system switch off, proving the
  normal WKWebView signal path. All eight native routes were recaptured and
  `npm run mobile:simulator` passes.
- XcodeBuildMCP rendered the iOS switch but omitted it from actionable snapshot
  targets; direct `simctl` access is sandboxed. The enabled visual treatment is
  therefore covered by runtime/integration tests but not claimed as simulator-
  proven. Evidence is in `.qa/ios-simulator/loop-7-reduced-motion/`.
- Native freshness passes. Browser menu/surface/runtime evidence remains stale
  and fails closed under the already-recorded localhost capture restrictions.

## Loop 7 Decision

Keep with a qualified native result. The former false Settings claim is now an
actual system-owned policy, the selected high-risk ornament is adapted, and no
mechanic or logical timing changed. Do not claim App Store Reduced Motion support
until the enabled system state is observed in Simulator or on a physical device.

## Loop 8 Selection

Audit haptic capability and consumer-facing Settings truth. The game currently
uses the browser Vibration API while Settings says `Haptics: Native shell
pending`, which is implementation language rather than a useful product state.
Compare removing the placeholder, reporting actual availability, and adding a
small cue-enumerated native bridge. Preserve cue timing, mute behavior, input
gating, and all mechanics. Implement a bridge only if its message surface is
strictly bounded, lifecycle-safe, and testable; Simulator cannot prove physical
haptic output, so that limitation must remain explicit.

## Loop 8 Decision

- Add one fixed-name native message handler for the existing five cue names.
  JavaScript may send only `{ cue, repeats }`; only `cut` may repeat, capped at
  four. Keep every existing Play-scene cue call site and touch-modality gate.
- Use UIKit feedback generators for discrete output. Use Core Haptics only for
  `supportsHaptics` capability truth; do not add a custom pattern engine.
- Require main-frame messages from `tokenizertraining://app`, exact payload keys,
  a cue allow-list, integer repeat bounds, foreground app state, a per-second
  rate limit, and explicit handler removal on web-view dismantle.
- Settings reports `Haptics: Available` or `Haptics: Unavailable` from the actual
  runtime route. Simulator must report unavailable and cannot prove touch output.
- Preserve the current Sound/mute coupling in this loop. Apple accessibility
  guidance makes independence worth a separate experiment, but changing a
  stored preference contract is not part of capability repair.

## Loop 8 Pass Criteria

- No `pending` or implementation-status copy remains in consumer Settings.
- Native hardware capability plus handler presence selects the native route;
  supported browser vibration remains a fail-soft fallback.
- Unknown cues, extra keys, Boolean/fractional/out-of-range repeats, subframes,
  wrong origins, background messages, and excessive message rates fail closed.
- Bridge teardown prevents delayed output after the web view is dismantled.
- Fixtures, cue call sites, mute behavior, input modality, scoring, economics,
  timing, progression, routing, and persistence remain unchanged.
- Full web checks and Xcode build/run pass; Simulator visual evidence explicitly
  distinguishes bridge execution from physical haptic proof.

## Loop 8 Rejected Scope

- Core Haptics patterns, arbitrary vibration arrays, page-defined intensity,
  arbitrary native commands, or an open-ended JavaScript bridge.
- Claiming physical feedback from source, compilation, or Simulator.
- Adding a new stored haptics preference, changing Sound behavior, or retuning
  the five cue call sites in the capability loop.

## Loop 8 Delivery

- `HapticFeedbackSystem` now prefers a hardware-qualified native route, sends
  the fixed cue schema, retains browser vibration fallback, and exposes a typed
  consumer capability label. Cut bursts remain capped at four.
- `WebGameView` injects an immutable hardware capability at document start and
  installs a lifecycle-owned UIKit bridge with origin/frame/schema/rate checks.
  The handler is removed and pending delayed emissions fail closed on teardown.
- Settings and its QA snapshot now show actual availability and route instead of
  `Native shell pending`.
- Regenerated 78 fixtures; 103 test files / 879 tests pass. Browser and iOS web
  builds and `git diff --check` pass. XcodeBuildMCP rebuilt the iPhone 17 app.
- All ten current native routes were recaptured and visually inspected;
  `npm run mobile:simulator` passes. Simulator Settings correctly shows
  `Haptics: Unavailable`. Evidence is in `.qa/ios-simulator/loop-8-haptics/`.
- Native freshness passes. The three browser evidence groups remain stale and
  fail closed under the already-recorded localhost capture restriction.

## Loop 8 Decision

Keep with a qualified native result. Capability reporting is now truthful and
the bridge surface is finite, reversible, and mechanics-preserving. Physical
output and cue feel remain unproven until a supported iPhone device pass.

## Loop 9 Selection

Audit whether haptics should remain coupled to Sound. Compare keeping the current
single mute contract, adding a nonpersistent runtime control, and adding one
versioned local haptics preference with a migration that does not surprise
existing muted players. Define unavailable-device UI, default/migration rules,
accessibility value, and physical-device evidence before implementation. Do not
change audio behavior, cue timing, gameplay mechanics, or storage records in the
audit phase.

## Loop 9 Decision

- Use one versioned, game-owned haptics preference rather than permanent Sound
  coupling or a session-only toggle. This is reversible and retains tactile
  feedback when audio is off.
- On the first capable route, migrate from existing Sound: muted becomes Haptics
  Off; unmuted or absent becomes On. After migration the controls are independent.
- An unavailable route is noninteractive and does not create, change, or erase
  the haptics record. Stored choices remain available for capable hardware.
- Malformed current data derives a safe session value and is repaired only after
  an explicit choice. Unknown future versions are preserved and fail closed.
- Do not retune the five cues or move any call site until a physical-device feel
  pass can compare latency, comfort, and semantic fit.

## Loop 9 Rejected Scope

- Permanent Sound coupling: it removes useful tactile feedback from players who
  intentionally silence audio.
- Runtime-only control: it makes Settings unreliable across sessions and creates
  no migration contract.
- Treating Reduce Motion as a haptics switch, persisting native state separately,
  enabling a control on unavailable hardware, or changing cue intensity/timing.

## Loop 9 Delivery

- Added a strict version-1 storage record and a lazy shared preference runtime.
  Play reads the haptics choice independently; Settings shows On/Off only when a
  route exists and otherwise renders a noninteractive Unavailable control.
- Reusable Phaser scenes now reload Sound from storage on every `create()`,
  removing stale scene-local audio after Settings changes without changing the
  existing Sound button contract.
- Tests cover migration, malformed/future/unavailable storage, session fallback,
  runtime registration, Sound independence, all audio-owning scenes, and Settings
  geometry at 320x568, 368x552, safe-area 390x844, and 1280x720.
- Regenerated 78 fixtures; 105 test files / 911 tests pass. Browser and iOS web
  builds plus `git diff --check` pass. XcodeBuildMCP rebuilt the iPhone 17 shell;
  all ten native routes were recaptured and visually inspected, and
  `npm run mobile:simulator` passes.
- Simulator correctly shows `Haptics: Unavailable`; evidence is under
  `.qa/ios-simulator/loop-9-haptic-preference/`. No physical device is visible,
  so capable-toggle and tactile-output claims remain open.
- The native freshness group passes. Browser capture still fails at Chromium's
  Mach-port bootstrap boundary; old browser artifacts continue to fail closed.

## Loop 9 Decision Status

Keep with qualified evidence. Preference semantics, storage safety, layout, and
native unavailable-state truth pass. Physical cue quality and the four-way
Sound/Haptics matrix are not proven and must not be inferred from Simulator.

## Loop 10 Selection

Re-audit the numerical-tokenization learning treatment. The game now shows real
`cl100k_base` IDs after resolution and full text-to-ID mappings in Token Log, but
source correctness is not the same as player comprehension. Compare no change,
a one-time tutorial explanation anchored to the canonical feedback card, and
post-resolution fragment labels. Keep IDs hidden during prediction and reject
falling labels if an incorrect submitted fragment cannot map truthfully to one
token ID or if the treatment obscures the correction evidence.

## Loop 10 Decision

- Add one concise, immediate explanation to the existing tutorial round-two
  review pause. Use the same line for clean, mixed, and failed submissions so
  numerical-token teaching is not contingent on performance.
- Label the feedback-card mapping `cl100k_base sample ID`; keep Token Log as the
  complete mapping surface. IDs remain encoding-specific lookup keys, not scores.
- Reject IDs on falling fragments. Those pieces follow submitted cuts, including
  false cuts and missed true boundaries, so one piece cannot always map to one
  true token ID.
- Preserve scoring, economy, fixtures, cut detection, timing, progression,
  routing, persistence, animation, and the feedback-card evidence hierarchy.

## Loop 10 Delivery

- `TokenDisplaySystem` now distinguishes sampled review evidence from complete
  Token Log mappings without changing fixture data or tokenization.
- Tutorial round two says: `Every resolved chunk has a cl100k_base ID. Review
  samples one; Token Log maps all. IDs are not scores.` through Wiener speech.
- Tests enforce the 118-character compact line budget, all three result branches,
  one sampled mapping, full Token Log mappings, and absence of IDs from falling
  animation plans and prediction-facing systems.
- Regenerated 78 fixtures; 105 test files / 912 tests pass. Browser build and iOS
  web build pass. The feedback-card layout suite passes all 78 fixtures at
  368x552.
- XcodeBuildMCP rebuilt and launched the production shell. Live native tutorial
  play reached review and displayed `cl100k_base sample ID`; Token Log displayed
  complete mappings at 368x800. Evidence is under
  `.qa/ios-simulator/loop-10-token-ids/`.
- All ten approved native routes were recaptured from the current bundle and
  visually inspected. `mobile:simulator` and the iOS freshness group pass.
- Xcode runtime inspection exposes only the WKWebView scroll container, not
  Phaser's Continue control. The exact round-two speech frame is therefore not
  claimed as simulator-captured; source, branch, and layout tests cover it.
- The in-app browser rejected localhost under its security policy. Existing
  browser screenshot groups remain failed/stale rather than being weakened;
  `mobile:crossref:status` continues to reject their old results and feedback
  contracts.

## Loop 10 Decision Status

Keep with qualified native evidence. The treatment is bounded, truthful, and
anchored to the canonical review moment. It adds the missing numerical mental
model without turning IDs into rewards or obscuring the slicing verb.

## Loop 11 Selection

Define a lightweight comprehension evaluation before adding more teaching UI.
Audit whether the tutorial currently provides a valid observable check for these
three propositions: words can differ from tokens, spaces can belong to a token,
and token IDs are encoding-specific identifiers rather than scores. Compare a
post-tutorial retrieval question, a scored transfer fixture, and a non-code
playtest protocol. Do not change progression or add a mode until the evaluation
can distinguish comprehension from successful imitation.

## Loop 11 Decision

- Use a separate, unscored, post-tutorial comprehension probe rather than an
  in-game quiz, scored transfer fixture, or progression gate.
- Keep the probe sessions distinct from the main tutorial-handoff sessions so
  the research intervention does not contaminate the unprompted handoff result.
- Test three propositions with unseen examples: words can differ from tokens,
  leading spaces can belong to following tokens, and encoding-specific token IDs
  are vocabulary identifiers rather than scores.
- Alternate two tokenizer-verified forms, capture first answers and reasons, and
  treat confidence as diagnostic only. Require a valid reason for every pass.
- Retain the Loop 10 treatment only if at least four of five novices pass every
  individual claim and at least four of five pass all three without coaching.
  Five sessions can guide a bounded iteration; they cannot establish a general
  learning-effect claim.

## Loop 11 Rejected Scope

- An in-game post-tutorial quiz: it would overload the compact handoff, feel like
  a surprise gate, and change the current tutorial/training route.
- A scored transfer fixture: current performance combines conceptual prediction,
  hint exposure, touch accuracy, time pressure, and economy, so it cannot isolate
  numerical-token understanding.
- Treating cut accuracy or confidence as comprehension evidence.

## Loop 11 Delivery

- Added `docs/token_comprehension_probe.md`, linked it from the canonical
  playtest protocol, and added Numerical Token Mental Model as design Gate 8.
- The two forms use real `cl100k_base` and `p50k_base` outputs, protected by a
  `js-tiktoken` test for exact chunks and IDs. Documentation tests protect the
  study boundary, rubric, and four-of-five decision threshold.
- Google Drive review found the existing five-session playtest protocol and no
  completed session notes or rollup. `npm run playtest:status` confirms 0/5
  completed notes, so no participant result was overwritten or inferred.
- Three delegated audits converged on the separate-probe design and rejected an
  embedded quiz. One code audit also found unreachable tutorial speech/timer
  scaffolding, now isolated as Loop 12 rather than mixed into this experiment.
- Regenerated 78 fixtures; 106 test files / 916 tests pass. Browser and iOS web
  builds pass, as does `git diff --check` before this documentation update.
- XcodeBuildMCP rebuilt and launched the production shell on iPhone 17. All ten
  native routes were recaptured from the final bundle; `mobile:simulator` and the
  iOS freshness group pass.
- Three browser screenshot groups remain stale because managed browser capture
  is blocked. `mobile:freshness` continues to fail those groups rather than
  weakening evidence requirements. `playtest:audit:local` confirms the local
  package is ready, not that participants have completed it.

## Loop 11 Decision Status

Keep the evaluation protocol. The Loop 10 teaching treatment remains provisional
until five dedicated novice sessions meet the declared thresholds. No educational
gain is claimed from source, layout, tokenizer, or simulator evidence alone.

## Loop 12 Selection

Audit and remove or isolate dead tutorial speech scaffolding. Prove the call graph
before editing; preserve the live `activePromptFor()` and `reviewSpeechFor()`
paths, current Wiener speech, all round timing, hints, scoring, input, progression,
and QA behavior. Investigate unused timer fields, unscheduled speech-window
methods, verbose explanation methods, `tutorialIntroPrompt()`,
`reviewSpeechWindowMs()`, and `resolveLineFor()`. Retain unique educational copy
in documentation if it is valuable, but do not keep unreachable runtime APIs or
tests that imply those paths are live.

## Loop 12 Decision

- Three independent code, UX, and teaching-contract audits agreed that production
  tutorial speech uses only the round fixture, `activePromptFor()`,
  `reviewSpeechFor()`, hint flags, round duration, count, and completion.
- Removed unreachable staged explanation, speech-window, resolve-line, completion,
  compact-title, and instruction-window APIs. `TutorialSystem.ts` fell from 727
  to 195 lines while preserving fixture order, active/review copy, hint flags,
  32-second duration, progression, and the round-two numerical explanation.
- Removed seven never-assigned tutorial timer fields and their no-op cleanup calls,
  plus the dead `tutorialIntroPrompt()` wrapper, from `PlayScene`.
- Distilled the useful teaching concepts into `docs/copy_deck.md`; they are now
  explicit content requirements rather than tests for nonexistent runtime paths.
- Regenerated all 78 fixtures; 106 test files / 910 tests pass. Browser and iOS
  web builds, local playtest audit, simulator evaluator, and native freshness pass.
- XcodeBuildMCP rebuilt and launched the production shell. A clean active tutorial
  frame and a natural-timeout review frame were captured, then all ten approved
  native routes were recaptured and visually inspected from the final bundle.
- Three browser screenshot groups remain stale and failed. Their validators were
  not weakened, and no participant comprehension result is inferred.

## Loop 12 Decision Status

Keep. The deletion makes tests describe the production tutorial contract and did
not alter visible speech, timing, mechanics, progression, persistence, or evidence
surfaces.

## Loop 13 Selection

Audit the remaining legacy Wiener speech renderer scaffolding before editing.
Prove whether the `showToast` option and false branch, `wienerSpeechLabel` scene
object, and `computeWienerSpeechLayout()` geometry are unreachable or test-only.
Preserve `computePetSpeechLayout()`, the visible speech panel/chrome/text, sticky
and timer behavior, review layout, QA fields, all visible copy, and every mechanic.
Require independent call-graph, QA/accessibility, and visual-contract audits before
selecting a deletion boundary.

## Loop 13 Decision

- Three independent call-graph, QA/accessibility, and visual audits agreed that
  `wienerSpeechLabel`, the `showToast` option/false branch, and
  `computeWienerSpeechLayout()` were unreachable or test-only.
- Removed those surfaces and the unused `WienerSpeechLayout.label` data. Migrated
  compact copy-capacity coverage to the live `computePetSpeechLayout()` path.
- Preserved the panel, chrome/tail, text, `setWienerSpeech()`, timer/sticky state,
  hide-before-review sequence, review derivation, QA `petSpeechBubble`, all copy,
  and every gameplay mechanic.
- Focused speech/lifecycle/QA/responsive/mobile suites pass 169 tests. Full gates
  pass with 78 fixtures and 106 files / 907 tests; browser and iOS web builds,
  local playtest audit, simulator evaluator, native freshness, and diff check pass.
- XcodeBuildMCP rebuilt the iPhone 17 shell. Fresh natural active and review
  frames preserve one pet-attached bubble with no label; all ten approved native
  routes were recaptured and visually inspected from the final bundle.
- Managed Chromium failed at process launch with a macOS permission denial, and
  the in-app browser policy rejected the local target. The three browser evidence
  groups remain stale/failed; no validator or artifact timestamp was weakened.
- This cleanup does not improve or claim accessibility. PlayScene canvas speech
  remains outside the current partial semantic menu/results treatment.

## Loop 13 Decision Status

Keep. The change removes a false renderer contract while preserving the visible
speech behavior and its QA surface.

## Loop 14 Selection

Audit a pre-existing compact active-state collision: stale-but-structured
`368x552` QA evidence places the timer track at `y=178`, height `8`, and the pet
speech panel at `y=157`, height `58`, causing a vertical overlap. Reproduce this
from current geometry before editing. Compare moving the speech band, moving the
timer rail, or reserving an explicit clearance in `computePetSpeechLayout()`.
Preserve text/pet/feedback/control clearances, the 44px control floor, timer
semantics, speech copy, and all mechanics. Require small-phone, standard-phone,
large-phone, short-landscape, tablet, and desktop geometry coverage.

## Loop 14 Decision

- Current production geometry reproduced the reported collision at both
  `320x568` and `368x552`: the active speech panel and timer track overlapped by
  8px vertically.
- Compared three treatments. Moving the timer would disturb the established
  time/progress hierarchy; globally moving speech would change already-clear
  profiles; active-only obstacle clearance in `computePetSpeechLayout()` was the
  narrow rule that matched the actual fault.
- Added an optional active timer rectangle and an 8px minimum clearance. The
  Play scene supplies the rendered timer bounds only while active, so review
  speech remains unchanged.
- Added geometry coverage for `320x568`, `368x552`, standard mobile, short
  landscape, tablet, desktop, and wide desktop, plus a runtime-source contract
  and stale-evidence rejection.
- Two delegated audits independently selected the same boundary and warned that
  review state must be keyed from `resolving`, not tutorial mode. A third audit
  did not return and is not counted as supporting evidence.
- Regenerated 78 fixtures; 106 test files / 917 tests pass. Browser and iOS web
  builds, local playtest audit, simulator evaluator, native freshness, and diff
  check pass.
- XcodeBuildMCP rebuilt the iPhone 17 shell. Fresh natural active/review frames
  are under `.qa/ios-simulator/loop-14-speech-clearance/`; all ten approved
  native routes were recaptured and visually inspected. No iPhone SE-class
  simulator is installed, so smaller profiles are geometry-tested rather than
  claimed as native captures.
- Three browser screenshot groups remain stale because both managed Chromium
  launch and in-app localhost navigation are blocked. Their gates remain failed.

## Loop 14 Decision Status

Keep. The correction resolves a supported compact-profile collision without
changing speech copy, timer behavior, review geometry, input, scoring, economy,
progression, persistence, or routing.

## Loop 15 Selection

Audit current verification and design documentation for obsolete runtime claims
that survived the mobile redesign, especially references to detached tutorial
popups/toasts, token strips, robot/overseer surfaces, old public naming, stale
results metrics, and removed five-round behavior. Separate historical evidence
from current contract instead of deleting provenance. Make no runtime change.
Require source-to-doc checks and documentation tests so future agents receive a
truthful current surface boundary.

## Loop 15 Decision

- Three independent audits found that the June design matrix, Phase 2 audit,
  dated browser QA, and several active concept documents could make retired
  robot, popup, overseer, token-strip, and ledger surfaces look current.
- Preserved every dated observation, but added a 2026-07-18 current snapshot and
  historical provenance boundaries. The current contract now names the one
  shared Phaser/iOS runtime, compact mobile HUD, Wiener speech, canonical
  feedback card, four-metric budget result, and partial semantic counterpart.
- Current surface evidence rejects seven retired QA IDs. Runtime sidecars reject
  the same IDs and require Wiener speech on tutorial/endless review states.
- Local readiness no longer treats June PNGs as current prerequisites; it keeps
  those files as history and requires the live contracts, manifests, templates,
  and evaluators instead.
- Documentation tests enforce the current/historical boundary without globally
  banning valid historical terms. Focused verification passed 76 checks.
- Regenerated 78 fixtures; 106 test files / 941 tests pass. Browser and iOS web
  builds, local playtest audit, simulator evaluator, and diff check pass.
- XcodeBuildMCP rebuilt and launched the production shell on iPhone 17. All ten
  native routes were recaptured and visually inspected under
  `.qa/ios-simulator/loop-15-verification-truth/`; native freshness passes.
- Three browser evidence groups remain stale and failed. Their evaluators also
  reject obsolete results and review evidence; no timestamp or requirement was
  weakened. No participant, physical-touch, or comprehension result is claimed.

## Loop 15 Decision Status

Keep. Current implementation guidance and executable QA now fail closed against
retired surfaces while the dated record remains intact as provenance. No runtime,
mechanic, fixture, scoring, timing, progression, persistence, or route changed.

## Loop 16 Selection

Audit evidence identity and progression language that can still misstate the
product: legacy public names accepted by playtest evaluators without an explicit
historical mode, the phrase `Endless five-round run` implying a five-round game
mode rather than a bounded observation sample, and hard-coded test/status counts
in `docs/mobile_optimization_report.md`. Preserve old evidence, but require an
explicit historical scope where legacy names are valid and derive or remove
volatile status claims. Make no gameplay change.

## Loop 16 Decision

- Current playtest notes, copied summaries, and rollups now require canonical
  `Tokenizer Training` headings and `tt-*` run IDs. Legacy identity remains
  available only in dated historical records, not current operational evidence.
- Renamed the physical QA row to `Endless observation sample covers at least
  five rounds`. Added a direct session-flow test proving that completion of
  Endless round five advances to another round while funds remain.
- Recast `docs/mobile_optimization_report.md` as an historical implementation
  record with explicit live authorities. Removed hard-coded test counts,
  mutable pass claims, and temporary machine paths; completion validation now
  rejects those volatile claims.
- Current playtest readiness correctly remains 0/5, and physical-device
  validation remains failed for missing phone evidence. No result was inferred.
- Regenerated 78 fixtures; 106 test files / 960 tests pass. Browser and iOS web
  builds, local playtest audit, simulator evaluator, and diff check pass.
- XcodeBuildMCP rebuilt and launched the production shell on iPhone 17. All ten
  routes were recaptured and visually inspected under
  `.qa/ios-simulator/loop-16-evidence-identity/`; native freshness passes.
- Three browser evidence groups remain stale and failed because neither local
  browser capture path is available. Their requirements and timestamps remain
  unchanged.

## Loop 16 Decision Status

Keep. Operational evidence can no longer present the old product name, a
five-round sample as a game mode, or volatile report prose as current proof. No
runtime, mechanic, fixture, score, timing, progression, persistence, or route
changed.

## Loop 17 Selection

Audit the physical-device evidence contract against the current mobile UI.
Replace stale requirements that expect `Best Record`, `Begin Tutorial`,
`Endless Training`, or a main-menu Sound control with current `Best Rank`,
`Tutorial`, `Training`, `Token Log`, and `Settings` evidence. Sound persistence
must be demonstrated in Settings after relaunch, not invented on the menu.
Preserve stable artifact filenames where they remain useful, and make no runtime
or gameplay change.

## Loop 17 Decision

- Three read-only audits agreed that Menu, Settings, routing, storage, and
  persistence behavior already match the current UI; only the physical-evidence
  contract was stale. No runtime change was made.
- Updated the operator checklist, evidence manifest, and completed-file template
  to require visible `Best Rank`, `Tutorial`, `Training`, `Token Log`, and
  `Settings`; five rounds is an observation sample inside uncapped Training.
- Split one-handed reach into Play controls and Results controls. Best Rank must
  be observed on the default menu after a full relaunch. `Sound: Off` must be set
  before termination and observed again inside Settings after full relaunch.
- Preserved stable artifact filenames, including internal `endless` and
  `best-record` terms, so evidence continuity does not masquerade as UI copy.
- The validator now rejects retired menu evidence even when files exist, but
  allows the still-current tutorial handoff `Start Endless Training` outside
  menu evidence. It requires round-six continuation with funds remaining and
  names the controls each reach record must cover.
- Focused integration passed 4 files / 40 tests. Full gates pass with 78
  regenerated fixtures and 106 files / 969 tests; browser and iOS web builds,
  local audit, simulator evaluator, and diff check pass.
- XcodeBuildMCP rebuilt and launched the iPhone 17 shell. All ten routes were
  recaptured and visually inspected under
  `.qa/ios-simulator/loop-17-physical-contract/`; native freshness passes.
- The device probe found no physical iPhone/iPad. `mobile:validate` therefore
  remains failed on actual missing phone evidence, and no touch, audio, haptic,
  VoiceOver, or persistence outcome is inferred from Simulator.

## Loop 17 Decision Status

Keep. Physical validation now asks for current, semantically meaningful proof
without changing the game or pretending that absent hardware evidence passed.

## Loop 18 Selection

Recover the three stale browser evidence groups through the available Chrome
control path. Audit each required route, viewport, screenshot, and QA sidecar
before capture. Recapture from the current local server, run surface/runtime and
freshness validators, and compare against the current native shell. Do not copy
old artifacts, touch timestamps manually, or weaken requirements. If Chrome
control cannot attach, record the exact capability boundary and define the
smallest deterministic capture fallback without changing game mechanics.

## Loop 18 Decision

- Chrome extension control attached, but its security policy explicitly rejected
  navigation to the local `127.0.0.1` game and prohibited alternate local URLs,
  file URLs, raw CDP, or another browser as workarounds. No bypass was attempted.
- Three audits traced the canonical browser contract to
  `scripts/capture-mobile-cross-reference.ts`: five menu artifacts, twelve
  active/results surface artifacts, and fifteen interaction-derived runtime
  artifacts. The 32-file inventory remains stale rather than being copied or
  timestamped.
- Reconciled `docs/mobile_shell.md` with the capture authority: tall mobile menu,
  `qaCanvasCapture=1` on active routes, the held-review interaction route,
  `protocol-results`, current menu labels, exact filenames, and controlled-browser
  limitations are now executable documentation.
- Surface validation now rejects placeholder, wrong-dimension, undersized, and
  blank-looking screenshot files. Runtime freshness now includes the five QA JSON
  sidecars paired with runtime screenshots instead of checking images/results only.
- Full verification exposed a load-dependent test flaw: four unsafe-fixture calls
  rebuilt `cl100k_base` independently inside a five-second test. The test modules
  now reuse one real tokenizer adapter/encoding; assertions, fixture generation,
  and production defaults are unchanged.
- Regenerated 78 fixtures; 106 test files / 975 tests pass. Browser and iOS web
  builds and the local playtest package audit pass. Surface/runtime evaluators
  still reject the July 2 browser evidence for current speech/timer, results,
  Money, and boundary-audit mismatches.
- XcodeBuildMCP rebuilt the current shell and all ten approved iPhone 17 routes
  were recaptured and visually inspected under
  `.qa/ios-simulator/loop-18-browser-evidence-contract/`. Three premature grey
  frames were rejected and recaptured after WKWebView paint. Simulator evaluation
  and native freshness pass; the three browser groups remain failed.

## Loop 18 Decision Status

Keep. Browser evidence now has a precise, fail-closed recovery contract and
cannot pass with placeholder images or stale runtime sidecars. No gameplay,
scoring, economy, input, progression, storage, or route behavior changed.

## Loop 19 Selection

Audit player-facing mode language after the approved menu simplification. The
menu says `Training`, Results says `Run Training Again`, while the tutorial
handoff still says `Start Endless Training` and current playtest materials use
both public terms. Determine whether `Endless` communicates useful uncapped-run
behavior or only exposes an internal mode name. Reconcile current runtime copy,
semantic/QA labels, and operational evidence around one public vocabulary while
preserving the internal `endless` route, uncapped progression, and all mechanics.

## Loop 19 Decision

- Three independent repository/history audits agreed that `Endless` exposes an
  internal implementation term rather than a distinct player choice. Menu,
  tutorial handoff, and Results all enter the same uncapped Training flow.
- Current project briefs describe Training as continuing until balance reaches
  zero. An older design spec used `Endless Training`, but its own termination
  rule was still zero balance; no fixed-round or truly endless mechanic exists.
- Apple, Microsoft, Xbox, and WCAG guidance converges on familiar,
  action-oriented, consistently identified labels across a multistep flow.
- Standardized current visible copy as `Training`, `Start Training`, and `Run
  Training Again`. Kept lowercase internal `endless`, `mode=endless`, QA IDs,
  artifact names, and dated evidence unchanged.
- Updated current contracts, playtest materials, evaluators, physical-device
  evidence rules, and tests. An adversarial review then found that negated or
  wrong-surface wording could satisfy two lexical validators. Corrected both:
  handoff evidence now requires affirmative action on the tutorial-complete
  surface, and physical evidence distinguishes visible labels from explicit
  absence. Retired wording alone cannot satisfy current evidence.
- Removed dormant player-style `Endless mode/training` prose from current Wiener
  speech data and README while preserving all keys and historical records.
- Regenerated 78 fixtures; focused integration passes 13 files / 178 tests; the
  full suite passes 106 files / 1,014 tests. Browser and iOS web builds and the
  local playtest package audit pass.
- XcodeBuildMCP rebuilt and launched the iPhone 17 shell. All ten routes were
  recaptured and visually inspected under
  `.qa/ios-simulator/loop-19-training-vocabulary/`; Tutorial Cleared visibly
  shows `Start Training`, Results shows `Run Training Again`, and native
  simulator/freshness validation passes.
- Human sessions remain 0/5 and physical-device evidence is absent. The three
  browser groups remain stale and failed; no external result is inferred.

## Loop 19 Decision Status

Keep. The change removes avoidable public vocabulary drift without changing
fixtures, input, scoring, economy, timing, progression, persistence, routing, or
the internal mode identifier. `?mode=training` remains a legacy tutorial alias;
changing that deep-link behavior requires a separate compatibility decision.

## Loop 20 Selection

Audit the tutorial failure/retry surface as an educational and consumer
onboarding boundary. Compare the current `Tutorial Failed` blame-heavy copy with
the existing `Readiness Not Met` alternative and at least one restrained
WienerWorks-compatible treatment. Preserve the ten-round threshold, retry and
menu actions, progression, economics, and hostile bureaucratic tone. Determine
whether copy can make the next action and recoverable skill gap clearer without
becoming cute, motivational, or generic SaaS. Require compact-phone fit,
semantic/QA parity, and a falsifiable later participant criterion before any
runtime change.

## Loop 20 Decision

- Learning-science evidence supports criterion-, task-, and process-level
  feedback with a specific next action; it does not establish that the word
  `Failed` alone reduces retry. Kept the task-level title and both existing
  actions rather than softening the whole WienerWorks voice.
- Repository and Drive history confirm that failure is recoverable: the 70%
  threshold uses the same cut-audit score, Retry immediately restarts Tutorial,
  and Training is not locked. The old summary was generic and occupied six
  centered lines without exposing score, criterion, or correction.
- Replaced only the failed summary with a bounded diagnostic: floored boundary
  accuracy, the 70% requirement, missed-boundary/false-cut focus, direct retry
  instruction, and `Payroll remains unconvinced.` Missing audit data falls back
  to reviewing boundary evidence.
- A failing value can never display as 70%. Missed-dominant, false-dominant,
  tied, missing-audit, and 69.9%-edge paths are covered. Title, chrome, actions,
  threshold, scoring formula, routing, and layout are unchanged.
- Regenerated 78 fixtures; compact-focused verification passes 4 files / 49
  tests; the full suite passes 106 files / 1,017 tests. Browser and iOS web
  builds, local package audit, and diff check pass.
- XcodeBuildMCP rebuilt the iPhone 17 shell. Ten final routes are archived under
  `.qa/ios-simulator/loop-20-tutorial-failure-diagnostic/`; the failure summary
  renders in five clear lines with both actions unobstructed. Simulator and
  native freshness pass.
- Browser evidence remains stale and physical/human evidence remains absent. No
  retention, motivation, or learning-effect claim is inferred.

## Loop 20 Decision Status

Keep as a reversible instructional copy treatment. Later participant evidence
must show at least 4/5 identify the readiness gap and select Retry Tutorial
without prompting, with 0/5 interpreting the screen as a permanent lockout.

## Loop 21 Selection

Audit tutorial-outcome accessibility and QA geometry truth. Menu and Results
have a shared semantic counterpart, but Tutorial Cleared/Failed remain
canvas-only despite containing critical educational text and route actions.
Their QA summary rectangle also assumes a fixed `3.6 * fontSize` rather than the
rendered line count. Determine the smallest existing-pattern extension that can
expose exact outcome text and both commands to the semantic runtime and make QA
bounds content-aware, without claiming the slicing loop is keyboard/VoiceOver
operable or changing tutorial mechanics, copy, routing, layout, or visuals.

## Loop 21 Decision

- Standards, repository, and Drive audits converged on one bounded extension:
  mirror Tutorial Cleared/Failed through the existing game-level semantic
  runtime. Full canvas reconstruction and whole-app accessibility claims remain
  rejected.
- Added one pure projection from the canonical tutorial copy object. It exposes
  the exact heading, full summary, and primary/menu actions in visual order with
  one polite outcome announcement; it adds no second copy or route authority.
- Canvas and semantic actions now share guarded scene commands. The guard resets
  on scene reuse, rejects cross-channel double navigation, and preserves failed
  retry, passed Training handoff, and menu payloads exactly.
- Replaced the fixed summary QA rectangle with actual Phaser `Text.getBounds()`
  geometry converted through a tested center-coordinate helper. Added 320x568,
  safe-area 368x800, and 1280x720 QA routes and containment tests.
- Native visual review exposed an empty bordered semantic details block whose
  `display: grid` overrode `hidden`; an explicit hidden-state rule removed it.
- Adversarial review found a shared deferred-capture race. QA canvas capture now
  verifies that its source snapshot is still current, so a shutdown scene cannot
  relabel replacement-scene pixels. It also prompted title/summary separation,
  bounds-conversion, and shutdown-callback tests.
- Regenerated 78 fixtures; focused integration passes 5 files / 33 tests; the
  full suite passes 107 files / 1,028 tests. Browser and iOS web builds, local
  package audit, and diff check pass.
- XcodeBuildMCP rebuilt/launched the iPhone 17 shell. Eight required routes plus
  semantic menu, Results, Tutorial Cleared, and Tutorial Failed were recaptured
  and inspected under `.qa/ios-simulator/loop-21-tutorial-outcome-semantics/`.
  Simulator evaluation and the native freshness group pass.
- Three browser evidence groups remain stale and failed. VoiceOver discovery and
  activation, Larger Text, physical touch/audio/haptics, and the slicing task
  remain unproven; no WCAG or whole-app accessibility claim is made.

## Loop 21 Decision Status

Keep as limited screen-level support and more truthful QA. No tokenizer,
prediction input, scoring, economy, timing, progression, persistence, layout,
visible copy, or route behavior changed.

## Loop 22 Selection

Audit the semantic journey from Menu into Token Log and Settings. Both menu
destinations currently become canvas-only, so keyboard or assistive-technology
users cannot complete those non-gameplay tasks. Compare a read-only Token Log
counterpart with the more complex Settings control surface. Prefer Token Log
first if it can expose recent/reference text-to-ID mappings and Back through the
existing runtime without duplicating storage, fixture, or copy authority. Keep
the slicing loop explicitly out of scope and preserve all visible UI and
mechanics.

## Loop 22 Decision

- Token Log was selected over Settings because it is deterministic, read-only,
  educationally aligned, and already has one canonical fixture/storage path.
  Settings reset currently reports success even when storage deletion fails.
- Added a structured semantic Token Log with sentence provenance, ordered raw
  token-text-to-`cl100k_base` ID pairs, explicit Unicode whitespace descriptions,
  and no live announcement. Numeric IDs remain absent during prediction and
  falling player-cut fragments.
- Semantic entry/return now transfers focus between the Menu launcher and Token
  Log heading/Back task. Canvas and semantic navigation share guarded commands.
- An adversarial review forced corrections to Unicode coverage, native route
  evidence, duplicate-image rejection, and evidence wording. The native gate
  requires thirteen distinct route frames but still relies on visual inspection
  for content.
- Regenerated 78 fixtures; the final suite passes 109 files / 1,045 tests. Both
  builds and local audit pass. Fourteen visually inspected iPhone 17 frames are
  archived under `.qa/ios-simulator/loop-22-structured-token-log/`; simulator
  and native freshness gates pass.
- Three browser groups, 320px live reflow, 200% text resize, VoiceOver activation,
  physical-device behavior, and the 4/5 participant reference-use criterion
  remain open. No broad accessibility or learning claim is made.

## Loop 22 Decision Status

Keep with bounded claims. No fixture, prediction, slicing, scoring, economy,
rank, progression, persistence, visual canvas layout, or gameplay route changed.

## Loop 23 Selection

Audit the Settings reset path before exposing mutable Settings controls through
the semantic runtime. Determine a truthful storage-result contract and one
shared confirmation/recovery flow for pointer and future semantic activation.
Preserve recent Token Log history, Sound, reduced-motion reporting, Haptics
preference/capability truth, best-rank thresholds, and all gameplay mechanics.

## Loop 23 Decision

- Selected confirmation over Undo for this rare, irreversible local-record
  action. First activation only opens `Reset Best Rank?`; Cancel is neutral and
  precedes the destructive Reset Rank action.
- Replaced the void, error-swallowing clear operation with a readback-verified
  result across the canonical and every legacy key. Partial deletion and
  unavailable readback can no longer be displayed as a successful zero rank.
- Added one reset state machine shared by the current pointer scene and a future
  semantic Settings projection. The scene no longer owns deletion semantics.
- Preserved recent Token Log, Sound, motion reporting, Haptics, rank thresholds,
  scoring, progression, and gameplay. Added no Undo cache or persistence schema.
- Added contained confirmation geometry and QA phase/outcome state. A direct
  native route proves layout but explicitly does not prove pointer activation.
- Adversarial review found that release-only pointer activation could confirm a
  reset, a partial fallback clear could hide a surviving legacy rank on reload,
  and the simulator manifest accepted contradictory reset proof claims. A
  same-pointer press/release guard, valid-record fallback migration, and explicit
  false gates correct all three.
- Final verification passes 112 files / 1,077 tests, both builds, local audit,
  and diff check. XcodeBuildMCP rebuilt the iPhone 17 shell; fourteen fresh route
  frames under `.qa/ios-simulator/loop-23-truthful-best-rank-reset-v2/` were
  inspected and the 15-file simulator gate and native freshness group pass.
- Physical touch, pointer Cancel/Confirm, storage-failure rendering, semantic
  Settings, VoiceOver, 200% text, and participant criteria remain open. Three
  browser evidence groups remain stale.

## Loop 23 Decision Status

Keep with bounded claims. The reset is now deliberate and truthful without any
mechanic, economy, rank-threshold, progression, or gameplay change.

## Loop 24 Selection

Audit and implement a complete semantic Settings task using the existing shared
runtime and the new reset command model. It must expose Sound, effective
reduced-motion status, capability-aware Haptics, Reset Best Rank confirmation
and outcome, and Back from one canonical authority. Require modal focus
containment, Escape/Cancel, return focus, pointer/semantic double-activation
guards, native rendering, and explicit partial-accessibility language. Preserve
all gameplay mechanics and keep the slicing loop canvas-only.

## Loop 24 Research Synthesis

- Repository, primary standards, and Drive history agree that Settings must be
  a projection over existing authorities, not a second preference model.
  Sound remains AudioSystem plus stored mute state; reduced motion remains
  read-only system state; Haptics remains the shared capability-aware runtime;
  reset remains BestRankResetSystem plus verified StorageSystem deletion.
- Sound and available Haptics require stable accessible names and native switch
  state. Unavailable Haptics is static status, not a dead fabricated switch.
  Ordinary switch changes do not need duplicate live announcements.
- Reset requires an alert dialog with labelled title/message, inert background,
  Cancel-first focus, Tab containment, Escape through the same Cancel command,
  and focus return to Reset Best Rank. Semantic structure does not prove
  VoiceOver behavior in WKWebView.
- Commands must be target setters rather than inversion operations, and Back
  must be one-shot. This makes pointer/semantic overlap idempotent while the
  semantic render-token guard rejects stale controls.
- Connected Drive confirms these component authorities and mobile contracts are
  approved, but semantic Settings, VoiceOver activation, physical haptics,
  reduced-motion observation, and participant comprehension remain unresolved.

## Loop 24 Implementation Boundary

Extend the shared semantic type/DOM model with typed switches, static status,
and one alert-dialog descriptor; add a pure Settings projection; route canvas
and semantic controls through shared scene commands; preserve visual Settings
layout and every gameplay mechanic. Structural DOM/keyboard and simulator
evidence support only a bounded semantic-Settings claim.

## Loop 24 Implementation And Evidence

- Extended the shared semantic model with typed switch/status controls and one
  alert-dialog descriptor. The DOM surface renders native checkboxes with
  stable names, marks underlying content inert during reset, contains Tab and
  Shift+Tab, routes Escape through Cancel, and preserves/returns focus without
  stealing focus from pointer-only canvas use.
- Added a pure Settings projection over canonical AudioSystem, system motion,
  shared Haptics, BestRankResetSystem, and StorageSystem state. Simulator
  Haptics remains a static unavailable status rather than a dead switch.
- Settings and Menu now mount/dispose epoch-scoped leases. Canvas and semantic
  actions share explicit-target Sound/Haptics commands, reset commands, and a
  one-shot Back route; semantic entry/return restores the expected focus.
- Added structural/unit/source coverage for immutable snapshots, switches,
  dialog action restriction, announcement dedupe, focus cycling, Escape,
  inert background content, canonical runtime ownership, and scene routing.
- Rebuilt the iOS web bundle and shell with XcodeBuildMCP. Sixteen final iPhone
  17 frames under `.qa/ios-simulator/loop-24-semantic-settings-v3/` were
  captured from the post-integration bundle and inspected. The 17-file native
  gate and native freshness group pass.
- Evidence is bounded: semantic Settings projection/rendering is observed;
  keyboard activation, VoiceOver activation, physical touch/haptics,
  storage-failure rendering, 200% text, and participant outcomes remain open.
  Three historical browser evidence groups remain stale.

## Loop 24 Adversarial Correction

- Semantic-origin reset now publishes a true modal, focuses Cancel, and makes
  both semantic background content and sibling canvas content inert. A
  pointer-origin canvas confirmation remains nonmodal in the hidden semantic
  mirror, avoiding both focus theft and a false `aria-modal` claim.
- DOM switch change events now carry their requested checked state through the
  render-token guard. Settings converts Sound checked state to the matching mute
  target and passes Haptics checked state directly; it no longer infers either
  request by inverting current state.
- Menu buttons now require the same pointer to press and release. Reset outcomes
  are queued once by the scene, so a later system motion change can announce
  rather than being permanently masked by old reset state.
- The simulator gate requires an explicit false automatic-content-proof field;
  image dimensions, variation, and uniqueness cannot self-attest visible copy.
  Audio, haptic capability, and rank sources now invalidate native freshness.
- The reviewer rechecked all six findings and found no remaining actionable code
  issue. The corrected bundle was rebuilt and all sixteen routes were recaptured
  in the v3 evidence directory.

## Loop 24 Decision Status

Keep with bounded claims. Final validation passes fixture regeneration, 115
files / 1,115 tests, TypeScript, browser and iOS production builds, the local
playtest audit, and diff check. The final iOS assets match a clean post-fixture
build byte for byte; XcodeBuildMCP launched them before the sixteen-frame v3
capture. The 17-file simulator gate and native freshness pass. Three browser
evidence groups remain stale, and keyboard, VoiceOver, physical-device, 200%
text, storage-failure, and participant claims remain open.

## Loop 25 Selection

Audit non-play canvas controls for trustworthy pointer activation. Results,
Tutorial Complete, and Token Log currently trigger actions on release without
proving that the same pointer pressed that control, unlike Menu and Settings.
Research the platform pointer-cancellation contract, then apply the existing
guard only where needed. Preserve button order, immediate visual feedback,
semantic navigation, every layout, and all gameplay mechanics.

## Loop 25 Research Synthesis And Boundary

- W3C requires release/cancellation behavior for ordinary pointer controls; its
  informative guidance describes release inside the initial target and moving
  away to abort. Same-pointer gesture matching is the project's implementation,
  not extra normative WCAG language.
- Phaser 3.90 dispatches a Game Object `pointerup` from the release-time hit test
  and exposes canvas-outside release on the Scene Input Plugin. Touch cancel also
  passes through up processing. The previous release-only scenes and Game Object
  `pointerupoutside` listeners were therefore not trustworthy.
- Use one tested binding with a separate first-pointer guard per control. It owns
  visual feedback, gesture identity, canceled-touch rejection, scene-level
  terminal cleanup, and rerender listener disposal. Five scenes supply existing
  visuals and commands; semantic actions bypass pointer ownership and keep their
  canonical routes.
- Exclude PlayScene controls because their event flow is coupled to slicing.
  Preserve all mechanics, layouts, labels, persistence, and progression. The
  claim remains source/Simulator bounded until physical touch is observed.

## Loop 25 Implementation And Decision

- `PointerActivationGuard` and `CanvasButtonActivationSystem` now provide one
  per-control owner/gesture contract across Menu, Settings, Results, Tutorial
  Complete/Failed, and Token Log. They reject release-without-press, canceled
  touch, stale gestures, secondary fingers, and non-primary mouse buttons, and
  cancel on pointer/canvas exit with deterministic listener cleanup.
- Results Copy Summary uses a tested lifecycle/operation gate so a clipboard
  completion from an old scene cannot mutate a recreated scene or clear its
  newer operation. Semantic actions keep their canonical command paths.
- Adversarial review is clean after five corrections. Final validation passes
  78 fixtures, 117 files / 1,139 tests, TypeScript, browser and iOS builds, local
  audit, and diff check. XcodeBuildMCP launched the final bundle before the
  sixteen-frame `loop-25-pointer-activation-v3` capture; the 17-file simulator
  gate and native freshness pass.
- Keep with bounded claims. Three browser evidence groups remain stale. No
  physical touch, WCAG-conformance, or PlayScene-control claim is made.

## Loop 26 Selection

Audit the four PlayScene bottom controls without applying the non-play binder by
assumption. Map Phaser event order, slicing-stream exclusion, pointer ownership,
touch cancellation, and multi-pointer behavior for Sound, Clear, Exit, and
Resolve. Preserve swipe/cut thresholds, staged cuts, scoring, tutorial/endless
flow, and every command result until a tested platform-input boundary is defined.

## Loop 26 Research Synthesis And Boundary

- Phaser resolves GameObject release by the object under the pointer, routes
  touch cancel through the up pipeline, and dispatches button events before Scene
  events. The present release-only controls can therefore act after a slice or a
  different control press; stopping propagation would also suppress slice cleanup.
- PlayScene has one cut session, last point, gesture set, and metric accumulator
  but configures three touch pointers. Any pointer can currently sample or end
  that shared state, while control taps also enter the sampler.
- Add one PlayScene-specific router with exactly one owner (`pointer.id` plus
  `downTime`) whose origin is slice or a named control. Control-origin gestures
  never slice; slice-origin gestures never command; secondary and canceled
  pointers never mutate the owner.
- Keep the non-play binder separate. Preserve all existing command methods,
  release sampling for valid slices, cut thresholds, tutorial dwell, geometry,
  labels, QA IDs, keyboard routes, mechanics, economy, and progression. Treat the
  desktop control-order discrepancy as a later layout-only audit.

## Loop 26 Implementation And Decision

- A single PlayScene router now owns each gesture as either slicing or one of
  Sound, Clear, Exit, and Resolve. Controls require matching press/release;
  control-origin input never samples cuts, and slice-origin input never commands.
- Adversarial review exposed four lifecycle defects: canvas re-entry reacquisition,
  Clear/release re-staging, stale cut-session reuse, and secondary-pointer modality
  mutation. All four were reproduced, corrected, and passed on exact re-review.
- Final validation passes 78 fixtures, TypeScript, 120 files / 1,163 tests,
  browser and iOS builds, local audit, and diff check. XcodeBuildMCP launched the
  corrected bundle before the sixteen-route
  `loop-26-play-input-routing` capture; the native gate and native freshness pass.
- Keep with bounded claims. Three browser evidence groups remain stale. Physical
  touch, WebKit gesture quality, audio/haptic output, VoiceOver, and WCAG
  conformance remain unproven. Mechanics and visible geometry are unchanged.

## Delegation Policy

- Keep the strongest model as orchestrator for research synthesis, mechanic
  decisions, architecture, adversarial acceptance, and final integration.
- Use faster models for bounded deterministic work: source inventories, test
  matrices, evidence manifests, provenance audits, and disjoint low-risk patches.
- Every subagent gets this brief plus one narrow assignment. No patch or claim is
  accepted until the orchestrator reviews the diff, reruns relevant gates, and
  records the result here and in the experiment log.

## Loop 27 Selection

Return to the central numerical-tokenization gap. Compare three progressive
disclosure treatments using only real fixture `cl100k_base` IDs: concise IDs in
resolved feedback, text-to-ID mappings in Token Log, and labels attached to
fragments only after resolution. Keep IDs hidden during prediction. Research and
test comprehension, Unicode alignment, small-screen legibility, and visual noise
before implementing one reversible treatment.

## Loop 27 Implementation And Decision

- Keep token IDs hidden during prediction. After resolution, attach a real
  `cl100k_base` ID only to a falling submitted piece whose exact grapheme span
  reconstructs one fixture token. Incorrect fragments and pieces spanning a
  missed boundary receive no invented ID.
- Remove the sampled ID mapping from the feedback card. The card now concentrates
  on complete resolved token boundaries, money, and cut audit; Token Log remains
  the complete text-to-ID reference surface.
- Replace the technical one-page intake with four canonical Tutorial-scene pages:
  job premise, token model, learned boundaries/IDs, and station rules. The first
  page contains no tokenizer implementation vocabulary.
- Reframe the ten interactive rounds as a progressive tokenizer curriculum, then
  accelerate endless deadlines from 10 seconds toward a 1.8-second floor across
  plain language, punctuation/numbers, machine text, and edge-case tiers.
- Replace pitch-stepped multi-cut chirps with one repeated noise-led paper shear
  and low mechanical snap. Browser/device listening remains required; tests can
  prove only synthesis shape, bounds, and scheduling.
