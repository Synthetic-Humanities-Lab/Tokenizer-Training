# Design Verification Matrix

This matrix links the reading-derived design principles to current evidence.
It should be updated after each structured playtest.

## Summary

Current status: internally playable vertical slice, not yet proven user-base
ready.

The main loop is implemented and tested. Reading-derived principles are present
in systems, tutorial, economy, feedback, layout tests, and browser-readable QA
snapshots. `docs/browser_qa_2026-06-06.md` records the in-app Browser
QA snapshot/raster pass, the still-failing `Page.captureScreenshot` path, and
the app-authored Phaser canvas PNG capture workaround.
`docs/browser_qa_2026-06-07.md` records a later live runtime smoke on dev port
`5178`: reset menu boot, tutorial boot, tutorial-complete boot,
protocol-results boot, menu-to-tutorial click, handoff-to-endless click, one
first-round swipe cut, and the resolve-to-review evidence path. Browser
automation was unavailable for the later visual/tutorial/input follow-up on dev
port `5179`; that follow-up is documented as local code/test/build evidence,
not screenshot proof. A subsequent in-app Browser pass on dev port `5173`
captured valid current app-authored canvas PNGs for desktop menu, tutorial
review, handoff, protocol results, portrait tutorial active, and portrait
protocol results; direct `Page.captureScreenshot` still timed out. The dev QA
harness now also supports `qaFreezeElapsedMs`; a later QA-link pass used it to
capture frozen active PlayScene rasters for desktop, portrait, and `320x568`
small-phone states, plus QA-link handoff/results captures. A latest
current-build refresh on dev port `5180` added chunked data-URL raster evidence
for desktop menu, desktop tutorial active, desktop tutorial review reached by
browser drag plus Resolve, portrait tutorial active, and small-phone tutorial
active after the current UI/input/tutorial changes. The dev QA capture now also
publishes a chunk manifest and numbered `tokenizer-training-canvas-qa`
chunk nodes so future browser passes can reconstruct large canvas PNG data URLs
without one brittle DOM read; chunk nodes now carry the manifest capture id and
data-URL hash, and the manifest is published after chunks with data length plus
hash so extractors can reject mixed-frame reads and stale-length matches. The
local readiness audit now validates required browser-QA PNG structure and
expected viewport dimensions, so stale wrong-size rasters cannot satisfy the
pre-session evidence package merely by exceeding a byte threshold. A later
post-fix recheck on dev port `5182` made the transient swipe
trail active-phase-only and refreshed
`2026-06-07-review-no-ui-trail-balance.png` from a stable chunked review frame,
with no stale diagonal trail over the feedback card.
Checks now cover the degraded active PlayScene shell,
tutorial intro/review robot popups, near-action robot comments, continuous
bottom-to-top text motion, compact review parking below controls, readable
review feedback above the playfield layer, dev-only `qaViewport=320x568`
small-phone canvas states for menu/play/handoff/results, and desktop overseer/control
separation. Menu,
tutorial-complete, and results surfaces now share the same warm degraded
assistant-browser shell. The
MenuScene first-action surface, including the desktop work-order ledger,
PlayScene active/review states, visible
PlayScene tutorial popup/toast overlays, ResultsScene evidence state, and
tutorial-complete handoff have browser QA snapshot evidence. A first-user
responsive surface sweep now checks menu, play active/review surfaces, tutorial
review popup/feedback, tutorial-complete handoff, and results on small phone,
phone, large phone, tall phone, and tablet portrait viewports. PlayScene browser
QA snapshots now also publish 44px touch-target pass/fail flags for Resolve,
Clear, Sound, and Exit, giving automation a control-size regression hook when
screenshots are unavailable. Near-action robot comments now use
read-duration-scaled timing, word-boundary clipping, and
compact tutorial-header stripping so the supervisor's immediate instruction is
visible near the static prompt text instead of only in the bottom-left panel. The
latest tutorial implementation sequences robot-supervisor narrative, mechanics,
technical, and review windows for each round, so the fiction and tokenization
mechanics are both delivered in the tutorial surface.
The 2026-06-14 game-feel follow-up adds a resolving-frame review reveal
safeguard: once Resolve commits the round, actual tokenization evidence,
feedback, and Wiener speech are serviced from the active scene update loop as a
one-shot fallback if delayed review timers stall after browser resize or focus
changes. Live in-app Browser smoke on dev port `5267` verified the failure and
then the fix at `390x844` and `320x568`: a cut registered with immediate `SNAP`
feedback, Resolve entered review, actual tokenization evidence, feedback, and
Wiener speech all appeared, all controls kept 44px touch targets, and speech,
evidence, feedback, and controls did not overlap.
The 2026-06-15 game-feel follow-up adds a short actual-tokenization reveal beat:
when review evidence appears, the evidence panel receives a deterministic
460ms audit pulse with panel/text alpha, chip emphasis, and an amber top-rule
sweep exposed through PlayScene QA as `segmentationEvidenceRevealActive` and
`segmentationEvidenceRevealProgress`. Live in-app Browser smoke on dev port
`5267` verified a real tutorial cut with immediate `SNAP`, Resolve into review,
an active reveal pulse, settled evidence/feedback/Wiener speech with no overlap
at `960x720`, and the same pulse plus settled no-overlap review state at
`320x568`; the direct `Page.captureScreenshot` path still timed out, so this is
QA-geometry evidence rather than full-tab raster proof.
A subsequent 2026-06-15 game-feel pass protects the review learning beat from
stale prompt speech: Resolve now clears any existing pet speech before delayed
review evidence is scheduled, and tutorial review feedback/speech waits behind
a short evidence-read beat. Live in-app Browser QA on dev port `5267` at
`960x720` verified that the early review window no longer carries the old
prompt bubble and that the settled review keeps actual tokenization evidence,
feedback, Wiener speech, the pet, and controls separated.
The next 2026-06-15 game-feel pass adds explicit ownership counts to the
actual-tokenization evidence header: review now shows the token count,
submitted player cuts, and true tokenizer edges in the same compact line before
the token chips. This keeps the resolved state tied to the player's physical
swipe decisions without changing scoring, token fixtures, or cut detection.
A follow-up tightens that same header into a more readable resolved audit:
actual-tokenization evidence now shows token count, submitted cuts, OK, miss,
and false counts before the chips, using the already-computed `RoundScoreResult`
rather than re-scoring or changing economics.
The latest accounting-feel pass makes resolved economy consequences more
immediate: the HUD impact state now carries a signed `NET` tag, renders it over
pay for gains or cost for losses, and exposes the delta text, alpha, and QA
geometry as transient renderer-captured evidence while leaving scoring and rank
economics unchanged.
The copied playtest summary now also carries a per-round `Input feel trace`
for sessions played through the normal loop: samples, response events,
first-cut latency, resolve-after-last-cut timing, release-latched cuts,
adjusted cuts, gesture samples, final owned cuts, no-cut acknowledgements split
into near-slot aim misses and off-slot swipes, touch-loupe samples,
snap-ready loupe samples, low-clearance loupe samples, and minimum
loupe-to-pointer clearance. This preserves Swink-style input/response,
correction-churn, final-ownership, and touch-readability metrics inside the
artifact used for external playtest review while remaining separate from
scoring.
The touch-aim loupe now also chooses among above/preferred-side,
above/flipped-side, below/preferred-side, and below/flipped-side placements so
top-edge clamping does not leave the mirrored boundary under the finger when a
safe placement is available; PlayScene QA exposes the selected placement.
compact bottom overseer also strips redundant tutorial titles and long second
sentences so it stays inside its line budget. Results now render the copied-summary fallback as
a ruled, left-aligned ledger panel, and QA snapshots expose that ledger panel
separately from the copied payload.
A later live compact smoke on a fresh strict dev server at port `5181` found
and fixed a `390x844` active tutorial-popup/control overlap; the recheck showed
no popup/control, popup/text-panel, popup/toast, or overseer/control overlap,
and `tests/tutorial-popup-layout.test.ts` now protects that phone active state.
A later layout timeline check found that byte/rule tutorial windows could still
cover the continuously moving sentence as it passed through their fixed band;
active tutorial popups now avoid the static prompt text across the scheduled tutorial
window timeline, and the smallest phone active popup trims into a slimmer
76px window rather than stealing space from the playfield or bottom overseer.
Raster capture worked in earlier portrait, initial desktop PlayScene, and
tutorial-complete handoff checks, and current app-authored canvas PNGs now cover
the latest menu, review, handoff, results, portrait tutorial surfaces, and
frozen active tutorial states across desktop, portrait, and small-phone
viewports. The latest in-app Browser tab screenshot recheck on port `5183`
still timed out on `Page.captureScreenshot` before producing files. The current dev build exposes a hidden app-authored
canvas PNG capture for browser QA plus dev-only `qaViewport` and
`qaFreezeElapsedMs` controls for compact and deterministic active-motion raster
checks. It also exposes a `tokenizer-training-canvas-qa-chunks`
manifest and numbered chunk nodes with capture-id and data-URL-hash matching so
large canvas PNG payloads can be read in bounded pieces without mixing frames
or accepting stale same-length data, and persistent
canvas captures exist in `docs/browser_qa/`,
including the latest `2026-06-07-latest-canvas-*` current-build refresh and
`2026-06-07-chunked-canvas-desktop-menu.png` for the current menu work-order
ledger. A continuation menu raster,
`2026-06-07-continuation-canvas-menu.png`, re-read the canvas chunks one chunk
at a time from the in-app Browser and validated a complete current menu PNG
with the work-order ledger visible. A post-UI byte-route portrait recheck saved
`2026-06-07-post-ui-byte-route-portrait.png` from
`qaViewport=390x844&qaFreezeElapsedMs=6200`, confirming the current
`BYTE ROUTE 1/5` tutorial popup, near-text robot strip, static prompt lane, and
bottom overseer render together without overlap. The
remaining gaps are real touch-device use and actual user comprehension
observations.

The playtest status command now repeats the mobile-note validity conditions
while the mobile gate is unsatisfied: real-device target note, explicit
`--host <network-host>` LAN launch-check, non-localhost launch metadata, and
concrete visual evidence for readable or failed mobile surfaces.
The launch-check command now repeats the same real-device target and visual
evidence constraints before printing any copy-ready session metadata, so the
final metadata check cannot be mistaken for physical-device proof by itself.
The doctor command now repeats that standard at the first port-selection step,
before the operator chooses a same-machine, LAN, or suggested-port launch path;
doctor and link-printer suggested or merely available ports now print planned
metadata rather than copy-ready session metadata until launch-check verifies
the exact host.

## Requirements

| Requirement | Current Evidence | Status |
| --- | --- | --- |
| Book and chapter notes exist | `docs/game_design_reading_notes/` contains synoptic and chapter notes for Zubek, Swink, Tufte, Flanagan, and Isbister; `docs/game_design_reading_notes/chapter_note_manifest.md` inventories all 59 synoptic and source-section note units; `tests/design-docs.test.ts` verifies the full expected heading set for each source, requires every chapter section to carry an implementation consequence, and checks that every note unit is linked from the manifest | Met |
| Concept repository exists | `docs/game_design_concepts/` contains implementation-oriented concepts and playtest gates; `tests/design-docs.test.ts` verifies reading ties, design claims, implementation guidance, examples, playtest questions, and seven gate sections including engagement and aesthetic intent | Met |
| Derived principles exist | `docs/game_design_principles.md` covers top design, critical play, emotional design, game feel, and visual display; `tests/design-docs.test.ts` verifies the required principle categories and embodiment/risk sections | Met |
| Core loop preserved | `PlayScene`, `TokenizerSystem`, `SwipeCutSystem`, `ScoringSystem`, `SessionFlowSystem`; tests for scoring, economy progression, swipe, session flow, tutorial, fixtures | Met |
| Tutorial mode preserved | first-screen `menuCopy`; `menuSceneQaSnapshot`; ten-round `TutorialSystem`; menu/tutorial tests cover first action copy, prompts, concrete no-target-hint cues, hints, narrative/mechanics/technical/review popup sequencing with compatibility byte-route/token-ID/work-rule fields, near-text Wiener speech, review timing, completion, economy framing, and tutorial-complete handoff; browser QA confirms review speech appears after resolution without redundant score duplication or overlap with token-strip evidence | Met |
| Endless mode preserved | `SessionFlowSystem` and `DifficultySystem`; tests cover progression, session end, and result state | Met |
| Real tokenizer fixtures used | `scripts/generate-token-fixtures.ts`, 78 checked-in `cl100k_base` fixtures, tokenizer fixture tests | Met |
| Byte/grapheme safety enforced | fixture generation and tests validate token byte spans, grapheme spans, and safe boundaries | Met |
| Mouse/touch support preserved | pointer input through Phaser and swipe systems; PlayScene clears active gesture state on `pointerup`, `pointerupoutside`, and `gameout` so cancelled phone/tablet drags do not leak stale same-gesture space-run suppression into the next attempt; tests cover swipe/cut boundary detection, compact snap tolerance, no endpoint-near duplicate after an already crossed space-run slot, same-gesture suppression of the first following word cut after a visible space-run cut, multi-space run suppression for fast swipes and same-gesture following-word overshoot, same-gesture replacement when the following word overshoot happens first, same-gesture local replacement when duplicate candidate evidence would otherwise stage both a near miss and the intended word edge, ordinary following-word suppression after the centered space-run cut already exists, return-to-space cleanup of staged ordinary-word duplicates, deliberate following-token cuts after a compact space-run for non-word token cases, non-scoring armed-slot preview, touch aim loupe geometry, loupe snap-ready state, touch-loupe pointer-clearance QA exposure, top-edge loupe repositioning away from the pointer, minimum 44px first-user touch targets across menu/play/handoff/results controls, PlayScene QA snapshot touch-target pass/fail flags, and mobile-style input lifecycle cleanup | Partly met |
| Game feel embodied | trail, armed-slot preview, snap-ready touch aim loupe, persistent cut markers, `NO CUTS` zero state, non-quota compact `STAGED` status, temporary word-only input-response badges (`SNAP`/`TRACKED`/`LATCHED`/`ADJUSTED`/`CHAINED`) that redraw during active frames so their Swink-style decay actually expires, deadline-pressured zero-cut Resolve plus counted ready-state Resolve control exposed in PlayScene QA, labels, audio, touch haptics for cuts, audible existing-cut confirmation, visible `HELD` confirmation labels for repeated contact with staged cuts, visible `SET` labels and release pulse-kind QA when fast swipes are latched by the final pointer-up sample, active pulse-kind QA, audible and tactile no-cut misses, timer warnings, labelled manual/deadline commit beats that briefly name the submitted cut count before review, signed HUD net-delta tags that tie resolved pay/cost/balance impact to the accounting beat, resolution, manual Clear, and auto-removed duplicate cuts, immediate pressed-state feedback for menu, handoff, results, and play controls, static centered prompt placement plus a brief route-acquisition beat, clear control with explicit robot recovery confirmation, near-space duplicate suppression, final pointer-up release sampling through the same cut model so fast swipes do not miss the boundary crossed at release, same-gesture replacement gestures now surface as an `ADJUSTED` input-response badge and correction count instead of being folded into ordinary snap/release states, broad multi-boundary sweeps now surface as a `CHAINED` input-response badge plus a fading bridge rail with cut-batch trace evidence instead of feeling like unrelated snaps, renderer-backed QA capture now activates for transient response feedback such as correction bridges, input-response badges, no-cut scuffs, text-impact ghosts, clear/release traces, resolve commit beats, and HUD accounting tags so short Swink-style attack/sustain/decay states can be verified after the scene has rendered, input-feel QA metrics and copied-summary traces for sample count, response events, first-cut latency, last-cut age, latest cut-batch size, release-latched cuts, no-cut acknowledgements, touch-loupe samples, snap-ready loupe samples, low-clearance loupe samples, minimum loupe-to-pointer clearance, last-cut release-sample state, last-cut correction state, Resolve commit count, resolve-after-first-cut delay, resolve-after-last-cut delay, input-response badge visibility/text/tone, gesture-samples, and owned-cuts, UI-click samples excluded from the visible cut trail, active-phase-only trail visibility, review trail clearing before audit display, read-duration-scaled near-action robot comments that strip repeated tutorial headers on compact viewports and collapse to a short strip when the static prompt is too close to the compact control row, layout-owned Wiener idle bobbing so the pet cannot drift back over review feedback after repositioning, PlayScene QA prompt-position fields for start/end/current y plus elapsed/duration/progress, and active-round focus/visibility pause so timing does not punish the player while the tab is hidden or blurred; tests cover static prompt geometry, prompt-acquisition feedback, active feedback, clear recovery copy/integration, zero-cut/no-quota staged status, input-response badge state/lifecycle/QA exposure including correction and chained-swipe priority plus chain-rail geometry, HUD impact delta state and PlayScene QA exposure, copied-summary input-feel traces with response, ownership, loupe-clearance, and batch fields, renderer-backed transient-feedback capture routing, deadline-pressured zero-cut Resolve and counted ready Resolve control, control-label QA exposure, swipe preview, release-position cut sampling, release-latched `SET` labels, PlayScene QA state, resolve commit timing QA exposure, robot-comment layout/timing/clipping, compact tutorial-toast wrap capacity, tight compact toast geometry, resolution feedback, labelled commit-beat ownership, cut-input space-run intent, audible no-cut release feedback, audible and visible existing-cut confirmation, active pulse-kind QA, tactile cleanup punctuation for auto-removed cuts, scene-level button pressed feedback, loupe snap-readiness, loupe pointer-clearance reporting, top-edge loupe repositioning, trail cut-band gating, review trail hiding, the active prompt/review-display split, layout-owned pet idle motion, and browser focus-loss pause lifecycle cleanup | Partly met |
| Visual display embodied | polished WienerWorks Human Segmentation Division shell across menu and play, with product hierarchy kept as Tokenizer Training; wide-desktop PlayScene now uses a three-pane composition with a left company/division rail, bounded central training console, and right Wiener supervisor panel; the segmentation lane uses rails, timing ticks, audit-window banding, ghosted prompt lanes, and amber swipe/cut motion without literal factory props; desktop menu work-order ledger with task/rate/cause rows; HUD, token strip, feedback card, tutorial robot popup, ruled left-aligned results ledger, compact overseer text shaping, responsive menu/play/results layout tests, first-user phone/tablet viewport sweep tests, dev-only `qaViewport=320x568` canvas captures, separated short-phone menu copy stack, constrained short-phone active/review tutorial popups, active tutorial popup timeline tests that keep scheduled windows clear of the static prompt text, controls, and overseer from `320x568` through desktop, normal-phone `390x844` active-popup/control regression coverage, tight short-phone near-text robot comment strip, sequenced short-phone popup/feedback review panels, compact feedback typography, compact result title/summary separation, compact result ledger typography and row-rule clearance, compact review text below controls, compact feedback between review token strip and overseer copy, desktop overseer/control separation, MenuScene first-action QA snapshots with work-order rows, PlayScene active/review QA snapshots, ResultsScene ledger-panel/button QA snapshots, current `2026-06-07` browser-canvas PNGs for desktop menu/review/handoff/results plus portrait active/results, frozen `qaFreezeElapsedMs` PNGs for desktop/portrait/small-phone tutorial active states, latest `2026-06-07-latest-canvas-*` PNGs for current-build active/review tutorial, portrait active tutorial, and small-phone active tutorial, `2026-06-07-chunked-canvas-desktop-menu.png` and `2026-06-07-continuation-canvas-menu.png` for current work-order menu ledger evidence, `2026-06-07-post-ui-byte-route-portrait.png` for the current portrait byte-route tutorial popup/toast/text stack, latest in-app Browser canvas checks on dev port `5191` for the updated desktop menu and portrait token-ID popup/toast stack, `2026-06-07-qa-links-small-phone-protocol-results.png` refreshed for compact result ledger row-rule clearance, `2026-06-07-review-no-ui-trail-balance.png` refreshed after the dev-port `5182` active-phase-only trail fix for current review evidence without a stale diagonal trail and with filed-balance feedback, dev-only chunked `tokenizer-training-canvas-qa` extraction for large canvas PNG payloads, plus historical desktop menu raster evidence before the work-order ledger and `2026-06-07-tight-toast-small-phone-tutorial-active.png` for the compact-toast follow-up; full-tab menu work-order proof is still missing because Chrome headless exited `134`, Computer Use denied Chrome access, and `Page.captureScreenshot` times out | Partly met |
| Critical play embodied | obsolete AI browser frame, economy, rank, overseer copy, cost consequences, and review audit lines that file the post-round balance beside pay-minus-cost arithmetic, including low-balance and closed-window states; `docs/economy_tuning_audit.md` records the local strategy envelope, and tests bracket non-play, overcutting, half-complete play, near-perfect play, perfect play, review-only HUD accounting, and feedback balance filing | Partly met |
| Emotional design embodied | agency through cuts, pressure through timer/balance, recovery through Clear Cuts, explicit no-cost-before-Resolve recovery feedback, review, immediate filed-balance consequence after resolution, and low/closed balance language before the next prompt or result transition | Partly met |
| User-base playtest protocol exists | `docs/user_playtest_protocol.md` defines the full session flow, links `docs/playtest_facilitator_card.md` as the table-side no-coaching script, and links `docs/playtest_day_checklist.md` as the short operator checklist | Met |
| User-base note and rollup templates exist | `docs/playtest_session_notes_template.md` maps observations, debrief answers, copied summary, pass criteria, visual evidence type, per-criterion evidence, and principle-evidence notes, including engagement and degraded-visual-intent evidence; the template and five prepared notes now also prompt observers to record duplicate slicing around visible blank runs, return-to-space cleanup of accidental ordinary-word duplicates without suppressing deliberate currency or punctuation token cuts, static prompt clearance, near-text Wiener speech, and whether Wiener tutorial speech teaches both the labor/browser frame and tokenizer mechanics without facilitator explanation; `docs/playtest_facilitator_card.md` keeps the opening script, 30-second neutral intervention rule, concrete mobile visual-evidence standard, mobile note validity checklist, current-risk watch points, engagement/aesthetic evidence standard, principle-area reminder, and Copy Summary closeout visible during facilitation; `npm run playtest:notes` creates the first five non-overwriting session note files from that template, and the generated/current `docs/playtests/session-1.md` carries a Session Requirement block warning that it must remain the real phone/tablet touch note until the mobile gate is satisfied, with a current/generated metadata scaffold that removes desktop, same-machine, and no-evidence options from the required mobile-gate note; `npm run playtest:status` gives a short per-note completion report after each session, distinguishes phone-like metadata from completed mobile evidence, treats observation/pass-criteria contradictions as incomplete pass-criteria evidence, keeps rollup readiness blocked until a completed real phone/tablet touch note with `Network: LAN` and a non-localhost Launch URL exists, and prints the immediate command sequence for the current state, including the doctor/LAN-server/exact-network-host path while the mobile gate is unsatisfied, the non-default-port LAN serve command when needed, and the evaluator/rollup/audit path once notes are rollup-ready; `npm run playtest:brief` prints the next session note target, flags when that target must satisfy the mobile gate, checks the requested strict port, keeps that port when a candidate reset-safe launch URL is already serving the game shell and can be used for the next note, probes Network-host launch URLs when the required mobile note is next and localhost proof appears first, treats failed Network-host checks as same-machine-only, treats same-machine fallback metadata as non-mobile evidence, switches its serve command and planned launch links to a suggested free port when the requested listener is wrong, dead, or same-machine-only for the required mobile note, suppresses copy-ready metadata for that suggested port until launch-check passes on the exact host, includes a generated mobile note validity checklist, includes the latest blank-run/static-prompt/robot-window watch points, and includes a physical-device sanity check that tells the operator to verify the actual phone/tablet can load the Recommended tester launch URL before the tester arrives; `npm run playtest:launch-check` verifies after server start that a selected reset-safe launch URL serves the game shell, probes same-machine candidates before stale LAN candidates when no explicit host is provided, and explicitly does not count same-machine proof as real phone/tablet evidence; `npm run playtest:rollup` creates a non-overwriting completed-rollup file from `docs/playtest_rollup_template.md`; `docs/playtests/README.md` marks those files as prepared templates rather than completed evidence and names the Copy Summary, Run ID, visual-evidence, session status, session evaluator, rollup setup, rollup evaluator, and final readiness audit steps; `docs/playtest_rollup_template.md` maps five sessions back to the pass thresholds and adds aggregate evidence for engagement and visual style plus a principle-embodiment audit for top game design, critical/conceptual play, emotional design, game feel, and optimal visual display; `npm run playtest:evaluate` rejects missing sessions, blank or placeholder session metadata, blank or bare observation-note rows, contradictions between matching observation rows and pass-criteria rows, blank or bare debrief answers, debrief answers that do not address their specific question, ambiguous pass cells, verdicts without evidence text, generic pass evidence that does not name the criterion-specific observed behavior, generic principle evidence notes, one-word verdict placeholders in evidence cells, incomplete copied summaries including missing fixture round traces, run-ID mismatches, non-game-shaped run IDs, copied summaries that did not come from the tutorial handoff, vacuous mobile evidence, same-machine or localhost mobile metadata, desktop/emulated touch evidence for the real-device mobile gate, thin mobile readability passes that do not name a concrete visual artifact or readable surface, and engagement/aesthetic passes that do not name both continued play interest and intentional degraded visual style; `npm run playtest:evaluate-rollup` rejects blank session-index rows, missing threshold counts, generic rollup evidence, aggregate signals without numeric counts or concrete observed patterns, principle evidence that does not name area-specific playtest behavior, unsupported principle decisions, unresolved major principle gaps, and a final decision that does not explicitly mark broader playtest ready; `npm run playtest:audit` checks the local reading/concept/principle/QA package and exits non-zero until the five completed session notes and completed rollup both pass, including the real phone/tablet mobile gate and consistency between rollup run IDs, inputs, copied-summary start sources, notes files, and evaluated criterion tallies | Met |
| Tutorial-to-endless handoff exists | `TutorialCompleteScene`, `tutorialCompleteCopy`, `computeTutorialCompleteLayout`, `tutorialCompleteQaSnapshot`, `SessionFlowSystem` tutorial-complete transition, and content/layout/QA/session-flow tests | Met |
| Direct playtest launch exists | `npm run playtest:preflight` for fixture generation, tests, build, and local-only evidence audit before sessions; `npm run playtest:audit:local` for the pre-session reading/principle/protocol/browser-QA package check without requiring completed user notes; `npm run playtest:doctor` for strict-port and LAN-host operator checks before starting Vite, including keeping an occupied requested port when a reset-safe launch URL already serves the `Tokenizer Training` shell, probing Network-host launch URLs when the next note must satisfy the mobile gate, treating localhost-only proof as same-machine-only when those Network-host probes fail, and printing concrete `lsof` port-hygiene commands plus a confirmed-stale-only stop rule when a listener blocks strict binding; `npm run playtest:brief` now performs its own strict-port probe, keeps the requested port only when a candidate reset-safe launch URL already serves the `Tokenizer Training` shell and can be used for the next note, probes Network-host launch URLs when the required mobile note is next and localhost proof appears first, treats failed Network-host checks as same-machine-only, treats same-machine fallback metadata as non-mobile evidence, uses the suggested free port for serve commands and planned launch links when the listener is blocked by another app, does not answer, or serves same-machine only for the required mobile note, suppresses copy-ready metadata for that suggested port until launch-check passes on the exact host, and prints the same concrete `lsof`/confirmed-stale guidance when the requested listener is unsafe; `npm run playtest:launch-check` verifies a selected reset-safe launch URL returns the `Tokenizer Training` shell after the server starts, probes same-machine candidates before stale LAN candidates when no explicit host is provided, diagnoses explicit LAN failures with a same-machine same-port probe for trusted-network, exact Vite Network URL host, and macOS firewall or VPN issues, suppresses copy-ready metadata for failed launch checks even when the failed candidate is a LAN URL, and requires explicit `--host <network-host>` checking for phone/tablet evidence; `?mode=tutorial`, `?mode=endless`, `?mode=tutorial-complete`, `?mode=results`, `?mode=protocol-results`, controlled state reset through `?playtestReset=1`, strict same-machine serving through `npm run playtest:serve`, strict same-network touch-device serving through `npm run playtest:serve:lan`, reset-safe link printing through `npm run playtest:links` with the shared port-hygiene block and launch metadata labelled as planned setup rather than copy-ready session metadata until brief or launch-check verifies the exact running host, and internal visual QA link printing through `npm run playtest:qa-links` for `qaViewport`/`qaFreezeElapsedMs` states that are explicitly not tester evidence; tested by `launch-mode.test.ts`, `storage.test.ts`, `playtest-links.test.ts`, `playtest-qa-links.test.ts`, `playtest-access.test.ts`, `playtest-brief.test.ts`, `playtest-launch-check.test.ts`, and `playtest-server-doctor.test.ts` | Met |
| Production build hygiene exists | `vite.config.ts` splits the known Phaser runtime into a named `phaser-engine` chunk and uses an explicit engine-sized warning limit; `tests/build-config.test.ts` protects that the app chunk is not silently bundled as one generic artifact | Met |
| Playtest session summary can be reported | Results screen exposes Copy Summary with run ID, current run, start source, observed input modality, a short `Input evidence:` line that separates browser pointer type from real-device mobile proof, fixture round trace, OK/missed/false cut counts, total net, and best-saved record; clipboard failure changes the same control to Save Summary so the full text can be downloaded before falling back to incomplete ledger transcription; the visible ledger fallback carries compact run/start/input, OK/M/F, and net evidence; dev QA now exposes the exact Copy Summary payload; `SessionFlowSystem.playtestSummaryText`, `PlaytestRunSystem`, `SessionStartSystem`, `InputModalitySystem`, async/legacy clipboard paths, text-file download fallback, and the fallback `Use Ledger Text` label are tested | Met |
| Browser visual QA complete | desktop and portrait mobile smoke screenshots exist for earlier menu/play/review/results checks after compact layout and sentence motion fixes; `docs/browser_qa_2026-06-06.md` records the in-app Browser QA snapshots for desktop PlayScene active/review, tutorial-complete, protocol-results, portrait PlayScene active/review, the follow-up compact portrait review pass, and dev-only `qaViewport=320x568` small-phone canvas QA; `docs/browser_qa_2026-06-07.md` records a live runtime pass on port `5178` proving reset menu boot, tutorial boot, tutorial-complete boot, protocol-results boot, menu-to-tutorial click, handoff-to-endless click, one `simple_001` swipe cut, and resolve-to-review token-strip/feedback evidence without console warnings or errors, plus a later port `5179` follow-up noting Playwright absence and Chrome Computer Use denial after the latest visual/tutorial/input changes; the same note now records a current port `5173` in-app Browser canvas-raster pass with valid PNGs for desktop menu, tutorial review, handoff, protocol-results, portrait tutorial active, and portrait protocol-results, plus a port `5180` `qaFreezeElapsedMs` QA-link pass with frozen desktop/portrait/small-phone tutorial active PNGs and QA-link handoff/results PNGs; a latest current-build QA refresh on port `5180` records chunked data-URL reads, desktop menu, desktop active tutorial, desktop tutorial review reached through browser drag plus Resolve, portrait active tutorial, small-phone active tutorial, `SEGMENTS STAGED: 1 / 16`, and no browser warning or error logs; a fresh direct screenshot retry on strict port `5173` confirmed the game shell but again timed out at `Page.captureScreenshot` before any `2026-06-07-full-tab-*` PNG was produced, and the dev QA system now exposes `tokenizer-training-canvas-qa-chunks` plus numbered chunk nodes so large canvas PNGs can be reconstructed without one large DOM read; the chunked canvas path produced `2026-06-07-chunked-canvas-desktop-menu.png`, a current app-authored raster of the desktop menu work-order ledger; the continuation menu raster re-read those chunks one chunk at a time and produced `2026-06-07-continuation-canvas-menu.png`, another complete current menu PNG with the work-order ledger visible; the compact-toast follow-up on strict port `5173` records `2026-06-07-tight-toast-small-phone-tutorial-active.png` at `320x568`, with the robot comment collapsed into a short strip between controls and token text and no browser warning or error logs; `docs/browser_qa/` now contains app-authored Phaser canvas PNG captures for desktop menu, tutorial active/review, tutorial-complete, protocol-results, portrait tutorial active/review, small-phone menu/tutorial active/review-popup/review-feedback/handoff/results/protocol-results, current `2026-06-07-browser-canvas-*` files, current frozen `2026-06-07-frozen-canvas-*` / `2026-06-07-qa-links-*` files, latest `2026-06-07-latest-canvas-*` files, `2026-06-07-chunked-canvas-desktop-menu.png`, `2026-06-07-continuation-canvas-menu.png`, and the compact-toast follow-up PNG; latest PlayScene browser checks cover portrait popup/toast rendering, tutorial review-popup placement below token-strip evidence, static prompt samples, compact review text parking below controls, readable feedback above the playfield layer, short-phone active popup/text-panel separation, short-phone popup/control separation, short-phone popup/feedback sequencing, compact feedback audit fit, tight compact robot-toast control/text separation, and desktop overseer/control non-overlap; latest small-phone non-play checks cover separated menu title/module/premise copy, readable handoff actions, shortened compact results chrome, compact result title/summary separation, compact result ledger fit, and preserved hidden Copy Summary payload; `tests/responsive-surface-sweep.test.ts` checks menu, play controls, active/review text, constrained tutorial active/review popup placement, feedback, handoff, and results geometry from `320x568` through `768x1024`; MenuScene QA snapshots expose first-action copy, CTA labels, sound state, best record, and key rectangles; PlayScene active/review QA snapshots expose phase, mode, input modality, cut counts, armed-preview state, overseer text/font/wrap evidence, visible robot-toast/tutorial-popup text and rectangles, feedback visibility, and key element rectangles; ResultsScene QA snapshots expose outcome, run/start/input state, ledger text, exact Copy Summary payload including fixture round trace, `Net`, copy-button state, and key rectangles; tutorial-complete handoff has layout tests, a direct route boot poll, browser QA snapshots, canvas raster captures at `1280x720` and `390x844`, and a successful live click into Endless; the in-app browser `Page.captureScreenshot` path still times out, `qaViewport`/`qaFreezeElapsedMs` are internal harnesses, and internal canvas PNGs do not prove real-device touch readability | Partly met |
| Touch playtest complete | no real device/touch observation yet | Not met |
| User comprehension proven | no external tester observations yet | Not met |
| Fixture variety suitable for first playtest | 78 fixtures across tiers 1-4; regression test protects minimum tier counts, broad category coverage, and specific coverage for numbers/symbols, punctuation, symbolic strings, tokenizer strings, and command-like strings | Met |

## Principle Embodiment

### Top Game Design

Evidence: the loop is complete, systems are modular, the menu names swiping text
to place tokenizer boundary cuts, tutorial prompts name concrete tokenization
features after answer hints are removed, and outcomes are auditable through
review markers, token strip, pay, cost, net, balance, rank, and copied
start-source evidence. Tutorial review windows now display the round-specific
tokenization explanation after resolution instead of leaving it as unused
content data, and the current byte-route window shows the
text-to-UTF-8-bytes-to-token-IDs path in the robot-supervisor tutorial
sequence.

Remaining proof: user sessions must confirm that players understand the loop and
enter Endless Training from the tutorial-complete handoff without external
explanation.

### Critical And Conceptual Play

Evidence: the rules and economy make tokenization labor legible; the player role
is framed as degraded human segmentation work inside an obsolete AI browser. The
local economy tests now reject pay for missing every required boundary and
bracket repeated non-play, half-complete segmentation, and speculative
over-cutting as losing strategies. HUD tests keep pay/cost visible only during
review, preventing previous-round accounting from appearing as current-round
evidence. Feedback tests now require review audit copy to file the resulting
balance, tying pay-minus-cost arithmetic to the remaining session budget.

Remaining proof: testers must notice the labor/cost frame through play rather
than through explanation.

### Emotional Design

Evidence: timer pressure, balance risk, terse overseer feedback, near-action
robot comments, explicit Clear Cuts recovery confirmation before Resolve,
visible review states, filed post-round balance, copied fixture round traces,
and copied OK/missed/false cut counts create agency, error, and recovery.
The deadline path now calls a typed `deadline` resolve trigger, uses a stronger
deadline-colored commit beat than manual Resolve, and exposes the trigger in
PlayScene QA without changing submitted cuts or scoring. This keeps time pressure
causal rather than arbitrary when the system resolves a round automatically.

Remaining proof: testers must report errors as earned and recoverable, not
arbitrary.

### Game Feel

Evidence: cut registration, trails that stay attached to the text cut band
rather than UI controls, non-scoring armed-slot preview, snap markers, clear
state, static prompt placement, a separate readable review
position, trail clearing before review audit display, audio cues, resolution
labels, read-duration-scaled robot comments near the static prompt text, and copied
input-modality evidence create a tactile loop. Deadline-triggered resolution now
uses the same commit surface as manual Resolve but with a stronger
deadline-colored beat and QA-visible trigger, preserving scoring while making the
timer's ownership of the outcome legible.

Remaining proof: touch users must not report systematic finger occlusion or snap
mistrust.

### Optimal Visual Display

Evidence: compact and desktop layout tests cover menu text separation, play controls, HUD,
feedback card, compact feedback text fit, compact result title/summary separation, compact results ledger fit and row-rule clearance, overseer panel text fit,
tutorial popup/toast surfaces, a first-user phone/tablet viewport sweep,
constrained short-phone tutorial review popup placement, short-phone
popup/feedback sequencing, compact review text parking, feedback-card z-order, handoff and results surfaces,
PlayScene active/review QA snapshots, and the
tutorial-complete handoff QA snapshot. The current scene shell now uses one
warm degraded assistant-browser vocabulary instead of switching back to the
older blue-grey chrome outside PlayScene. The results surface now separates the
human-readable ledger panel from the copied playtest payload, preserving visual
evidence hierarchy without changing protocol text.

Remaining proof: real-device review must show no clipping, overlap, unreadable
text, finger occlusion, or input mistrust outside the in-app browser harness.

## Next Evidence To Collect

1. Direct browser screenshots for PlayScene, `?mode=tutorial-complete`, and
   `?mode=results` if `Page.captureScreenshot` becomes reliable; current QA
   combines browser-readable geometry with app-authored Phaser canvas rasters.
2. Repeat `npm run playtest:qa-links -- --port <printed-port>` after any future
   layout change to refresh frozen active-state rasters without racing transient
   renderer feedback.
3. Real touch-device pass through `npm run playtest:serve:lan` for menu, tutorial active,
   tutorial review, endless active, and results. Use `npm run playtest:links`
   to print controlled reset/deep links for the printed Vite port, but treat
   same-machine-only link output as desktop shakedown rather than mobile evidence. For any
   mobile readability pass, record screenshot, photo, screen recording, or
   observer-note evidence naming the checked surface or failure mode.
4. Five tester sessions using `docs/user_playtest_protocol.md`,
   `docs/playtest_facilitator_card.md`, and
   note files prepared by `npm run playtest:notes` from
   `docs/playtest_session_notes_template.md`.
5. A completed `docs/playtest_rollup_template.md` mapping debrief notes back to
   the pass criteria and the five principle areas, plus passing
   `npm run playtest:evaluate -- <five note files>` and
   `npm run playtest:evaluate-rollup -- <completed rollup>` results.
6. A passing `npm run playtest:audit` result after the five completed notes and
   completed rollup exist.
7. Any further tuning changes justified by observed player behavior, not
   preference.
