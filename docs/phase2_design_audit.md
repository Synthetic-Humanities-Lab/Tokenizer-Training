# Phase 2 Design Audit

## Reading-Derived Quality Standard

Status: newly formalized.

The project now has a design-principles layer derived from Zubek, Swink, Tufte, Flanagan, and Isbister. The standard is not "more features"; it is embodiment of the loop as lesson and critique:

- Zubek: each system must strengthen prompt, prediction, evidence, consequence, continuation.
- Swink: swipe input must feel immediate, precise, and trusted.
- Tufte: review and HUD information must show evidence without distortion or distracting chrome.
- Flanagan: the cost-recovery training frame must operate through rules, economy, and role, not only jokes.
- Isbister: the player must feel agency, error, pressure, and recovery through action.

Current evidence: the core loop, tutorial, economy, responsive layout tests, fixture validation, cut feedback, degraded assistant-browser shell across menu/play/handoff/results, tutorial robot popup, near-action robot comments, earlier desktop/portrait mobile browser screenshots for the main menu/play/review/results states, browser-readable QA snapshots for PlayScene active/review states, protocol results, and the tutorial-complete handoff, and app-authored Phaser canvas PNG captures in `docs/browser_qa/` support this standard. `docs/browser_qa_2026-06-06.md` records the in-app Browser QA snapshot pass, canvas-raster workaround, and follow-up compact portrait review check. `docs/browser_qa_2026-06-07.md` records a later live route/interaction smoke, a follow-up implementation check after the visual/tutorial/input changes, current valid browser-canvas PNGs for desktop menu/review/handoff/results plus portrait active/results states, a `qaFreezeElapsedMs` QA-link pass with frozen active tutorial PNGs for desktop, portrait, and `320x568` small-phone layouts, and `2026-06-07-continuation-canvas-menu.png` as a fresh current menu raster reconstructed one chunk at a time with a complete PNG terminator. Missing evidence: real touch-device playtest notes and user comprehension tests against the playtest gates in `docs/game_design_concepts/07_playtest_gates.md`. Direct `Page.captureScreenshot` capture still times out or is unavailable in the latest tool path, so canvas rasters and snapshot geometry remain internal evidence rather than real-device proof.

## Core Loop

Status: coherent for a vertical slice.

The loop now runs through fixture-backed text presentation, swipe cuts, resolution, technical/economic feedback, balance changes, and session termination. The actual token strings are shown after resolution, which makes the tokenization lesson visible instead of implied only by boundary lines.

Risk: the fixture corpus is still bounded by the safe grapheme-display filter, but it has been expanded to 78 checked-in `cl100k_base` fixtures with byte-to-grapheme validation and stronger tier/category variety coverage across economy/labor prose, punctuation, currency, IDs, local infrastructure strings, symbolic strings, leading spaces, and multilingual examples.

## Tutorial Clarity

Status: improved for the current vertical slice.

The main menu now names the player verb before the tutorial begins: swipe through text to place tokenizer boundary cuts. This keeps the obsolete AI-browser frame while reducing the chance that a new player reads the first screen as only satire or generic training copy.

The tutorial now has five slower interactive rounds inside the training scene: simple words, spaces, punctuation/contractions, dense strings, and economy/loss condition. Completing the fifth round routes to a tutorial-complete handoff with a primary Endless Training action, so the player is not dropped back to an ambiguous menu state. Tutorial stats are reset before endless training, so the real run is not polluted by guided practice.

The first two rounds remain worked examples with amber target hints. Later rounds remove target answers but now name the concrete features to inspect: apostrophes and final punctuation, URL dots/slashes/chunks, and dollar/decimal token splits. Each tutorial round now sequences robot-supervisor narrative, mechanics, byte-route, token-ID, work-rule, technical follow-up, and review windows: the player is told why the robot is supervising the work, what tokenization operation is being practiced, how UTF-8 bytes and learned merges become chunks, that the model receives token IDs rather than words, and what the resolved evidence shows. Each tutorial window is also mirrored as a short near-text robot comment so the player does not have to monitor only the bottom overseer panel. Tests keep these no-target-hint prompts specific and short enough for the overseer panel, separately cover the popup copy, and keep the longer guided-round popup timeline clear of the moving text, controls, and overseer.

Risk: the copy is more explicit, but only user sessions can prove whether players transfer from worked examples to unaided prediction without facilitator explanation.

## Game Feel

Status: improved.

Swipes now leave a visible trail, near-slot aim feedback previews the legal slot before it enters the actual snap threshold, cuts snap into persistent markers, correct cuts flash, and missed/false cuts are labelled separately. Legal cut slots are distinct from early tutorial target hints. Clear Cuts now produces a short robot confirmation that staged cuts were removed before cost was filed, making recovery visible instead of silent. Prompt motion is continuous and duration-scaled from the lower playfield toward the top edge; tutorial instructions no longer pause the sentence in the middle. The cut trail is now gated to the vertical text cut band and treated as active-phase-only, so clicking Resolve after a swipe no longer draws a stale diagonal trail from the sentence to the control row, redraw bails out during review, and resolution clears the trail before audit evidence appears. Procedural placeholder audio covers cuts, resolution, success, failure, and UI toggling, with a persisted mute setting.

The first-user responsive sweep now also requires menu, play, tutorial-handoff,
and results actions to meet a 44px minimum touch target. PlayScene Resolve,
Clear, Sound, and Exit controls use that floor directly, and tutorial popup
placement reads the same compact control-row constants instead of relying on a
stale 40px assumption. PlayScene browser QA snapshots also publish per-control
touch-target pass/fail flags, so automation can catch regressions even when
raster screenshot capture is unavailable.

Risk: snap positions still assume monospace single-line text bounds. The game exposes every non-post-space grapheme gap so false cuts remain possible while ordinary spaces avoid duplicate pre/post-space targets. The input session suppresses endpoint-near snap additions after a segment has already crossed a slot, collapses ambiguous near-space following-boundary candidates into the centered space-run cut, prevents ordinary word-internal follow-up cuts once that space-run cut is already staged, removes staged ordinary-word duplicates when a restarted gesture returns to that space-run cut, and still allows deliberate non-word following-token cuts such as currency or punctuation made away from the blank run. This prevents the common "one swipe near a space makes two cuts" error without muting later punctuation, currency, or subword cuts. Candidate strings are rejected when tokenizer byte boundaries do not map cleanly onto grapheme boundaries, so broad arbitrary Unicode input is still out of scope.

Follow-up tests now also cover multi-sample gesture order: a same-gesture cut
after the centered space-run slot suppresses the following word-boundary
overshoot, a gesture that first stages the following word overshoot is replaced
when it crosses back through the centered space-run slot, a separate later
ordinary-word gesture is now suppressed once the centered space-run cut exists,
and a return-to-space gesture removes ordinary-word duplicates without touching
non-word token cuts. Later tests add a compact currency-like example to prove
that a deliberate non-word following-token cut after a space-run remains
selectable. This keeps the fix
local to accidental space slicing rather than muting legitimate later cuts.

## Difficulty Ramp

Status: functional.

Difficulty now ramps through shorter timers, higher tier caps, and fixture selection biased toward the highest unlocked tier while avoiding immediate fixture/category repeats. Tier 3 dense strings unlock by round 8 while keeping the timer above seven seconds for readability.

Risk: the corpus is broader than the original 21-fixture slice and now covers 78 safe examples, but real sessions still need to show whether longer play repeats categories before the economy fully explores the progression curve.

## Economy And Rank

Status: locally bracketed, pending user evidence.

Rounds update pay, company cost, net balance, total pay, total cost, accuracy, cost efficiency, and rank. High score storage now preserves rank metadata and mute preference locally.

The scoring formula now pays for correct cut boundaries plus a steep accuracy bonus instead of awarding a large base payout for merely resolving a round. Missed boundaries cost more than false cuts, token load remains a visible surcharge, repeated non-play still fails after onboarding, over-cutting fails early, and a sustained half-complete strategy drains by the dense tier-three transition in tests.

The HUD now shows pay and company cost only in review state, when they refer to the round just resolved. Active and paused rounds display zeroed pay/cost fields so stale accounting from the previous round does not masquerade as current-round evidence. The review feedback audit now also files the resulting balance beside the boundary audit, marks low balances as `low`, and marks exhausted balances as `closed`, making the round's net consequence visible before the next prompt or result transition arrives.

Risk: economic tuning is still provisional until user sessions show whether players understand pay, cost, net, and balance without facilitator explanation. The local strategy envelope in `docs/economy_tuning_audit.md` now brackets no-play, overcutting, half-complete play, near-perfect play, and perfect play so the production scoring curve cannot drift without tests. Perfect play can still sustain a long session by design. Voluntary quit now uses a distinct suspended-training result instead of the budget-failure copy.

## Playtest Readiness

Status: browser smoke-tested, not yet proven for user-base playtest.

The game is ready for internal structured playtest, but not yet verified as user-base ready. The remaining proof needs:

- at least one real touch-device pass for finger occlusion and snap trust
- observed first-action comprehension in tutorial mode
- observed understanding of pay, cost, net, and balance after review
- observed recognition that tokenization differs from ordinary word reading
- notes on whether the critical labor frame is legible through play

Current playtest artifacts:

- `docs/user_playtest_protocol.md`
- `docs/playtest_facilitator_card.md`
- `docs/playtest_day_checklist.md`
- `docs/playtest_session_notes_template.md`
- `docs/playtest_rollup_template.md`
- `docs/design_verification_matrix.md`
- pre-session fixture/test/build/local-evidence preflight through `npm run
  playtest:preflight`, including `npm run playtest:audit:local` for the local
  reading/principle/protocol/browser-QA package without requiring completed
  session notes
- non-overwriting five-session note scaffolding through `npm run playtest:notes`
- per-note completion triage through `npm run playtest:status`, with rollup
  readiness blocked until a completed real phone/tablet touch note with
  `Network: LAN` and a non-localhost Launch URL exists, and with
  observation/pass-criteria contradictions treated as incomplete pass-criteria
  evidence before rollup
- next-session target and mobile-gate operator guidance through
  `npm run playtest:brief`, including a physical-device sanity check for the
  actual phone/tablet Recommended tester launch URL before the tester arrives;
  the brief now probes the requested strict port, keeps it only when a
  candidate reset-safe launch URL is already serving the game shell and can be
  used for the next note, probes Network-host launch URLs when the required
  mobile note is next and localhost proof appears first, treats failed
  Network-host checks as same-machine-only, falls back to same-machine metadata
  only as non-mobile evidence, switches its serve command and planned launch
  URL to a suggested free port when the listener is the wrong app, does not
  answer, or serves same-machine only for the required mobile note, and
  suppresses copy-ready metadata for that suggested port until launch-check
  passes on the exact host
- post-server launch verification through `npm run playtest:launch-check`,
  which fetches the selected reset-safe launch URL, checks the
  `Tokenizer Training` title and `game-root` shell, probes
  same-machine candidates before stale LAN candidates when no explicit host is
  provided, diagnoses failed explicit LAN checks with a same-machine same-port
  probe that points operators toward trusted-network, exact Network-URL-host,
  and macOS firewall or VPN issues, prints the same metadata boundary, and
  explicitly does not replace physical-device evidence
- five-note gate evaluation through `npm run playtest:evaluate`, including
  rejection of blank or placeholder session metadata and blank or bare debrief
  answers
- concrete mobile readability evidence validation through `npm run playtest:evaluate`,
  including rejection of same-machine or localhost mobile metadata and mobile
  passes that do not name a screenshot, photo, screen recording, observer note,
  readable surface, clipping, overlap, or finger-occlusion observation
- final readiness audit through `npm run playtest:audit`, which checks the
  local reading/concept/principle/QA package and exits non-zero until the five
  completed session notes and completed rollup pass their validators
- direct launch links through `?mode=tutorial`, `?mode=endless`, `?mode=tutorial-complete`, `?mode=results`, and `?mode=protocol-results`
- controlled tester reset through `?playtestReset=1`
- strict same-network touch-device serving through `npm run playtest:serve:lan`
- pre-server strict-port and LAN-host checks through `npm run playtest:doctor`,
  which keeps an occupied requested port when the reset-safe launch URL proves
  it is already serving the game shell and can be used for the next note, and
  treats same-machine proof as non-mobile evidence
- reset-safe local/LAN playtest link printing through `npm run playtest:links`,
  with launch metadata labelled as planned setup rather than copy-ready session
  metadata until brief or launch-check verifies the exact running host
- internal visual QA link printing through `npm run playtest:qa-links`, with
  `qaViewport`/`qaFreezeElapsedMs` URLs kept separate from tester launch and
  real mobile evidence
- tutorial-complete handoff into Endless Training
- dev-only browser QA snapshots for MenuScene first-action state, PlayScene active/review state, ResultsScene evidence state, and the tutorial-complete handoff at desktop and portrait mobile viewports; see `docs/browser_qa_2026-06-06.md` for the latest route/state snapshot pass and screenshot limitation
- first-user responsive surface sweep tests covering menu, play active/review, tutorial review popup and feedback, tutorial-complete handoff, and results from `320x568` small phone through `768x1024` tablet portrait
- dev-only app-authored Phaser canvas capture through `tokenizer-training-canvas-qa`, producing persistent PNGs in `docs/browser_qa/` for desktop menu, tutorial active/review, tutorial-complete, protocol-results, and portrait tutorial active/review states
- continuation menu raster evidence in `docs/browser_qa/2026-06-07-continuation-canvas-menu.png`, reconstructed from numbered canvas-data chunks rather than one large DOM read
- dev-only `qaFreezeElapsedMs` active-round clock control plus
  `npm run playtest:qa-links`, producing persistent frozen active-state PNGs
  for desktop, portrait, and small-phone tutorial layouts where continuous
  sentence motion would otherwise rewrite the canvas QA data URL during capture
 - result-screen Copy Summary action with run ID, current run, start source, observed input modality, a short `Input evidence:` line that records browser pointer type without treating it as real-device proof, fixture round trace, OK/missed/false cut counts, total net, best-saved record, tested async/legacy clipboard paths, a Save Summary text-file fallback, compact visible ledger fallback metadata, and a compact ledger-fallback label
- production build output that separates the known Phaser runtime into a named
  `phaser-engine` chunk, keeping preflight warnings focused on app-code growth
- live runtime browser smoke through reset menu, tutorial, tutorial-complete,
  protocol-results, menu-to-tutorial click, handoff-to-endless click, one
  `simple_001` swipe cut, and resolve-to-review token-strip/feedback evidence;
  see `docs/browser_qa_2026-06-07.md`
- post-change implementation evidence for the warmer interface, mechanics
  tutorial windows, brief near-text robot comments, and refined near-space cut
  handling; the same note records that Playwright was absent and Chrome
  Computer Use was denied, so this follow-up has no new browser raster proof
- follow-up frozen QA-link canvas evidence for desktop/portrait/small-phone
  active tutorial states, desktop handoff, and portrait/small-phone protocol
  results; this pass found and fixed a short-phone active-popup overlap caused
  by stale popup layout during continuous sentence motion

## Browser Smoke Pass - 2026-06-06

Status: produced fixes and browser evidence.

Desktop browser evidence showed the menu, first tutorial entry, staged cuts, and resolved review state. The pass found one behavioral issue: the first tutorial round could resolve immediately after entering PlayScene because initial motion used the scene clock while `update(time)` used the game-loop clock. This is fixed by seeding round and sentence-motion time from the game-loop clock with a scene-clock fallback.

Desktop cut evidence after the fix: five vertical cuts register on the first guided example, the review labels all five as OK, and the feedback card shows clean segmentation with explicit pay, cost, net, token count, and cost driver.

Portrait mobile evidence before the layout fix showed three display problems:

- compact menu module copy overflowed the card
- compact overseer prompt clipped at the bottom of the viewport
- compact HUD labels were too dense for narrow mobile rows

These are fixed in layout code and covered by tests. The compact menu now uses bounded two-line module copy, the compact overseer panel has a taller bottom-safe layout, and the compact HUD uses shorter labels with smaller two-row metrics.

Post-fix mobile screenshot retest now covers menu, early endless active state, tutorial active state, tutorial cut state, tutorial review state, and quit results at `390x844`. The retest found one additional visual defect: the moving sentence started below the viewport and crossed over the bottom overseer panel before entering the playfield. This is fixed by moving sentence motion continuously from the lower playfield to the top edge, and the layout/motion tests now assert the lower-start and upper-exit geometry.

The first-user viewport sweep later found a short-phone review constraint: at
`320x568`, the full tutorial review popup could not sit below token-strip
evidence and above bottom supervisor chrome. The compact review popup now uses a
constrained short-phone layout with reduced height, smaller body type, hidden
stamp text, and shortened body copy, and the sweep verifies it stays out of the
bottom supervisor area.

A dev-only `qaViewport=320x568` browser QA pass later made the short-phone
canvas inspectable even when the in-app Browser viewport override did not resize
Phaser. That pass found two more compact visual defects: the intro tutorial
popup overlapped the compact control row, and the review popup and feedback card
competed for the same vertical band. The intro popup now parks below the
controls; constrained short-phone tutorial reviews sequence the robot review
popup first and reveal feedback after it hides; compact feedback typography is
tighter so the audit line stays inside the card. The saved artifacts are
`docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-active.png`,
`docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-review-popup.png`, and
`docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-review-feedback.png`.

The same `qaViewport=320x568` pass then covered non-play surfaces. It found a
menu stack defect where the module label collided with the premise copy, plus a
compact results defect where the chrome path clipped and visible ledger lines
overflowed. The menu now uses short-phone title/premise sizing and spacing; the
results screen uses a shorter compact chrome path, smaller title/summary type,
and a compact visible ledger while preserving the full hidden Copy Summary
payload. The saved artifacts are
`docs/browser_qa/2026-06-06-canvas-small-phone-menu.png`,
`docs/browser_qa/2026-06-06-canvas-small-phone-handoff.png`,
`docs/browser_qa/2026-06-06-canvas-small-phone-results.png`, and
`docs/browser_qa/2026-06-06-canvas-small-phone-protocol-results.png`.

Mobile cut evidence after the motion fix: five pointer taps register on the first guided example, the review labels all five as OK, and the feedback card shows clean segmentation with explicit pay, cost, net, filed balance, token count, and cost driver. The latest strict-port review recheck also captures `2026-06-07-review-no-ui-trail-balance.png`, where a browser drag plus Resolve reaches review with filed-balance feedback and no stale UI-click trail crossing the audit surface. The latest portrait browser smoke also shows the robot-supervisor popup and near-text robot comment on the moving text path. This is browser-harness evidence, not a substitute for a real touch-device playtest.

A later portrait browser follow-up found and fixed a review-specific display
regression introduced by the continuous-motion model: when the round resolved,
the sentence was moved to the active top-exit endpoint and appeared under the
compact control row. Review now uses a separate safe text position below the
controls while active motion still travels to the top and disappears. The same
pass caught the feedback card rendering beneath the playfield layer; the card
now renders above the playfield and compact layout tests keep it between the
review token strip and bottom overseer copy.

The visual treatment has moved toward the current WienerWorks reference: polished warm AI-product software with a degraded human-segmentation purpose, company/department/product hierarchy, amber cut accents, a pixel Wiener supervisor artifact, and a desktop menu work-order ledger that names the task, rate logic, and inference-cost premise before the first click. The live PlayScene now has a wide-desktop three-pane training shell: a left WienerWorks Human Segmentation Division rail, a bounded central training console for HUD, lane, moving prompt, and feedback, and a right Wiener supervisor panel. A desktop browser QA pass found and fixed an overseer/control overlap at the bottom of the screen; layout tests now assert that the overseer strip does not intersect Sound, Clear, or Resolve. The work-order follow-up is covered by source/layout/QA-snapshot tests and now by `docs/browser_qa/2026-06-07-chunked-canvas-desktop-menu.png`; the continuation raster `docs/browser_qa/2026-06-07-continuation-canvas-menu.png` adds a fresh current menu proof from the same in-app Browser surface, read one chunk at a time to avoid the truncation risk of a single large data URL return and validated with a complete `IEND` chunk. Chrome headless exited `134`, Computer Use denied Chrome access, and `Page.captureScreenshot` still times out, so full-tab menu proof remains missing.

The tutorial-complete handoff now has a direct QA launch through `?mode=tutorial-complete`. Browser polling confirmed that URL boots with the expected page title and a Phaser canvas. A dev-only DOM QA snapshot now exposes the live handoff scene, copy, viewport, and element rectangles for browser automation; desktop `1280x720` and portrait `390x844` browser audits found the expected `TutorialCompleteScene`, expected action labels, and no out-of-bounds handoff elements. Content/layout/session-flow tests cover the handoff copy, button labels, responsive panel bounds, QA snapshot shape, and transition.

MenuScene now writes a dev-only browser QA snapshot for the first-action surface. The snapshot exposes title, premise, tutorial/endless/sound button labels, work-order ledger rows, best record, muted state, chrome path, and key rectangles. This gives first-action browser checks a fallback when raster capture fails and specifically protects the visible copy that tells new players to swipe through text and place tokenizer boundary cuts.

PlayScene now also writes a dev-only browser QA snapshot while active and in review. The snapshot exposes mode, phase, round, fixture ID, observed input modality, staged cut count, legal slot count, armed-preview boundary, active sentence-motion start/end/current y positions, elapsed/duration/progress, overseer text/font/wrap evidence, visible robot-toast/tutorial-popup text and rectangles, 44px touch-target pass/fail flags for Resolve, Clear, Sound, and Exit, and key rectangles for HUD, playfield, sentence text, cut status, token strip, controls, overseer, and feedback card. This gives browser automation a stateful fallback when canvas screenshots fail, and it specifically brackets the compact overseer text-fit fix, the armed-slot preview added for touch aim trust, the tutorial instruction overlays added for first-player comprehension, the first-user control-size invariant, proportional active text motion, and the active-motion/review-display split. It remains weaker than raster evidence because it cannot prove color, stroke weight, or perceived overlap from actual rendered pixels.

ResultsScene now writes a dev-only browser QA snapshot for the post-session evidence screen and has a direct zero-round QA launch through `?mode=results`. The snapshot exposes outcome, rounds, run ID, start source, observed input modality, rank, full ledger text, exact Copy Summary payload, copy/save-button state, and key rectangles for the panel, summary, ledger, and actions. This is specifically useful after the total-net ledger line was added: browser automation can verify that copied-summary fallback evidence includes `Net`, that the clipboard or saved-text payload contains the run/start/input/round-trace/cut-count fields required by the playtest evaluator, and that the result action controls remain inspectable without first playing through a session.

In-app screenshot capture is intermittent: it captured earlier portrait PlayScene and initial desktop PlayScene images, but the latest in-app Browser capture attempt timed out on `Page.captureScreenshot` before producing files. Installed Chrome headless and ephemeral Playwright Chromium previously failed under the macOS sandbox with browser-process permission errors. The current dev build therefore enables `preserveDrawingBuffer` only for dev QA, writes an app-authored canvas capture JSON node after render, writes numbered canvas-data chunks before a capture-id manifest for large PNG payloads, stamps chunks with the manifest data-URL hash so same-length stale data can be rejected, and supports `qaViewport=<width>x<height>` only as an internal compact-canvas QA harness. This produced persistent canvas PNGs in `docs/browser_qa/`, which strengthen internal visual QA but still do not prove real-device touch readability.

## Browser Runtime Pass - 2026-06-07

Status: live route and interaction smoke passed; no implementation defect found.

The existing local dev server on port `5178` booted controlled menu, tutorial,
tutorial-complete, and protocol-results routes with both
`tokenizer-training-qa` and `tokenizer-training-canvas-qa`
present at `qaViewport=390x844`. The menu `Begin Training` action transitioned
to tutorial PlayScene, and the tutorial-complete `Start Endless Training`
action transitioned to Endless PlayScene. A vertical swipe through the first
`simple_001` boundary registered exactly one cut, changed active status to
`CUTS: 1 / 16`, and Resolve moved the round to review with token strip
`the | _cat | _sat | _on | _the | _mat`, feedback visible, and the expected
robot-supervisor review line. The browser reported no console warnings or
errors during these checks.

This strengthens internal readiness evidence for launch provenance, clickable
handoff, main-verb registration, and review evidence. It still cannot substitute
for real-device touch observation or uncoached player comprehension.

## Follow-Up Implementation Pass - 2026-06-07

Status: local implementation and validation passed; current canvas-raster evidence exists, while full-tab screenshot capture still fails.

A later pass addressed the main product comments still affecting first-user
readiness: the interface was retuned toward a warmer, more deliberate degraded
assistant-browser shell; tutorial rounds now include separate robot-supervisor
narrative, mechanics, byte-route, token-ID, work-rule, technical, and review
windows; each robot window is mirrored as a short near-text comment; near-text
robot comments are shorter and stripped of redundant tutorial headers; and
visible-space cuts now prevent ordinary following-word duplicates while
preserving deliberate non-word following-token cuts. The moving sentence remains
driven by duration-scaled bottom-to-top motion during active play, with review
using its separate safe evidence position only after resolution.

Validation passed through fixture generation, the full unit suite, and
production build. A targeted cut-input regression also passed after the
space-run refinement. The dev server responded on port `5179` during the
implementation follow-up, but no new browser screenshot was captured in that
sub-pass because Playwright was not installed in the local dependency tree and
Chrome Computer Use was denied.

A later in-app Browser pass on dev port `5173` captured current valid
app-authored canvas PNGs in `docs/browser_qa/`: desktop menu, desktop tutorial
review, desktop tutorial-complete handoff, desktop protocol results, portrait
tutorial active, and portrait protocol results. Direct `Page.captureScreenshot`
still timed out, and the continuously moving desktop active PlayScene rewrites
its QA data too often for stable large data-URL extraction. This is current
canvas-raster evidence, not full-tab screenshot proof. The real proof still
requires real-device touch observation plus user-base playtest notes.

A subsequent direct screenshot retry used the same strict local shell on port
`5173` after `npm run playtest:doctor` confirmed HTTP 200, title, game root,
and reset metadata. The in-app Browser attempted full-tab captures for the
reset menu and frozen tutorial active route, but `Page.captureScreenshot`
timed out before any `2026-06-07-full-tab-*` PNG was produced. This keeps the
screenshot gap current rather than historical.

The latest compact UI follow-up addressed the crowded `320x568` tutorial
active state by collapsing near-text robot comments into a short strip when
there is not enough vertical room for the full labeled toast above the moving
text panel. The fresh canvas raster
`docs/browser_qa/2026-06-07-tight-toast-small-phone-tutorial-active.png`
shows the strip between the control row and token text, with the tutorial
window below the text and no browser warnings or errors in the in-app Browser
pass. This improves internal small-phone composition evidence but still does
not replace physical-device touch observation.

A later QA-link pass on dev port `5180` used
`qaFreezeElapsedMs=6200` to capture deterministic active tutorial rasters for
desktop, portrait, and `320x568` small-phone states, plus printed QA-link
handoff and protocol-results rasters. That pass found a short-phone active
display defect: the tutorial popup was laid out when it opened, but not when
continuous sentence motion moved the text panel upward, so it covered the token
text mid-round. The fix constrains active short-phone tutorial popups, passes
the text-panel top edge into popup layout, and relayouts visible tutorial
popups during sentence motion. Visual inspection of the small-phone
protocol-results capture also found a wrapped title colliding with the summary;
the result layout now uses a smaller narrow-phone title and
`tests/results-layout.test.ts` protects the title/summary gap.
`tests/tutorial-popup-layout.test.ts` and `tests/responsive-surface-sweep.test.ts`
now protect the active-popup/text-panel separation. The saved artifacts are
`docs/browser_qa/2026-06-07-frozen-canvas-desktop-tutorial-active.png`,
`docs/browser_qa/2026-06-07-frozen-canvas-portrait-tutorial-active.png`,
`docs/browser_qa/2026-06-07-frozen-canvas-small-phone-tutorial-active.png`,
`docs/browser_qa/2026-06-07-qa-links-desktop-handoff.png`,
`docs/browser_qa/2026-06-07-qa-links-portrait-protocol-results.png`, and
`docs/browser_qa/2026-06-07-qa-links-small-phone-protocol-results.png`.

A further latest current-build QA refresh on dev port `5180` used chunked
data-URL reads from `tokenizer-training-canvas-qa` after the current
UI, tutorial-window, continuous-motion, near-text robot comment, and space-run
input fixes. The runtime now formalizes that workaround through
`tokenizer-training-canvas-qa-chunks` and numbered chunk nodes, so
future browser passes can reconstruct large canvas PNG payloads without one
large DOM read. Chunk nodes are written before the manifest and stamped with a
matching capture id and data-URL hash so an extractor can reject mixed-frame reads and stale same-length data instead of assembling a corrupt PNG. The
captured artifacts are
`docs/browser_qa/2026-06-07-latest-canvas-desktop-menu.png`,
`docs/browser_qa/2026-06-07-latest-canvas-desktop-tutorial-active.png`,
`docs/browser_qa/2026-06-07-latest-canvas-desktop-tutorial-review.png`,
`docs/browser_qa/2026-06-07-latest-canvas-portrait-tutorial-active.png`, and
`docs/browser_qa/2026-06-07-latest-canvas-small-phone-tutorial-active.png`.
The same chunked path later produced
`docs/browser_qa/2026-06-07-chunked-canvas-desktop-menu.png`, a current
app-authored menu raster with the work-order ledger visible.
This pass included a real browser drag through the first `simple_001` boundary:
the active status changed to `SEGMENTS STAGED: 1 / 16`, Resolve reached review,
the token strip showed `the | _cat | _sat | _on | _the | _mat`, and no browser
warning or error logs were reported. This is stronger current canvas-raster
evidence than frozen route-only screenshots, but it remains internal browser QA
rather than real-device touch observation or user comprehension proof.

A subsequent live compact smoke on a fresh strict dev server at port `5181`
found one more phone-layout defect before real-user testing: at `390x844`, the
active tutorial robot popup overlapped the compact Resolve control row. The
popup layout now uses a shorter normal-phone active window and parks it below
the controls while leaving the moving text panel and near-text robot comment
clear. The recheck reported no popup/control, popup/text-panel, popup/toast, or
overseer/control overlap, and `tests/tutorial-popup-layout.test.ts` now covers
that `390x844` frozen active tutorial state. This improves optimal visual
display evidence for the first phone session, but the final proof still
requires a physical-device touch note.

A later local timeline check found a broader version of that risk without a new
browser raster: byte/rule tutorial windows could cover the continuously moving
sentence as it crossed their fixed band. Active tutorial popups now avoid the
moving text across every scheduled tutorial-window interval on desktop, tablet,
and first-phone viewports; the smallest phone active popup trims into a 76px
window with shorter constrained copy so it does not trade text overlap for
bottom-overseer clipping. `tests/tutorial-popup-layout.test.ts` covers those
scheduled windows from `320x568` through desktop. This is code-level layout
evidence, not full-tab screenshot proof.

A later refresh of the `320x568` protocol-results surface found compact ledger row rules cutting through the result evidence text. The compact ledger now
reserves a larger row height while preserving the button gap, and the refreshed
`2026-06-07-qa-links-small-phone-protocol-results.png` shows the
Run/Cuts/Pay/Net/Eff/Rank/Best rows clear of their ruling.

A later desktop review recheck on fresh dev port `5182` found that one older
review raster could still show the transient swipe trail as a diagonal line
over the feedback card. The scene now hides the trail layer when resolution
begins, refuses to redraw it while reviewing, and re-enables it only when the
next active round starts. The refreshed
`2026-06-07-review-no-ui-trail-balance.png` was captured from a stable chunked
review frame after one `simple_001` cut and Resolve; visual inspection shows
filed balance feedback with no stale diagonal trail.

A post-UI byte-route portrait recheck on
`http://127.0.0.1:5183/?mode=tutorial&playtestReset=1&qaViewport=390x844&qaFreezeElapsedMs=6200`
waited into the active tutorial byte-route window and saved
`docs/browser_qa/2026-06-07-post-ui-byte-route-portrait.png` from chunked
app-authored canvas QA. The QA state reported `PlayScene`, round `1`, fixture
`simple_001`, `legalSlotCount: 16`, three canvas chunks, and data-URL hash
`58c1dbf4`. Visual inspection confirmed the `BYTE ROUTE 1/5` robot popup,
near-text robot strip, moving text panel, and bottom overseer were visible
without overlap. This strengthens current portrait tutorial/tokenization
instruction evidence, but it remains app-authored canvas QA rather than
full-tab screenshot proof, real-device touch observation, or user
comprehension proof.

The local readiness audit now rejects browser-QA PNG evidence that is merely
large enough but structurally invalid or captured at the wrong QA viewport
dimensions. This keeps internal visual evidence from drifting while preserving
the boundary that canvas rasters are not real-device touch or comprehension
proof.
