# Economy Tuning Audit

Status: locally bracketed, externally unproven.

This audit records the deterministic economy envelope used before real tester
sessions. It is not evidence that players understand the economy. It only proves
that the current scoring, fixture order, and difficulty ramp create a playable
pressure curve for representative strategies.

## Strategy Envelope

All scenarios start with the production Training account of `40 TC`, use the
deterministic fixture picker with highest-tier preference, and apply the same
round penalty scale used by the game.

| Strategy | Local result | Design implication |
| --- | --- | --- |
| No play: make no cuts | Credits deplete around round 7 | Inaction is punished, but the first few rounds remain observable for a confused tester. |
| Overcut: cut every legal slot | Credits deplete around round 2 | Guessing everywhere creates invalid tokens and false-fragment rework rather than a viable brute-force tactic. |
| Half-complete: cut roughly half the true boundaries | Credits deplete around round 14 | Partial competence survives into the dense-string ramp, then becomes increasingly fragile. |
| Near-perfect: miss one true boundary per round | Credits reach tier four and deplete around round 17 | Small repeated mistakes are survivable but consequential. |
| Intermittent: mostly correct with regular empty/partial rounds | Credits deplete around round 35 | Clean rounds buy time but do not subsidize repeated abandonment indefinitely. |
| Perfect: cut every true boundary | A 200-round sample remains solvent | Mastery is rewarded; each exact token earns one credit and produces no rework. |

## Principle Check

- Top game design: the economy separates doing nothing, guessing everywhere,
  partial competence, near mastery, and mastery.
- Critical/conceptual play: false and missed boundaries become institutional
  rework, so the training fiction operates through rules instead of copy alone.
- Emotional design: recovery is possible round by round, but repeated small
  errors accumulate into visible Token Credit pressure.
- Game feel: the economy depends on the same boundary model as swipe scoring;
  the player is not judged by a hidden secondary target.
- Visual display: review feedback files verified credits, rework, net credits,
  and the cut audit in the same vocabulary used by the result ledger.

## Remaining Proof

Real sessions still need to show whether testers can explain that exact tokens
earn verified credits, damaged tokens and false fragments create rework,
verified minus rework produces net credits, and depletion closes Training.
