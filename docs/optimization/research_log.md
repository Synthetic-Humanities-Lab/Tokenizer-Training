# Optimization Research Log

## Source Standard

Prefer primary research, authoritative tokenizer documentation, platform
guidance, and direct project artifacts. For each source, record:

- claim supported;
- evidence or quotation in paraphrase;
- project-specific inference;
- limitations or conflicts.

## Loop 1 - Numerical Tokenization

Research in progress.

### Project Sources

- Checked-in fixtures: real `cl100k_base` token strings, byte spans, and IDs
  are already available; no fabricated numbering is needed.
- Google Drive discovery found the original
  `manual_tokenization_training_mvp.html`; it is historical product evidence,
  not the current surface contract.
- [Product brief](https://drive.google.com/file/d/1rIptIkT2ojaEL27k-jthZKA3Lg05npqu):
  the primary learning goal is that tokenization is a computational
  transformation rather than ordinary reading. Project inference: IDs matter
  only when visibly connected to the already-resolved token pieces.
- [Design spec](https://drive.google.com/file/d/1DpnwhDZCV6ZN-rXxKy9dxJ3DaavdtU36):
  resolution must expose real segmentation and remain fast but readable.
  Project inference: a persistent numerical layer during prediction would
  violate the intended pacing and action hierarchy.
- [Swink game-feel notes](https://drive.google.com/file/d/16U22kYtUSoFPkkylDUTllvrBJxpBCoF3):
  the cut is the game's only expressive verb, registered markers must persist
  through resolution, and surprising results must become auditable. Project
  inference: token IDs should strengthen the consequence/review phase, not
  compete with gesture acquisition.

### Baseline Validation

- `npm run test`: 94 files and 795 tests passed on 2026-07-18.
- `npm run build`: passed on 2026-07-18.
- `npm run mobile:crossref:status`: evidence is stale/incomplete following
  recent feedback-card and budget-results changes.
- `npm run mobile:capture`: managed-shell Chromium launch was denied by the
  macOS browser-process sandbox. The documented in-app-browser fallback was
  attempted, but the browser security policy rejected localhost navigation.
  Simulator and source/test work can continue; current browser screenshot
  evidence remains an explicit open gate.

### External Sources

- [OpenAI tiktoken](https://github.com/openai/tiktoken/blob/main/README.md)
  and [encoding implementation](https://github.com/openai/tiktoken/blob/main/tiktoken/core.py):
  tokenization converts text to integer lookup keys under a particular
  encoding. ID magnitude is not a quantity. Project inference: label evidence
  `cl100k_base` and never reward or rank IDs.
- [OpenAI tokenizer cookbook](https://developers.openai.com/cookbook/examples/how_to_count_tokens_with_tiktoken):
  spaces commonly belong to the following token and encodings differ. Project
  inference: render spaces explicitly inside each text/ID pair.
- [Unicode UAX #29](https://www.unicode.org/reports/tr29/) and tiktoken decoding
  guidance: graphemes, bytes, and tokens are distinct layers. Project
  inference: describe this corpus as display-safe real fixtures, not proof that
  every possible token is a standalone visible substring.
- [Worked-example meta-analysis](https://doi.org/10.1007/s10648-023-09745-1),
  [feedback meta-analysis](https://doi.org/10.3102/0034654314564881), and
  [formative feedback review](https://doi.org/10.3102/0034654307313795):
  correct worked examples and elaborated post-attempt feedback support novice
  learning. Project inference: reveal the mapping after the cut, never during
  prediction.
- [Split-attention research](https://doi.org/10.1111/j.2044-8279.1992.tb01017.x)
  and [transient-information research](https://doi.org/10.1002/acp.2885):
  stable integrated evidence is preferable to separated, rapidly disappearing
  instruction. Project inference: use the feedback card and Token Log, not
  falling numeric labels.
- [Apple game-controls guidance](https://developer.apple.com/design/human-interface-guidelines/game-controls),
  [WCAG timing guidance](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html),
  and [WCAG contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum):
  protect gameplay content from occlusion and keep timed/moving information
  recoverable. Project inference: Token Log must preserve the mapping beyond
  the timed review.

### Synthesis

- Review is a corrective worked example; Token Log is persistent reference, not
  retrieval practice by itself.
- Falling-fragment IDs fail truth before they fail aesthetics: current falling
  pieces reflect submitted cuts and may merge or split true tokens.
- Progressive disclosure remains a project hypothesis. It must be judged by
  comprehension and non-interference rather than treated as settled evidence.

### Loop 1 Validation Evidence

- `npm run generate:fixtures`: regenerated 78 `cl100k_base` fixtures with no
  unexplained fixture drift.
- Focused validation: 69 token-display, feedback, Token Log, fixture, layout,
  and tutorial tests passed.
- Full validation: 95 test files and 801 tests passed; `npm run build` and
  `npm run build:ios-web` passed.
- XcodeBuildMCP built, installed, and launched the current bundle on the iPhone
  17 simulator at 368x800. The approved menu cleared safe areas.
- The first native Token Log capture showed that 11px mapping text met the
  mechanical line budget but was too weak as primary educational evidence.
  Increasing mappings to 12px retained the 320x568 line-budget pass and improved
  the current simulator capture. Evidence is in `.qa/optimization/loop-001/`.
- `npm run mobile:crossref:status` still fails closed because stored browser and
  simulator evidence predates current feedback/results source. It also reports
  old sidecars without the current Money and boundary-audit fields. These are
  evidence-refresh tasks, not grounds to waive parity checks.
- The production iOS build sets `import.meta.env.DEV` false, so `qaFixtureId` and
  `qaHoldReview` are intentionally unavailable there. Native launch routes prove
  shell/safe-area surfaces; resolved-card text remains a browser QA contract.

### Open Learning Questions

- Does one representative ID in review create the intended text-token-ID mental
  model, or does it look like an unexplained serial number?
- Should Token Log prioritize recently encountered examples, curriculum coverage,
  or searchable fixture lookup? The current three static examples are a reference
  proof, not yet a complete learning archive.
- Can players explain why `␠cat` and `cat` may have different IDs after one
  tutorial pass? This requires observed or instrument-free comprehension testing,
  not code assertions alone.

## Loop 2 - Recently Reviewed Token Log

### Evidence

- [Worked-example review](https://journals.sagepub.com/doi/10.3102/00346543070002181),
  [retrieval-practice research](https://doi.org/10.1126/science.1152408), and
  [transfer research](https://pubmed.ncbi.nlm.nih.gov/20804289/): stable mappings
  support worked-example review, but passive restudy is not retrieval practice.
  Project inference: recent resolved examples improve recovery of surprises;
  they do not by themselves prove durable learning.
- [Spacing review](https://digitalcommons.usf.edu/psy_facpub/1771/): recency and
  durable retention are not equivalent. Project inference: do not market a
  three-row recent list as mastery or curriculum completion.
- [Chess.com game history](https://support.chess.com/en/articles/8598090-how-do-i-view-my-own-games)
  and [Duolingo Practice Hub](https://blog.duolingo.com/guide-to-duolingo-practice-hub/)
  show the consumer value of recovering completed attempts and mistakes.
  Project inference: Token Log becomes meaningful when it retains resolved play,
  not because these products establish the exact interface.
- [WCAG contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
  exposed a current defect: 10-11px `textFaint` metadata is below the 4.5:1
  normal-text target on Token Log backgrounds. Correct this in the same bounded
  surface pass.
- [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html#the-localstorage-attribute)
  supports origin-local, fail-soft storage; the iOS shell uses the default
  persistent WKWebsiteDataStore. Project inference: browser and native histories
  remain separate and offline, which is acceptable for this experiment.

### Synthesis

- Three recently resolved unique fixture IDs, newest first, are the highest-value
  treatment. Resolve all display content from current checked-in fixtures.
- A curated fallback preserves first-use usefulness and leading-space teaching.
- Search is disproportionate for 78 fixed fixtures and creates keyboard, focus,
  whitespace-query, scrolling, and canvas-accessibility costs.
- Store no prompt text, token data, score, cuts, timestamps, or session traces.
- Record only after canonical feedback formatting in `resolveRound`; fixture
  selection history is start-time state and must remain separate.
- A proposed unscored `Same ID` / `Different IDs` microcheck is pedagogically
  plausible but deferred so archive recovery and retrieval practice are not
  conflated in one experiment.

### Loop 2 Validation Evidence

- Storage contains only a version number and at most three fixture IDs. It does
  not import fixture data, preserving current-corpus authority in Token Log and
  avoiding downgrade loss for syntactically valid newer IDs.
- Exact tests cover order, repeat promotion, cap, malformed values, oversized
  pre-parse rejection, unsupported future-version preservation, unavailable
  storage, playtest reset, and Reset Best Rank isolation.
- Token Log tests cover unknown-ID skipping, curated fallback, source labels,
  safe areas, one-line compact metadata, complete mapping line budgets, QA state,
  and record-after-feedback source order.
- Current full result: 95 files and 817 tests passed. Browser and iOS web builds
  passed.
- XcodeBuildMCP proved the end-to-end native path: clear playtest state, start
  Training, auto-resolve one prompt, stop the app, relaunch Token Log, and recover
  the prompt as `RECENT` with two `REFERENCE` rows.
- `npm run mobile:simulator` passes after refreshing menu, tutorial, training,
  results, settings, Token Log, and tutorial outcome screenshots at 368x800.
- `mobile:freshness` passes menu and simulator groups but correctly rejects stale
  active/results and runtime browser artifacts. The in-app browser still refuses
  localhost and managed-shell Chromium remains sandbox-blocked.
- The simulator evaluator's `endless-pinned` name overstates determinism:
  production Vite compiles out `qaFixtureId` and `qaFreezeElapsedMs`. The current
  screenshot shows `simple_001`, but the launch control is not authoritative.
  Treat this as a QA-contract backlog item, not gameplay evidence.

## Loop 3 - Results Outcome Hierarchy

### Project Audit

- The production result rows already implement the intended distinction:
  budget exhaustion omits balance and renders four cards; voluntary suspension
  retains balance and renders five.
- The current simulator `results.jpg` is a voluntary `Training Suspended`
  outcome. The capture route and evaluator nevertheless call the artifact
  budget evidence, so a fresh capture cannot satisfy the written contract.
- The seeded protocol data is arithmetically inconsistent. Five correct, three
  missed, and two false cuts imply 50% canonical accuracy, not 62.5%. A $40
  start plus $21.50 pay and $49.75 cost implies $11.75, not $12.34.
- Compact metric labels are 9px `textFaint`, below the established normal-text
  readability target and weaker than the now-corrected Token Log metadata.

### Synthesis

- [Apple Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
  and [Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games)
  set 11pt as the iOS minimum and require game text to be tested on each target
  display. Project inference: 9px compact metric labels are not acceptable as
  meaningful result evidence; 11px is a floor, not proof of comfortable reading.
- [WCAG 2.2 contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
  requires at least 4.5:1 for normal text. Project inference: use the established
  muted-text treatment instead of faint decorative text for metric labels.
- Preserve the four-card budget and five-card suspension policy. A zero balance
  is the cause of the budget outcome, not useful repeated evidence once the title
  and summary state that cause. A positive suspended balance is real unfinished
  session state and remains relevant to rank/best-record comparison.
- Keep detailed economics in Copy Summary. Restoring a visible money ledger
  would reverse the user's approved simplification and compete with rank/cut
  comprehension.
- Repair the QA route with a real budget seed: 5 correct, 3 missed, 2 false,
  50% accuracy, $21.50 pay, $61.50 cost, and $0 balance from the $40 start.
- Treat label size/contrast and compact geometry as the only visual intervention
  in this loop. Larger hierarchy changes require screenshot evidence and separate
  approval.

### Backlog Separated From This Loop

- `ResultsSceneQaSystem` accepts legacy ledger geometry although no visible
  ledger is rendered.
- `ResultsCopySystem` can still offer a fallback label referring to ledger text.
- `StorageSystem.saveHighScore` can return the candidate after a write failure,
  which may overstate persistence in result copy.
- Production iOS builds compile out fixture/freeze query controls, so the
  `endless-pinned` evidence route is not deterministic.

### Loop 3 Validation Evidence

- The protocol seed is unit-tested against canonical cut-audit accuracy, trace
  aggregates, and budget arithmetic rather than duplicated snapshot constants.
- Layout tests cover both four- and five-card states at 320x568, 368x552,
  safe-area 390x844, and 1280x720. The longest rank remains within the bounded
  two-line value budget.
- The tightened surface evaluator rejects quit outcomes, incorrect titles,
  summaries without zero-balance closure, extra economic cards, state/rank
  disagreement, and cards below 40px in the budget state.
- 78 fixtures regenerated; 96 test files and 831 tests passed. Browser and iOS
  web builds passed.
- Current iPhone 17 captures show a readable 2x2 budget block and a five-card
  suspension block with no overlap. Evidence is preserved in
  `.qa/optimization/loop-003/`.
- The full current simulator set and manifest pass validation and freshness.
  Browser evidence could not be refreshed: managed Chromium still fails its
  macOS Mach-port registration, and the in-app browser explicitly rejects the
  localhost target. The stale browser artifacts are retained and fail closed.

## Loop 4 - Native QA Determinism

### Evidence

- `build:ios-web` uses ordinary `vite build` for both Xcode Debug and Release.
  [Vite environment and mode guidance](https://vite.dev/guide/env-and-mode)
  states that `vite build` uses production mode and replaces environment
  constants at build time. Project finding: `import.meta.env.DEV` is false in
  the embedded bundle, so the arbitrary fixture/freeze parser is unreachable.
- The built iOS JavaScript contains neither `qaFixtureId` nor
  `qaFreezeElapsedMs`. `PlayScene` receives empty QA controls in that build.
- The current simulator screenshot shows 7.5 seconds. A real 2000ms freeze in
  the 9-second first round would render 7.0 seconds, directly disproving the
  manifest's implied freeze claim.
- `simple_001` is also the normal first eligible fixture. Its appearance cannot
  prove that the fixture override ran.
- The simulator evaluator checks manifest argument strings and image structure,
  not applied runtime state. Freshness timestamps cannot close that semantic gap.
- Apple supports document-start scripts, script-message bridges, scheme launch
  arguments, and configuration-specific compilation conditions. Those make a
  simulator-only attested route feasible, but they do not make it necessary for
  a structural screenshot. Sources: [Xcode schemes](https://developer.apple.com/documentation/xcode/customizing-the-build-schemes-for-a-project),
  [build settings](https://developer.apple.com/documentation/xcode/build-settings-reference),
  and [WKUserScript injection](https://developer.apple.com/documentation/webkit/wkuserscriptinjectiontime/atdocumentstart).

### Synthesis

- Correct the claim before adding machinery. The screenshot needs to prove that
  the production shell opens a playable active endless surface clear of safe
  areas; it does not need a byte-repeatable frame.
- Rename the native route `endless-active`, remove ignored QA parameters, and
  make their presence a validator failure.
- Keep browser-development pinned routes unchanged because their controls are
  genuinely enabled and serve a different cross-reference purpose.
- Reject a production fixed launch mode: even allowlisted frozen gameplay would
  unnecessarily expand the shipped game surface.
- Defer a Debug/simulator-only attestation bridge until a future experiment
  genuinely requires stable native frame identity and has an automated receipt
  collection path.

### Loop 4 Validation Evidence

- `evaluate-ios-simulator-evidence.ts` now treats `endless-active` as structural
  native evidence and rejects every browser-only QA parameter in native launch
  metadata. Its parser consumes `--tt-query` pairs once and rejects duplicate
  contradictory `mode` values.
- Source-level tests verify that browser QA controls remain guarded by
  `import.meta.env.DEV`; browser capture and runtime routes were not renamed.
- 78 fixtures regenerated; 96 test files and 839 tests passed. Browser and iOS
  web builds and `git diff --check` passed.
- XcodeBuildMCP rebuilt and installed the current app, then recaptured menu,
  tutorial active, live endless active, results, settings, Token Log, tutorial
  cleared, and tutorial failed at 368x800.
- Visual review found no blank canvas, unsafe-area collision, clipped bottom
  actions, or results-card overlap. The live endless image visibly advances its
  timer, consistent with the corrected nondeterministic claim.
- `npm run mobile:simulator` passes. `mobile:freshness` passes menu and native
  groups but correctly rejects the stale browser active/results and runtime
  groups. `mobile:crossref:status` remains incomplete for the same stale browser
  evidence and reports the old-result/feedback mismatches explicitly.

## Loop 5 - Result Persistence Truth

### Project Audit

- `StorageSystem.saveHighScore` currently returns the newly timestamped candidate
  when storage is absent or `setItem` throws. `ResultsScene` then treats that
  object as persisted and `SessionFlowSystem` labels it `Best saved`.
- A failed replacement loses the distinction between the current achievement and
  a valid prior persisted best. Menu, HUD, and Settings correctly reload storage
  independently and must remain persisted-best consumers.
- Equal/lower candidates already avoid writes through `isBetter`; the explicit
  result contract must preserve that no-write behavior and the old timestamp.
- An immediate zero-round quit deliberately skips saving but currently turns a
  null load into `0 rounds / Regex Intern` and labels the invented baseline saved.
- A valid legacy record is currently hidden if canonical-key migration throws,
  even though the legacy value remains readable.
- The iOS shell creates an ordinary `WKWebViewConfiguration` and does not opt into
  `WKWebsiteDataStore.nonPersistent()`. Loop 2 simulator relaunch evidence already
  proves normal shell persistence; native Swift does not need a new save path.

### External Sources

- [WHATWG Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html):
  `setItem` may throw and a failed write does not update the storage map. Project
  inference: retain the previous persisted best and never return the failed
  candidate as saved.
- [WHATWG Storage](https://storage.spec.whatwg.org/): browser storage is best
  effort unless stronger persistence is separately granted. Project inference:
  `Saved on this device` is supportable after an accepted write; `permanently
  saved` is not.
- [Apple WKWebsiteDataStore](https://developer.apple.com/documentation/webkit/wkwebsitedatastore):
  default and nonpersistent stores are distinct. Project inference: the existing
  default configuration plus relaunch evidence is sufficient for the normal iOS
  path, while an explicitly nonpersistent shell would require session-only copy.
- [WCAG status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html):
  success and error results should be programmatically exposed without forcing a
  focus change. Project inference: a future semantic status counterpart should
  expose save failure; this bounded copy-truth loop should not invent an
  inaccessible canvas alert.

### Synthesis

- Achievement and persistence are separate facts. Return both explicitly from
  storage and let results copy describe the divergence only when it occurs.
- Use three write outcomes: `saved` for an accepted better-record write, `kept`
  when an existing equal/better record requires no write, and `unavailable` when
  persistence cannot be confirmed.
- Keep successful output unchanged to protect existing QA and user expectations.
  Failure-only copy may add lines; no-record output must say `none yet`.
- Do not broaden this into storage durability, cloud sync, canvas accessibility,
  or a native persistence rewrite.

### Loop 5 Validation Evidence

- The save result is a discriminated union: successful `saved`/`kept` outcomes
  cannot represent `persisted: null`; `ResultsScene` stores the whole result so it
  cannot lose the status-record correlation.
- Storage tests cover successful first and replacement writes, equal/lower
  no-write behavior, first-write failure, failed replacement with prior-record
  retention, unavailable storage, and failed legacy migration.
- Session-copy tests compare `saved` and `kept` output byte-for-byte with the
  previous successful strings. Separate tests cover failed writes with and
  without a prior record and zero-round/no-record output.
- 78 fixtures regenerated; 96 test files and 847 tests passed. Browser and iOS
  web builds and `git diff --check` passed.
- XcodeBuildMCP rebuilt and installed the current app. The protocol-results route
  saved a seven-round Boundary Clerk best; after stopping and relaunching the app,
  the default menu showed the same best, confirming normal successful persistence.
- All eight simulator images were recaptured after the iOS web build and pass the
  native evaluator. Menu and native freshness groups pass; stale browser
  active/results and runtime groups remain an explicit failed evidence gate.

## Loop 6 - Canvas Accessibility Boundary

### Project Audit

- `index.html` exposes an empty labeled `main`; Phaser renders all controls and
  material text into canvas objects. No ARIA roles, focusable actions, accessible
  names, live regions, or scene focus policy exist.
- Existing dev QA JSON is geometry-heavy, transient, development-only evidence.
  It is not a semantic API and would flood live announcements if reused.
- Menu, Results, Settings, Token Log, and tutorial outcomes are pointer-only.
  Play has Resolve/Clear/Mute/Exit shortcuts but no keyboard cut-boundary
  selection, so keyboard users cannot complete the core loop.
- Prompt, Wiener speech, feedback, result outcomes, and copy-state changes are
  silent to assistive technology.
- Scene shutdown already removes pointer, keyboard, focus, resize, and timing
  listeners. A semantic lease can join that lifecycle without changing mechanics.
- Settings says `Reduced Motion: System`, but no `prefers-reduced-motion` reader
  exists. Fixed canvas pixels also do not follow Dynamic Type or text-only zoom.
- Drive discovery found the original project corpus and game-design readings but
  no separate Tokenizer Training accessibility study or user-test archive. Do not
  substitute unrelated Drive project checklists for product evidence.

### External Sources

- [WHATWG canvas](https://html.spec.whatwg.org/multipage/canvas.html#the-canvas-element):
  canvas fallback must provide equivalent purpose/function rather than a generic
  description. Project inference: mirror decisions and material state, not every
  animated object.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and
  [WAI button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/):
  interactive controls need programmatic name/role/state, keyboard operation,
  logical focus order, visible focus, and no trap. Project inference: use native
  buttons routed to shared scene commands.
- [Media Queries 5 reduced motion](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion):
  CSS cannot suppress Phaser motion by itself. Project inference: treat motion as
  a separate JavaScript policy loop rather than overloading the semantic bridge.
- [Apple VoiceOver criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/voiceover-evaluation-criteria),
  [Reduced Motion criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria),
  and [Larger Text criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/larger-text-evaluation-criteria):
  common tasks, meaningful labels/states, navigation, motion alternatives, and
  text enlargement require real-device evaluation before support claims.

### Synthesis

- Prefer one typed game-level semantic runtime over scene-local DOM duplication or
  a Phaser plugin. It is independently testable and works unchanged in WKWebView.
- Use immutable snapshots and epoch-scoped leases. One delegated DOM click path
  routes only current action IDs; inactive scenes leave no accessible controls.
- First expose menu and results because their actions are discrete and complete.
  Do not expose partial play buttons as though slicing were nonvisually operable.
- Preserve native button Enter/Space behavior. When play semantics arrive, Phaser
  global shortcuts must ignore keyboard events owned by the semantic root to
  prevent double activation.
- Announce only stable state changes. Timer ticks and animation frames are not
  status messages.

### Loop 6 Validation Evidence

- The implementation uses one named DOM region, native `h1` and `button`
  elements, `status`/`alert` live regions, exact scene projections, and no
  `role=application`. Menu and Results contain no scene-local DOM construction.
- Coordinator tests cover immutable-copy behavior, snapshot/announcement
  deduplication, focus restoration, disabled actions, duplicate activation,
  wrong-scene publication, stale render tokens, lease replacement/disposal, and
  idempotent destruction.
- Scene tests prove exact action order/copy, shared command routing, shutdown
  disposal, menu transition guarding, results navigation-only guarding, and reset
  of reusable scene flags on every `create()`.
- The conventional clipped surface was absent from XcodeBuildMCP targets. A
  real-bounds transparent experiment was also absent and was rejected rather
  than adding touch-hit risk. The explicit `semanticUi=visible` route visibly
  rendered the complete HTML menu and results projections in WKWebView.
- Despite visible HTML, `snapshot_ui` captured 17 native elements, zero likely
  targets, and one scroll container. `wait_for_ui` could not find `Tutorial`.
  Hardware Tab/Enter injection did not reach the focused web button. Inference:
  this XcodeBuildMCP/runtime combination collapses WKWebView descendants, so it
  cannot currently prove VoiceOver behavior.
- [Apple WKWebView](https://developer.apple.com/documentation/webkit/wkwebview/)
  documents WKWebView as a UIKit view with accessibility conformance, but does
  not make this simulator hierarchy a product-accessibility proof. Apple VoiceOver
  criteria still require common-task evaluation with the assistive technology.
- 78 fixtures regenerated; 100 files and 863 tests passed; both builds and diff
  checks passed. Current native screenshots pass the simulator validator and
  freshness gate. Browser evidence remains stale under the recorded localhost
  restrictions.

### Loop 7 Research Question

Settings claims system reduced-motion behavior without a runtime media-query
reader. Audit which current motions communicate state or pedagogy and which are
ornamental, then define a policy whose state changes can be unit-tested and
observed in browser and WKWebView without altering gameplay clocks or economics.

## Loop 7 - System Reduced Motion

### Project Audit

- No source previously read `prefers-reduced-motion`; Settings displayed a
  capability claim without a runtime policy.
- `SentenceMotionSystem.positionAt` and `isComplete` share one elapsed-time state.
  The falling prompt is therefore the visible round clock, not decoration.
- Cut markers, armed preview, live swipe trail, commit labels, no-cut direction,
  review reveal, and feedback-card evidence communicate player action or resolved
  truth. Their static information and logical durations must survive.
- `restartPetIdleBob`, `playPetReaction`, the scale phase of
  `playTextCutImpact`, and the rotation/translation in
  `animateResolvedTextPieces` are nonessential motion with existing static or
  opacity-only alternatives.
- A global Phaser time/tween multiplier would conflate gameplay timing with
  ornament and was rejected.

### External Sources

- [Apple Reduced Motion evaluation criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria):
  stop purely decorative and ongoing motion; preserve meaningful state changes
  with alternatives such as dissolves, highlights, or color shifts. Project
  inference: stop Wiener movement and dissolve resolved pieces, but retain the
  sentence clock and canonical evidence.
- [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility/):
  reduce automatic/repetitive movement, scaling, and peripheral motion, and
  prefer fades over x/y/z transitions. Project inference: idle bob, reaction
  squash, cut-impact scaling, and falling/rotating fragments are the first slice.
- [WCAG 2.2 animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions):
  nonessential interaction animation must be disableable; essential information
  may remain. Project inference: keep cut acceptance/correction information and
  change only its nonessential movement.
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)
  and [MediaQueryList change](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/change_event):
  the media feature is broadly available and can be observed without polling.
  Project inference: one game-lifetime listener works in browser and WKWebView.

### Synthesis

- Treat reduced motion as a game-level platform preference, not a stored gameplay
  option and not a CSS blanket over Phaser.
- Use explicit treatments (`animate/still`, `fall/fade`, `scale/fade`) so future
  motion audits cannot silently inherit a global speed rule.
- Keep logical clocks and information identical. Only rendering treatment varies.
- An `Off (System)` native screenshot proves support/query reachability, not the
  enabled treatment. Require paired enabled-state evidence before a platform
  support claim.

### Loop 7 Validation Evidence

- Runtime tests cover unavailable and throwing APIs, modern and legacy WebKit
  listeners, deduplication, unsubscription, destruction, labels, and treatments.
- Source integration tests prove shared registry ownership, scene cleanup, QA
  state, and retention of sentence completion, review delay, and speech timing.
- 78 fixtures regenerated; 102 files and 872 tests passed. Both builds and diff
  checks passed.
- XcodeBuildMCP rebuilt the app and showed `Reduced Motion: Off (System)` while
  iOS Accessibility > Motion showed Reduce Motion off. Eight current normal
  routes pass the simulator evidence validator.
- The native Settings switch is visible but absent from XcodeBuildMCP actionable
  targets, while direct `simctl` is sandbox-blocked. Enabled-state native behavior
  remains explicitly unproven; unit/integration coverage is not substituted for
  that manual/platform evidence.

### Loop 8 Research Question

Determine whether the current browser Vibration API can produce iOS WKWebView
haptics and whether a minimal native cue bridge is justified. The consumer UI
must not display `pending` implementation copy; report actual capability or omit
the line while retaining truthful browser fallback behavior.

## Loop 8 - Native Haptic Capability Truth

### Project Audit

- `HapticFeedbackSystem` already defined five finite cues, short browser
  vibration patterns, a four-pulse cut-burst cap, touch-like input gating,
  fail-soft errors, and the current Sound/mute coupling.
- `WebGameView` had no script message handler or native feedback path. Settings
  displayed `Haptics: Native shell pending`, which exposed implementation status
  without describing a player capability.
- Play and `ResolutionFeedbackSystem` already pair every tactile cue with visual
  and/or audio feedback. No mechanic or instruction depends on haptics alone.
- Existing shell tests were static and Simulator evidence could compile/launch
  native glue but could not prove physical tactile output.

### Primary Sources

- [Apple Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics):
  prefer short feedback for discrete events, preserve causal/consistent meaning,
  complement other channels, avoid overuse, and make haptics optional. Project
  inference: UIKit generators fit the current finite cue vocabulary; arbitrary
  page-defined patterns do not.
- [Apple Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
  and [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback):
  pair audio with haptic and visual feedback so silenced audio is not the sole
  status channel. Project inference: Sound coupling deserves a separate
  preference audit, not an unreviewed change inside native capability repair.
- [Apple UINotificationFeedbackGenerator](https://developer.apple.com/documentation/uikit/uinotificationfeedbackgenerator):
  the system defines success/failure/warning meanings. Project inference: use
  notification feedback for `miss`/`warning` and impacts for cut/confirm/clear.
- [Apple Core Haptics compatibility](https://developer.apple.com/documentation/corehaptics/preparing-your-app-to-play-haptics):
  devices vary and software must check `supportsHaptics`. Project inference: use
  the capability only; a custom engine is unnecessary for discrete cues.
- [Apple HapticPalette sample](https://developer.apple.com/documentation/corehaptics/updating-continuous-and-transient-haptic-parameters-in-real-time):
  Simulator has no haptic interface. Project inference: compilation, bridge
  launch, and accurate unavailable UI are the maximum native claims here.
- [Apple WKFrameInfo security origin](https://developer.apple.com/documentation/webkit/wkframeinfo/securityorigin):
  frame messages expose protocol/host and main-frame state. Project inference:
  authorize only the bundled custom origin and main frame.
- [WebKit issue 288846](https://bugs.webkit.org/show_bug.cgi?id=288846): the
  iPhone/iPad Device Vibration API request remains open. Project inference:
  `navigator.vibrate` is not a supported iOS WKWebView haptic path.

### Synthesis

- Omission fixes the copy but leaves supported iPhones without tactile feedback.
  A device-dependent label alone does not create a route. A fixed cue bridge is
  justified because the game already owns a bounded cue vocabulary.
- UIKit feedback generators are smaller than Core Haptics and align with the
  discrete events. Hardware capability is injected at document start so the
  same web runtime can select native, browser, or unavailable truthfully.
- A message handler is an authorization surface. Exact keys, cue enum, integer
  repeat cap, main frame, custom origin, foreground state, rate limit, and
  teardown are required together; handler-name obscurity is not security.
- Sound independence is evidence-backed but changes default/persistence
  semantics. Preserve it during this loop and audit migration separately.

### Loop 8 Validation Evidence

- Unit tests cover native preference, exact messages, capped repeats, browser
  fallback, unavailable states, labels, mute/modality gates, and thrown routes.
- Source integration tests cover Settings QA truth and preservation of Sound
  coupling. Shell tests require capability injection, origin/frame/schema/rate
  checks, repeat restrictions, and handler removal.
- 78 fixtures regenerated; 103 files and 879 tests passed. Browser and iOS web
  builds and `git diff --check` passed.
- XcodeBuildMCP rebuilt and launched the current bundle on iPhone 17 / iOS 26.5.
  Settings displayed `Haptics: Unavailable`, matching Simulator hardware. Ten
  current native routes were recaptured and visually inspected; the nine-file
  canonical evaluator passes.
- This proves bundle integration and truthful capability reporting, not tactile
  output. A supported physical iPhone must validate feel, cue mapping, mute
  behavior, background/foreground recovery, and absence of overuse.

### Loop 9 Research Question

Should tactile feedback remain subordinate to Sound, or receive an independent
optional preference? Define a migration/default that respects existing muted
players and does not overstate unavailable hardware before changing storage/UI.

## Loop 9 - Sound and Haptics Preference Boundary

### Project Audit

- Sound and haptics were coupled only through `PlayScene.toggleMute`; no scoring,
  input, tutorial, or feedback rule required the coupling.
- Phaser scene instances retain their `AudioSystem` fields. Settings could update
  local storage while another scene's already-constructed audio state remained
  stale until a page reload.
- The native bridge exposes capability only. Preference ownership belongs in the
  shared web runtime so browser and iOS do not acquire divergent settings models.
- Drive discovery found current project history and the educational premise but
  no separate haptics preference study or participant evidence.

### Primary Sources

- [Apple Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)
  treats haptics as optional, short, causal feedback and warns against overuse.
  Project inference: expose a choice but leave the bounded cue vocabulary intact.
- [Apple Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
  recommends multimodal feedback rather than making sound the sole status path.
  Project inference: silencing audio should not necessarily suppress touch
  feedback.
- [Apple iPhone keyboard guidance](https://support.apple.com/guide/iphone/type-with-the-onscreen-keyboard-iph3c50f96e/ios)
  exposes Sound and Haptic as separate feedback settings. This is a platform
  precedent, not proof of the correct Tokenizer Training default.
- [Apple Reduced Motion criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria)
  concern visual motion. Project inference: do not overload the existing system
  motion policy as a tactile preference.

### Synthesis

- Two delegated audits favored a persistent independent choice; one recommended
  retaining coupling until hardware validation but supplied the same migration
  safeguards if independence proceeded. Independence is sufficiently reversible
  to test now; cue tuning is not.
- Migrate from Sound once to respect existing muted players, then decouple.
  Missing and malformed data need distinct behavior, and unknown future records
  must be preserved rather than downgraded.
- Unavailable hardware is a capability state, not a preference value. Show it as
  noninteractive while retaining the user's stored choice.
- Cut bursts carry the greatest fatigue risk and miss feedback can feel punitive.
  Keep their current bounded mapping until a real-device matrix can judge them.

### Loop 9 Validation Evidence

- Storage/runtime tests cover valid, missing, malformed, oversized, future, and
  unavailable states; migration, explicit repair, failed writes, and session
  fallback are deterministic.
- Layout tests cover small, short, safe-area, and desktop viewports with 44px
  minimum haptics geometry and no overlap. Integration tests verify independence,
  registry ownership, and audio refresh in all six audio-owning scenes.
- 78 fixtures regenerated; 105 files and 911 tests passed. Both web builds and
  `git diff --check` passed.
- XcodeBuildMCP rebuilt and launched the current bundle. Ten native routes were
  recaptured and inspected; Settings truthfully displays noninteractive
  `Haptics: Unavailable`, and the simulator evaluator passes.
- Chromium browser capture remains sandbox-blocked. No physical iPhone is visible,
  so tactile output, comfort, and Sound/Haptics matrix behavior remain unproven.

### Loop 10 Research Question

Does the current resolved-review sample plus Token Log mapping teach that token
IDs are model-specific vocabulary lookup keys, or does the tutorial need one
anchored explanation? Reconsider falling labels only against truthfulness,
legibility, cognitive load, and correction-evidence criteria.

## Loop 10 - Numerical Token Comprehension

### Project Audit

- Review already showed the complete true token chunks plus one real fixture ID;
  Token Log already showed complete mappings for each visible fixture.
- Token IDs were correctly absent from prediction-facing input, hints, and active
  feedback. Existing tests preserve that boundary.
- Falling pieces come from player-submitted cuts, not tokenizer truth. False cuts
  and missed true boundaries make a one-piece-to-one-ID label false on imperfect
  rounds.
- Tutorial data contained longer numerical explanations, but the live scene does
  not schedule those explanation timers. Round two's existing review speech is
  the smallest observable teaching point.

### Primary and Learning Sources

- [OpenAI tiktoken README](https://github.com/openai/tiktoken/blob/main/README.md):
  models receive token sequences as numbers and BPE converts text to those tokens;
  named encodings include `cl100k_base`.
- [OpenAI tiktoken core](https://github.com/openai/tiktoken/blob/main/tiktoken/core.py):
  `encode_single_token` returns a token value from the encoding vocabulary.
  Project inference: IDs must be encoding-qualified and must not imply meaning or
  universality.
- [Chen et al. 2023](https://doi.org/10.1080/01443410.2023.2273762): worked
  examples improved retention/transfer and reduced cognitive load in the studied
  learning setting. Project inference: explain one real mapping at review rather
  than add persistent moving labels.
- [Shute 2008](https://doi.org/10.3102/0034654307313795): formative feedback is
  strongest when timely, specific, and bounded. Project inference: use the
  immediate review pause and keep the correction card primary.
- [Sweller and Cooper 1985](https://doi.org/10.1016/0364-0213(85)90023-7):
  worked examples can reduce novice problem-solving load. Project inference: one
  resolved sample plus a complete optional reference is a coherent progression.

### Delegated Audit Synthesis

- Learning, mobile game-feel, and code audits independently rejected numeric
  labels on falling fragments as either conceptually false or a second moving
  reading target on a 368px portrait screen.
- All three favored one concise post-resolution explanation plus the static Token
  Log. The code audit localized the production change to `TokenDisplaySystem`
  and `TutorialSystem`; no Play-scene or animation change was needed.

### Loop 10 Validation Evidence

- Focused suites: 58 tests passed across token display, feedback, tutorial,
  resolved animation, and feedback-card layout.
- Full gates: 78 fixtures regenerated; 105 files / 912 tests passed; browser and
  iOS web builds passed. All 78 compact feedback-card fixtures still fit.
- XcodeBuildMCP launched the rebuilt iPhone 17 shell. Production-native tutorial
  review visibly showed the sampled mapping and Token Log visibly showed complete
  mappings at 368x800.
- All ten approved native routes were refreshed and visually inspected;
  `mobile:simulator` and the iOS freshness group pass.
- The semantic snapshot exposes no Phaser button targets, so the round-two review
  speech frame could not be advanced to deterministically. That screenshot is an
  open evidence item, not inferred from source tests.
- The three browser groups remain stale and their old results/feedback contracts
  fail `mobile:crossref:status`; no validator was weakened.

### Loop 11 Research Question

What is the smallest valid evaluation of the numerical-token mental model? Define
what a player must retrieve or transfer before adding any more explanation,
instrumentation, progression, or game modes.

## Loop 11 - Numerical Token Comprehension Evaluation

### Project And Drive Audit

- The existing Google Drive protocol already specifies five uncoached tutorial
  sessions and a debrief question about non-word tokenization behavior.
- No completed session notes or completed rollup exist; `playtest:status` reports
  0/5. A separate probe can therefore be added without overwriting human data.
- Tutorial completion and the existing 70% cut threshold are not valid measures
  of the three numerical-token propositions because early hints, swipe precision,
  timing, and scoring all contribute to the observed performance.

### Primary And Learning Sources

- [OpenAI tiktoken](https://github.com/openai/tiktoken/blob/main/README.md)
  establishes that models consume numerical token sequences and that named
  encodings differ. Project inference: exact examples must be tokenizer-verified
  and every ID claim must name its encoding.
- [Roediger and Karpicke 2006](https://pubmed.ncbi.nlm.nih.gov/16507066/)
  distinguishes retrieval from passive restudy. Project inference: collect an
  answer and reason rather than ask for recognition alone.
- [Butler 2010](https://pubmed.ncbi.nlm.nih.gov/20804289/) reports transfer from
  repeated testing to new inferential questions. Project inference: use unseen
  strings rather than tutorial fixtures.
- [Knowing What Students Know](https://nap.nationalacademies.org/catalog/10019/knowing-what-students-know-the-science-and-design-of-educational-assessment)
  aligns cognition, observation, and interpretation. Project inference: declare
  one observable item and rubric for each claim before collecting responses.

### Delegated Audit Synthesis

- The learning audit recommended a three-item near-transfer probe with reasons;
  confidence is useful only for detecting confidently held misconceptions.
- The game-design audit rejected a surprise in-game quiz and progression gate on
  the compact tutorial handoff.
- The code audit confirmed that live tutorial behavior does not currently retrieve
  numerical understanding and identified separate unreachable speech/timer APIs.
- Selected treatment: a dedicated external probe after Tutorial and before Token
  Log or Training. Rejected treatments: cut-accuracy inference, embedded quiz,
  and scored transfer fixture.

### Loop 11 Validation Evidence

- Two alternating forms and all exact chunks/IDs pass `js-tiktoken` verification.
  Documentation tests protect the study boundary, fixed rubric, and four-of-five
  decision threshold.
- Full gates pass: 78 fixtures regenerated; 106 files / 916 tests; browser build;
  iOS web build; XcodeBuildMCP build/run; all ten native route captures;
  `mobile:simulator`; local playtest-package audit; and `git diff --check` before
  the documentation closeout.
- The iOS freshness group passes. Three browser screenshot groups remain stale
  and failed; no capture validator was weakened.
- Human evidence remains absent. The protocol is ready, but comprehension and
  treatment efficacy are not proven.

### Loop 12 Research Question

Which tutorial speech fields, timers, methods, and tests are truly unreachable,
and can removing them make the live teaching contract easier to reason about
without changing any visible Wiener speech, timing, mechanics, or QA surface?

## Loop 12 - Tutorial Runtime Contract Audit

### Call-Graph Evidence

- Production tutorial flow reads only fixture ID, the active instruction returned
  by `activePromptFor()`, the outcome review returned by `reviewSpeechFor()`, hint
  flags, round duration/count, and completion.
- Repository search found no production callers for the staged narrative,
  mechanics, byte-route, token-ID, work-rule, follow-up, speech-window,
  resolve-line, completion-line, compact-title, or instruction-window APIs.
- Seven tutorial timer fields in `PlayScene` were never assigned; their only uses
  were optional no-op cleanup calls. `tutorialIntroPrompt()` only wrapped a dead
  path.

### Delegated Audit Synthesis

- Three independent audits converged on the same safe boundary and separately
  warned not to touch live speech timing, review reveal/dwell timers, feedback
  advancement, pet-speech QA fields, or `computePetSpeechLayout()`.
- The useful concepts in dead copy were not evidence that the APIs should remain.
  They were distilled into the copy deck: text becomes bytes/chunks/IDs, staged
  cuts do not change tokenizer truth, leading spaces can belong to following
  chunks, words and chunks differ, and learned merge patterns determine splits.

### Loop 12 Validation Evidence

- `TutorialSystem.ts` is 195 lines, down from 727. Production-facing tests now
  cover only fixture order, live prompts/reviews, hints, timing, completion, the
  numerical round-two line, compact language, and missing-record fallbacks.
- Full gates pass: 78 fixtures; 106 files / 910 tests; browser build; iOS web
  build; local playtest audit; simulator evaluator; native freshness; and
  `git diff --check`.
- XcodeBuildMCP produced clean native active and natural-timeout review captures.
  All ten approved native routes were refreshed and visually inspected.
- Three browser screenshot groups remain stale. Human comprehension remains 0/5
  sessions and unproven.

### Loop 13 Research Question

Which remaining Wiener speech renderer fields, options, geometry helpers, and
tests are reachable in production, and can test-only label/toast scaffolding be
removed without changing the visible pet speech panel or its QA contract?

## Loop 13 - Wiener Speech Renderer Reachability Audit

### Call-Graph Evidence

- `wienerSpeechLabel` was constructed, set visible, then synchronously hidden by
  the live layout method before a frame could render. It had no reader and no QA
  or semantic projection.
- Both production `setWienerSpeech()` calls omitted `showToast`, so its default
  true branch was unconditional and its false branch unreachable.
- `computeWienerSpeechLayout()` had no production importer. Only four legacy test
  calls exercised its centered near-text toast geometry. Production exclusively
  calls `computePetSpeechLayout()`.
- `hideWienerSpeech()`, `layoutWienerSpeech()`, sticky/timer state, the panel,
  chrome/tail, text, and QA `petSpeechBubble` are live and were excluded.

### Delegated Audit Synthesis

- All three audits approved the same narrow deletion and required migration of
  compact copy-wrap coverage to the live pet layout rather than simple test loss.
- QA review found that native route/file checks can false-green speech behavior;
  fresh active and natural review screenshots were therefore mandatory.
- Accessibility review found no semantic dependency: PlayScene speech is canvas
  only. Removing the dead Phaser label is not an accessibility improvement.

### Loop 13 Validation Evidence

- Focused suites: 9 files / 169 tests. Full gates: 78 fixtures; 106 files / 907
  tests; browser build; iOS web build; local playtest audit; and diff check.
- XcodeBuildMCP rebuilt/launched the current shell. Loop-specific active/review
  evidence is under `.qa/ios-simulator/loop-13-wiener-renderer/`; all ten latest
  native routes were recaptured, inspected, and pass freshness/evaluation.
- Browser subprocess capture fails before page creation because managed Chromium
  cannot register its macOS Mach port. The in-app browser also rejects this local
  target under its active security policy. Three browser groups remain stale.

### Loop 14 Research Question

Does current compact geometry reproduce the active pet-speech/timer overlap at
`368x552`, and what is the smallest layout correction that preserves the visual
hierarchy and every existing clearance across mobile and desktop viewports?

## Loop 14 - Compact Active Speech/Timer Clearance

### Geometry Evidence

- Current production functions reproduce the fault at `320x568` and `368x552`:
  timer bounds are `174..182` and active speech bounds are `128..186`, an 8px
  overlap. Standard portrait, landscape, tablet, and desktop profiles are clear.
- The timer rectangle uses a left-origin layout coordinate but Phaser renders it
  from its centered bounds. Passing the live `timerTrack.getBounds()` avoids an
  origin mismatch in the speech solver.
- Review speech cannot be inferred from tutorial mode because endless review is
  also valid. `PlayScene.resolving` is the actual active/review state boundary.

### Delegated Audit Synthesis

- Two independent layout/code audits favored an explicit active-only timer
  obstacle over moving the global timer or globally shifting Wiener speech.
- Both required standard and desktop profiles to remain equivalent where no
  collision exists. One additional delegated audit did not return.

### Loop 14 Validation Evidence

- Seven viewport classes enforce at least 8px timer clearance, pet clearance,
  prompt clearance on short phones, and unchanged standard-phone geometry.
- Full gates pass: 78 fixtures; 106 files / 917 tests; browser and iOS web builds;
  local playtest audit; simulator evaluator; native freshness; and diff check.
- Fresh iPhone 17 active and natural-timeout review screenshots confirm the
  visible hierarchy. The installed simulator set has no iPhone SE-class target;
  `320x568` and `368x552` are therefore production-geometry evidence, not native
  device evidence.
- Browser capture remains blocked and three screenshot groups remain stale. No
  participant learning or physical-touch outcome is inferred.

### Loop 15 Research Question

Which verification documents still present retired UI or mechanics as current,
and how can historical records be preserved while making the present runtime
contract unambiguous for future implementation agents?

## Loop 15 - Verification Document Truth

### Repository Evidence

- `docs/current_surface_contract.md` is the present authority: one shared
  Phaser/Vite runtime, one Wiener speech surface, one canonical feedback card,
  and no detached popup, robot/overseer, or token-strip UI.
- `docs/design_verification_matrix.md`, `docs/phase2_design_audit.md`, and the two
  June browser QA records contain legitimate chronology but repeatedly use
  audit-time terms such as `current`, `latest`, and retired QA IDs.
- The mobile surface/runtime evaluators previously required current elements but
  did not reject retired IDs. Runtime review sidecars could also pass without a
  Wiener speech bubble.
- The local readiness audit required dated PNGs as if they were a current
  preflight package, despite current source and native evidence being newer.

### Delegated Audit Synthesis

- Three independent documentation, QA, and readiness audits converged on a
  scope boundary rather than deletion: current requirements must be explicit;
  dated observations must remain available and clearly historical.
- Four disjoint workers updated provenance/current guidance, mobile surface
  rejection, runtime sidecar rejection, and local-readiness requirements.
- Global word bans were rejected because they would destroy useful historical
  evidence. Tests instead extract and inspect the current snapshot, current
  visible section, removed section, and historical section separately.

### Loop 15 Validation Evidence

- Focused documentation and evaluator suites pass 5 files / 76 tests.
- Full gates pass: 78 regenerated fixtures; 106 files / 941 tests; browser build;
  iOS web build; local package audit; and `git diff --check`.
- XcodeBuildMCP rebuilt/launched the iPhone 17 shell. All ten canonical routes
  were recaptured from the final bundle and pass `mobile:simulator`; the native
  freshness group passes.
- Surface/runtime browser gates still reject old speech/timer, results, Money,
  and boundary-audit evidence. All three browser freshness groups remain failed,
  as intended. No human or physical-device evidence was inferred.

### Loop 16 Research Question

Which current evaluators and operational documents still accept legacy product
identity or describe evidence samples as game modes, and which volatile status
claims should be derived or removed so future agents do not act on stale counts?

## Loop 16 - Evidence Identity, Progression, and Report Truth

### Repository Evidence

- Current playtest-note and rollup evaluators accepted legacy headings and
  `mtt-*` identifiers without a historical scope. This allowed newly generated
  evidence to carry the retired public identity.
- Tutorial has a fixed ten-round syllabus. Endless advances through round five
  and remains uncapped while funds remain; `Endless five-round run works` was
  therefore a sampling instruction incorrectly phrased as a mode contract.
- The mobile optimization report embedded exact test totals, current pass
  language, and `/var/folders` artifacts. Those values age independently of the
  implementation and could contradict the live validators.

### Delegated Audit Synthesis

- Three disjoint audits covered evidence identity, progression semantics, and
  report authority. Three implementation workers then owned the corresponding
  evaluators, tests, and documents.
- The selected boundary is executable current evidence versus dated historical
  provenance. Current generators must use canonical identity; historical files
  are not rewritten.
- A stable five-round recording filename can remain, but its checked meaning is
  a bounded observation sample inside uncapped Endless Training.
- Live commands are the authority for counts and readiness. A narrative report
  can describe implemented behavior and historical evidence, but cannot cache
  mutable pass claims as current truth.

### Loop 16 Validation Evidence

- Focused integration passed 8 files / 117 tests. Full gates passed with 78
  regenerated fixtures and 106 files / 960 tests; browser build, iOS web build,
  local playtest audit, and diff check also pass.
- `playtest:status` correctly reports 0/5. `mobile:validate` correctly fails only
  for absent physical-phone evidence. `mobile:completion` also preserves the
  three stale browser groups as failures.
- XcodeBuildMCP rebuilt/launched the iPhone 17 shell. All ten current routes were
  recaptured and inspected under `.qa/ios-simulator/loop-16-evidence-identity/`;
  simulator evaluation and native freshness pass.
- No participant, physical-touch, audio, haptic, VoiceOver, or comprehension
  outcome is inferred from simulator or repository evidence.

### Loop 17 Research Question

Which physical-device checklist, template, manifest, and evaluator requirements
still encode the retired menu, and what current-screen evidence should replace
them without weakening the fail-closed requirement for actual phone testing?

## Loop 17 - Physical-Device Evidence Contract Truth

### Repository Evidence

- Runtime source and tests establish four menu actions in order: `Tutorial`,
  `Training`, `Token Log`, `Settings`. The menu has no Sound control and compact
  copy uses `Best Rank: <rank> / <rounds>`.
- Settings visibly owns `Sound: On/Off`; storage reloads the muted value on scene
  creation. An immediate label change, hidden QA state, or menu screenshot cannot
  prove persistence because storage fails soft and `Sound: On` is the default.
- The physical checklist, manifest, template, evaluator, and accepted test
  fixture still encoded `Best Record`, a menu Sound control, a bounded Endless
  run, and combined reach evidence.
- Existing evidence validation checked artifact shape and generic prose but
  could accept a retired menu description next to a real file.

### Delegated Audit Synthesis

- Three disjoint audits covered operator instructions, evaluator enforcement,
  and runtime truth. Two workers then owned non-overlapping docs and evaluator
  patches.
- The integration review caught four cross-worker gaps: globally rejecting
  `Endless Training` would reject the current tutorial handoff; Best Rank needed
  a default-menu requirement; five rounds needed continuation evidence; and
  split reach rows needed named controls.
- Stable filenames are provenance identifiers, not visible UI claims. They stay
  unchanged while captions and required evidence use current product language.

### Loop 17 Validation Evidence

- Focused integration passed 4 files / 40 tests. Full gates pass with 78 fixtures
  and 106 files / 969 tests; both builds, local package audit, and diff check pass.
- The live physical validator recognizes all current labels and fails on absent
  phone rows/artifacts only. It requires continuation beyond round five with
  funds remaining, default-menu Best Rank, Settings-based Sound Off before and
  after relaunch, and separate Play/Results reach evidence.
- No physical iOS/iPadOS device is visible to Xcode. The result remains
  incomplete; no physical behavior is inferred.
- XcodeBuildMCP rebuilt/launched the iPhone 17 shell. Ten current routes were
  recaptured and inspected under `.qa/ios-simulator/loop-17-physical-contract/`;
  simulator evaluation and native freshness pass.
- Three browser groups remain stale/failed and are the next locally actionable
  evidence gap.

### Loop 18 Research Question

Can the available Chrome control path produce every current browser screenshot
and QA sidecar required by the menu, surface, runtime, and freshness validators,
and what exact fallback is justified if that attachment path is unavailable?

## Loop 18 - Browser Evidence Recovery Contract

### Capability Evidence

- Chrome extension control attached successfully, proving that browser control
  registration was not the failure. Navigation to the local game was rejected by
  the browser security policy, which also prohibited alternate local addresses,
  file URLs, raw CDP, and alternate-browser workarounds. This is a capture-surface
  boundary, not evidence that the local Vite server or game failed.
- The local server independently returned the game shell, but that same-machine
  check cannot generate canonical screenshots, QA sidecars, touch emulation,
  DPR=1, or reduced-motion evidence.
- The current Google Drive copy of `07_playtest_gates.md` still requires actual
  menu, active, review, and results screenshots for visual readability. It does
  not authorize source inspection or simulator images as browser substitutes.

### Repository Evidence

- `scripts/capture-mobile-cross-reference.ts` owns 32 canonical browser artifacts:
  five menu comparison files, six surface PNG/JSON pairs, and five runtime
  screenshot/sidecar/result triples.
- Menu includes a `368x800` tall route. Active routes require
  `qaCanvasCapture=1`. Results use `mode=protocol-results`; review and round two
  are interaction-derived states, not direct deep links. `qaHoldReview=1` only
  stops auto-advance after a real resolve interaction.
- Runtime QA is emitted as development-only script-node JSON, not a production
  global. Manual Chrome cannot claim touch emulation, device-pixel ratio,
  reduced-motion, finger occlusion, thumb reach, or physical latency unless its
  controlling surface explicitly proves those properties.
- Surface screenshots were previously existence-checked, so a text placeholder
  could satisfy the file inventory. Runtime freshness omitted all five same-stem
  QA sidecars even though substantive runtime validation depends on them.

### Loop 18 Validation Evidence

- The manual handoff is now derived and tested against capture-script routes and
  files. Screenshot evidence checks image format, exact route dimensions, minimum
  bytes, and encoded variation; runtime freshness checks one QA sidecar per image.
- Focused integration passes 3 files / 54 tests. Full gates pass with 78 fixtures,
  106 files / 975 tests, both builds, and the local package audit.
- A load-dependent full-suite failure was traced to redundant real-tokenizer
  construction. Reusing one adapter/encoding per test module reduced the focused
  tokenizer tests to sub-second assertion time without extending timeouts or
  changing generated fixtures.
- A fresh XcodeBuildMCP build and ten-route iPhone 17 capture pass simulator and
  native freshness evaluation. Three initially grey transitional frames were
  rejected during visual inspection and replaced with painted frames.
- Browser menu, surface, and runtime groups remain stale and failed. Current
  failures still identify speech/timer overlap, retired Results evidence, and
  missing Money/boundary-audit evidence in the July 2 sidecars.

### Loop 19 Research Question

Does `Endless Training` communicate a player-relevant uncapped-run promise at the
tutorial handoff, or does it create avoidable vocabulary drift from the approved
`Training` menu and `Run Training Again` results action? Which current project
documents and player-facing surfaces should define the public term?

## Loop 19 - Public Training Vocabulary

### Project and Repository Evidence

- Menu `Training`, tutorial handoff `Start Endless Training`, and Results `Run
  Training Again` all start the same non-tutorial `PlayScene`; the run advances
  without a round cap while funds remain and ends at zero balance or voluntary
  exit. `Endless` therefore names no separate player-facing rule set.
- The current Drive product brief (`1rIptIkT2ojaEL27k-jthZKA3Lg05npqu`) calls the
  product Training and defines zero balance as the session end. The historical
  design spec (`1DpnwhDZCV6ZN-rXxKy9dxJ3DaavdtU36`) used `Endless Training` but
  retained the same zero-balance termination rule. Historical MVP evidence also
  used `Begin Training` / `Run Training Again`.
- The live operator path already uses `mode=endless`; filenames and QA IDs rely
  on that stable internal identifier. Renaming internals would create churn with
  no player benefit.
- `LaunchModeSystem.ts` also retains a legacy `?mode=training` tutorial alias.
  Reassigning it would be a deep-link behavior change, so this loop documents
  the hazard rather than silently changing it.

### External Evidence

- Apple HIG Writing and Labels favor familiar terms, concise action labels, and
  consistent language across a flow:
  <https://developer.apple.com/design/human-interface-guidelines/writing> and
  <https://developer.apple.com/design/human-interface-guidelines/labels>.
- Microsoft Writing Style Guide says the same meaning should use the same word
  and technical terms should be introduced only when useful to the audience:
  <https://learn.microsoft.com/en-us/style-guide/word-choice/> and
  <https://learn.microsoft.com/en-us/style-guide/word-choice/use-technical-terms-carefully>.
- Xbox Accessibility Guideline 112 and WCAG 2.2 consistent identification both
  support stable labels for repeated navigation/components:
  <https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/112>
  and <https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification>.
- Project inference: `Training` is the familiar product term; `uncapped
  Training` is sufficient explanatory prose when the lack of a fixed round cap
  matters. `Endless` adds ambiguity because the balance rule still terminates
  every run.

### Loop 19 Validation Evidence

- Four disjoint implementation workers covered runtime/docs, operator materials,
  playtest evaluators, and physical-device/freshness contracts. An independent
  adversarial verifier then exposed negation and wrong-surface loopholes. Three
  corrective workers hardened playtest and physical evidence and removed dormant
  public-style `Endless` speech without changing identifiers.
- Current handoff evidence must place an affirmative Training action, the
  tutorial-complete surface, and no-prompt/coaching/timing evidence in the same
  clause. Physical-copy checks reject `not visible` current labels but accept
  explicit evidence that retired labels were absent.
- Focused integration passes 13 files / 178 tests. Full gates pass with 78
  regenerated fixtures, 106 files / 1,014 tests, both builds, and local package
  audit.
- Ten final iPhone 17 routes were rebuilt and inspected. Native simulator and
  freshness groups pass; three blocked browser groups stay stale/failed.
- Human criterion remains unmeasured: at least 4/5 should identify Menu,
  Tutorial Cleared, and Results as the same mode without prompting. No
  participant result is claimed.

### Loop 20 Research Question

Does the current `Tutorial Failed` surface communicate a recoverable readiness
gap and obvious retry action, or does its blame-heavy framing create avoidable
onboarding friction? Which alternative preserves WienerWorks' hostile
bureaucracy while supporting educational retry behavior and compact-phone
clarity?

## Loop 20 - Tutorial Failure Diagnosis and Retry

### Learning and UX Evidence

- Hattie and Timperley and Shute support feedback that states the goal, current
  result, and next task/process step rather than evaluating the learner:
  <https://doi.org/10.3102/003465430298487> and
  <https://journals.sagepub.com/doi/10.3102/0034654307313795>.
- Moreno found explanatory feedback improved transfer and reduced cognitive load
  for novices in a discovery-based multimedia game relative to correctness-only
  feedback: <https://eric.ed.gov/?id=EJ732333>. Applying that result to this
  specific game remains a project inference.
- Metcalfe and mastery-learning evidence support recoverable, low-stakes error
  followed by diagnosis and another attempt rather than a stable-ability verdict:
  <https://doi.org/10.1146/annurev-psych-010416-044022> and
  <https://files.eric.ed.gov/fulltext/ED053419.pdf>.
- Apple game onboarding/writing and Xbox XAG 115 favor short instructions,
  action-oriented recovery, and an explanation of what happened and how to
  correct it:
  <https://developer.apple.com/app-store/onboarding-for-games/>,
  <https://developer.apple.com/design/human-interface-guidelines/writing>, and
  <https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/115>.
- Evidence does not justify the stronger claim that `Tutorial Failed` itself
  harms retry. The defensible intervention is diagnostic information before
  restrained hostile flavor.

### Project and Layout Evidence

- Runtime uses a 70% pass predicate based on `correct / (correct + missed +
  false)` when the cut audit is present. Tutorial failure is recoverable in one
  `Retry Tutorial` activation and does not lock Training.
- Drive copy/persona/style authorities preserve technically accurate,
  bureaucratic, faintly irritated language while requiring education before the
  joke. Relevant IDs include copy deck `1FfYMCfldZPVPRXVVrVC5KwVFBtRnF5Fu`,
  product brief `1rIptIkT2ojaEL27k-jthZKA3Lg05npqu`, persona
  `19KvHI_VIYUONiITQTHjZNTQ6005rjt8M`, and style guide
  `1WPNLMZ4rcvE_jB5tEHHNtIbNrqFfs0QJ`.
- Existing `Readiness Not Met` copy was rejected: its title risks wrapping at
  320px and its paragraph still centers failure without adding diagnosis.
- Production geometry at 320x568 leaves 113px from summary center to the primary
  button top. The selected shorter content fits existing layout; title and button
  geometry remain unchanged.

### Loop 20 Validation Evidence

- Three independent research/audit agents covered learning science, mobile game
  UX, repository behavior, and Drive history. One bounded worker implemented the
  content treatment; central review restored canonical `missed boundaries` and
  `false cuts` terminology.
- Four focused geometry/content/QA files pass 49 tests. Full gates pass with 78
  fixtures, 106 files / 1,017 tests, both builds, local package audit, and diff
  check.
- Ten iPhone 17 routes were rebuilt and inspected. The diagnostic failure frame
  is five lines at 368x800 and clears both actions. Native simulator/freshness
  passes; three browser groups remain stale/failed.
- Human gate remains unmeasured: at least 4/5 should identify the failed
  criterion and select Retry within ten seconds; 0/5 should report permanent
  lockout. Five participants are a formative usability gate, not efficacy proof.

### Loop 21 Research Question

Can the existing menu/results semantic bridge and QA model be extended narrowly
to Tutorial Cleared/Failed so exact text and commands are operable and text bounds
reflect rendered wrapping, without misrepresenting the still-canvas-only slicing
loop as accessible?

## Loop 21 - Tutorial Outcome Semantics and QA Truth

### Standards and Platform Evidence

- The HTML canvas standard prefers real HTML elements for headings and requires
  equivalent content and one-to-one focusable alternatives for interactive canvas
  regions: <https://html.spec.whatwg.org/multipage/canvas.html#the-canvas-element>.
  WCAG 2.2 non-text content, relationships, and name/role/value support the same
  narrow outcome counterpart: <https://www.w3.org/TR/WCAG22/#non-text-content>,
  <https://www.w3.org/TR/WCAG22/#info-and-relationships>, and
  <https://www.w3.org/TR/WCAG22/#name-role-value>.
- WCAG focus order/visibility and Apple VoiceOver criteria require logical,
  complete, non-repeating traversal and movement into current content:
  <https://www.w3.org/TR/WCAG22/#focus-order>,
  <https://www.w3.org/TR/WCAG22/#focus-visible>, and
  <https://developer.apple.com/help/app-store-connect/manage-app-accessibility/voiceover-evaluation-criteria>.
- Routine outcome text is not an emergency alert. WAI status-message guidance
  supports a non-disruptive announcement; project inference selected `polite`
  rather than copying the Results screen's assertive treatment:
  <https://www.w3.org/WAI/WCAG22/Understanding/status-messages>.
- WCAG conformance applies to complete pages/processes, and Apple permits a
  VoiceOver declaration only when common tasks are complete. This screen-level
  treatment cannot support either claim while slicing is pointer-only:
  <https://www.w3.org/TR/WCAG22/#conformance-reqs>.

### Project and Geometry Evidence

- Drive history confirms Loop 6 approved one shared semantic runtime for Menu
  and Results while rejecting scene-local DOM, full canvas reconstruction,
  SwiftUI gameplay controls, and broad accessibility claims. Loop 20 left the
  outcome canvas-only and explicitly promoted semantic parity and fixed-height
  QA debt into this research question.
- `TutorialCompleteCopy` already owns status, heading, diagnostic summary, and
  actions. Projecting that object avoids semantic copy drift. The existing
  coordinator already rejects stale epochs/render tokens and repeat activation
  of one action; a scene-level navigation guard is additionally required across
  distinct DOM actions and canvas callbacks.
- The old summary rectangle used wrap width and `3.6 * fontSize`, reporting
  nearly identical heights at 320x568, 368x800, and desktop despite different
  wrapping. Phaser computes text bounds synchronously, so runtime `getBounds()`
  is more truthful than reimplementing its font/wrap algorithm.

### Loop 21 Validation Evidence

- Four research/audit agents covered semantic architecture, rendered geometry,
  authoritative accessibility guidance, and project/Drive history. Two disjoint
  workers implemented semantics and QA; an adversarial reviewer then found and
  verified corrections for stale deferred capture, synthetic 320 geometry,
  untested coordinate conversion, and weak shutdown assertions.
- Focused integration passes 5 files / 33 tests. Full gates pass with 78
  regenerated fixtures, 107 files / 1,028 tests, both builds, local package
  audit, and diff check.
- Twelve final iPhone 17 images include ordinary and QA-visible semantic Tutorial
  Cleared/Failed screens. Exact text/actions are visible and the empty hidden
  details rail is gone. Simulator evaluation and native freshness pass.
- Browser evidence remains stale. A live 320 browser render, real WKWebView
  VoiceOver activation, 200% Larger Text, and physical-device behavior remain
  unverified and are not inferred.

### Loop 22 Research Question

Which next complete non-gameplay task should extend the shared semantic runtime:
read-only Token Log inspection or mutable Settings controls? Can Token Log expose
the exact recent/reference text-to-ID mappings and Back action with one canonical
data authority before the riskier Settings form semantics are attempted?

## Loop 22 - Structured Numerical Token Reference

### Standards and Platform Evidence

- HTML ordered lists represent a sequence whose order changes meaning; that fits
  token chunks paired by position with encoding IDs better than a flat paragraph
  or unordered list. `bdi` isolates unknown-direction fixture text without
  changing it: <https://html.spec.whatwg.org/multipage/grouping-content.html#the-ol-element>
  and <https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-bdi-element>.
- WCAG meaningful sequence, focus order, and reflow support sentence-first,
  token-order traversal, deliberate heading focus on semantic entry, launcher
  focus restoration on return, and vertical reflow at 320 CSS pixels:
  <https://www.w3.org/TR/WCAG22/#meaningful-sequence>,
  <https://www.w3.org/TR/WCAG22/#focus-order>, and
  <https://www.w3.org/TR/WCAG22/#reflow>.
- Static reference content does not need a live announcement. A heading focus is
  less disruptive and exposes the new task boundary without treating three full
  mappings as a status message.
- Apple permits VoiceOver support declarations only after common tasks work on
  supported devices. Simulator-visible HTML and source tests therefore remain
  structural evidence, not a VoiceOver or whole-app accessibility result:
  <https://developer.apple.com/help/app-store-connect/manage-app-accessibility/voiceover-evaluation-criteria>.

### Project, Educational, and Drive Evidence

- The learning sequence already keeps IDs out of prediction, samples one real
  mapping after resolution, and offers Token Log as an optional complete
  reference. Adding numbers to falling submitted fragments would be false when a
  player-created fragment is not a real tokenizer token, and would turn an
  encoding lookup key into apparent score or reward feedback.
- Token Log is a worked-example/reference surface, not retrieval practice. A
  valid formative gate is whether 4/5 users can distinguish Recent from Reference
  and locate the exact ID for a named space-bearing chunk without coaching; that
  cannot establish durable learning or transfer.
- `TokenLogSystem` already resolves recent fixture IDs against current fixture
  truth and preserves curated fallback order. Raw `token_strings` and
  `token_ids` must stay paired by index; the formatted mapping string must never
  be reparsed as a second data authority.
- Four independent audits selected Token Log over Settings. Settings interleaves
  mutable controls and status, and `clearHighScore()` currently swallows storage
  failure while the scene reports a successful reset. Semantic Settings is
  deferred until reset returns a truthful result, destructive confirmation is
  shared by canvas/DOM, and the runtime supports ordered controls and status.
- Drive optimization logs, current surface contract, shell notes, copy deck, and
  comprehension probe confirm that semantic Token Log/Settings were previously
  undecided while the visual screens and one shared semantic runtime were
  approved. Relevant file IDs include `1w2MvegdC3hUU0hUxXlbSMTkpsD9RCehY`,
  `1cqAvxYUFwP_ZCp6jUr53I9ucrVMsOYv5`, `1lbwvRLlYssyIIqhJ_-4XMqfUUsI9AV7v`,
  `1CEmBe7Tu1SOB5JD9infymaB_oqa2-y_5`, and
  `1FGvsaVyWNTXTY_CzJ0B40QeG72PngSmV`.

### Selected Intervention and Claim Boundary

- Extend the existing game-level surface with structured sentence groups and
  ordered token-text/ID pairs. Explicitly describe SPACE, TAB, and LINE FEED;
  do not depend on pronunciation of `␠`, `[tab]`, or `[newline]`.
- Preserve the canvas Token Log exactly and route both Back controls through one
  guarded scene command. Focus the Token Log heading only when entered from the
  semantic Menu action; restore focus to that launcher only on semantic return.
- Add no score, reward, rarity, cost, rank, confidence, or gameplay meaning to
  token IDs. No fixtures, prediction input, scoring, economy, progression,
  persistence, or visual gameplay changes belong in this loop.
- Permitted claim after validation: the Token Log has a structured HTML
  counterpart with ordered `cl100k_base` mappings and keyboard-operable Back.
  VoiceOver activation, 200% text resize, physical-device behavior, WCAG
  conformance, and the canvas slicing task remain unproven until separately
  observed.

### Loop 22 Validation Evidence

- Three disjoint implementation workers extended the shared semantic renderer,
  canonical token/ID projection, and scene focus/navigation integration. The
  final implementation keeps raw token strings and fixture IDs paired by index,
  describes all Unicode White_Space code points explicitly, and never reparses
  the visual mapping string.
- An adversarial review found four evidence/claim problems: the missing native
  Token Log frame, reusable identical screenshots, unsupported broad whitespace
  wording, and an unproven 320px/200% reflow criterion. The first three were
  corrected. The fourth remains explicitly open rather than being converted
  into a source-test pass.
- The native evaluator now requires eight ordinary and five semantic route
  frames, rejects duplicate encoded route images, and requires VoiceOver
  activation to remain false. It still does not recognize screen content;
  visual inspection remains the content authority.
- 78 fixtures regenerated; 109 files / 1,045 tests pass. Browser and iOS web
  builds and the local package audit pass. Fourteen iPhone 17 frames under
  `.qa/ios-simulator/loop-22-structured-token-log/` include all required routes
  plus a scrolled Token Log bottom state showing the final mapping and Back.
- `npm run mobile:simulator` passes and native freshness passes. The three
  browser groups remain stale and failed. XcodeBuildMCP exposes the WKWebView as
  one scroll area with zero actionable descendants, so VoiceOver discovery and
  activation remain unproven.
- The participant gate remains unmeasured: at least 4/5 novices must distinguish
  Recent from Reference and retrieve the exact ID for a named space-bearing
  chunk without coaching. This is reference-use evidence, not durable learning.

### Loop 23 Research Question

What is the smallest truthful and recoverable Reset Best Rank flow? Should this
loop only make `clearHighScore` report verified storage success/failure, or does
the touch-facing destructive action also require confirmation or undo before a
future semantic Settings form can expose it safely?

## Loop 23 - Truthful Best Rank Reset

### Primary Guidance And Decision

- Apple distinguishes common, undoable deletion from uncommon destructive
  actions that cannot be undone. The latter warrants a sparse confirmation:
  <https://developer.apple.com/design/human-interface-guidelines/alerts>.
- Apple also says a destructive action must not receive the primary role; the
  selected layout therefore places neutral `Cancel` before the visually
  destructive `Reset Rank`:
  <https://developer.apple.com/design/human-interface-guidelines/buttons>.
- A timed Undo was rejected. Apple expects undo results to be predictable and
  visible, while this rare reset would require a temporary copy of the complete
  former record to survive navigation and relaunch:
  <https://developer.apple.com/design/human-interface-guidelines/undo-and-redo>.
- WAI's modal-dialog pattern informs the future semantic Settings treatment:
  focus must enter the dialog, remain contained, Escape must close it, and focus
  must return to the invoker. The current canvas confirmation does not claim
  those keyboard or assistive-technology behaviors:
  <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>.

### Repository And History Evidence

- `SettingsScene` previously called `clearHighScore()` and immediately printed
  `Regex Intern / 0 rounds`. `clearHighScore(): void` swallowed unavailable,
  write, and partial legacy-key failures, so the visible claim had no evidence.
- The app reads one canonical and two legacy high-score keys. If canonical
  deletion succeeded while a legacy deletion failed, the next load could
  restore the surviving record through migration. A single no-throw deletion
  result was therefore insufficient.
- Drive history confirmed that Reset Best Rank must preserve recent Token Log,
  Sound, reduced-motion reporting, and Haptics. It had not approved confirmation
  or undo; Loop 23 resolved that open decision from the primary guidance and the
  current one-tap risk.
- Four research tracks were launched. Two returned usable repository/history
  and consumer-UX syntheses; two did not terminate before the research window
  closed and were replaced by direct repository and primary-source inspection.

### Selected Contract And Evidence Boundary

- First activation only enters `confirming`; Cancel returns to idle without a
  storage call. Confirm can call storage once and publishes `cleared`,
  `already-clear`, or `unavailable`.
- Storage reads every high-score key before and after the attempt, continues
  after an individual deletion failure, and reports success only when all
  readbacks are available and absent or empty. A surviving valid record is
  returned for truthful failure copy; invalid or unreadable residue cannot be
  presented as a reset rank.
- The 320x568, 368x552, safe-area 390x844, and 1280x720 geometry contracts keep
  the dialog and both 48px actions contained and non-overlapping.
- XcodeBuildMCP rebuilt the iPhone 17 shell. Fourteen required route frames under
  `.qa/ios-simulator/loop-23-truthful-best-rank-reset/` were visually inspected;
  the confirmation copy and actions fit the safe area. The direct QA route proves
  rendering only. WKWebView still exposed zero actionable canvas descendants,
  so pointer activation, Cancel, confirmed deletion, and failure-state rendering
  remain explicitly unproven on Simulator.
- Formative external criterion: at least 4/5 seeded-phone participants must state
  what will be erased, cancel once, then intentionally reset within five seconds;
  no record may clear on the first activation, and all five must find Token Log,
  Sound, and Haptics unchanged.

### Loop 24 Research Question

Can the now-truthful Settings command model be projected through the shared
semantic runtime as one complete form, including Sound, effective motion status,
capability-aware Haptics, the two-step reset dialog, failure feedback, and Back,
without duplicating preference/storage authority or implying accessible slicing?

## Loop 24 - Complete Semantic Settings Research

### Primary Guidance

- WAI's modal and alert-dialog patterns require labelled dialog content,
  initial focus inside, contained Tab order, Escape dismissal, and focus return:
  <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/> and
  <https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/>.
- `aria-modal` describes modality but does not make background content inert:
  <https://www.w3.org/TR/wai-aria-1.2/#aria-modal>.
- Sound and available Haptics are binary settings with stable names and switch
  state, not changing button names:
  <https://www.w3.org/WAI/ARIA/apg/patterns/switch/> and
  <https://developer.apple.com/design/human-interface-guidelines/toggles>.
- Native switch state supplies name/role/value feedback; ordinary toggles should
  not also generate duplicate live announcements:
  <https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html>.
- Verified reset outcomes are status messages; failure is assertive while
  success/already-clear are polite:
  <https://www.w3.org/WAI/WCAG22/Understanding/status-messages>.
- `prefers-reduced-motion: no-preference` reports the absence of a reduce
  request, not direct proof of an OS switch. Settings therefore reports the
  app's effective treatment without claiming native support:
  <https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion>.

### Repository And Drive Findings

- The semantic runtime supports stable buttons and structured read-only groups,
  but no typed switch, modal subtree, focus trap, or Escape route. Settings has
  no lease and creates a redundant local Haptics fallback despite Game
  registering the canonical runtime before scene creation.
- Drive IDs `1CEmBe7Tu1SOB5JD9infymaB_oqa2-y_5`,
  `1iSs3Dm8koZzvI5ZXT-ipyOR2OUo3u0DN`,
  `1eT4AgVQ9ZLOAhr131uKGoeFqHaeQUXDE`,
  `1cqAvxYUFwP_ZCp6jUr53I9ucrVMsOYv5`, and
  `1lbwvRLlYssyIIqhJ_-4XMqfUUsI9AV7v` confirm that Settings,
  persistent Sound, system-derived motion, independent capability-aware
  Haptics, and two-step verified reset are approved authorities.
- Drive history explicitly leaves semantic Settings, VoiceOver activation,
  physical haptic behavior, reduced-motion device observation, and participant
  evidence open. Mobile expectations are platform/project requirements, not
  consumer-study results.

### Selected Contract

- Add one pure Settings semantic projection. It receives existing snapshots and
  emits stable Sound/Haptics switches, reduced-motion and rank status, Reset,
  and Back, or a modal-only Cancel/Reset Rank state.
- Use explicit target setters for Sound/Haptics and one-shot navigation. Opening
  reset focuses Cancel; Cancel/Confirm return focus to Reset Best Rank; semantic
  Back restores the Menu Settings launcher.
- Do not add stored reduced-motion state, DOM-owned persistence, a second
  Haptics runtime, broad accessibility claims, or any slicing semantics.

### Implementation Evidence And Limits

- The shared runtime now supports typed switch/status controls and a nested
  alert-dialog projection. Its coordinator exposes only dialog actions while
  the dialog is present, rejects stale render-token actions, and suppresses
  duplicate announcements until a genuinely new status is published.
- Settings requires the game-owned Haptics runtime and projects canonical
  audio, motion, Haptics, rank/reset, and storage snapshots. Canvas callbacks
  capture an explicit target from their render state; semantic switches set an
  explicit target from current state. Neither path uses `toggleMuted`, direct
  storage deletion, or a scene-local Haptics authority.
- Structural tests cover stable switch names/state, static unavailable Haptics,
  inert modal background, labelled dialog content, Cancel-first focus, Tab
  cycling, Escape dismissal, focus return, one-shot Back, motion-status
  announcement, and semantic Menu focus restoration. The test environment does
  not constitute a browser or VoiceOver interaction run.
- XcodeBuildMCP rebuilt the final bundle on iPhone 17 / iOS 26.5. Sixteen fresh
  route frames in `.qa/ios-simulator/loop-24-semantic-settings-v3/` include
  semantic Settings and its confirmation dialog. Both fit 368x800; the
  simulator gate passes 17 checked files and native freshness passes.
- The current WKWebView snapshot still cannot expose actionable descendants.
  The manifest therefore records visible projection only and explicitly keeps
  keyboard activation, VoiceOver activation, physical touch/haptics, confirmed
  deletion, and failure-state rendering unproven. Three browser evidence groups
  remain stale rather than being refreshed by timestamp manipulation.

### Adversarial Findings Resolved

- A true modal is now limited to semantic activation: it focuses Cancel and
  makes sibling canvas content inert. Pointer-origin confirmation keeps the
  semantic mirror nonmodal, so hidden DOM does not claim modality or steal focus.
- Checkbox change events forward actual checked state through the coordinator;
  Settings target setters no longer reconstruct a request by inversion.
- Menu pointer activation uses the same-pointer guard. Reset announcements are
  scene-queued one-shots, allowing later motion changes to announce normally.
- The native evaluator no longer treats a manifest boolean plus opaque image
  bytes as proof of visible Settings content. Manual frame inspection is recorded
  separately, while the manifest must state automatic visual proof is false.
- Freshness now includes AudioSystem, HapticFeedbackSystem, and RankSystem.
  A second read-only review found all six original issues resolved.

### Loop 24 Final Evidence And Decision

- Fixture regeneration, 115 files / 1,115 tests, TypeScript, browser and iOS
  builds, the local playtest audit, and diff check pass. The bundled iOS assets
  match a clean post-regeneration build byte for byte.
- XcodeBuildMCP launched the final bundle before sixteen iPhone 17 frames were
  captured in `.qa/ios-simulator/loop-24-semantic-settings-v3/`. The 17-file
  simulator gate and native freshness pass; all three browser evidence groups
  remain stale and failed.
- Keep the implementation with bounded claims. The evidence supports shared
  semantic commands and structural dialog behavior, not VoiceOver, physical
  touch/haptics, 200% text, storage-failure rendering, participant outcomes, or
  accessible slicing.

### Loop 25 Research Question

Should every non-play canvas command require the same pointer to press and
release its control, with release-outside cancellation, so mobile navigation
cannot be triggered by a drag or a release that began elsewhere?

## Loop 25 - Trustworthy Non-Play Pointer Activation Research

### Primary Guidance

- [WCAG 2.2 SC 2.5.2](https://www.w3.org/TR/WCAG22/#pointer-cancellation)
  requires ordinary single-pointer functions to avoid completion on down, offer
  abort/undo, reverse on up, or establish that down activation is essential.
  It does not normatively require a same-pointer token.
- The informative [Understanding Pointer Cancellation](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation)
  and [G212 technique](https://www.w3.org/WAI/WCAG22/Techniques/general/G212)
  describe the expected simple-control behavior: immediate pressed feedback,
  completion on release inside the initial target, and cancellation by moving
  away before release.
- [Phaser 3.90 input-event documentation](https://docs.phaser.io/api-documentation/3.90.0/namespace/input-events)
  states that a Game Object `pointerup` means only that release occurred while
  over that object. It does not prove where the gesture began. The same reference
  defines `pointerupoutside` on the Scene Input Plugin, not on a Game Object.
- Phaser's [3.90 InputPlugin source](https://github.com/phaserjs/phaser/blob/v3.90.0/src/input/InputPlugin.js#L766-L770)
  routes touch cancellation through up-event processing. Project code must
  therefore reject `Pointer.wasCanceled` rather than treating every matching
  release as activation.

### Repository Findings And Project Inference

- Results, Tutorial Complete/Failed, and Token Log previously executed whichever
  control was under the pointer at release, even when the press began elsewhere.
- Menu and Settings tracked pointer IDs but attached `pointerupoutside` to each
  rectangle. Phaser does not dispatch that event from Game Objects, so the test
  asserted an ineffective listener and canvas-exit ownership could become stale.
- The game enables three active pointers. Per-control first-pointer ownership
  prevents another finger from changing that control's pressed visual or acting
  through it. Non-primary mouse buttons are not ordinary button activation.
  A separate Results lifecycle/operation token prevents overlapping Copy Summary
  work and stops a clipboard completion from an earlier Results lifecycle from
  mutating a recreated scene. Gesture start time prevents a reused pointer slot
  from satisfying stale ownership.
- This inference applies to ordinary non-play buttons only. The PlayScene controls
  share the slicing pointer stream and require a separate mechanic-sensitive
  audit; no gameplay input belongs in this intervention.

### Selected Contract And Claim Boundary

- One shared canvas-button binding owns press/hover/rest feedback, same-pointer
  and same-gesture validation, first-pointer ownership, touch-cancel rejection,
  primary-mouse-button filtering, release-outside/game-out cancellation, and
  listener disposal on button destroy.
- Each of the five non-play scenes supplies its existing visual palette and
  canonical command. Semantic actions continue to call those commands directly
  and do not require a canvas pointer gesture.
- Button order, labels, geometry, navigation payloads, audio commands, semantic
  focus behavior, tokenizer truth, slicing, score, economy, rank, progression,
  storage, and session flow remain unchanged.
- Permitted claim after validation: non-play canvas buttons use a consistent,
  tested release-and-cancel contract. Do not claim WCAG conformance, physical
  touch quality, or corrected PlayScene control behavior from this source work.

### Loop 25 Final Evidence And Decision

- Adversarial review found and the implementation resolved touch down/over
  visual ordering, non-primary mouse activation, a cross-lifecycle Results copy
  race, missing behavioral race coverage, and incomplete freshness provenance.
- Fixture regeneration produced 78 fixtures. The final suite passes 117 files /
  1,139 tests; browser and iOS production builds, TypeScript, local audit, and
  diff check pass.
- XcodeBuildMCP launched the current bundle on iPhone 17 / iOS 26.5 before the
  sixteen-route `.qa/ios-simulator/loop-25-pointer-activation-v3/` capture. The
  17-file native gate and native freshness pass; all three browser evidence
  groups remain stale.
- Keep with bounded claims. Tests establish the non-play activation state
  machine and Results async lifecycle behavior. Simulator frames establish
  current native rendering, not physical touch feel, accessibility conformance,
  or PlayScene control correctness.

### Loop 26 Research Question

How should Sound, Clear, Exit, Resolve, and the slicing stream share pointer
ownership so a control gesture cannot become a cut, a slice cannot become a
command, and a second or canceled pointer cannot terminate the first gesture?

## Loop 26 - Play Control And Slice Ownership Research

### Primary Guidance

- [WCAG 2.2 SC 2.5.2](https://www.w3.org/TR/WCAG22/#pointer-cancellation)
  and its [Understanding document](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation)
  support release activation with an abort path for ordinary single-pointer
  controls; this does not establish slicing accessibility under other criteria.
- [Pointer Events](https://www.w3.org/TR/pointerevents/#the-pointercancel-event)
  and [Touch Events](https://www.w3.org/TR/touch-events/#the-touchcancel-event)
  define cancellation as a terminal interruption, not a successful release.
  Pointer/touch IDs may be reused after a contact ends, so ID alone is not a
  durable gesture identity.
- Phaser 3.90 [input events](https://docs.phaser.io/api-documentation/3.90.0/namespace/input-events)
  and [`InputPlugin.processUpEvents`](https://github.com/phaserjs/phaser/blob/v3.90.0/src/input/InputPlugin.js#L2021-L2078)
  confirm that GameObject `pointerup` is release-time hit testing, not proof of
  press origin. Phaser routes touch cancel through that up pipeline.
- Phaser GameObject events precede Scene pointer events. Stopping propagation on
  a button would also suppress the scene-level slice cleanup, so propagation is
  not the correct ownership boundary.

### Repository Findings

- Four controls act from independent release listeners while the same pointer is
  simultaneously consumed by the global slicing handlers. Release-without-press,
  cross-control release, and canceled touch can therefore execute commands.
- `lastPointerPoint`, cut-session state, gesture sets, and input-feel metrics are
  shared. With three configured pointers, a secondary finger can sample or end
  the first finger's gesture.
- Control down currently reaches `applyPointerCutSample`, polluting gesture/sample
  metrics even when no cut is staged. Touch down then over also replaces pressed
  feedback with hover.
- `gameout` emits timestamp/event rather than a Pointer, but the current common
  terminal handler treats its first argument as a pointer and may read invalid
  coordinates.
- A separate desktop control-order mismatch was observed. It is outside this
  input intervention because changing geometry and behavior together would make
  the causal claim ambiguous.

### Selected Contract And Claim Boundary

- One PlayScene-specific router owns exactly one active gesture across slicing
  and all four controls, identified by pointer ID plus down time.
- A control-origin gesture remains excluded from slicing through terminal release,
  even after pointerout cancels its action. A slice-origin gesture retains current
  samples and release sampling but cannot activate a release target.
- Secondary, wrong-button, cross-control, and canceled gestures cannot mutate or
  terminate the owner. Touch cancel and gameout end transient state without a
  final sample or command.
- Existing cut thresholds, `CutInputSessionSystem`, scoring, economics, tutorial
  dwell, commands, keyboard routes, labels, geometry, and QA IDs remain unchanged.
- Permitted claim after validation: tested single-owner routing separates current
  PlayScene controls from slicing. Do not claim physical touch quality, general
  accessibility conformance, or multi-user/multi-slice support.

### Loop 26 Adversarial Findings And Corrections

- The first implementation cleared ownership on canvas exit but allowed a held
  pointer move to create a new slice after re-entry. Slice ownership can now
  begin only from the Scene pointer-down route; pointer move can only continue a
  matching slice.
- Keyboard Clear could empty staged cuts while leaving the held slice session
  alive, allowing release sampling to add a cut again. Clear now cancels the
  owner and resets every transient slice field before changing the cut set.
- Shutdown and round start did not both terminate private
  `CutInputSessionSystem` state. A shared transient reset now runs on focus
  interruption, round start, Clear, and shutdown.
- A rejected secondary pointer previously changed the run modality before router
  rejection, which could change later haptic behavior and QA evidence. Modality
  now updates only after the pointer is accepted as the matching owner.
- The reviewer reproduced all four failures, then reran the same sequences after
  correction. Re-entry remained blocked, Clear stayed `[2] -> []`, scene reuse
  returned the fresh `[3]` cut rather than stale `[2,3]`, and a secondary
  touch left a mouse-owned slice classified as mouse.

### Loop 26 Final Evidence And Decision

- Fixture regeneration produced 78 fixtures. Final validation passes TypeScript,
  120 files / 1,163 tests, browser and iOS production builds, local playtest
  audit, and diff check.
- XcodeBuildMCP built, installed, and launched the corrected bundle on iPhone 17
  / iOS 26.5. Sixteen current routes in
  `.qa/ios-simulator/loop-26-play-input-routing/` passed the 17-file gate and
  were promoted to `.qa/ios-simulator/latest/`.
- Native freshness passes. The three historical browser comparison groups remain
  stale and fail closed. Simulator images establish current rendering, not
  physical touch, WebKit gesture quality, audio/haptic output, VoiceOver
  activation, or accessibility conformance.
- Keep Loop 26 with bounded claims. No tokenizer fixture, cut/snap threshold,
  scoring/economy rule, progression threshold, persistence path, tutorial flow,
  label, or layout geometry changed.

### Loop 27 Research Question

How should real `cl100k_base` token IDs enter resolved-round evidence and the
Token Log so players learn the text-token-ID relationship without turning active
prediction or falling fragments into unreadable numerical noise?
