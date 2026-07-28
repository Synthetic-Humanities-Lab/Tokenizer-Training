# Current Surface Contract

This document records the current visible contract for the one Phaser/Vite web
runtime shared by browsers and the iOS WKWebView shell. `surface=mobile` adapts
layout, safe areas, and touch reach; it does not define a second game surface.
Historical browser-QA logs and PNGs remain useful as evidence of prior problems,
but they are not current layout requirements.

## Current Visible Surfaces

- Mobile HUD: `CREDITS`, `TIME` (or its current state label), and
  `BEST RUN` / `CURRENT`. Round `VERIFIED` and `REWORK` values are hidden during
  prediction; Training adds one compact `SAMPLES n/200` line and rail, while
  tutorial uses the same position for lesson progress and displays unlimited
  credits as `∞ TC`.
- Browser HUD: may retain the fuller credit, review accounting, progress,
  timer, and best-record display.
- playfield: static prompt lane, legal-slot guides, active cut markers, resolved cut labels, swipe trail, and falling resolved text pieces.
- Mascot: one pet Wiener in the play scene, plus one small header logo Wiener.
- Speech: one pet speech bubble sourced through `WienerSpeechSystem`.
- Feedback card: the canonical review surface for the complete resolved token
  split, economy line, and cut audit. It does not duplicate token IDs. Its
  generated technical descriptor remains hidden.
- Controls: one bottom control row in `Sound`, `Clear`, `Exit`, `Resolve` order.
  The final action becomes `Continue` or `Finish` when the round state requires
  it.
- QA geometry: only current visible surfaces and input affordances should be exposed, with compatibility mirrors limited to external QA IDs where explicitly required.

## Public Mode Vocabulary

- The player-facing mode name is `Training`.
- The menu action is `Training`.
- On a fresh profile it appears as `Training - Locked` until the player passes
  the tutorial. Qualification persists locally; prior high scores or a complete
  ten-sentence tutorial log migrate as qualified.
- The passed-tutorial action is `Start Training`.
- The Results retry action is `Run Training Again`.
- The internal mode/route identifier `endless` may remain in source, query
  parameters, QA metadata, evidence filenames, and historical records. It is not
  current player-facing copy.
- Training remains uncapped while Token Credits remain and ends when the account
  reaches zero.
- Training rotates through distinct fixture sentences unless an explicit
  development-only `qaFixtureId` route pins one case for deterministic capture.
- Passed sentences and failed-sentence cooldowns persist across sessions so the
  200-sentence catalog is attainable without one uninterrupted run. A failed
  sentence becomes eligible only after twenty other resolved prompts; while
  unseen samples remain, eligible reviews occupy at most every fifth selection.
- Tutorial resolutions seed that same persistent schedule: clean tutorial
  sentences are not repeated in Training, while failed tutorial sentences enter
  the same twenty-prompt retry cadence.
- When all unseen sentences in the current opening tier are exhausted, Training
  advances to the nearest unseen tier instead of repeating mastered material.
  The final phase mixes the full remaining queue at the accelerated deadline.
- Token Log progress is explicit as `SAMPLES n/200`; the Training HUD uses the
  same persistent sample count for its thin progress rail. At `200/200`, Token Log
  changes to `COMPLETE` while preserving any `REVIEW` count.
- Content phases unlock at rounds 4, 8, and 13: punctuation/numbers, then
  machine text, then the full queue including multilingual/spacing/symbolic edge
  cases. Wiener announces each transition once; the deadline continues
  accelerating independently.
- Training deadlines retain the accelerating round curve but receive a bounded
  workload adjustment from the sentence's required boundaries, token count, and
  displayed length. The short prompt-acquisition beat completes before the
  deadline begins, and the warning window scales down with fast rounds.
- Resolution presents judgement, falling token pieces, then the feedback card
  and Wiener speech. Clean reviews auto-advance quickly; error reviews retain a
  longer reading window. After a minimum dwell, the review control becomes
  `Next` so the player can resume before automatic continuation.

## Tutorial Completion

- Tutorial readiness remains `70%`. With a complete non-empty cut audit, the
  score remains `correct / (correct + missed + false)`; otherwise normalized
  aggregate accuracy remains the fallback.
- The failed screen keeps `Tutorial Failed`,
  `wienerworks://tutorial-failed`, `Retry Tutorial`, and `Return to Menu`.
  Retry starts the tutorial route again; menu routing is unchanged.
- Its summary is one bounded paragraph:
  `Boundary accuracy: {floored_accuracy}%. Readiness requires 70%. {correction} Qualification denied. Payroll remains unconvinced.`
- `floored_accuracy` is floored from the score used for readiness and never
  displays a failing result as `70%`. A complete audit selects missed-dominant,
  false-dominant, or tied missed-and-false correction copy. Missing audit data
  falls back to `Review the boundary evidence.`
- The diagnostic adds no cards, route, or layout change. Both cleared and failed
  outcomes mirror the exact visible heading, full summary, and two actions in
  the shared semantic surface.

## Removed Surfaces

These should not be constructed, laid out, or asserted as hidden runtime UI:

- side brand panel
- side assistant panel
- footer panel
- overseer panel
- detached tutorial popup
- separate token strip
- separate segmentation evidence card

## Review Evidence

Review token, economy, and cut evidence belongs to the feedback card. The
technical descriptor is retained as generated state but is not a visible card
row. The old token-strip path was removed to avoid duplicate token/credit
explanations competing with Wiener speech and the feedback card.

The card is a three-band audit receipt: resolved token chunks with explicit
boundary separators, a round ledger labelled `VERIFIED`, `REWORK`, and `NET`,
and a readable `OK` / `MISS` / `FALSE` cut row. Token Credits remain in the HUD
and are not repeated in the card; token count appears once in the receipt
header. Each exact tokenizer token earns 1 TC. A missed boundary invalidates the
two tokens it joins; a false cut invalidates the token it splits and adds one
false-fragment rework unit. Rework is weighted by fixture difficulty and the
current progression penalty scale.

## Numerical Token IDs

- Token IDs stay hidden while the player predicts boundaries. Active cut guides
  and staged cuts must not display IDs.
- After resolution, a falling submitted piece shows its real fixture-backed ID
  only when that complete piece exactly matches one tokenizer token span.
  Incorrect fragments and fragments spanning a missed boundary receive no
  invented ID.
- The feedback card shows the complete resolved token chunks without IDs.
- Tutorial round two uses its normal Wiener review pause to explain that the
  falling numbers are Standard Protocol vocabulary IDs for complete tokens and
  are not points. Token Log and fixture metadata retain the precise
  `cl100k_base` implementation name.
- Token Log persistently records every complete sentence encountered in resolved
  play. Exact repeated sentences appear once. Each row retains the complete
  ordered tokenizer mapping; a visible `␠` marks a space inside a token chunk.
- Each Token Log entry reflects the latest attempt: a clean retry changes
  `REVIEW` to `CORRECT`, while a later failed attempt returns it to `REVIEW`.
  Attempt totals remain visible. The paginated log retains exact `cl100k_base`
  token-to-ID mappings and first-seen order.
- IDs are encoding-specific vocabulary lookup keys. They do not communicate
  score, rank, Token Credit value, rarity, confidence, semantic meaning, or
  universal identity.
- Falling fragments follow the player's submitted cuts. Their conditional ID
  labels are evidence of exact token reconstruction, not a second scoring layer.

## Tutorial Speech

Tutorial begins with four paged new-hire orientation beats inside the canonical
Tutorial scene: job premise, token model, boundary formation, and qualification
terms including the supervised tutorial and 40 TC Training account.
The first page avoids tokenizer implementation vocabulary. Interactive rounds
then use one sticky Wiener instruction during active play and one outcome-specific
Wiener line during review. Review diagnoses distinguish clean, missed-only,
false-only, and mixed outcomes. Round two's fixed review line explains the
falling token IDs. Round ten remains qualification-neutral until the aggregate
completion screen grants or denies access to Machine Replacement Training.
Detached review-window schedules are not live surfaces and must not return as
test-only runtime APIs.

## Results

- `Token Credits Depleted` shows four visible metric cards: run, cuts, accuracy,
  and rank. Credits are omitted because depletion already establishes zero.
- `Training Suspended` shows those four cards plus remaining Token Credits
  because a voluntary exit can preserve usable session state.
- Verified, rework, net credits, yield efficiency, traces, and provenance remain internal QA evidence
  rather than a second visible ledger.
- The three result actions remain Review Token Log, Run Training Again, and
  Return to Menu in that order. Review Token Log opens the persistent sentence archive.

## Best Rank Reset

- `Reset Best Rank` is an uncommon destructive Settings action. Its first
  activation only opens `Reset Best Rank?`; it cannot clear storage.
- The confirmation states that the saved rank and round record on this device
  will be removed while Token Log, sample progress, Training access, and
  preferences remain. `Cancel` precedes the visually destructive `Reset Rank`
  action.
- Confirmed deletion checks the canonical and every legacy high-score key before
  and after the attempt. The UI reports a reset only after readable storage shows
  all keys absent or empty. Partial deletion, readback failure, and unavailable
  storage report failure and retain a surviving readable rank when one exists.
- Encountered-sentence Token Log history, Training mastery/cooldowns, tutorial
  qualification, muted state, Haptics preference, and reduced-motion reporting
  survive a Best Rank reset.
- `mode=settings-reset-confirm` is a native QA layout route. It does not prove
  that a pointer opened, cancelled, or confirmed the dialog.

## Semantic Counterpart

- One game-level DOM semantic surface mirrors the menu, results, Tutorial
  Cleared/Failed, read-only Token Log, and non-gameplay Settings contracts;
  Phaser remains the visual and gameplay state authority.
- Menu semantics expose the product heading, WienerWorks/best-rank summary, and
  Tutorial, Training, Token Log, and Settings buttons in visual order. The
  Training action mirrors the locked canvas state before qualification.
- Results semantics expose the exact visible outcome, summary, metric rows, and
  Review Token Log, Run Training Again, and Return to Menu actions.
- Tutorial outcome semantics expose the exact visible heading, full summary, and
  Start Training or Retry Tutorial followed by Return to Menu. They reuse the
  canonical tutorial copy object and publish one polite outcome announcement.
- Token Log semantics expose each displayed sentence, its Correct/Review status,
  encounter count, and every ordered `cl100k_base` token-text-to-ID pair.
  Previous and Next expose every page. Whitespace uses explicit markers and
  Unicode code-point descriptions rather than relying on pronunciation of an
  invisible character, and the static log does not trigger a live announcement.
- Settings semantics expose stable-name Sound, Reduced Motion, and capable Haptics switches,
  plus unavailable-Haptics status, Reset Best Rank,
  and Back. Semantic-origin reset confirmation is a labelled modal alert dialog
  with inert semantic/canvas background content, Cancel-first focus, contained
  Tab order, Escape routed through Cancel, and return focus to Reset Best Rank.
  Pointer-origin confirmation keeps the hidden semantic mirror nonmodal so it
  neither steals focus nor makes a false modality claim. Settings projects the
  existing audio, motion, haptics, reset, and storage authorities; it does not
  own a second preference or deletion model.
- Canvas and semantic actions call the same scene command methods. Epoch-scoped leases reject stale scene controls and duplicate activation from the same rendered snapshot.
- The semantic surface is clipped during ordinary pointer/touch play and becomes a visible, safe-area-aware control panel on keyboard focus. `semanticUi=visible` is simulator QA only and must not be used as a normal game route.
- Token slicing remains canvas-only and is not keyboard- or VoiceOver-operable.
  Settings has a structural DOM counterpart, but native screenshots do not
  prove keyboard activation or VoiceOver discovery/activation in WKWebView.
  This limited screen-level counterpart is not a WCAG conformance claim or a
  claim of whole-app VoiceOver or Larger Text support. Prompt/cut selection,
  Wiener speech, review evidence, timing accommodation, and canvas large-text
  behavior remain open work.

## Motion Preference

- One game-level runtime starts from `prefers-reduced-motion` when no saved
  choice exists. Settings exposes a persistent `Reduced Motion: On` / `Off`
  button; an explicit choice overrides later system-query changes.
- Reduced motion keeps the falling sentence because its position and completion are the round clock. Cut detection, scoring, timer duration, review sequencing, speech timing, and routing are unchanged.
- Wiener idle/reaction movement stops, resolved text pieces dissolve in place instead of falling/rotating, and cut-impact scaling becomes an opacity-only response.
- This is a bounded nonessential-motion treatment, not an App Store accessibility declaration. Enabled-state simulator/device behavior still requires paired manual evidence.

## Haptic Capability

- The shared runtime selects a native cue bridge only when the iOS shell reports
  supported haptic hardware; otherwise it uses browser vibration when exposed or
  fails soft as unavailable.
- On a capable route, Settings exposes an independent `Haptics: On` / `Haptics:
  Off` control. On an incapable route Settings omits Haptics and preserves the
  stored choice.
- The native bridge accepts only cut, confirm, clear, miss, and warning cues.
  JavaScript cannot provide arbitrary patterns or intensity; cut repeats are
  capped at four.
- Haptics remain touch-modality gated but no longer follow Sound after migration.
  A version-1 local preference is created on the first capable route: an existing
  muted player migrates to Off, while an unmuted or fresh player migrates to On.
  Later Sound and Haptics changes are independent. Malformed records are repaired
  only by an explicit choice; unsupported future records are preserved and fail
  closed for the current session.
- Cue names, call sites, timing, gameplay evidence, scoring, economics,
  progression, and routing are unchanged.
- Simulator proves bridge compilation and unavailable-state truth only. Physical
  tactile output, cue comfort, and the Sound/Haptics preference matrix require a
  supported iPhone device pass.
