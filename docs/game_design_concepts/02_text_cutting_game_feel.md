# Concept 02 - Text Cutting Game Feel

Draws on: Swink input, response, polish, metaphor, and rules metrics.

## Design Claim

The swipe is the game. If the swipe feels late, vague, or disconnected from the
review state, the educational claim collapses because the player cannot trust
the boundary evidence.

## Implementation Guidance

- Register cuts during pointer movement.
- Leave a short-lived trail for gesture continuity.
- Preserve registered cut markers until resolution.
- Snap to grapheme boundary slots with consistent tolerance.
- Preview a nearby legal slot before it enters the actual snap threshold, so
  touch users get aim feedback without changing accepted cuts.
- Keep touch aim feedback clear of the pointer and expose the clearance as
  evidence, because a loupe that sits under the finger does not solve the
  input-readability problem.
- When viewport edges would clamp the loupe under the finger, move it to the
  next safe side or below the text before accepting a low-clearance placement.
- Treat short local swipes over two adjacent dense slots as one intended cut at
  the release-side slot; preserve multi-cut staging for longer sweeps. This
  keeps corrective gestures accountable without making broad swipes feel inert.
- Give broad multi-boundary swipes their own brief response badge, so a player
  who intentionally chains several cuts sees the gesture acknowledged as a
  single controlled action rather than several disconnected snaps.
- Add a short fading rail under newly chained cut markers, tying the broad swipe
  path to the actual staged boundaries without creating new scoring evidence.
- Use different resolved marker colors and labels for correct, missed, and false
  cuts.
- When the economy resolves, make the consequence felt immediately: pulse the
  affected HUD fields and show a short signed net tag, without changing the
  underlying scoring economics.
- Keep Resolve visibly actionable during active play even when no cuts are
  staged. A zero-cut resolve is still a player commitment and should score as
  missed tokenizer boundaries, not masquerade as an unavailable control.
- As the timer enters the deadline window, let the Resolve control share the
  warning pressure even when zero cuts are staged. The label should stay
  `Resolve`; the pressure is urgency feedback, not proof that the answer is
  correct or complete.
- In review, keep the actual-tokenization evidence tied to the player's agency:
  show submitted cuts plus OK/missed/false audit counts before the token chips,
  so the physical swipe record and the tokenizer truth are legible together.
- When a new static prompt becomes playable, give it a brief acquisition beat:
  bracket the live text and sweep the baseline for less than half a second.
  This replaces scrolling motion as the "now act" signal without moving the
  target or changing the timer.
- Keep mouse and touch paths on the same logic.
- Expose input-response metrics in QA and copied summaries: samples per
  gesture, first-cut latency, release-sample cuts, correction cuts, final cut
  ownership, resolve commit count, no-cut acknowledgements split into near-slot
  aim misses and off-slot swipes, plus resolve-after-first-cut and
  resolve-after-last-cut timing. For touch-like input, also expose touch-loupe
  samples, snap-ready samples, unsafe-clearance samples, and minimum pointer
  clearance. For chained swipes, expose the latest cut-batch size so
  broad-gesture ownership can be audited without changing scoring. Game feel has
  to be visible as timing and readability evidence, not only as screenshots.

## Example In-Game Expression

- A swipe crossing the gap after `can` immediately places a marker.
- A drag near the gap after `can` shows a faint armed-slot marker before the
  cut is close enough to stage.
- On compact or touch-like input, the loupe mirrors the candidate boundary away
  from the finger. Near the top edge it relocates below the text if the normal
  above-text placement would fall under the pointer.
- Pressing Clear removes all current markers and updates the cut count.
- Pressing Resolve with no staged markers commits a zero-cut answer; the button
  stays visually active, while the stronger numbered ready state appears only
  after cuts are staged. The commit beat should say `NO CUTS` rather than
  exposing an internal-looking zero count.
- During active play, the cut-status chip should also say `NO CUTS` before the
  first staged boundary instead of exposing `STAGED: 0`.
- A fast sweep across several real boundaries shows a short `CHAINED` response
  badge and a fading rail under the newly staged markers, while the staged-cut
  count still records the actual number of cuts.
- On resolution, the player's marker either flashes as correct or remains
  labelled false while missed truth markers appear separately.
- The HUD briefly tags the accounting impact, for example `NET +$4.75` over pay
  or `NET -$2.10` over cost, while the balance field pulses.
- The actual-tokenization panel names the resolved cut audit before listing
  token chips.
- A new prompt briefly flashes `ROUTE LIVE` or `TUTORIAL LIVE` with corner
  brackets around the text, then disappears before the first cut feedback has
  to compete for attention.

## Playtest Questions

- Did any player say "I swiped there" while the game disagreed?
- Are false cuts caused by misunderstanding rather than input imprecision?
- Can mobile players see the text while cutting with a finger?
