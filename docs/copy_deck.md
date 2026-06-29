# WienerWorks Copy Deck

## Global chrome

- **browser_path:** `wienerworks://legacy-language-ops`
- **company_name:** `WienerWorks`
- **product_name:** `Manual Tokenization Training`
- **division_name:** `Human Segmentation Division`
- **browser_badge:** `2026 AI browser / retained for cost recovery`
- **status_badge:** `legacy language operations shell`
- **mode_badge_tutorial:** `guided compliance route`
- **mode_badge_endless:** `paid shift simulation`

## Main menu

### Heading stack

- **kicker:** `Welcome to WienerWorks`
- **title:** `Manual Tokenization Training`
- **subtitle:** `Human Segmentation Division`

### Body copy

`Large-model inference exceeded acceptable margin on this route. WienerWorks now trains human operators to predict token boundaries inside a retained legacy browser. Accuracy extends the shift. Error feeds recovery.`

### Supporting copy

- `Predict learned token boundaries.`
- `Swipe through legal slice slots.`
- `Useful cuts earn pay.`
- `Misses and false cuts create company cost.`
- `Shift closes at zero balance.`

### Buttons

- **tutorial:** `Begin Tutorial`
- **training:** `Endless Training`
- **sound_on:** `Sound: On`
- **sound_off:** `Sound: Off`

### Best record labels

- **best_label:** `Best Record`
- **rank_label:** `Rank`
- **rounds_label:** `Rounds Cleared`

## HUD and play chrome

- **balance:** `BALANCE`
- **pay:** `PAY`
- **cost:** `COST`
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

- **slot:** a legal place where the player may cut
- **cut:** a boundary guess submitted by the player
- **staged cut:** a cut currently marked before Resolve
- **correct cut:** a player cut that matches the tokenizer boundary
- **missed boundary:** a tokenizer boundary the player did not cut
- **false cut:** a player cut where the tokenizer did not split
- **token:** a chunk produced by the tokenizer
- **token strip:** the revealed list of token chunks after Resolve
- **pay:** money earned from useful cuts
- **cost:** company loss from misses, false cuts, and token load
- **net:** pay minus company cost
- **balance:** the remaining shift budget; zero ends the run

Avoid during tutorial:
- `word break`
- `grammar split`
- `sentence split`
- `space split`
- `meaning unit`
- `reassemble`

Preferred phrasing:
- `token boundary`
- `legal slot`
- `staged cut`
- `token chunk`
- `token strip`
- `boundary audit`
- `company cost`

## Visual teaching language

The tutorial should explicitly name what the player sees on screen.

- **blue verticals:** `legal slots`
- **orange verticals:** `staged cuts` or `training targets`, depending on mode
- **OK label:** `correct cut`
- **MISS label:** `boundary you missed`
- **FALSE label:** `cut where the tokenizer did not split`
- **token strip:** `the actual token chunks sent forward`
- **feedback card:** `technical diagnosis and ledger result`
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
2. show or imply the pale legal slot guides
3. give one short instruction from Wiener
4. let the player stage cuts
5. allow Clear before Resolve
6. reveal OK / MISS / FALSE labels after Resolve
7. show the token strip
8. show pay, cost, net, and boundary audit
9. advance through Continue

The tutorial should teach while the player is interacting, not through detached memo cards.

Use `chaos_005` for the spaces round in this copy pass. Older notes that say
`spacing_001` describe the intended concept, not a fixture rename.

## Tutorial route

---

# Round one

## Slot guides

- **fixture_id:** `simple_001`
- **example_text:** `the cat sat on the mat`
- **title:** `Slot guides`
- **teaching_point:** `Learn legal cut positions before guessing token boundaries.`
- **show_slot_hints:** `true`
- **show_target_hints:** `true`

### Active line

`Swipe targets; pale guides mark slots; Resolve submits.`

---

# Round two

## Review labels

- **fixture_id:** `simple_002`
- **example_text:** `how many dogs are there`
- **title:** `Review labels`
- **teaching_point:** `Connect staged cuts to OK, MISS, FALSE, and the token strip.`
- **show_slot_hints:** `true`
- **show_target_hints:** `true`

### Active line

`Swipe targets; Resolve shows OK, MISS, FALSE, and strip.`

---

# Round three

## Clear before Resolve

- **fixture_id:** `simple_010`
- **example_text:** `draw the boundary line`
- **title:** `Clear before Resolve`
- **teaching_point:** `Learn that staged cuts are reversible until review.`
- **show_slot_hints:** `true`
- **show_target_hints:** `true`

### Active line

`Stage cuts; Clear removes them before Resolve records.`

---

# Round four

## Spaces attach

- **fixture_id:** `chaos_005`
- **example_text:** `spaces matter`
- **title:** `Spaces attach`
- **teaching_point:** `A visible gap can belong to the token that follows it.`
- **show_slot_hints:** `true`
- **show_target_hints:** `true`

### Active line

`One target; cut before the gap, not after it.`

---

# Round five

## Words versus tokens

- **fixture_id:** `simple_007`
- **example_text:** `tokens hide in plain sight`
- **title:** `Words versus tokens`
- **teaching_point:** `Separate readable words from tokenizer chunks.`
- **show_slot_hints:** `true`
- **show_target_hints:** `false`

### Active line

`No orange answers; use pale guides and token strip.`

---

# Round six

## Contractions

- **fixture_id:** `punct_001`
- **example_text:** `I can't believe it.`
- **title:** `Contractions`
- **teaching_point:** `Apostrophes and final marks may split away from trusted words.`
- **show_slot_hints:** `true`
- **show_target_hints:** `false`

### Active line

`Contractions split; watch apostrophe and final period.`

---

# Round seven

## Punctuation clusters

- **fixture_id:** `punct_004`
- **example_text:** `wait... what?`
- **title:** `Punctuation clusters`
- **teaching_point:** `Punctuation clusters can become their own chunks.`
- **show_slot_hints:** `true`
- **show_target_hints:** `false`

### Active line

`Punctuation splits; ellipses, question marks count.`

---

# Round eight

## Dense strings

- **fixture_id:** `dense_001`
- **example_text:** `openai.com/pricing`
- **title:** `Dense strings`
- **teaching_point:** `URLs and code-like strings fracture quickly.`
- **show_slot_hints:** `true`
- **show_target_hints:** `false`

### Active line

`URLs fragment; dots and slashes can be boundaries.`

---

# Round nine

## Numbers and symbols

- **fixture_id:** `punct_003`
- **example_text:** `it costs $19.99`
- **title:** `Numbers and symbols`
- **teaching_point:** `Currency and decimals can split into small chunks.`
- **show_slot_hints:** `true`
- **show_target_hints:** `false`

### Active line

`Currency and decimals split; use the pale guides.`

---

# Round ten

## Economy and timer

- **fixture_id:** `simple_014`
- **example_text:** `pay cost and balance`
- **title:** `Economy and timer`
- **teaching_point:** `Connect boundary accuracy to pay, cost, net, balance, and time.`
- **show_slot_hints:** `true`
- **show_target_hints:** `false`

### Active line

`Final route; correct cuts pay, mistakes create cost.`

## Tutorial completion

### Tutorial cleared

- **title:** `Tutorial Cleared`
- **summary:** `Training threshold met. WienerWorks now considers you safe enough for live cost exposure. This should not be confused with trust.`
- **primary_action:** `Start Endless Training`
- **secondary_action:** `Return to Menu`

### Tutorial failed

- **title:** `Tutorial Failed`
- **summary:** `Boundary accuracy stayed below the readiness threshold. Retry the tutorial before the mistakes become payroll events. Wiener has preserved the evidence, unnecessarily well.`
- **primary_action:** `Retry Tutorial`
- **secondary_action:** `Return to Menu`

### Optional softer failure title

If “Tutorial Failed” feels too punitive for first-time learning, use:

- **title:** `Readiness Not Met`
- **summary:** `Boundary accuracy stayed below the readiness threshold. Repeat the route. This is not failure. It is cheaper failure rehearsal.`

## Endless training intro

### First live round

`Paid shift simulation opened. Hints reduced. Timer active. The balance begins above zero, a condition traditionally known as temporary.`

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

### Balance low

- `Balance low. Finance is no longer pretending this is training.`
- `Your usefulness is approaching a documented threshold.`
- `Wiener recommends accuracy. The recommendation has been made before.`
- `One more expensive theory may close the shift.`
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

### Economy line format

`Pay {pay} - Cost {cost} = Net {net}`

### Audit line format

`Boundary audit: OK {correct} / Missed {missed} / False {false} / Tokens {tokens} / Balance {balance} / Cost drivers: {drivers}`

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
- `The model noticed. It had budget for that, briefly.`
- `A missing cut is still a decision. Wiener dislikes the poetry of that.`
- `The edge existed. Your confidence did not help it appear.`

### False-cut reactions

- `A bold cut. The ledger has opinions.`
- `That was not a boundary. It is now a cost.`
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
- `Dense strings are where confidence goes to become cost.`
- `Machine text fragmented. This was not betrayal. It was policy.`

### Space reactions

- `One boundary was enough. The visible gap stayed with the next chunk.`
- `A space-bearing token is still one token. The browser has made this everyone’s problem.`
- `Blankness is not absence. Tokenizers learned this before management did.`
- `The visible gap belonged to the chunk after it. Payroll accepts this, somehow.`
- `The leading-space chunk was handled correctly. Please do not become proud of compliance.`

## Results copy

### Budget exhausted

- **title:** `Budget Exhausted`
- **summary:** `Your balance reached zero. Finance has closed the segmentation window and archived the loss. Wiener thanks you for demonstrating why automation was once attractive.`

### Training suspended

- **title:** `Training Suspended`
- **summary:** `Session closed by operator request. WienerWorks preserved the usable portion and most of the causes.`

### Result ledger headings

- **rounds:** `Rounds`
- **accuracy:** `Accuracy`
- **cuts:** `Cuts`
- **pay:** `Pay Earned`
- **cost:** `Company Cost`
- **net:** `Net`
- **balance:** `Balance Recorded`
- **efficiency:** `Efficiency`
- **rank:** `Rank`
- **best:** `Best Saved`

## Rank copy

- **rank_0:** `Regex Intern`
- **rank_1:** `Junior Boundary Clerk`
- **rank_2:** `Prompt Intake Associate`
- **rank_3:** `Space-Bearing Apprentice`
- **rank_4:** `BPE Adjacent`
- **rank_5:** `clerk_200k_base`
- **rank_6:** `Token Liability Handler`
- **rank_7:** `Economically Defensible Mammal`
- **rank_8:** `Temporary Sequence Specialist`

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
