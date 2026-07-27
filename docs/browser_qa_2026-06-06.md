# Browser QA Evidence - 2026-06-06

> **Historical provenance.** This dated record preserves what the 2026-06-06
> build and QA harness showed. Its strings, IDs, labels, product names, counts,
> and screenshot descriptions are observations, not current requirements. See
> `docs/current_surface_contract.md` for the current browser/iOS surface.

Target: `http://127.0.0.1:5173/` in the Codex in-app Browser.

## Result

Browser-readable QA snapshots were collected for representative desktop and
portrait playtest states. Raster screenshot capture was attempted through the
same browser session and failed with `Page.captureScreenshot` timeout, so this
note is geometry/state evidence, not screenshot proof.
A follow-up attempt on fallback dev port `5176` failed with the same screenshot
timeout, while snapshot-only checks still booted the expected desktop and
portrait states.

After that failure, the dev build added an app-authored canvas QA capture. The
browser still reads the same QA snapshot JSON, but the game itself exports the
Phaser canvas into a hidden JSON node after render. This produced persistent PNG
captures in `docs/browser_qa/`.

A later short-phone follow-up added the dev-only `qaViewport=320x568` launch
parameter because the in-app Browser viewport override did not resize Phaser's
reported canvas. This is an internal QA harness, not a real mobile-device
claim. It produced compact `320x568` canvas captures for menu, tutorial active,
review-popup, review-feedback, tutorial-complete handoff, results, and protocol
results phases.

A later follow-up on dev port `5180` used the same in-app Browser and
app-authored canvas capture path after the compact review fixes. That pass
verified the active tutorial popup/toast state, sampled the portrait sentence
moving upward with the timer, and caught then rechecked a compact review defect:
resolved text was parked under the top controls and the feedback card was
rendered beneath the playfield layer. The current code now separates active
top-exit motion from a safe review text position and renders the compact
feedback card above the playfield.

## Captured States

| Case | Viewport | Scene | Evidence |
| --- | --- | --- | --- |
| Desktop tutorial active | `1280x720` | `PlayScene` | Tutorial round 1 active, fixture `simple_001`, 16 legal slots, text panel and robot instruction popup visible. |
| Desktop tutorial review | `1280x720` | `PlayScene` | Review phase reached from Resolve, token strip visible, robot review popup below token-strip evidence, no redundant robot toast. |
| Desktop tutorial-complete | `1280x720` | `TutorialCompleteScene` | Handoff panel visible with `Start Endless Training` primary action and `Return to Menu` secondary action. |
| Desktop protocol results | `1280x720` | `ResultsScene` | Protocol QA result exposes run ID `mtt-protocol-qa`, start source `handoff-screen`, input `touch`, fixture round trace in the Copy Summary payload, ledger panel, and result actions. |
| Portrait tutorial active | `390x844` | `PlayScene` | Compact tutorial round 1 active with controls, moving text, shortened near-text robot toast, tutorial popup, and shortened bottom overseer line inside viewport. |
| Portrait tutorial review | `390x844` | `PlayScene` | Compact review phase reached from Resolve; token strip bottom is about `235px`, review popup top is about `311px`, and bottom overseer remains inside the viewport. |
| Portrait review follow-up | `390x844` | `PlayScene` | Follow-up canvas QA on port `5180` verifies review text below controls, token strip below the text panel, review popup with clearance, readable feedback card above the playfield, and bottom overseer inside the viewport. |
| Small-phone tutorial active | `320x568` via `qaViewport` | `PlayScene` | Dev-only compact canvas QA verifies the tutorial popup below controls, above the sentence panel, with feedback hidden while active. |
| Small-phone review popup | `320x568` via `qaViewport` | `PlayScene` | Dev-only compact canvas QA verifies the constrained review popup with feedback hidden, avoiding the impossible popup/feedback stack. |
| Small-phone review feedback | `320x568` via `qaViewport` | `PlayScene` | Dev-only compact canvas QA verifies the later feedback phase with the popup gone and the compact audit line inside the card. |
| Small-phone menu | `320x568` via `qaViewport` | `MenuScene` | Dev-only compact canvas QA verifies title, module label, premise, best record, and three first-action controls without stacking. |
| Small-phone tutorial-complete | `320x568` via `qaViewport` | `TutorialCompleteScene` | Dev-only compact canvas QA verifies the handoff summary and `Start Endless Training` action remain readable. |
| Small-phone results | `320x568` via `qaViewport` | `ResultsScene` | Dev-only compact canvas QA verifies the shortened visible ledger, summary, and result actions fit in the panel. |
| Small-phone protocol results | `320x568` via `qaViewport` | `ResultsScene` | Dev-only compact canvas QA verifies protocol copy evidence remains present while the visible ledger stays compact. |

## Canvas Raster Captures

These files were captured from the Phaser canvas on fallback dev port `5176`
using the app-authored `tokenization-training-canvas-qa` JSON node. They
are raster evidence of the game canvas, not `Page.captureScreenshot` output.

| File | Viewport | Scene | Evidence |
| --- | --- | --- | --- |
| `docs/browser_qa/2026-06-06-canvas-desktop-menu.png` | `1280x720` | `MenuScene` | Menu raster shows the degraded assistant-browser shell, first-action premise, tutorial/endless/sound actions, and best-record state. |
| `docs/browser_qa/2026-06-06-canvas-desktop-tutorial-active.png` | `1280x720` | `PlayScene` | Tutorial active raster shows HUD, robot tutorial popup, near-text robot comment, moving text, legal slots, and controls. |
| `docs/browser_qa/2026-06-06-canvas-desktop-tutorial-review.png` | `1280x720` | `PlayScene` | Tutorial review raster shows token strip, review robot popup, feedback card, overseer panel, and review controls. |
| `docs/browser_qa/2026-06-06-canvas-desktop-handoff.png` | `1280x720` | `TutorialCompleteScene` | Handoff raster shows `Start Endless Training` and `Return to Menu` inside the same visual shell. |
| `docs/browser_qa/2026-06-06-canvas-desktop-protocol-results.png` | `1280x720` | `ResultsScene` | Protocol results raster shows ledger/copy-summary evidence, rank, run state, and result actions. |
| `docs/browser_qa/2026-06-06-canvas-portrait-tutorial-active.png` | `390x844` | `PlayScene` | Portrait active raster shows compact HUD, controls, tutorial popup, shortened near-text robot comment, moving text, slots, and shortened bottom overseer line. |
| `docs/browser_qa/2026-06-06-canvas-portrait-tutorial-review.png` | `390x844` | `PlayScene` | Portrait review raster shows compact review evidence, token strip, feedback card, controls, and bottom overseer. |
| `docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-active.png` | `320x568` via `qaViewport` | `PlayScene` | Small-phone active raster shows the tutorial popup below the compact control row and above the sentence panel. |
| `docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-review-popup.png` | `320x568` via `qaViewport` | `PlayScene` | Small-phone review-popup raster shows the constrained robot review window while feedback is hidden. |
| `docs/browser_qa/2026-06-06-canvas-small-phone-tutorial-review-feedback.png` | `320x568` via `qaViewport` | `PlayScene` | Small-phone review-feedback raster shows feedback after the popup hides, with compact audit copy inside the card. |
| `docs/browser_qa/2026-06-06-canvas-small-phone-menu.png` | `320x568` via `qaViewport` | `MenuScene` | Small-phone menu raster shows separated title/module/premise copy and all first-action controls. |
| `docs/browser_qa/2026-06-06-canvas-small-phone-handoff.png` | `320x568` via `qaViewport` | `TutorialCompleteScene` | Small-phone handoff raster shows readable tutorial-complete copy and actions. |
| `docs/browser_qa/2026-06-06-canvas-small-phone-results.png` | `320x568` via `qaViewport` | `ResultsScene` | Small-phone results raster shows the compact visible ledger, summary, and actions. |
| `docs/browser_qa/2026-06-06-canvas-small-phone-protocol-results.png` | `320x568` via `qaViewport` | `ResultsScene` | Small-phone protocol-results raster shows the compact ledger plus full hidden Copy Summary payload in QA state. |

## Claim Boundary

This pass strengthens internal browser QA evidence for layout geometry, route
boot, scene state, protocol-copy payloads, and actual canvas raster output. It
still does not prove real touch behavior, finger occlusion, physical-device
readability, or player comprehension. `qaViewport` proves compact canvas layout
inside the browser harness only. Real mobile evidence still requires real user
sessions.
