# WienerWorks Copy Deck

## Global chrome

- **browser_path:** `wienerworks://legacy-language-ops`
- **company_name:** `WienerWorks`
- **product_name:** `Tokenizer Training`
- **division_name:** `Human Segmentation Division`
- **browser_badge:** `2026 AI browser / retained for compute rationing`
- **status_badge:** `legacy language operations shell`
- **mode_badge_tutorial:** `guided compliance route`
- **mode_badge_endless (internal key):** `paid shift simulation`

## Main menu

This section is the current visible menu-copy authority. The public mode name is
`Training`; `endless` is reserved for internal route/mode identifiers and
historical evidence.

### Heading stack

- **company_mark:** `Welcome to WienerWorks`
- **title:** `Tokenizer Training`

### Best-rank status

- **best_rank:** `BEST RANK` / `{rank}` / `{rounds} rounds` on three lines

### Buttons

- **tutorial:** `Tutorial`
- **training:** `Training`
- **token_log:** `Token Log`
- **settings:** `Settings`

The current menu has no visible premise, work-order prose, or Sound control.
Sound is configured inside Settings.

### Retired menu prose (historical reference only)

The following strings describe a superseded menu. They are preserved for copy
provenance only and must not be used as current UI or QA requirements.

#### Superseded heading and body

- **subtitle:** `Human Segmentation Division`
- **body:** `Large-model inference exceeded acceptable margin on this route. WienerWorks now trains human operators to predict token boundaries inside a retained legacy browser. Accuracy extends the shift. Error feeds recovery.`

#### Superseded supporting copy

- `Predict learned token boundaries.`
- `Swipe through legal slice slots.`
- `Useful cuts earn pay.`
- `Misses and false cuts create company cost.`
- `Shift closes at zero balance.`

#### Superseded controls and record labels

- **tutorial:** `Begin Tutorial`
- **training:** `Endless Training`
- **sound_on:** `Sound: On`
- **sound_off:** `Sound: Off`
- **best_label:** `Best Record`
- **rank_label:** `Rank`
- **rounds_label:** `Rounds Cleared`

## Settings

### Settings status

- **reduced_motion_on:** `Reduced Motion: On`
- **reduced_motion_off:** `Reduced Motion: Off`
- **reduced_motion_unavailable:** `Reduced Motion: Unavailable`
- **haptics_on:** `Haptics: On`
- **haptics_off:** `Haptics: Off`
- **haptics_unavailable:** `Haptics: Unavailable`

## HUD and play chrome

- **credits:** `CREDITS`
- **credits_low:** `CREDITS LOW`
- **credits_empty:** `CREDITS EMPTY`
- **verified:** `VERIFIED`
- **rework:** `REWORK`
- **samples:** `SAMPLES {encountered}/200`
- **tutorial_credits:** `∞ TC`
- **round_tier:** `ROUND / TIER`
- **tutorial:** `TUTORIAL`
- **rank:** `RANK`
- **time:** `TIME`
- **review:** `REVIEW`
- **best:** `BEST`
- **resolve_button_idle:** `Resolve`
- **resolve_button_count:** `Resolve {count}`
- **resolve_button_review:** `Continue`
- **resolve_button_finish:** `Finish`
- **clear_button:** `Clear Cuts`
- **clear_button_count:** `Clear {count}`
- **sound_button:** `Sound`
- **exit_tutorial:** `Exit Tutorial`
- **exit_training:** `Exit Training`

## Core terms

Use these terms consistently.

- **slot:** a displayed cut position; each visible space run has one centered slot rather than separate cuts on both sides
- **cut:** a boundary guess submitted by the player
- **staged cut:** a cut currently marked before Resolve
- **correct cut:** a player cut that matches the tokenizer boundary
- **missed boundary:** a tokenizer boundary the player did not cut
- **false cut:** a player cut where the tokenizer did not split
- **token:** a chunk produced by the tokenizer
- **review record:** the feedback-card evidence showing resolved chunks and IDs
- **Token Credit (`TC`):** fictional operating currency; distinct from a tokenizer token or vocabulary ID
- **verified:** one TC earned for each exact tokenizer token preserved by the submitted cuts
- **rework:** weighted TC deduction for invalidated tokens and extra false-cut fragments
- **net:** verified credits minus rework
- **credits:** the remaining Training account; zero ends the run

Avoid during tutorial:
- `word break`
- `grammar split`
- `sentence split`
- `space split`
- `meaning unit`
- `reassemble`

Preferred phrasing:
- `token boundary`
- `possible cut`
- `staged cut`
- `token chunk`
- `review record`
- `boundary audit`
- `Token Credits`
- `verified tokens`
- `rework`

## Visual teaching language

The tutorial should explicitly name what the player sees on screen.

- **pale verticals:** `possible cut guides`
- **orange verticals:** `staged cuts` or `training targets`, depending on mode
- **OK label:** `correct cut`
- **MISS label:** `boundary you missed`
- **FALSE label:** `cut where the tokenizer did not split`
- **review record:** `the actual token chunks and boundary audit`
- **falling ID:** `the vocabulary ID attached only to an exact resolved token`
- **feedback card:** `the review record, boundary audit, and ledger result`
- **speech bubble:** `Wiener’s review note`
- **timer bar:** `time remaining before automatic review`

When target hints are shown, use:
`Wiener has marked the training targets in orange.`

When player cuts are staged, use:
`Orange marks are your staged cuts.`

Do not use the same line for both states.

## Tutorial design contract

The tutorial now runs ten rounds.

Each round should:
1. show the example string in the live play lane
2. show every playable guide, with one centered guide for each visible space run
3. give one short instruction from Wiener
4. let the player stage cuts
5. allow Clear before Resolve
6. reveal OK / MISS / FALSE labels after Resolve
7. show resolved token chunks in the feedback card and truthful IDs on exact falling tokens
8. show verified credits, rework, net, and boundary audit; the first review explains the ledger
9. advance through Continue

The tutorial should teach while the player is interacting, not through detached memo cards.

The ten-round route must preserve these underlying concepts through its active
instructions, resolved evidence, review speech, and fixture order:

- the intake establishes bytes, learned token chunks, and numeric IDs before play
- early interactive rounds teach swipe, Resolve, review labels, and Clear before adding new theory
- staged player cuts never change the tokenizer's fixed boundary truth
- a visible space can belong to the following token chunk and its one ID
- readable words can map to one chunk, part of one chunk, or several chunks
- learned merge patterns, not grammar or meaning, determine punctuation splits

These are content requirements, not additional popup stages or timed speech
windows. Do not duplicate the feedback card with detached explanations.

Use `chaos_005` for the spaces round in this copy pass. Older notes that say
`spacing_001` describe the intended concept, not a fixture rename.

## Tutorial route

`src/game/systems/TutorialSystem.ts` is the canonical runtime copy. This section
records its curriculum and fixture contract; it is not a second selectable line
bank. Every review has distinct clean, missed-only, false-only, and mixed
diagnoses unless a lesson deliberately holds one explanation constant.
`docs/overseer_lines.json` is retained only as historical source provenance; it
must not be imported, tested, or edited as current tutorial copy.

| Round | Lesson | Fixture | Active instruction | First-cut follow-up | Targets |
|---|---|---|---|---|---|
| 1 | Swipe, slots, Resolve, ledger | `simple_001` | `Swipe orange targets. Pale guides mark every possible cut; Resolve submits.` | `Orange means staged. Mark every target, or Clear to remove all cuts.` | shown |
| 2 | Falling token IDs | `simple_002` | `Repeat the orange route. Resolve splits text; exact tokens fall with IDs.` | `Finish the orange route. After Resolve, watch exact token pieces fall.` | shown |
| 3 | Clear before Resolve | `simple_010` | `Stage the orange route. Clear removes all cuts; Resolve sends what remains.` | `Cuts stay provisional until Resolve. Clear removes the whole staged route.` | shown |
| 4 | Leading spaces | `chaos_005` | `The next token includes its leading space. Cut before the gap, not after it.` | `One gap guide marks this boundary. Clear if your cut landed elsewhere.` | shown |
| 5 | Tokens are not words | `punct_002` | `Orange answers are gone. 're-enter' looks whole, but it may split.` | `Every pale guide accepts a cut. Use earlier evidence, then Resolve.` | hidden |
| 6 | Contractions | `punct_001` | `Apostrophes do not define tokens. Find the learned contraction chunks.` | `Check the apostrophe and final period; either may sit beside a boundary.` | hidden |
| 7 | Punctuation clusters | `punct_004` | `Punctuation can be a complete token. Inspect the ellipsis and question mark.` | `Some marks stay together; others separate. Stage the route, then Resolve.` | hidden |
| 8 | Dense strings | `dense_001` | `URLs reuse learned fragments. Look around letters, dots, and slashes.` | `Punctuation may stay attached to letters. Cut learned chunks, not symbols.` | hidden |
| 9 | Numbers and symbols | `punct_003` | `Prices are learned fragments too. Currency and decimal notation may split.` | `The dollar sign, digit groups, and decimal point may begin or end chunks.` | hidden |
| 10 | Qualification | `simple_014` | `Final sample. Submit the route you would trust without orange answers.` | `Resolve when ready. The full ten-round audit decides access to Training.` | hidden |

Round one explains `OK`, `MISS`, `FALSE`, and the ledger at their first review.
Round two uses this outcome-independent review line:

`WIENER: Falling numbers are Standard Protocol vocabulary IDs. They identify complete tokens, not points.`

The implementation-specific encoding name remains available in Token Log and
fixture metadata. Round five must continue to use the verified split
`re | -enter |  the |  room`; do not substitute a word-aligned fixture while
retaining token-not-word instruction.

Numerical evidence rules:

- **falling complete token:** `ID {id}`
- **Token Log mapping:** `cl100k_base IDs: <{token}>->{id}`
- Use the `␠` marker for spaces inside displayed token chunks.
- Do not display IDs in the feedback card or on incorrect submitted fragments.
- Do not describe an ID as a score, Token Credit value, rank, rarity, confidence, or meaning.
- Round ten review remains qualification-neutral. Only the aggregate completion
  screen may grant or deny access to Training.

## Tutorial completion

### Tutorial cleared

- **title:** `Tutorial Cleared`
- **summary:** `Qualification approved. WienerWorks permits you to begin Machine Replacement Training. Production speed remains theoretical.`
- **primary_action:** `Start Training`
- **secondary_action:** `Return to Menu`

### Tutorial failed

- **title:** `Tutorial Failed`
- **summary_template:** `Boundary accuracy: {floored_accuracy}%. Readiness requires 70%. {correction} Qualification denied. Payroll remains unconvinced.`
- **missed_dominant_correction:** `Focus: recover missed boundaries.`
- **false_dominant_correction:** `Focus: remove false cuts.`
- **tied_correction:** `Focus: missed boundaries and false cuts.`
- **missing_audit_correction:** `Review the boundary evidence.`
- **primary_action:** `Retry Tutorial`
- **secondary_action:** `Return to Menu`

`floored_accuracy` is the whole-number floor of the same cut-audit score used for
readiness. A failing score must never display as `70%`; when a complete cut audit
is unavailable, use normalized aggregate accuracy and the missing-audit
correction.

## Training intro

### First live round

`Production queue opened. Hints reduced. Timer active. Your 40 TC account is now exposed to your decisions.`

### Standard live prompt comments

- `Token boundaries drive the bill. Cut the edge the tokenizer makes, not the sentence's mood.`
- `The prompt is short. Do not become theatrical.`
- `Wiener has supplied text. The rest is your liability.`
- `Observe the slots. Submit only the useful ones.`
- `This route rewards accuracy, which is inconvenient but measurable.`
- `The tokenizer has already decided. You are guessing backward from the invoice.`

### Timer low

- `Time is not waiting. It has read the margin report.`
- `Resolve soon or let the browser resolve your hesitation.`
- `Delay is not a strategy. It is a cost center with posture.`
- `The timer is doing what management used to call leadership.`

### Token Credits low

- `TC balance fragile. Reduce interpretation immediately.`
- `Your usefulness is approaching a documented threshold.`
- `Wiener recommends accuracy. The recommendation has been made before.`
- `One more rework-heavy theory may close the shift.`
- `The browser has begun saving the termination copy.`

## Feedback copy

### Technical labels

- **clean:** `Clean segmentation.`
- **missed:** `Expected boundary missed.`
- **false_cut:** `False boundary submitted.`
- **overcut:** `Over-segmentation increased token load.`
- **spacing:** `Space-bearing token boundary mishandled.`
- **subword:** `Subword boundary mishandled.`
- **punctuation:** `Punctuation boundary mishandled.`
- **contraction:** `Contraction boundary mishandled.`
- **number_symbol:** `Number or symbol boundary mishandled.`
- **dense:** `Dense string fragmentation mishandled.`
- **timeout:** `Timer expired. Browser resolved the remaining liability.`

### Feedback receipt format

`RESOLVED TOKENS                                      {count}`

`{token} │ {token} │ {token}`

`TOKEN CREDIT LEDGER`

`VERIFIED +{verified} TC   REWORK -{rework} TC`

`NET {net} TC`

`OK {correct}          MISS {missed}          FALSE {false}`

The HUD remains the Token Credit authority. The receipt does not repeat credits or
the token count in its cut-audit row. Only `NET` receives gain/loss color.

### Good reactions

- `Correct. Suspiciously so.`
- `The boundary survived contact with biology.`
- `Acceptable. Wiener has informed the remaining optimistic subsystem.`
- `Useful cuts. Minimal ceremony. An underrated combination.`
- `Clean enough for the ledger to remain quiet.`
- `The route tolerated you.`

### Missed-boundary reactions

- `A boundary passed by untouched. Very peaceful. Very wrong.`
- `You let the token edge escape. It has already invoiced us.`
- `The model noticed. Your Token Credits did too.`
- `A missing cut is still a decision. Wiener dislikes the poetry of that.`
- `The edge existed. Your confidence did not help it appear.`

### False-cut reactions

- `A bold cut. The ledger has opinions.`
- `That was not a boundary. It is now rework.`
- `You opened a seam where the tokenizer had not filed one.`
- `False boundary recorded. The browser admires the confidence and rejects the work.`
- `The system asked for prediction, not decorative incision.`

### Overcut reactions

- `You appear to be solving uncertainty with vandalism.`
- `More cuts. Expensive, but emotionally clear.`
- `The system requested boundaries, not enthusiasm.`
- `You have mistaken activity for precision. A very human compression failure.`
- `Overcutting makes the browser nostalgic for automation.`

### Dense-string reactions

- `Infrastructure strings do not forgive prose habits.`
- `The URL was not one object. It was a committee.`
- `Dots and slashes have departments. You met several.`
- `Dense strings are where confidence goes to become rework.`
- `Machine text fragmented. This was not betrayal. It was policy.`

### Space reactions

- `One boundary was enough. The visible gap stayed with the next chunk.`
- `A space-bearing token is still one token. The browser has made this everyone’s problem.`
- `Blankness is not absence. Tokenizers learned this before management did.`
- `The visible gap belonged to the chunk after it. Payroll accepts this, somehow.`
- `The leading-space chunk was handled correctly. Please do not become proud of compliance.`

## Results copy

### Token Credits depleted

- **title:** `Token Credits Depleted`
- **summary:** `Your account no longer contains enough Token Credits to correct your output. Training access revoked.`

### Training suspended

- **title:** `Training Suspended`
- **summary:** `Session closed by operator request. WienerWorks preserved the usable portion and most of the causes.`

### Result ledger headings

- **rounds:** `Rounds`
- **accuracy:** `Accuracy`
- **cuts:** `Cuts`
- **verified:** `Verified`
- **rework:** `Rework`
- **net:** `Net Credits`
- **credits:** `Credits Remaining`
- **efficiency:** `Yield Efficiency`
- **rank:** `Rank`
- **best:** `Best Saved`

### Result actions

- **review_token_log:** `Review Token Log`
- **run_again:** `Run Training Again`
- **return_to_menu:** `Return to Menu`

### Best-record persistence states

#### Saved or prior best kept

Successful saves and retained prior records keep the existing copy unchanged.

- **full:** `Best saved: {rounds} rounds / {rank}`
- **compact:** `Best {rounds}r / {rank}`

#### Save failed with a prior saved best

- **full:**
  - `Best achieved: {achieved_rounds} rounds / {achieved_rank}`
  - `Best saved: {saved_rounds} rounds / {saved_rank}`
  - `New best was not saved on this device.`
- **compact:**
  - `Best achieved {achieved_rounds}r / {achieved_rank}`
  - `Best saved {saved_rounds}r / {saved_rank}`
  - `New best was not saved on this device.`

#### First save failed

- **full:**
  - `Best achieved: {achieved_rounds} rounds / {achieved_rank}`
  - `Best saved: none yet`
  - `New best was not saved on this device.`
- **compact:**
  - `Best achieved {achieved_rounds}r / {achieved_rank}`
  - `Best saved: none yet`
  - `New best was not saved on this device.`

#### No save attempted and no prior record

- `Best saved: none yet`

Never describe an unsaved achieved record as saved. Failure-only output may add
lines; successful compact output remains seven lines.

## Rank copy

- **rank_0:** `Regex Intern`
- **rank_1:** `Junior Boundary Clerk`
- **rank_2:** `Prompt Intake Associate`
- **rank_3:** `Token Ledger Coordinator`
- **rank_4:** `Whitespace Compliance Officer`
- **rank_5:** `Merge Table Liaison`
- **rank_6:** `Vocabulary Registry Officer`
- **rank_7:** `Senior Sequence Administrator`
- **rank_8:** `Acting Automation Supervisor`
- **rank_9:** `Interim Replacement Director`
- **rank_10:** `Artificial Intelligence`

## System and fault copy

- **missing_record_title:** `Record Unavailable`
- **missing_record_body:** `A required text record failed to load. Continue under fallback supervision while the defect is archived.`
- **restricted_fixture_title:** `Fixture Restricted`
- **restricted_fixture_body:** `The selected example exceeds current display-safe boundary rules and has been replaced.`
- **mute_toast_on:** `Audio output enabled.`
- **mute_toast_off:** `Audio output disabled. Silence now reflects policy.`
- **fixture_mapping_warning:** `Fixture boundary display rejected. Unicode risk exceeded current slot projection.`
- **tokenizer_missing:** `Tokenizer fixture unavailable. Wiener has substituted a safer humiliation.`

## Edge-case appendix for future routes

The current live tutorial should stay biased toward display-safe ASCII and ordinary punctuation.

Reserve a later advanced route for:
- smart quotes
- em dashes and en dashes
- emoji
- mixed-script strings
- combining marks
- zero-width joiners
- right-to-left text
- grapheme clusters whose visible boundaries do not map neatly to displayed cut slots

These examples should exist in content planning, but remain gated until the UI can project real tokenizer boundaries cleanly. If a token boundary cannot be shown as one unambiguous slice slot, it does not belong in the live tutorial yet.
