# Browser QA Runtime Pass - 2026-06-07

> **Historical provenance.** This dated record preserves what the 2026-06-07
> build and QA harness showed. Its strings, IDs, labels, product names, counts,
> and screenshot descriptions are observations, not current requirements. See
> `docs/current_surface_contract.md` for the current browser/iOS surface.

This pass used the already-running local dev server at
`http://127.0.0.1:5178/` and the in-app Browser. It is live runtime evidence
for route boot, canvas QA export, scene transitions, and one main-verb
swipe/resolve path. It is not real-device touch evidence and it is not player comprehension evidence.

## Scope

All checks used the dev-only `qaViewport=390x844` canvas-size harness so the
browser could inspect a portrait first-user layout without relying on the
intermittent `Page.captureScreenshot` path. The game wrote both
`tokenization-training-qa` and `tokenization-training-canvas-qa`
for each inspected state.

## Route Smoke

| Case | Result |
| --- | --- |
| `/?playtestReset=1&qaViewport=390x844` | Booted `MenuScene`; QA snapshot and canvas capture existed; title, module label, premise, best record, and tutorial/endless/sound actions were present. |
| `/?mode=tutorial&playtestReset=1&qaViewport=390x844` | Booted `PlayScene` in tutorial active phase; fixture `simple_001`, moving text, tutorial popup, near-text robot comment, controls, HUD, and overseer were present. |
| `/?mode=tutorial-complete&playtestReset=1&qaViewport=390x844` | Booted `TutorialCompleteScene`; `Start Endless Training` and `Return to Menu` actions were present. |
| `/?mode=protocol-results&playtestReset=1&qaViewport=390x844` | Booted `ResultsScene`; compact ledger and hidden full Copy Summary payload were present, including run ID `mtt-protocol-qa`, start source `handoff screen`, input `touch`, fixture round trace, OK/missed/false counts, net, and best record. |

No browser console warnings or errors were reported for these route checks.

## Interaction Smoke

The `qaViewport` canvas rendered inside the browser viewport at offset
`x=445, y=-62`, so pointer checks mapped game-space button coordinates into
browser viewport coordinates before clicking.

| Interaction | Evidence |
| --- | --- |
| Menu `Begin Training` button | Click transitioned from `MenuScene` to `PlayScene`, `mode=tutorial`, `phase=active`, round `1`; overseer text was `TUTORIAL 1/5: Predict tokenizer boundaries, not reading pauses.` |
| Tutorial-complete `Start Endless Training` button | Click transitioned from `TutorialCompleteScene` to `PlayScene`, `mode=endless`, `phase=active`; overseer text was `Predict OpenAI-style boundaries. Legacy assistant confidence withheld.` |
| Tutorial swipe at the first `simple_001` token boundary | A vertical drag through the centered boundary after `the` changed cut count from `0` to `1`; cut status became `CUTS: 1 / 16`. |
| Resolve after the tutorial swipe | Click transitioned the round to review phase; token strip rendered `the | _cat | _sat | _on | _the | _mat`; feedback was visible; overseer text was `Words split cleanly here. Payroll accepts the obvious for one round.` |

No browser console warnings or errors were reported for the interaction checks.

## Claim Boundary

This pass strengthens internal readiness evidence for controlled launch,
clickable first-action and handoff surfaces, actual cut registration, review
transition, token-strip explanation, feedback visibility, protocol summary
payload shape, and app-authored canvas capture availability. It does not prove
real phone/tablet touch readability, finger occlusion, snap trust on physical
devices, or whether uncoached players understand tokenization, economy, or the
labor fiction. Those remain user-base playtest requirements.

## Follow-Up Implementation Check

A later implementation pass changed the visual theme, tutorial instruction
sequence, near-action robot comments, and visible-space cut suppression. The
follow-up dev server started at `http://127.0.0.1:5179/`, and `curl -I`
returned `200 OK`.

Direct browser visual automation was not available in that follow-up pass:
Playwright was not installed in the local Node dependency tree, the Node REPL
could not import `playwright`, and Chrome Computer Use was denied. There is no new raster
screenshot or canvas PNG should be inferred from this section.

Local validation for the follow-up pass:

- `npm run generate:fixtures` regenerated 39 fixtures.
- `npm run test` passed 56 test files and 347 tests after the first follow-up.
- A later cut-input refinement added a deliberate following-token regression,
  and `npm run test -- tests/cut-input-session.test.ts` passed 17 tests.
- `npm run build` passed after the visual/tutorial/input changes.
- `npm run playtest:audit` still failed only because real session notes and a
  completed rollup are missing.

Follow-up implementation claims are therefore local code/test/build evidence,
not browser screenshot proof:

- the interface uses a warmer degraded assistant-browser palette and shared
  chrome vocabulary across the game shell;
- tutorial rounds now sequence robot-supervisor narrative, mechanics,
  technical, and review windows;
- near-text robot comments strip repeated tutorial headers and stay brief near
  the moving text;
- visible-space input collapses ambiguous near-space duplicate cuts while still
  allowing deliberate following-token cuts after the space run.

## Current Canvas Raster Evidence

A subsequent in-app Browser pass on dev port `5173` restored browser access for
the latest visual/tutorial/input build. Direct tab screenshot capture still
timed out through `Page.captureScreenshot`, so this pass used the dev-only
`tokenization-training-canvas-qa` node. Stable desktop states were read in
small data-URL chunks; the active desktop PlayScene continually rewrites its QA
capture while the sentence moves, so that unstable desktop active capture was
discarded instead of treated as evidence.
The follow-up QA harness now supports `qaFreezeElapsedMs=<milliseconds>` for
active PlayScene checks. That dev-only parameter freezes the active-round clock
at a deterministic elapsed time so the canvas QA node stops racing the moving
sentence while a capture is being read.

The following PNGs were written to `docs/browser_qa/` and verified as readable
PNG files with PIL:

| File | Viewport | State |
| --- | --- | --- |
| `2026-06-07-browser-canvas-desktop-menu.png` | `1280x720` | Current WienerWorks division menu with training/endless/sound actions. |
| `2026-06-07-browser-canvas-desktop-tutorial-review.png` | `1280x720` | Tutorial round 1 review reached by browser click on Resolve; token strip, review popup, feedback card, bottom overseer, and controls visible. |
| `2026-06-07-browser-canvas-desktop-handoff.png` | `1280x720` | Tutorial-complete handoff with Endless and Menu actions. |
| `2026-06-07-browser-canvas-desktop-protocol-results.png` | `1280x720` | Protocol results ledger and copied-summary evidence state. |
| `2026-06-07-browser-canvas-portrait-tutorial-active.png` | `390x844` | Portrait tutorial active state with robot window, instruction card, moving text, controls, and bottom overseer visible. |
| `2026-06-07-browser-canvas-portrait-protocol-results.png` | `390x844` | Portrait protocol results state with compact ledger and result actions. |

No browser warning or error logs were reported during this current raster pass.

These files improve current internal visual evidence for the latest interface
and tutorial changes, but they remain canvas-level QA artifacts. They still do
not prove full-tab screenshot reliability, real phone/tablet touch readability,
finger occlusion, snap trust on a physical device, or player comprehension.

## QA Harness Follow-Up

`qaFreezeElapsedMs` was then used with `qaViewport` on dev port `5180` to
capture deterministic active PlayScene states and the printed QA-link handoff
and protocol-result states. The first small-phone active capture exposed a real
layout fault: the active tutorial popup stayed at its initial position while
the sentence moved upward and covered the token text at `320x568`. The fix
makes short-phone active tutorial popups constrained, passes the active text
panel top edge into popup layout, and relayouts visible tutorial popups whenever
sentence motion updates the text panel. The small-phone protocol-results
capture also exposed a title and summary collision; the result layout now uses
a smaller narrow-phone title and tests the title/summary text-block gap.

The following PNGs were written to `docs/browser_qa/`, verified as readable PNG
files, and checked in the browser QA pass for scene, viewport, canvas size, and
small-phone popup/text-panel separation:

| File | Viewport | State |
| --- | --- | --- |
| `2026-06-07-frozen-canvas-desktop-tutorial-active.png` | `1280x720` | Frozen tutorial active state at `qaFreezeElapsedMs=6200`; robot popup, near-text instruction, moving text, controls, HUD, and side supervisor artifact visible. |
| `2026-06-07-frozen-canvas-portrait-tutorial-active.png` | `390x844` | Frozen portrait tutorial active state at `qaFreezeElapsedMs=6200`; compact controls, robot popup, instruction card, moving text, and bottom overseer visible. |
| `2026-06-07-frozen-canvas-small-phone-tutorial-active.png` | `320x568` | Frozen small-phone tutorial active state after the overlap fix; constrained robot popup stays clear of the moving token text. |
| `2026-06-07-qa-links-desktop-handoff.png` | `1280x720` | Printed QA-link tutorial-complete handoff with Endless and Menu actions. |
| `2026-06-07-qa-links-portrait-protocol-results.png` | `390x844` | Printed QA-link portrait protocol results ledger and actions. |
| `2026-06-07-qa-links-small-phone-protocol-results.png` | `320x568` | Printed QA-link small-phone protocol results ledger and actions after the title/summary overlap fix. |

Run `npm run playtest:qa-links -- --port <printed-port>` to print the current
set of frozen active-state and protocol-result QA URLs. This improves
repeatable internal browser QA for the moving text path. It is not user
evidence, does not change production play, and does not replace physical
touch-device observation.

The same small-phone protocol-results PNG was refreshed later from the strict
local server at
`/?mode=protocol-results&playtestReset=1&qaViewport=320x568` after the compact
ledger row-height fix. The QA state reported `ResultsScene`, compact mode,
viewport `320x568`, run ID `mtt-protocol-qa`, start source `handoff-screen`,
input `touch`, and no browser warning or error logs. Visual inspection confirms
that ledger row rules no longer cut through `Run`, `Cuts`, `Pay`, `Net`,
`Eff`, `Rank`, or `Best` text, and the Copy Summary, Run Training Again, and
Return to Menu buttons remain separated below the ledger.

## Latest Current-Build QA Refresh

A further in-app Browser pass used the still-running dev server on port `5180`
after the current UI, tutorial, motion, and space-run input fixes. Direct tab
screenshots remain unreliable, so this pass again used
`tokenization-training-canvas-qa`. The first data-URL copy path truncated
large PNG payloads, so the final artifacts were captured through chunked
data-URL reads and then decoded and verified with PIL before being kept.

This pass included an actual first-round drag and Resolve interaction rather
than only frozen route loads. The tutorial active state started at round `1`
with fixture `simple_001`; a drag through the first token boundary staged one
cut, changed the active status to `SEGMENTS STAGED: 1 / 16`, and Resolve moved
the scene to review. The review canvas showed token strip
`the | _cat | _sat | _on | _the | _mat`, visible feedback, and the brief
near-action robot line `Words split cleanly here. Payroll accepts the obvious
for one round.` No browser warning or error logs were reported during this
current-build refresh.

The following PNGs were written to `docs/browser_qa/` and verified as readable
PNG files:

| File | Viewport | State |
| --- | --- | --- |
| `2026-06-07-latest-canvas-desktop-menu.png` | `1280x720` | Current WienerWorks division menu shell. |
| `2026-06-07-latest-canvas-desktop-tutorial-active.png` | `1280x720` | Current desktop tutorial active state with robot popup, near-text comment, moving text, HUD, and controls. |
| `2026-06-07-latest-canvas-desktop-tutorial-review.png` | `1280x720` | Current desktop tutorial review reached through browser drag plus Resolve; staged cut evidence, token strip, feedback, and supervisor copy visible. |
| `2026-06-07-latest-canvas-portrait-tutorial-active.png` | `390x844` | Current portrait tutorial active state with constrained popup/comment layout and visible moving text. |
| `2026-06-07-latest-canvas-small-phone-tutorial-active.png` | `320x568` | Current small-phone tutorial active state after the active-popup/text-panel separation fix. |

This is the strongest current internal raster evidence for the latest visual
and input build, because it verifies both static responsive surfaces and an
actual cut/resolve path. It is still not full-tab screenshot proof, not real
phone/tablet touch evidence, and not user comprehension evidence.

## Canvas QA Extraction Hardening - 2026-06-07

A direct in-app Browser screenshot retry against the existing strict local game
shell on port `5173` again timed out in `Page.captureScreenshot`. The game shell
loaded correctly, exposed `tokenization-training-qa`, exposed
`tokenization-training-canvas-qa`, and reported no browser warning or
error logs, but no full-tab PNG was produced.

Because the single canvas JSON node can exceed the browser automation return
limit, the dev-only QA runtime now also writes
`tokenization-training-canvas-qa-chunks` plus numbered
`tokenization-training-canvas-qa-chunk-N` text nodes. The manifest records
scene, viewport, canvas size, chunk size, chunk count, full data-URL length,
data-URL hash, and a capture id. Chunk nodes keep the raw data-URL text but are
stamped with the same `data-capture-id` and `data-data-url-hash`; the runtime
writes chunk nodes before publishing the manifest so extractors can reject mixed-frame reads
or stale-length matches instead of assembling a corrupt PNG.
The chunk nodes reconstruct the exact canvas PNG data URL without requiring one
large DOM read. This makes future internal raster capture more reproducible, but
it is still app-authored canvas evidence rather than full-tab screenshot proof
or physical-device touch evidence.

Using that chunk manifest, the current desktop menu work-order raster was saved
as `docs/browser_qa/2026-06-07-chunked-canvas-desktop-menu.png` at `1280x720`.
It shows the current WienerWorks division menu with the work-order ledger
visible. It closes the stale "no current menu ledger canvas raster" gap, but not
the full-tab screenshot gap.

## Live Compact Popup Regression - 2026-06-07

A further in-app Browser pass used a fresh strict dev server on port `5181`
for the current worktree. Desktop menu boot exposed the expected
`Tokenizer Training` title, the WienerWorks division menu QA
state, and no browser warning or error logs. A desktop tutorial route then
accepted a drag through the first `simple_001` boundary, staged exactly one
cut, and resolved to review with token strip
`the | _cat | _sat | _on | _the | _mat`, visible feedback, and the brief
near-action robot line.

The same pass found a compact layout regression at `390x844` with
`qaFreezeElapsedMs=6200`: the active tutorial robot popup intersected the
compact Resolve control row. The layout fix shortens normal phone active
tutorial popups and parks them below the controls while keeping them above the
robot toast and moving text panel. The recheck reported:

- popup/control overlap: `false`
- popup/text-panel overlap: `false`
- popup/robot-toast overlap: `false`
- overseer/control overlap: `false`
- popup edges: top `194`, bottom `330`
- Resolve row edges: top `146`, bottom `186`
- text-panel edges: top `402.78`, bottom `498.78`

`tests/tutorial-popup-layout.test.ts` now includes this `390x844` active
tutorial regression. This is useful internal runtime QA, but it is still not
physical-device touch evidence and does not prove player comprehension.

## Direct Full-Tab Screenshot Retry - 2026-06-07

Another in-app Browser retry used the existing strict local game shell on port
`5173`. `npm run playtest:doctor` confirmed that
`http://127.0.0.1:5173/?playtestReset=1` returned HTTP 200 with the expected
title, game root, and reset parameter. The browser then attempted direct
full-tab captures for the reset menu and a frozen tutorial active route:
`/?mode=tutorial&playtestReset=1&qaFreezeElapsedMs=6200`.

The retry still timed out while running the browser screenshot path through
`Page.captureScreenshot`; no `2026-06-07-full-tab-*` PNG files were produced
and none should be inferred. The current local evidence therefore remains
browser QA snapshots plus app-authored canvas rasters, with full-tab screenshot
proof and physical phone/tablet touch proof still absent.

## In-App Browser Screenshot Recheck - 2026-06-07

A later in-app Browser retry used the still-running local game shell on
`http://127.0.0.1:5183/?playtestReset=1` after the launch-check metadata
hardening. `npm run playtest:launch-check -- --host 127.0.0.1 --port 5183`
passed HTTP response, title, game root, and reset-parameter checks for
same-machine shakedown use. The Browser runtime then attempted a viewport tab
screenshot of the reset menu through `tab.screenshot({ fullPage: false })`.

The call again timed out on the underlying `Page.captureScreenshot` command
before any PNG bytes were returned. No full-tab menu or tutorial screenshot file
was written during this retry. This keeps the full-tab screenshot gap current,
not historical; the reliable visual evidence remains the browser-readable QA
state plus app-authored canvas rasters, and real phone/tablet touch evidence is
still required separately.

## Compact Robot Toast Re-Raster - 2026-06-07

A follow-up compact UI pass addressed the crowded `320x568` active tutorial
state. When the moving text panel climbs too close to the compact control row,
the near-text robot comment now collapses from a labeled supervisor popup into
a short one-line strip between the controls and the token text. The fuller
label still appears on roomier compact and desktop layouts.

`2026-06-07-tight-toast-small-phone-tutorial-active.png` was captured from the
existing strict local server at
`/?mode=tutorial&playtestReset=1&qaViewport=320x568&qaFreezeElapsedMs=6200`.
The QA state reported `PlayScene`, tutorial active phase, fixture
`simple_001`, round `1`, `legalSlotCount: 16`, canvas `320x568`, and no
browser warning or error logs. The PNG was written through the app-authored
canvas QA node and is therefore current internal raster evidence, not
full-tab screenshot proof and not physical-device touch proof.

## Review Trail And Balance Recheck - 2026-06-07

A further strict-port in-app Browser pass used `http://127.0.0.1:5173/` after
the review feedback and input-trail fixes. The browser loaded
`/?mode=tutorial&playtestReset=1`, dragged through the first `simple_001`
boundary, clicked Resolve, and inspected the immediate review QA state before
the tutorial advanced.

The QA state reported `PlayScene`, tutorial review phase, round `1`, fixture
`simple_001`, `cutCount: 1`, and no browser warning or error logs. The feedback
card text was:

```text
Expected boundary missed.
Pay $0.69 - Cost $10.02 = Net -$9.33
Boundary audit: OK 1 / Missed 4 / False 0 / Tokens 6 / Balance $30.67 / Cost drivers: missed, token load
```

The same immediate review frame was saved as
`docs/browser_qa/2026-06-07-review-no-ui-trail-balance.png` from the chunked
canvas QA nodes. Visual inspection confirmed that the stale amber diagonal
trail from the sentence area to the Resolve control no longer persists into
review; UI clicks no longer extend the cutting trail, and resolution clears
the trail before audit evidence is shown. This remains app-authored canvas QA
evidence, not full-tab screenshot proof or physical-device touch proof.

A later post-fix browser recheck on fresh dev port `5182` found that the older
desktop tutorial review raster could still show a transient diagonal swipe
trail over the review card. The PlayScene now treats that trail as
active-phase-only: resolution hides and clears it, trail redraw bails out while
reviewing, and the next active round explicitly re-enables the trail layer.
The recheck used
`/?mode=tutorial&playtestReset=1&qaFreezeElapsedMs=6200`, staged one
`simple_001` cut, clicked Resolve, and captured a stable chunked review frame
before the tutorial advanced. The refreshed
`docs/browser_qa/2026-06-07-review-no-ui-trail-balance.png` shows tutorial
review phase, round `1`, `cutCount: 1`, filed balance copy, no stale diagonal
trail over the feedback card, and no browser warning or error logs.

## Desktop Menu Work-Order Follow-Up - 2026-06-07

A later menu-surface pass added a desktop-only work-order ledger to the first
screen. The ledger names the task, rate logic, and degraded inference-cost
premise without changing the compact phone menu. Source-level and layout QA now
cover the work-order copy, desktop bounds, compact exclusion, and browser QA
snapshot rows.

Validation and runtime checks:

- `npm run test -- tests/menu-content.test.ts tests/menu-layout.test.ts tests/menu-scene-qa.test.ts tests/responsive-surface-sweep.test.ts`
  passed 38 tests.
- Vite served the current worktree at `http://127.0.0.1:5181/`; `curl -I`
  against `/?playtestReset=1&qaViewport=1280x720` returned HTTP `200 OK`.
- Chrome headless screenshot capture failed with exit `134`; no full-tab
  `2026-06-07-menu-work-order-desktop.png` file was produced.
- Computer Use access to Chrome was denied, so no fallback app screenshot was
  captured.

This follow-up was source/layout/QA-snapshot evidence at the time. The later
chunked canvas pass above now provides current app-authored menu raster evidence
for the work-order ledger, while full-tab screenshot proof remains missing.

## Continuation Menu Raster Recheck - 2026-06-07

A continuation in-app Browser smoke used the existing same-machine strict shell
at `http://127.0.0.1:5173/?playtestReset=1`. The page title was
`Tokenizer Training`, `#game-root` existed, the Phaser canvas reported
`1280x720`, the menu QA JSON was present, and the chunked canvas manifest
reported `MenuScene`, `1280x720`, five chunks, capture id
`MenuScene-1280-720-261834-d7b253e0`, and data-URL length `261834`.

The first attempt to return the whole reconstructed data URL through the browser
tool boundary was truncated, which produced a partial PNG in a temporary path.
The reliable extraction read one chunk at a time from
`tokenization-training-canvas-qa-chunk-N`, reassembled the data URL
outside the page, and wrote
`docs/browser_qa/2026-06-07-continuation-canvas-menu.png`. The final PNG is
`196357` bytes, validates at `1280x720`, and has a complete `IEND` chunk.

Visual inspection of the JPEG preview showed the full WienerWorks division menu shell,
centered Tokenizer Training card, work-order ledger, and
Begin Training, Endless Training, and Sound controls without the earlier
temporary truncation artifact. This is current app-authored canvas evidence
only; it still does not prove full-tab screenshot capture or real phone/tablet
touch readability.

## Post-UI Byte Route Portrait Recheck - 2026-06-07

A post-UI continuation recheck used the same in-app Browser shell on
`http://127.0.0.1:5183/?mode=tutorial&playtestReset=1&qaViewport=390x844&qaFreezeElapsedMs=6200`.
The browser waited into the tutorial byte-route timer window so the current
technical-tokenization popup, near-text robot comment, moving text panel, and
bottom overseer could be inspected in the same portrait frame.

The QA state reported `PlayScene`, tutorial active phase, round `1`, fixture
`simple_001`, `cutCount: 0`, `legalSlotCount: 16`, input modality `none`,
canvas `390x844`, three chunked canvas-QA data nodes, and data-URL hash
`58c1dbf4`. The visible popup title was `ROBOT SUPERVISOR - BYTE ROUTE 1/5`;
its body explained the text-to-UTF-8-bytes-to-token-IDs path. The near-text
robot strip read `UTF-8 bytes become chunks, then token IDs.` Visual inspection
confirmed that the byte-route popup, near-text robot strip, moving text panel,
and bottom overseer were all visible without overlap.

The reconstructed chunked canvas PNG was saved as
`docs/browser_qa/2026-06-07-post-ui-byte-route-portrait.png`. This remains
app-authored canvas QA evidence only; it is not full-tab screenshot proof,
physical-device touch proof, or player comprehension evidence.
